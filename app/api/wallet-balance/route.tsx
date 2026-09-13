// app/api/wallet-balance/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// FIXES:
//  1. Removed `Object.assign(balance, { _fromCache })` — that pattern
//     mutates a primitive number which does nothing useful and can
//     cause subtle bugs when the caller inspects the returned value.
//     Replaced with a proper `{ value, fromCache }` shape internally.
//  2. Cache key is namespaced by user ID (unchanged) and evicts
//     correctly on force-refresh.
//  3. Preserves the existing external API contract for the client:
//     the endpoint still returns `{ success, wallet_balance, ... }`.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CachedBalance {
  value: number;
  timestamp: number;
}

const CACHE_TTL = 30 * 1000;
const walletBalanceCache = new Map<string, CachedBalance>();
const lastKnownBalances = new Map<string, number>();

async function getCachedWalletBalance(
  userId: string
): Promise<{ value: number; fromCache: boolean }> {
  const cacheKey = `wallet_balance_${userId}`;
  const cached = walletBalanceCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { value: cached.value, fromCache: true };
  }

  const { data, error } = await supabase
    .from("users")
    .select("wallet_balance")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("❌ Database error:", error);
    throw new Error("Database query failed");
  }
  if (!data) throw new Error("User not found");

  const balance = Number(data.wallet_balance) || 0;

  const lastKnown = lastKnownBalances.get(userId);
  if (lastKnown != null && balance < lastKnown - 1000) {
    console.warn(
      `⚠️ Significant balance decrease for user ${userId}: ${lastKnown} → ${balance}`
    );
  }
  lastKnownBalances.set(userId, balance);

  walletBalanceCache.set(cacheKey, { value: balance, timestamp: Date.now() });

  return { value: balance, fromCache: false };
}

function clearWalletBalanceCache(userId: string) {
  walletBalanceCache.delete(`wallet_balance_${userId}`);
}

function updateWalletBalanceCache(userId: string, newBalance: number) {
  walletBalanceCache.set(`wallet_balance_${userId}`, {
    value: newBalance,
    timestamp: Date.now(),
  });
  lastKnownBalances.set(userId, newBalance);
}

export async function POST(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    const response = NextResponse.json(
      { error: "Please login to access wallet", logout: true },
      { status: 401 }
    );
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { userId, nocache, forceBalance } = body;

    if (!userId) {
      const response = NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    if (userId !== user.id) {
      console.error(`User ID mismatch: ${userId} vs ${user.id}`);
      const response = NextResponse.json(
        { success: false, error: "Unauthorized: User ID mismatch" },
        { status: 403 }
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    let wallet_balance: number;
    let fromCache = false;

    if (forceBalance !== undefined) {
      updateWalletBalanceCache(userId, forceBalance);
      wallet_balance = forceBalance;
    } else if (nocache) {
      clearWalletBalanceCache(userId);
      const result = await getCachedWalletBalance(userId);
      wallet_balance = result.value;
      fromCache = result.fromCache;
    } else {
      const result = await getCachedWalletBalance(userId);
      wallet_balance = result.value;
      fromCache = result.fromCache;
    }

    const responseData = {
      success: true,
      wallet_balance,
      currency: "NGN",
      formatted: `₦${wallet_balance.toLocaleString()}`,
      _cache: {
        cached: fromCache,
        timestamp: Date.now(),
        ttl_seconds: 30,
        expires_in: Math.max(
          0,
          30 -
            Math.floor(
              (Date.now() -
                (walletBalanceCache.get(`wallet_balance_${userId}`)
                  ?.timestamp || 0)) /
                1000
            )
        ),
      },
    };

    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("❌ Wallet balance error:", err.message);

    let status = 500;
    let errorMessage = "Internal server error";
    if (err.message === "User not found") {
      status = 404;
      errorMessage = "User not found";
    } else if (err.message === "Database query failed") {
      status = 500;
      errorMessage = "Database query failed";
    }

    const errorResponse = {
      success: false,
      error: errorMessage,
    };

    if (newTokens) return createAuthResponse(errorResponse, newTokens);
    return NextResponse.json(errorResponse, { status });
  }
}