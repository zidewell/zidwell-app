// app/components/SessionWatcher.tsx

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserContextData } from "@/app/context/userData";
import Swal from "sweetalert2";

// ─── Session configuration ───
const SESSION_TIMEOUT =
  process.env.NEXT_PUBLIC_NODE_ENV === "production"
    ? 15 * 60 * 1000 // 15 minutes in production
    : -1; // Disabled in development

const IDLE_WARNING_TIME = 60 * 1000; // Warn 1 minute before timeout

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

export default function SessionWatcher({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { userData, loading, handleSessionExpired } = useUserContextData();

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
    return PUBLIC_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );
  }, [pathname]);

  // ─── Monitor online/offline status ───
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log("🌐 Network back online");
      // Check session when back online
      if (userData && !isPublicRoute()) {
        checkSession();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log("🌐 Network offline - session check paused");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [userData]);

  // ─── ✅ handleLogout now delegates to handleSessionExpired ───
  // The context's handleSessionExpired does:
  //   1. await /api/logout  (server clears httpOnly cookies)
  //   2. clear client cookies + storage
  //   3. reset context state
  //   4. navigate to /auth/login
  // This component only handles: guards, timers, and UI toasts.
  const handleLogout = useCallback(
    async (
      reason: string = "Session expired",
      showAlert: boolean = true,
      isNetworkError: boolean = false
    ) => {
      // Don't logout on network errors unless we've had too many
      if (isNetworkError) {
        networkErrorCount.current += 1;
        console.log(
          `🌐 Network error ${networkErrorCount.current}/${maxNetworkErrors}`
        );

        if (networkErrorCount.current < maxNetworkErrors) {
          resetTimer();
          return;
        }

        console.log("🌐 Too many network errors, logging out");
      }

      if (
        logoutInProgress.current ||
        !userData ||
        isPublicRoute() ||
        loading
      ) {
        return;
      }

      logoutInProgress.current = true;

      try {
        // Clear timers first
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        if (warningTimerRef.current) {
          clearTimeout(warningTimerRef.current);
          warningTimerRef.current = null;
        }

        // Show alert before teardown if needed (only for non-generic reasons)
        if (showAlert && reason !== "Session expired" && !isNetworkError) {
          await Swal.fire({
            icon: "warning",
            title: "Session Ended",
            text: reason,
            confirmButtonColor: "var(--color-accent-yellow)",
          });
        }

        setSessionExpired(true);

        // ✅ Delegate to context — handles API + cookies + state + navigation
        await handleSessionExpired();
      } catch (error) {
        console.error("Logout error:", error);
      } finally {
        setTimeout(() => {
          logoutInProgress.current = false;
        }, 1000);
      }
    },
    [userData, isPublicRoute, loading, handleSessionExpired]
  );

  // ─── Show idle warning ───
  const showIdleWarning = useCallback(() => {
    if (idleWarningShown || isDev) return;

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
    }).then((result) => {
      setIdleWarningShown(false);

      if (result.isConfirmed) {
        resetTimer();
        Swal.fire({
          icon: "success",
          title: "Session Extended",
          text: "Your session has been extended.",
          timer: 2000,
          showConfirmButton: false,
        });
      } else if (result.isDismissed) {
        handleLogout("Session expired due to inactivity", false);
      }
    });
  }, [idleWarningShown, handleLogout, isDev]);

  // ─── Reset the session timer ───
  const resetTimer = useCallback(() => {
    if (SESSION_TIMEOUT === -1) return;
    if (!userData || isPublicRoute() || loading) return;

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
  }, [userData, isPublicRoute, loading, showIdleWarning]);

  // ─── Check session validity with the server ───
  const checkSession = useCallback(async () => {
    if (!userData || isPublicRoute() || loading || logoutInProgress.current)
      return;

    if (!isOnline) {
      console.log("🌐 Offline - skipping session check");
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("/api/auth/validate-session", {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
          await handleLogout(data.reason || "Session invalid", true, false);
        }
        return;
      }

      const data = await response.json();

      if (!data.valid) {
        await handleLogout("Session expired", true, false);
        return;
      }

      networkErrorCount.current = 0;
      resetTimer();
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("⏱️ Session check timed out - network may be slow");
      } else if (
        error.name === "TypeError" ||
        error.message?.includes("fetch")
      ) {
        console.log("🌐 Network error during session check - will retry");
        setTimeout(() => {
          if (!logoutInProgress.current) {
            checkSession();
          }
        }, 30000);
      } else {
        console.error("Session check error:", error);
        setTimeout(() => {
          if (!logoutInProgress.current) {
            checkSession();
          }
        }, 30000);
      }
    }
  }, [
    userData,
    isPublicRoute,
    loading,
    handleLogout,
    resetTimer,
    isOnline,
  ]);

  // ─── Update last activity on user interaction ───
  useEffect(() => {
    if (!userData || isPublicRoute() || loading) return;
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
    events.forEach((event) => window.addEventListener(event, updateActivity));

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
  }, [userData, isPublicRoute, resetTimer, loading]);

  // ─── Check session when tab becomes visible ───
  useEffect(() => {
    if (!userData || isPublicRoute() || loading) return;
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
  }, [userData, isPublicRoute, loading, checkSession]);

  // ─── Initial check when user data loads ───
  useEffect(() => {
    if (userData && !isPublicRoute() && !loading && isOnline) {
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