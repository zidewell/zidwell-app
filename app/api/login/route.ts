import { getUserWithDetails, UserDetails } from "@/lib/suabase-admin"; 
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/app/supabase/supabase";

export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
    const { email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // 1️⃣ Sign in the user
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData?.session) {
      console.error("Auth error:", authError?.message);
      return NextResponse.json(
        { error: authError?.message || "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user is blocked
    const { access_token, refresh_token, expires_in } = authData.session;
    const userId = authData.user.id;

    // Get user profile to check if blocked
    const userProfile = await getUserWithDetails(userId);
    
    if (!userProfile) {
      return NextResponse.json(
        { error: "Account not found. Please sign up first." },
        { status: 404 }
      );
    }

    // Check if user is blocked
    if (userProfile.is_blocked) {
      return NextResponse.json(
        { 
          error: "Your account has been blocked. Please contact support for assistance.",
          blocked: true,
          blockedReason: userProfile.block_reason,
          blockedAt: userProfile.blocked_at
        },
        { status: 403 }
      );
    }

    // Fetch user's business information
    const { data: businessData, error: businessError } = await supabase
      .from("businesses")
      .select("business_name")
      .eq("user_id", userId)
      .maybeSingle(); 

    if (businessError && businessError.code !== "PGRST116") { 
      console.error("Error fetching business:", businessError.message);
    }

    const displayName = businessData?.business_name || userProfile.full_name;

    // 2️⃣ Set HTTP-only cookies with proper persistence
    const cookieStore = await cookies();
    
    // Set cookies with longer expiration for persistence across page refreshes
    await Promise.all([
      cookieStore.set("sb-access-token", access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      }),
      cookieStore.set("sb-refresh-token", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      }),
      cookieStore.set("sb-client-session", "true", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      }),
      cookieStore.set("sb-login-time", Date.now().toString(), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60, 
      }),
    ]);

    const profile = {
      id: userProfile.id,
      fullName: displayName,
      email: userProfile.email,
      phone: userProfile.phone,
      currentLoginSession: userProfile.current_login_session,
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
    };

    const responseTime = Date.now() - startTime;
    console.log(`Login API completed in ${responseTime}ms`);

    const response = NextResponse.json({
      profile,
      isVerified: profile.bvnVerification === "verified",
      sessionEstablished: true,
      access_token,  
      refresh_token, 
      expires_in,    
    });

    return response;
    
  } catch (err: any) {
    console.error("Login API Error:", err.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}