// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { createClient } from "@supabase/supabase-js";

// // Add this function to check subscription access
// async function checkSubscriptionAccess(userId: string, requiredTier: string = 'free'): Promise<boolean> {
//   try {
//     const supabaseAdmin = createClient(
//       process.env.SUPABASE_URL!,
//       process.env.SUPABASE_SERVICE_ROLE_KEY!
//     );

//     // Check user's subscription tier
//     const { data: user, error: userError } = await supabaseAdmin
//       .from('users')
//       .select('subscription_tier, subscription_expires_at')
//       .eq('id', userId)
//       .single();

//     if (userError || !user) {
//       console.log('User not found for subscription check');
//       return false;
//     }

//     const userTier = user.subscription_tier || 'free';

//     // Define tier hierarchy - updated to include zidlite
//     const tierHierarchy = ['free', 'zidlite', 'growth', 'premium', 'elite'];
//     const userTierIndex = tierHierarchy.indexOf(userTier);
//     const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

//     // Check if user's tier meets requirement
//     if (userTierIndex < requiredTierIndex) {
//       console.log(`User tier ${userTier} insufficient for required tier ${requiredTier}`);
//       return false;
//     }

//     // For paid tiers, check if subscription is active and not expired
//     if (userTier !== 'free') {
//       // Check if subscription is expired
//       if (user.subscription_expires_at && new Date(user.subscription_expires_at) < new Date()) {
//         console.log('Subscription expired');
//         return false;
//       }

//       // Verify active subscription exists
//       const { data: subscription } = await supabaseAdmin
//         .from('subscriptions')
//         .select('status')
//         .eq('user_id', userId)
//         .eq('status', 'active')
//         .order('created_at', { ascending: false })
//         .limit(1)
//         .single();

//       if (!subscription) {
//         console.log('No active subscription found');
//         return false;
//       }
//     }

//     return true;
//   } catch (error) {
//     console.error('Error checking subscription access:', error);
//     return false;
//   }
// }

// // Function to check if user is verified (BVN verification)
// async function checkUserVerification(userId: string): Promise<boolean> {
//   try {
//     const supabaseAdmin = createClient(
//       process.env.SUPABASE_URL!,
//       process.env.SUPABASE_SERVICE_ROLE_KEY!
//     );

//     const { data: user, error } = await supabaseAdmin
//       .from('users')
//       .select('bvn_verification')
//       .eq('id', userId)
//       .single();

//     if (error || !user) {
//       console.log('User not found for verification check');
//       return false;
//     }

//     return user.bvn_verification === 'verified';
//   } catch (error) {
//     console.error('Error checking user verification:', error);
//     return false;
//   }
// }

// export async function middleware(req: NextRequest) {
//   const currentPath = req.nextUrl.pathname;

//   // ✅ ALLOW PAYMENT CALLBACK AND AUTO-LOGIN TO PASS THROUGH WITHOUT AUTH
//   if (currentPath === '/api/payment-callback' || currentPath === '/api/auth/auto-login') {
//     console.log("🔵 Payment callback/auto-login bypassing middleware auth");
//     return NextResponse.next();
//   }

//   let accessToken = req.cookies.get("sb-access-token")?.value;
//   const refreshToken = req.cookies.get("sb-refresh-token")?.value;
//   const verified = req.cookies.get("verified")?.value;

//   // ✅ Allow dashboard access with payment_processed cookie
//   if (currentPath.startsWith('/dashboard') && req.cookies.get('payment_processed')) {
//     console.log("🟡 Post-payment access granted");
//     const response = NextResponse.next();
//     response.cookies.delete('payment_processed');
//     return response;
//   }

//   // Define premium routes that require specific subscription tiers - updated to include zidlite
//   const premiumRoutes = [
//     { path: '/dashboard/bookkeeping', requiredTier: 'growth' },
//     { path: '/dashboard/tax-calculator', requiredTier: 'growth' },
//     { path: '/dashboard/financial-statements', requiredTier: 'premium' },
//     { path: '/dashboard/tax-filing', requiredTier: 'premium' },
//     { path: '/dashboard/vat-filing', requiredTier: 'elite' },
//     { path: '/dashboard/paye-filing', requiredTier: 'elite' },
//     { path: '/dashboard/cfo-guidance', requiredTier: 'elite' },
//   ];

//   // Define routes that require BVN verification
//   const bvnRequiredRoutes = [
//     '/dashboard/fund-account',
//     '/dashboard/fund-account/transfer-page',
//     '/dashboard/services/buy-airtime',
//     '/dashboard/services/buy-data',
//     '/dashboard/services/buy-power',
//     '/dashboard/services/buy-cable-tv',
//   ];

//   // Check if current path is a BVN required route
//   const requiresBVN = bvnRequiredRoutes.some(route =>
//     currentPath.startsWith(route)
//   );

