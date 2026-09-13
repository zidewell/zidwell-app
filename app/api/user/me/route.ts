// app/api/user/me/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// FIXES:
//  1. Returns the FULL user profile — not just id/email/subscription.
//     The original returned a partial object which broke any consumer
//     expecting full_name, phone, wallet_balance, bvn_verification, etc.
//  2. Reads from the `users` table via the service-role admin client,
//     so RLS on the anon role can't silently null out fields.
//  3. Never returns 401 for missing optional fields — only for missing auth.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";
import { getSupabaseAdmin } from "@/lib/suabase-admin";

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

    // Fetch the full user record from the users table
    const { data: profile, error } = await supabase
      .from("users")
      .select(
        "id, full_name, email, phone, wallet_balance, zidcoin_balance, referral_code, bvn_verification, admin_role, city, state, address, date_of_birth, profile_picture, current_login_session, subscription_tier, subscription_expires_at, is_blocked, blocked_at, block_reason, pin_set"
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

    // Shape the response the same way the login route does
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
      subscription_tier: profile.subscription_tier || "free",
      subscription_expires_at: profile.subscription_expires_at,
      isBlocked: profile.is_blocked,
      blockedAt: profile.blocked_at,
      blockReason: profile.block_reason,
      pinSet: profile.pin_set,
    };

    if (newTokens) {
      return createAuthResponse(userProfile, newTokens);
    }

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("❌ Error in /api/me:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}