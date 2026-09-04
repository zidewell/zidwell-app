'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUserContextData } from '@/app/context/userData';

// In development, session never times out; in production, 15 min
const SESSION_TIMEOUT = process.env.NEXT_PUBLIC_NODE_ENV === "development" ? -1 : 15 * 60 * 1000; // -1 = disabled

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

const SESSION_RISK_THRESHOLD = 60;

export default function SessionWatcher({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userData, loading, setUserData } = useUserContextData();
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutInProgress = useRef(false);
  const [isSessionValid, setIsSessionValid] = useState(true);

  const isPublicRoute = useCallback(() => {
    if (!pathname) return false;
    return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
  }, [pathname]);

  const clearSession = useCallback(() => {
    localStorage.removeItem('userData');
    setUserData(null);
    
    const cookiesToClear = [
      "sb-access-token",
      "sb-refresh-token",
      "sb-client-session",
      "sb-login-time",
      "sb-session-risk",
      "sb-user-data",
      "sb-session-id"
    ];
    
    cookiesToClear.forEach(name => {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });
  }, [setUserData]);

  const handleLogout = useCallback(async (reason: string = 'Session expired') => {
    if (logoutInProgress.current || !userData || isPublicRoute() || loading) return;
    
    logoutInProgress.current = true;

    try {
      if (timerRef.current) clearTimeout(timerRef.current);

      clearSession();
      await fetch('/api/logout', { method: 'POST' }).catch(console.error);

      if (reason.includes('suspicious') || reason.includes('blocked')) {
        alert(`Security alert: ${reason}. Please login again.`);
      }
      
      router.replace('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setTimeout(() => { 
        logoutInProgress.current = false;
      }, 1000);
    }
  }, [userData, isPublicRoute, router, clearSession, loading]);

  const checkSessionValidity = useCallback(async () => {
    if (!userData || isPublicRoute() || loading || logoutInProgress.current) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/auth/validate-session', {
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401) {
          setIsSessionValid(false);
          await handleLogout('Session expired');
          return;
        }

        if (response.status === 403) {
          setIsSessionValid(false);
          await handleLogout(errorData.reason || 'Session invalid');
          return;
        }
      }

      const data = await response.json();
      
      if (!data.valid) {
        setIsSessionValid(false);
        await handleLogout('Session expired');
        return;
      }

      const riskCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('sb-session-risk='));
      const riskScore = riskCookie ? parseInt(riskCookie.split('=')[1]) : 0;

      // BEST PRACTICE: Don't force logout on high risk score.
      // We already allowed the login. Just log it.
      if (riskScore >= 60) {
        console.warn('High risk session detected, but allowing continued use.');
      }

      setIsSessionValid(true);
      resetTimer();
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Session check error:', error);
      }
    }
  }, [userData, isPublicRoute, loading, handleLogout]);

  const resetTimer = useCallback(() => {
    if (!userData || isPublicRoute() || loading || !isSessionValid) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    sessionStorage.setItem('lastActivity', Date.now().toString());

    timerRef.current = setTimeout(() => {
      const lastActivity = sessionStorage.getItem('lastActivity');
      const now = Date.now();
      
      if (lastActivity && (now - parseInt(lastActivity)) < SESSION_TIMEOUT) {
        resetTimer();
      } else {
        checkSessionValidity();
      }
    }, SESSION_TIMEOUT);
  }, [userData, isPublicRoute, loading, isSessionValid, checkSessionValidity]);

  // Track user activity
  useEffect(() => {
    if (!userData || isPublicRoute() || loading) return;

    const updateLastActivity = () => {
      sessionStorage.setItem('lastActivity', Date.now().toString());
      resetTimer();
    };

    const activities = ['mousedown', 'click', 'keydown', 'scroll', 'touchstart'];
    activities.forEach(a => window.addEventListener(a, updateLastActivity));
    updateLastActivity();

    return () => {
      activities.forEach(a => window.removeEventListener(a, updateLastActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [userData, isPublicRoute, resetTimer, loading]);

  // Check session ONLY when tab becomes visible (zero background polling)
  useEffect(() => {
    if (!userData || isPublicRoute() || loading) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkSessionValidity();
        resetTimer();
      } else {
        if (timerRef.current) clearTimeout(timerRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial check on mount
    checkSessionValidity();

    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userData, isPublicRoute, resetTimer, loading, checkSessionValidity]);

  return <>{children}</>;
}