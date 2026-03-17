
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
    
//     // Define tier hierarchy
//     const tierHierarchy = ['free', 'growth', 'premium', 'elite'];
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

// export async function middleware(req: NextRequest) {
//   let accessToken = req.cookies.get("sb-access-token")?.value;
//   const refreshToken = req.cookies.get("sb-refresh-token")?.value;
//   const verified = req.cookies.get("verified")?.value;
  
//   const currentPath = req.nextUrl.pathname;

//   // Define premium routes that require specific subscription tiers
//   const premiumRoutes = [
//     { path: '/dashboard/bookkeeping', requiredTier: 'growth' },
//     { path: '/dashboard/tax-calculator', requiredTier: 'growth' },
//     { path: '/dashboard/financial-statements', requiredTier: 'premium' },
//     { path: '/dashboard/tax-filing', requiredTier: 'premium' },
//     { path: '/dashboard/vat-filing', requiredTier: 'elite' },
//     { path: '/dashboard/paye-filing', requiredTier: 'elite' },
//     { path: '/dashboard/cfo-guidance', requiredTier: 'elite' },
//   ];

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
//           sameSite: "strict",
//           path: "/",
//           maxAge: 60 * 60 * 24 * 7, // 7 days
//         });
        
//         res.cookies.set("sb-refresh-token", data.session.refresh_token!, {
//           httpOnly: true,
//           secure: process.env.NODE_ENV === "production",
//           sameSite: "strict",
//           path: "/",
//           maxAge: 60 * 60 * 24 * 7, // 7 days
//         });
        
//         // Update access token for further checks in this request
//         accessToken = data.session.access_token;
//       } catch (refreshError) {
//         console.log("Token refresh exception:", refreshError);
//         return redirectToLogin(req);
//       }
//     }



//     // ✅ Check subscription access for premium routes
//     if (matchedPremiumRoute && accessToken) {
//       try {
//         const supabaseAdmin = createClient(
//           process.env.SUPABASE_URL!,
//           process.env.SUPABASE_SERVICE_ROLE_KEY!
//         );

//         // Get user ID from token
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
          
//           // Store the intended URL to redirect back after upgrade
//           const response = NextResponse.redirect(
//             new URL(`/pricing?upgrade=${matchedPremiumRoute.requiredTier}&redirect=${encodeURIComponent(currentPath)}`, req.url)
//           );
          
//           // Add a flash message cookie
//           response.cookies.set('subscription_message', `This feature requires the ${matchedPremiumRoute.requiredTier} plan`, {
//             httpOnly: true,
//             maxAge: 5, // 5 seconds
//             path: '/',
//           });
          
//           return response;
//         }
//       } catch (error) {
//         console.error('Error checking subscription:', error);
//       }
//     }

//     // ✅ Admin protection (for both /admin and /blog/admin)
//     if (currentPath.startsWith("/admin") || currentPath.startsWith("/blog/admin")) {
//       console.log("Admin route detected, checking admin permissions");
      
//       // Make sure we have an access token at this point
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

//         // Define allowed admin roles
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
  
//   // Create login URL with callback parameter
//   const loginUrl = new URL("/auth/login", req.url);
//   loginUrl.searchParams.set("callbackUrl", encodeURIComponent(fullUrl));
  
//   const res = NextResponse.redirect(loginUrl);
  
//   // Clear all auth cookies
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
//   ],
// };


import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Add this function to check subscription access
async function checkSubscriptionAccess(userId: string, requiredTier: string = 'free'): Promise<boolean> {
  try {
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check user's subscription tier
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('subscription_tier, subscription_expires_at')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.log('User not found for subscription check');
      return false;
    }

    const userTier = user.subscription_tier || 'free';
    
    // Define tier hierarchy
    const tierHierarchy = ['free', 'growth', 'premium', 'elite'];
    const userTierIndex = tierHierarchy.indexOf(userTier);
    const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

    // Check if user's tier meets requirement
    if (userTierIndex < requiredTierIndex) {
      console.log(`User tier ${userTier} insufficient for required tier ${requiredTier}`);
      return false;
    }

    // For paid tiers, check if subscription is active and not expired
    if (userTier !== 'free') {
      // Check if subscription is expired
      if (user.subscription_expires_at && new Date(user.subscription_expires_at) < new Date()) {
        console.log('Subscription expired');
        return false;
      }

      // Verify active subscription exists
      const { data: subscription } = await supabaseAdmin
        .from('subscriptions')
        .select('status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!subscription) {
        console.log('No active subscription found');
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking subscription access:', error);
    return false;
  }
}

// Function to check if user is verified (BVN verification)
async function checkUserVerification(userId: string): Promise<boolean> {
  try {
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('bvn_verification')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.log('User not found for verification check');
      return false;
    }

    return user.bvn_verification === 'verified';
  } catch (error) {
    console.error('Error checking user verification:', error);
    return false;
  }
}

