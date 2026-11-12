// app/api/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ═══════════════════════════════════════════════════════════════════
// RATE LIMIT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════
const RATE_LIMITS = {
  COOLDOWN_SECONDS: 90,          // must wait 90s between requests
  MAX_PER_HOUR: 3,               // max 3 attempts per email per hour
  MAX_PER_DAY: 10,               // max 10 attempts per email per day
  MAX_PER_IP_PER_HOUR: 20,       // max 20 attempts per IP per hour
};

// In-memory cooldown (fast path — checked before hitting DB)
const memoryCooldown = new Map<string, number>(); // email → timestamp of last request

// Cleanup old entries every 10 min
setInterval(() => {
  const now = Date.now();
  for (const [email, ts] of memoryCooldown.entries()) {
    if (now - ts > RATE_LIMITS.COOLDOWN_SECONDS * 1000 * 2) {
      memoryCooldown.delete(email);
    }
  }
}, 10 * 60_000);

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════
interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfterSeconds?: number;
  cooldownEndsAt?: string; // ← ISO timestamp string (fixed from number)
  limits?: {
    lastHour: number;
    maxPerHour: number;
    lastDay: number;
    maxPerDay: number;
  };
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

async function checkRateLimits(
  email: string,
  ip: string,
): Promise<RateLimitResult> {
  const now = Date.now();

  // ── Layer 1: Fast in-memory cooldown ──
  const lastRequest = memoryCooldown.get(email);
  if (lastRequest && now - lastRequest < RATE_LIMITS.COOLDOWN_SECONDS * 1000) {
    const retryAfter = Math.ceil(
      (RATE_LIMITS.COOLDOWN_SECONDS * 1000 - (now - lastRequest)) / 1000,
    );
    return {
      allowed: false,
      reason: "cooldown",
      retryAfterSeconds: retryAfter,
      cooldownEndsAt: new Date(
        lastRequest + RATE_LIMITS.COOLDOWN_SECONDS * 1000,
      ).toISOString(),
    };
  }

  // ── Layer 2: DB-based hourly/daily limits per email ──
  const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: countLastHour },
    { count: countLastDay },
    { count: countFromIp },
  ] = await Promise.all([
    supabase
      .from("password_reset_attempts")
      .select("*", { count: "exact", head: true })
      .eq("email", email)
      .gte("requested_at", oneHourAgo),
    supabase
      .from("password_reset_attempts")
      .select("*", { count: "exact", head: true })
      .eq("email", email)
      .gte("requested_at", oneDayAgo),
    supabase
      .from("password_reset_attempts")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ip)
      .gte("requested_at", oneHourAgo),
  ]);

  const lastHour = countLastHour ?? 0;
  const lastDay = countLastDay ?? 0;
  const fromIp = countFromIp ?? 0;

  // ── Daily limit ──
  if (lastDay >= RATE_LIMITS.MAX_PER_DAY) {
    const { data: oldest } = await supabase
      .from("password_reset_attempts")
      .select("requested_at")
      .eq("email", email)
      .gte("requested_at", oneDayAgo)
      .order("requested_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const cooldownEndsAt = oldest?.requested_at
      ? new Date(
          new Date(oldest.requested_at).getTime() + 24 * 60 * 60 * 1000,
        ).toISOString()
      : new Date(now + 24 * 60 * 60 * 1000).toISOString();

    const retryAfter = Math.ceil(
      (new Date(cooldownEndsAt).getTime() - now) / 1000,
    );

    return {
      allowed: false,
      reason: "daily_limit",
      retryAfterSeconds: retryAfter,
      cooldownEndsAt,
      limits: {
        lastHour,
        maxPerHour: RATE_LIMITS.MAX_PER_HOUR,
        lastDay,
        maxPerDay: RATE_LIMITS.MAX_PER_DAY,
      },
    };
  }

  // ── Hourly limit ──
  if (lastHour >= RATE_LIMITS.MAX_PER_HOUR) {
    const { data: oldest } = await supabase
      .from("password_reset_attempts")
      .select("requested_at")
      .eq("email", email)
      .gte("requested_at", oneHourAgo)
      .order("requested_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const cooldownEndsAt = oldest?.requested_at
      ? new Date(
          new Date(oldest.requested_at).getTime() + 60 * 60 * 1000,
        ).toISOString()
      : new Date(now + 60 * 60 * 1000).toISOString();

    const retryAfter = Math.ceil(
      (new Date(cooldownEndsAt).getTime() - now) / 1000,
    );

    return {
      allowed: false,
      reason: "hourly_limit",
      retryAfterSeconds: retryAfter,
      cooldownEndsAt,
      limits: {
        lastHour,
        maxPerHour: RATE_LIMITS.MAX_PER_HOUR,
        lastDay,
        maxPerDay: RATE_LIMITS.MAX_PER_DAY,
      },
    };
  }

  // ── IP limit ──
  if (fromIp >= RATE_LIMITS.MAX_PER_IP_PER_HOUR) {
    return {
      allowed: false,
      reason: "ip_limit",
      retryAfterSeconds: 3600,
      cooldownEndsAt: new Date(now + 60 * 60 * 1000).toISOString(),
    };
  }

  return {
    allowed: true,
    limits: {
      lastHour,
      maxPerHour: RATE_LIMITS.MAX_PER_HOUR,
      lastDay,
      maxPerDay: RATE_LIMITS.MAX_PER_DAY,
    },
  };
}

async function recordAttempt(
  email: string,
  ip: string,
  userAgent: string,
  success: boolean,
) {
  try {
    await supabase.from("password_reset_attempts").insert({
      email,
      ip_address: ip,
      user_agent: userAgent,
      success,
      requested_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[forgot-password] Failed to record attempt:", err);
    // Don't fail the request just because logging failed
  }
}

// ═══════════════════════════════════════════════════════════════════
// POST — request password reset
// ═══════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email: string | undefined = body?.email;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || "unknown";

    // ── CHECK ALL RATE LIMITS ──
    const rateCheck = await checkRateLimits(normalizedEmail, ip);

    if (!rateCheck.allowed) {
      const retryAfter = rateCheck.retryAfterSeconds || 60;

      // Record the blocked attempt
      await recordAttempt(normalizedEmail, ip, userAgent, false);

      const reasonMessage =
        rateCheck.reason === "daily_limit"
          ? "Too many password reset requests today. Please try again tomorrow."
          : rateCheck.reason === "hourly_limit"
            ? "Too many password reset requests. Please try again later."
            : rateCheck.reason === "ip_limit"
              ? "Too many requests from your network. Please try again later."
              : `Please wait ${retryAfter} seconds before requesting another reset email.`;

      return NextResponse.json(
        {
          error: reasonMessage,
          reason: rateCheck.reason,
          retry_after_seconds: retryAfter,
          cooldown_ends_at: rateCheck.cooldownEndsAt,
          limits: rateCheck.limits,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Reason": rateCheck.reason || "cooldown",
          },
        },
      );
    }

    // ── Verify user exists (don't leak existence) ──
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (userError || !user) {
      // Record even when user doesn't exist — prevents enumeration via timing
      await recordAttempt(normalizedEmail, ip, userAgent, true);

      // Set cooldown even for non-existent emails
      memoryCooldown.set(normalizedEmail, Date.now());

      return NextResponse.json({
        message:
          "If an account with that email exists, a reset link has been sent.",
        cooldown_seconds: RATE_LIMITS.COOLDOWN_SECONDS,
      });
    }

    // ── Send the reset email ──
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://zidwell.com");

    const redirectTo = `${baseUrl}/auth/password-reset/update-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      { redirectTo },
    );

    if (resetError) {
      console.error("Password reset email error:", resetError);
    }

    // ── Record successful attempt ──
    await recordAttempt(normalizedEmail, ip, userAgent, true);
    memoryCooldown.set(normalizedEmail, Date.now());

    return NextResponse.json({
      message:
        "If an account with that email exists, a reset link has been sent.",
      cooldown_seconds: RATE_LIMITS.COOLDOWN_SECONDS,
      limits: rateCheck.limits,
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
// GET — check cooldown status (called on page mount)
// ═══════════════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email")?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const ip = getClientIp(req);

    // Check in-memory first (fast)
    const lastRequest = memoryCooldown.get(email);
    const now = Date.now();

    if (
      lastRequest &&
      now - lastRequest < RATE_LIMITS.COOLDOWN_SECONDS * 1000
    ) {
      const retryAfter = Math.ceil(
        (RATE_LIMITS.COOLDOWN_SECONDS * 1000 - (now - lastRequest)) / 1000,
      );
      return NextResponse.json({
        onCooldown: true,
        reason: "cooldown",
        retry_after_seconds: retryAfter,
        cooldown_ends_at: new Date(
          lastRequest + RATE_LIMITS.COOLDOWN_SECONDS * 1000,
        ).toISOString(),
      });
    }

    // Check DB for hourly/daily limits
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    const [{ count: lastHour }, { count: lastDay }] = await Promise.all([
      supabase
        .from("password_reset_attempts")
        .select("*", { count: "exact", head: true })
        .eq("email", email)
        .gte("requested_at", oneHourAgo),
      supabase
        .from("password_reset_attempts")
        .select("*", { count: "exact", head: true })
        .eq("email", email)
        .gte("requested_at", oneDayAgo),
    ]);

    // Check for most recent attempt to see if cooldown is active
    const { data: latest } = await supabase
      .from("password_reset_attempts")
      .select("requested_at")
      .eq("email", email)
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latest?.requested_at) {
      const lastAttemptTime = new Date(latest.requested_at).getTime();
      const elapsedSeconds = Math.floor((now - lastAttemptTime) / 1000);

      if (elapsedSeconds < RATE_LIMITS.COOLDOWN_SECONDS) {
        const retryAfter = RATE_LIMITS.COOLDOWN_SECONDS - elapsedSeconds;
        return NextResponse.json({
          onCooldown: true,
          reason: "cooldown",
          retry_after_seconds: retryAfter,
          cooldown_ends_at: new Date(
            lastAttemptTime + RATE_LIMITS.COOLDOWN_SECONDS * 1000,
          ).toISOString(),
        });
      }
    }

    if ((lastDay ?? 0) >= RATE_LIMITS.MAX_PER_DAY) {
      return NextResponse.json({
        onCooldown: true,
        reason: "daily_limit",
        retry_after_seconds: 24 * 60 * 60,
        limits: {
          lastHour: lastHour ?? 0,
          maxPerHour: RATE_LIMITS.MAX_PER_HOUR,
          lastDay: lastDay ?? 0,
          maxPerDay: RATE_LIMITS.MAX_PER_DAY,
        },
      });
    }

    if ((lastHour ?? 0) >= RATE_LIMITS.MAX_PER_HOUR) {
      return NextResponse.json({
        onCooldown: true,
        reason: "hourly_limit",
        retry_after_seconds: 60 * 60,
        limits: {
          lastHour: lastHour ?? 0,
          maxPerHour: RATE_LIMITS.MAX_PER_HOUR,
          lastDay: lastDay ?? 0,
          maxPerDay: RATE_LIMITS.MAX_PER_DAY,
        },
      });
    }

    return NextResponse.json({
      onCooldown: false,
      limits: {
        lastHour: lastHour ?? 0,
        maxPerHour: RATE_LIMITS.MAX_PER_HOUR,
        lastDay: lastDay ?? 0,
        maxPerDay: RATE_LIMITS.MAX_PER_DAY,
      },
    });
  } catch (err: any) {
    console.error("[forgot-password GET] error:", err);
    return NextResponse.json({
      onCooldown: false,
      error: err.message,
    });
  }
}