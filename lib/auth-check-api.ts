import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AuthenticatedUser {
  id: string;
  email: string;
  subscription_tier?: 'free' | 'zidlite' | 'growth' | 'premium' | 'elite';
  subscription_expires_at?: string | null;
  is_subscription_active?: boolean;
}

export async function isAuthenticated(req: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const token = req.cookies.get("sb-access-token")?.value;
    
    if (!token) {
      console.log("🔴 No access token found");
      return null;
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("🔴 Auth error:", authError);
      return null;
    }

    const { data: userData, error: dbError } = await supabase
      .from("users")
      .select("subscription_tier, subscription_expires_at")
      .eq("id", user.id)
      .single();

    if (dbError) {
      console.error("🔴 Error fetching user data:", dbError);
      return {
        id: user.id,
        email: user.email!,
        subscription_tier: 'free',
        is_subscription_active: true,
      };
    }

    let isSubscriptionActive = true;
    if (userData.subscription_tier && userData.subscription_tier !== 'free') {
      if (userData.subscription_expires_at) {
        const expiresAt = new Date(userData.subscription_expires_at);
        isSubscriptionActive = expiresAt > new Date();
      }
    }

    console.log("✅ User authenticated:", { 
      id: user.id, 
      tier: userData.subscription_tier || 'free',
      isActive: isSubscriptionActive 
    });

    return {
      id: user.id,
      email: user.email!,
      subscription_tier: userData.subscription_tier || 'free',
      subscription_expires_at: userData.subscription_expires_at,
      is_subscription_active: isSubscriptionActive,
    };
  } catch (error) {
    console.error("🔴 Auth error:", error);
    return null;
  }
}

export async function hasRequiredTier(
  req: NextRequest,
  requiredTier: 'free' | 'zidlite' | 'growth' | 'premium' | 'elite'
): Promise<{ hasAccess: boolean; user: AuthenticatedUser | null; error?: string }> {
  const user = await isAuthenticated(req);
  
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
      error: `This feature requires the ${requiredTier} plan or higher. Current plan: ${user.subscription_tier || 'free'}`,
    };
  }

  if (requiredTier !== 'free' && !user.is_subscription_active) {
    return {
      hasAccess: false,
      user,
      error: "Your subscription is not active. Please renew to continue accessing this feature.",
    };
  }

  return { hasAccess: true, user };
}

export async function checkFeatureAccess(
  req: NextRequest,
  featureKey: string,
  currentCount?: number
): Promise<{ hasAccess: boolean; user: AuthenticatedUser | null; limit?: number; error?: string }> {
  const user = await isAuthenticated(req);
  
  if (!user) {
    return { 
      hasAccess: false, 
      user: null, 
      error: "Authentication required" 
    };
  }

  const utilityFeatures = ['transfer_fee'];
  if (utilityFeatures.includes(featureKey)) {
    return { hasAccess: true, user };
  }

  try {
    const { data: features, error: featuresError } = await supabase
      .from("subscription_features")
      .select("feature_key, feature_value, feature_limit")
      .eq("tier", user.subscription_tier || 'free');

    if (featuresError) {
      console.error("Error fetching features:", featuresError);
      return { hasAccess: false, user, error: "Error checking feature access" };
    }

    const feature = features.find(f => f.feature_key === featureKey);

    if (!feature) {
      return { 
        hasAccess: false, 
        user, 
        error: `Feature ${featureKey} not available in your plan` 
      };
    }

    if (feature.feature_value === 'true' || feature.feature_value === 'unlimited') {
      return { hasAccess: true, user };
    }

    if (feature.feature_limit && currentCount !== undefined) {
      if (currentCount >= feature.feature_limit) {
        return {
          hasAccess: false,
          user,
          limit: feature.feature_limit,
          error: `You've reached your ${featureKey.replace(/_/g, ' ')} limit of ${feature.feature_limit} for the ${user.subscription_tier} plan`,
        };
      }
      return { hasAccess: true, user, limit: feature.feature_limit };
    }

    return { hasAccess: true, user };
  } catch (error) {
    console.error("Error in checkFeatureAccess:", error);
    return { hasAccess: false, user, error: "Error checking feature access" };
  }
}

export async function getUserSubscriptionDetails(userId: string) {
  try {
    const { data: subscription, error: subError } = await supabase
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

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("subscription_tier, subscription_expires_at")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user:", userError);
      return null;
    }

    const { data: features, error: featuresError } = await supabase
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

export async function checkUsageLimit(
  userId: string,
  featureKey: string,
  currentCount: number
): Promise<{ withinLimit: boolean; limit?: number; error?: string }> {
  try {
    const { data: features, error } = await supabase
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

export async function incrementUsage(
  userId: string,
  featureKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Incrementing usage for user ${userId}, feature ${featureKey}`);
    return { success: true };
  } catch (error) {
    console.error("Error incrementing usage:", error);
    return { success: false, error: "Failed to increment usage" };
  }
}

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