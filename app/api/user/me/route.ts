// app/api/user/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api"; 

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

    console.log(`✅ /api/me: User authenticated - ID: ${user.id}, Email: ${user.email}, Tier: ${user.subscription_tier}`);

    // Fetch additional user details if needed
    const userProfile = {
      id: user.id,
      email: user.email,
      subscription_tier: user.subscription_tier || 'free',
      subscription_expires_at: user.subscription_expires_at,
      is_subscription_active: user.is_subscription_active,
      // Add any other user fields you need
    };

    // If tokens were refreshed, include them in the response
    if (newTokens) {
      console.log("🔄 /api/me: Tokens were refreshed, updating cookies");
      return createAuthResponse({ success: true, ...userProfile }, newTokens);
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