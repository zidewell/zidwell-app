// lib/auth-check-api.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  subscription_tier?: "free" | "solopreneur" | "sme" | "enterprise" | "corporation";
  subscription_expires_at?: string | null;
  is_subscription_active?: boolean;
  subscription_status?: string;
  features?: Record<string, any>;
}

export interface AuthResult {
  user: AuthenticatedUser | null;
  newTokens?: {
    accessToken: string;
    refreshToken: string;
  };
}

export const plans = [
  {
    name: "Free",
    tier: "free",
    tagline: "Start Managing Your Money",
    price: "₦0",
    altPrice: "$0",
    suffix: "/month",
    note: "For individuals and early-stage freelancers.",
    region: "global",
    features: [
      "Manual bookkeeping — Global",
      "Auto-bookkeeping (Wallet users, Nigeria)",
      "Payment Links & Sales pages (Nigeria)",
      "Free business bank account (Nigeria)",
      "Up to 5 invoices — Global",
      "Up to 5 receipts — Global",
      "Basic financial overview",
    ],
    cta: "Start Free",
    featured: false,
    amount: 0,
  },
  {
    name: "ZidLite",
    tier: "solopreneur",
    tagline: "Get Organized",
    price: "₦4,900",
    altPrice: "$3.99",
    suffix: "/month",
    yearlyPrice: "₦49,000/year (save ₦9,800)",
    yearlyAmount: 49000,
    note: "For freelancers and solo business owners.",
    region: "global",
    features: [
      "Everything in Free, plus:",
      "Up to 10 invoices",
      "Unlimited receipts",
      "Branded invoices",
      "Better expense tracking",
      "Basic financial insights",
    ],
    cta: "Go ZidLite",
    featured: false,
    amount: 4900,
  },
  {
    name: "Growth",
    tier: "sme",
    tagline: "Run Your Business Properly",
    price: "₦29,900",
    altPrice: "$21.99",
    suffix: "/month",
    yearlyPrice: "₦299,000/year (save ₦59,800)",
    yearlyAmount: 299000,
    note: "For growing small businesses.",
    region: "global",
    features: [
      "Everything in ZidLite, plus:",
      "Upload bank statements (PDF / Excel / CSV)",
      "Connect up to 3 bank accounts — Nigeria",
      "Auto-bookkeeping from connected accounts — Nigeria",
      "Unlimited invoices & receipts",
      "Vault — store financial documents safely",
      "Tax calculator",
      "Financial statements (view): P&L · Cashflow · Balance Sheet",
      "1 extra team member",
    ],
    cta: "Go Growth",
    featured: true,
    amount: 29900,
  },
  {
    name: "Premium",
    tier: "enterprise",
    tagline: "Team Business Management",
    price: "₦100,000",
    altPrice: "$75",
    suffix: "/month",
    yearlyPrice: "₦1,000,000/year (save ₦200,000)",
    yearlyAmount: 1000000,
    note: "For teams that need structure.",
    region: "global",
    features: [
      "Everything in Growth, plus:",
      "Multi-user access (full team)",
      "Role-based permissions",
      "Approvals for payments, invoices, receipts, transfers",
      "Connect up to 5 bank accounts — Nigeria",
      "Downloadable financial reports",
      "10 contracts",
      "Dedicated onboarding support",
    ],
    cta: "Go Premium",
    featured: false,
    amount: 100000,
  },
  {
    name: "Elite",
    tier: "corporation",
    tagline: "Full Business Finance System",
    price: "₦300,000",
    altPrice: "$220",
    suffix: "/month",
    yearlyPrice: "₦3,000,000/year (save ₦600,000)",
    yearlyAmount: 3000000,
    note: "For large organizations and structured companies.",
    region: "global",
    features: [
      "Everything in Premium, plus:",
      "Unlimited contracts",
      "Department-based access (HR, Finance, Ops…)",
      "Connect unlimited bank accounts — Nigeria",
      "Simple payroll system",
      "Advanced financial reporting",
      "Custom financial structure setup",
      "Priority onboarding & dedicated account manager",
    ],
    cta: "Talk to Sales",
    featured: false,
    amount: 300000,
  },
];

const TIER_HIERARCHY = ["free", "solopreneur", "sme", "enterprise", "corporation"] as const;

