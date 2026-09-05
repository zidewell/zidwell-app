// app/components/SessionWatcher.tsx

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserContextData } from "@/app/context/userData";
import Swal from "sweetalert2";

// Session configuration
const SESSION_TIMEOUT = process.env.NEXT_PUBLIC_NODE_ENV === "production" 
  ? 15 * 60 * 1000  // 15 minutes in production
  : -1; // Disabled in development

const IDLE_WARNING_TIME = 60 * 1000; // Show warning 1 minute before timeout

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

export default function SessionWatcher({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userData, loading, setUserData } = useUserContextData();
  
  const [sessionExpired, setSessionExpired] = useState(false);
  const [idleWarningShown, setIdleWarningShown] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutInProgress = useRef(false);
  const isDev = process.env.NEXT_PUBLIC_NODE_ENV !== "production";
  const networkErrorCount = useRef(0);
  const maxNetworkErrors = 3; // Allow 3 network errors before logging out

  const isPublicRoute = useCallback(() => {
    if (!pathname) return false;
    return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
  }, [pathname]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🌐 Network back online');
      // Check session when back online
      if (userData && !isPublicRoute()) {
        checkSession();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('🌐 Network offline - session check paused');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userData]);

  // Clear all session data
  const clearSession = useCallback(() => {
    localStorage.removeItem('userData');
    localStorage.removeItem('zidwell_store_data');
    localStorage.removeItem('zidwell_store_timestamp');
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('lastActivity');
    
    const cookiesToClear = [
      "sb-access-token",
      "sb-refresh-token",
      "sb-client-session",
      "sb-login-time",
      "sb-session-risk",
      "sb-user-data",
      "sb-session-id",
      "verified"
    ];
    
    cookiesToClear.forEach(name => {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    });
    
    setUserData(null);
  }, [setUserData]);

  // Handle logout - only if not a network error
  const handleLogout = useCallback(async (reason: string = 'Session expired', showAlert: boolean = true, isNetworkError: boolean = false) => {
    // Don't logout on network errors unless we've had too many
    if (isNetworkError) {
      networkErrorCount.current += 1;
      console.log(`🌐 Network error ${networkErrorCount.current}/${maxNetworkErrors}`);
      
      if (networkErrorCount.current < maxNetworkErrors) {
        // Reset timer and try again later
        resetTimer();
        return;
      }
      
      // Too many network errors, treat as session expired
      console.log('🌐 Too many network errors, logging out');
    }

    if (logoutInProgress.current || !userData || isPublicRoute() || loading) return;
    
    logoutInProgress.current = true;

    try {
      // Clear timers
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }

      // Clear session data
      clearSession();

      // Call logout API (fire and forget)
      fetch('/api/logout', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => {});

      // Show alert if needed
      if (showAlert && reason !== 'Session expired' && !isNetworkError) {
        await Swal.fire({
          icon: 'warning',
          title: 'Session Ended',
          text: reason,
          confirmButtonColor: 'var(--color-accent-yellow)',
        });
      }

      setSessionExpired(true);
      router.replace('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setTimeout(() => {
        logoutInProgress.current = false;
      }, 1000);
    }
  }, [userData, isPublicRoute, router, clearSession, loading]);

  // Show idle warning
  const showIdleWarning = useCallback(() => {
    if (idleWarningShown || isDev) return;
    
    setIdleWarningShown(true);
    
    Swal.fire({
      icon: 'warning',
      title: 'Session Expiring Soon',
      html: `
        <p>Your session will expire in <strong>1 minute</strong> due to inactivity.</p>
        <p style="font-size: 0.9em; color: #666; margin-top: 10px;">
          Click "Stay Logged In" to continue your session.
        </p>
      `,
      showCancelButton: true,
      confirmButtonColor: 'var(--color-accent-yellow)',
      cancelButtonColor: '#6b6b6b',
      confirmButtonText: 'Stay Logged In',
      cancelButtonText: 'Logout Now',
      timer: 60000,
      timerProgressBar: true,
      allowOutsideClick: false,
    }).then((result) => {
      setIdleWarningShown(false);
      
      if (result.isConfirmed) {
        // User wants to stay logged in - reset timer
        resetTimer();
        Swal.fire({
          icon: 'success',
          title: 'Session Extended',
          text: 'Your session has been extended.',
          timer: 2000,
          showConfirmButton: false,
        });
      } else if (result.isDismissed) {
        // User dismissed - logout
        handleLogout('Session expired due to inactivity', false);
      }
    });
  }, [idleWarningShown, handleLogout, isDev]);

  // Reset the session timer
  const resetTimer = useCallback(() => {
    // Don't set timer in development
    if (SESSION_TIMEOUT === -1) return;
    
    // Don't set timer if no user or on public routes
    if (!userData || isPublicRoute() || loading) return;

    // Clear existing timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }

    // Update last activity
    sessionStorage.setItem('lastActivity', Date.now().toString());

    // Reset network error count on activity
    networkErrorCount.current = 0;

    // Set warning timer (1 minute before timeout)
    if (SESSION_TIMEOUT > IDLE_WARNING_TIME) {
      warningTimerRef.current = setTimeout(() => {
        const lastActivity = sessionStorage.getItem('lastActivity');
        const now = Date.now();
        
        if (lastActivity && (now - parseInt(lastActivity)) < SESSION_TIMEOUT) {
          showIdleWarning();
        }
      }, SESSION_TIMEOUT - IDLE_WARNING_TIME);
    }

    // Set main timer
    timerRef.current = setTimeout(() => {
      const lastActivity = sessionStorage.getItem('lastActivity');
      const now = Date.now();
      
      if (lastActivity && (now - parseInt(lastActivity)) < SESSION_TIMEOUT) {
        // User was active, reset timer
        resetTimer();
      } else {
        // User was inactive, check session
        checkSession();
      }
    }, SESSION_TIMEOUT);
  }, [userData, isPublicRoute, loading, showIdleWarning]);

  // Check session validity with the server - handles network errors gracefully
  const checkSession = useCallback(async () => {
    if (!userData || isPublicRoute() || loading || logoutInProgress.current) return;

    // Don't check if offline
    if (!isOnline) {
      console.log('🌐 Offline - skipping session check');
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('/api/auth/validate-session', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        // Only logout if it's a real session issue, not a network error
        if (response.status === 401 || response.status === 403) {
          await handleLogout(data.reason || 'Session invalid', true, false);
        }
        return;
      }

      const data = await response.json();
      
      if (!data.valid) {
        await handleLogout('Session expired', true, false);
        return;
      }

      // Reset network error count on successful check
      networkErrorCount.current = 0;

      // Reset timer on successful check
      resetTimer();
      
    } catch (error: any) {
      // Handle different types of errors
      if (error.name === 'AbortError') {
        console.log('⏱️ Session check timed out - network may be slow');
        // Don't logout, just retry later
      } else if (error.name === 'TypeError' || error.message?.includes('fetch')) {
        // Network error - don't logout
        console.log('🌐 Network error during session check - will retry');
        // Try again in 30 seconds
        setTimeout(() => {
          if (!logoutInProgress.current) {
            checkSession();
          }
        }, 30000);
      } else {
        console.error('Session check error:', error);
        // Don't logout on other errors either - just retry
        setTimeout(() => {
          if (!logoutInProgress.current) {
            checkSession();
          }
        }, 30000);
      }
    }
  }, [userData, isPublicRoute, loading, handleLogout, resetTimer, isOnline]);

  // Update last activity on user interaction
  useEffect(() => {
    if (!userData || isPublicRoute() || loading) return;
    if (SESSION_TIMEOUT === -1) return;

    const updateActivity = () => {
      sessionStorage.setItem('lastActivity', Date.now().toString());
      resetTimer();
    };

    const events = ['mousedown', 'click', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(event => window.addEventListener(event, updateActivity));
    
    updateActivity();

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
    };
  }, [userData, isPublicRoute, resetTimer, loading]);

  // Check session when tab becomes visible
  useEffect(() => {
    if (!userData || isPublicRoute() || loading) return;
    if (SESSION_TIMEOUT === -1) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible - check session
        checkSession();
      } else {
        // Tab hidden - clear timers
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        if (warningTimerRef.current) {
          clearTimeout(warningTimerRef.current);
          warningTimerRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userData, isPublicRoute, loading, checkSession]);

  // Initial check when user data loads
  useEffect(() => {
    if (userData && !isPublicRoute() && !loading && isOnline) {
      // Delay initial check to avoid race conditions
      const timer = setTimeout(() => {
        checkSession();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [userData, isPublicRoute, loading, checkSession, isOnline]);

  // Don't render anything if session expired
  if (sessionExpired && !isPublicRoute()) {
    return null;
  }

  return <>{children}</>;
}