//   // Check if current path is a premium route
//   const matchedPremiumRoute = premiumRoutes.find(route =>
//     currentPath.startsWith(route.path)
//   );

//   if (currentPath === "/app") {
//     console.log("Redirecting /app to home page");
//     return NextResponse.redirect(new URL("/", req.url));
//   }

//   // Protected routes check
//   if (
//     currentPath.startsWith("/dashboard") ||
//     currentPath.startsWith("/admin") ||
//     currentPath.startsWith("/blog/admin")
//   ) {
//     // No session at all → redirect to login
//     if (!accessToken && !refreshToken) {
//       console.log("No tokens found, redirecting to login");
//       return redirectToLogin(req);
//     }

//     // ✅ Refresh access token using refresh token
//     if (!accessToken && refreshToken) {
//       console.log("No access token but refresh token exists, attempting refresh");

//       try {
//         const supabase = createClient(
//           process.env.SUPABASE_URL!,
//           process.env.SUPABASE_SERVICE_ROLE_KEY!
//         );

//         const { data, error } = await supabase.auth.refreshSession({
//           refresh_token: refreshToken,
//         });

//         if (error || !data.session) {
//           console.log("Token refresh failed:", error?.message);
//           return redirectToLogin(req);
//         }

//         // Save new tokens
//         console.log("Token refresh successful, updating cookies");
//         const res = NextResponse.next();

//         res.cookies.set("sb-access-token", data.session.access_token, {
//           httpOnly: true,
//           secure: process.env.NODE_ENV === "production",
//           sameSite: "lax",
//           path: "/",
//           maxAge: 60 * 60 * 24 * 7,
//         });

//         res.cookies.set("sb-refresh-token", data.session.refresh_token!, {
//           httpOnly: true,
//           secure: process.env.NODE_ENV === "production",
//           sameSite: "lax",
//           path: "/",
//           maxAge: 60 * 60 * 24 * 7,
//         });

//         // Update access token for further checks in this request
//         accessToken = data.session.access_token;
//       } catch (refreshError) {
//         console.log("Token refresh exception:", refreshError);
//         return redirectToLogin(req);
//       }
//     }

//     // ✅ Check BVN verification for protected routes
//     if (requiresBVN && accessToken) {
//       try {
//         const supabaseAdmin = createClient(
//           process.env.SUPABASE_URL!,
//           process.env.SUPABASE_SERVICE_ROLE_KEY!
//         );

//         const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

//         if (userError || !user) {
//           console.log("User not found for BVN check");
//           return redirectToLogin(req);
//         }

//         const isVerified = await checkUserVerification(user.id);

//         if (!isVerified) {
//           console.log(`User lacks BVN verification for ${currentPath}`);

//           const response = NextResponse.redirect(
//             new URL(`/dashboard?verify=bvn&redirect=${encodeURIComponent(currentPath)}`, req.url)
//           );

//           response.cookies.set('verification_message', 'Please verify your BVN to access this feature', {
//             httpOnly: true,
//             maxAge: 5,
//             path: '/',
//             sameSite: 'lax',
//           });

//           return response;
//         }
//       } catch (error) {
//         console.error('Error checking BVN verification:', error);
//       }
//     }

//     // ✅ Check subscription access for premium routes
//     if (matchedPremiumRoute && accessToken) {
//       try {
//         const supabaseAdmin = createClient(
//           process.env.SUPABASE_URL!,
//           process.env.SUPABASE_SERVICE_ROLE_KEY!
//         );

//         const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

//         if (userError || !user) {
//           console.log("User not found for subscription check");
//           return redirectToLogin(req);
//         }

//         const hasAccess = await checkSubscriptionAccess(
//           user.id,
//           matchedPremiumRoute.requiredTier
//         );

//         if (!hasAccess) {
//           console.log(`User lacks ${matchedPremiumRoute.requiredTier} access for ${currentPath}`);

//           const response = NextResponse.redirect(
//             new URL(`/pricing?upgrade=${matchedPremiumRoute.requiredTier}&redirect=${encodeURIComponent(currentPath)}`, req.url)
//           );

//           response.cookies.set('subscription_message', `This feature requires the ${matchedPremiumRoute.requiredTier} plan`, {
//             httpOnly: true,
//             maxAge: 5,
//             path: '/',
//             sameSite: 'lax',
//           });

//           return response;
//         }
//       } catch (error) {
//         console.error('Error checking subscription:', error);
//       }
//     }

//     // ✅ Admin protection
//     if (currentPath.startsWith("/admin") || currentPath.startsWith("/blog/admin")) {
//       console.log("Admin route detected, checking admin permissions");

//       if (!accessToken) {
//         console.log("No access token for admin check, redirecting to login");
//         return redirectToLogin(req);
//       }

