import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticated } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ENHANCED TRANSACTIONS CACHE
const transactionsCache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

async function getCachedTransactions(userId: string, search: string = "") {
  const cacheKey = `transactions_${userId}_${search.toLowerCase()}`;
  const cached = transactionsCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log("✅ Using cached transactions");
    return cached.data;
  }
  
  console.log("🔄 Fetching fresh transactions from database");
  
  let query = supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (search) {
    query = query.ilike("type", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Cache the results
  if (data) {
    transactionsCache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
    
    // Log cache stats occasionally
    if (Math.random() < 0.1) { // 10% chance
      console.log(`📊 Transactions cache size: ${transactionsCache.size}`);
    }
  }
  
  return data;
}

// Move cache clearing function to a separate utility file or make it internal
function clearTransactionsCache(userId: string) {
  const keysToDelete = [];
  for (const [key] of transactionsCache) {
    if (key.startsWith(`transactions_${userId}`)) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => transactionsCache.delete(key));
  console.log(`🧹 Cleared ${keysToDelete.length} transaction cache entries for user ${userId}`);
}

// Optional: Periodic cache cleanup
function cleanupExpiredCache() {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, value] of transactionsCache) {
    if (now - value.timestamp > CACHE_TTL) {
      transactionsCache.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned ${cleanedCount} expired cache entries`);
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredCache, 5 * 60 * 1000);
}

// Add pagination support to your GET function
export async function GET(req: NextRequest) {
   const user = await isAuthenticated(req);
      
      if (!user) {
        return NextResponse.json(
          { error: "Please login to access transactions" },
          { status: 401 }
        );
      }
  
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const search = searchParams.get("search") || "";
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    let query = supabase
      .from("transactions")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply date range filter if provided
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      
      query = query
        .gte("created_at", fromDate.toISOString())
        .lte("created_at", toDate.toISOString());
    }

    // Apply search filter if provided
    if (search) {
      query = query.or(`description.ilike.%${search}%,type.ilike.%${search}%,reference.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({ 
      transactions: data || [],
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > offset + limit
    });
  } catch (error: any) {
    console.error("❌ API Error:", error.message);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}