const FEATURE_LIMITS: Record<string, Record<string, number>> = {
  free: {
    invoices: 5,
    receipts: 5,
    team_members: 0,
    bank_accounts: 0,
    contracts: 0,
    bvn_verification: 0,
    cac_verification: 0,
  },
  solopreneur: {
    invoices: 10,
    receipts: -1,
    team_members: 0,
    bank_accounts: 0,
    contracts: 0,
    bvn_verification: 1,
    cac_verification: 0,
  },
  sme: {
    invoices: -1,
    receipts: -1,
    team_members: 1,
    bank_accounts: 3,
    contracts: 0,
    bvn_verification: 5,
    cac_verification: 3,
  },
  enterprise: {
    invoices: -1,
    receipts: -1,
    team_members: -1,
    bank_accounts: 5,
    contracts: 10,
    bvn_verification: 20,
    cac_verification: 15,
  },
  corporation: {
    invoices: -1,
    receipts: -1,
    team_members: -1,
    bank_accounts: -1,
    contracts: -1,
    bvn_verification: 50,
    cac_verification: 50,
  },
};

export const TIER_DISPLAY_NAMES: Record<string, string> = {
  free: "Free",
  solopreneur: "ZidLite",
  sme: "Growth",
  enterprise: "Premium",
  corporation: "Elite",
};

export type SubscriptionTier = "free" | "solopreneur" | "sme" | "enterprise" | "corporation";

// Old tier name to new tier name mapping (for backward compatibility)
export const TIER_MIGRATION_MAP: Record<string, string> = {
  free: "free",
  zidlite: "solopreneur",
  growth: "sme",
  premium: "enterprise",
  elite: "corporation",
};

export const TIER_REVERSE_MAP: Record<string, string> = {
  free: "free",
  solopreneur: "zidlite",
  sme: "growth",
  enterprise: "premium",
  corporation: "elite",
};

// Create Supabase admin client (bypasses RLS)
const getSupabaseAdmin = () => {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
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
      },
    }
  );
};

export async function isAuthenticated(req: NextRequest): Promise<AuthenticatedUser | null> {
  const result = await isAuthenticatedWithRefresh(req);
  return result.user;
}

export function getPlanFeatures(tier: string): any {
  const plan = plans.find((p) => p.tier === tier);
  return plan || plans[0];
}

export function isFeatureAvailable(tier: string, featureKey: string): boolean {
  const plan = getPlanFeatures(tier);
  return plan.features.some((feature: string) =>
    feature.toLowerCase().includes(featureKey.toLowerCase())
  );
}

export function getFeatureLimit(tier: string, featureKey: string): number {
  return FEATURE_LIMITS[tier]?.[featureKey] ?? 0;
}

export async function getUserFeatureUsage(
  userId: string,
  featureKey: string
): Promise<number> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    if (featureKey === "bvn_verification" || featureKey === "cac_verification") {
      const { count, error } = await supabaseAdmin
        .from("verification_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("verification_type", featureKey.replace("_verification", ""))
        .eq("status", "verified");

      if (error) throw error;
      return count || 0;
    }

    return 0;
  } catch (error) {
    console.error(`Error getting usage for ${featureKey}:`, error);
    return 0;
  }
}

export async function checkFeatureLimit(
  userId: string,
  tier: string,
  featureKey: string
): Promise<{
  withinLimit: boolean;
  current: number;
  limit: number;
  remaining: number;
}> {
  const limit = getFeatureLimit(tier, featureKey);

  if (limit === -1) {
    return { withinLimit: true, current: 0, limit: -1, remaining: -1 };
  }

  const current = await getUserFeatureUsage(userId, featureKey);
  const remaining = limit - current;

  return {
    withinLimit: current < limit,
    current,
    limit,
    remaining: Math.max(0, remaining),
  };
}

export async function getUserSubscriptionFeatures(
  userId: string,
  tier: string
): Promise<Record<string, any>> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: features, error } = await supabaseAdmin
      .from("subscription_features")
      .select("feature_key, feature_value, feature_limit")
      .eq("tier", tier || "free");

    if (error) throw error;

    const featuresMap: Record<string, any> = {};
    features?.forEach((feature: any) => {
      featuresMap[feature.feature_key] = {
        value: feature.feature_value,
        limit: feature.feature_limit,
      };
    });

    return featuresMap;
  } catch (error) {
    console.error("Error fetching subscription features:", error);
    return {};
  }
}

