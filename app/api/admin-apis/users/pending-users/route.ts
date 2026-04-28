// app/api/admin-apis/users/pending-users/route.ts

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAuditLog, getClientInfo } from "@/lib/audit-log";
import { clearAdminUsersCache } from "../cache";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const pendingUsersCache = new Map();
const PENDING_USERS_CACHE_TTL = 2 * 60 * 1000;

interface PendingUsersQuery {
  q: string | null;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function clearPendingUsersCache(filters?: Partial<PendingUsersQuery>) {
  if (filters && (filters.q !== undefined || filters.page || filters.limit || filters.sortBy || filters.sortOrder)) {
    const cacheKey = `pending_users_${filters.q || "all"}_${filters.page || 1}_${
      filters.limit || 20
    }_${filters.sortBy || "created_at"}_${filters.sortOrder || "desc"}`;
    const existed = pendingUsersCache.delete(cacheKey);
    if (existed) console.log(`🧹 Cleared specific pending users cache: ${cacheKey}`);
    return existed;
  } else {
    const count = pendingUsersCache.size;
    pendingUsersCache.clear();
    console.log(`🧹 Cleared all pending users cache (${count} entries)`);
    return count;
  }
}

async function getCachedPendingUsers({
  q,
  page,
  limit = 20,
  sortBy = "created_at",
  sortOrder = "desc",
}: PendingUsersQuery) {
  const cacheKey = `pending_users_${q || "all"}_${page}_${limit}_${sortBy}_${sortOrder}`;
  const cached = pendingUsersCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < PENDING_USERS_CACHE_TTL) {
    console.log("✅ Using cached pending users data");
    return { ...cached.data, _fromCache: true };
  }
  return null;
}

function setCachedPendingUsers(cacheKey: string, data: any) {
  pendingUsersCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
}

