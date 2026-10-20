// app/api/admin-apis/transactions/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OUTFLOW_TYPES = [
  "withdrawal",
  "transfer",
  "tansfer", // legacy typo in data
  "p2p_transfer",
  "airtime",
  "data",
  "electricity",
  "cable",
  "debit",
  "invoice_creation",
  "contract",
  "fee",
];

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes
const cache = new Map<string, { data: any; timestamp: number }>();

function isCacheValid(t: number) {
  return Date.now() - t < CACHE_TTL;
}

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
    case "week":
      start.setDate(now.getDate() - 7);
      break;
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

// ─── Compute stats from the full result set ───
// Called once per request (not per page) so totals reflect ALL transactions
// matching the filter, not just the current page.
async function computeStats(
  range: string,
  userId?: string,
  search?: string,
  status?: string,
  type?: string
) {
  const rangeDates = getRangeDates(range);

  let q = supabaseAdmin
    .from("transactions")
    .select("amount, fee, total_deduction, type, status");

  if (rangeDates) {
    q = q.gte("created_at", rangeDates.start).lte("created_at", rangeDates.end);
  }
  if (userId) q = q.eq("user_id", userId);
  if (status && status !== "all") q = q.eq("status", status);
  if (type && type !== "all") q = q.eq("type", type);
  if (search) {
    q = q.or(
      `reference.ilike.%${search}%,description.ilike.%${search}%,narration.ilike.%${search}%`
    );
  }

  const { data: txs, error } = await q;
  if (error) throw error;
  const rows = txs || [];

  let totalVolume = 0;
  let totalInflow = 0;
  let totalOutflow = 0;
  let totalFee = 0;
  let successful = 0;
  let failed = 0;
  let pending = 0;

  for (const t of rows) {
    const amt = Number(t.amount) || 0;
    const fee = Number(t.fee) || 0;
    const ded = Number(t.total_deduction) || 0;
    const typeLower = String(t.type ?? "").toLowerCase();
    const isOutflow = OUTFLOW_TYPES.some((o) => typeLower.includes(o));

    if (t.status === "success") {
      successful++;
      totalFee += fee;
      if (isOutflow) {
        // For outflow, the "true cost" is total_deduction (amount + fee)
        totalOutflow += ded > 0 ? ded : amt;
      } else {
        totalInflow += amt;
      }
      // Volume = sum of every successful txn amount (in + out)
      totalVolume += amt;
    } else if (t.status === "failed") {
      failed++;
    } else if (t.status === "pending" || t.status === "processing") {
      pending++;
    }
  }

  return {
    total: rows.length,
    successful,
    failed,
    pending,
    totalVolume,
    totalInflow,
    totalOutflow,
    totalFee,
    averageFee: successful > 0 ? totalFee / successful : 0,
    // Legacy field names kept so old consumers don't break
    totalAmount: totalInflow,
    netFlow: totalInflow - totalOutflow,
  };
}

export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = [
      "super_admin",
      "operations_admin",
      "finance_admin",
      "legal_admin",
    ];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const range = url.searchParams.get("range") ?? "total";
    const search = url.searchParams.get("search") ?? "";
    const type = url.searchParams.get("type") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const userId = url.searchParams.get("userId") ?? "";
    const includeStats = url.searchParams.get("includeStats") === "true";
    const nocache = url.searchParams.get("nocache") === "true";

    const cacheKey = `tx:${page}:${limit}:${range}:${search}:${type}:${status}:${userId}:${includeStats}`;

    if (nocache) cache.delete(cacheKey);
    const cached = cache.get(cacheKey);
    if (cached && isCacheValid(cached.timestamp)) {
      return NextResponse.json(cached.data);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let q = supabaseAdmin
      .from("transactions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (userId) q = q.eq("user_id", userId);
    if (search) {
      q = q.or(
        `reference.ilike.%${search}%,description.ilike.%${search}%,narration.ilike.%${search}%`
      );
    }
    if (type && type !== "all") q = q.eq("type", type);
    if (status && status !== "all") q = q.eq("status", status);

    const rangeDates = getRangeDates(range);
    if (rangeDates) {
      q = q
        .gte("created_at", rangeDates.start)
        .lte("created_at", rangeDates.end);
    }

    const { data: transactions, error, count } = await q.range(from, to);
    if (error) throw error;

    const stats = includeStats
      ? await computeStats(range, userId || undefined, search, status, type)
      : undefined;

    const responseData = {
      transactions: transactions ?? [],
      data: transactions ?? [],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
      ...(stats ? { stats } : {}),
    };

    cache.set(cacheKey, { data: responseData, timestamp: Date.now() });
    if (cache.size > 100) {
      const oldest = cache.keys().next().value;
      if (oldest) cache.delete(oldest);
    }

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("Transactions API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}