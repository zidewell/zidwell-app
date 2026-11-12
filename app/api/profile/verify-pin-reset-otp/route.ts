// app/api/profile/verify-pin-reset-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { evaluateCooldown, PIN_CHANGE_COOLDOWN_MS } from "@/lib/pin-cooldown";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const MAX_OTP_ATTEMPTS = 5;

const RULE_VERIFY_USER = { windowSeconds: 10 * 60, maxRequests: 10 };
const RULE_VERIFY_IP   = { windowSeconds: 10 * 60, maxRequests: 30 };

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
    const { userId, otp, newPin } = await req.json();
    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || "unknown";

    if (userId && userId !== user.id) {
      const response = NextResponse.json(
        { error: "Unauthorized: User ID mismatch" },
        { status: 403 },
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    if (!otp || !newPin) {
      const response = NextResponse.json(
        { error: "OTP and new PIN are required" },
        { status: 400 },
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    if (!/^\d{6}$/.test(otp)) {
      const response = NextResponse.json(
        { error: "Invalid verification code format" },
        { status: 400 },
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    if (!/^\d{4}$/.test(newPin)) {
      const response = NextResponse.json(
        { error: "Transaction PIN must be exactly 4 digits" },
        { status: 400 },
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // ─── Rate limit: user ────────────────────────────────────
    const userLimit = await checkRateLimit(
      supabase,
      "pin_reset_verify_log",
      "user_id",
      user.id,
      RULE_VERIFY_USER,
      "attempted_at",
    );
    if (!userLimit.allowed) {
      const response = NextResponse.json(
        {
          error: `Too many verification attempts. Please try again in ${userLimit.retryAfterSeconds} seconds.`,
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

    // ─── Rate limit: IP ──────────────────────────────────────
    const ipLimit = await checkRateLimit(
      supabase,
      "pin_reset_verify_log",
      "ip",
      ip,
      RULE_VERIFY_IP,
      "attempted_at",
    );
    if (!ipLimit.allowed) {
      const response = NextResponse.json(
        {
          error:
            "Too many verification attempts from your network. Please try again later.",
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

    // ─── Fetch user OTP state ───────────────────────────────
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(
        "id, email, pin_reset_otp_hash, pin_reset_otp_expires, pin_reset_otp_attempts, pin_updated_at",
      )
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

    // ─── Cooldown check ─────────────────────────────────────
    const cooldown = evaluateCooldown(userData.pin_updated_at);
    if (!cooldown.allowed) {
      const response = NextResponse.json(
        {
          error: cooldown.message,
          nextAllowedAt: cooldown.nextAllowedAt?.toISOString(),
          hoursRemaining: cooldown.hoursRemaining,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil(
                ((cooldown.nextAllowedAt?.getTime() ?? Date.now()) -
                  Date.now()) /
                  1000,
              ),
            ),
          },
        },
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // ─── OTP presence + expiry ──────────────────────────────
    if (!userData.pin_reset_otp_hash || !userData.pin_reset_otp_expires) {
      const response = NextResponse.json(
        { error: "No reset code was requested. Please request one first." },
        { status: 400 },
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    if (new Date(userData.pin_reset_otp_expires) < new Date()) {
      await supabase
        .from("users")
        .update({
          pin_reset_otp_hash: null,
          pin_reset_otp_expires: null,
          pin_reset_otp_attempts: 0,
        })
        .eq("id", user.id);

      const response = NextResponse.json(
        { error: "Verification code expired. Please request a new one." },
        { status: 400 },
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // ─── Attempt cap ────────────────────────────────────────
    const attempts = userData.pin_reset_otp_attempts || 0;
    if (attempts >= MAX_OTP_ATTEMPTS) {
      await supabase
        .from("users")
        .update({
          pin_reset_otp_hash: null,
          pin_reset_otp_expires: null,
          pin_reset_otp_attempts: 0,
        })
        .eq("id", user.id);

      const response = NextResponse.json(
        {
          error:
            "Too many incorrect attempts. Please request a new verification code.",
        },
        { status: 429 },
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // ─── Verify OTP ─────────────────────────────────────────
    const otpValid = await bcrypt.compare(otp, userData.pin_reset_otp_hash);

    if (!otpValid) {
      await supabase
        .from("users")
        .update({ pin_reset_otp_attempts: attempts + 1 })
        .eq("id", user.id);

      await supabase
        .from("pin_reset_verify_log")
        .insert({ user_id: user.id, success: false, ip, user_agent: userAgent })
        .then(({ error }) => {
          if (error) console.warn("[verify-pin-reset-otp] verify log failed:", error);
        });

      await supabase
        .from("security_events")
        .insert({
          user_id: user.id,
          event_type: "pin_reset_otp_failed",
          details: {
            pin_type: "transaction_pin",
            attempts: attempts + 1,
            timestamp: new Date().toISOString(),
            ip,
          },
        })
        .then(({ error }) => {
          if (error) console.warn("[verify-pin-reset-otp] audit failed:", error);
        });

      const remaining = MAX_OTP_ATTEMPTS - (attempts + 1);
      const response = NextResponse.json(
        {
          error: `Incorrect verification code. ${remaining} attempt${
            remaining === 1 ? "" : "s"
          } remaining.`,
          remainingAttempts: remaining,
        },
        { status: 401 },
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // ─── Atomic conditional update ──────────────────────────
    // Lock on the OTP hash so only one concurrent request can
    // consume it. Cooldown guard ensures the day limit is
    // enforced even under parallel requests.
    const hashedPin = await bcrypt.hash(newPin, 10);
    const now = new Date().toISOString();
    const cooldownCutoff = new Date(
      Date.now() - PIN_CHANGE_COOLDOWN_MS,
    ).toISOString();

    const { data: updated, error: updateError } = await supabase
      .from("users")
      .update({
        transaction_pin: hashedPin,
        pin_set: true,
        pin_attempts: 0,
        pin_locked_until: null,
        pin_updated_at: now,
        pin_reset_otp_hash: null,
        pin_reset_otp_expires: null,
        pin_reset_otp_attempts: 0,
        pin_reset_token: null,
        pin_reset_token_expires: null,
        updated_at: now,
      })
      .eq("id", user.id)
      .eq("pin_reset_otp_hash", userData.pin_reset_otp_hash) // 👈 OTP race guard
      .or(
        `pin_updated_at.is.null,pin_updated_at.lt.${cooldownCutoff}`,
      ) // 👈 cooldown guard
      .select("id, pin_updated_at");

    if (updateError) {
      console.error("[verify-pin-reset-otp] update failed:", updateError);
      const response = NextResponse.json(
        { error: "Failed to reset transaction PIN" },
        { status: 500 },
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    if (!updated || updated.length === 0) {
      // Diagnose: cooldown active? concurrent OTP consumption?
      const { data: fresh } = await supabase
        .from("users")
        .select("pin_updated_at, pin_reset_otp_hash")
        .eq("id", user.id)
        .single();

      const freshCooldown = evaluateCooldown(fresh?.pin_updated_at);
      if (!freshCooldown.allowed) {
        const response = NextResponse.json(
          {
            error: freshCooldown.message,
            nextAllowedAt: freshCooldown.nextAllowedAt?.toISOString(),
            hoursRemaining: freshCooldown.hoursRemaining,
          },
          { status: 429 },
        );
        if (newTokens) return createAuthResponse(await response.json(), newTokens);
        return response;
      }

      if (!fresh?.pin_reset_otp_hash) {
        const response = NextResponse.json(
          {
            error:
              "This verification code has already been used. Please request a new one.",
          },
          { status: 409 },
        );
        if (newTokens) return createAuthResponse(await response.json(), newTokens);
        return response;
      }

      const response = NextResponse.json(
        {
          error: "PIN was just updated by another request. Please try again.",
        },
        { status: 409 },
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // ─── Audit + verify log ─────────────────────────────────
    await supabase
      .from("pin_reset_verify_log")
      .insert({ user_id: user.id, success: true, ip, user_agent: userAgent })
      .then(({ error }) => {
        if (error) console.warn("[verify-pin-reset-otp] verify log failed:", error);
      });

    await supabase
      .from("security_events")
      .insert({
        user_id: user.id,
        event_type: "pin_reset_completed",
        details: {
          method: "otp_email",
          pin_type: "transaction_pin",
          timestamp: now,
          email: userData.email,
          ip,
        },
      })
      .then(({ error }) => {
        if (error) console.warn("[verify-pin-reset-otp] audit failed:", error);
      });

    const nextAllowedAt = new Date(
      Date.now() + PIN_CHANGE_COOLDOWN_MS,
    ).toISOString();

    const responseData = {
      success: true,
      message:
        "Transaction PIN reset successfully. You can now use your new PIN to authorize transfers.",
      nextAllowedAt,
    };
    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("[verify-pin-reset-otp] unexpected:", error);
    const response = NextResponse.json(
      { error: "Failed to reset transaction PIN" },
      { status: 500 },
    );
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }
}