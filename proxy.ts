// proxy.ts
// ─────────────────────────────────────────────────────────────────────────────
// Simplified session validation for Next.js 16.
//
// Responsibilities:
//   • Identify public vs protected routes
//   • Validate auth for protected routes (via Supabase getUser)
//   • Refresh expired access tokens
//   • Write refreshed cookies to the response
//   • Redirect unauthenticated users to /auth/login
//   • Preserve authorization checks (tier, BVN, admin, store, payment)
//
// Removed:
//   • Timeout races that granted access on failure
//   • sb-client-session forgery bypass
//   • Redundant DB session-id lookups in the hot path
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import {
  getSupabaseAdmin,
  getUserWithDetails,
  hasSufficientTier,
  type UserDetails,
} from "@/lib/suabase-admin";
import { canAccessPaymentPage } from "@/lib/constants";

// ─── Tier types ───
export const TIER_HIERARCHY = [
  "free",
  "sme",
  "enterprise",
  "corporation",
] as const;

export type SubscriptionTier = (typeof TIER_HIERARCHY)[number];

// ─── Premium routes ───
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
  // legacy
  { path: "/dashboard/tax-filing", requiredTier: "sme" },
  { path: "/dashboard/vat-filing", requiredTier: "enterprise" },
  { path: "/dashboard/paye-filing", requiredTier: "enterprise" },
  { path: "/dashboard/cfo-guidance", requiredTier: "enterprise" },
];

const bvnRequiredRoutes = new Set([
  "/dashboard/fund-account",
  "/dashboard/fund-account/transfer-page",
  "/dashboard/services/buy-airtime",
  "/dashboard/services/buy-data",
  "/dashboard/services/buy-power",
  "/dashboard/services/buy-cable-tv",
]);

const storeProtectedRoutes = new Set([
  "/dashboard/services/payment/create",
  "/dashboard/services/payment/create-link",
  "/dashboard/services/payment/edit",
  "/dashboard/services/payment/page",
  "/dashboard/services/payment/store",
  "/dashboard/services/payment/dashboard",
  "/dashboard/services/payment/store/products",
  "/dashboard/services/payment/store/wallet",
  "/dashboard/services/payment/store/transactions",
  "/dashboard/services/payment/store/customers",
  "/dashboard/services/payment/store/analytics",
  "/dashboard/services/payment/store/bookkeeping",
  "/dashboard/services/payment/store/settings",
]);

const allowedAdminRoles = new Set([
  "super_admin",
  "finance_admin",
  "operations_admin",
  "support_admin",
  "legal_admin",
  "blog_admin",
]);

// ─── Public route detection ───
const RESERVED_STORE_SLUGS = new Set<string>(["link"]);

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

const sortedPremiumRoutes = [...premiumRoutes].sort(
  (a, b) => b.path.length - a.path.length,
);

function getRequiredTier(pathname: string): SubscriptionTier | null {
  for (const { path, requiredTier } of sortedPremiumRoutes) {
    if (pathname === path || pathname.startsWith(path + "/")) {
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
  for (const route of storeProtectedRoutes) {
    if (pathname === route || pathname.startsWith(route + "/")) return true;
  }
  return false;
}

function isPublicStoreFront(pathname: string): boolean {
  const singleMatch = pathname.match(/^\/store\/([^\/]+)$/);
  if (singleMatch) {
    return !RESERVED_STORE_SLUGS.has(singleMatch[1].toLowerCase());
  }
  const doubleMatch = pathname.match(/^\/store\/([^\/]+)\/([^\/]+)$/);
  if (doubleMatch) {
    const [, storeSlug, productSlug] = doubleMatch;
    if (productSlug.toLowerCase() === "link") return false;
    return !RESERVED_STORE_SLUGS.has(storeSlug.toLowerCase());
  }
  if (/^\/store\/[^\/]+\/link\/[^\/]+$/.test(pathname)) return true;
  return false;
}

function isPublicPaymentPage(pathname: string): boolean {
  return (
    /^\/pay\/[^\/]+$/.test(pathname) ||
    pathname.startsWith("/payment-page/status") ||
    pathname.startsWith("/payment/callback") ||
    pathname.startsWith("/payment-page-success")
  );
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,100}$/i.test(slug);
}

function areStoreFrontSlugsValid(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return false;
  return parts.slice(1).every(isValidSlug);
}

function shouldBypassAuth(pathname: string): boolean {
  if (
    /\.(ico|png|jpg|jpeg|svg|css|js|webmanifest|json|xml|webp|avif|woff|woff2|ttf|eot)$/.test(
      pathname,
    )
  ) {
    return true;
  }
  if (
    publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))
  ) {
    return true;
  }
  if (isPublicStoreFront(pathname)) return true;
  if (isPublicPaymentPage(pathname)) return true;
  return false;
}

