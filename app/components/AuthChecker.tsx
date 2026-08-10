'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserContextData } from '@/app/context/userData';

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

const PUBLIC_PATH_PATTERNS = [
  /^\/sign-contract\/[^\/]+$/,
  /^\/sign-receipt\/[^\/]+$/,
  /^\/pay-invoice\/[^\/]+$/,
  /^\/pay\/[^\/]+$/,
  /^\/verify-email\/[^\/]+$/,
  /^\/reset-password\/[^\/]+$/,
  /^\/invite\/[^\/]+$/,
  /^\/share\/[^\/]+$/,
  /^\/preview\/[^\/]+$/,
  /^\/public\/[^\/]+$/,
  /^\/blog\/[^\/]+$/,
  /^\/pricing\/[^\/]+$/,
];

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

  const isPublicRoute = () => {
    if (!pathname) return false;
    if (PUBLIC_ROUTES.some(route => pathname === route)) return true;
    if (PUBLIC_ROUTES.some(route => pathname.startsWith(route + '/'))) return true;
    if (PUBLIC_PATH_PATTERNS.some(pattern => pattern.test(pathname))) return true;
    return false;
  };
  
  const requiresAuth = () => {
    if (!pathname) return false;
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
    
    document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "sb-client-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "sb-session-id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
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

  // Redirect if on protected route without user data
  useEffect(() => {
    if (isPublicRoute()) {
      console.log(`✅ AuthChecker: Public route accessed - ${pathname}`);
      return;
    }
    
    if (!requiresAuth()) {
      console.log(`✅ AuthChecker: Non-protected route accessed - ${pathname}`);
      return;
    }
    
    if (loading) return;

    console.log(`🔒 AuthChecker: Protected route accessed - ${pathname}, userData: ${!!userData}`);

    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    if (!userData) {
      checkTimeoutRef.current = setTimeout(() => {
        const hasSession = document.cookie.includes('sb-client-session=true');
        const hasSessionId = document.cookie.includes('sb-session-id=');
        const currentUserData = localStorage.getItem('userData');
        
        if (!hasSession && !hasSessionId && !currentUserData) {
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