// app/api/profile/request-pin-reset-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";
import { transporter } from "@/lib/node-mailer";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ─── Rate limits ──────────────────────────────────────────────
const RULE_USER = { windowSeconds: 15 * 60, maxRequests: 3 };   // 3 per 15 min
const RULE_IP   = { windowSeconds: 60 * 60, maxRequests: 10 };  // 10 per hour
const RULE_EMAIL = { windowSeconds: 15 * 60, maxRequests: 3 };  // 3 per 15 min

function generateOtp(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(buf[0] % 1_000_000).padStart(6, "0");
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "your email";
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  const visible = local[0] + local[local.length - 1];
  return `${visible[0]}${"*".repeat(Math.min(local.length - 2, 4))}${visible[1]}@${domain}`;
}

export async function POST(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    const response = NextResponse.json(
      { error: "Please login to reset your transaction PIN", logout: true },
      { status: 401 },
    );
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  try {
    const { userId } = await req.json().catch(() => ({}));

    if (userId && userId !== user.id) {
      const response = NextResponse.json(
        { error: "Unauthorized: User ID mismatch" },
        { status: 403 },
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || "unknown";

    // ─── Rate limit: user ─────────────────────────────────────
    const userLimit = await checkRateLimit(
      supabase,
      "pin_reset_request_log",
      "user_id",
      user.id,
      RULE_USER,
    );
    if (!userLimit.allowed) {
      const response = NextResponse.json(
        {
          error: `Too many reset requests. Please try again in ${userLimit.retryAfterSeconds} seconds.`,
          retryAfter: userLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { "Retry-After": String(userLimit.retryAfterSeconds) },
        },
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // ─── Rate limit: IP ───────────────────────────────────────
    const ipLimit = await checkRateLimit(
      supabase,
      "pin_reset_request_log",
      "ip",
      ip,
      RULE_IP,
    );
    if (!ipLimit.allowed) {
      const response = NextResponse.json(
        {
          error:
            "Too many reset requests from your network. Please try again later.",
          retryAfter: ipLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { "Retry-After": String(ipLimit.retryAfterSeconds) },
        },
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // ─── Fetch user ──────────────────────────────────────────
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, is_blocked, bvn_verification")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      const response = NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    if (userData.is_blocked) {
      const response = NextResponse.json(
        { error: "Account is blocked. Please contact support." },
        { status: 403 },
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    if (userData.bvn_verification === "not_submitted") {
      const response = NextResponse.json(
        {
          error:
            "Complete your BVN verification before resetting your transaction PIN.",
        },
        { status: 400 },
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // ─── Rate limit: email ────────────────────────────────────
    const emailLimit = await checkRateLimit(
      supabase,
      "pin_reset_request_log",
      "email",
      userData.email,
      RULE_EMAIL,
    );
    if (!emailLimit.allowed) {
      const response = NextResponse.json(
        {
          error: `Too many reset requests. Please try again in ${emailLimit.retryAfterSeconds} seconds.`,
          retryAfter: emailLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { "Retry-After": String(emailLimit.retryAfterSeconds) },
        },
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // ─── Generate + hash OTP ─────────────────────────────────
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    const { error: updateError } = await supabase
      .from("users")
      .update({
        pin_reset_otp_hash: otpHash,
        pin_reset_otp_expires: expiresAt.toISOString(),
        pin_reset_otp_attempts: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("[request-pin-reset-otp] store OTP failed:", updateError);
      const response = NextResponse.json(
        { error: "Failed to generate reset code" },
        { status: 500 },
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // ─── Log the request (used by rate limiter) ──────────────
    const { error: logErr } = await supabase
      .from("pin_reset_request_log")
      .insert({
        user_id: user.id,
        email: userData.email,
        ip,
        user_agent: userAgent,
      });

    if (logErr) {
      console.error("[request-pin-reset-otp] log insert failed:", logErr);
      // Roll back OTP so it can't be used
      await supabase
        .from("users")
        .update({
          pin_reset_otp_hash: null,
          pin_reset_otp_expires: null,
        })
        .eq("id", user.id);

      const response = NextResponse.json(
        { error: "Failed to process reset request. Please try again." },
        { status: 500 },
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // ─── Send email ──────────────────────────────────────────
    const name =
      userData.first_name && userData.last_name
        ? `${userData.first_name} ${userData.last_name}`
        : "there";

    try {
      await transporter.sendMail({
        from: `Zidwell <${process.env.EMAIL_USER}>`,
        to: userData.email,
        subject: "Your Zidwell transaction PIN reset code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #E5B333;">Transaction PIN Reset</h2>
            <p>Hi ${name},</p>
            <p>You asked to reset the transaction PIN on your Zidwell account.</p>
            <p>Your verification code is:</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #101010; font-family: monospace;">
                ${otp}
              </span>
            </div>
            <p>This code expires in <strong>10 minutes</strong>.</p>
            <p>If you did not request this code, ignore this email and consider changing your account password immediately.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              For your security, never share this code with anyone — including anyone claiming to be from Zidwell.
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("[request-pin-reset-otp] email send failed:", emailErr);
      await supabase
        .from("users")
        .update({
          pin_reset_otp_hash: null,
          pin_reset_otp_expires: null,
        })
        .eq("id", user.id);

      const response = NextResponse.json(
        { error: "Failed to send reset code. Please try again." },
        { status: 500 },
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // ─── Audit (non-fatal) ───────────────────────────────────
    await supabase
      .from("security_events")
      .insert({
        user_id: user.id,
        event_type: "pin_reset_otp_requested",
        details: {
          pin_type: "transaction_pin",
          timestamp: new Date().toISOString(),
          ip,
          user_agent: userAgent,
        },
      })
      .then(({ error }) => {
        if (error) console.warn("[request-pin-reset-otp] audit failed:", error);
      });

    const maskedEmail = maskEmail(userData.email);

    const responseData = {
      success: true,
      message: `Verification code sent to ${maskedEmail}`,
      maskedEmail,
      expiresAt: expiresAt.toISOString(),
      remainingRequests: Math.max(0, userLimit.remaining - 1),
    };
    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("[request-pin-reset-otp] unexpected:", error);
    const response = NextResponse.json(
      { error: "Failed to request reset code" },
      { status: 500 },
    );
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }
}