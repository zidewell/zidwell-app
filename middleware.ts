import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function middleware(req: NextRequest) {
  let accessToken = req.cookies.get("sb-access-token")?.value;
  const refreshToken = req.cookies.get("sb-refresh-token")?.value;
  const verified = req.cookies.get("verified")?.value;
  
  const currentPath = req.nextUrl.pathname;

 
  if (currentPath === "/app") {
    console.log("Redirecting /app to home page");
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Protected routes check
  if (
    currentPath.startsWith("/dashboard") ||
    currentPath.startsWith("/admin") ||
    currentPath.startsWith("/blog/admin") ||
    currentPath.startsWith("/onboarding")
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
        
        // Continue with the request - don't return yet, we need to continue checking
        // We'll let the rest of the middleware run with the new token
      } catch (refreshError) {
        console.log("Token refresh exception:", refreshError);
        return redirectToLogin(req);
      }
    }

    // ✅ Block unverified users (except onboarding - which we're already on)
    if (verified !== "true" && !currentPath.startsWith("/onboarding")) {
      console.log("User not verified, redirecting to onboarding");
      return NextResponse.redirect(new URL("/onboarding", req.url));
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

        // Define allowed admin roles
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
    "/onboarding"
  ],
};