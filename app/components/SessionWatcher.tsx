// app/components/SessionWatcher.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useUserContextData } from "@/app/context/userData";
import Swal from "sweetalert2";

// ✅ Fix: NODE_ENV is set by Next.js. NEXT_PUBLIC_NODE_ENV is not.
const isProduction = process.env.NODE_ENV === "production";
const SESSION_TIMEOUT = isProduction ? 15 * 60 * 1000 : -1;
const IDLE_WARNING_TIME = 60 * 1000;

const PUBLIC_ROUTE_PATTERNS: RegExp[] = [
  /^\/$/,
  /^\/auth(\/.*)?$/,
  /^\/pricing(\/.*)?$/,
  /^\/about(\/.*)?$/,
  /^\/contact(\/.*)?$/,
  /^\/privacy(\/.*)?$/,
  /^\/terms(\/.*)?$/,
  /^\/blog(\/.*)?$/,
  /^\/store\/[^\/]+$/,
  /^\/store\/[^\/]+\/[^\/]+$/,
  /^\/pay\/[^\/]+$/,
  /^\/payment-page\/status/,
  /^\/payment\/callback/,
  /^\/payment-page-success/,
];

function safeSwalFire(options: any): Promise<any> {
  try {
    const result = (Swal as any).fire(options);
    if (result && typeof result.then === "function") return result;
    return Promise.resolve(result);
  } catch (err) {
    console.error("Swal.fire threw synchronously:", err);
    return Promise.resolve(undefined);
  }
}

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
  const extendTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutInProgress = useRef(false);
  const networkErrorCount = useRef(0);
  const maxNetworkErrors = 3;

  const scheduleExtend = useCallback(() => {
    if (extendTimerRef.current) clearTimeout(extendTimerRef.current);
    extendTimerRef.current = setTimeout(async () => {
      try {
        await fetch("/api/auth/extend-session", {
          method: "POST",
          credentials: "include",
        });
      } catch (e) {
        console.warn("Session extend failed:", e);
      }
    }, 2000);
  }, []);

  const resolvePath = useCallback((): string => {
    if (pathname) return pathname;
    if (typeof window !== "undefined") return window.location.pathname;
    return "";
  }, [pathname]);

  const isPublicRoute = useCallback((): boolean => {
    const path = resolvePath();
    if (!path) return false;
    return PUBLIC_ROUTE_PATTERNS.some((re) => re.test(path));
  }, [resolvePath]);

  const canCheckSession = useCallback((): boolean => {
    return (
      !!userData && !isPublicRoute() && !loading && !logoutInProgress.current
    );
  }, [userData, isPublicRoute, loading]);

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

  const handleLogout = useCallback(
    async (
      reason: string = "Session expired",
      showAlert: boolean = true,
      isNetworkError: boolean = false,
    ) => {
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
            await safeSwalFire({
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
    [userData, isPublicRoute, loading, handleSessionExpired, resetTimer],
  );

  const showIdleWarning = useCallback(() => {
    if (idleWarningShown || !isProduction || isPublicRoute()) return;
    setIdleWarningShown(true);

    safeSwalFire({
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
      .then((result: any) => {
        setIdleWarningShown(false);
        if (result?.isConfirmed) {
          resetTimer();
          safeSwalFire({
            icon: "success",
            title: "Session Extended",
            text: "Your session has been extended.",
            timer: 2000,
            showConfirmButton: false,
          });
        } else if (result?.isDismissed) {
          handleLogout("Session expired due to inactivity", false);
        }
      })
      .catch(() => {
        setIdleWarningShown(false);
      });
  }, [idleWarningShown, handleLogout, isPublicRoute, resetTimer]);

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
  }, [canCheckSession, isOnline, isPublicRoute, handleLogout, resetTimer]);

  // ─── Online / offline ───
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

  // ─── Activity listeners ───
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
    const handleActivity = () => {
      updateActivity();
      scheduleExtend();
    };

    events.forEach((event) =>
      window.addEventListener(event, handleActivity, { passive: true }),
    );

    updateActivity();
    scheduleExtend();

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity),
      );
      if (extendTimerRef.current) clearTimeout(extendTimerRef.current);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
    };
  }, [canCheckSession, resetTimer, scheduleExtend]);

  // ─── Visibility change ───
  useEffect(() => {
    if (!canCheckSession()) return;
    if (SESSION_TIMEOUT === -1) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkSession();
        scheduleExtend();
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
      if (extendTimerRef.current) clearTimeout(extendTimerRef.current);
    };
  }, [canCheckSession, checkSession, scheduleExtend]);

  // ─── Initial check ───
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