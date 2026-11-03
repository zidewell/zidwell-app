// app/api/admin-apis/users/[id]/wallet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";
import { createAuditLog, getClientInfo } from "@/lib/audit-log";
import crypto from "crypto";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function verifyEditToken(token: string): any {
  try {
    const secret =
      process.env.ADMIN_OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const [data, sig] = token.split(".");
    if (!data || !sig) return null;
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(data)
      .digest("base64url");
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "finance_admin", "operations_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // ── Verify OTP edit token ──
    const editToken = req.headers.get("x-edit-token");
    if (!editToken) {
      return NextResponse.json(
        {
          error: "OTP verification required for wallet adjustments",
          requires_otp: true,
        },
        { status: 428 },
      );
    }

    const tokenPayload = verifyEditToken(editToken);
    if (!tokenPayload) {
      return NextResponse.json(
        { error: "Invalid or expired verification token", requires_otp: true },
        { status: 401 },
      );
    }

    const { id } = await params;
    if (tokenPayload.targetUserId !== id) {
      return NextResponse.json(
        { error: "Token does not match this user" },
        { status: 401 },
      );
    }

    const clientInfo = getClientInfo(req.headers);
    const body = await req.json();
    const { type, amount, reason } = body;

    if (!type || !["credit", "debit"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be 'credit' or 'debit'" },
        { status: 400 },
      );
    }

    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than zero" },
        { status: 400 },
      );
    }

    if (!reason?.trim()) {
      return NextResponse.json(
        { error: "Reason is required for wallet adjustments" },
        { status: 400 },
      );
    }

    // ── Load user ──
    const { data: user, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("id, email, wallet_balance")
      .eq("id", id)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentBalance = Number(user.wallet_balance) || 0;
    const newBalance =
      type === "credit" ? currentBalance + amountNum : currentBalance - amountNum;

    if (newBalance < 0) {
      return NextResponse.json(
        {
          error: `Insufficient balance. Current: ₦${currentBalance.toLocaleString()}, requested debit: ₦${amountNum.toLocaleString()}`,
        },
        { status: 400 },
      );
    }

    // ── Update balance ──
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        wallet_balance: newBalance,
        wallet_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("[wallet adjust] update failed:", updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 },
      );
    }

    // ── Create transaction record ──
    const ref = `ADMIN-${type.toUpperCase()}-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)
      .toUpperCase()}`;

    const { error: txError } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: id,
        type: type === "credit" ? "credit" : "debit",
        amount: amountNum,
        fee: 0,
        total_deduction: amountNum,
        status: "success",
        reference: ref,
        description: `Admin adjustment: ${reason}`,
        narration: `Manual ${type} by ${adminUser.email}`,
        balance_before: currentBalance,
        balance_after: newBalance,
        channel: "admin_manual",
        metadata: {
          admin_email: adminUser.email,
          admin_id: adminUser.id,
          reason,
          adjustment_type: type,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (txError) {
      console.error("[wallet adjust] transaction log failed:", txError);
      // Don't fail the whole request — balance already updated
    }

    // ── Audit log ──
    await createAuditLog({
      userId: adminUser.id,
      userEmail: adminUser.email,
      action: `wallet_${type}`,
      resourceType: "User",
      resourceId: id,
      description: `${
        type === "credit" ? "Credited" : "Debited"
      } ₦${amountNum.toLocaleString()} to/from ${user.email}: ${reason}`,
      metadata: {
        targetUserId: id,
        targetEmail: user.email,
        amount: amountNum,
        type,
        reason,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        reference: ref,
        performedBy: adminUser.email,
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    return NextResponse.json({
      ok: true,
      message: `Wallet ${type === "credit" ? "credited" : "debited"} successfully`,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      reference: ref,
    });
  } catch (err: any) {
    console.error("Wallet adjust error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
