// app/components/AuthChecker.tsx
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
];

const DEV_MODE = process.env.NEXT_PUBLIC_NODE_ENV !== "production";

export default function AuthChecker({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { userData, loading } = useUserContextData();
  const redirectingRef = useRef(false);

  const isPublicRoute = () => {
    if (!pathname) return false;
    if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) return true;
    if (PUBLIC_PATH_PATTERNS.some(pattern => pattern.test(pathname))) return true;
    return false;
  };

  const isProtectedRoute = () => {
    if (!pathname) return false;
    return pathname.startsWith('/dashboard') || 
           pathname.startsWith('/admin') || 
           pathname.startsWith('/store');
  };

  useEffect(() => {
    // Don't redirect on public routes or if loading
    if (isPublicRoute() || loading) return;
    
    // In development, allow access even without user data
    if (DEV_MODE) {
      console.log('🔓 Dev mode: allowing access without authentication');
      return;
    }

    // Only check protected routes
    if (!isProtectedRoute()) return;

    // Check if user is authenticated
    const hasSession = document.cookie.includes('sb-client-session=true');
    const hasSessionId = document.cookie.includes('sb-session-id=');
    const hasUserData = !!userData;
    const hasLocalStorage = localStorage.getItem('userData') !== null;

    const isAuthenticated = hasSession && hasSessionId && (hasUserData || hasLocalStorage);

    if (!isAuthenticated && !redirectingRef.current) {
      redirectingRef.current = true;
      
      console.log(`🔒 AuthChecker: Redirecting to login from ${pathname}`);
      
      // Clear any stale data
      localStorage.removeItem('userData');
      localStorage.removeItem('zidwell_store_data');
      localStorage.removeItem('zidwell_store_timestamp');
      
      // Clear cookies
      document.cookie = "sb-client-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "sb-session-id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      
      // Use replace to prevent back button
      router.replace('/auth/login');
      
      setTimeout(() => {
        redirectingRef.current = false;
      }, 1000);
    }
  }, [pathname, userData, loading, router]);

  return <>{children}</>;
}