async function fetchPendingUsers({
  q,
  page,
  limit = 20,
  sortBy = "created_at",
  sortOrder = "desc",
}: PendingUsersQuery) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Get all pending users from both sources
  let pendingTableQuery = supabaseAdmin
    .from("pending_users")
    .select("*");

  let usersQuery = supabaseAdmin
    .from("users")
    .select("*")
    .in("bvn_verification", ["not_submitted", "pending", null]);

  if (q) {
    pendingTableQuery = pendingTableQuery.or(
      `email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`
    );
    usersQuery = usersQuery.or(
      `full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
    );
  }

  const [pendingTableResult, usersResult] = await Promise.all([
    pendingTableQuery,
    usersQuery
  ]);

  if (pendingTableResult.error) {
    throw new Error(`Pending users fetch error: ${pendingTableResult.error.message}`);
  }
  if (usersResult.error) {
    throw new Error(`Users fetch error: ${usersResult.error.message}`);
  }

  const pendingTableUsers = (pendingTableResult.data || []).map((user: any) => ({
    ...user,
    full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
    source: 'pending_table',
    kyc_status: 'pending',
    status: 'pending',
    is_blocked: false,
  }));

  const usersWithPendingKYC = (usersResult.data || []).map((user: any) => ({
    ...user,
    full_name: user.full_name || '',
    source: 'users_table',
    kyc_status: user.bvn_verification || 'not_submitted',
    status: 'pending',
    is_blocked: user.is_blocked || false,
  }));

  // Combine and DEDUPLICATE BY EMAIL
  const allPendingUsers = [...pendingTableUsers, ...usersWithPendingKYC];
  
  // Remove duplicates by email
  const uniquePendingMap = new Map();
  allPendingUsers.forEach(user => {
    const email = user.email?.toLowerCase();
    if (email && !uniquePendingMap.has(email)) {
      uniquePendingMap.set(email, user);
    }
  });
  
  const uniquePendingUsers = Array.from(uniquePendingMap.values());
  const totalCount = uniquePendingUsers.length;
  
  // Sort unique users
  const sortedUsers = [...uniquePendingUsers].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (sortOrder === "asc") {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
  
  // Paginate
  const paginatedUsers = sortedUsers.slice(from, to + 1);

  // Get counts by source (unique)
  const pendingTableEmails = new Set(pendingTableUsers.map(u => u.email?.toLowerCase()).filter(Boolean));
  const pendingKYCEmails = new Set(usersWithPendingKYC.map(u => u.email?.toLowerCase()).filter(Boolean));
  
  // Remove overlap for accurate source counts
  const uniquePendingTableCount = pendingTableEmails.size;
  const uniquePendingKYCCount = pendingKYCEmails.size;

  return {
    users: paginatedUsers,
    total: totalCount,
    page,
    perPage: limit,
    stats: {
      pending: totalCount,
      fromTable: uniquePendingTableCount,
      fromUsers: uniquePendingKYCCount,
    },
    search: q || null,
    sort: {
      by: sortBy,
      order: sortOrder,
    },
  };
}
export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;
    
    const allowedRoles = ['super_admin', 'operations_admin', 'support_admin'];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const url = new URL(req.url);
    const q = url.searchParams.get("q");
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const sortBy = url.searchParams.get("sortBy") ?? "created_at";
    const sortOrder = (url.searchParams.get("sortOrder") as "asc" | "desc") ?? "desc";
    const nocache = url.searchParams.get("nocache") === "true";

    if (nocache) {
      clearPendingUsersCache({ q, page, limit, sortBy, sortOrder });
    }

    let result = await getCachedPendingUsers({ q, page, limit, sortBy, sortOrder });
    let fromCache = true;

    if (!result) {
      result = await fetchPendingUsers({ q, page, limit, sortBy, sortOrder });
      fromCache = false;
      
      const cacheKey = `pending_users_${q || "all"}_${page}_${limit}_${sortBy}_${sortOrder}`;
      setCachedPendingUsers(cacheKey, result);
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
    console.error("❌ GET /api/admin-apis/users/pending-users error:", err.message);
    return NextResponse.json(
      { error: "Failed to fetch pending users" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;
    
    const allowedRoles = ['super_admin', 'operations_admin', 'support_admin'];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const clientInfo = getClientInfo(req.headers);
    const url = new URL(req.url);
    const userId = url.pathname.split('/').pop();
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const { data: pendingUser, error: fetchError } = await supabaseAdmin
      .from("pending_users")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError || !pendingUser) {
      return NextResponse.json({ error: "Pending user not found" }, { status: 404 });
    }

    // CHECK FOR EXISTING USER BEFORE INSERTING
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .eq("email", pendingUser.email)
      .single();

    if (existingUser) {
      // User already exists - just delete from pending_users
      await supabaseAdmin.from("pending_users").delete().eq("id", userId);
      
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "approve_pending_user_skipped",
        resourceType: "User",
        resourceId: existingUser.id,
        description: `Skipped approval - user already exists: ${pendingUser.email}`,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      });

      return NextResponse.json({
        message: "User already exists in main table",
        user: existingUser,
        skipped: true
      });
    }

    // Proceed with insert if no duplicate
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        email: pendingUser.email,
        full_name: `${pendingUser.first_name || ''} ${pendingUser.last_name || ''}`.trim(),
        phone: pendingUser.phone || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "active",
        is_blocked: false,
        wallet_balance: 0,
        role: "user",
        referral_code: pendingUser.referred_by || null,
        referral_source: pendingUser.referral_source || null,
        bvn_verification: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting user:", insertError);
      return NextResponse.json({ error: "Failed to approve user" }, { status: 500 });
    }

    await supabaseAdmin.from("pending_users").delete().eq("id", userId);

    clearPendingUsersCache();
    clearAdminUsersCache();

    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "approve_pending_user",
      resourceType: "User",
      resourceId: newUser.id,
      description: `Approved pending user: ${pendingUser.email}`,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    return NextResponse.json({
      message: "User approved successfully",
      user: newUser,
    });
  } catch (err: any) {
    console.error("❌ POST /api/admin-apis/users/pending-users/approve error:", err.message);
    return NextResponse.json({ error: "Failed to approve user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;
    
    const allowedRoles = ['super_admin', 'operations_admin', 'support_admin'];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const clientInfo = getClientInfo(req.headers);
    const url = new URL(req.url);
    const userId = url.searchParams.get("id");
    const source = url.searchParams.get("source") || "pending_table";
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    let userEmail = "";
    let rejectionReason = "";

    try {
      const body = await req.json();
      rejectionReason = body.reason || "";
    } catch (e) {}

    if (source === "users_table") {
      const { data: user, error: fetchError } = await supabaseAdmin
        .from("users")
        .select("email")
        .eq("id", userId)
        .single();

      if (fetchError) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      userEmail = user.email;

      const { error: deleteError } = await supabaseAdmin
        .from("users")
        .delete()
        .eq("id", userId);

      if (deleteError) {
        return NextResponse.json({ error: "Failed to reject user" }, { status: 500 });
      }
    } else {
      const { data: pendingUser, error: fetchError } = await supabaseAdmin
        .from("pending_users")
        .select("email")
        .eq("id", userId)
        .single();

      if (fetchError) {
        return NextResponse.json({ error: "Pending user not found" }, { status: 404 });
      }

      userEmail = pendingUser.email;

      const { error: deleteError } = await supabaseAdmin
        .from("pending_users")
        .delete()
        .eq("id", userId);

      if (deleteError) {
        return NextResponse.json({ error: "Failed to reject user" }, { status: 500 });
      }
    }

    clearPendingUsersCache();
    clearAdminUsersCache();

    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "reject_pending_user",
      resourceType: "User",
      resourceId: userId,
      description: `Rejected pending user: ${userEmail}`,
      metadata: { rejectionReason, source },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    return NextResponse.json({
      message: "User rejected successfully",
    });
  } catch (err: any) {
    console.error("❌ DELETE /api/admin-apis/users/pending-users error:", err.message);
    return NextResponse.json({ error: "Failed to reject user" }, { status: 500 });
  }
}