// app/api/admin-apis/invoices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAuditLog, getClientInfo } from "@/lib/audit-log";
import { requireAdmin } from "@/lib/admin-auth";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─────────────────────────────────────────────────────────────
// CACHES
// ─────────────────────────────────────────────────────────────
const adminInvoicesCache = new Map<string, { data: any; timestamp: number }>();
const ADMIN_INVOICES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const invoicesStatsCache = new Map<string, { data: any; timestamp: number }>();
const STATS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// ─────────────────────────────────────────────────────────────
// DATE HELPERS
// ─────────────────────────────────────────────────────────────
function getRangeDates(range: string | null) {
  if (!range || range === "total") return null;

  const now = new Date();
  const start = new Date(now);
  let end = new Date(now);

  switch (range) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "week": {
      const day = now.getDay();
      const diffToMonday = (day + 6) % 7;
      start.setDate(now.getDate() - diffToMonday);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setMonth(start.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
    case "year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setFullYear(start.getFullYear() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      return null;
  }

  return { start: start.toISOString(), end: end.toISOString() };
}

// ─────────────────────────────────────────────────────────────
// QUERY TYPE
// ─────────────────────────────────────────────────────────────
interface AdminInvoicesQuery {
  page: number;
  limit: number;
  range: string;
  search: string;
  status: string;
  startDate: string;
  endDate: string;
  includeStats?: boolean;
}

// ─────────────────────────────────────────────────────────────
// CACHE MANAGEMENT
// ─────────────────────────────────────────────────────────────
function clearAdminInvoicesCache(filters?: Partial<AdminInvoicesQuery>) {
  if (filters) {
    const cacheKey = `admin_invoices_${filters.page || 1}_${filters.limit || 10}_${
      filters.range || "total"
    }_${filters.search || ""}_${filters.status || ""}_${
      filters.startDate || ""
    }_${filters.endDate || ""}_${filters.includeStats || false}`;
    const existed = adminInvoicesCache.delete(cacheKey);
    if (existed) {
      console.log(`🧹 Cleared specific admin invoices cache: ${cacheKey}`);
    }
    return existed;
  } else {
    const count = adminInvoicesCache.size;
    adminInvoicesCache.clear();
    console.log(`🧹 Cleared all admin invoices cache (${count} entries)`);
    return count;
  }
}

function clearInvoicesStatsCache(range?: string) {
  if (range) {
    const cacheKey = `invoices_stats_${range}`;
    const existed = invoicesStatsCache.delete(cacheKey);
    if (existed) {
      console.log(`🧹 Cleared invoices stats cache for range: ${range}`);
    }
    return existed;
  } else {
    const count = invoicesStatsCache.size;
    invoicesStatsCache.clear();
    console.log(`🧹 Cleared all invoices stats cache (${count} entries)`);
    return count;
  }
}

function clearAllAdminInvoicesCache() {
  const invoicesCount = clearAdminInvoicesCache();
  const statsCount = clearInvoicesStatsCache();
  console.log(
    `🧹 Cleared all admin invoices cache (${invoicesCount} invoices, ${statsCount} stats)`
  );
  return { invoicesCount, statsCount };
}

// ─────────────────────────────────────────────────────────────
// STATS (cached)
// ─────────────────────────────────────────────────────────────
async function getCachedInvoicesStats(range: string = "total") {
  const cacheKey = `invoices_stats_${range}`;
  const cached = invoicesStatsCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < STATS_CACHE_TTL) {
    console.log("✅ Using cached invoices statistics");
    return cached.data;
  }

  console.log("🔄 Fetching fresh invoices statistics");

  const rangeDates = getRangeDates(range);

  let statsQuery = supabaseAdmin
    .from("invoices")
    .select("status, total_amount, paid_amount, created_at");

  if (rangeDates) {
    statsQuery = statsQuery
      .gte("created_at", rangeDates.start)
      .lte("created_at", rangeDates.end);
  }

  const { data: invoices, error } = await statsQuery;

  if (error) {
    console.error("Error fetching invoices stats:", error);
    return null;
  }

  const stats = {
    total: invoices?.length || 0,
    draft: invoices?.filter((f) => f.status === "draft").length || 0,
    unpaid: invoices?.filter((f) => f.status === "unpaid").length || 0,
    paid: invoices?.filter((f) => f.status === "paid").length || 0,
    overdue: invoices?.filter((f) => f.status === "overdue").length || 0,
    cancelled: invoices?.filter((f) => f.status === "cancelled").length || 0,
    partially_paid:
      invoices?.filter((f) => f.status === "partially_paid").length || 0,
    totalValue:
      invoices?.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0) ||
      0,
    paidValue:
      invoices?.reduce((sum, inv) => sum + (Number(inv.paid_amount) || 0), 0) ||
      0,
    byMonth:
      invoices?.reduce((acc, f) => {
        const date = new Date(f.created_at);
        const monthKey = date.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        acc[monthKey] = (acc[monthKey] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
  };

  invoicesStatsCache.set(cacheKey, {
    data: stats,
    timestamp: Date.now(),
  });

  return stats;
}

// ─────────────────────────────────────────────────────────────
// LIST (cached) — THE FIXED QUERY
// ─────────────────────────────────────────────────────────────
async function getCachedAdminInvoices({
  page,
  limit,
  range,
  search,
  status,
  startDate,
  endDate,
  includeStats = false,
}: AdminInvoicesQuery) {
  const cacheKey = `admin_invoices_${page}_${limit}_${range}_${search}_${status}_${startDate}_${endDate}_${includeStats}`;
  const cached = adminInvoicesCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < ADMIN_INVOICES_CACHE_TTL) {
    console.log("✅ Using cached admin invoices data");
    return { ...cached.data, _fromCache: true };
  }

  console.log("🔄 Fetching fresh admin invoices data from database");

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // ── Only real schema columns — NO initiator_email / signee_email ──
  let query = supabaseAdmin
    .from("invoices")
    .select(
      "id, invoice_id, order_reference, user_id, business_name, from_email, from_name, client_name, client_email, client_phone, bill_to, status, payment_type, fee_option, subtotal, fee_amount, total_amount, paid_amount, issue_date, created_at, paid_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  // Search across columns that actually exist
  if (search) {
    query = query.or(
      `invoice_id.ilike.%${search}%,business_name.ilike.%${search}%,from_email.ilike.%${search}%,from_name.ilike.%${search}%,client_email.ilike.%${search}%,client_name.ilike.%${search}%`
    );
  }

  // Status filter
  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  // Date range filter (custom dates override range)
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    query = query
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString());
  } else {
    const rangeDates = getRangeDates(range);
    if (rangeDates) {
      query = query
        .gte("created_at", rangeDates.start)
        .lte("created_at", rangeDates.end);
    }
  }

  // Count first (with same filters)
  const { data: countData, error: countError, count } = await query;
  const totalCount = count || 0;

  if (countError) {
    throw new Error(`Count error: ${countError.message}`);
  }

  // Then paginate
  query = query.range(from, to);

  const { data: invoices, error } = await query;

  if (error) {
    throw new Error(`Fetch error: ${error.message}`);
  }

  let stats = null;
  if (includeStats) {
    stats = await getCachedInvoicesStats(range);
  }

  const responseData = {
    page,
    limit,
    total: totalCount,
    range,
    invoices: invoices ?? [],
    filters: {
      search,
      status,
      startDate,
      endDate,
    },
    stats,
    _fromCache: false,
  };

  adminInvoicesCache.set(cacheKey, {
    data: responseData,
    timestamp: Date.now(),
  });

  console.log(
    `✅ Cached ${invoices?.length || 0} admin invoices for page ${page}`
  );

  return responseData;
}

