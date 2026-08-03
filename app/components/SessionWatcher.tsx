'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUserContextData } from '@/app/context/userData';

const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/signup",
  "/auth/password-reset",
  "/auth/forgot-password",
  "/auth/blocked",
  "/",
  "/pricing",
  "/blog",
  "/about",
  "/contact",
];

const SESSION_TIMEOUT_MS = 15 * 60 * 1000;
const SESSION_WARNING_MS = 60 * 1000;
const INACTIVITY_CHECK_MS = 60 * 1000;

export default function SessionWatcher({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userData, loading, setUserData } = useUserContextData();
  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isPublicRoute = useCallback(() => {
    if (!pathname) return false;
    return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
  }, [pathname]);

  const clearSession = useCallback(() => {
    localStorage.removeItem('userData');
    setUserData(null);
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token',
      'sb-client-session',
      'sb-login-time',
      'verified',
      'payment_processed',
    ];
    cookiesToClear.forEach(name => {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });
  }, [setUserData]);

  const handleLogout = useCallback(async () => {
    if (!userData || isPublicRoute() || loading) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);

    clearSession();

    try {
      await fetch('/api/logout', { method: 'POST' }).catch(() => {});
    } catch {
      // Ignore network errors during logout
    }

    router.replace('/auth/login');
  }, [userData, isPublicRoute, loading, router, clearSession]);

  const checkActivity = useCallback(() => {
    if (!userData || isPublicRoute() || loading) return;

    const elapsed = Date.now() - lastActivityRef.current;

    if (elapsed >= SESSION_TIMEOUT_MS) {
      handleLogout();
    } else if (elapsed >= SESSION_TIMEOUT_MS - SESSION_WARNING_MS) {
      // Close to timeout - silent refresh attempt
      fetch('/api/me', { credentials: 'include' })
        .catch(() => {});
    }
  }, [userData, isPublicRoute, loading, handleLogout]);

  const updateActivity = useCallback(() => {
    if (!userData || isPublicRoute() || loading) return;
    lastActivityRef.current = Date.now();
  }, [userData, isPublicRoute, loading]);

  // Initialize activity timestamp
  useEffect(() => {
    if (!userData || isPublicRoute() || loading) return;
    lastActivityRef.current = Date.now();
  }, [userData, isPublicRoute, loading]);

  // Set up activity listeners
  useEffect(() => {
    if (!userData || isPublicRoute() || loading) return;

    const events = ['mousedown', 'click', 'keydown', 'scroll', 'touchstart'];
    const handler = () => updateActivity();

    events.forEach(event => window.addEventListener(event, handler));

    return () => {
      events.forEach(event => window.removeEventListener(event, handler));
    };
  }, [userData, isPublicRoute, loading, updateActivity]);

  // Set up inactivity check interval
  useEffect(() => {
    if (!userData || isPublicRoute() || loading) return;

    checkIntervalRef.current = setInterval(checkActivity, INACTIVITY_CHECK_MS);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [userData, isPublicRoute, loading, checkActivity]);

  return <>{children}</>;
}
