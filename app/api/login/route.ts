import { getUserWithDetails } from "@/lib/suabase-admin";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/app/supabase/supabase";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData?.session) {
      return NextResponse.json(
        { error: authError?.message || "Invalid email or password" },
        { status: 401 }
      );
    }

    const { access_token, refresh_token } = authData.session;
    const userId = authData.user.id;

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
          error: "Your account has been blocked. Please contact support.",
          blocked: true,
        },
        { status: 403 }
      );
    }

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
    ]);

    const fullProfile = {
      id: userProfile.id,
      email: userProfile.email,
      fullName: userProfile.full_name || "",
      full_name: userProfile.full_name || "",
      first_name: userProfile.first_name || "",
      last_name: userProfile.last_name || "",
      phone: userProfile.phone || "",
      bvn_verification: userProfile.bvn_verification || "unverified",
      identity_verified: userProfile.identity_verified || false,
      kyc_level: userProfile.kyc_level || "unverified",
      verification_completed: userProfile.verification_completed || false,
      bank78_verified: userProfile.bank78_verified || false,
      purpose: userProfile.purpose || "personal",
      onboarding_completed: userProfile.onboarding_completed || false,
      subscription_tier: userProfile.subscription_tier || "free",
      subscription_expires_at: userProfile.subscription_expires_at || null,
      admin_role: userProfile.admin_role || "",
      is_blocked: userProfile.is_blocked || false,
      email_verified: userProfile.email_verified || false,
      date_of_birth: userProfile.date_of_birth || "",
      city: userProfile.city || "",
      state: userProfile.state || "",
      address: userProfile.address || "",
      country: userProfile.country || "Nigeria",
      profile_picture: userProfile.profile_picture || "",
      wallet_balance: userProfile.wallet_balance || 0,
      zidcoin_balance: userProfile.zidcoin_balance || 0,
      referral_code: userProfile.referral_code || "",
      referred_by: userProfile.referred_by || null,
      created_at: userProfile.created_at || new Date().toISOString(),
      updated_at: userProfile.updated_at || new Date().toISOString(),
      last_login: userProfile.last_login || new Date().toISOString(),
      bank78_personal_account_number: userProfile.bank78_personal_account_number || "",
      bank78_personal_account_name: userProfile.bank78_personal_account_name || "",
      bank78_personal_bank_name: userProfile.bank78_personal_bank_name || "",
      // Sensitive data - only in memory, not stored
      current_login_session: userProfile.current_login_session || "",
      bvn_data: userProfile.bvn_data || null,
      cac_data: userProfile.cac_data || null,
      transaction_pin: userProfile.transaction_pin || "",
    };

    const safeProfile = {
      id: userProfile.id,
      email: userProfile.email,
      fullName: userProfile.full_name || "",
      phone: userProfile.phone || "",
      bvn_verification: userProfile.bvn_verification || "unverified",
      identity_verified: userProfile.identity_verified || false,
      kyc_level: userProfile.kyc_level || "unverified",
      verification_completed: userProfile.verification_completed || false,
      bank78_verified: userProfile.bank78_verified || false,
      purpose: userProfile.purpose || "personal",
      onboarding_completed: userProfile.onboarding_completed || false,
      subscription_tier: userProfile.subscription_tier || "free",
      subscription_expires_at: userProfile.subscription_expires_at || null,
      wallet_balance: userProfile.wallet_balance || 0,
    };

    const isVerified =
      userProfile.bvn_verification === "verified" ||
      userProfile.identity_verified === true ||
      userProfile.kyc_level === "personal_verified" ||
      userProfile.kyc_level === "business_verified" ||
      userProfile.verification_completed === true;

    return NextResponse.json({
      profile: fullProfile,
      safeProfile: safeProfile,
      isVerified,
      sessionEstablished: true,
    });
  } catch (err: any) {
    console.error("Login API Error:", err.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}