export async function middleware(req: NextRequest) {
  let accessToken = req.cookies.get("sb-access-token")?.value;
  const refreshToken = req.cookies.get("sb-refresh-token")?.value;
  const verified = req.cookies.get("verified")?.value;
  
  const currentPath = req.nextUrl.pathname;

  // Define premium routes that require specific subscription tiers
  const premiumRoutes = [
    { path: '/dashboard/bookkeeping', requiredTier: 'growth' },
    { path: '/dashboard/tax-calculator', requiredTier: 'growth' },
    { path: '/dashboard/financial-statements', requiredTier: 'premium' },
    { path: '/dashboard/tax-filing', requiredTier: 'premium' },
    { path: '/dashboard/vat-filing', requiredTier: 'elite' },
    { path: '/dashboard/paye-filing', requiredTier: 'elite' },
    { path: '/dashboard/cfo-guidance', requiredTier: 'elite' },
  ];

  // Define routes that require BVN verification (excluding My Transaction)
  const bvnRequiredRoutes = [
    '/dashboard/fund-account',
    '/dashboard/fund-account/transfer-page',
    '/dashboard/services/buy-airtime',
    '/dashboard/services/buy-data',
    '/dashboard/services/buy-power',
    '/dashboard/services/buy-cable-tv',
  ];

  // Check if current path is a BVN required route
  const requiresBVN = bvnRequiredRoutes.some(route => 
    currentPath.startsWith(route)
  );

  // Check if current path is a premium route
  const matchedPremiumRoute = premiumRoutes.find(route => 
    currentPath.startsWith(route.path)
  );

  if (currentPath === "/app") {
    console.log("Redirecting /app to home page");
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Protected routes check
  if (
    currentPath.startsWith("/dashboard") ||
    currentPath.startsWith("/admin") ||
    currentPath.startsWith("/blog/admin")
  ) {
    // No session at all → redirect to login
    if (!accessToken && !refreshToken) {
      console.log("No tokens found, redirecting to login");
      return redirectToLogin(req);
    }

    // ✅ Refresh access token using refresh token
    if (!accessToken && refreshToken) {
      console.log("No access token but refresh token exists, attempting refresh");
      
      try {
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabase.auth.refreshSession({
          refresh_token: refreshToken,
        });

        if (error || !data.session) {
          console.log("Token refresh failed:", error?.message);
          return redirectToLogin(req);
        }

        // Save new tokens
        console.log("Token refresh successful, updating cookies");
        const res = NextResponse.next();
        
        res.cookies.set("sb-access-token", data.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
        
        res.cookies.set("sb-refresh-token", data.session.refresh_token!, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
        
        // Update access token for further checks in this request
        accessToken = data.session.access_token;
      } catch (refreshError) {
        console.log("Token refresh exception:", refreshError);
        return redirectToLogin(req);
      }
    }

    // ✅ Check BVN verification for protected routes
    if (requiresBVN && accessToken) {
      try {
        const supabaseAdmin = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get user ID from token
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

        if (userError || !user) {
          console.log("User not found for BVN check");
          return redirectToLogin(req);
        }

        const isVerified = await checkUserVerification(user.id);

        if (!isVerified) {
          console.log(`User lacks BVN verification for ${currentPath}`);
          
          // Store the intended URL to redirect back after verification
          const response = NextResponse.redirect(
            new URL(`/dashboard?verify=bvn&redirect=${encodeURIComponent(currentPath)}`, req.url)
          );
          
          // Add a flash message cookie
          response.cookies.set('verification_message', 'Please verify your BVN to access this feature', {
            httpOnly: true,
            maxAge: 5, // 5 seconds
            path: '/',
          });
          
          return response;
        }
      } catch (error) {
        console.error('Error checking BVN verification:', error);
      }
    }

    // ✅ Check subscription access for premium routes
    if (matchedPremiumRoute && accessToken) {
      try {
        const supabaseAdmin = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get user ID from token
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

        if (userError || !user) {
          console.log("User not found for subscription check");
          return redirectToLogin(req);
        }

        const hasAccess = await checkSubscriptionAccess(
          user.id, 
          matchedPremiumRoute.requiredTier
        );

        if (!hasAccess) {
          console.log(`User lacks ${matchedPremiumRoute.requiredTier} access for ${currentPath}`);
          
          // Store the intended URL to redirect back after upgrade
          const response = NextResponse.redirect(
            new URL(`/pricing?upgrade=${matchedPremiumRoute.requiredTier}&redirect=${encodeURIComponent(currentPath)}`, req.url)
          );
          
          // Add a flash message cookie
          response.cookies.set('subscription_message', `This feature requires the ${matchedPremiumRoute.requiredTier} plan`, {
            httpOnly: true,
            maxAge: 5, // 5 seconds
            path: '/',
          });
          
          return response;
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    }

    // ✅ Admin protection (for both /admin and /blog/admin)
    if (currentPath.startsWith("/admin") || currentPath.startsWith("/blog/admin")) {
      console.log("Admin route detected, checking admin permissions");
      
      // Make sure we have an access token at this point
      if (!accessToken) {
        console.log("No access token for admin check, redirecting to login");
        return redirectToLogin(req);
      }
      
      try {
        const supabaseAdmin = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

        if (userError || !user) {
          console.log("User not found or error:", userError?.message);
          return redirectToLogin(req);
        }

        console.log(`User found: ${user.email}, checking admin role...`);

        const { data: profile, error: profileError } = await supabaseAdmin
          .from("users")
          .select("admin_role")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.log("Error fetching user profile:", profileError.message);
          return redirectToLogin(req);
        }

        console.log(`User admin role: ${profile?.admin_role}`);


        const allowedAdminRoles = [
          "super_admin", 
          "finance_admin", 
          "operations_admin", 
          "support_admin", 
          "legal_admin",
          "blog_admin"
        ];

        if (!profile?.admin_role || !allowedAdminRoles.includes(profile.admin_role)) {
          console.log(`User role '${profile?.admin_role}' not authorized for admin access`);
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        console.log(`Admin access granted for role: ${profile.admin_role}`);
      } catch (adminCheckError) {
        console.log("Admin check exception:", adminCheckError);
        return redirectToLogin(req);
      }
    }
  }

  return NextResponse.next();
}

function redirectToLogin(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const fullUrl = `${pathname}${search}`;
  
  // Create login URL with callback parameter
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
  ],
};