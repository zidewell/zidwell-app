// app/api/admin-apis/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from '@/lib/admin-auth';
import { createClient } from "@supabase/supabase-js";
import { createAuditLog, getClientInfo } from "@/lib/audit-log";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AdminTransactionsQuery {
  page: number;
  limit: number;
  range: string;
  search: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  userId?: string;
}

// Define outflow types
const OUTFLOW_TYPES = [
  "withdrawal",
  "transfer",
  "p2p_transfer",
  "airtime",
  "data",
  "electricity",
  "cable",
  "debit",
  "invoice_creation",
  "invoice",
  "contract",
  "tansfer",
];

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

// Cache management
const adminTransactionsCache = new Map();
const ADMIN_TRANSACTIONS_CACHE_TTL = 2 * 60 * 1000;

const transactionsStatsCache = new Map();
const STATS_CACHE_TTL = 5 * 60 * 1000;

function clearAdminTransactionsCache() {
  const count = adminTransactionsCache.size;
  adminTransactionsCache.clear();
  return count;
}

function clearTransactionsStatsCache() {
  const count = transactionsStatsCache.size;
  transactionsStatsCache.clear();
  return count;
}

async function getCachedAdminTransactions({
  page,
  limit,
  range,
  search,
  type,
  status,
  startDate,
  endDate,
  userId,
}: AdminTransactionsQuery) {
  const cacheKey = `admin_transactions_${page}_${limit}_${range}_${search}_${type}_${status}_${startDate}_${endDate}_${userId || 'all'}`;
  const cached = adminTransactionsCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < ADMIN_TRANSACTIONS_CACHE_TTL) {
    return { ...cached.data, _fromCache: true };
  }
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Build query with only needed fields
  let query = supabaseAdmin
    .from("transactions")
    .select(`
      id,
      user_id,
      type,
      amount,
      fee,
      total_deduction,
      status,
      reference,
      created_at,
      provider,
      provider_transaction_id,
      channel,
      description
    `, { count: "exact" })
    .order("created_at", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (search && !userId) {
    query = query.or(`
      reference.ilike.%${search}%,
      user_id.ilike.%${search}%,
      description.ilike.%${search}%,
      phone_number.ilike.%${search}%,
      user_email.ilike.%${search}%,
      user_name.ilike.%${search}%
    `);
  }

  if (type && type !== 'all') {
    query = query.eq("type", type);
  }

  if (status && status !== 'all') {
    query = query.eq("status", status);
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    query = query.gte("created_at", start.toISOString()).lte("created_at", end.toISOString());
  } else {
    const rangeDates = getRangeDates(range);
    if (rangeDates) {
      query = query.gte("created_at", rangeDates.start).lte("created_at", rangeDates.end);
    }
  }

  const { data: transactions, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(`Fetch error: ${error.message}`);
  }

  return {
    page,
    limit,
    total: count || 0,
    range,
    transactions: transactions || [],
    filters: {
      search, type, status, startDate, endDate, userId
    },
    _fromCache: false
  };
}

