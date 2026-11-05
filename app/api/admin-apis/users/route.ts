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

      // Query 1: Get matching IDs (limit 5000 for safety)
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

      // If 0 matches — return empty immediately
      if (matchedUserIds.length === 0) {
        console.log("❌ Search matched 0 users — returning empty");

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

  // Apply search via IDs
  if (matchedUserIds !== null) {
    console.log("🔍 Applying .in('id', [", matchedUserIds.length, "IDs])");
    baseQuery = baseQuery.in("id", matchedUserIds);
  }

  // Category filters
  if (category === "verified") {
    baseQuery = baseQuery
      .eq("email_verified", true)
      .in("bvn_verification", ["verified", "approved"]);
  } else if (category === "unverified") {
    baseQuery = baseQuery.eq("email_verified", false);
  } else if (category === "pending_kyc") {
    baseQuery = baseQuery.is("bank_account_number", null);
  }

  // Role filter
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

  console.log("📊 Query result:", {
    usersCount: usersData?.length ?? 0,
    totalCount: usersCount,
    error: usersError?.message,
    sampleEmails: usersData?.slice(0, 3).map((u: any) => u.email),
  });

  if (usersError) {
    throw new Error(`Users fetch error: ${usersError.message}`);
  }

  // Normalize
  const normalizedUsers = (usersData || []).map((u: any) => {
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

  console.log("✅ Returning", normalizedUsers.length, "users, total:", usersCount);
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

    // ═════════════════════════════════════════════════════════════
    // 🚨 FIX: Read BOTH "q" AND "search" — support both param names
    // ═════════════════════════════════════════════════════════════
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

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📥 RAW URL:", url.toString());
    console.log("📥 search param:", JSON.stringify(searchFromQuery));
    console.log("📥 final q:", JSON.stringify(query.q));

    // ═════════════════════════════════════════════════════════════
    // 🚨 FIX: Disable cache for searches — never cache filtered results
    // ═════════════════════════════════════════════════════════════
    const shouldBypassCache = !!searchFromQuery;

    if (shouldBypassCache) {
      console.log("🔓 Bypassing cache (search active)");
    }

    const nocache =
      url.searchParams.get("nocache") === "true" || shouldBypassCache;

    if (nocache) clearAdminUsersCache(query);

    let result = shouldBypassCache ? null : await getCachedAdminUsers(query);
    let fromCache = true;

    if (!result) {
      result = await fetchAdminUsers(query);
      fromCache = false;

      // Only cache non-search results
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