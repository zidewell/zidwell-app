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

    const supabase = getSupabaseAdmin() as any;

    const { data: profile, error } = await supabase
      .from("users")
      .select(
        `
        id,
        full_name,
        email,
        phone,
        wallet_balance,
        zidcoin_balance,
        referral_code,
        bvn_verification,
        admin_role,
        city,
        state,
        address,
        date_of_birth,
        profile_picture,
        current_login_session,
        subscription_tier,
        subscription_expires_at,
        is_blocked,
        blocked_at,
        block_reason,
        pin_set,
        identity_verified,
        verification_completed,
        bank78_verified,
        is_business_registered,
        purpose,
        bank_name,
        bank_account_name,
        bank_account_number,
        activation_paid,
        activated_at,
        activation_reference,
        account_tier,
        custom_outflow_percent,
        custom_outflow_min,
        custom_fee_note`
      )
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("❌ /api/user/me: Error fetching profile:", error);
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

    // ─── Resolve effective subscription tier from zidstore_subscriptions ───
    // NOTE: zidstore_subscriptions is not yet present in generated Supabase
    // types. Cast the client for these two queries only — the runtime works.
    // Remove the cast once types are regenerated.
    const zidstoreDb = supabase as any;

    const { data: activeSub } = await zidstoreDb
      .from("zidstore_subscriptions")
      .select("plan_tier, current_period_end, billing_period, status")
      .eq("user_id", profile.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .maybeSingle();

    let effectiveSubscriptionTier = "free";
    let effectiveSubscriptionExpiresAt: string | null = null;

    if (activeSub && activeSub.status === "active") {
      const periodEnd = new Date(activeSub.current_period_end);
      if (periodEnd.getTime() > Date.now()) {
        effectiveSubscriptionTier = activeSub.plan_tier;
        effectiveSubscriptionExpiresAt = activeSub.current_period_end;
      } else {
        // Subscription technically active but expired — mark it
        await zidstoreDb
          .from("zidstore_subscriptions")
          .update({
            status: "expired",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", profile.id)
          .eq("status", "active");
      }
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

      // ✅ NOW resolved from zidstore_subscriptions
      subscriptionTier: effectiveSubscriptionTier,
      subscriptionExpiresAt: effectiveSubscriptionExpiresAt,

      isBlocked: profile.is_blocked,
      blockedAt: profile.blocked_at,
      blockReason: profile.block_reason,
      pinSet: profile.pin_set ?? false,

      // ─── Verification ───
      identityVerified: profile.identity_verified ?? false,
      verificationCompleted: profile.verification_completed ?? false,
      bank78Verified: profile.bank78_verified ?? false,
      is_business_registered: profile.is_business_registered ?? false,
      purpose: profile.purpose,

      // ─── Bank ───
      bankName: profile.bank_name,
      bankAccountName: profile.bank_account_name,
      bankAccountNumber: profile.bank_account_number,

      // ─── Activation ───
      activationPaid: profile.activation_paid ?? false,
      activatedAt: profile.activated_at,
      activationReference: profile.activation_reference,

      // ✅ Account tier (unrelated to subscription)
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

    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    console.error("❌ Error in /api/user/me:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}