export async function isAuthenticatedWithRefresh(
  req: NextRequest
): Promise<AuthResult> {
  try {
    const accessToken = req.cookies.get("sb-access-token")?.value;
    const refreshToken = req.cookies.get("sb-refresh-token")?.value;

    if (!accessToken && !refreshToken) {
      return { user: null };
    }

    const supabaseAdmin = getSupabaseAdmin();
    let user = null;
    let newTokens: AuthResult["newTokens"] = undefined;

    if (accessToken) {
      const {
        data: { user: userData },
        error: tokenError,
      } = await supabaseAdmin.auth.getUser(accessToken);

      if (!tokenError && userData) {
        user = userData;
      } else if (
        tokenError?.message?.includes("JWT expired") &&
        refreshToken
      ) {

        const supabaseAnon = getSupabaseAnon();
        const { data: refreshData, error: refreshError } =
          await supabaseAnon.auth.refreshSession({
            refresh_token: refreshToken,
          });

        if (!refreshError && refreshData.session) {

          const { data: { user: refreshedUser } } =
            await supabaseAdmin.auth.getUser(
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
        }
      } else if (tokenError) {
        console.error("Token validation error:", tokenError.message);
      }
    }

    if (!user) {
      return { user: null };
    }

   
    const { data: userData, error: dbError } = await supabaseAdmin
      .from("users")
      .select(
        "subscription_tier, subscription_expires_at"
      )
      .eq("id", user.id)
      .single();

    if (dbError) {
      console.error("🔴 Error fetching user data:", dbError);
      const basicUser: AuthenticatedUser = {
        id: user.id,
        email: user.email!,
        subscription_tier: "free",
        is_subscription_active: true,
        subscription_status: "active",
        features: {},
      };
      return { user: basicUser, newTokens };
    }

    // Check subscription status from the subscriptions table
    let isSubscriptionActive = true;
    let subscriptionStatus = "active";

    if (userData.subscription_tier && userData.subscription_tier !== "free") {
      // Check if there's an active subscription in the subscriptions table
      const { data: subscription, error: subError } = await supabaseAdmin
        .from("subscriptions")
        .select("status, expires_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!subError && subscription) {
        subscriptionStatus = subscription.status || "active";
        
        // Check expiration if exists
        if (subscription.expires_at) {
          const expiresAt = new Date(subscription.expires_at);
          isSubscriptionActive = expiresAt > new Date() && subscription.status === "active";
        } else {
          isSubscriptionActive = subscription.status === "active";
        }
      } else if (userData.subscription_expires_at) {
        // Fallback to using subscription_expires_at from users table
        const expiresAt = new Date(userData.subscription_expires_at);
        isSubscriptionActive = expiresAt > new Date();
        subscriptionStatus = isSubscriptionActive ? "active" : "expired";
      } else {
        // If no subscription record and no expiry date, assume inactive for paid tiers
        isSubscriptionActive = false;
        subscriptionStatus = "inactive";
      }
    }

    const tier = userData.subscription_tier || "free";

    const { data: features, error: featuresError } = await supabaseAdmin
      .from("subscription_features")
      .select("feature_key, feature_value, feature_limit")
      .eq("tier", tier);

    if (featuresError) {
      console.error("Error fetching features:", featuresError);
    }

    const featuresMap: Record<string, any> = {};
    features?.forEach((feature: any) => {
      featuresMap[feature.feature_key] = {
        value: feature.feature_value,
        limit: feature.feature_limit,
      };
    });

    const usageInfo: Record<string, any> = {};
    const featureKeys = [
      "invoices",
      "receipts",
      "team_members",
      "bank_accounts",
      "contracts",
      "bvn_verification",
      "cac_verification",
    ];

    for (const key of featureKeys) {
      const limitCheck = await checkFeatureLimit(user.id, tier, key);
      usageInfo[key] = {
        current: limitCheck.current,
        limit: limitCheck.limit,
        remaining: limitCheck.remaining,
        withinLimit: limitCheck.withinLimit,
      };
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email!,
      subscription_tier: tier,
      subscription_expires_at: userData.subscription_expires_at,
      is_subscription_active: isSubscriptionActive,
      subscription_status: subscriptionStatus,
      features: {
        ...featuresMap,
        usage: usageInfo,
        planDetails: getPlanFeatures(tier),
      },
    };

    return { user: authenticatedUser, newTokens };
  } catch (error) {
    console.error("🔴 Auth error:", error);
    return { user: null };
  }
}

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
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set("sb-refresh-token", newTokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
     });
   }

   return response;
}

export async function requireAuth(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    return {
      authenticated: false,
      response: NextResponse.json(
        {
          error: "Unauthorized",
          message: "Session expired",
          logout: true,
        },
        { status: 401 }
      ),
    };
  }

  return { authenticated: true, user, newTokens };
}

export async function hasRequiredTier(
  req: NextRequest,
  requiredTier: "free" | "solopreneur" | "sme" | "enterprise" | "corporation"
): Promise<{
  hasAccess: boolean;
  user: AuthenticatedUser | null;
  newTokens?: any;
  error?: string;
}> {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    return {
      hasAccess: false,
      user: null,
      error: "Authentication required",
    };
  }

  const userTierIndex = TIER_HIERARCHY.indexOf(
    user.subscription_tier || "free"
  );
  const requiredTierIndex = TIER_HIERARCHY.indexOf(requiredTier);

  if (userTierIndex < requiredTierIndex) {
    return {
      hasAccess: false,
      user,
      newTokens,
      error: `This feature requires the ${requiredTier} plan or higher. Current plan: ${user.subscription_tier || "free"}`,
    };
  }

  if (requiredTier !== "free" && !user.is_subscription_active) {
    return {
      hasAccess: false,
      user,
      newTokens,
      error: "Your subscription is not active. Please renew to continue accessing this feature.",
    };
  }

  return { hasAccess: true, user, newTokens };
}

