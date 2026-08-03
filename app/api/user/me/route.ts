import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client for fetching user data
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    console.log("🔍 /api/me called - checking authentication");

    const { user, newTokens } = await isAuthenticatedWithRefresh(req);
    
    if (!user) {
      console.log("❌ /api/me: User not authenticated");
      return NextResponse.json(
        { error: "Unauthorized", message: "No valid session found" },
        { status: 401 }
      );
    }

    console.log(`✅ /api/me: User authenticated - ID: ${user.id}, Email: ${user.email}`);

    // Fetch user profile from Supabase
    const { data: userProfile, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        full_name,
        first_name,
        last_name,
        phone,
        bvn_verification,
        identity_verified,
        kyc_level,
        verification_completed,
        bank78_verified,
        purpose,
        onboarding_completed,
        subscription_tier,
        subscription_expires_at,
        admin_role,
        wallet_balance,
        zidcoin_balance,
        email_verified,
        country,
        is_blocked,
        date_of_birth,
        city,
        state,
        address,
        profile_picture,
        referral_code,
        referred_by,
        created_at,
        updated_at,
        last_login,
        bank78_personal_bank_name,
        bank78_personal_account_name,
        bank78_personal_account_id,
        bank78_business_account_name,
        bank78_business_bank_name,
        bank78_business_account_id,
        primary_provider,
        wallet_provider,
        verification_step,
        onboarding_step,
        bank_account_name,
        bank_name,
        wallet_id,
        verified_at,
        verification_provider,
        verification_reference,
        verification_id,
        verification_status,
        face_match_verified,
        dob_verified,
        name_verified,
        is_business_registered,
        pin_set,
        notification_preferences
      `)
      .eq('id', user.id)
      .single();

    if (error) {
      console.error("❌ Error fetching user profile:", error);
      // Return minimal user info if fetch fails
      const fallbackProfile = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        subscription_tier: 'free',
        onboarding_completed: false,
        verification_completed: false,
        purpose: 'personal',
        is_business_registered: false,
      };
      
      if (newTokens) {
        return createAuthResponse({ user: fallbackProfile }, newTokens);
      }
      return NextResponse.json({ user: fallbackProfile });
    }

    // ✅ FETCH BUSINESS DATA if user is a business
    let businessData = null;
    if (userProfile.purpose === "business") {
      const { data: business, error: businessError } = await supabaseAdmin
        .from("businesses")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!businessError && business) {
        businessData = business;
        console.log(`✅ Business data fetched for user ${user.id}:`, {
          business_name: business.business_name,
          is_registered: business.is_registered,
          verification_status: business.verification_status,
        });
      } else {
        console.log(`⚠️ No business data found for user ${user.id}`);
      }
    }

    // ✅ Build safe profile with business data
    const safeProfile = {
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
      is_registered: businessData?.is_registered || false,
      
      // ✅ Bank name only (no account numbers)
      bank78_personal_bank_name: userProfile.bank78_personal_bank_name || "Bank78",
      bank_name: userProfile.bank_name || userProfile.bank78_personal_bank_name || "Bank78",
      
      // ✅ Account name only (just a name)
      bank78_personal_account_name: userProfile.bank78_personal_account_name || "",
      bank78_business_account_name: userProfile.bank78_business_account_name || "",
      bank_account_name: userProfile.bank_account_name || userProfile.bank78_personal_account_name || "",
      
      // ✅ Account IDs (just identifiers)
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
      
      // Notification preferences
      notification_preferences: userProfile.notification_preferences || {},
      
      // ✅ Full business data for onboarding
      // businessData: businessData, // Include full business data if needed
    };

    console.log(`✅ /api/me: Safe profile fetched for user ${user.id}`);

    // If tokens were refreshed, include them in the response
    if (newTokens) {
      console.log("🔄 /api/me: Tokens were refreshed, updating cookies");
      return createAuthResponse({ user: safeProfile }, newTokens);
    }

    return NextResponse.json({ user: safeProfile });
  } catch (error) {
    console.error("❌ Error in /api/me:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}