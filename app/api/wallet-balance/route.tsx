import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ENHANCED WALLET BALANCE CACHE
const walletBalanceCache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds - short TTL for frequently changing data

// Track last known balances for safety checks
const lastKnownBalances = new Map();

async function getCachedWalletBalance(userId: string): Promise<number & { _fromCache?: boolean }> {
  const cacheKey = `wallet_balance_${userId}`;
  const cached = walletBalanceCache.get(cacheKey);
  
  // Return cached data if available and not expired
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log("✅ Using cached wallet balance");
    return Object.assign(cached.data, { _fromCache: true });
  }
  
  console.log("🔄 Fetching fresh wallet balance from database");
  
  const { data, error } = await supabase
    .from("users")
    .select("wallet_balance")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("❌ Database error:", error);
    throw new Error("Database query failed");
  }

  if (!data) {
    throw new Error("User not found");
  }

  const balance = data.wallet_balance || 0;

  // Safety check: If balance decreased significantly without cache clearing, log warning
  const lastKnown = lastKnownBalances.get(userId);
  if (lastKnown && balance < lastKnown - 1000) { // If balance dropped by more than 1000
    console.warn(`⚠️ Significant balance decrease detected for user ${userId}: ${lastKnown} -> ${balance}`);
  }

  // Update last known balance
  lastKnownBalances.set(userId, balance);

  // Cache the successful response
  walletBalanceCache.set(cacheKey, {
    data: balance,
    timestamp: Date.now()
  });
  
  return Object.assign(balance, { _fromCache: false });
}

function clearWalletBalanceCache(userId: string) {
  const cacheKey = `wallet_balance_${userId}`;
  const existed = walletBalanceCache.delete(cacheKey);
  
  if (existed) {
    console.log(`🧹 Cleared wallet balance cache for user ${userId}`);
  }
  
  return existed;
}

function clearAllWalletBalanceCache() {
  const count = walletBalanceCache.size;
  walletBalanceCache.clear();
  console.log(`🧹 Cleared all wallet balance cache (${count} entries)`);
}

// Force update balance in cache (useful after transactions)
function updateWalletBalanceCache(userId: string, newBalance: number) {
  const cacheKey = `wallet_balance_${userId}`;
  walletBalanceCache.set(cacheKey, {
    data: newBalance,
    timestamp: Date.now()
  });
  lastKnownBalances.set(userId, newBalance);
  console.log(`💰 Updated wallet balance cache for user ${userId}: ${newBalance}`);
}

// Export for use in other files
async function getWalletBalance(userId: string): Promise<number> {
  const balance = await getCachedWalletBalance(userId);
  // Remove the cache flag before returning
  return typeof balance === 'number' ? balance : (balance as any).valueOf();
}

export async function POST(req: NextRequest) {
  // ✅ Updated to use enhanced auth with refresh
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);
        
  if (!user) {
    console.log("🔴 Unauthorized - No valid user");
    const response = NextResponse.json(
      { error: "Please login to access transactions", logout: true },
      { status: 401 }
    );
    
    if (newTokens) {
      return createAuthResponse(await response.json(), newTokens);
    }
    return response;
  }

  try {
    const { userId, nocache, forceBalance } = await req.json();

    if (!userId) {
      const response = NextResponse.json({ 
        success: false,
        error: "userId is required" 
      }, { status: 400 });
      
      if (newTokens) {
        return createAuthResponse(await response.json(), newTokens);
      }
      return response;
    }

    // ✅ Validate that userId matches authenticated user
    if (userId !== user.id) {
      console.error(`User ID mismatch: ${userId} vs ${user.id}`);
      const response = NextResponse.json(
        { success: false, error: "Unauthorized: User ID mismatch" },
        { status: 403 }
      );
      
      if (newTokens) {
        return createAuthResponse(await response.json(), newTokens);
      }
      return response;
    }

    let wallet_balance: number;

    // If forceBalance is provided, update cache with this value
    if (forceBalance !== undefined) {
      updateWalletBalanceCache(userId, forceBalance);
      wallet_balance = forceBalance;
    } 
    // Clear cache if force refresh requested
    else if (nocache) {
      clearWalletBalanceCache(userId);
      wallet_balance = await getCachedWalletBalance(userId);
    } 
    // Use cached balance
    else {
      wallet_balance = await getCachedWalletBalance(userId);
    }

    // Remove cache flag if present
    const cleanBalance = typeof wallet_balance === 'number' ? wallet_balance : (wallet_balance as any).valueOf();

    const responseData = {
      success: true,
      wallet_balance: cleanBalance,
      currency: "NGN",
      formatted: `₦${cleanBalance.toLocaleString()}`,
      _cache: {
        cached: (wallet_balance as any)._fromCache || false,
        timestamp: Date.now(),
        ttl_seconds: 30,
        expires_in: Math.max(0, 30 - Math.floor((Date.now() - (walletBalanceCache.get(`wallet_balance_${userId}`)?.timestamp || 0)) / 1000))
      }
    };

    // Include new tokens if available
    if (newTokens) {
      return createAuthResponse(responseData, newTokens);
    }

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("❌ Wallet balance error:", err.message);
    
    let errorResponse;
    
    if (err.message === "User not found") {
      errorResponse = NextResponse.json({ 
        success: false,
        error: "User not found" 
      }, { status: 404 });
    } else if (err.message === "Database query failed") {
      errorResponse = NextResponse.json({ 
        success: false,
        error: "Database query failed" 
      }, { status: 500 });
    } else {
      errorResponse = NextResponse.json({
        success: false,
        error: "Internal server error"
      }, { status: 500 });
    }
    
    // Include new tokens in error response if available
    if (newTokens) {
      return createAuthResponse(await errorResponse.json(), newTokens);
    }
    
    return errorResponse;
  }
}