//       try {
//         const supabaseAdmin = createClient(
//           process.env.SUPABASE_URL!,
//           process.env.SUPABASE_SERVICE_ROLE_KEY!
//         );

//         const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

//         if (userError || !user) {
//           console.log("User not found or error:", userError?.message);
//           return redirectToLogin(req);
//         }

//         console.log(`User found: ${user.email}, checking admin role...`);

//         const { data: profile, error: profileError } = await supabaseAdmin
//           .from("users")
//           .select("admin_role")
//           .eq("id", user.id)
//           .single();

//         if (profileError) {
//           console.log("Error fetching user profile:", profileError.message);
//           return redirectToLogin(req);
//         }

//         console.log(`User admin role: ${profile?.admin_role}`);

//         const allowedAdminRoles = [
//           "super_admin",
//           "finance_admin",
//           "operations_admin",
//           "support_admin",
//           "legal_admin",
//           "blog_admin"
//         ];

//         if (!profile?.admin_role || !allowedAdminRoles.includes(profile.admin_role)) {
//           console.log(`User role '${profile?.admin_role}' not authorized for admin access`);
//           return NextResponse.redirect(new URL("/dashboard", req.url));
//         }

//         console.log(`Admin access granted for role: ${profile.admin_role}`);
//       } catch (adminCheckError) {
//         console.log("Admin check exception:", adminCheckError);
//         return redirectToLogin(req);
//       }
//     }
//   }

//   return NextResponse.next();
// }

// function redirectToLogin(req: NextRequest) {
//   const { pathname, search } = req.nextUrl;
//   const fullUrl = `${pathname}${search}`;

//   const loginUrl = new URL("/auth/login", req.url);
//   loginUrl.searchParams.set("callbackUrl", encodeURIComponent(fullUrl));

//   const res = NextResponse.redirect(loginUrl);

//   res.cookies.delete("sb-access-token");
//   res.cookies.delete("sb-refresh-token");
//   res.cookies.delete("verified");

//   return res;
// }

// export const config = {
//   matcher: [
//     "/app",
//     "/dashboard/:path*",
//     "/admin/:path*",
//     "/blog/admin/:path*",
//     "/api/payment-callback",
//     "/api/auth/auto-login",
//   ],
// };
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { User } from "@supabase/supabase-js";
import { 
  getSupabaseAdmin, 
  getUserWithDetails, 
  hasSufficientTier,
  isSubscriptionActive 
} from "@/lib/suabase-admin"; 

// Define route configurations
const premiumRoutes = [
  { path: "/dashboard/bookkeeping", requiredTier: "growth" },
  { path: "/dashboard/tax-calculator", requiredTier: "growth" },
  { path: "/dashboard/financial-statements", requiredTier: "premium" },
  { path: "/dashboard/tax-filing", requiredTier: "premium" },
  { path: "/dashboard/vat-filing", requiredTier: "elite" },
  { path: "/dashboard/paye-filing", requiredTier: "elite" },
  { path: "/dashboard/cfo-guidance", requiredTier: "elite" },
];

const bvnRequiredRoutes = [
  "/dashboard/fund-account",
  "/dashboard/fund-account/transfer-page",
  "/dashboard/services/buy-airtime",
  "/dashboard/services/buy-data",
  "/dashboard/services/buy-power",
  "/dashboard/services/buy-cable-tv",
];

const allowedAdminRoles = [
  "super_admin",
  "finance_admin",
  "operations_admin",
  "support_admin",
  "legal_admin",
  "blog_admin",
];

// Define return type for token validation
type TokenValidationResult = User | { error: "expired" } | null;

async function validateTokenAndGetUser(token: string): Promise<TokenValidationResult> {
  if (!token) return null;

  try {
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      if (error.message?.includes("JWT expired")) {
        return { error: "expired" };
      }
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

    if (error || !data.session) {
      return null;
    }

    return data.session;
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
  }
}

// Type guard to check if result is an error object
function isTokenError(result: TokenValidationResult): result is { error: "expired" } {
  return result !== null && typeof result === 'object' && 'error' in result && result.error === "expired";
}

// Type guard to check if result is a User
function isUser(result: TokenValidationResult): result is User {
  return result !== null && !('error' in result) && 'id' in result;
}

