// app/api/admin-apis/subscribers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000;

// ── MRR calculation (Option B — from payments in last 30 days)
async function getZidwellStats() {
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  // Active subscribers
  const { count: activeSubs } = await supabaseAdmin
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // New this month
  const { count: newThisMonth } = await supabaseAdmin
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .gte("started_at", thisMonthStart.toISOString());

  // Cancelled this month
  const { count: cancelledThisMonth } = await supabaseAdmin
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "cancelled")
    .gte("cancelled_at", thisMonthStart.toISOString());

  // Churn rate (cancelled this month / active at start of month)
  const churnRate =
    (activeSubs ?? 0) > 0
      ? Number(
          (((cancelledThisMonth ?? 0) / (activeSubs ?? 1)) * 100).toFixed(2)
        )
      : 0;

  // MRR (from successful payments last 30 days)
  const { data: paymentsLast30 } = await supabaseAdmin
    .from("subscription_payments")
    .select("amount, status")
    .gte("created_at", thirtyDaysAgo)
    .in("status", ["success", "paid", "completed"]);

  const mrr30d = (paymentsLast30 ?? []).reduce(
    (s: number, p: any) => s + (Number(p.amount) || 0),
    0
  );

  // Failed payments (last 30d)
  const { count: failedPayments } = await supabaseAdmin
    .from("subscription_payments")
    .select("*", { count: "exact", head: true })
    .eq("status", "failed")
    .gte("created_at", thirtyDaysAgo);

  return {
    activeSubscribers: activeSubs ?? 0,
    newThisMonth: newThisMonth ?? 0,
    churnedThisMonth: cancelledThisMonth ?? 0,
    churnRate,
    mrr30d,
    arrEstimate: mrr30d * 12,
    failedPayments: failedPayments ?? 0,
  };
}

async function getZidstoreStats() {
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const { count: activeSubs } = await supabaseAdmin
    .from("zidstore_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { count: newThisMonth } = await supabaseAdmin
    .from("zidstore_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .gte("started_at", thisMonthStart.toISOString());

  const { count: cancelledThisMonth } = await supabaseAdmin
    .from("zidstore_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "cancelled")
    .gte("cancelled_at", thisMonthStart.toISOString());

  const churnRate =
    (activeSubs ?? 0) > 0
      ? Number(
          (((cancelledThisMonth ?? 0) / (activeSubs ?? 1)) * 100).toFixed(2)
        )
      : 0;

  const { data: paymentsLast30 } = await supabaseAdmin
    .from("zidstore_subscription_payments")
    .select("amount, status")
    .gte("created_at", thirtyDaysAgo)
    .in("status", ["success"]);

  const mrr30d = (paymentsLast30 ?? []).reduce(
    (s: number, p: any) => s + (Number(p.amount) || 0),
    0
  );

  const { count: failedPayments } = await supabaseAdmin
    .from("zidstore_subscription_payments")
    .select("*", { count: "exact", head: true })
    .eq("status", "failed")
    .gte("created_at", thirtyDaysAgo);

  return {
    activeSubscribers: activeSubs ?? 0,
    newThisMonth: newThisMonth ?? 0,
    churnedThisMonth: cancelledThisMonth ?? 0,
    churnRate,
    mrr30d,
    arrEstimate: mrr30d * 12,
    failedPayments: failedPayments ?? 0,
  };
}

export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "finance_admin", "operations_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const cacheKey = "subscribers_combined";
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ ...cached.data, _fromCache: true });
    }

    const [zidwell, zidstore] = await Promise.all([
      getZidwellStats(),
      getZidstoreStats(),
    ]);

    const response = { zidwell, zidstore };

    cache.set(cacheKey, { data: response, timestamp: Date.now() });
    return NextResponse.json(response);
  } catch (err: any) {
    console.error("Subscribers combined route error:", err);
    return NextResponse.json(
      { error: "Failed to load subscribers summary" },
      { status: 500 }
    );
  }
}
