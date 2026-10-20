// app/api/admin-apis/online-stores/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";
import { createAuditLog, getClientInfo } from "@/lib/audit-log";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CACHE_TTL = 60 * 1000;
const cache = new Map<string, { data: any; timestamp: number }>();

function isCacheValid(ts: number) {
  return Date.now() - ts < CACHE_TTL;
}

// Builds one row per store, enriched with:
//   - owner email/name (from users)
//   - wallet stats (from store_owner_wallets)
//   - catalog pages (from payment_pages)
//   - order stats (from payment_page_payments)
export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin", "support_admin", "finance_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const url = new URL(req.url);
    const page = Math.max(Number(url.searchParams.get("page") ?? 1), 1);
    const limit = Math.max(Number(url.searchParams.get("limit") ?? 20), 1);
    const search = (url.searchParams.get("search") ?? "").trim();
    const status = url.searchParams.get("status") ?? "";
    const includeStats = url.searchParams.get("includeStats") === "true";
    const nocache = url.searchParams.get("nocache") === "true";

    const cacheKey = `online-stores:${page}:${limit}:${search}:${status}:${includeStats}`;
    if (nocache) cache.delete(cacheKey);
    const cached = cache.get(cacheKey);
    if (cached && isCacheValid(cached.timestamp)) {
      return NextResponse.json(cached.data);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // ─── Base query: online_stores ───────────────
    let q = supabaseAdmin
      .from("online_stores")
      .select(
        `
        id,
        owner_id,
        name,
        slug,
        description,
        logo_url,
        cover_url,
        country,
        state,
        city,
        street_address,
        whatsapp_number,
        is_active,
        activation_paid,
        activated_at,
        activation_reference,
        wallet_balance,
        total_revenue,
        total_orders,
        total_views,
        delivery_enabled,
        local_pickup_enabled,
        delivery_fee,
        delivery_free_threshold,
        created_at,
        updated_at
        `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (search) {
      q = q.or(
        `name.ilike.%${search}%,slug.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%`
      );
    }

    if (status === "active") q = q.eq("is_active", true);
    else if (status === "inactive") q = q.eq("is_active", false);
    else if (status === "pending_activation") q = q.eq("activation_paid", false);

    const { data: stores, error, count } = await q.range(from, to);
    if (error) throw error;

    const storeIds = (stores ?? []).map((s: any) => s.id);
    const ownerIds = Array.from(new Set((stores ?? []).map((s: any) => s.owner_id)));

    // ─── Parallel fetch of related data ──────────
    const [ownersRes, walletsRes, pagesRes] = await Promise.all([
      ownerIds.length > 0
        ? supabaseAdmin
            .from("users")
            .select("id, email, first_name, last_name, full_name, phone")
            .in("id", ownerIds)
        : Promise.resolve({ data: [] as any[] } as any),
      storeIds.length > 0
        ? supabaseAdmin
            .from("store_owner_wallets")
            .select(
              "store_id, user_id, available_balance, pending_balance, total_earned, total_withdrawn, last_activity_at"
            )
            .in("store_id", storeIds)
        : Promise.resolve({ data: [] as any[] } as any),
      storeIds.length > 0
        ? supabaseAdmin
            .from("payment_pages")
            .select("id, store_id, title, slug, page_type, is_published, is_active, total_payments, total_revenue")
            .in("store_id", storeIds)
        : Promise.resolve({ data: [] as any[] } as any),
    ]);

    const owners = ownersRes?.data ?? [];
    const wallets = walletsRes?.data ?? [];
    const pages = pagesRes?.data ?? [];

    const ownerMap = new Map<string, any>();
    owners.forEach((o: any) => {
      ownerMap.set(o.id, {
        email: o.email,
        name:
          o.full_name ||
          [o.first_name, o.last_name].filter(Boolean).join(" ") ||
          o.email,
        phone: o.phone ?? null,
      });
    });

    const walletMap = new Map<string, any>();
    wallets.forEach((w: any) => walletMap.set(w.store_id, w));

    const pagesByStore = new Map<string, any[]>();
    pages.forEach((p: any) => {
      if (!pagesByStore.has(p.store_id)) pagesByStore.set(p.store_id, []);
      pagesByStore.get(p.store_id)!.push(p);
    });

    // ─── Fetch order stats for the page's payment_pages ───
    const pageIds = pages.map((p: any) => p.id);
    let orderStats: any[] = [];
    if (pageIds.length > 0) {
      const { data: payments } = await supabaseAdmin
        .from("payment_page_payments")
        .select("payment_page_id, amount, total_fee, status, created_at")
        .in("payment_page_id", pageIds)
        .eq("status", "completed");
      orderStats = payments ?? [];
    }

    const ordersByPage = new Map<
      string,
      { count: number; revenue: number; fees: number }
    >();
    for (const p of orderStats) {
      const cur = ordersByPage.get(p.payment_page_id) ?? {
        count: 0,
        revenue: 0,
        fees: 0,
      };
      cur.count += 1;
      cur.revenue += Number(p.amount) || 0;
      cur.fees += Number(p.total_fee) || 0;
      ordersByPage.set(p.payment_page_id, cur);
    }

    // ─── Compose the enriched row ─────────────────
    const enrichedStores = (stores ?? []).map((store: any) => {
      const owner = ownerMap.get(store.owner_id) ?? null;
      const wallet = walletMap.get(store.id) ?? null;
      const storePages = pagesByStore.get(store.id) ?? [];

      let pageOrderCount = 0;
      let pageRevenue = 0;
      let pageFees = 0;
      for (const pg of storePages) {
        const s = ordersByPage.get(pg.id);
        if (s) {
          pageOrderCount += s.count;
          pageRevenue += s.revenue;
          pageFees += s.fees;
        }
      }

      // If wallet doesn't exist yet, fall back to online_stores counters
      const availableBalance = wallet
        ? Number(wallet.available_balance) || 0
        : Number(store.wallet_balance) || 0;
      const pendingBalance = wallet ? Number(wallet.pending_balance) || 0 : 0;
      const totalEarned = wallet
        ? Number(wallet.total_earned) || 0
        : Number(store.total_revenue) || 0;
      const totalWithdrawn = wallet
        ? Number(wallet.total_withdrawn) || 0
        : 0;

      return {
        id: store.id,
        owner_id: store.owner_id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        logo_url: store.logo_url,
        cover_url: store.cover_url,
        country: store.country,
        state: store.state,
        city: store.city,
        street_address: store.street_address,
        whatsapp_number: store.whatsapp_number,

        is_active: store.is_active,
        activation_paid: store.activation_paid,
        activated_at: store.activated_at,
        activation_reference: store.activation_reference,

        delivery_enabled: store.delivery_enabled,
        local_pickup_enabled: store.local_pickup_enabled,
        delivery_fee: Number(store.delivery_fee) || 0,
        delivery_free_threshold: Number(store.delivery_free_threshold) || 0,

        // Owner
        owner_email: owner?.email ?? null,
        owner_name: owner?.name ?? null,
        owner_phone: owner?.phone ?? null,

        // Wallet
        available_balance: availableBalance,
        pending_balance: pendingBalance,
        total_earned: totalEarned,
        total_withdrawn: totalWithdrawn,
        last_activity_at: wallet?.last_activity_at ?? null,

        // Counters
        total_orders: store.total_orders ?? pageOrderCount,
        total_revenue: store.total_revenue ?? pageRevenue,
        total_views: store.total_views ?? 0,
        page_count: storePages.length,
        pages_published: storePages.filter((p: any) => p.is_published === true).length,

        // Live totals from payment_page_payments (may differ from counters)
        live_order_count: pageOrderCount,
        live_revenue: pageRevenue,
        live_fees: pageFees,

        created_at: store.created_at,
        updated_at: store.updated_at,
      };
    });

    // ─── Aggregate stats ─────────────────────────
    let stats: any = undefined;
    if (includeStats) {
      const [
        { count: totalCount },
        { count: activeCount },
        { count: pendingActivationCount },
      ] = await Promise.all([
        supabaseAdmin
          .from("online_stores")
          .select("*", { count: "exact", head: true }),
        supabaseAdmin
          .from("online_stores")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true),
        supabaseAdmin
          .from("online_stores")
          .select("*", { count: "exact", head: true })
          .eq("activation_paid", false),
      ]);

      // Total available + pending + earned across all wallets
      const { data: walletsAgg } = await supabaseAdmin
        .from("store_owner_wallets")
        .select("available_balance, pending_balance, total_earned, total_withdrawn");

      const walletSum = (walletsAgg ?? []).reduce(
        (acc: any, w: any) => {
          acc.available += Number(w.available_balance) || 0;
          acc.pending += Number(w.pending_balance) || 0;
          acc.earned += Number(w.total_earned) || 0;
          acc.withdrawn += Number(w.total_withdrawn) || 0;
          return acc;
        },
        { available: 0, pending: 0, earned: 0, withdrawn: 0 }
      );

      stats = {
        total: totalCount ?? 0,
        active: activeCount ?? 0,
        inactive: (totalCount ?? 0) - (activeCount ?? 0),
        pendingActivation: pendingActivationCount ?? 0,
        totalAvailableBalance: walletSum.available,
        totalPendingBalance: walletSum.pending,
        totalEarned: walletSum.earned,
        totalWithdrawn: walletSum.withdrawn,
      };
    }

    const responseData = {
      stores: enrichedStores,
      data: enrichedStores,
      total: count ?? 0,
      page,
      limit,
      perPage: limit,
      totalPages: Math.ceil((count ?? 0) / limit),
      ...(stats ? { stats } : {}),
    };

    cache.set(cacheKey, { data: responseData, timestamp: Date.now() });
    if (cache.size > 100) {
      const oldest = cache.keys().next().value;
      if (oldest) cache.delete(oldest);
    }

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("Online stores API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to load online stores" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────
// GET /api/admin-apis/online-stores/[id] — detail
// (add this as a separate file: app/api/admin-apis/online-stores/[id]/route.ts)
// ─────────────────────────────────────────────