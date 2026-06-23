// app/api/admin-apis/users/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAuditLog, getClientInfo } from "@/lib/audit-log";
import { clearAdminUsersCache, getCachedAdminUsers, setCachedAdminUsers, AdminUsersQuery } from "./cache";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fetchAdminUsers(query: AdminUsersQuery) {
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
    low_threshold = 1000,
    high_threshold = 100000,
  } = query;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // ✅ Build base query
  let baseQuery = supabaseAdmin
    .from("users")
    .select("*", { count: "exact" });

  // ✅ Apply KYC status filter
  if (status === "verified") {
    baseQuery = baseQuery.in("bvn_verification", ["verified", "approved"]);
  } else if (status === "pending") {
    baseQuery = baseQuery.in("bvn_verification", ["not_submitted", "pending", null]);
  }

  // ✅ Apply search filter
  if (q) {
    baseQuery = baseQuery.or(
      `full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
    );
  }

  // ✅ Apply filter_status (blocked/active)
  if (filter_status === "active") {
    baseQuery = baseQuery.eq("is_blocked", false);
  } else if (filter_status === "blocked") {
    baseQuery = baseQuery.eq("is_blocked", true);
  }

  // ✅ Apply role filter
  if (role !== "all") {
    if (role === "user") {
      baseQuery = baseQuery.is("admin_role", null).or('admin_role.eq."user"');
    } else {
      baseQuery = baseQuery.eq("admin_role", role);
    }
  }

  // ✅ Apply activity filter (based on last_login)
  if (activity !== "all") {
    const now = new Date();
    if (activity === "active") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      baseQuery = baseQuery.gte("last_login", thirtyDaysAgo.toISOString());
    } else if (activity === "today") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      baseQuery = baseQuery.gte("last_login", today.toISOString());
    } else if (activity === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      baseQuery = baseQuery.gte("last_login", weekAgo.toISOString());
    } else if (activity === "inactive") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      baseQuery = baseQuery.lt("last_login", thirtyDaysAgo.toISOString()).or(`last_login.is.null`);
    }
  }

  // ✅ Apply balance filter
  if (balance !== "all") {
    if (balance === "high") {
      baseQuery = baseQuery.gte("wallet_balance", high_threshold);
    } else if (balance === "low") {
      baseQuery = baseQuery.lte("wallet_balance", low_threshold).gte("wallet_balance", 0);
    } else if (balance === "negative") {
      baseQuery = baseQuery.lt("wallet_balance", 0);
    } else if (balance === "zero") {
      baseQuery = baseQuery.eq("wallet_balance", 0);
    }
  }

  // ✅ Apply sorting and pagination
  const { data: usersData, error: usersError, count: usersCount } = await baseQuery
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(from, to);

  if (usersError) {
    throw new Error(`Users fetch error: ${usersError.message}`);
  }

  // ✅ Get counts for stats - BOTH verified and pending with filters applied
  let verifiedQuery = supabaseAdmin
    .from("users")
    .select("*", { count: "exact", head: true })
    .in("bvn_verification", ["verified", "approved"]);

  let pendingQuery = supabaseAdmin
    .from("users")
    .select("*", { count: "exact", head: true })
    .in("bvn_verification", ["not_submitted", "pending", null]);

  // Apply search and other filters to stats
  if (q) {
    verifiedQuery = verifiedQuery.or(
      `full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
    );
    pendingQuery = pendingQuery.or(
      `full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
    );
  }

  if (filter_status === "active") {
    verifiedQuery = verifiedQuery.eq("is_blocked", false);
    pendingQuery = pendingQuery.eq("is_blocked", false);
  } else if (filter_status === "blocked") {
    verifiedQuery = verifiedQuery.eq("is_blocked", true);
    pendingQuery = pendingQuery.eq("is_blocked", true);
  }

  if (role !== "all") {
    if (role === "user") {
      verifiedQuery = verifiedQuery.is("admin_role", null).or('admin_role.eq."user"');
      pendingQuery = pendingQuery.is("admin_role", null).or('admin_role.eq."user"');
    } else {
      verifiedQuery = verifiedQuery.eq("admin_role", role);
      pendingQuery = pendingQuery.eq("admin_role", role);
    }
  }

  if (activity !== "all") {
    const now = new Date();
    if (activity === "active") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      verifiedQuery = verifiedQuery.gte("last_login", thirtyDaysAgo.toISOString());
      pendingQuery = pendingQuery.gte("last_login", thirtyDaysAgo.toISOString());
    } else if (activity === "today") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      verifiedQuery = verifiedQuery.gte("last_login", today.toISOString());
      pendingQuery = pendingQuery.gte("last_login", today.toISOString());
    } else if (activity === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      verifiedQuery = verifiedQuery.gte("last_login", weekAgo.toISOString());
      pendingQuery = pendingQuery.gte("last_login", weekAgo.toISOString());
    } else if (activity === "inactive") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      verifiedQuery = verifiedQuery.lt("last_login", thirtyDaysAgo.toISOString()).or(`last_login.is.null`);
      pendingQuery = pendingQuery.lt("last_login", thirtyDaysAgo.toISOString()).or(`last_login.is.null`);
    }
  }

  if (balance !== "all") {
    if (balance === "high") {
      verifiedQuery = verifiedQuery.gte("wallet_balance", high_threshold);
      pendingQuery = pendingQuery.gte("wallet_balance", high_threshold);
    } else if (balance === "low") {
      verifiedQuery = verifiedQuery.lte("wallet_balance", low_threshold).gte("wallet_balance", 0);
      pendingQuery = pendingQuery.lte("wallet_balance", low_threshold).gte("wallet_balance", 0);
    } else if (balance === "negative") {
      verifiedQuery = verifiedQuery.lt("wallet_balance", 0);
      pendingQuery = pendingQuery.lt("wallet_balance", 0);
    } else if (balance === "zero") {
      verifiedQuery = verifiedQuery.eq("wallet_balance", 0);
      pendingQuery = pendingQuery.eq("wallet_balance", 0);
    }
  }

  const [verifiedResult, pendingResult] = await Promise.all([
    verifiedQuery,
    pendingQuery
  ]);

  return {
    users: usersData || [],
    total: usersCount || 0,
    page,
    perPage: limit,
    stats: {
      verified: verifiedResult.count || 0,
      pending_kyc: pendingResult.count || 0,
      total: (verifiedResult.count || 0) + (pendingResult.count || 0),
    },
    search: q || null,
    sort: {
      by: sortBy,
      order: sortOrder,
    },
    filters: {
      status: filter_status,
      role,
      activity,
      balance,
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
    
    // ✅ Get all filter parameters
    const query: AdminUsersQuery = {
      q: url.searchParams.get("q"),
      page: Number(url.searchParams.get("page") ?? 1),
      limit: Number(url.searchParams.get("limit") ?? 20),
      sortBy: url.searchParams.get("sortBy") ?? "created_at",
      sortOrder: (url.searchParams.get("sortOrder") as "asc" | "desc") ?? "desc",
      status: url.searchParams.get("status") ?? "all",
      filter_status: url.searchParams.get("filter_status") ?? "all",
      role: url.searchParams.get("role") ?? "all",
      activity: url.searchParams.get("activity") ?? "all",
      balance: url.searchParams.get("balance") ?? "all",
      low_threshold: Number(url.searchParams.get("low_threshold") ?? 1000),
      high_threshold: Number(url.searchParams.get("high_threshold") ?? 100000),
    };

    const nocache = url.searchParams.get("nocache") === "true";

    console.log("🔍 API Request with filters:", query);

    if (nocache) {
      clearAdminUsersCache(query);
      console.log(`🔄 Force refreshing admin users data`);
    }

    let result = await getCachedAdminUsers(query);
    let fromCache = true;

    if (!result) {
      result = await fetchAdminUsers(query);
      fromCache = false;
      
      // Generate cache key
      const cacheKey = `admin_users_${query.q || "all"}_${query.page}_${query.limit}_${query.sortBy}_${query.sortOrder}_${query.status}_${query.filter_status}_${query.role}_${query.activity}_${query.balance}`;
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

    // Check for existing user
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .eq("email", userData.email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists", existingUser: true },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .insert({
        ...userData,
        created_by: adminUser?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        bvn_verification: userData.bvn_verification || "pending",
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

    // If updating email, check for duplicates
    if (updates.email) {
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("id, email")
        .eq("email", updates.email)
        .neq("id", userId)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 }
        );
      }
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