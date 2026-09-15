// middleware.ts
// ─────────────────────────────────────────────────────────────────────────────
// SIMPLIFIED after migration:
//   • Owner store tools now live under /dashboard/services/payment/store/*
//   • Public storefronts are ONLY /store/[slug] and /store/[slug]/[product]
//   • Middleware matcher captures /dashboard/* — which covers everything owner
//   • Public storefronts never enter middleware
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse, type NextRequest } from "next/server";
import { User } from "@supabase/supabase-js";
import {
  getSupabaseAdmin,
  getUserWithDetails,
  hasSufficientTier,
} from "@/lib/suabase-admin";

export const TIER_HIERARCHY = [
  "free",
  "sme",
  "enterprise",
  "corporation",
] as const;

export type SubscriptionTier = (typeof TIER_HIERARCHY)[number];

// ─── PREMIUM ROUTES ───
const premiumRoutes: { path: string; requiredTier: SubscriptionTier }[] = [
  { path: "/dashboard/bookkeeping", requiredTier: "sme" },
  { path: "/dashboard/bank-statements", requiredTier: "sme" },
  { path: "/dashboard/vault", requiredTier: "sme" },
  { path: "/dashboard/tax-calculator", requiredTier: "sme" },
  { path: "/dashboard/financial-statements", requiredTier: "sme" },
  { path: "/dashboard/connected-accounts", requiredTier: "sme" },
  { path: "/dashboard/team", requiredTier: "enterprise" },
  { path: "/dashboard/roles", requiredTier: "enterprise" },
  { path: "/dashboard/approvals", requiredTier: "enterprise" },
  { path: "/dashboard/reports", requiredTier: "enterprise" },
  { path: "/dashboard/contracts", requiredTier: "enterprise" },
  { path: "/dashboard/departments", requiredTier: "corporation" },
  { path: "/dashboard/payroll", requiredTier: "corporation" },
  { path: "/dashboard/advanced-reporting", requiredTier: "corporation" },
  { path: "/dashboard/custom-structure", requiredTier: "corporation" },
  { path: "/dashboard/account-manager", requiredTier: "corporation" },
];

const legacyPremiumRoutes: { path: string; requiredTier: SubscriptionTier }[] = [
  { path: "/dashboard/tax-filing", requiredTier: "sme" },
  { path: "/dashboard/vat-filing", requiredTier: "enterprise" },
  { path: "/dashboard/paye-filing", requiredTier: "enterprise" },
  { path: "/dashboard/cfo-guidance", requiredTier: "enterprise" },
];

const allPremiumRoutes = [...premiumRoutes, ...legacyPremiumRoutes];

const bvnRequiredRoutes = [
  "/dashboard/fund-account",
  "/dashboard/fund-account/transfer-page",
  "/dashboard/services/buy-airtime",
  "/dashboard/services/buy-data",
  "/dashboard/services/buy-power",
  "/dashboard/services/buy-cable-tv",
];

// ─── OWNER STORE ROUTES (now nested under /dashboard/services/payment/store) ───
const storeProtectedRoutes = [
  "/dashboard/services/payment/create",
  "/dashboard/services/payment/create-link",
  "/dashboard/services/payment/edit",
  "/dashboard/services/payment/page",
  "/dashboard/services/payment/store",
  // Specific sub-paths for clarity
  "/dashboard/services/payment/store/products",
  "/dashboard/services/payment/store/wallet",
  "/dashboard/services/payment/store/transactions",
  "/dashboard/services/payment/store/customers",
  "/dashboard/services/payment/store/analytics",
  "/dashboard/services/payment/store/bookkeeping",
  "/dashboard/services/payment/store/settings",
];

// ─── PUBLIC STOREFRONT PATTERNS ───
// Only /store/[slug] and /store/[slug]/[product] are public.
// We keep RESERVED_STORE_SLUGS for the "link" pattern:
// /store/[slug]/link/[linkSlug] — that path is NOT public.
const RESERVED_STORE_SLUGS = new Set<string>(["link"]);

const allowedAdminRoles = [
  "super_admin",
  "finance_admin",
  "operations_admin",
  "support_admin",
  "legal_admin",
  "blog_admin",
];

const publicPaths = [
  "/auth/login",
  "/auth/signup",
  "/auth/password-reset",
  "/auth/forgot-password",
  "/auth/blocked",
  "/auth/verify",
  "/auth/verify-success",
  "/api/auth/verify",
  "/api/auth/resend-verification",
  "/",
  "/pricing",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/blog",
];

