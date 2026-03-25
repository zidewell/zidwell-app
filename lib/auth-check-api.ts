// lib/check-auth.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  subscription_tier?: 'free' | 'zidlite' | 'growth' | 'premium' | 'elite';
  subscription_expires_at?: string | null;
  is_subscription_active?: boolean;
}

export interface AuthResult {
  user: AuthenticatedUser | null;
  newTokens?: {
    accessToken: string;
    refreshToken: string;
  };
}

// Create Supabase admin client (bypasses RLS)
const getSupabaseAdmin = () => {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    }
  );
};

// Create Supabase anon client for refresh operations
const getSupabaseAnon = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    }
  );
};

export async function isAuthenticated(req: NextRequest): Promise<AuthenticatedUser | null> {
  const result = await isAuthenticatedWithRefresh(req);
  return result.user;
}

export async function isAuthenticatedWithRefresh(req: NextRequest): Promise<AuthResult> {
  try {
    const accessToken = req.cookies.get("sb-access-token")?.value;
    const refreshToken = req.cookies.get("sb-refresh-token")?.value;

    if (!accessToken && !refreshToken) {
      console.log("🔴 No auth tokens found");
      return { user: null };
    }

    const supabaseAdmin = getSupabaseAdmin();
    let user = null;
    let newTokens = undefined;

    // Try to validate the access token
    if (accessToken) {
      const { data: { user: userData }, error: tokenError } = await supabaseAdmin.auth.getUser(accessToken);
      
      if (!tokenError && userData) {
        user = userData;
      } else if (tokenError?.message?.includes('JWT expired') && refreshToken) {
        console.log("🔄 Access token expired, attempting refresh...");
        
        // Try to refresh the session
        const supabaseAnon = getSupabaseAnon();
        const { data: refreshData, error: refreshError } = await supabaseAnon.auth.refreshSession({
          refresh_token: refreshToken,
        });
        
        if (!refreshError && refreshData.session) {
          console.log("✅ Token refreshed successfully");
          
          // Get user from refreshed session
          const { data: { user: refreshedUser } } = await supabaseAdmin.auth.getUser(
            refreshData.session.access_token
          );
          
          if (refreshedUser) {
            user = refreshedUser;
            newTokens = {
              accessToken: refreshData.session.access_token,
              refreshToken: refreshData.session.refresh_token!,
            };
          }
        } else {
          console.log("❌ Token refresh failed:", refreshError?.message);
        }
      } else if (tokenError) {
        console.log("🔴 Token validation error:", tokenError.message);
      }
    }

    if (!user) {
      console.log("🔴 No valid user found");
      return { user: null };
    }

    // Fetch user data from database
    const { data: userData, error: dbError } = await supabaseAdmin
      .from("users")
      .select("subscription_tier, subscription_expires_at")
      .eq("id", user.id)
      .single();

    if (dbError) {
      console.error("🔴 Error fetching user data:", dbError);
      // Return basic user info even if DB fetch fails
      const basicUser: AuthenticatedUser = {
        id: user.id,
        email: user.email!,
        subscription_tier: 'free',
        is_subscription_active: true,
      };
      return { user: basicUser, newTokens };
    }

    // Check subscription status
    let isSubscriptionActive = true;
    if (userData.subscription_tier && userData.subscription_tier !== 'free') {
      if (userData.subscription_expires_at) {
        const expiresAt = new Date(userData.subscription_expires_at);
        isSubscriptionActive = expiresAt > new Date();
      }
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email!,
      subscription_tier: userData.subscription_tier || 'free',
      subscription_expires_at: userData.subscription_expires_at,
      is_subscription_active: isSubscriptionActive,
    };

    console.log("✅ User authenticated:", { 
      id: user.id, 
      tier: authenticatedUser.subscription_tier,
      isActive: isSubscriptionActive,
      refreshed: !!newTokens
    });

    return { user: authenticatedUser, newTokens };
  } catch (error) {
    console.error("🔴 Auth error:", error);
    return { user: null };
  }
}

// Helper function to create response with new tokens
export function createAuthResponse(
  data: any, 
  newTokens?: { accessToken: string; refreshToken: string }
) {
  const response = NextResponse.json(data);
  
  if (newTokens) {
    response.cookies.set("sb-access-token", newTokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    response.cookies.set("sb-refresh-token", newTokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    console.log("🔄 New tokens set in response");
  }
  
  return response;
}

// Enhanced requireAuth that handles token refresh
export async function requireAuth(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);
  
  if (!user) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { 
          error: 'Unauthorized', 
          message: 'Session expired',
          logout: true 
        },
        { status: 401 }
      )
    };
  }

  return { authenticated: true, user, newTokens };
}

// Check if user has required subscription tier
export async function hasRequiredTier(
  req: NextRequest,
  requiredTier: 'free' | 'zidlite' | 'growth' | 'premium' | 'elite'
): Promise<{ hasAccess: boolean; user: AuthenticatedUser | null; newTokens?: any; error?: string }> {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);
  
  if (!user) {
    return { 
      hasAccess: false, 
      user: null, 
      error: "Authentication required" 
    };
  }

  const tierHierarchy = ['free', 'zidlite', 'growth', 'premium', 'elite'];
  const userTierIndex = tierHierarchy.indexOf(user.subscription_tier || 'free');
  const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

  if (userTierIndex < requiredTierIndex) {
    return {
      hasAccess: false,
      user,
      newTokens,
      error: `This feature requires the ${requiredTier} plan or higher. Current plan: ${user.subscription_tier || 'free'}`,
    };
  }

  if (requiredTier !== 'free' && !user.is_subscription_active) {
    return {
      hasAccess: false,
      user,
      newTokens,
      error: "Your subscription is not active. Please renew to continue accessing this feature.",
    };
  }

  return { hasAccess: true, user, newTokens };
}