// ─── Cookie helpers ───
const AUTH_COOKIE_NAMES = [
  "sb-access-token",
  "sb-refresh-token",
  "sb-client-session",
  "sb-login-time",
  "sb-user-data",
  "verified",
  "sb-session-risk",
  "sb-session-id",
  "payment_processed",
];

function clearAuthCookies(response: NextResponse) {
  AUTH_COOKIE_NAMES.forEach((name) => {
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  });
}

function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
) {
  const secure = process.env.NODE_ENV === "production";
  const maxAge = 60 * 60 * 24 * 7;

  response.cookies.set("sb-access-token", accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  response.cookies.set("sb-refresh-token", refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  response.cookies.set("sb-client-session", "true", {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

function redirectToLogin(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const fullUrl = `${pathname}${search}`;
  const loginUrl = new URL("/auth/login", req.url);
  loginUrl.searchParams.set("callbackUrl", encodeURIComponent(fullUrl));
  const res = NextResponse.redirect(loginUrl);
  clearAuthCookies(res);
  return res;
}

// ─── Token validation + refresh ───
type ValidationResult =
  | {
      status: "valid";
      user: User;
      newTokens?: { access: string; refresh: string };
    }
  | { status: "invalid" };

async function validateOrRefresh(
  accessToken: string | undefined,
  refreshToken: string | undefined,
): Promise<ValidationResult> {
  const supabase = getSupabaseAdmin();

  // 1. Try the access token
  if (accessToken) {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(accessToken);

      if (!error && user) {
        return { status: "valid", user };
      }
    } catch {
      // fall through to refresh
    }
  }

  // 2. Try to refresh
  if (refreshToken) {
    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (!error && data.session && data.user) {
        return {
          status: "valid",
          user: data.user,
          newTokens: {
            access: data.session.access_token,
            refresh: data.session.refresh_token!,
          },
        };
      }
    } catch {
      // fall through
    }
  }

  return { status: "invalid" };
}

// ─── Main proxy ───
export async function proxy(req: NextRequest) {
  const currentPath = req.nextUrl.pathname;

  // 1. Public storefronts
  if (isPublicStoreFront(currentPath)) {
    if (!areStoreFrontSlugsValid(currentPath)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // 2. Other public paths
  if (shouldBypassAuth(currentPath)) {
    return NextResponse.next();
  }

  // 3. /app redirect
  if (currentPath === "/app") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 4. Read tokens
  const accessToken = req.cookies.get("sb-access-token")?.value;
  const refreshToken = req.cookies.get("sb-refresh-token")?.value;

  if (!accessToken && !refreshToken) {
    return redirectToLogin(req);
  }

  // 5. Validate / refresh (no timeout bypass)
  const validation = await validateOrRefresh(accessToken, refreshToken);

  if (validation.status !== "valid") {
    return redirectToLogin(req);
  }

  const { user } = validation;

  // 6. Load user details — failure means unauthenticated, not a bypass
  let userDetails: UserDetails | null = null;
  try {
    userDetails = await getUserWithDetails(user.id);
  } catch (err) {
    console.error("❌ proxy: getUserWithDetails failed:", err);
    return redirectToLogin(req);
  }

  if (!userDetails) {
    return redirectToLogin(req);
  }

  // 7. Blocked user
  if (userDetails.is_blocked) {
    const res = NextResponse.redirect(new URL("/auth/blocked", req.url));
    clearAuthCookies(res);
    return res;
  }

  // Build the "pass-through" response with refreshed cookies if any
  const buildResponse = () => {
    const res = NextResponse.next();
    if (validation.newTokens) {
      setAuthCookies(
        res,
        validation.newTokens.access,
        validation.newTokens.refresh,
      );
    }
    return res;
  };

  // 8. Payment page email restriction
  if (requiresPaymentEmailRestriction(currentPath)) {
    const email = user.email?.toLowerCase();
    if (!canAccessPaymentPage(email)) {
      const res = NextResponse.redirect(new URL("/dashboard", req.url));
      res.cookies.set(
        "payment_access_denied",
        "You don't have permission to access the payment page",
        { httpOnly: true, maxAge: 5, path: "/", sameSite: "lax" },
      );
      return res;
    }
  }

  // 9. Store ownership (authorized payment emails are exempt)
  const emailForStore = user.email?.toLowerCase();
  const isAuthorizedPaymentUser = canAccessPaymentPage(emailForStore);

  if (requiresStoreOwnership(currentPath) && !isAuthorizedPaymentUser) {
    try {
      const supabase = getSupabaseAdmin();
      const { data: store } = await supabase
        .from("online_stores")
        .select("id, is_active, activation_paid")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!store) {
        const res = NextResponse.redirect(
          new URL("/dashboard/services/payment", req.url),
        );
        res.cookies.set(
          "store_required",
          "You need to create a store to access this page",
          { httpOnly: true, maxAge: 5, path: "/", sameSite: "lax" },
        );
        return res;
      }

      if (store.is_active !== true || store.activation_paid !== true) {
        const res = NextResponse.redirect(
          new URL("/dashboard/services/payment", req.url),
        );
        res.cookies.set(
          "store_required_message",
          "Please activate your store",
          { httpOnly: false, maxAge: 5, path: "/", sameSite: "lax" },
        );
        return res;
      }
    } catch (err) {
      console.error("❌ proxy: store check failed:", err);
      const res = NextResponse.redirect(
        new URL("/dashboard/services/payment", req.url),
      );
      res.cookies.set(
        "store_required",
        "You need to create a store to access this page",
        { httpOnly: true, maxAge: 5, path: "/", sameSite: "lax" },
      );
      return res;
    }
  }

  // 10. BVN check
  if (
    bvnRequiredRoutes.has(currentPath) &&
    userDetails.bvn_verification !== "verified"
  ) {
    const res = NextResponse.redirect(
      new URL(
        `/dashboard?verify=bvn&redirect=${encodeURIComponent(currentPath)}`,
        req.url,
      ),
    );
    res.cookies.set(
      "verification_message",
      "Please verify your BVN to access this feature",
      { httpOnly: true, maxAge: 5, path: "/", sameSite: "lax" },
    );
    return res;
  }

  // 11. Subscription tier
  const requiredTier = getRequiredTier(currentPath);
  if (requiredTier && !hasSufficientTier(userDetails, requiredTier)) {
    const res = NextResponse.redirect(
      new URL(
        `/pricing?upgrade=${requiredTier}&redirect=${encodeURIComponent(
          currentPath,
        )}`,
        req.url,
      ),
    );
    res.cookies.set(
      "subscription_message",
      `This feature requires the ${requiredTier} plan`,
      { httpOnly: true, maxAge: 5, path: "/", sameSite: "lax" },
    );
    return res;
  }

  // 12. Admin routes
  if (
    currentPath.startsWith("/admin") ||
    currentPath.startsWith("/blog/admin")
  ) {
    if (
      !userDetails.admin_role ||
      !allowedAdminRoles.has(userDetails.admin_role)
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return buildResponse();
}

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