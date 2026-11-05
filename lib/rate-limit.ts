// lib/rate-limit.ts
import { SupabaseClient } from "@supabase/supabase-js";

export interface RateLimitRule {
  windowSeconds: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export async function checkRateLimit(
  supabase: SupabaseClient,
  table: "pin_reset_request_log" | "pin_reset_verify_log",
  column: "user_id" | "ip" | "email",
  value: string,
  rule: RateLimitRule,
  timeColumn: "requested_at" | "attempted_at" = "requested_at",
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - rule.windowSeconds * 1000);

  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq(column, value)
    .gte(timeColumn, windowStart.toISOString());

  if (error) {
    // Fail closed: if we can't check, don't allow.
    console.error("[rate-limit] query error:", error);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: rule.windowSeconds,
    };
  }

  const used = count ?? 0;
  const remaining = Math.max(0, rule.maxRequests - used);
  const allowed = used < rule.maxRequests;

  return {
    allowed,
    remaining,
    retryAfterSeconds: allowed ? 0 : rule.windowSeconds,
  };
}

export function getClientIp(req: Request): string {
  const h = req.headers;
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return (
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    h.get("x-vercel-forwarded-for") ||
    "unknown"
  );
}