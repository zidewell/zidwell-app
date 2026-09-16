// app/components/SessionWatcher.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useUserContextData } from "@/app/context/userData";
import Swal from "sweetalert2";

const SESSION_TIMEOUT =
  process.env.NEXT_PUBLIC_NODE_ENV === "production"
    ? 15 * 60 * 1000
    : 15 * 60 * 1000;

const IDLE_WARNING_TIME = 60 * 1000;

// Public route patterns — session watcher must NEVER run on these.
const PUBLIC_ROUTE_PATTERNS: RegExp[] = [
  /^\/$/,
  /^\/auth(\/.*)?$/,
  /^\/pricing(\/.*)?$/,
  /^\/about(\/.*)?$/,
  /^\/contact(\/.*)?$/,
  /^\/privacy(\/.*)?$/,
  /^\/terms(\/.*)?$/,
  /^\/blog(\/.*)?$/,
  /^\/blog\/admin(\/.*)?$/,
  /^\/blog\/admin\/login(\/.*)?$/,
  // Public storefronts
  /^\/store\/[^\/]+$/,
  /^\/store\/[^\/]+\/[^\/]+$/,
  // Public payment pages
  /^\/pay\/[^\/]+$/,
  /^\/payment-page\/status/,
  /^\/payment\/callback/,
  /^\/payment-page-success/,
];

