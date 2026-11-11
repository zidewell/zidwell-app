// app/api/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// RATE LIMITING — 1 request per 60 seconds per email
// ============================================================
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 60_000;

// Periodic cleanup so the map doesn't grow unbounded
setInterval(() => {
  const now = Date.now();
  for (const [email, ts] of rateLimitMap.entries()) {
    if (now - ts > RATE_LIMIT_WINDOW_MS * 5) rateLimitMap.delete(email);
  }
}, 10 * 60_000);

function checkRateLimit(email: string): {
  allowed: boolean;
  retryAfterMs: number;
} {
  const now = Date.now();
  const last = rateLimitMap.get(email);
  if (last && now - last < RATE_LIMIT_WINDOW_MS) {
    return { allowed: false, retryAfterMs: RATE_LIMIT_WINDOW_MS - (now - last) };
  }
  rateLimitMap.set(email, now);
  return { allowed: true, retryAfterMs: 0 };
}

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
        { status: 400 }
      );
    }

    // Rate limit
    const rl = checkRateLimit(normalizedEmail);
    if (!rl.allowed) {
      const retryAfterSec = Math.ceil(rl.retryAfterMs / 1000);
      return NextResponse.json(
        {
          error: `Please wait ${retryAfterSec}s before requesting another password reset email`,
          retry_after_seconds: retryAfterSec,
        },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
      );
    }

    // Verify user exists (but don't leak existence)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (userError || !user) {
      // Return 200 to prevent email enumeration
      return NextResponse.json({
        message:
          "If an account with that email exists, a reset link has been sent.",
      });
    }

    // Trigger Supabase reset email
    const origin =
      req.headers.get("origin") ||
      req.headers.get("referer")?.split("/").slice(0, 3).join("/") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "";

    const redirectTo = `${origin}/reset-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      { redirectTo }
    );

    if (resetError) {
      console.error("Password reset email error:", resetError);
      // Still return 200 — don't leak server errors to attacker
    }

    return NextResponse.json({
      message:
        "If an account with that email exists, a reset link has been sent.",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}