export const ALLOWED_PAYMENT_EMAILS = new Set([
  "characterinternational@gmail.com",
  "ibrahimlawalabbalolo@gmail.com",
  "abbalolo360@gmail.com",
  "boluwatife525@gmail.com",
  "verifiedaboki@gmail.com",
]);

const bvnRequiredSet = new Set(bvnRequiredRoutes);
const storeProtectedSet = new Set(storeProtectedRoutes);

const sortedPremiumRoutes = [...allPremiumRoutes].sort(
  (a, b) => b.path.length - a.path.length
);

function getRequiredTier(pathname: string): SubscriptionTier | null {
  for (const { path, requiredTier } of sortedPremiumRoutes) {
    if (
      pathname === path ||
      pathname.startsWith(path + "/") ||
      pathname.startsWith(path + "?")
    ) {
      return requiredTier;
    }
  }
  return null;
}

function requiresPaymentEmailRestriction(pathname: string): boolean {
  return (
    pathname === "/dashboard/services/payment" ||
    pathname === "/dashboard/services/payment/create" ||
    pathname === "/dashboard/services/payment/create-link"
  );
}

function requiresStoreOwnership(pathname: string): boolean {
  for (const route of storeProtectedSet) {
    if (
      pathname === route ||
      pathname.startsWith(route + "/") ||
      pathname.startsWith(route + "?")
    ) {
      return true;
    }
  }
  return false;
}

// ─── PUBLIC STOREFRONT DETECTION ───
function isPublicStoreFront(pathname: string): boolean {
  // /store/[slug]
  const singleMatch = pathname.match(/^\/store\/([^\/]+)$/);
  if (singleMatch) {
    const slug = singleMatch[1].toLowerCase();
    if (RESERVED_STORE_SLUGS.has(slug)) return false;
    return true;
  }

  // /store/[slug]/[product]
  const doubleMatch = pathname.match(/^\/store\/([^\/]+)\/([^\/]+)$/);
  if (doubleMatch) {
    const storeSlug = doubleMatch[1].toLowerCase();
    const productSlug = doubleMatch[2].toLowerCase();
    if (productSlug === "link") return false;
    if (RESERVED_STORE_SLUGS.has(storeSlug)) return false;
    return true;
  }

  // /store/[slug]/link/[linkSlug] — public
  if (/^\/store\/[^\/]+\/link\/[^\/]+$/.test(pathname)) return true;

  return false;
}

function isPublicPaymentPage(pathname: string): boolean {
  if (pathname.match(/^\/pay\/[^\/]+$/)) return true;
  if (pathname.startsWith("/payment-page/status")) return true;
  if (pathname.startsWith("/payment/callback")) return true;
  if (pathname.startsWith("/payment-page-success")) return true;
  return false;
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,100}$/i.test(slug);
}

function areStoreFrontSlugsValid(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return false;
  return parts.slice(1).every((p) => isValidSlug(p));
}

function shouldBypassAuth(pathname: string): boolean {
  if (
    pathname.match(
      /\.(ico|png|jpg|jpeg|svg|css|js|webmanifest|json|xml|webp|avif|woff|woff2|ttf|eot)$/
    )
  ) {
    return true;
  }

  if (
    publicPaths.some(
      (path) => pathname === path || pathname.startsWith(path + "/")
    )
  ) {
    return true;
  }

  if (isPublicStoreFront(pathname)) return true;
  if (isPublicPaymentPage(pathname)) return true;

  return false;
}

// ─── TYPE GUARDS ───
type TokenValidationResult = User | { error: "expired" } | null;

async function validateTokenAndGetUser(
  token: string
): Promise<TokenValidationResult> {
  if (!token) return null;
  try {
    const supabase = getSupabaseAdmin();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error) {
      if (error.message?.includes("JWT expired")) return { error: "expired" };
      console.error("Token validation error:", error.message);
      return null;
    }
    return user;
  } catch (error) {
    console.error("Token validation error:", error);
    return null;
  }
}

async function refreshAccessToken(refreshToken: string) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error || !data.session) return null;
    return data.session;
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
  }
}

function isTokenError(
  result: TokenValidationResult
): result is { error: "expired" } {
  return (
    result !== null &&
    typeof result === "object" &&
    "error" in result &&
    result.error === "expired"
  );
}

function isUser(result: TokenValidationResult): result is User {
  return result !== null && !("error" in result) && "id" in result;
}

