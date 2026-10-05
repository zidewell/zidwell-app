// app/api/user/me/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Returns the FULL user profile including account_tier + custom fee overrides.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const { user, newTokens } = await isAuthenticatedWithRefresh(req);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "No valid session found" },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: profile, error } = await supabase
      .from("users")
      .select(
        "id, full_name, email, phone, wallet_balance, zidcoin_balance, referral_code, bvn_verification, admin_role, city, state, address, date_of_birth, profile_picture, current_login_session, subscription_tier, subscription_expires_at, is_blocked, blocked_at, block_reason, pin_set, account_tier, custom_outflow_percent, custom_outflow_min, custom_fee_note"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("❌ /api/me: Error fetching profile:", error);
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const userProfile = {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      walletBalance: profile.wallet_balance ?? 0,
      zidcoinBalance: profile.zidcoin_balance ?? 0,
      referralCode: profile.referral_code,
      bvnVerification: profile.bvn_verification,
      role: profile.admin_role,
      city: profile.city,
      state: profile.state,
      address: profile.address,
      dateOfBirth: profile.date_of_birth,
      profilePicture: profile.profile_picture,
      currentLoginSession: profile.current_login_session,
      subscriptionTier: profile.subscription_tier || "free",
      subscriptionExpiresAt: profile.subscription_expires_at,
      isBlocked: profile.is_blocked,
      blockedAt: profile.blocked_at,
      blockReason: profile.block_reason,
      pinSet: profile.pin_set,

      // ✅ Account tier
      accountTier: (profile.account_tier as string) || "tier_3",

      // ✅ Custom fee overrides
      customOutflowPercent:
        profile.custom_outflow_percent != null
          ? Number(profile.custom_outflow_percent)
          : null,
      customOutflowMin:
        profile.custom_outflow_min != null
          ? Number(profile.custom_outflow_min)
          : null,
      customFeeNote: profile.custom_fee_note ?? null,
    };

    const response = newTokens
      ? createAuthResponse(userProfile, newTokens)
      : NextResponse.json(userProfile);

    // Prevent caching layers from serving stale data
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    console.error("❌ Error in /api/me:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}