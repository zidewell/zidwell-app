// app/api/payment-page/public/installment-account/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pageSlug, email, phone } = body;

    if (!pageSlug || typeof pageSlug !== "string") {
      return NextResponse.json(
        { error: "pageSlug is required" },
        { status: 400 }
      );
    }

    const cleanEmail =
      typeof email === "string" ? email.trim().toLowerCase() : null;
    const cleanPhone = typeof phone === "string" ? phone.trim() : null;

    if (!cleanEmail && !cleanPhone) {
      return NextResponse.json(
        { error: "Provide an email or phone number" },
        { status: 400 }
      );
    }

    const { data: page, error: pageError } = await supabase
      .from("payment_pages")
      .select("id, is_published")
      .eq("slug", pageSlug)
      .eq("is_published", true)
      .maybeSingle();

    if (pageError) {
      console.error("Page fetch error:", pageError);
      return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
    }

    if (!page) {
      return NextResponse.json(
        { error: "Payment page not found" },
        { status: 404 }
      );
    }

    let query = supabase
      .from("payment_page_installment_account")
      .select("*")
      .eq("payment_page_id", page.id);

    if (cleanEmail && cleanPhone) {
      query = query.or(
        `buyer_email.eq.${cleanEmail},buyer_phone.eq.${cleanPhone}`
      );
    } else if (cleanEmail) {
      query = query.eq("buyer_email", cleanEmail);
    } else if (cleanPhone) {
      query = query.eq("buyer_phone", cleanPhone);
    }

    const { data: account, error: accountError } = await query
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (accountError) {
      console.error("Account lookup error:", accountError);
      return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
    }

    if (!account) {
      return NextResponse.json({
        success: true,
        found: false,
        account: null,
      });
    }

    let payments: any[] = [];

    const { data: byAccountId } = await supabase
      .from("payment_page_payments")
      .select(
        "id, amount, net_amount, created_at, paid_at, installment_number, total_installments, payment_type, customer_name, customer_email, metadata"
      )
      .eq("payment_page_id", page.id)
      .eq("status", "completed")
      .eq("metadata->>installment_account_id", account.id)
      .order("created_at", { ascending: true });

    if (byAccountId && byAccountId.length > 0) {
      payments = byAccountId;
    } else {
      let fallback = supabase
        .from("payment_page_payments")
        .select(
          "id, amount, net_amount, created_at, paid_at, installment_number, total_installments, payment_type, customer_name, customer_email, metadata"
        )
        .eq("payment_page_id", page.id)
        .eq("status", "completed");

      if (cleanEmail && cleanPhone) {
        fallback = fallback.or(
          `customer_email.eq.${cleanEmail},customer_phone.eq.${cleanPhone}`
        );
      } else if (cleanEmail) {
        fallback = fallback.eq("customer_email", cleanEmail);
      } else if (cleanPhone) {
        fallback = fallback.eq("customer_phone", cleanPhone);
      }

      const { data: fallbackData } = await fallback.order("created_at", {
        ascending: true,
      });
      payments = fallbackData || [];
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
      payments,
    });
  } catch (err: any) {
    console.error("installment-account error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}