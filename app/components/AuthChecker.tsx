'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserContextData } from '@/app/context/userData';

// ✅ Add ALL public routes here (same as middleware)
const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/auth/password-reset",
  "/auth/forgot-password",
  "/auth/blocked",
  "/pricing",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/blog",
  "/faq",
  "/pay",
  "/sign-contract",
  "/sign-receipt",
  "/pay-invoice",
  "/verify-email",
  "/reset-password",
  "/invite",
  "/share",
  "/preview",
  "/public",
];

// ✅ Add regex patterns for dynamic public routes
const PUBLIC_PATH_PATTERNS = [
  /^\/sign-contract\/[^\/]+$/,     // /sign-contract/any-id
  /^\/sign-receipt\/[^\/]+$/,      // /sign-receipt/any-id
  /^\/pay-invoice\/[^\/]+$/,       // /pay-invoice/any-id
  /^\/pay\/[^\/]+$/,               // /pay/any-id
  /^\/verify-email\/[^\/]+$/,      // /verify-email/any-token
  /^\/reset-password\/[^\/]+$/,    // /reset-password/any-token
  /^\/invite\/[^\/]+$/,            // /invite/any-code
  /^\/share\/[^\/]+$/,             // /share/any-id
  /^\/preview\/[^\/]+$/,           // /preview/any-id
  /^\/public\/[^\/]+$/,            // /public/any-file
  /^\/blog\/[^\/]+$/,              // /blog/any-post
  /^\/pricing\/[^\/]+$/,           // /pricing/any-plan
];

// ✅ Define which routes require authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/admin",
  "/blog/admin",
  "/app",
];

export default function AuthChecker({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { userData, loading, setUserData } = useUserContextData();
  const redirectingRef = useRef(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Check if current route is public
  const isPublicRoute = () => {
    if (!pathname) return false;
    
    // Check exact matches
    if (PUBLIC_ROUTES.some(route => pathname === route)) {
      return true;
    }
    
    // Check path prefixes
    if (PUBLIC_ROUTES.some(route => pathname.startsWith(route + '/'))) {
      return true;
    }
    
    // Check regex patterns for dynamic routes
    if (PUBLIC_PATH_PATTERNS.some(pattern => pattern.test(pathname))) {
      return true;
    }
    
    return false;
  };
  
  // ✅ Check if current route requires authentication
  const requiresAuth = () => {
    if (!pathname) return false;
    
    // Check if it's a protected route
    return PROTECTED_ROUTES.some(route => 
      pathname === route || pathname.startsWith(route + '/')
    );
  };

  const redirectToLogin = () => {
    if (redirectingRef.current || isPublicRoute() || loading) return;
    redirectingRef.current = true;

    console.log(`🔒 AuthChecker: Redirecting to login from ${pathname}`);
    
    localStorage.removeItem('userData');
    setUserData(null);
    
    // Clear cookies
    document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "sb-client-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
    router.replace('/auth/login');

    setTimeout(() => {
      redirectingRef.current = false;
    }, 1000);
  };

  // Intercept 401 responses
  useEffect(() => {
    if (isPublicRoute() || loading) return;

    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      if (response.status === 401 && requiresAuth()) {
        redirectToLogin();
        throw new Error('Session expired');
      }
      
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [pathname, loading]);

  // ✅ Redirect if on protected route without user data
  useEffect(() => {
    // Skip if it's a public route
    if (isPublicRoute()) {
      console.log(`✅ AuthChecker: Public route accessed - ${pathname}`);
      return;
    }
    
    // Skip if not a protected route
    if (!requiresAuth()) {
      console.log(`✅ AuthChecker: Non-protected route accessed - ${pathname}`);
      return;
    }
    
    if (loading) return;

    console.log(`🔒 AuthChecker: Protected route accessed - ${pathname}, userData: ${!!userData}`);

    // Clear any existing timeout
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    if (!userData) {
      // Wait a bit to see if session restores
      checkTimeoutRef.current = setTimeout(() => {
        // Check again if we have session cookie
        const hasSession = document.cookie.includes('sb-client-session=true');
        const currentUserData = localStorage.getItem('userData');
        
        if (!hasSession && !currentUserData) {
          redirectToLogin();
        }
      }, 500);
    }

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [pathname, userData, loading]);

  return <>{children}</>;
}