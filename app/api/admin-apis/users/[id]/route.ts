// app/api/admin-apis/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";
import { createAuditLog, getClientInfo } from "@/lib/audit-log";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─────────────────────────────────────────────────────────────
// CACHE (2-min TTL)
// ─────────────────────────────────────────────────────────────
const adminUsersCache = new Map<string, { data: any; timestamp: number }>();
const ADMIN_USERS_CACHE_TTL = 2 * 60 * 1000;

function clearAdminUsersCache() {
  const count = adminUsersCache.size;
  adminUsersCache.clear();
  if (count > 0) console.log(`🧹 Cleared users cache (${count} entries)`);
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function buildCacheKey(params: Record<string, string>): string {
  return Object.entries(params)
    .sort()
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}

// ─────────────────────────────────────────────────────────────
// GET — list users with filters
// ─────────────────────────────────────────────────────────────
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

    // ── Read ALL filter params ──
    const page = Math.max(Number(url.searchParams.get("page") ?? 1), 1);
    const limit = Math.min(
      Math.max(Number(url.searchParams.get("limit") ?? 20), 1),
      100,
    );
    const search = url.searchParams.get("search") ?? "";
    const category = url.searchParams.get("category") ?? "all";
    const roleFilter = url.searchParams.get("role") ?? "";
    const statusFilter = url.searchParams.get("filter_status") ?? "";
    const kycFilter = url.searchParams.get("kyc") ?? "";
    const emailVerifiedFilter = url.searchParams.get("email_verified") ?? "";
    const includeStats = url.searchParams.get("includeStats") === "true";
    const nocache = url.searchParams.get("nocache") === "true";

    // ── Cache check ──
    const cacheKey = buildCacheKey({
      page: String(page),
      limit: String(limit),
      search,
      category,
      role: roleFilter,
      filter_status: statusFilter,
      kyc: kycFilter,
      email_verified: emailVerifiedFilter,
      includeStats: String(includeStats),
    });

    if (!nocache) {
      const cached = adminUsersCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < ADMIN_USERS_CACHE_TTL) {
        return NextResponse.json({ ...cached.data, _fromCache: true });
      }
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // ── Build main query ──
    // IMPORTANT: Whitelist columns — never select("*") on users (PII-heavy)
    let query = supabaseAdmin
      .from("users")
      .select(
        [
          "id",
          "email",
          "full_name",
          "first_name",
          "last_name",
          "phone",
          "wallet_balance",
          "zidcoin_balance",
          "admin_role",
          "bvn_verification",
          "nin_verification",
          "email_verified",
          "is_blocked",
          "blocked_at",
          "block_reason",
          "suspension_duration",
          "is_flagged",
          "flag_reason",
          "flag_notes",
          "flagged_at",
          "wallet_frozen",
          "wallet_freeze_reason",
          "wallet_frozen_at",
          "created_at",
          "updated_at",
          "last_login",
          "last_logout",
          "kyc_approved_at",
          "kyc_rejected_at",
          "referral_code",
          "referred_by",
          "referral_source",
          "city",
          "state",
          "country",
          "purpose",
          "heard_from",
        ].join(", "),
        { count: "exact" },
      );

    // ── Apply CATEGORY filter (from KPI cards) ──
    if (category === "verified") {
      query = query.in("bvn_verification", ["verified", "approved"]);
    } else if (category === "unverified") {
      query = query.eq("email_verified", false);
    } else if (category === "pending_kyc") {
      query = query.in("bvn_verification", ["pending", "not_submitted"]);
    }
    // "all" → no filter

    // ── Apply SEARCH ──
    if (search) {
      const cleaned = search.replace(/[%_]/g, "");
      if (cleaned) {
        query = query.or(
          [
            `email.ilike.%${cleaned}%`,
            `full_name.ilike.%${cleaned}%`,
            `first_name.ilike.%${cleaned}%`,
            `last_name.ilike.%${cleaned}%`,
            `phone.ilike.%${cleaned}%`,
          ].join(","),
        );
      }
    }

    // ── Apply ROLE filter ──
    if (roleFilter && roleFilter !== "all") {
      if (roleFilter === "user") {
        query = query.is("admin_role", null);
      } else {
        query = query.eq("admin_role", roleFilter);
      }
    }

    // ── Apply STATUS filter (Active / Blocked) ──
    if (statusFilter === "active") {
      query = query.eq("is_blocked", false);
    } else if (statusFilter === "blocked") {
      query = query.eq("is_blocked", true);
    }

    // ── Apply KYC filter ──
    if (kycFilter && kycFilter !== "all") {
      if (kycFilter === "verified") {
        query = query.in("bvn_verification", ["verified", "approved"]);
      } else if (kycFilter === "pending") {
        query = query.in("bvn_verification", ["pending", "not_submitted"]);
      } else if (kycFilter === "rejected") {
        query = query.eq("bvn_verification", "rejected");
      } else {
        query = query.eq("bvn_verification", kycFilter);
      }
    }

    // ── Apply EMAIL VERIFIED filter ──
    if (emailVerifiedFilter === "true") {
      query = query.eq("email_verified", true);
    } else if (emailVerifiedFilter === "false") {
      query = query.eq("email_verified", false);
    }

    // ── Order + paginate ──
    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data: users, error, count } = await query;

    if (error) {
      console.error("[users GET] query failed:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch users" },
        { status: 500 },
      );
    }

    const total = count ?? 0;

    // ── STATS — always from UNFILTERED totals so KPI cards stay stable ──
    let stats: {
      total: number;
      verified: number;
      unverified: number;
      pendingKyc: number;
      blocked: number;
      flagged: number;
      frozen: number;
    } | undefined;

    if (includeStats) {
      const [
        { count: totalCount },
        { count: verifiedCount },
        { count: unverifiedCount },
        { count: pendingKycCount },
        { count: blockedCount },
        { count: flaggedCount },
        { count: frozenCount },
      ] = await Promise.all([
        supabaseAdmin
          .from("users")
          .select("*", { count: "exact", head: true }),
        supabaseAdmin
          .from("users")
          .select("*", { count: "exact", head: true })
          .in("bvn_verification", ["verified", "approved"]),
        supabaseAdmin
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("email_verified", false),
        supabaseAdmin
          .from("users")
          .select("*", { count: "exact", head: true })
          .in("bvn_verification", ["pending", "not_submitted"]),
        supabaseAdmin
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("is_blocked", true),
        supabaseAdmin
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("is_flagged", true),
        supabaseAdmin
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("wallet_frozen", true),
      ]);

      stats = {
        total: totalCount ?? 0,
        verified: verifiedCount ?? 0,
        unverified: unverifiedCount ?? 0,
        pendingKyc: pendingKycCount ?? 0,
        blocked: blockedCount ?? 0,
        flagged: flaggedCount ?? 0,
        frozen: frozenCount ?? 0,
      };
    }

    // ── Build response ──
    const responseData = {
      users: users ?? [],
      total,
      page,
      perPage: limit,
      totalPages: Math.ceil(total / limit),
      stats,
      filters: {
        search,
        category,
        role: roleFilter,
        filter_status: statusFilter,
        kyc: kycFilter,
        email_verified: emailVerifiedFilter,
      },
    };

    // ── Cache ──
    adminUsersCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
    });

    // ── Audit log (only for admin reads — logged once per filtered view) ──
    try {
      const clientInfo = getClientInfo(req.headers);
      await createAuditLog({
        userId: adminUser.id,
        userEmail: adminUser.email,
        action: "view_users_list",
        resourceType: "User",
        description: `Viewed users list (${total} results)`,
        metadata: {
          page,
          limit,
          filters: {
            search,
            category,
            role: roleFilter,
            status: statusFilter,
            kyc: kycFilter,
            email_verified: emailVerifiedFilter,
          },
          resultCount: users?.length ?? 0,
          totalCount: total,
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      });
    } catch (auditErr) {
      // Never fail the request due to audit log
      console.error("[users GET] audit log failed:", auditErr);
    }

    const response = NextResponse.json(responseData);

    if (nocache) {
      response.headers.set("Cache-Control", "no-store, max-age=0");
    }

    return response;
  } catch (err: any) {
    console.error("[users GET] error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────────────────────
// POST — create user (admin only)
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const clientInfo = getClientInfo(req.headers);
    const body = await req.json();

    // Validate
    if (!body.email || !body.full_name) {
      return NextResponse.json(
        { error: "Email and full name are required" },
        { status: 400 },
      );
    }

    // Check for existing user
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .eq("email", body.email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        {
          error: "A user with this email already exists",
          existingUserId: existingUser.id,
        },
        { status: 409 },
      );
    }

    // Create in auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        email_confirm: true,
        password: body.password || undefined,
        user_metadata: {
          full_name: body.full_name,
          first_name: body.first_name || body.full_name.split(" ")[0],
          last_name:
            body.last_name || body.full_name.split(" ").slice(1).join(" "),
        },
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Failed to create auth user" },
        { status: 500 },
      );
    }

    // Create users row
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        id: authData.user.id,
        email: body.email,
        full_name: body.full_name,
        first_name: body.first_name || body.full_name.split(" ")[0],
        last_name:
          body.last_name || body.full_name.split(" ").slice(1).join(" "),
        phone: body.phone || "",
        wallet_balance: 0,
        zidcoin_balance: 0,
        admin_role: body.admin_role || null,
        bvn_verification: body.bvn_verification || "not_submitted",
        email_verified: body.email_verified ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      // Rollback auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 },
      );
    }

    // Audit
    await createAuditLog({
      userId: adminUser.id,
      userEmail: adminUser.email,
      action: "create_user",
      resourceType: "User",
      resourceId: newUser.id,
      description: `Created user: ${newUser.email}`,
      metadata: {
        newUserId: newUser.id,
        email: newUser.email,
        admin_role: newUser.admin_role,
        performedBy: adminUser.email,
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    clearAdminUsersCache();

    return NextResponse.json({
      user: newUser,
      message: "User created successfully",
    });
  } catch (err: any) {
    console.error("[users POST] error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH — update user
// ─────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const clientInfo = getClientInfo(req.headers);
    const url = new URL(req.url);
    const userId = url.searchParams.get("id");
    const updates = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Update data is required" },
        { status: 400 },
      );
    }

    // Whitelist editable fields
    const allowedFields = [
      "full_name",
      "first_name",
      "last_name",
      "phone",
      "email",
      "admin_role",
      "bvn_verification",
      "email_verified",
      "is_blocked",
      "is_flagged",
      "wallet_frozen",
    ];

    const filteredUpdates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in updates) filteredUpdates[key] = updates[key];
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    // Check existing
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("id, email, admin_role")
      .eq("id", userId)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent changing own admin_role
    if (
      userId === adminUser.id &&
      filteredUpdates.admin_role !== undefined &&
      filteredUpdates.admin_role !== existingUser.admin_role
    ) {
      return NextResponse.json(
        { error: "Cannot modify your own admin role" },
        { status: 400 },
      );
    }

    // Check email uniqueness if changing
    if (filteredUpdates.email && filteredUpdates.email !== existingUser.email) {
      const { data: dup } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", filteredUpdates.email)
        .neq("id", userId)
        .maybeSingle();

      if (dup) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 },
        );
      }
    }

    // Apply update
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        ...filteredUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 },
      );
    }

    // Audit
    await createAuditLog({
      userId: adminUser.id,
      userEmail: adminUser.email,
      action: "update_user",
      resourceType: "User",
      resourceId: userId,
      description: `Updated user: ${existingUser.email}`,
      metadata: {
        updatedFields: Object.keys(filteredUpdates),
        previous: existingUser,
        new: updatedUser,
        performedBy: adminUser.email,
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    clearAdminUsersCache();

    return NextResponse.json({
      user: updatedUser,
      message: "User updated successfully",
    });
  } catch (err: any) {
    console.error("[users PATCH] error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE — remove user
// ─────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const clientInfo = getClientInfo(req.headers);
    const url = new URL(req.url);
    const userId = url.searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (userId === adminUser.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 },
      );
    }

    const { data: user, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete from auth (cascades to users via FK)
    const { error: authDeleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      // Fallback: delete from users directly
      const { error: dbDeleteError } = await supabaseAdmin
        .from("users")
        .delete()
        .eq("id", userId);

      if (dbDeleteError) {
        return NextResponse.json(
          { error: dbDeleteError.message },
          { status: 500 },
        );
      }
    }

    // Audit
    await createAuditLog({
      userId: adminUser.id,
      userEmail: adminUser.email,
      action: "delete_user",
      resourceType: "User",
      resourceId: userId,
      description: `Deleted user: ${user.email}`,
      metadata: {
        deletedEmail: user.email,
        performedBy: adminUser.email,
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    clearAdminUsersCache();

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (err: any) {
    console.error("[users DELETE] error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
