// app/api/admin-apis/subscribers/zidwell/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000;

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

    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const search = url.searchParams.get("search") ?? "";
    const status = url.searchParams.get("status") ?? "";

    const cacheKey = `subs_zidwell_${page}_${limit}_${search}_${status}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ ...cached.data, _fromCache: true });
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    // ── KPIs
    const [
      { count: activeSubs },
      { count: newThisMonth },
      { count: cancelledThisMonth },
      { count: failedPayments },
    ] = await Promise.all([
      supabaseAdmin
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      supabaseAdmin
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .gte("started_at", thisMonthStart.toISOString()),
      supabaseAdmin
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "cancelled")
        .gte("cancelled_at", thisMonthStart.toISOString()),
      supabaseAdmin
        .from("subscription_payments")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed")
        .gte("created_at", thirtyDaysAgo),
    ]);

    // ── MRR (last 30d payments)
    const { data: paymentsLast30 } = await supabaseAdmin
      .from("subscription_payments")
      .select("amount, status")
      .gte("created_at", thirtyDaysAgo)
      .in("status", ["success", "paid", "completed"]);
    const mrr30d = (paymentsLast30 ?? []).reduce(
      (s: number, p: any) => s + (Number(p.amount) || 0),
      0
    );

    const churnRate =
      (activeSubs ?? 0) > 0
        ? Number(
            (((cancelledThisMonth ?? 0) / (activeSubs ?? 1)) * 100).toFixed(2)
          )
        : 0;

    // ── Plan distribution
    const { data: activeSubsByTier } = await supabaseAdmin
      .from("subscriptions")
      .select("tier")
      .eq("status", "active");
    const tierMap: Record<string, number> = {};
    (activeSubsByTier ?? []).forEach((s: any) => {
      tierMap[s.tier] = (tierMap[s.tier] || 0) + 1;
    });
    const planDistribution = Object.entries(tierMap)
      .map(([tier, count]) => ({ tier, count }))
      .sort((a, b) => b.count - a.count);

    // ── Revenue trend (last 12 months, monthly sums)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const { data: allPayments } = await supabaseAdmin
      .from("subscription_payments")
      .select("amount, status, created_at")
      .gte("created_at", twelveMonthsAgo.toISOString())
      .in("status", ["success", "paid", "completed"]);

    const monthlyMap: Record<string, number> = {};
    (allPayments ?? []).forEach((p: any) => {
      const d = new Date(p.created_at);
      const key = d.toLocaleString("en-GB", {
        year: "numeric",
        month: "2-digit",
      });
      monthlyMap[key] = (monthlyMap[key] || 0) + (Number(p.amount) || 0);
    });
    const revenueTrend = Object.entries(monthlyMap)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // ── Recent subscribers (paginated)
    let subsQuery = supabaseAdmin
      .from("subscriptions")
      .select(
        "id, user_id, tier, status, started_at, expires_at, auto_renew, payment_method, created_at",
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      subsQuery = subsQuery.eq("status", status);
    }

    if (search) {
      // Search by user email — need to join. Simpler: fetch users matching search first
      const { data: matchingUsers } = await supabaseAdmin
        .from("users")
        .select("id")
        .or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
      const ids = (matchingUsers ?? []).map((u: any) => u.id);
      if (ids.length > 0) {
        subsQuery = subsQuery.in("user_id", ids);
      } else {
        subsQuery = subsQuery.eq("user_id", "00000000-0000-0000-0000-000000000000");
      }
    }

    const {
      data: subsRows,
      count: totalSubs,
      error: subsError,
    } = await subsQuery.range(from, to);

    if (subsError) throw subsError;

    // Enrich with user data
    const userIds = (subsRows ?? []).map((s: any) => s.user_id).filter(Boolean);
    let userMap: Record<string, { email: string; full_name: string }> = {};
    if (userIds.length > 0) {
      const { data: userRows } = await supabaseAdmin
        .from("users")
        .select("id, email, full_name")
        .in("id", userIds);
      (userRows ?? []).forEach((u: any) => {
        userMap[u.id] = { email: u.email, full_name: u.full_name };
      });
    }

    const recentSubscribers = (subsRows ?? []).map((s: any) => ({
      ...s,
      user_email: userMap[s.user_id]?.email ?? "—",
      user_name: userMap[s.user_id]?.full_name ?? "—",
    }));

    // ── Recent payments
    const { data: recentPayments } = await supabaseAdmin
      .from("subscription_payments")
      .select(
        "id, user_id, amount, currency, status, payment_method, reference, created_at, paid_at"
      )
      .order("created_at", { ascending: false })
      .limit(20);

    const payUserIds = (recentPayments ?? [])
      .map((p: any) => p.user_id)
      .filter(Boolean);
    let payUserMap: Record<string, string> = {};
    if (payUserIds.length > 0) {
      const { data: payUsers } = await supabaseAdmin
        .from("users")
        .select("id, email")
        .in("id", payUserIds);
      (payUsers ?? []).forEach((u: any) => {
        payUserMap[u.id] = u.email;
      });
    }

    const enrichedPayments = (recentPayments ?? []).map((p: any) => ({
      ...p,
      user_email: payUserMap[p.user_id] ?? "—",
    }));

    // ── Expiring in next 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const { data: expiringRows } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "id, user_id, tier, expires_at, auto_renew"
      )
      .eq("status", "active")
      .lte("expires_at", sevenDaysFromNow.toISOString())
      .gte("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: true })
      .limit(20);

    const expUserIds = (expiringRows ?? []).map((s: any) => s.user_id).filter(Boolean);
    let expUserMap: Record<string, string> = {};
    if (expUserIds.length > 0) {
      const { data: expUsers } = await supabaseAdmin
        .from("users")
        .select("id, email")
        .in("id", expUserIds);
      (expUsers ?? []).forEach((u: any) => {
        expUserMap[u.id] = u.email;
      });
    }
    const expiringSoon = (expiringRows ?? []).map((s: any) => ({
      ...s,
      user_email: expUserMap[s.user_id] ?? "—",
    }));

    const response = {
      kpis: {
        activeSubscribers: activeSubs ?? 0,
        mrr30d,
        arrEstimate: mrr30d * 12,
        newThisMonth: newThisMonth ?? 0,
        churnedThisMonth: cancelledThisMonth ?? 0,
        churnRate,
        failedPayments: failedPayments ?? 0,
      },
      planDistribution,
      revenueTrend,
      recentSubscribers,
      recentPayments: enrichedPayments,
      expiringSoon,
      pagination: {
        page,
        limit,
        total: totalSubs ?? 0,
        totalPages: Math.ceil((totalSubs ?? 0) / limit),
      },
    };

    cache.set(cacheKey, { data: response, timestamp: Date.now() });
    return NextResponse.json(response);
  } catch (err: any) {
    console.error("Zidwell subscribers route error:", err);
    return NextResponse.json(
      { error: "Failed to load Zidwell subscribers" },
      { status: 500 }
    );
  }
}
