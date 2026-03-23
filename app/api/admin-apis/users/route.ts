import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAuditLog, getClientInfo } from "@/lib/audit-log";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const adminUsersCache = new Map();
const ADMIN_USERS_CACHE_TTL = 2 * 60 * 1000;

interface AdminUsersQuery {
  q: string | null;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function clearAdminUsersCache(filters?: Partial<AdminUsersQuery>) {
  if (filters && (filters.q !== undefined || filters.page || filters.limit || filters.sortBy || filters.sortOrder)) {
    const cacheKey = `admin_users_${filters.q || "all"}_${filters.page || 1}_${
      filters.limit || 20
    }_${filters.sortBy || "created_at"}_${filters.sortOrder || "desc"}`;
    const existed = adminUsersCache.delete(cacheKey);
    if (existed) console.log(`🧹 Cleared specific admin users cache: ${cacheKey}`);
    return existed;
  } else {
    const count = adminUsersCache.size;
    adminUsersCache.clear();
    console.log(`🧹 Cleared all admin users cache (${count} entries)`);
    return count;
  }
}

async function getCachedAdminUsers({
  q,
  page,
  limit = 20,
  sortBy = "created_at",
  sortOrder = "desc",
}: AdminUsersQuery) {
  const cacheKey = `admin_users_${q || "all"}_${page}_${limit}_${sortBy}_${sortOrder}`;
  const cached = adminUsersCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < ADMIN_USERS_CACHE_TTL) {
    console.log("✅ Using cached admin users data");
    return { ...cached.data, _fromCache: true };
  }

  console.log("🔄 Fetching fresh admin users data from database");

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Fetch verified users (active users with completed KYC)
  let usersQuery = supabaseAdmin
    .from("users")
    .select("*", { count: "exact" })
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(from, to);

  if (q) {
    usersQuery = usersQuery.or(
      `full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
    );
  }

  const {
    data: usersData,
    error: usersError,
    count: usersCount,
  } = await usersQuery;

  if (usersError) {
    throw new Error(`Users fetch error: ${usersError.message}`);
  }

  // Get count of pending users from two sources
  let pendingFromTableCount = 0;
  let pendingFromUsersCount = 0;
  
  try {
    // Count users in pending_users table
    const { count: pendingTableCount, error: pendingTableError } = await supabaseAdmin
      .from("pending_users")
      .select("*", { count: "exact", head: true });
    
    if (!pendingTableError) {
      pendingFromTableCount = pendingTableCount || 0;
    }

    // Count users in users table with bvn_verification = 'not_submitted'
    const { count: pendingUsersCount, error: pendingUsersError } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("bvn_verification", "not_submitted");
    
    if (!pendingUsersError) {
      pendingFromUsersCount = pendingUsersCount || 0;
    }
  } catch (pendingErr) {
    console.error("❌ Pending users count error:", pendingErr);
  }

  const totalPendingUsers = pendingFromTableCount + pendingFromUsersCount;

  const responseData = {
    users: usersData || [],
    total: usersCount || 0,
    page,
    perPage: limit,
    stats: {
      active: usersCount || 0,
      pending: totalPendingUsers,
      total: (usersCount || 0) + totalPendingUsers,
    },
    search: q || null,
    sort: {
      by: sortBy,
      order: sortOrder,
    },
    _fromCache: false,
  };

  adminUsersCache.set(cacheKey, {
    data: responseData,
    timestamp: Date.now(),
  });

  console.log(`✅ Cached ${usersData?.length || 0} admin users for page ${page}`);

  return responseData;
}

export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin", "support_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const url = new URL(req.url);
    const q = url.searchParams.get("q");
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const sortBy = url.searchParams.get("sortBy") ?? "created_at";
    const sortOrder = (url.searchParams.get("sortOrder") as "asc" | "desc") ?? "desc";
    const nocache = url.searchParams.get("nocache") === "true";

    if (nocache) {
      clearAdminUsersCache({ q, page, limit, sortBy, sortOrder });
      console.log(`🔄 Force refreshing admin users data`);
    }

    const result = await getCachedAdminUsers({ q, page, limit, sortBy, sortOrder });
    const { _fromCache, ...cleanResponse } = result;

    return NextResponse.json({
      ...cleanResponse,
      _cache: { cached: _fromCache, timestamp: Date.now() },
      _admin: {
        performedBy: adminUser?.email,
        performedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("❌ GET /api/admin-apis/users error:", err.message);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}