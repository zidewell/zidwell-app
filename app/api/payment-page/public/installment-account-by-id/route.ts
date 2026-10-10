// app/api/payment-page/public/installment-account-by-id/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountId } = body;

    if (!accountId || typeof accountId !== "string") {
      return NextResponse.json(
        { error: "accountId is required" },
        { status: 400 }
      );
    }

    const { data: account, error } = await supabase
      .from("payment_page_installment_account")
      .select("*")
      .eq("id", accountId)
      .maybeSingle();

    if (error) {
      console.error("Account-by-id lookup error:", error);
      return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
    }

    if (!account) {
      return NextResponse.json({
        success: true,
        found: false,
        account: null,
      });
    }

    const totalAmount = Number(account.total_amount) || 0;
    const totalPaid = Number(account.total_paid) || 0;
    const remainingAmount = Math.max(
      0,
      Number(account.remaining_amount) || totalAmount - totalPaid
    );
    const installmentCount =
      account.installment_count != null
        ? Number(account.installment_count)
        : null;
    const installmentAmount =
      account.installment_amount != null
        ? Number(account.installment_amount)
        : installmentCount && installmentCount > 0
        ? Math.round((totalAmount / installmentCount) * 100) / 100
        : null;

    const progressPercent =
      totalAmount > 0
        ? Math.min(100, Math.round((totalPaid / totalAmount) * 10000) / 100)
        : 0;

    const isComplete =
      remainingAmount <= 0 ||
      account.status === "completed" ||
      (installmentCount != null &&
        (Number(account.installments_paid) || 0) >= installmentCount);

    return NextResponse.json({
      success: true,
      found: true,
      account: {
        id: account.id,
        buyer_name: account.buyer_name,
        buyer_email: account.buyer_email,
        buyer_phone: account.buyer_phone,
        selection: account.selection || {},
        total_amount: totalAmount,
        total_paid: totalPaid,
        remaining_amount: remainingAmount,
        installment_count: installmentCount,
        installment_amount: installmentAmount,
        installment_period: account.installment_period,
        installments_paid: Number(account.installments_paid) || 0,
        progress_percent: progressPercent,
        is_complete: isComplete,
        status: account.status,
        first_paid_at: account.first_paid_at,
        last_paid_at: account.last_paid_at,
        created_at: account.created_at,
      },
    });
  } catch (err: any) {
    console.error("installment-account-by-id error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}