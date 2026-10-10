// app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import {
  getUserWithDetails,
  invalidateUserCache,
} from "@/lib/supabase-admin";
import { supabase } from "@/app/supabase/supabase";
import {
  getClientIp,
  getGeoLocation,
  checkRateLimit,
  trackFailedAttempt,
  analyzeLoginRisk,
  generateSessionId,
  type DeviceInfo,
} from "@/lib/security";
import { SESSION_TIMEOUT_MS } from "@/lib/session-config";

const MAX_FAILED_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// ─── Network error detection ───
function isNetworkError(err: any): boolean {
  if (!err) return false;

  const name = err?.name || "";
  const msg = (err?.message || "").toLowerCase();

  if (name === "AuthRetryableFetchError") return true;
  if (name === "AuthUnknownError" && msg.includes("fetch")) return true;
  if (name === "TypeError" && msg.includes("fetch")) return true;
  if (name === "AbortError") return true;

  const networkSignals = [
    "fetch failed",
    "econnrefused",
    "econnreset",
    "enotfound",
    "etimedout",
    "eai_again",
    "und_err",
    "network",
    "socket hang up",
    "connection timeout",
    "connect timeout",
    "getaddrinfo",
  ];

  return networkSignals.some((s) => msg.includes(s));
}

function buildFallbackFingerprint(parts: string[]): string {
  const str = parts.join("::");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `fb_${Math.abs(hash).toString(16)}`;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { email, password, deviceInfo } = body as {
      email: string;
      password: string;
      deviceInfo?: DeviceInfo;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // ─── RATE LIMITING ───
    const ip = getClientIp(request);

    const ipLimit = checkRateLimit(
      `ip:${ip}`,
      MAX_FAILED_ATTEMPTS,
      RATE_LIMIT_WINDOW,
    );
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many login attempts. Please try again in 15 minutes.",
          retryAfter: Math.ceil((ipLimit.resetTime - Date.now()) / 1000),
        },
        { status: 429 },
      );
    }

    const emailLimit = checkRateLimit(
      `email:${email.toLowerCase()}`,
      MAX_FAILED_ATTEMPTS,
      RATE_LIMIT_WINDOW,
    );
    if (!emailLimit.allowed) {
      return NextResponse.json(
        {
          error:
            "Too many failed attempts for this account. Please try again later.",
          retryAfter: Math.ceil((emailLimit.resetTime - Date.now()) / 1000),
        },
        { status: 429 },
      );
    }

    // ─── GEOLOCATION & DEVICE ───
    const location = await getGeoLocation(ip);
    const timestamp = new Date();

    const device: DeviceInfo = deviceInfo || {
      userAgent: request.headers.get("user-agent") || "unknown",
      platform: "unknown",
      language: "unknown",
      timezone: "unknown",
    };

    if (!device.fingerprint) {
      device.fingerprint = buildFallbackFingerprint([
        device.userAgent || "unknown",
        device.platform || "unknown",
        device.language || "unknown",
        ip,
      ]);
    }

    // ─── CHECK IF USER EXISTS ───
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, email_verified")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    let userExists = !!existingUser;

    if (!userExists) {
      try {
        const { data: authUsers, error: authListError } =
          await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

        if (!authListError && authUsers?.users) {
          userExists = authUsers.users.some(
            (u: any) => u.email?.toLowerCase() === email.toLowerCase(),
          );
        }
      } catch (e) {
        console.error("Error checking auth users:", e);
      }
    }

    // ─── USER NOT FOUND ───
    if (!userExists) {
      console.log(`🔍 User not found: ${email}`);

      try {
        await supabase.from("failed_login_attempts").insert({
          email: email.toLowerCase(),
          ip_address: ip,
          device_info: device as any,
          location_info: location as any,
          reason: "User not found",
        });
      } catch (e) {
        console.error("Failed to log failed attempt:", e);
      }

      trackFailedAttempt(`ip:${ip}`, email);
      trackFailedAttempt(`email:${email.toLowerCase()}`, email);

      return NextResponse.json(
        {
          error: "No account found with this email address.",
          userNotFound: true,
        },
        { status: 404 },
      );
    }

    // ─── EMAIL VERIFICATION (with self-heal) ───
    if (existingUser && !existingUser.email_verified) {
      let isVerifiedInSupabase = false;
      try {
        const { data: authUserData } =
          await supabaseAdmin.auth.admin.getUserById(existingUser.id);
        isVerifiedInSupabase = !!authUserData?.user?.email_confirmed_at;
      } catch (e) {
        console.error("Failed to check Supabase confirmation:", e);
      }

      if (isVerifiedInSupabase) {
        console.log(`🔧 Auto-healing stale email_verified for ${email}`);
        try {
          await supabaseAdmin
            .from("users")
            .update({
              email_verified: true,
              email_verification_token: null,
              email_verification_token_expires: null,
            })
            .eq("id", existingUser.id);
        } catch (e) {
          console.error("Failed to self-heal email_verified:", e);
        }
      } else {
        console.log(`🔒 Login blocked: ${email} - email not verified`);

        let hasPendingToken = false;
        try {
          const { data: tokenRow } = await supabaseAdmin
            .from("users")
            .select(
              "email_verification_token, email_verification_token_expires",
            )
            .eq("id", existingUser.id)
            .maybeSingle();

          const tokenExpiresAt = tokenRow?.email_verification_token_expires
            ? new Date(tokenRow.email_verification_token_expires)
            : null;

          hasPendingToken =
            !!tokenRow?.email_verification_token &&
            !!tokenExpiresAt &&
            tokenExpiresAt.getTime() > Date.now();
        } catch (e) {
          console.error("Failed to check pending token:", e);
        }

        return NextResponse.json(
          {
            error: "Please verify your email before logging in.",
            requiresVerification: true,
            email,
            hasPendingToken,
            resendAvailable: true,
          },
          { status: 403 },
        );
      }
    }

    // ─── AUTHENTICATION ───
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (authError || !authData?.session) {
      console.error("Auth error:", authError?.message);

      // Distinguish a network failure from a genuine credential failure.
      // Network failures must NOT be counted as failed login attempts —
      // otherwise a slow network locks the user out after 5 attempts.
      if (isNetworkError(authError)) {
        return NextResponse.json(
          {
            error:
              "Authentication service is temporarily unreachable. Please try again in a moment.",
            retryable: true,
          },
          { status: 503 },
        );
      }

      try {
        await supabase.from("failed_login_attempts").insert({
          email: email.toLowerCase(),
          ip_address: ip,
          device_info: device as any,
          location_info: location as any,
          reason: authError?.message || "Invalid credentials",
        });
      } catch (e) {
        console.error("Failed to log failed attempt:", e);
      }

      trackFailedAttempt(`ip:${ip}`, email);
      trackFailedAttempt(`email:${email.toLowerCase()}`, email);

      if (
        authError?.message
          ?.toLowerCase()
          .includes("invalid login credentials") ||
        authError?.message?.toLowerCase().includes("invalid password")
      ) {
        return NextResponse.json(
          { error: "Invalid password. Please try again." },
          { status: 401 },
        );
      }

      return NextResponse.json(
        { error: authError?.message || "Invalid email or password" },
        { status: 401 },
      );
    }

    const { access_token, refresh_token } = authData.session;
    const userId = authData.user.id;

    // ─── INVALIDATE CACHE AND LOAD USER PROFILE ───
    invalidateUserCache(userId);
    const userProfile = await getUserWithDetails(userId);

    if (!userProfile) {
      return NextResponse.json(
        { error: "Account not found. Please sign up first." },
        { status: 404 },
      );
    }

    if (userProfile.is_blocked) {
      return NextResponse.json(
        {
          error:
            "Your account has been blocked. Please contact support for assistance.",
          blocked: true,
          blockedReason: userProfile.block_reason,
          blockedAt: userProfile.blocked_at,
        },
        { status: 403 },
      );
    }

    // ─── SESSION TOKEN ───
    const sessionToken = generateSessionId();
    const sessionExpiresAt = new Date(Date.now() + SESSION_TIMEOUT_MS);
    // ─── PARALLELIZE INDEPENDENT CALLS ───
    // Security analysis, session write, business lookup, and store lookup
    // are independent — run them together instead of sequentially.
    const [
      securityContextResult,
      sessionWriteResult,
      businessResult,
      storeResult,
    ] = await Promise.allSettled([
      analyzeLoginRisk(supabase, userId, {
        ip,
        location,
        device,
        timestamp,
      }),

      supabaseAdmin
        .from("users")
        .update({
          current_session_id: sessionToken,
          current_session_ip: ip,
          current_session_device: `${device.platform} | ${device.userAgent?.slice(0, 60)}`,
          current_session_expires_at: sessionExpiresAt.toISOString(),
        })
        .eq("id", userId),

      supabase
        .from("businesses")
        .select("business_name")
        .eq("user_id", userId)
        .maybeSingle(),

      supabaseAdmin
        .from("online_stores")
        .select(
          "id, name, slug, description, keywords, cac_number, logo_url, cover_url, country, state, city, street_address, location_enabled, is_active, activation_paid, activated_at, activation_reference, wallet_balance, total_revenue, total_orders, total_views, created_at, updated_at",
        )
        .eq("owner_id", userId)
        .maybeSingle(),
    ]);

    // ─── SECURITY CONTEXT ───
    let securityContext =
      securityContextResult.status === "fulfilled"
        ? securityContextResult.value
        : {
            riskScore: 0,
            reasons: [] as string[],
            isKnownDevice: true,
          };

    console.log(`🔐 Login security analysis for ${email}:`, {
      riskScore: securityContext.riskScore,
      reasons: securityContext.reasons,
      isKnownDevice: securityContext.isKnownDevice,
      location: `${location.city}, ${location.country}`,
    });

    const isDevLocalhost =
      process.env.NODE_ENV === "development" &&
      (ip === "127.0.0.1" || ip === "::1" || ip === "unknown");

    if (isDevLocalhost) {
      console.log(
        "🔓 Development localhost detected — bypassing geo/time risk checks",
      );
      securityContext = {
        ...securityContext,
        riskScore: 0,
        reasons: [],
        isKnownDevice: true,
      };
    }

    const isSuspicious = securityContext.riskScore > 30;

    if (isSuspicious) {
      console.warn(
        `⚠️ Suspicious login allowed for ${email} from ${location.city}, ${location.country} (score: ${securityContext.riskScore})`,
      );
    }

    if (sessionWriteResult.status === "rejected") {
      console.error("Failed to update session in DB:", sessionWriteResult.reason);
    }

    console.log(
      `🔑 Session ${sessionToken.slice(0, 8)}... created for ${email}`,
    );

    // ─── BUSINESS NAME ───
    const businessData =
      businessResult.status === "fulfilled" ? businessResult.value.data : null;
    const displayName = businessData?.business_name || userProfile.full_name;

    // ─── STORE DATA ───
    let storeData = null;
    if (storeResult.status === "fulfilled" && storeResult.value.data) {
      const store = storeResult.value.data;
      storeData = {
        id: store.id,
        owner_id: userId,
        name: store.name,
        slug: store.slug,
        description: store.description || "",
        keywords: store.keywords || [],
        cac_number: store.cac_number,
        logo_url: store.logo_url,
        cover_url: store.cover_url,
        country: store.country || "Nigeria",
        state: store.state || "",
        city: store.city || "",
        street_address: store.street_address || "",
        location_enabled: store.location_enabled !== false,
        is_active: store.is_active || false,
        activation_paid: store.activation_paid || false,
        activated_at: store.activated_at,
        activation_reference: store.activation_reference,
        wallet_balance: store.wallet_balance || 0,
        total_revenue: store.total_revenue || 0,
        total_orders: store.total_orders || 0,
        total_views: store.total_views || 0,
        created_at: store.created_at,
        updated_at: store.updated_at,
      };
      console.log("✅ Store data fetched:", storeData.slug);
    }

    // ─── SET COOKIES ───
    const cookieStore = await cookies();

    await Promise.all([
      cookieStore.set("sb-access-token", access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      }),
      cookieStore.set("sb-refresh-token", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      }),
      cookieStore.set("sb-client-session", "true", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      }),
      cookieStore.set("sb-login-time", Date.now().toString(), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60,
      }),
      cookieStore.set(
        "sb-session-risk",
        securityContext.riskScore.toString(),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24,
        },
      ),
      cookieStore.set("sb-session-id", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      }),
    ]);

    // ─── FIRE-AND-FORGET SIDE EFFECTS ───
    Promise.resolve().then(async () => {
      try {
        await supabase.from("login_history").insert({
          user_id: userId,
          ip_address: ip,
          country: location.country,
          city: location.city,
          region: location.region,
          latitude: location.latitude,
          longitude: location.longitude,
          timezone: location.timezone,
          user_agent: device.userAgent,
          device_fingerprint: device.fingerprint,
          platform: device.platform,
          screen_resolution: device.screenResolution,
          is_suspicious: isSuspicious,
          suspicious_reasons: securityContext.reasons,
          is_successful: true,
          session_id: access_token.slice(-16),
          session_token: sessionToken,
        });
      } catch (e) {
        // silent
      }
    });

    Promise.resolve().then(async () => {
      try {
        const deviceName = `${device.platform || "Unknown"} - ${(
          device.userAgent || "Browser"
        ).slice(0, 100)}`;

        const { error: upsertError } = await supabaseAdmin
          .from("trusted_devices")
          .upsert(
            {
              user_id: userId,
              device_fingerprint: device.fingerprint!,
              device_name: deviceName,
              last_location: `${location.city}, ${location.country}`,
              last_ip: ip,
              last_used: new Date().toISOString(),
              is_trusted: !isSuspicious,
            },
            {
              onConflict: "user_id,device_fingerprint",
            },
          );

        if (upsertError) {
          console.error("Trusted device upsert error:", upsertError);
        }
      } catch (e) {
        console.error("Trusted device upsert failed (non-critical):", e);
      }
    });

    // ─── RESPONSE ───
    // NOTE: We do NOT return access_token or refresh_token.
    // They live exclusively in httpOnly cookies.
    const profile = {
      id: userProfile.id,
      fullName: displayName,
      email: userProfile.email,
      phone: userProfile.phone,
      currentLoginSession: sessionToken,
      zidcoinBalance: userProfile.zidcoin_balance,
      walletBalance: userProfile.wallet_balance,
      bvnVerification: userProfile.bvn_verification,
      isBvnVerified: userProfile.bvn_verification === "verified",
      role: userProfile.admin_role,
      referralCode: userProfile.referral_code,
      state: userProfile.state,
      city: userProfile.city,
      address: userProfile.address,
      dateOfBirth: userProfile.date_of_birth,
      profilePicture: userProfile.profile_picture,
      subscriptionTier: userProfile.subscription_tier,
      subscriptionExpiresAt: userProfile.subscription_expires_at,
      isBlocked: userProfile.is_blocked,
      pinSet: userProfile.pin_set,
      store: storeData,
      hasStore: storeData !== null,
      storeIsActive:
        storeData?.is_active === true && storeData?.activation_paid === true,
      storePendingActivation:
        storeData !== null &&
        (storeData.is_active === false || storeData.activation_paid === false),
    };

    const responseTime = Date.now() - startTime;
    console.log(
      `✅ Login completed in ${responseTime}ms for ${email}${storeData ? ` (Store: ${storeData.slug})` : ""}`,
    );

    return NextResponse.json({
      profile,
      isVerified: profile.isBvnVerified,
      sessionEstablished: true,
      security: {
        riskScore: securityContext.riskScore,
        isSuspicious,
        isKnownDevice: securityContext.isKnownDevice,
        location: {
          city: location.city,
          country: location.country,
        },
        newDevice: !securityContext.isKnownDevice,
      },
    });
  } catch (err: any) {
    console.error("Secure Login API Error:", err.message);

    if (isNetworkError(err)) {
      return NextResponse.json(
        {
          error:
            "Authentication service is temporarily unreachable. Please try again in a moment.",
          retryable: true,
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}