// Check feature access based on subscription
export async function checkFeatureAccess(
  req: NextRequest,
  featureKey: string,
  currentCount?: number
): Promise<{ hasAccess: boolean; user: AuthenticatedUser | null; newTokens?: any; limit?: number; error?: string }> {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);
  
  if (!user) {
    return { 
      hasAccess: false, 
      user: null, 
      error: "Authentication required" 
    };
  }

  const supabaseAdmin = getSupabaseAdmin();
  
  const utilityFeatures = ['transfer_fee'];
  if (utilityFeatures.includes(featureKey)) {
    return { hasAccess: true, user, newTokens };
  }

  try {
    const { data: features, error: featuresError } = await supabaseAdmin
      .from("subscription_features")
      .select("feature_key, feature_value, feature_limit")
      .eq("tier", user.subscription_tier || 'free');

    if (featuresError) {
      console.error("Error fetching features:", featuresError);
      return { hasAccess: false, user, newTokens, error: "Error checking feature access" };
    }

    const feature = features.find(f => f.feature_key === featureKey);

    if (!feature) {
      return { 
        hasAccess: false, 
        user, 
        newTokens,
        error: `Feature ${featureKey} not available in your plan` 
      };
    }

    if (feature.feature_value === 'true' || feature.feature_value === 'unlimited') {
      return { hasAccess: true, user, newTokens };
    }

    if (feature.feature_limit && currentCount !== undefined) {
      if (currentCount >= feature.feature_limit) {
        return {
          hasAccess: false,
          user,
          newTokens,
          limit: feature.feature_limit,
          error: `You've reached your ${featureKey.replace(/_/g, ' ')} limit of ${feature.feature_limit} for the ${user.subscription_tier} plan`,
        };
      }
      return { hasAccess: true, user, newTokens, limit: feature.feature_limit };
    }

    return { hasAccess: true, user, newTokens };
  } catch (error) {
    console.error("Error in checkFeatureAccess:", error);
    return { hasAccess: false, user, newTokens, error: "Error checking feature access" };
  }
}

// Get user subscription details
export async function getUserSubscriptionDetails(userId: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      console.error("Error fetching subscription:", subError);
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("subscription_tier, subscription_expires_at")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user:", userError);
      return null;
    }

    const { data: features, error: featuresError } = await supabaseAdmin
      .from("subscription_features")
      .select("feature_key, feature_value, feature_limit")
      .eq("tier", user.subscription_tier || 'free');

    if (featuresError) {
      console.error("Error fetching features:", featuresError);
    }

    const featuresMap = features?.reduce((acc, feature) => {
      acc[feature.feature_key] = {
        value: feature.feature_value,
        limit: feature.feature_limit,
      };
      return acc;
    }, {} as Record<string, any>) || {};

    return {
      tier: user.subscription_tier || 'free',
      status: subscription?.status || (user.subscription_tier === 'free' ? 'active' : 'inactive'),
      expiresAt: user.subscription_expires_at,
      features: featuresMap,
      subscriptionId: subscription?.id,
    };
  } catch (error) {
    console.error("Error in getUserSubscriptionDetails:", error);
    return null;
  }
}

// Check usage limits
export async function checkUsageLimit(
  userId: string,
  featureKey: string,
  currentCount: number
): Promise<{ withinLimit: boolean; limit?: number; error?: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    const { data: features, error } = await supabaseAdmin
      .from("subscription_features")
      .select("feature_limit")
      .eq("tier", (await getUserSubscriptionDetails(userId))?.tier || 'free')
      .eq("feature_key", featureKey)
      .single();

    if (error || !features) {
      return { withinLimit: true };
    }

    const limit = features.feature_limit;
    if (limit && currentCount >= limit) {
      return {
        withinLimit: false,
        limit,
        error: `You've reached your ${featureKey.replace(/_/g, ' ')} limit of ${limit}`,
      };
    }

    return { withinLimit: true, limit };
  } catch (error) {
    console.error("Error checking usage limit:", error);
    return { withinLimit: true };
  }
}

// Increment usage (placeholder - implement actual logic)
export async function incrementUsage(
  userId: string,
  featureKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Incrementing usage for user ${userId}, feature ${featureKey}`);
    // Add your actual increment logic here
    return { success: true };
  } catch (error) {
    console.error("Error incrementing usage:", error);
    return { success: false, error: "Failed to increment usage" };
  }
}

// Redirect to login with callback URL
export function redirectToLogin(req: NextRequest, customMessage?: string) {
  const { pathname, search } = req.nextUrl;
  const fullUrl = `${pathname}${search}`;
  
  const loginUrl = new URL("/auth/login", req.url);
  loginUrl.searchParams.set("callbackUrl", encodeURIComponent(fullUrl));
  
  if (customMessage) {
    loginUrl.searchParams.set("message", encodeURIComponent(customMessage));
  }
  
  return loginUrl.toString();
}

// Clear all auth cookies
export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete("sb-access-token");
  response.cookies.delete("sb-refresh-token");
  response.cookies.delete("verified");
  return response;
}