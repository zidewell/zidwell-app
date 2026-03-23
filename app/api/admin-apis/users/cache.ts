// app/api/admin-apis/users/cache.ts

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

export function clearAdminUsersCacheForUser(userId: string) {
  const count = adminUsersCache.size;
  adminUsersCache.clear();
  console.log(
    `🧹 Cleared all admin users cache due to user ${userId} update (${count} entries)`
  );
  return count;
}

export function clearPendingUsersCountCache() {
  const cacheKey = "admin_users_pending_count";
  const existed = adminUsersCache.delete(cacheKey);
  if (existed) {
    console.log(`🧹 Cleared pending users count cache`);
  }
  return existed;
}

export async function getCachedAdminUsers({
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
  return null;
}

export function setCachedAdminUsers(cacheKey: string, data: any) {
  adminUsersCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
}