function clearAuthCookies(response: NextResponse) {
  const cookiesToDelete = [
    "sb-access-token",
    "sb-refresh-token",
    "sb-client-session",
    "sb-login-time",
    "sb-user-data",
    "verified",
    "payment_processed",
    "sb-session-id",
    "sb-session-risk",
  ];
  cookiesToDelete.forEach((name) => response.cookies.delete(name));
}

function redirectToLogin(req: NextRequest, clearCookies: boolean = true) {
  const { pathname, search } = req.nextUrl;
  const fullUrl = `${pathname}${search}`;
  const loginUrl = new URL("/auth/login", req.url);
  loginUrl.searchParams.set("callbackUrl", encodeURIComponent(fullUrl));
  console.log(`🔄 Redirecting to login from ${fullUrl}`);
  const res = NextResponse.redirect(loginUrl);
  if (clearCookies) clearAuthCookies(res);
  return res;
}

function redirectFromPaymentPage(req: NextRequest) {
  console.log(
    `🚫 Unauthorized access attempt to payment page from ${req.nextUrl.pathname}`
  );
  const response = NextResponse.redirect(new URL("/dashboard", req.url));
  response.cookies.set(
    "payment_access_denied",
    "You don't have permission to access the payment page",
    { httpOnly: true, maxAge: 5, path: "/", sameSite: "lax" }
  );
  return response;
}

function redirectNoStore(req: NextRequest) {
  console.log(`🚫 No store found for user accessing ${req.nextUrl.pathname}`);
  const response = NextResponse.redirect(
    new URL("/dashboard/services/payment", req.url)
  );
  response.cookies.set(
    "store_required",
    "You need to create a store to access this page",
    { httpOnly: true, maxAge: 5, path: "/", sameSite: "lax" }
  );
  return response;
}

function redirectInsufficientTier(
  req: NextRequest,
  requiredTier: SubscriptionTier,
  currentPath: string
) {
  console.log(
    `⚠️ Insufficient tier for ${currentPath}, requires ${requiredTier}`
  );
  const response = NextResponse.redirect(
    new URL(
      `/pricing?upgrade=${requiredTier}&redirect=${encodeURIComponent(
        currentPath
      )}`,
      req.url
    )
  );
  response.cookies.set(
    "subscription_message",
    `This feature requires the ${requiredTier} plan`,
    { httpOnly: true, maxAge: 5, path: "/", sameSite: "lax" }
  );
  return response;
}