// Optimized stats using PostgreSQL aggregation
async function getCachedTransactionsStats(range: string = "total", userId?: string) {
  const cacheKey = `transactions_stats_${range}_${userId || 'all'}`;
  const cached = transactionsStatsCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < STATS_CACHE_TTL) {
    return cached.data;
  }

  const rangeDates = getRangeDates(range);
  
  // Build base filter
  let dateFilter = '';
  const params: any[] = [];
  
  if (rangeDates) {
    dateFilter = `created_at >= '${rangeDates.start}' AND created_at <= '${rangeDates.end}'`;
  } else {
    dateFilter = '1=1';
  }
  
  const userFilter = userId ? `AND user_id = '${userId}'` : '';
  const statusFilter = "status";

  // Use PostgreSQL aggregate queries for all stats
  const { data: statsData, error: statsError } = await supabaseAdmin.rpc('get_transaction_stats', {
    date_start: rangeDates ? rangeDates.start : null,
    date_end: rangeDates ? rangeDates.end : null,
    user_id_param: userId || null,
  });

  if (statsError) {
    // Fallback to individual aggregate queries
    const { data: allTx, error: allTxError } = await supabaseAdmin
      .from("transactions")
      .select("status, type, amount, fee, total_deduction, user_id, created_at, description, reference")
      .gt("created_at", rangeDates ? rangeDates.start : '1970-01-01')
      .lte("created_at", rangeDates ? rangeDates.end : new Date().toISOString())
      .eq(userId ? "user_id" : "created_at", userId || "");

    if (allTxError) {
      console.error("Error fetching transactions stats:", allTxError);
      return null;
    }
    
    const transactions = allTx || [];
    
    const typeLower = (t: any) => (t.type || "").toString().toLowerCase();
    const isOutflow = (t: any) => OUTFLOW_TYPES.some(ot => typeLower(t).includes(ot.toLowerCase()));
    
    const userStats: Record<string, {
      total_fee: number;
      total_outflow: number;
      total_inflow: number;
      transaction_count: number;
      successful_transactions: number;
      failed_transactions: number;
      pending_transactions: number;
    }> = {};

    transactions.forEach(t => {
      const userId = t.user_id;
      if (!userId) return;
      
      if (!userStats[userId]) {
        userStats[userId] = {
          total_fee: 0, total_outflow: 0, total_inflow: 0,
          transaction_count: 0, successful_transactions: 0,
          failed_transactions: 0, pending_transactions: 0,
        };
      }

      const feeValue = Number(t.fee) || 0;
      const amountValue = Number(t.amount) || 0;
      const deductionValue = Number(t.total_deduction) || 0;

      if (t.status === "success") {
        userStats[userId].total_fee += feeValue;
        userStats[userId].transaction_count += 1;
        userStats[userId].successful_transactions += 1;
        
        if (isOutflow(t)) {
          userStats[userId].total_outflow += deductionValue > 0 ? deductionValue : amountValue;
        } else {
          userStats[userId].total_inflow += amountValue;
        }
      } else if (t.status === "failed") {
        userStats[userId].failed_transactions += 1;
        userStats[userId].transaction_count += 1;
      } else if (t.status === "pending") {
        userStats[userId].pending_transactions += 1;
        userStats[userId].transaction_count += 1;
      }
    });

    const userStatsArray = Object.entries(userStats).map(([user_id, data]) => ({
      user_id,
      ...data,
      net_flow: data.total_inflow - data.total_outflow
    })).sort((a, b) => b.total_fee - a.total_fee);

    const stats = {
      total: transactions.length,
      successful: transactions.filter(t => t.status === "success").length,
      failed: transactions.filter(t => t.status === "failed").length,
      pending: transactions.filter(t => t.status === "pending").length,
      processing: transactions.filter(t => t.status === "processing").length,
      
      totalAmount: userStatsArray.reduce((s, u) => s + u.total_inflow, 0),
      totalOutflow: userStatsArray.reduce((s, u) => s + u.total_outflow, 0),
      totalInflow: userStatsArray.reduce((s, u) => s + u.total_inflow, 0),
      netFlow: userStatsArray.reduce((s, u) => s + u.total_inflow, 0) - userStatsArray.reduce((s, u) => s + u.total_outflow, 0),
      
      totalFee: userStatsArray.reduce((s, u) => s + u.total_fee, 0),
      averageFeePerUser: userStatsArray.length > 0 ? userStatsArray.reduce((s, u) => s + u.total_fee, 0) / userStatsArray.length : 0,
      userStats: userStatsArray,
      topUsersByFee: userStatsArray.slice(0, 10),
      topUsersByOutflow: [...userStatsArray].sort((a, b) => b.total_outflow - a.total_outflow).slice(0, 10),
      
      byType: transactions.reduce((acc: Record<string, number>, t: any) => {
        acc[t.type] = (acc[t.type] || 0) + 1;
        return acc;
      }, {}),
      
      byStatus: {
        success: transactions.filter(t => t.status === "success").length,
        failed: transactions.filter(t => t.status === "failed").length,
        pending: transactions.filter(t => t.status === "pending").length,
        processing: transactions.filter(t => t.status === "processing").length
      }
    };

    transactionsStatsCache.set(cacheKey, { data: stats, timestamp: Date.now() });
    return stats;
  }

  // Return stats from RPC
  const stats = {
    total: statsData.total,
    successful: statsData.successful,
    failed: statsData.failed,
    pending: statsData.pending,
    processing: statsData.processing || 0,
    totalAmount: statsData.total_inflow,
    totalOutflow: statsData.total_outflow,
    totalInflow: statsData.total_inflow,
    netFlow: statsData.net_flow,
    totalFee: statsData.total_fees,
    averageFeePerUser: statsData.avg_fee_per_user || 0,
    userStats: [],
    topUsersByFee: [],
    topUsersByOutflow: [],
    byType: {},
    byStatus: {
      success: statsData.successful,
      failed: statsData.failed,
      pending: statsData.pending,
      processing: statsData.processing || 0
    }
  };

  transactionsStatsCache.set(cacheKey, { data: stats, timestamp: Date.now() });
  return stats;
}

export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ['super_admin', 'operations_admin', 'finance_admin', 'legal_admin'];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const range = url.searchParams.get("range") ?? "total";
    const search = url.searchParams.get("search") ?? "";
    const type = url.searchParams.get("type") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const startDate = url.searchParams.get("startDate") ?? "";
    const endDate = url.searchParams.get("endDate") ?? "";
    const userId = url.searchParams.get("userId") ?? "";
    const includeStats = url.searchParams.get("includeStats") === "true";
    const nocache = url.searchParams.get("nocache") === "true";

    if (nocache) {
      clearAdminTransactionsCache();
      if (includeStats) clearTransactionsStatsCache();
    }

    const result = await getCachedAdminTransactions({
      page, limit, range, search, type, status, startDate, endDate, userId: userId || undefined
    });

    let stats = null;
    if (includeStats) {
      stats = await getCachedTransactionsStats(range, userId || undefined);
    }

    const { _fromCache, ...cleanResponse } = result;

    return NextResponse.json({
      ...cleanResponse,
      stats,
      _cache: {
        cached: _fromCache,
        timestamp: Date.now(),
        page, limit, range,
        filters: { search, type, status, startDate, endDate, userId },
        includeStats
      },
      _admin: {
        performedBy: adminUser?.email,
        performedAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    console.error("Server error (transactions route):", err);
    
    return NextResponse.json({ 
      error: err?.message?.includes('Fetch error') 
        ? 'Failed to fetch transactions' 
        : err?.message?.includes('Count error')
        ? 'Failed to count transactions'
        : 'Server error'
    }, { status: 500 });
  }
}