// ─────────────────────────────────────────────────────────────
// ADMIN USER HELPER
// ─────────────────────────────────────────────────────────────
async function getAdminUserInfo(cookieHeader: string) {
  try {
    const accessTokenMatch = cookieHeader.match(/sb-access-token=([^;]+)/);
    if (!accessTokenMatch) return null;

    const accessToken = accessTokenMatch[1];
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !user) {
      console.error("Error getting admin user:", error);
      return null;
    }

    return { id: user.id, email: user.email };
  } catch (error) {
    console.error("Error extracting admin user info:", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// GET
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "finance_admin", "operations_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 10);
    const range = url.searchParams.get("range") ?? "total";
    const search = url.searchParams.get("search") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const startDate = url.searchParams.get("startDate") ?? "";
    const endDate = url.searchParams.get("endDate") ?? "";
    const includeStats = url.searchParams.get("includeStats") === "true";
    const nocache = url.searchParams.get("nocache") === "true";

    if (nocache) {
      clearAdminInvoicesCache({
        page,
        limit,
        range,
        search,
        status,
        startDate,
        endDate,
        includeStats,
      });
      if (includeStats) {
        clearInvoicesStatsCache(range);
      }
      console.log(`🔄 Force refreshing admin invoices data`);
    }

    const result = await getCachedAdminInvoices({
      page,
      limit,
      range,
      search,
      status,
      startDate,
      endDate,
      includeStats,
    });

    const { _fromCache, ...cleanResponse } = result;

    return NextResponse.json({
      ...cleanResponse,
      _cache: {
        cached: _fromCache,
        timestamp: Date.now(),
        page,
        limit,
        range,
        filters: { search, status, startDate, endDate },
        includeStats,
      },
    });
  } catch (err: any) {
    console.error("Server error (invoices route):", err);
    return NextResponse.json(
      {
        error: err?.message?.includes("Fetch error")
          ? "Failed to fetch invoices"
          : err?.message?.includes("Count error")
          ? "Failed to count invoices"
          : "Server error",
      },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH — update invoice status
// ─────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "finance_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const clientInfo = getClientInfo(req.headers);
    const { id, status, notes } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "Both 'id' and 'status' are required." },
        { status: 400 }
      );
    }

    const { data: currentInvoice, error: fetchError } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "invoice_update_failed",
        resourceType: "Invoice",
        resourceId: id,
        description: `Failed to update invoice ${id}: Invoice not found`,
        metadata: {
          invoiceId: id,
          attemptedStatus: status,
          error: fetchError.message,
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      });

      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "paid" && currentInvoice.status !== "paid") {
      updateData.paid_at = new Date().toISOString();
    }
    if (notes) {
      updateData.admin_notes = notes;
    }

    const { data, error } = await supabaseAdmin
      .from("invoices")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "invoice_update_failed",
        resourceType: "Invoice",
        resourceId: id,
        description: `Failed to update invoice ${id}: ${error.message}`,
        metadata: {
          invoiceId: id,
          invoiceNumber: currentInvoice.invoice_id,
          attemptedStatus: status,
          previousStatus: currentInvoice.status,
          error: error.message,
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      });

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const updatedInvoice = data?.[0];

    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "update_invoice_status",
      resourceType: "Invoice",
      resourceId: id,
      description: `Updated invoice ${id} status from ${currentInvoice.status} to ${status}`,
      metadata: {
        invoiceId: id,
        invoiceNumber: currentInvoice.invoice_id,
        customerEmail: currentInvoice.client_email,
        previousStatus: currentInvoice.status,
        newStatus: status,
        amount: currentInvoice.total_amount,
        adminNotes: notes,
        updatedBy: adminUser?.email,
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    console.log("🧹 Clearing cache after invoice status update...");
    clearAllAdminInvoicesCache();

    return NextResponse.json({
      message: "Invoice status updated",
      data: updatedInvoice,
      cacheCleared: true,
      auditLogged: true,
    });
  } catch (err: any) {
    console.error("Server error (invoices PATCH):", err);
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "finance_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const clientInfo = getClientInfo(req.headers);
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "'id' is required to delete an invoice." },
        { status: 400 }
      );
    }

    const { data: invoice, error: fetchError } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "invoice_delete_failed",
        resourceType: "Invoice",
        resourceId: id,
        description: `Failed to delete invoice ${id}: Invoice not found`,
        metadata: {
          invoiceId: id,
          error: fetchError.message,
          attemptedBy: adminUser?.email,
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      });

      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from("invoices")
      .delete()
      .eq("id", id);

    if (error) {
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "invoice_delete_failed",
        resourceType: "Invoice",
        resourceId: id,
        description: `Failed to delete invoice ${id}: ${error.message}`,
        metadata: {
          invoiceId: id,
          invoiceNumber: invoice.invoice_id,
          invoiceStatus: invoice.status,
          amount: invoice.total_amount,
          error: error.message,
          attemptedBy: adminUser?.email,
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      });

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "delete_invoice",
      resourceType: "Invoice",
      resourceId: id,
      description: `Deleted invoice ${id}: ${invoice.invoice_id} - ₦${invoice.total_amount}`,
      metadata: {
        invoiceId: id,
        invoiceNumber: invoice.invoice_id,
        invoiceStatus: invoice.status,
        customerEmail: invoice.client_email,
        amount: invoice.total_amount,
        deletedBy: adminUser?.email,
        deletionTime: new Date().toISOString(),
        createdAt: invoice.created_at,
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    console.log("🧹 Clearing cache after invoice deletion...");
    clearAllAdminInvoicesCache();

    return NextResponse.json({
      message: "Invoice deleted successfully",
      cacheCleared: true,
      auditLogged: true,
    });
  } catch (err: any) {
    console.error("Server error (invoices DELETE):", err);
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// POST — create invoice
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "finance_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const clientInfo = getClientInfo(req.headers);
    const invoiceData = await req.json();

    if (!invoiceData.invoice_id || !invoiceData.total_amount) {
      return NextResponse.json(
        { error: "Invoice ID and total amount are required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("invoices")
      .insert({
        ...invoiceData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "invoice_creation_failed",
        resourceType: "Invoice",
        description: `Failed to create invoice: ${error.message}`,
        metadata: {
          invoiceData,
          error: error.message,
          attemptedBy: adminUser?.email,
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      });

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "create_invoice",
      resourceType: "Invoice",
      resourceId: data.id,
      description: `Created new invoice ${data.invoice_id}: ₦${data.total_amount}`,
      metadata: {
        invoiceId: data.id,
        invoiceNumber: data.invoice_id,
        customerEmail: data.client_email,
        amount: data.total_amount,
        status: data.status,
        createdBy: adminUser?.email,
        creationTime: new Date().toISOString(),
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    console.log("🧹 Clearing cache after invoice creation...");
    clearAllAdminInvoicesCache();

    return NextResponse.json({
      message: "Invoice created successfully",
      data,
      cacheCleared: true,
      auditLogged: true,
    });
  } catch (err: any) {
    console.error("Server error (invoices POST):", err);
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}