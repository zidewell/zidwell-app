// app/api/admin-apis/users/[id]/password-reset/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";
import { createAuditLog, getClientInfo } from "@/lib/audit-log";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "support_admin", "operations_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const clientInfo = getClientInfo(req.headers);
    const { id } = await params;

    const { data: user, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name")
      .eq("id", id)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ── Trigger Supabase password reset ──
    const redirectTo =
      process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`
        : "http://localhost:3000/auth/reset-password";

    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
      user.email,
      { redirectTo },
    );

    if (resetError) {
      console.error("[password reset] failed:", resetError);
      return NextResponse.json(
        { error: resetError.message },
        { status: 500 },
      );
    }

    // ── Audit log ──
    await createAuditLog({
      userId: adminUser.id,
      userEmail: adminUser.email,
      action: "send_password_reset",
      resourceType: "User",
      resourceId: id,
      description: `Sent password reset email to ${user.email}`,
      metadata: {
        targetUserId: id,
        targetEmail: user.email,
        performedBy: adminUser.email,
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    return NextResponse.json({
      ok: true,
      message: `Password reset email sent to ${user.email}`,
    });
  } catch (err: any) {
    console.error("Password reset error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
