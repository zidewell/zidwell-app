// lib/auth-check-api.ts
// ─────────────────────────────────────────────────────────────────────────────
// FIXES:
//  1. createAuthResponse preserves the ORIGINAL status code.
//  2. isAuthenticatedWithRefresh attempts refresh on missing OR invalid access.
//  3. Supabase clients are module-level singletons.
//  4. Debug logging gated behind NODE_ENV !== "production".
//  5. Removed the in-memory auth cache (unsafe on Vercel serverless).
//  6. hasRequiredTier treats undefined is_subscription_active as "not blocking".
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  subscription_tier?:
    | "free"
    | "solopreneur"
    | "sme"
    | "enterprise"
    | "corporation";
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

const IS_DEV = process.env.NODE_ENV !== "production";
const authLog = (...args: any[]) => {
  if (IS_DEV) console.log(...args);
};
const authError = (...args: any[]) => {
  console.error(...args);
};

// ─── Supabase clients (module-level singletons) ───
let _adminClient: SupabaseClient | null = null;
let _anonClient: SupabaseClient | null = null;

const getSupabaseAdmin = (): SupabaseClient => {
  if (!_adminClient) {
    _adminClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      },
    );
  }
  return _adminClient;
};

const getSupabaseAnon = (): SupabaseClient => {
  if (!_anonClient) {
    _anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      },
    );
  }
  return _anonClient;
};

export async function isAuthenticated(
  req: NextRequest,
): Promise<AuthenticatedUser | null> {
  const result = await isAuthenticatedWithRefresh(req);
  return result.user;
}

export async function isAuthenticatedWithRefresh(
  req: NextRequest,
): Promise<AuthResult> {
  try {
    const accessToken = req.cookies.get("sb-access-token")?.value;
    const refreshToken = req.cookies.get("sb-refresh-token")?.value;

    if (!accessToken && !refreshToken) {
      authLog("🔴 No auth tokens found");
      return { user: null };
    }

    const supabaseAdmin = getSupabaseAdmin();
    let user: any = null;
    let newTokens: AuthResult["newTokens"] = undefined;

    if (accessToken) {
      const {
        data: { user: userData },
        error: tokenError,
      } = await supabaseAdmin.auth.getUser(accessToken);

      if (!tokenError && userData) {
        user = userData;
      } else if (tokenError) {
        authLog("🔴 Token validation error:", tokenError.message);
      }
    }

    if (!user && refreshToken) {
      authLog("🔄 Attempting token refresh...");

      const supabaseAnon = getSupabaseAnon();
      const { data: refreshData, error: refreshError } =
        await supabaseAnon.auth.refreshSession({
          refresh_token: refreshToken,
        });

      if (!refreshError && refreshData.session) {
        authLog("✅ Token refreshed successfully");

        const {
          data: { user: refreshedUser },
        } = await supabaseAdmin.auth.getUser(
          refreshData.session.access_token,
        );

        if (refreshedUser) {
          user = refreshedUser;
          newTokens = {
            accessToken: refreshData.session.access_token,
            refreshToken: refreshData.session.refresh_token!,
          };
        }
      } else {
        authLog("❌ Token refresh failed:", refreshError?.message);
      }
    }

    if (!user) {
      authLog("🔴 No valid user found");
      return { user: null };
    }

    const { data: userData, error: dbError } = await supabaseAdmin
      .from("users")
      .select("subscription_tier, subscription_expires_at")
      .eq("id", user.id)
      .single();

    if (dbError) {
      authError("🔴 Error fetching user data:", dbError);
      const basicUser: AuthenticatedUser = {
        id: user.id,
        email: user.email!,
        subscription_tier: "free",
        is_subscription_active: true,
      };
      return { user: basicUser, newTokens };
    }

    let isSubscriptionActive = true;
    if (userData.subscription_tier && userData.subscription_tier !== "free") {
      if (userData.subscription_expires_at) {
        const expiresAt = new Date(userData.subscription_expires_at);
        isSubscriptionActive = expiresAt > new Date();
      }
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email!,
      subscription_tier: userData.subscription_tier || "free",
      subscription_expires_at: userData.subscription_expires_at,
      is_subscription_active: isSubscriptionActive,
    };

    authLog("✅ User authenticated:", {
      id: user.id,
      tier: authenticatedUser.subscription_tier,
      isActive: isSubscriptionActive,
      refreshed: !!newTokens,
    });

    return { user: authenticatedUser, newTokens };
  } catch (error) {
    authError("🔴 Auth error:", error);
    return { user: null };
  }
}

// ─── Response helper ───
// Two call signatures supported:
//   NEW (recommended):  createAuthResponse({ ... }, { status: 401, newTokens })
//   LEGACY:             createAuthResponse(data, newTokens)
export function createAuthResponse(data: any, second?: any) {
  let status = 200;
  let newTokens: { accessToken: string; refreshToken: string } | undefined;

  if (second && typeof second === "object") {
    if ("accessToken" in second && "refreshToken" in second) {
      // Legacy: second is the tokens object
      newTokens = second;
    } else {
      // New: second is { status, newTokens }
      if (typeof second.status === "number") status = second.status;
      if (second.newTokens) newTokens = second.newTokens;
    }
  }

  const response = NextResponse.json(data, { status });

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
    authLog("🔄 New tokens set in response");
  }

  return response;
}

