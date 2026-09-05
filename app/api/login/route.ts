// app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getUserWithDetails } from "@/lib/suabase-admin";
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

const MAX_FAILED_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
        { status: 400 }
      );
    }

    // ─── RATE LIMITING ───
    const ip = getClientIp(request);

    const ipLimit = checkRateLimit(`ip:${ip}`, MAX_FAILED_ATTEMPTS, RATE_LIMIT_WINDOW);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many login attempts. Please try again in 15 minutes.",
          retryAfter: Math.ceil((ipLimit.resetTime - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    const emailLimit = checkRateLimit(
      `email:${email.toLowerCase()}`,
      MAX_FAILED_ATTEMPTS,
      RATE_LIMIT_WINDOW
    );
    if (!emailLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many failed attempts for this account. Please try again later.",
          retryAfter: Math.ceil((emailLimit.resetTime - Date.now()) / 1000),
        },
        { status: 429 }
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

    // ─── AUTHENTICATION ───
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData?.session) {
      console.error("Auth error:", authError?.message);

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

      return NextResponse.json(
        { error: authError?.message || "Invalid email or password" },
        { status: 401 }
      );
    }

    const { access_token, refresh_token, expires_in } = authData.session;
    const userId = authData.user.id;

    // ─── USER PROFILE & BLOCK CHECK ───
    const userProfile = await getUserWithDetails(userId);

    if (!userProfile) {
      return NextResponse.json(
        { error: "Account not found. Please sign up first." },
        { status: 404 }
      );
    }

    if (userProfile.is_blocked) {
      return NextResponse.json(
        {
          error: "Your account has been blocked. Please contact support for assistance.",
          blocked: true,
          blockedReason: userProfile.block_reason,
          blockedAt: userProfile.blocked_at,
        },
        { status: 403 }
      );
    }

    // ─── SECURITY ANALYSIS ───
    let securityContext = await analyzeLoginRisk(supabase, userId, {
      ip,
      location,
      device,
      timestamp,
    });

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
      console.log("🔓 Development localhost detected — bypassing geo/time risk checks");
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
        `⚠️ Suspicious login allowed for ${email} from ${location.city}, ${location.country} (score: ${securityContext.riskScore})`
      );
    }

    // ─── GENERATE UNIQUE SESSION TOKEN ───
    const sessionToken = generateSessionId();
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    try {
      await supabaseAdmin
        .from("users")
        .update({
          current_session_id: sessionToken,
          current_session_ip: ip,
          current_session_device: `${device.platform} | ${device.userAgent?.slice(0, 60)}`,
          current_session_expires_at: sessionExpiresAt.toISOString(),
        })
        .eq("id", userId);
    } catch (e) {
      console.error("Failed to update session in DB:", e);
    }

    console.log(`🔑 Session ${sessionToken.slice(0, 8)}... created for ${email}`);

    // ─── BUSINESS INFO ───
    const { data: businessData, error: businessError } = await supabase
      .from("businesses")
      .select("business_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (businessError && businessError.code !== "PGRST116") {
      console.error("Error fetching business:", businessError.message);
    }

    const displayName = businessData?.business_name || userProfile.full_name;

    // ─── ✅ FETCH STORE DATA (Optimized - non-blocking) ───
    let storeData = null;
    try {
      // Quick query, not blocking the login flow
      const { data: store, error: storeError } = await supabaseAdmin
        .from("online_stores")
        .select("id, name, slug, description, keywords, cac_number, logo_url, cover_url, country, state, city, street_address, location_enabled, is_active, activation_paid, activated_at, activation_reference, wallet_balance, total_revenue, total_orders, total_views, created_at, updated_at")
        .eq("owner_id", userId)
        .maybeSingle();

      if (!storeError && store) {
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
    } catch (storeFetchError) {
      // Silent fail - store data is optional and shouldn't block login
      console.debug("Store fetch skipped or failed (non-critical):", storeFetchError);
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
      cookieStore.set("sb-session-risk", securityContext.riskScore.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      }),
      cookieStore.set("sb-session-id", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      }),
    ]);

    // ─── LOG SUCCESSFUL LOGIN (fire and forget) ───
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
        // Silent fail - login history is non-critical
      }
    });

    // ─── UPDATE TRUSTED DEVICES (fire and forget) ───
    if (device.fingerprint) {
      Promise.resolve().then(async () => {
        try {
          await supabase.from("trusted_devices").upsert(
            {
              user_id: userId,
              device_fingerprint: device.fingerprint,
              device_name: `${device.platform} - ${device.userAgent?.split(" ").slice(-1)[0] || "Browser"}`,
              last_location: `${location.city}, ${location.country}`,
              last_ip: ip,
              last_used: new Date().toISOString(),
              is_trusted: !isSuspicious,
            },
            {
              onConflict: "user_id,device_fingerprint",
            }
          );
        } catch (e) {
          // Silent fail
        }
      });
    }

    // ─── ✅ RESPONSE WITH PROFILE AND STORE DATA ───
    const profile = {
      id: userProfile.id,
      fullName: displayName,
      email: userProfile.email,
      phone: userProfile.phone,
      currentLoginSession: sessionToken,
      zidcoinBalance: userProfile.zidcoin_balance,
      walletBalance: userProfile.wallet_balance,
      bvnVerification: userProfile.bvn_verification,
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
      // ✅ Store data included in profile (non-blocking)
      store: storeData,
      hasStore: storeData !== null,
      storeIsActive: storeData?.is_active === true && storeData?.activation_paid === true,
      storePendingActivation: storeData !== null && (storeData.is_active === false || storeData.activation_paid === false),
    };

    const responseTime = Date.now() - startTime;
    console.log(
      `✅ Login completed in ${responseTime}ms for ${email}${storeData ? ` (Store: ${storeData.slug})` : ''}`
    );

    return NextResponse.json({
      profile,
      isVerified: profile.bvnVerification === "verified",
      sessionEstablished: true,
      access_token,
      refresh_token,
      expires_in,
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}