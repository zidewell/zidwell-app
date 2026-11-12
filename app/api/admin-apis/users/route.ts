// app/api/admin-apis/users/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  clearAdminUsersCache,
  getCachedAdminUsers,
  setCachedAdminUsers,
  AdminUsersQuery,
} from "./cache";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type Category = "all" | "verified" | "unverified" | "pending_kyc";

// ═════════════════════════════════════════════════════════════
// SELF-HEAL: reconcile public.users.email_verified against
// auth.users.email_confirmed_at for a set of user IDs.
//
// This fixes the bug where a user confirmed their email via a
// Supabase magic link → auth.users.email_confirmed_at is set,
// but public.users.email_verified stayed false → admin UI shows
// them as "unverified" while login works fine.
//
// Best-effort: never throws, never blocks the list response.
// ═════════════════════════════════════════════════════════════
async function reconcileEmailVerified(userIds: string[]) {
  if (!userIds.length) return;
  // Cap to keep the list endpoint snappy (drop the rest to next visit)
  const ids = userIds.slice(0, 100);

  await Promise.all(
    ids.map(async (id) => {
      try {
        const { data: authUser } =
          await supabaseAdmin.auth.admin.getUserById(id);

        const confirmed = !!authUser?.user?.email_confirmed_at;

        const { data: dbUser } = await supabaseAdmin
          .from("users")
          .select("email_verified")
          .eq("id", id)
          .maybeSingle();

        if (!dbUser) return;
        if (dbUser.email_verified === confirmed) return; // no drift

        await supabaseAdmin
          .from("users")
          .update({
            email_verified: confirmed,
            ...(confirmed
              ? {
                  email_verification_token: null,
                  email_verification_token_expires: null,
                }
              : {}),
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        console.log(`🩹 Reconciled email_verified=${confirmed} for ${id}`);
      } catch (e: any) {
        console.warn(`[reconcile] skipped ${id}:`, e?.message);
      }
    }),
  );
}

async function fetchAdminUsers(query: AdminUsersQuery) {
  const {
    q,
    page,
    limit = 20,
    sortBy = "created_at",
    sortOrder = "desc",
    category = "all",
    role = "all",
  } = query as AdminUsersQuery & { category?: Category };

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  console.log("━━━━━ [USERS GET] ━━━━━");
  console.log("📥 search (q):", JSON.stringify(q));
  console.log("📥 category:", category, "| role:", role);

  // ═════════════════════════════════════════════════════════════
  // SEARCH STRATEGY — BULLETPROOF
  // 1. If search present, get matching user IDs via simple queries
  // 2. Apply .in("id", [...]) to the main query
  // This avoids .or() with null columns entirely.
  // ═════════════════════════════════════════════════════════════
  let matchedUserIds: string[] | null = null;

  if (q && q.trim().length > 0) {
    const searchTerm = q.trim();
    const cleaned = searchTerm.replace(/[%_,]/g, "");

    if (cleaned.length > 0) {
      console.log("🔍 Search cleaned:", JSON.stringify(cleaned));

      const { data: matches, error: matchError } = await supabaseAdmin
        .from("users")
        .select("id")
        .or(
          [
            `email.ilike.%${cleaned}%`,
            `full_name.ilike.%${cleaned}%`,
            `first_name.ilike.%${cleaned}%`,
            `last_name.ilike.%${cleaned}%`,
            `phone.ilike.%${cleaned}%`,
          ].join(","),
        )
        .limit(5000);

      if (matchError) {
        console.error("❌ Match query failed:", matchError.message);
        matchedUserIds = [];
      } else {
        matchedUserIds = (matches ?? []).map((u: any) => u.id);
        console.log(
          "🔍 Matched",
          matchedUserIds.length,
          "user IDs via .or()",
        );
      }

      if (matchedUserIds.length === 0) {
        console.log("❌ Search matched 0 users — returning empty");

        const [
          { count: totalCount },
          { count: verifiedCount },
          { count: unverifiedCount },
          { count: pendingKycCount },
        ] = await Promise.all([
          supabaseAdmin
            .from("users")
            .select("*", { count: "exact", head: true }),
          supabaseAdmin
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("email_verified", true)
            .in("bvn_verification", ["verified", "approved"]),
          supabaseAdmin
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("email_verified", false),
          supabaseAdmin
            .from("users")
            .select("*", { count: "exact", head: true })
            .is("bank_account_number", null),
        ]);

        return {
          users: [],
          total: 0,
          page,
          perPage: limit,
          stats: {
            total: totalCount ?? 0,
            verified: verifiedCount ?? 0,
            unverified: unverifiedCount ?? 0,
            pendingKyc: pendingKycCount ?? 0,
          },
          search: q,
          sort: { by: sortBy, order: sortOrder },
          filters: { category, role },
        };
      }
    } else {
      matchedUserIds = [];
    }
  } else {
    console.log("ℹ️ No search term — fetching all users");
  }

  // ═════════════════════════════════════════════════════════════
  // MAIN QUERY
  // ═════════════════════════════════════════════════════════════
  let baseQuery = supabaseAdmin.from("users").select(
    "id, email, first_name, last_name, full_name, phone, wallet_balance, zidcoin_balance, admin_role, bvn_verification, nin_verification, is_blocked, bank_account_name, bank_account_number, email_verified, created_at, last_login",
    { count: "exact" },
  );

  if (matchedUserIds !== null) {
    baseQuery = baseQuery.in("id", matchedUserIds);
  }

  if (category === "verified") {
    baseQuery = baseQuery
      .eq("email_verified", true)
      .in("bvn_verification", ["verified", "approved"]);
  } else if (category === "unverified") {
    baseQuery = baseQuery.eq("email_verified", false);
  } else if (category === "pending_kyc") {
    baseQuery = baseQuery.is("bank_account_number", null);
  }

  if (role && role !== "all") {
    if (role === "user") {
      baseQuery = baseQuery.is("admin_role", null);
    } else {
      baseQuery = baseQuery.eq("admin_role", role);
    }
  }

  const {
    data: usersData,
    error: usersError,
    count: usersCount,
  } = await baseQuery
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(from, to);

  if (usersError) {
    throw new Error(`Users fetch error: ${usersError.message}`);
  }

  // ✅ NEW: self-heal email_verified against Supabase Auth
  // Runs only for the page of users being returned — cheap.
  await reconcileEmailVerified((usersData || []).map((u: any) => u.id));

  // Re-fetch those same IDs so the response reflects the corrected flags
  let finalUsers = usersData || [];
  if (finalUsers.length > 0) {
    const ids = finalUsers.map((u: any) => u.id);
    const { data: refreshed } = await supabaseAdmin
      .from("users")
      .select(
        "id, email, first_name, last_name, full_name, phone, wallet_balance, zidcoin_balance, admin_role, bvn_verification, nin_verification, is_blocked, bank_account_name, bank_account_number, email_verified, created_at, last_login",
      )
      .in("id", ids);

    if (refreshed && refreshed.length > 0) {
      const map = new Map(refreshed.map((u: any) => [u.id, u]));
      finalUsers = finalUsers.map(
        (u: any) => map.get(u.id) ?? u,
      );
    }
  }

  // Normalize
  const normalizedUsers = finalUsers.map((u: any) => {
    const kycStatus =
      u.bvn_verification === "verified" || u.bvn_verification === "approved"
        ? "verified"
        : u.bvn_verification === "pending"
          ? "pending"
          : "not_submitted";

    return {
      ...u,
      email_verified: u.email_verified === true,
      kyc_status: kycStatus,
      full_name:
        u.full_name ||
        [u.first_name, u.last_name].filter(Boolean).join(" ") ||
        null,
    };
  });

  // Stats
  const [
    { count: totalCount },
    { count: verifiedCount },
    { count: unverifiedCount },
    { count: pendingKycCount },
  ] = await Promise.all([
    supabaseAdmin.from("users").select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("email_verified", true)
      .in("bvn_verification", ["verified", "approved"]),
    supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("email_verified", false),
    supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .is("bank_account_number", null),
  ]);

  console.log(
    "✅ Returning",
    normalizedUsers.length,
    "users, total:",
    usersCount,
  );
  console.log("━━━━━━━━━━━━━━━━━━━━━━━");

  return {
    users: normalizedUsers,
    total: usersCount || 0,
    page,
    perPage: limit,
    stats: {
      total: totalCount ?? 0,
      verified: verifiedCount ?? 0,
      unverified: unverifiedCount ?? 0,
      pendingKyc: pendingKycCount ?? 0,
    },
    search: q || null,
    sort: { by: sortBy, order: sortOrder },
    filters: { category, role },
  };
}

export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin", "support_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const url = new URL(req.url);

    const searchFromQuery =
      url.searchParams.get("search") || url.searchParams.get("q") || null;

    const query = {
      q: searchFromQuery,
      page: Number(url.searchParams.get("page") ?? 1),
      limit: Number(url.searchParams.get("limit") ?? 20),
      sortBy: url.searchParams.get("sortBy") ?? "created_at",
      sortOrder: (url.searchParams.get("sortOrder") as "asc" | "desc") ?? "desc",
      category: (url.searchParams.get("category") as Category) ?? "all",
      role: url.searchParams.get("role") ?? "all",
    } as AdminUsersQuery & { category?: Category };

    const shouldBypassCache = !!searchFromQuery;

    const nocache =
      url.searchParams.get("nocache") === "true" || shouldBypassCache;

    if (nocache) clearAdminUsersCache(query);

    let result = shouldBypassCache ? null : await getCachedAdminUsers(query);
    let fromCache = true;

    if (!result) {
      result = await fetchAdminUsers(query);
      fromCache = false;

      if (!shouldBypassCache) {
        const cacheKey = `admin_users_${query.q || "all"}_${query.page}_${
          query.limit
        }_${query.sortBy}_${query.sortOrder}_${query.category}_${query.role}`;
        setCachedAdminUsers(cacheKey, result);
      }
    }

    return NextResponse.json({
      ...result,
      _cache: { cached: fromCache, timestamp: Date.now() },
      _admin: {
        performedBy: adminUser?.email,
        performedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("❌ GET /api/admin-apis/users error:", err.message);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}