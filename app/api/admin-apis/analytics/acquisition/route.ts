// app/api/admin-apis/analytics/acquisition/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin"];
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

    const cacheKey = `acquisition_${page}_${limit}_${search}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ ...cached.data, _fromCache: true });
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // ─── UTM campaign aggregation
    const { data: events } = await supabaseAdmin
      .from("user_acquisition_events")
      .select("source, medium, campaign, landing_page, platform, created_at")
      .eq("event_type", "signup");

    const campaignMap: Record<
      string,
      {
        source: string;
        medium: string;
        campaign: string;
        count: number;
        landing_pages: Set<string>;
      }
    > = {};
    (events ?? []).forEach((e: any) => {
      const key = `${e.source || "unknown"}|${e.medium || "-"}|${
        e.campaign || "-"
      }`;
      if (!campaignMap[key]) {
        campaignMap[key] = {
          source: e.source || "unknown",
          medium: e.medium || "-",
          campaign: e.campaign || "-",
          count: 0,
          landing_pages: new Set(),
        };
      }
      campaignMap[key].count++;
      if (e.landing_page) campaignMap[key].landing_pages.add(e.landing_page);
    });

    const campaigns = Object.values(campaignMap)
      .map((c) => ({
        source: c.source,
        medium: c.medium,
        campaign: c.campaign,
        count: c.count,
        unique_landing_pages: c.landing_pages.size,
      }))
      .sort((a, b) => b.count - a.count);

    // ─── Referral leaderboard
    // Users who have referred others (users.referred_by is a code, users.referral_code is their own)
    const { data: allUsers } = await supabaseAdmin
      .from("users")
      .select("id, email, referral_code, referred_by");

    const referralCountMap: Record<string, { email: string; count: number }> =
      {};
    (allUsers ?? []).forEach((u: any) => {
      if (u.referral_code) {
        referralCountMap[u.referral_code] = {
          email: u.email || "unknown",
          count: 0,
        };
      }
    });
    (allUsers ?? []).forEach((u: any) => {
      if (u.referred_by && referralCountMap[u.referred_by]) {
        referralCountMap[u.referred_by].count++;
      }
    });
    const referralLeaderboard = Object.entries(referralCountMap)
      .map(([code, v]) => ({ referral_code: code, email: v.email, count: v.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // ─── Raw signups list (paginated)
    let signupsQuery = supabaseAdmin
      .from("user_acquisition_events")
      .select(
        "id, user_id, source, medium, campaign, referrer, landing_page, platform, country, city, created_at",
        { count: "exact" }
      )
      .eq("event_type", "signup")
      .order("created_at", { ascending: false });

    if (search) {
      signupsQuery = signupsQuery.or(
        `source.ilike.%${search}%,medium.ilike.%${search}%,campaign.ilike.%${search}%,landing_page.ilike.%${search}%`
      );
    }

    const { data: signupRows, count: totalSignups, error } = await signupsQuery.range(
      from,
      to
    );

    if (error) throw error;

    const response = {
      campaigns,
      referralLeaderboard,
      signups: signupRows ?? [],
      total: totalSignups ?? 0,
      page,
      limit,
      totalPages: Math.ceil((totalSignups ?? 0) / limit),
    };

    cache.set(cacheKey, { data: response, timestamp: Date.now() });

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("Acquisition route error:", err);
    return NextResponse.json(
      { error: "Failed to load acquisition data" },
      { status: 500 }
    );
  }
}