// ─── MAIN MIDDLEWARE ───
export async function middleware(req: NextRequest) {
  const startTime = Date.now();
  const currentPath = req.nextUrl.pathname;

  // Public storefront — bypass ALL auth work
  if (isPublicStoreFront(currentPath)) {
    if (!areStoreFrontSlugsValid(currentPath)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    console.log(`🌐 Public storefront bypass: ${currentPath}`);
    return NextResponse.next();
  }

  if (shouldBypassAuth(currentPath)) {
    console.log(`✅ Public path bypass: ${currentPath}`);
    return NextResponse.next();
  }

  // ─── PAYMENT PAGE EMAIL RESTRICTION ───
  if (requiresPaymentEmailRestriction(currentPath)) {
    console.log(`🔐 Checking payment page access for: ${currentPath}`);
    let accessToken = req.cookies.get("sb-access-token")?.value;
    const refreshToken = req.cookies.get("sb-refresh-token")?.value;

    if (!accessToken && refreshToken) {
      const session = await refreshAccessToken(refreshToken);
      if (session) accessToken = session.access_token;
    }
    if (!accessToken) {
      console.log("❌ No valid token for payment page access");
      return redirectToLogin(req);
    }
    const tokenResult = await validateTokenAndGetUser(accessToken);
    if (!tokenResult || isTokenError(tokenResult) || !isUser(tokenResult)) {
      console.log("❌ Invalid user for payment page");
      return redirectToLogin(req);
    }
    const userEmail = tokenResult.email?.toLowerCase();
    if (!userEmail || !ALLOWED_PAYMENT_EMAILS.has(userEmail)) {
      console.log(
        `🚫 Unauthorized email: ${userEmail} attempted to access payment page`
      );
      return redirectFromPaymentPage(req);
    }
    console.log(`✅ Payment page access granted for: ${userEmail}`);
  }

  // ─── POST-PAYMENT ACCESS ───
  if (
    currentPath.startsWith("/dashboard") &&
    req.cookies.get("payment_processed")
  ) {
    console.log("🟡 Post-payment access granted");
    const response = NextResponse.next();
    response.cookies.delete("payment_processed");
    return response;
  }

  if (currentPath === "/app") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  console.log(`🔒 Checking auth for: ${currentPath}`);

  // ─── GET TOKENS ───
  let accessToken = req.cookies.get("sb-access-token")?.value;
  const refreshToken = req.cookies.get("sb-refresh-token")?.value;
  const clientSession = req.cookies.get("sb-client-session")?.value;
  const loginTime = req.cookies.get("sb-login-time")?.value;
  const sessionIdCookie = req.cookies.get("sb-session-id")?.value;

  if (clientSession === "true" && !accessToken && !refreshToken) {
    if (loginTime && Date.now() - parseInt(loginTime) < 5000) {
      console.log("🟢 Recent login detected (within 5s), allowing access");
      return NextResponse.next();
    }
    console.log("❌ Invalid session state - redirecting to login");
    return redirectToLogin(req);
  }

  if (!accessToken && !refreshToken) {
    console.log("❌ No tokens found, redirecting to login");
    return redirectToLogin(req);
  }

  // ─── TOKEN REFRESH ───
  let refreshedResponse: NextResponse | null = null;

  if (!accessToken && refreshToken) {
    console.log("🔄 Attempting token refresh");
    const session = await refreshAccessToken(refreshToken);
    if (!session) {
      console.log("❌ Token refresh failed");
      return redirectToLogin(req);
    }
    console.log("✅ Token refresh successful");
    refreshedResponse = NextResponse.next();
    refreshedResponse.cookies.set("sb-access-token", session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    refreshedResponse.cookies.set("sb-refresh-token", session.refresh_token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    refreshedResponse.cookies.set("sb-client-session", "true", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    accessToken = session.access_token;
  }

  if (!accessToken) return redirectToLogin(req);

  // ─── VALIDATE TOKEN ───
  const tokenValidationPromise = validateTokenAndGetUser(accessToken);
  const tokenTimeoutPromise = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), 8000)
  );
  const tokenResult = await Promise.race([
    tokenValidationPromise,
    tokenTimeoutPromise,
  ]);

  if (!tokenResult) {
    console.log("⏱️ Token validation timed out - allowing access");
    return refreshedResponse || NextResponse.next();
  }
  if (isTokenError(tokenResult)) {
    console.log("⚠️ Token expired");
    return redirectToLogin(req);
  }
  if (!isUser(tokenResult)) {
    console.log("❌ Invalid user object");
    return redirectToLogin(req);
  }

  // ─── USER DETAILS ───
  const userDetailsPromise = getUserWithDetails(tokenResult.id);
  const userTimeoutPromise = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), 8000)
  );
  const userDetails = await Promise.race([
    userDetailsPromise,
    userTimeoutPromise,
  ]);

  if (!userDetails) {
    console.log("⏱️ User details fetch timed out - allowing access");
    return refreshedResponse || NextResponse.next();
  }

  if (userDetails.is_blocked) {
    console.log("🚫 User is blocked");
    const response = NextResponse.redirect(new URL("/auth/blocked", req.url));
    clearAuthCookies(response);
    return response;
  }

  // ─── SESSION ID MATCH ───
  const sessionPromise = getSupabaseAdmin()
    .from("users")
    .select("current_session_id, current_session_expires_at")
    .eq("id", tokenResult.id)
    .single();
  const sessionTimeoutPromise = new Promise<{ data: null }>((resolve) =>
    setTimeout(() => resolve({ data: null }), 8000)
  );
  const { data: sessionData } = (await Promise.race([
    sessionPromise,
    sessionTimeoutPromise,
  ])) as any;

  if (sessionData) {
    const dbSessionId = sessionData.current_session_id as string | null;
    const dbSessionExpires = sessionData.current_session_expires_at as
      | string
      | null;

    if (dbSessionId && !sessionIdCookie) {
      console.log("❌ Session ID cookie missing");
      return redirectToLogin(req, true);
    }
    if (dbSessionId && sessionIdCookie && dbSessionId !== sessionIdCookie) {
      console.warn(
        `🚫 Session mismatch. DB: ${dbSessionId.slice(
          0,
          8
        )}... Cookie: ${sessionIdCookie.slice(0, 8)}...`
      );
      const res = redirectToLogin(req, true);
      res.cookies.set(
        "login_error",
        "Your session was invalidated because you logged in on another device",
        { httpOnly: false, maxAge: 30, path: "/", sameSite: "lax" }
      );
      return res;
    }
    if (dbSessionExpires && new Date(dbSessionExpires) < new Date()) {
      console.log("⏰ Session expired in database");
      return redirectToLogin(req, true);
    }
  }

  // ─── RISK COOKIE ───
  const sessionRisk = req.cookies.get("sb-session-risk")?.value;
  if (sessionRisk && parseInt(sessionRisk) >= 60) {
    console.log("🚫 High-risk session cookie, forcing logout");
    return redirectToLogin(req, true);
  }

  // ─── STORE OWNERSHIP ───
  if (requiresStoreOwnership(currentPath)) {
    console.log(`🏪 Checking store ownership for: ${currentPath}`);
    try {
      const supabase = getSupabaseAdmin();
      const storePromise = supabase
        .from("online_stores")
        .select("id, is_active, activation_paid")
        .eq("owner_id", tokenResult.id)
        .maybeSingle();
      const storeTimeoutPromise = new Promise<{ data: null; error: null }>(
        (resolve) => setTimeout(() => resolve({ data: null, error: null }), 8000)
      );
      const { data: store, error: storeError } = (await Promise.race([
        storePromise,
        storeTimeoutPromise,
      ])) as any;

      if (storeError) {
        console.error("❌ Error checking store:", storeError);
        return redirectNoStore(req);
      }
      if (!store) {
        console.log(`🚫 No store found for user ${tokenResult.id}`);
        return redirectNoStore(req);
      }
      const hasActiveStore =
        store.is_active === true && store.activation_paid === true;
      if (!hasActiveStore) {
        console.log(`🚫 No active store found for user ${tokenResult.id}`);
        const response = redirectNoStore(req);
        response.cookies.set(
          "store_required_message",
          store ? "Please activate your store" : "Please create a store",
          { httpOnly: false, maxAge: 5, path: "/", sameSite: "lax" }
        );
        return response;
      }
      console.log(`✅ Store ownership verified for ${currentPath}`);
    } catch (error) {
      console.error("❌ Store check error:", error);
      return redirectNoStore(req);
    }
  }

  // ─── BVN CHECK ───
  if (
    bvnRequiredSet.has(currentPath) &&
    userDetails.bvn_verification !== "verified"
  ) {
    console.log(`⚠️ BVN verification required for ${currentPath}`);
    const response = NextResponse.redirect(
      new URL(
        `/dashboard?verify=bvn&redirect=${encodeURIComponent(currentPath)}`,
        req.url
      )
    );
    response.cookies.set(
      "verification_message",
      "Please verify your BVN to access this feature",
      { httpOnly: true, maxAge: 5, path: "/", sameSite: "lax" }
    );
    return response;
  }

  // ─── SUBSCRIPTION TIER ───
  const requiredTier = getRequiredTier(currentPath);
  if (requiredTier) {
    const hasAccess = hasSufficientTier(userDetails, requiredTier);
    if (!hasAccess) {
      return redirectInsufficientTier(req, requiredTier, currentPath);
    }
    console.log(
      `✅ Tier check passed for ${currentPath} (requires ${requiredTier})`
    );
  }

  // ─── ADMIN ROUTES ───
  if (
    currentPath.startsWith("/admin") ||
    currentPath.startsWith("/blog/admin")
  ) {
    if (
      !userDetails.admin_role ||
      !allowedAdminRoles.includes(userDetails.admin_role)
    ) {
      console.log(`⚠️ Admin access denied for ${currentPath}`);
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    console.log(`✅ Admin access granted for role: ${userDetails.admin_role}`);
  }

  const responseTime = Date.now() - startTime;
  if (responseTime > 200) {
    console.warn(`⚠️ Slow middleware (${responseTime}ms) for ${currentPath}`);
  } else {
    console.log(
      `✅ Auth check passed for ${currentPath} (${responseTime}ms)`
    );
  }

  return refreshedResponse || NextResponse.next();
}

// ─── MATCHER ───
// Public storefronts (/store/[slug], /store/[slug]/[product]) are NOT in
// the matcher. Everything owner-side lives under /dashboard/*.
export const config = {
  matcher: [
    "/app",
    "/dashboard/:path*",
    "/admin/:path*",
    "/blog/admin/:path*",
    "/auth/:path*",
    "/pay/:path*",
    "/payment-page/status",
    "/payment/callback",
    "/payment-page-success",
  ],
};