export async function requireAuth(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    return {
      authenticated: false as const,
      response: NextResponse.json(
        { error: "Unauthorized", message: "Session expired", logout: true },
        { status: 401 },
      ),
    };
  }

  return { authenticated: true as const, user, newTokens };
}

// ─── Tier hierarchy ───
const TIER_HIERARCHY = [
  "free",
  "solopreneur",
  "sme",
  "enterprise",
  "corporation",
] as const;

export async function hasRequiredTier(
  req: NextRequest,
  requiredTier: (typeof TIER_HIERARCHY)[number],
): Promise<{
  hasAccess: boolean;
  user: AuthenticatedUser | null;
  newTokens?: AuthResult["newTokens"];
  error?: string;
}> {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    return { hasAccess: false, user: null, error: "Authentication required" };
  }

  const userTierIndex = TIER_HIERARCHY.indexOf(
    (user.subscription_tier || "free") as (typeof TIER_HIERARCHY)[number],
  );
  const requiredTierIndex = TIER_HIERARCHY.indexOf(requiredTier);

  if (userTierIndex < requiredTierIndex) {
    return {
      hasAccess: false,
      user,
      newTokens,
      error: `This feature requires the ${requiredTier} plan or higher. Current plan: ${
        user.subscription_tier || "free"
      }`,
    };
  }

  // Only block if is_subscription_active is EXPLICITLY false.
  if (requiredTier !== "free" && user.is_subscription_active === false) {
    return {
      hasAccess: false,
      user,
      newTokens,
      error:
        "Your subscription is not active. Please renew to continue accessing this feature.",
    };
  }

  return { hasAccess: true, user, newTokens };
}

// ─── Feature access ───
interface FeatureRow {
  feature_key: string;
  feature_value: string;
  feature_limit: number | null;
}

const FEATURE_CACHE_TTL = 5 * 60 * 1000;
const featureCache = new Map<
  string,
  { rows: FeatureRow[]; timestamp: number }
>();

async function getFeaturesForTier(
  supabaseAdmin: SupabaseClient,
  tier: string,
): Promise<FeatureRow[] | null> {
  const cached = featureCache.get(tier);
  if (cached && Date.now() - cached.timestamp < FEATURE_CACHE_TTL) {
    return cached.rows;
  }

  const { data, error } = await supabaseAdmin
    .from("subscription_features")
    .select("feature_key, feature_value, feature_limit")
    .eq("tier", tier);

  if (error) {
    authError("Error fetching features:", error);
    return null;
  }

  const rows = (data || []) as FeatureRow[];
  featureCache.set(tier, { rows, timestamp: Date.now() });
  return rows;
}

export async function checkFeatureAccess(
  req: NextRequest,
  featureKey: string,
  currentCount?: number,
): Promise<{
  hasAccess: boolean;
  user: AuthenticatedUser | null;
  newTokens?: AuthResult["newTokens"];
  limit?: number;
  error?: string;
}> {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    return { hasAccess: false, user: null, error: "Authentication required" };
  }

  const supabaseAdmin = getSupabaseAdmin();

  const utilityFeatures = ["transfer_fee"];
  if (utilityFeatures.includes(featureKey)) {
    return { hasAccess: true, user, newTokens };
  }

  try {
    const features = await getFeaturesForTier(
      supabaseAdmin,
      user.subscription_tier || "free",
    );

    if (features === null) {
      return {
        hasAccess: false,
        user,
        newTokens,
        error: "Error checking feature access",
      };
    }

    const feature = features.find((f) => f.feature_key === featureKey);

    if (!feature) {
      return {
        hasAccess: false,
        user,
        newTokens,
        error: `Feature ${featureKey} not available in your plan`,
      };
    }

    if (
      feature.feature_value === "true" ||
      feature.feature_value === "unlimited"
    ) {
      return { hasAccess: true, user, newTokens };
    }

    if (feature.feature_limit && currentCount !== undefined) {
      if (currentCount >= feature.feature_limit) {
        return {
          hasAccess: false,
          user,
          newTokens,
          limit: feature.feature_limit,
          error: `You've reached your ${featureKey.replace(
            /_/g,
            " ",
          )} limit of ${feature.feature_limit} for the ${
            user.subscription_tier
          } plan`,
        };
      }
      return {
        hasAccess: true,
        user,
        newTokens,
        limit: feature.feature_limit,
      };
    }

    return { hasAccess: true, user, newTokens };
  } catch (error) {
    authError("Error in checkFeatureAccess:", error);
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
      .maybeSingle();

    if (subError && subError.code !== "PGRST116") {
      authError("Error fetching subscription:", subError);
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("subscription_tier, subscription_expires_at")
      .eq("id", userId)
      .single();

    if (userError) {
      authError("Error fetching user:", userError);
      return null;
    }

    const tier = user.subscription_tier || "free";
    const features = await getFeaturesForTier(supabaseAdmin, tier);

    const featuresMap =
      features?.reduce(
        (acc, feature) => {
          acc[feature.feature_key] = {
            value: feature.feature_value,
            limit: feature.feature_limit,
          };
          return acc;
        },
        {} as Record<string, any>,
      ) || {};

    return {
      tier,
      status:
        subscription?.status || (tier === "free" ? "active" : "inactive"),
      expiresAt: user.subscription_expires_at,
      features: featuresMap,
      subscriptionId: subscription?.id,
    };
  } catch (error) {
    authError("Error in getUserSubscriptionDetails:", error);
    return null;
  }
}