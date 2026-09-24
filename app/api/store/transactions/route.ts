// app/api/store/transactions/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Pending payments older than this are shown as "cancelled". */
const CANCEL_AFTER_MS = 60 * 60 * 1000; // 1 hour

type DisplayStatus =
  | "completed"
  | "ongoing"
  | "pending"
  | "cancelled"
  | "failed"
  | "refunded";

/**
 * Derive a user-facing status from the DB row.
 *
 *   refunded → Refunded
 *   failed → Failed
 *   completed + installment still running → Ongoing
 *   completed → Completed
 *   pending older than CANCEL_AFTER_MS with no paid_at → Cancelled
 *   pending → Pending
 */
function deriveDisplayStatus(p: any): {
  displayStatus: DisplayStatus;
  displayLabel: string;
} {
  const status = String(p.status || "").toLowerCase();
  const type = String(p.payment_type || "full").toLowerCase();
  const installStatus = String(p.installment_status || "").toLowerCase();

  if (status === "refunded") {
    return { displayStatus: "refunded", displayLabel: "Refunded" };
  }
  if (status === "failed") {
    return { displayStatus: "failed", displayLabel: "Failed" };
  }

  if (status === "completed") {
    if (type === "installment") {
      const num = Number(p.installment_number) || 1;
      const total = Number(p.total_installments) || 1;
      if (total > 1 && num < total && installStatus !== "completed") {
        return { displayStatus: "ongoing", displayLabel: "Ongoing" };
      }
    }
    return { displayStatus: "completed", displayLabel: "Completed" };
  }

  const createdAt = p.created_at ? new Date(p.created_at).getTime() : 0;
  const isStale = createdAt > 0 && Date.now() - createdAt > CANCEL_AFTER_MS;
  if (isStale && !p.paid_at) {
    return { displayStatus: "cancelled", displayLabel: "Cancelled" };
  }
  return { displayStatus: "pending", displayLabel: "Pending" };
}

export async function GET(request: Request) {
  try {
    const { user } = await isAuthenticatedWithRefresh(request as any);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search")?.trim().toLowerCase();
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

    const { data: store, error: storeError } = await supabase
      .from("online_stores")
      .select("id, slug")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // "ongoing" and "cancelled" are derived — filter after mapping.
    const isDerivedOnlyFilter =
      status === "ongoing" || status === "cancelled";

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
        total_amount,
        installment_number,
        total_installments,
        installment_status,
        next_installment_due,
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

    if (status && status !== "all" && !isDerivedOnlyFilter) {
      query = query.eq("status", status);
    }

    if (type === "installment") {
      query = query.eq("payment_type", "installment");
    } else if (type === "full") {
      query = query.eq("payment_type", "full");
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

    let transactions = (payments || []).map((p: any) => {
      const derived = deriveDisplayStatus(p);

      const isInstallment = p.payment_type === "installment";
      const instNum = Number(p.installment_number) || (isInstallment ? 1 : 0);
      const instTotal =
        Number(p.total_installments) ||
        (isInstallment && p.metadata?.installment_plan?.installmentCount
          ? Number(p.metadata.installment_plan.installmentCount)
          : 0);

      const planTotal =
        Number(p.total_amount) ||
        Number(p.metadata?.installment_plan?.totalAmount) ||
        Number(p.metadata?.totalAmount) ||
        0;

      return {
        id: p.id,
        amount: Number(p.amount) || 0,
        fee: Number(p.fee) || 0,
        netAmount: Number(p.net_amount) || 0,

        status: p.status,
        displayStatus: derived.displayStatus,
        displayLabel: derived.displayLabel,

        customerName: p.customer_name,
        customerEmail: p.customer_email,
        customerPhone: p.customer_phone,

        paymentMethod: p.payment_method,
        paymentType: p.payment_type || "full",
        isInstallment,
        orderReference: p.order_reference,
        nombaTransactionId: p.nomba_transaction_id,

        paidAt: p.paid_at,
        confirmedAt: p.confirmed_at,
        createdAt: p.created_at,

        installmentNumber: isInstallment ? instNum : null,
        totalInstallments: isInstallment ? instTotal : null,
        installmentStatus: p.installment_status,
        nextInstallmentDue: p.next_installment_due,
        planTotalAmount: isInstallment ? planTotal : null,
        planProgress:
          isInstallment && instTotal > 0
            ? {
                current: instNum,
                total: instTotal,
                percent: Math.min(
                  100,
                  Math.round((instNum / instTotal) * 100)
                ),
              }
            : null,

        studentName: p.student_name,
        selectedStudents: p.selected_students || [],

        pageTitle: p.payment_pages?.title || "Payment",
        pageSlug: p.payment_pages?.slug || "",
        pageType: p.payment_pages?.page_type || "",
        pageId: p.payment_page_id,

        metadata: p.metadata || {},
      };
    });

    if (isDerivedOnlyFilter) {
      transactions = transactions.filter((t) => t.displayStatus === status);
    }

    // ─────────────────────────────────────────────────────────────
    // Metrics pulled from the FULL set, not this page slice
    // ─────────────────────────────────────────────────────────────
    const { data: allStats } = await supabase
      .from("payment_page_payments")
      .select(
        "amount, status, payment_type, installment_number, total_installments, installment_status, paid_at, created_at"
      )
      .eq("user_id", user.id);

    const rows = allStats || [];

    const completed = rows.filter(
      (p: any) => String(p.status).toLowerCase() === "completed"
    );
    const completedFull = completed.filter(
      (p: any) => p.payment_type !== "installment"
    );
    const completedInstallments = completed.filter(
      (p: any) => p.payment_type === "installment"
    );

    const totalRevenue = completed.reduce(
      (s: number, p: any) => s + (Number(p.amount) || 0),
      0
    );
    const fullRevenue = completedFull.reduce(
      (s: number, p: any) => s + (Number(p.amount) || 0),
      0
    );
    const installmentRevenue = completedInstallments.reduce(
      (s: number, p: any) => s + (Number(p.amount) || 0),
      0
    );

    const avgTransaction =
      completed.length > 0 ? totalRevenue / completed.length : 0;

    const ongoingCount = completedInstallments.filter((p: any) => {
      const total = Number(p.total_installments) || 1;
      const num = Number(p.installment_number) || 1;
      const instStatus = String(p.installment_status || "").toLowerCase();
      return total > 1 && num < total && instStatus !== "completed";
    }).length;

    const cancelledCount = rows.filter((p: any) => {
      const s = String(p.status).toLowerCase();
      if (s !== "pending") return false;
      if (p.paid_at) return false;
      const created = p.created_at ? new Date(p.created_at).getTime() : 0;
      return created > 0 && Date.now() - created > CANCEL_AFTER_MS;
    }).length;

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
        totalTransactions: rows.length,
        completedTransactions: completed.length,
        fullCompleted: completedFull.length,
        installmentCompleted: completedInstallments.length,
        ongoingInstallments: ongoingCount,
        cancelledTransactions: cancelledCount,
        totalRevenue,
        fullRevenue,
        installmentRevenue,
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