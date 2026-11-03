// app/api/admin-apis/analytics/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 5-minute in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getRangeDates(range: string | null) {
  if (!range || range === "total") return null;
  const now = new Date();
  const start = new Date(now);
  let end = new Date(now);

  switch (range) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "week": {
      const day = now.getDay();
      const diffToMonday = (day + 6) % 7;
      start.setDate(now.getDate() - diffToMonday);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setMonth(start.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
    case "90days":
      start.setDate(now.getDate() - 90);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "180days":
      start.setDate(now.getDate() - 180);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setFullYear(start.getFullYear() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      return null;
  }
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin", "support_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const range = url.searchParams.get("range") ?? "total";
    const cacheKey = `analytics_users_${range}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ ...cached.data, _fromCache: true });
    }

    const rangeDates = getRangeDates(range);

    // ─── KPI 1: Total users (all-time)
    const { count: totalUsers } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true });

    // ─── KPI 2: New this month & last month
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    const lastMonthStart = new Date(thisMonthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    const { count: newThisMonth } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thisMonthStart.toISOString());

    const { count: newLastMonth } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", lastMonthStart.toISOString())
      .lt("created_at", thisMonthStart.toISOString());

    // ─── KPI 3: Activated users (have at least 1 successful txn)
    const { data: activatedRows } = await supabaseAdmin
      .from("transactions")
      .select("user_id")
      .eq("status", "success");
    const activatedUserIds = new Set(
      (activatedRows ?? []).map((r: any) => r.user_id).filter(Boolean)
    );
    const activatedUsers = activatedUserIds.size;

    // ─── KPI 4: KYC verified
    const { count: kycVerified } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .in("bvn_verification", ["verified", "approved"]);

    // ─── KPI 5: Retention 30d — logged in within last 30d
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { count: activeLast30 } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("last_login", thirtyDaysAgo.toISOString());

    // ─── Funnel
    // Total signups (users)
    const funnelSignup = totalUsers ?? 0;
    // First login — anyone with last_login
    const { count: funnelLoginCount } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .not("last_login", "is", null);
    const funnelLogin = funnelLoginCount ?? 0;
    // Funded — from transactions (deposit-like types)
    const { data: fundedRows } = await supabaseAdmin
      .from("transactions")
      .select("user_id")
      .eq("status", "success")
      .in("type", ["deposit", "virtual_account_deposit", "credit", "funding"]);
    const fundedUserIds = new Set(
      (fundedRows ?? []).map((r: any) => r.user_id).filter(Boolean)
    );
    const funnelFunded = fundedUserIds.size;
    // First txn — same as activated
    const funnelFirstTxn = activatedUsers;
    // KYC
    const funnelKyc = kycVerified ?? 0;

    // ─── Source breakdown — from referral_source (existing column)
    let sourceQuery = supabaseAdmin
      .from("users")
      .select("referral_source");
    if (rangeDates) {
      sourceQuery = sourceQuery
        .gte("created_at", rangeDates.start)
        .lte("created_at", rangeDates.end);
    }
    const { data: sourceRows } = await sourceQuery;
    const sourceMap: Record<string, number> = {};
    (sourceRows ?? []).forEach((r: any) => {
      const key = (r.referral_source || "unknown").toLowerCase().trim();
      sourceMap[key] = (sourceMap[key] || 0) + 1;
    });
    const sources = Object.entries(sourceMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // ─── Heard from breakdown — from users.heard_from (existing)
    const { data: heardRows } = await supabaseAdmin
      .from("users")
      .select("heard_from");
    const heardMap: Record<string, number> = {};
    (heardRows ?? []).forEach((r: any) => {
      const key = (r.heard_from || "unknown").toLowerCase().trim();
      heardMap[key] = (heardMap[key] || 0) + 1;
    });
    const heardFrom = Object.entries(heardMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ─── Cities & States
    const { data: cityRows } = await supabaseAdmin
      .from("users")
      .select("city, state");
    const cityMap: Record<string, number> = {};
    const stateMap: Record<string, number> = {};
    (cityRows ?? []).forEach((r: any) => {
      if (r.city) cityMap[r.city] = (cityMap[r.city] || 0) + 1;
      if (r.state) stateMap[r.state] = (stateMap[r.state] || 0) + 1;
    });
    const cities = Object.entries(cityMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    const states = Object.entries(stateMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ─── Purpose breakdown
    const { data: purposeRows } = await supabaseAdmin
      .from("users")
      .select("purpose");
    const purposeMap: Record<string, number> = {};
    (purposeRows ?? []).forEach((r: any) => {
      const key = (r.purpose || "unknown").toLowerCase().trim();
      purposeMap[key] = (purposeMap[key] || 0) + 1;
    });
    const purposes = Object.entries(purposeMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // ─── Platform breakdown — from user_acquisition_events
    const { data: platformRows } = await supabaseAdmin
      .from("user_acquisition_events")
      .select("platform")
      .eq("event_type", "signup");
    const platformMap: Record<string, number> = {};
    (platformRows ?? []).forEach((r: any) => {
      const key = (r.platform || "unknown").toLowerCase().trim();
      platformMap[key] = (platformMap[key] || 0) + 1;
    });
    const platforms = Object.entries(platformMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // ─── Cohorts — monthly signup + D1/D7/D30 retention
    // Compute: for each signup month, how many of those users logged in D1/D7/D30 after signup
    // We approximate using users.last_login for the query set
    const { data: cohortRows } = await supabaseAdmin
      .from("users")
      .select("id, created_at, last_login");
    const cohortMap: Record<
      string,
      { signups: number; d1: number; d7: number; d30: number }
    > = {};
    (cohortRows ?? []).forEach((u: any) => {
      if (!u.created_at) return;
      const signupDate = new Date(u.created_at);
      const monthKey = signupDate.toLocaleString("en-GB", {
        year: "numeric",
        month: "2-digit",
      });
      if (!cohortMap[monthKey]) {
        cohortMap[monthKey] = { signups: 0, d1: 0, d7: 0, d30: 0 };
      }
      cohortMap[monthKey].signups++;
      if (u.last_login) {
        const loginDate = new Date(u.last_login);
        const diffDays =
          (loginDate.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays >= 0 && diffDays <= 1) cohortMap[monthKey].d1++;
        if (diffDays >= 0 && diffDays <= 7) cohortMap[monthKey].d7++;
        if (diffDays >= 0 && diffDays <= 30) cohortMap[monthKey].d30++;
      }
    });
    const cohorts = Object.entries(cohortMap)
      .map(([month, v]) => ({
        month,
        signups: v.signups,
        d1: v.signups ? Number(((v.d1 / v.signups) * 100).toFixed(1)) : 0,
        d7: v.signups ? Number(((v.d7 / v.signups) * 100).toFixed(1)) : 0,
        d30: v.signups ? Number(((v.d30 / v.signups) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);

    // ─── Compute rates
    const activationRate = totalUsers ? (activatedUsers / totalUsers) * 100 : 0;
    const kycRate = totalUsers ? ((kycVerified ?? 0) / totalUsers) * 100 : 0;
    const retention30d = totalUsers ? ((activeLast30 ?? 0) / totalUsers) * 100 : 0;

    const response = {
      kpis: {
        total: totalUsers ?? 0,
        newThisMonth: newThisMonth ?? 0,
        newLastMonth: newLastMonth ?? 0,
        activatedUsers,
        activatedRate: Number(activationRate.toFixed(1)),
        kycVerified: kycVerified ?? 0,
        kycVerifiedRate: Number(kycRate.toFixed(1)),
        retention30d: Number(retention30d.toFixed(1)),
      },
      funnel: [
        { stage: "Signed up", count: funnelSignup, rate: 100 },
        {
          stage: "First login",
          count: funnelLogin,
          rate: funnelSignup
            ? Number(((funnelLogin / funnelSignup) * 100).toFixed(1))
            : 0,
        },
        {
          stage: "Funded wallet",
          count: funnelFunded,
          rate: funnelSignup
            ? Number(((funnelFunded / funnelSignup) * 100).toFixed(1))
            : 0,
        },
        {
          stage: "First txn",
          count: funnelFirstTxn,
          rate: funnelSignup
            ? Number(((funnelFirstTxn / funnelSignup) * 100).toFixed(1))
            : 0,
        },
        {
          stage: "KYC verified",
          count: funnelKyc,
          rate: funnelSignup
            ? Number(((funnelKyc / funnelSignup) * 100).toFixed(1))
            : 0,
        },
      ],
      sources,
      heardFrom,
      regions: { cities, states },
      purposes,
      platforms,
      cohorts,
      range,
    };

    cache.set(cacheKey, { data: response, timestamp: Date.now() });

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("Analytics users route error:", err);
    return NextResponse.json(
      { error: "Failed to compute analytics" },
      { status: 500 }
    );
  }
}
