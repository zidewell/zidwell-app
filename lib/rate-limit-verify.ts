// lib/rate-limit-verify.ts
// ─────────────────────────────────────────────────────────────
// Supabase-backed per-user rate limiter.
// Works on Vercel multi-instance (unlike in-memory Maps).
// ─────────────────────────────────────────────────────────────

import { getSupabaseAdmin } from "@/lib/supabase-admin";

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

export const IDENTITY_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
};

export const CAC_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000,
};

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  remaining?: number;
}

/**
 * Check and increment the rate limit counter for a user + action.
 * Atomic-ish: reads, checks, then increments in separate operations.
 * If you need strict atomicity, add a Postgres function later.
 */
export async function checkAndIncrement(
  userId: string,
  action: "identity" | "cac",
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const supabase = getSupabaseAdmin() as any;
  const key = `${action}:${userId}`;
  const now = new Date();
  const resetAt = new Date(now.getTime() + config.windowMs);

  const { data: row } = await supabase
    .from("verify_rate_limits")
    .select("count, reset_at")
    .eq("key", key)
    .maybeSingle();

  // No row → create one with count=1
  if (!row) {
    await supabase.from("verify_rate_limits").insert({
      key,
      count: 1,
      reset_at: resetAt.toISOString(),
    });
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
    };
  }

  // Row exists but window expired → reset
  const storedReset = new Date(row.reset_at).getTime();
  if (Date.now() > storedReset) {
    await supabase
      .from("verify_rate_limits")
      .update({ count: 1, reset_at: resetAt.toISOString() })
      .eq("key", key);
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
    };
  }

  // Row exists, window active → check count
  if (row.count >= config.maxAttempts) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((storedReset - Date.now()) / 1000),
      remaining: 0,
    };
  }

  // Under limit → increment
  await supabase
    .from("verify_rate_limits")
    .update({ count: row.count + 1 })
    .eq("key", key);

  return {
    allowed: true,
    remaining: config.maxAttempts - (row.count + 1),
  };
}