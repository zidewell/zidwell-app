'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
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

const SESSION_TIMEOUT = 1 * 60 * 1000; // 15 minutes
const SESSION_CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds

export default function SessionWatcher({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userData, loading, setUserData } = useUserContextData();
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutInProgress = useRef(false);
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isSessionValid, setIsSessionValid] = useState(true);
  const checkCountRef = useRef(0); // Counter for logging

  const isPublicRoute = useCallback(() => {
    if (!pathname) return false;
    return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
  }, [pathname]);

  const clearSession = useCallback(() => {
    localStorage.removeItem('userData');
    setUserData(null);
    
    // Clear all session cookies
    document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "sb-client-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "sb-login-time=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "verified=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }, [setUserData]);

  const handleLogout = useCallback(async () => {
    // Don't logout while loading or already logging out or on public routes
    if (logoutInProgress.current || !userData || isPublicRoute() || loading) return;
    
    logoutInProgress.current = true;

    try {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] 🚪 Initiating logout for user: ${userData.email}`);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }

      clearSession();

      // Call logout API to clear server-side cookies
      await fetch('/api/logout', { method: 'POST' }).catch(console.error);

      console.log(`[${timestamp}] ✅ Logout completed successfully`);
      
      // Show alert before redirect
      alert('Your session has expired after 15 minutes of inactivity. Please login again.');
      
      router.replace('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setTimeout(() => {
        logoutInProgress.current = false;
      }, 1000);
    }
  }, [userData, isPublicRoute, router, clearSession, loading]);

  // Check session validity in real-time without page refresh
  const checkSessionValidity = useCallback(async () => {
    if (!userData || isPublicRoute() || loading || logoutInProgress.current) {
      return;
    }

    // Increment and log every 30 seconds
    checkCountRef.current++;
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] 🔍 Session check #${checkCountRef.current} - Validating session for user: ${userData.email}`);

    try {
      // Check if session cookie exists
      const hasAccessToken = document.cookie.includes('sb-access-token=');
      const hasSessionCookie = document.cookie.includes('sb-client-session=true');
      
      if (!hasAccessToken && !hasSessionCookie) {
        console.log(`[${timestamp}] ⚠️ No session cookies found, logging out...`);
        setIsSessionValid(false);
        await handleLogout();
        return;
      }

      console.log(`[${timestamp}] ✅ Session cookies found (access_token: ${hasAccessToken}, client_session: ${hasSessionCookie})`);

      // Verify session with server using the /api/me endpoint which uses your check-auth.ts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/me', {
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          console.log(`[${timestamp}] ❌ Session invalid (401), logging out...`);
          setIsSessionValid(false);
          await handleLogout();
        } else {
          console.log(`[${timestamp}] ⚠️ Session check returned status: ${response.status}`);
        }
      } else {
        const userProfile = await response.json();
        console.log(`[${timestamp}] ✅ Session valid for user: ${userProfile.email}, Tier: ${userProfile.subscription_tier || 'free'}`);
        setIsSessionValid(true);
        // Reset activity timer on successful check
        resetTimer();
      }
    } catch (error) {
      console.error(`[${timestamp}] ❌ Session check error:`, error);
      // Don't logout on network errors, just log
      if (error.name !== 'AbortError') {
        console.log(`[${timestamp}] 🌐 Network error during session check, keeping session`);
      }
    }
  }, [userData, isPublicRoute, loading, handleLogout]);

  const resetTimer = useCallback(() => {
    if (!userData || isPublicRoute() || loading || !isSessionValid) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Store last activity time
    sessionStorage.setItem('lastActivity', Date.now().toString());

    timerRef.current = setTimeout(() => {
      // Check if user was active recently
      const lastActivity = sessionStorage.getItem('lastActivity');
      const now = Date.now();
      
      if (lastActivity && (now - parseInt(lastActivity)) < SESSION_TIMEOUT) {
        // User was active, reset timer again
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ⏰ Timer reset due to recent activity`);
        resetTimer();
      } else {
        // No activity, check session validity
        const timeoutTimestamp = new Date().toLocaleTimeString();
        console.log(`[${timeoutTimestamp}] ⏰ 15-minute inactivity timeout reached, checking session...`);
        checkSessionValidity();
      }
    }, SESSION_TIMEOUT);
  }, [userData, isPublicRoute, loading, isSessionValid, checkSessionValidity]);

  // Track user activity
  useEffect(() => {
    if (!userData || isPublicRoute() || loading) return;

    const updateLastActivity = () => {
      const now = Date.now();
      const timestamp = new Date().toLocaleTimeString();
      sessionStorage.setItem('lastActivity', now.toString());
      console.log(`[${timestamp}] 🖱️ User activity detected (${userData.email}), resetting 15-minute timer`);
      resetTimer();
    };

    const activities = ['mousedown', 'click', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    
    activities.forEach(activity => {
      window.addEventListener(activity, updateLastActivity);
    });

    // Set initial last activity
    updateLastActivity();

    return () => {
      activities.forEach(activity => {
        window.removeEventListener(activity, updateLastActivity);
      });
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [userData, isPublicRoute, resetTimer, loading]);

  // Real-time session monitoring (checks every 30 seconds with logging)
  useEffect(() => {
    if (!userData || isPublicRoute() || loading) return;

    const startTime = new Date().toLocaleTimeString();
    console.log(`[${startTime}] 🚀 Starting session monitoring for user: ${userData.email}`);
    console.log(`[${startTime}] ⏱️  Session timeout: 15 minutes of inactivity`);
    console.log(`[${startTime}] 🔄 Session check interval: 30 seconds`);
    
    // Initial check
    checkSessionValidity();

    // Set up interval for continuous monitoring with logging
    sessionCheckIntervalRef.current = setInterval(() => {
      checkSessionValidity();
    }, SESSION_CHECK_INTERVAL);

    console.log(`[${startTime}] ✅ Session monitoring active`);

    return () => {
      if (sessionCheckIntervalRef.current) {
        const endTime = new Date().toLocaleTimeString();
        console.log(`[${endTime}] 🛑 Session monitoring stopped for user: ${userData?.email}`);
        console.log(`[${endTime}] 📊 Total session checks performed: ${checkCountRef.current}`);
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }
    };
  }, [userData, isPublicRoute, loading, checkSessionValidity]);

  // Handle tab visibility
  useEffect(() => {
    if (!userData || isPublicRoute() || loading) return;

    const handleVisibilityChange = () => {
      const timestamp = new Date().toLocaleTimeString();
      if (document.hidden) {
        console.log(`[${timestamp}] 👁️ Tab hidden - pausing timers for user: ${userData.email}`);
        if (timerRef.current) clearTimeout(timerRef.current);
      } else {
        console.log(`[${timestamp}] 👁️ Tab visible - resuming session checks for user: ${userData.email}`);
        // When tab becomes visible again, check session immediately
        checkSessionValidity();
        resetTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userData, isPublicRoute, resetTimer, loading, checkSessionValidity]);

  // Listen for online/offline events
  useEffect(() => {
    if (!userData || isPublicRoute() || loading) return;

    const handleOnline = () => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] 🟢 Device is back online, checking session for user: ${userData.email}`);
      checkSessionValidity();
    };

    const handleOffline = () => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] 🔴 Device went offline - session checks will resume when online`);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userData, isPublicRoute, loading, checkSessionValidity]);

  // Display warning before logout (optional - shows at 14 minutes)
  useEffect(() => {
    if (!userData || isPublicRoute() || loading) return;

    const warningTime = SESSION_TIMEOUT - 60 * 1000; // 1 minute before timeout
    
    const warningTimer = setTimeout(() => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] ⚠️ WARNING: Session for ${userData.email} will expire in 1 minute due to inactivity`);
      // Optional: Show a toast notification here
    }, warningTime);

    return () => clearTimeout(warningTimer);
  }, [userData, isPublicRoute, loading]);

  // Log session start when user data is loaded
  useEffect(() => {
    if (userData && !loading && !isPublicRoute()) {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] 🎉 Session started for user: ${userData.email}`);
      console.log(`[${timestamp}] 📋 User details - ID: ${userData.id}, Tier: ${userData.subscription_tier || 'free'}`);
    }
  }, [userData, loading, isPublicRoute]);

  return <>{children}</>;
}