export async function middleware(req: NextRequest) {
  const startTime = Date.now();
  const userAgent = req.headers.get("user-agent") || "";
  const isCrawler = /bot|crawler|spider|facebook|twitter|linkedin|slack/i.test(userAgent);
  const currentPath = req.nextUrl.pathname;
  
  // Handle crawlers
  if (isCrawler && currentPath.includes("/blog/post-blog/")) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-cache, must-revalidate");
    return response;
  }

  // Allow payment callbacks and auto-login
  if (
    currentPath === "/api/payment-callback" ||
    currentPath === "/api/auth/auto-login"
  ) {
    return NextResponse.next();
  }

  // Handle post-payment access
  if (
    currentPath.startsWith("/dashboard") &&
    req.cookies.get("payment_processed")
  ) {
    const response = NextResponse.next();
    response.cookies.delete("payment_processed");
    return response;
  }

  // Redirect /app to home
  if (currentPath === "/app") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // API routes are public
  if (currentPath.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Check if route needs protection
  const isProtectedRoute = currentPath.startsWith("/dashboard") ||
    currentPath.startsWith("/admin") ||
    currentPath.startsWith("/blog/admin");

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get tokens
  let accessToken = req.cookies.get("sb-access-token")?.value;
  const refreshToken = req.cookies.get("sb-refresh-token")?.value;

  // No tokens at all
  if (!accessToken && !refreshToken) {
    console.log("No tokens found, redirecting to login");
    return redirectToLogin(req);
  }

  // Try to refresh token if needed
  if (!accessToken && refreshToken) {
    const session = await refreshAccessToken(refreshToken);
    
    if (!session) {
      return redirectToLogin(req);
    }

    const response = NextResponse.next();
    response.cookies.set("sb-access-token", session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    response.cookies.set("sb-refresh-token", session.refresh_token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    accessToken = session.access_token;
  }

  // Validate token
  if (!accessToken) {
    return redirectToLogin(req);
  }

  const tokenResult = await validateTokenAndGetUser(accessToken);
  
  // Handle token validation results
  if (!tokenResult) {
    return redirectToLogin(req);
  }

  // Check if token is expired
  if (isTokenError(tokenResult)) {
    return redirectToLogin(req);
  }

  // Now we know tokenResult is a User object
  if (!isUser(tokenResult)) {
    return redirectToLogin(req);
  }

  // Get user details with caching
  const userDetails = await getUserWithDetails(tokenResult.id);
  
  if (!userDetails) {
    return redirectToLogin(req);
  }

  // Check if user is blocked
  if (userDetails.is_blocked) {
    const response = NextResponse.redirect(new URL("/auth/blocked", req.url));
    response.cookies.delete("sb-access-token");
    response.cookies.delete("sb-refresh-token");
    return response;
  }

  // Check if route requires BVN verification
  const requiresBVN = bvnRequiredRoutes.some((route) =>
    currentPath.startsWith(route)
  );

  if (requiresBVN && userDetails.bvn_verification !== "verified") {
    const response = NextResponse.redirect(
      new URL(
        `/dashboard?verify=bvn&redirect=${encodeURIComponent(currentPath)}`,
        req.url,
      ),
    );
    response.cookies.set(
      "verification_message",
      "Please verify your BVN to access this feature",
      { httpOnly: true, maxAge: 5, path: "/", sameSite: "lax" },
    );
    return response;
  }

  // Check if route requires specific subscription tier
  const matchedPremiumRoute = premiumRoutes.find((route) =>
    currentPath.startsWith(route.path)
  );

  if (matchedPremiumRoute) {
    const hasAccess = hasSufficientTier(userDetails, matchedPremiumRoute.requiredTier);
    
    if (!hasAccess) {
      const response = NextResponse.redirect(
        new URL(
          `/pricing?upgrade=${matchedPremiumRoute.requiredTier}&redirect=${encodeURIComponent(currentPath)}`,
          req.url,
        ),
      );
      response.cookies.set(
        "subscription_message",
        `This feature requires the ${matchedPremiumRoute.requiredTier} plan`,
        { httpOnly: true, maxAge: 5, path: "/", sameSite: "lax" },
      );
      return response;
    }
  }

  // Check admin routes
  if (currentPath.startsWith("/admin") || currentPath.startsWith("/blog/admin")) {
    if (!userDetails.admin_role || !allowedAdminRoles.includes(userDetails.admin_role)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  const responseTime = Date.now() - startTime;
  if (responseTime > 200) {
    console.warn(`Slow middleware (${responseTime}ms) for ${currentPath}`);
  }

  return NextResponse.next();
}

function redirectToLogin(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const fullUrl = `${pathname}${search}`;
  const loginUrl = new URL("/auth/login", req.url);
  loginUrl.searchParams.set("callbackUrl", encodeURIComponent(fullUrl));

  const res = NextResponse.redirect(loginUrl);
  
  // Clear all auth cookies
  res.cookies.delete("sb-access-token");
  res.cookies.delete("sb-refresh-token");
  res.cookies.delete("verified");

  return res;
}

export const config = {
  matcher: [
    "/app",
    "/dashboard/:path*",
    "/admin/:path*",
    "/blog/admin/:path*",
    "/api/:path*",
    "/api/payment-callback",
    "/api/auth/auto-login",
  ],
};