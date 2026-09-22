// app/api/store/transactions/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { user } = await isAuthenticatedWithRefresh(request as any);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim().toLowerCase();
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

    // Confirm user owns a store
    const { data: store, error: storeError } = await supabase
      .from("online_stores")
      .select("id, slug")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (storeError || !store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    // Pull real payments + joined page info
    let query = supabase
      .from("payment_page_payments")
      .select(
        `
        id,
        amount,
        fee,
        net_amount,
        status,
        customer_name,
        customer_email,
        customer_phone,
        payment_method,
        payment_type,
        order_reference,
        nomba_transaction_id,
        metadata,
        paid_at,
        confirmed_at,
        created_at,
        installment_number,
        total_installments,
        student_name,
        selected_students,
        payment_page_id,
        payment_pages (
          id,
          title,
          slug,
          page_type
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,order_reference.ilike.%${search}%`
      );
    }

    const { data: payments, error, count } = await query;

    if (error) {
      console.error("Transactions fetch error:", error);
      return NextResponse.json(
        { error: "Failed to load transactions" },
        { status: 500 }
      );
    }

    const transactions = (payments || []).map((p: any) => ({
      id: p.id,
      amount: Number(p.amount) || 0,
      fee: Number(p.fee) || 0,
      netAmount: Number(p.net_amount) || 0,
      status: p.status,
      customerName: p.customer_name,
      customerEmail: p.customer_email,
      customerPhone: p.customer_phone,
      paymentMethod: p.payment_method,
      paymentType: p.payment_type,
      orderReference: p.order_reference,
      nombaTransactionId: p.nomba_transaction_id,
      paidAt: p.paid_at,
      confirmedAt: p.confirmed_at,
      createdAt: p.created_at,
      installmentNumber: p.installment_number,
      totalInstallments: p.total_installments,
      studentName: p.student_name,
      selectedStudents: p.selected_students || [],
      pageTitle: p.payment_pages?.title || "Payment",
      pageSlug: p.payment_pages?.slug || "",
      pageType: p.payment_pages?.page_type || "",
      pageId: p.payment_page_id,
      metadata: p.metadata || {},
    }));

    // Aggregate metrics from the full set (not just this page)
    const { data: allStats } = await supabase
      .from("payment_page_payments")
      .select("amount, status")
      .eq("user_id", user.id);

    const completed = (allStats || []).filter(
      (p: any) => p.status === "completed"
    );
    const totalRevenue = completed.reduce(
      (sum: number, p: any) => sum + (Number(p.amount) || 0),
      0
    );
    const totalCount = (allStats || []).length;
    const completedCount = completed.length;
    const avgTransaction = completedCount > 0 ? totalRevenue / completedCount : 0;

    return NextResponse.json({
      success: true,
      store: { id: store.id, slug: store.slug },
      transactions,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
      metrics: {
        totalTransactions: totalCount,
        completedTransactions: completedCount,
        totalRevenue,
        averageTransaction: avgTransaction,
      },
    });
  } catch (error: any) {
    console.error("Transactions route error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}