export async function checkFeatureAccess(
  req: NextRequest,
  featureKey: string,
  currentCount?: number
): Promise<{
  hasAccess: boolean;
  user: AuthenticatedUser | null;
  newTokens?: any;
  limit?: number;
  error?: string;
}> {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    return {
      hasAccess: false,
      user: null,
      error: "Authentication required",
    };
  }

  const supabaseAdmin = getSupabaseAdmin();

  const utilityFeatures = ["transfer_fee"];
  if (utilityFeatures.includes(featureKey)) {
    return { hasAccess: true, user, newTokens };
  }

  try {
    const limitCheck = await checkFeatureLimit(
      user.id,
      user.subscription_tier || "free",
      featureKey
    );

    if (!limitCheck.withinLimit) {
      return {
        hasAccess: false,
        user,
        newTokens,
        limit: limitCheck.limit,
        error: `You've reached your ${featureKey.replace(/_/g, " ")} limit of ${limitCheck.limit} for the ${user.subscription_tier} plan`,
      };
    }

    const { data: features, error: featuresError } = await supabaseAdmin
      .from("subscription_features")
      .select("feature_key, feature_value, feature_limit")
      .eq("tier", user.subscription_tier || "free")
      .eq("feature_key", featureKey)
      .single();

    if (featuresError) {
      console.error("Error fetching features:", featuresError);
      return {
        hasAccess: false,
        user,
        newTokens,
        error: "Error checking feature access",
      };
    }

    if (features.feature_value === "true" || features.feature_value === "unlimited") {
      return {
        hasAccess: true,
        user,
        newTokens,
        limit: features.feature_limit,
      };
    }

    if (features.feature_limit && currentCount !== undefined) {
      if (currentCount >= features.feature_limit) {
        return {
          hasAccess: false,
          user,
          newTokens,
          limit: features.feature_limit,
          error: `You've reached your ${featureKey.replace(/_/g, " ")} limit of ${features.feature_limit} for the ${user.subscription_tier} plan`,
        };
      }
      return {
        hasAccess: true,
        user,
        newTokens,
        limit: features.feature_limit,
      };
    }

    return { hasAccess: true, user, newTokens, limit: features.feature_limit };
  } catch (error) {
    console.error("Error in checkFeatureAccess:", error);
    return {
      hasAccess: false,
      user,
      newTokens,
      error: "Error checking feature access",
    };
  }
}

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

    if (subError && subError.code !== "PGRST116") {
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

    const tier = user.subscription_tier || "free";

    const { data: features, error: featuresError } = await supabaseAdmin
      .from("subscription_features")
      .select("feature_key, feature_value, feature_limit")
      .eq("tier", tier);

    if (featuresError) {
      console.error("Error fetching features:", featuresError);
    }

    const featuresMap =
      features?.reduce((acc, feature) => {
        acc[feature.feature_key] = {
          value: feature.feature_value,
          limit: feature.feature_limit,
        };
        return acc;
      }, {} as Record<string, any>) || {};

    // Determine status from subscription or user data
    let status = tier === "free" ? "active" : "inactive";
    if (subscription) {
      status = subscription.status || "active";
    } else if (user.subscription_expires_at) {
      const expiresAt = new Date(user.subscription_expires_at);
      status = expiresAt > new Date() ? "active" : "expired";
    }

    return {
      tier,
      status,
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
    const supabaseAdmin = getSupabaseAdmin();
    const subDetails = await getUserSubscriptionDetails(userId);
    const tier = subDetails?.tier || "free";

    const { data: features, error } = await supabaseAdmin
      .from("subscription_features")
      .select("feature_limit")
      .eq("tier", tier)
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
        error: `You've reached your ${featureKey.replace(/_/g, " ")} limit of ${limit}`,
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
    const supabaseAdmin = getSupabaseAdmin();

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("usage_tracking")
      .select("count")
      .eq("user_id", userId)
      .eq("feature_key", featureKey)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }

    if (existing) {
      const { error: updateError } = await supabaseAdmin
        .from("usage_tracking")
        .update({
          count: existing.count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("feature_key", featureKey);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabaseAdmin
        .from("usage_tracking")
        .insert({
          user_id: userId,
          feature_key: featureKey,
          count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;
    }

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

export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete("sb-access-token");
  response.cookies.delete("sb-refresh-token");
  response.cookies.delete("verified");
  return response;
}