import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/app/supabase/supabase";
import { getUserWithDetails, isUserFullyVerified } from "@/lib/suabase-admin";

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

    // ✅ FETCH BUSINESS DATA if user is a business
    let businessData = null;
    if (userProfile.purpose === "business") {
      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!businessError && business) {
        businessData = business;
        console.log(`✅ Business data fetched for user ${userId}`);
      }
    }

    const cookieStore = await cookies();

    // Set auth cookies
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
      admin_role: userProfile.admin_role || "user",
      wallet_balance: userProfile.wallet_balance || 0,
      zidcoin_balance: userProfile.zidcoin_balance || 0,
      email_verified: userProfile.email_verified || false,
      country: userProfile.country || "Nigeria",
      is_blocked: userProfile.is_blocked || false,
      date_of_birth: userProfile.date_of_birth || "",
      city: userProfile.city || "",
      state: userProfile.state || "",
      address: userProfile.address || "",
      profile_picture: userProfile.profile_picture || "",
      referral_code: userProfile.referral_code || "",
      referred_by: userProfile.referred_by || null,
      created_at: userProfile.created_at || new Date().toISOString(),
      updated_at: userProfile.updated_at || new Date().toISOString(),
      last_login: userProfile.last_login || new Date().toISOString(),
      
      // ✅ Business data from businesses table
      is_business_registered: businessData?.is_registered || userProfile.is_business_registered || false,
      business_name: businessData?.business_name || null,
      business_type: businessData?.business_type || null,
      business_address: businessData?.business_address || null,
      business_description: businessData?.business_description || null,
      map_url: businessData?.map_url || null,
      cac_number: businessData?.cac_number || null,
      cac_verified: businessData?.cac_verified || false,
      business_verification_status: businessData?.verification_status || "pending",
      
      // Bank78 info
      bank78_personal_bank_name: userProfile.bank78_personal_bank_name || "Bank78",
      bank_name: userProfile.bank_name || userProfile.bank78_personal_bank_name || "Bank78",
      bank78_personal_account_name: userProfile.bank78_personal_account_name || "",
      bank78_business_account_name: userProfile.bank78_business_account_name || "",
      bank_account_name: userProfile.bank_account_name || userProfile.bank78_personal_account_name || "",
      bank78_personal_account_id: userProfile.bank78_personal_account_id || "",
      bank78_business_account_id: userProfile.bank78_business_account_id || "",
      wallet_id: userProfile.wallet_id || userProfile.bank78_personal_account_id || "",
 
      // Provider info
      primary_provider: userProfile.primary_provider || "nomba",
      wallet_provider: userProfile.wallet_provider || "nomba",
      
      // Verification
      verification_step: userProfile.verification_step || 0,
      onboarding_step: userProfile.onboarding_step || 0,
      
      // Verification fields
      verified_at: userProfile.verified_at || null,
      verification_provider: userProfile.verification_provider || null,
      verification_reference: userProfile.verification_reference || null,
      verification_id: userProfile.verification_id || null,
      verification_status: userProfile.verification_status || "pending",
      face_match_verified: userProfile.face_match_verified || false,
      dob_verified: userProfile.dob_verified || false,
      name_verified: userProfile.name_verified || false,
      
      // PIN status
      pin_set: userProfile.pin_set || false,
     
      // businessData: businessData,
    };

    const isVerified = isUserFullyVerified(userProfile);

    console.log('✅ Login API - Full profile purpose:', fullProfile.purpose);
    console.log('✅ Login API - is_business_registered:', fullProfile.is_business_registered);

    return NextResponse.json({
      profile: fullProfile,
      isVerified,
      sessionEstablished: true,
      redirectTo: isVerified ? "/dashboard" : "/onboarding",
    });
  } catch (err: any) {
    console.error("Login API Error:", err.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ✅ OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Allow": "POST, OPTIONS",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}