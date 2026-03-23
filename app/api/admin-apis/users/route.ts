// app/api/admin-apis/users/route.ts

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAuditLog, getClientInfo } from "@/lib/audit-log";
import { clearAdminUsersCache, getCachedAdminUsers, setCachedAdminUsers } from "./cache";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fetchAdminUsers({
  q,
  page,
  limit = 20,
  sortBy = "created_at",
  sortOrder = "desc",
}: {
  q: string | null;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

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

  let pendingFromTableCount = 0;
  let pendingFromUsersCount = 0;
  
  try {
    const { count: pendingTableCount, error: pendingTableError } = await supabaseAdmin
      .from("pending_users")
      .select("*", { count: "exact", head: true });
    
    if (!pendingTableError) {
      pendingFromTableCount = pendingTableCount || 0;
    }

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

  return {
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
  };
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

    let result = await getCachedAdminUsers({ q, page, limit, sortBy, sortOrder });
    let fromCache = true;

    if (!result) {
      result = await fetchAdminUsers({ q, page, limit, sortBy, sortOrder });
      fromCache = false;
      
      const cacheKey = `admin_users_${q || "all"}_${page}_${limit}_${sortBy}_${sortOrder}`;
      setCachedAdminUsers(cacheKey, result);
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
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    const clientInfo = getClientInfo(req.headers);

    const userData = await req.json();

    if (!userData.email || !userData.full_name) {
      return NextResponse.json(
        { error: "Email and full name are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .insert({
        ...userData,
        created_by: adminUser?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "create_user",
      resourceType: "User",
      resourceId: data.id,
      description: `Created user: ${data.email}`,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    clearAdminUsersCache();

    return NextResponse.json({
      user: data,
      message: "User created successfully",
    });
  } catch (err: any) {
    console.error("❌ POST /api/admin-apis/users error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    const clientInfo = getClientInfo(req.headers);

    const url = new URL(req.url);
    const userId = url.searchParams.get("id");
    const updates = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Update data is required" }, { status: 400 });
    }

    const { data: user, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("id", userId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: adminUser?.id,
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "update_user",
      resourceType: "User",
      resourceId: userId,
      description: `Updated user: ${user?.email}`,
      metadata: { updatedFields: Object.keys(updates) },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    clearAdminUsersCache();

    return NextResponse.json({
      user: data,
      message: "User updated successfully",
    });
  } catch (err: any) {
    console.error("❌ PATCH /api/admin-apis/users error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    const clientInfo = getClientInfo(req.headers);

    const url = new URL(req.url);
    const userId = url.searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const { data: user, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("id", userId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "delete_user",
      resourceType: "User",
      resourceId: userId,
      description: `Deleted user: ${user?.email}`,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    clearAdminUsersCache();

    return NextResponse.json({
      message: "User deleted successfully",
    });
  } catch (err: any) {
    console.error("❌ DELETE /api/admin-apis/users error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}