export default function SessionWatcher({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { userData, loading, handleSessionExpired } = useUserContextData();

  const [sessionExpired, setSessionExpired] = useState(false);
  const [idleWarningShown, setIdleWarningShown] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutInProgress = useRef(false);
  const networkErrorCount = useRef(0);
  const maxNetworkErrors = 3;

  // ─────────────────────────────────────────────────────────────────────
  // 1. PATH RESOLUTION
  // ─────────────────────────────────────────────────────────────────────
  const resolvePath = useCallback((): string => {
    if (pathname) return pathname;
    if (typeof window !== "undefined") return window.location.pathname;
    return "";
  }, [pathname]);

  // ─────────────────────────────────────────────────────────────────────
  // 2. PUBLIC ROUTE DETECTION
  // ─────────────────────────────────────────────────────────────────────
  const isPublicRoute = useCallback((): boolean => {
    const path = resolvePath();
    if (!path) return false;
    return PUBLIC_ROUTE_PATTERNS.some((re) => re.test(path));
  }, [resolvePath]);

  // ─────────────────────────────────────────────────────────────────────
  // 3. SESSION CHECK GATE
  // ─────────────────────────────────────────────────────────────────────
  const canCheckSession = useCallback((): boolean => {
    return (
      !!userData && !isPublicRoute() && !loading && !logoutInProgress.current
    );
  }, [userData, isPublicRoute, loading]);

  // ─────────────────────────────────────────────────────────────────────
  // 4. RESET TIMER
  // Must be declared BEFORE handleLogout, showIdleWarning, checkSession,
  // because they all reference it.
  // ─────────────────────────────────────────────────────────────────────
  const resetTimer = useCallback(() => {
    if (SESSION_TIMEOUT === -1) return;
    if (!canCheckSession()) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }

    sessionStorage.setItem("lastActivity", Date.now().toString());
    networkErrorCount.current = 0;

    if (SESSION_TIMEOUT > IDLE_WARNING_TIME) {
      warningTimerRef.current = setTimeout(() => {
        const lastActivity = sessionStorage.getItem("lastActivity");
        const now = Date.now();
        if (lastActivity && now - parseInt(lastActivity) < SESSION_TIMEOUT) {
          showIdleWarning();
        }
      }, SESSION_TIMEOUT - IDLE_WARNING_TIME);
    }

    timerRef.current = setTimeout(() => {
      const lastActivity = sessionStorage.getItem("lastActivity");
      const now = Date.now();
      if (lastActivity && now - parseInt(lastActivity) < SESSION_TIMEOUT) {
        resetTimer();
      } else {
        checkSession();
      }
    }, SESSION_TIMEOUT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canCheckSession]);

  // ─────────────────────────────────────────────────────────────────────
  // 5. HANDLE LOGOUT
  // Depends on: resetTimer, isPublicRoute, userData, loading,
  //             handleSessionExpired
  // ─────────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(
    async (
      reason: string = "Session expired",
      showAlert: boolean = true,
      isNetworkError: boolean = false
    ) => {
      // Never log out from a public route
      if (isPublicRoute()) return;

      if (isNetworkError) {
        networkErrorCount.current += 1;
        if (networkErrorCount.current < maxNetworkErrors) {
          resetTimer();
          return;
        }
      }

      if (logoutInProgress.current || !userData || loading) return;

      logoutInProgress.current = true;

      try {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        if (warningTimerRef.current) {
          clearTimeout(warningTimerRef.current);
          warningTimerRef.current = null;
        }

        if (showAlert && reason !== "Session expired" && !isNetworkError) {
          try {
            await Swal.fire({
              icon: "warning",
              title: "Session Ended",
              text: reason,
              confirmButtonColor: "var(--color-accent-yellow)",
            });
          } catch (err) {
            console.warn("Swal warning failed:", err);
          }
        }

        setSessionExpired(true);
        await handleSessionExpired();
      } catch (error) {
        console.error("Logout error:", error);
      } finally {
        setTimeout(() => {
          logoutInProgress.current = false;
        }, 1000);
      }
    },
    [userData, isPublicRoute, loading, handleSessionExpired, resetTimer]
  );

  // ─────────────────────────────────────────────────────────────────────
  // 6. IDLE WARNING
  // Depends on: handleLogout, resetTimer
  // ─────────────────────────────────────────────────────────────────────
  const showIdleWarning = useCallback(() => {
    if (idleWarningShown || isPublicRoute()) return;

    setIdleWarningShown(true);

    Swal.fire({
      icon: "warning",
      title: "Session Expiring Soon",
      html: `
        <p>Your session will expire in <strong>1 minute</strong> due to inactivity.</p>
        <p style="font-size: 0.9em; color: #666; margin-top: 10px;">
          Click "Stay Logged In" to continue your session.
        </p>
      `,
      showCancelButton: true,
      confirmButtonColor: "var(--color-accent-yellow)",
      cancelButtonColor: "#6b6b6b",
      confirmButtonText: "Stay Logged In",
      cancelButtonText: "Logout Now",
      timer: 60000,
      timerProgressBar: true,
      allowOutsideClick: false,
    })
      .then((result) => {
        setIdleWarningShown(false);

        if (result.isConfirmed) {
          resetTimer();
          Swal.fire({
            icon: "success",
            title: "Session Extended",
            text: "Your session has been extended.",
            timer: 2000,
            showConfirmButton: false,
          }).catch(() => {
            /* noop */
          });
        } else if (result.isDismissed) {
          handleLogout("Session expired due to inactivity", false);
        }
      })
      .catch(() => {
        // Swal may fail under Turbopack — don't crash the watcher
        setIdleWarningShown(false);
      });
  }, [idleWarningShown, handleLogout, isPublicRoute, resetTimer]);

  // ─────────────────────────────────────────────────────────────────────
  // 7. CHECK SESSION
  // Depends on: handleLogout, resetTimer
  // ─────────────────────────────────────────────────────────────────────
  const checkSession = useCallback(async () => {
    if (!canCheckSession()) return;
    if (!isOnline) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("/api/auth/validate-session", {
        credentials: "include",
        headers: { "Cache-Control": "no-cache" },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({ valid: false }));

      if (!data.valid && !isPublicRoute()) {
        await handleLogout(data.reason || "Session expired", true, false);
        return;
      }

      networkErrorCount.current = 0;
      resetTimer();
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("⏱️ Session check timed out");
      } else {
        console.log("🌐 Network error during session check — will retry");
        setTimeout(() => {
          if (canCheckSession()) checkSession();
        }, 30000);
      }
    }
  }, [
    canCheckSession,
    isOnline,
    isPublicRoute,
    handleLogout,
    resetTimer,
  ]);

  // ─────────────────────────────────────────────────────────────────────
  // 8. ONLINE / OFFLINE
  // ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (canCheckSession()) checkSession();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [canCheckSession, checkSession]);

  // ─────────────────────────────────────────────────────────────────────
  // 9. ACTIVITY LISTENERS
  // ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canCheckSession()) return;
    if (SESSION_TIMEOUT === -1) return;

    const updateActivity = () => {
      sessionStorage.setItem("lastActivity", Date.now().toString());
      resetTimer();
    };

    const events = [
      "mousedown",
      "click",
      "keydown",
      "scroll",
      "touchstart",
      "mousemove",
    ];
    events.forEach((event) =>
      window.addEventListener(event, updateActivity, { passive: true })
    );

    updateActivity();

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, updateActivity)
      );
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
    };
  }, [canCheckSession, resetTimer]);

  // ─────────────────────────────────────────────────────────────────────
  // 10. VISIBILITY (bfcache-safe)
  // ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canCheckSession()) return;
    if (SESSION_TIMEOUT === -1) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkSession();
      } else {
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

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [canCheckSession, checkSession]);

  // ─────────────────────────────────────────────────────────────────────
  // 11. INITIAL CHECK
  // ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (canCheckSession() && isOnline) {
      const timer = setTimeout(() => {
        checkSession();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [canCheckSession, checkSession, isOnline]);

  if (sessionExpired && !isPublicRoute()) {
    return null;
  }

  return <>{children}</>;
}