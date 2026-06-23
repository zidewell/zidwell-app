// app/api/admin-apis/users/cache.ts
const adminUsersCache = new Map();
const ADMIN_USERS_CACHE_TTL = 2 * 60 * 1000;

export interface AdminUsersQuery {
  q: string | null;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
  filter_status?: string;
  role?: string;
  activity?: string;
  balance?: string;
  low_threshold?: number;
  high_threshold?: number;
}

export function clearAdminUsersCache(filters?: Partial<AdminUsersQuery>) {
  if (filters && Object.keys(filters).length > 0) {
    // Clear specific cache entry
    const cacheKey = `admin_users_${filters.q || "all"}_${filters.page || 1}_${
      filters.limit || 20
    }_${filters.sortBy || "created_at"}_${filters.sortOrder || "desc"}_${
      filters.status || "all"
    }_${filters.filter_status || "all"}_${filters.role || "all"}_${
      filters.activity || "all"
    }_${filters.balance || "all"}`;
    
    const existed = adminUsersCache.delete(cacheKey);
    if (existed) console.log(`🧹 Cleared specific admin users cache: ${cacheKey}`);
    return existed;
  } else {
    // Clear all cache
    const count = adminUsersCache.size;
    adminUsersCache.clear();
    console.log(`🧹 Cleared all admin users cache (${count} entries)`);
    return count;
  }
}

export function clearAdminUsersCacheForUser(userId: string) {
  const count = adminUsersCache.size;
  adminUsersCache.clear();
  console.log(
    `🧹 Cleared all admin users cache due to user ${userId} update (${count} entries)`
  );
  return count;
}

export async function getCachedAdminUsers(query: AdminUsersQuery) {
  const {
    q,
    page,
    limit = 20,
    sortBy = "created_at",
    sortOrder = "desc",
    status = "all",
    filter_status = "all",
    role = "all",
    activity = "all",
    balance = "all",
  } = query;

  const cacheKey = `admin_users_${q || "all"}_${page}_${limit}_${sortBy}_${sortOrder}_${status}_${filter_status}_${role}_${activity}_${balance}`;
  const cached = adminUsersCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < ADMIN_USERS_CACHE_TTL) {
    console.log("✅ Using cached admin users data");
    return { ...cached.data, _fromCache: true };
  }

  console.log("🔄 Fetching fresh admin users data from database");
  return null;
}

export function setCachedAdminUsers(cacheKey: string, data: any) {
  adminUsersCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
}