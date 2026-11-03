// app/components/SessionWatcher.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useUserContextData } from "@/app/context/userData";
import SessionTimeoutBanner from "./SessionTimeoutBanner";
import {
  SESSION_TIMEOUT_MS,
  WARNING_THRESHOLD_MS,
  SESSION_TIMEOUT_DISABLED,
} from "@/lib/session-config";

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
  /^\/admin(\/.*)?$/, // ← Skip SessionWatcher on admin routes entirely
];

const ACTIVITY_EVENTS = [
  "mousedown",
  "keydown",
  "touchstart",
  "pointerdown",
] as const;

// Minimum ms between extend-session calls (prevents spam)
const EXTEND_THROTTLE_MS = 30 * 1000;

export default function SessionWatcher({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { userData, loading, handleSessionExpired } = useUserContextData();

  const sessionExpiredRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const extendTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastExtendAtRef = useRef<number>(0); // ← throttle guard
  const logoutInProgress = useRef(false);
  const [isOnline, setIsOnline] = useState(true);

  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [warningDismissed, setWarningDismissed] = useState(false);

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

  // ─── Throttled extend-session call ───
  const throttledExtend = useCallback(async () => {
    const now = Date.now();
    if (now - lastExtendAtRef.current < EXTEND_THROTTLE_MS) {
      return; // too soon, skip
    }
    lastExtendAtRef.current = now;
    try {
      await fetch("/api/auth/extend-session", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Non-fatal.
    }
  }, []);

  // ─── Redirect to /auth/session-timeout ───
  const redirectToTimeout = useCallback(
    async (reason: "idle" | "invalidated" = "idle") => {
      if (logoutInProgress.current) return;
      logoutInProgress.current = true;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (extendTimerRef.current) {
        clearTimeout(extendTimerRef.current);
        extendTimerRef.current = null;
      }

      const current = resolvePath();
      const callback = current && !isPublicRoute() ? current : "/dashboard";

      await handleSessionExpired(
        `/auth/session-timeout?callbackUrl=${encodeURIComponent(
          callback,
        )}&reason=${reason}`,
      );
    },
    [resolvePath, isPublicRoute, handleSessionExpired],
  );

  // ─── Banner countdown ───
  const startWarningCountdown = useCallback(() => {
    setWarningDismissed(false);

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    const stored = sessionStorage.getItem("lastActivity");
    const now = Date.now();
    const last = stored ? parseInt(stored, 10) : now;
    const expiresAt = last + SESSION_TIMEOUT_MS;

    const tick = () => {
      const remaining = Math.max(0, expiresAt - Date.now());
      setSecondsRemaining(Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setSecondsRemaining(null);
      }
    };

    tick();
    countdownIntervalRef.current = setInterval(tick, 1000);
  }, []);

  const stopWarningCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setSecondsRemaining(null);
    setWarningDismissed(false);
  }, []);

  const scheduleExpiry = useCallback(
    (delayMs: number) => {
      if (SESSION_TIMEOUT_DISABLED) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

      const warningDelay = Math.max(0, delayMs - WARNING_THRESHOLD_MS);
      warningTimerRef.current = setTimeout(() => {
        if (!sessionExpiredRef.current) startWarningCountdown();
      }, warningDelay);

      timerRef.current = setTimeout(() => {
        sessionExpiredRef.current = true;
        stopWarningCountdown();
        redirectToTimeout("idle");
      }, delayMs);
    },
    [redirectToTimeout, startWarningCountdown, stopWarningCountdown],
  );

  const handleExtendFromBanner = useCallback(async () => {
    const now = Date.now();
    try {
      sessionStorage.setItem("lastActivity", now.toString());
    } catch {
      // ignore
    }
    await throttledExtend();
    stopWarningCountdown();
    scheduleExpiry(SESSION_TIMEOUT_MS);
  }, [scheduleExpiry, stopWarningCountdown, throttledExtend]);

  const handleDismissWarning = useCallback(() => {
    setWarningDismissed(true);
  }, []);

  const onActivity = useCallback(() => {
    if (!canCheckSession()) return;

    if (sessionExpiredRef.current) {
      redirectToTimeout("idle");
      return;
    }

    stopWarningCountdown();

    try {
      sessionStorage.setItem("lastActivity", Date.now().toString());
    } catch {
      // ignore
    }

    scheduleExpiry(SESSION_TIMEOUT_MS);

    // Throttled extend (5s after activity, but throttled to 30s minimum)
    if (extendTimerRef.current) clearTimeout(extendTimerRef.current);
    extendTimerRef.current = setTimeout(async () => {
      if (sessionExpiredRef.current) return;
      await throttledExtend();
    }, 5000);
  }, [
    canCheckSession,
    redirectToTimeout,
    scheduleExpiry,
    stopWarningCountdown,
    throttledExtend,
  ]);

  // ─── Register activity listeners ───
  useEffect(() => {
    if (SESSION_TIMEOUT_DISABLED) return;
    if (!canCheckSession()) return;

    const stored = sessionStorage.getItem("lastActivity");
    const now = Date.now();
    const last = stored ? parseInt(stored, 10) : now;
    const elapsed = now - last;
    const remaining = Math.max(0, SESSION_TIMEOUT_MS - elapsed);

    sessionStorage.setItem("lastActivity", now.toString());

    if (remaining === 0) {
      scheduleExpiry(SESSION_TIMEOUT_MS);
    } else {
      scheduleExpiry(remaining);
    }

    // ═══════════════════════════════════════════════════
    // 🚨 REMOVED: immediate extend-session fetch on mount
    // This was the primary Fast Refresh loop trigger.
    // ═══════════════════════════════════════════════════
    // void fetch("/api/auth/extend-session", { ... });

    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, onActivity, {
        passive: true,
        capture: true,
      }),
    );

    return () => {
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, onActivity, { capture: true }),
      );
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (extendTimerRef.current) clearTimeout(extendTimerRef.current);
    };
  }, [canCheckSession, onActivity, scheduleExpiry]);

  // ─── Capture-phase interceptor ───
  useEffect(() => {
    if (SESSION_TIMEOUT_DISABLED) return;
    if (!canCheckSession()) return;

    const interceptor = (e: Event) => {
      if (!sessionExpiredRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      (e as any).stopImmediatePropagation?.();
      redirectToTimeout("idle");
    };

    const events = ["click", "submit", "keydown", "pointerdown"] as const;

    events.forEach((evt) =>
      document.addEventListener(evt, interceptor, {
        capture: true,
        passive: false,
      }),
    );

    return () => {
      events.forEach((evt) =>
        document.removeEventListener(evt, interceptor, { capture: true }),
      );
    };
  }, [canCheckSession, redirectToTimeout]);

  // ─── Online / offline ───
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ─── Visibility change ───
  useEffect(() => {
    if (SESSION_TIMEOUT_DISABLED) return;
    if (!canCheckSession()) return;

    const handleVisibility = () => {
      if (document.hidden) return;

      const stored = sessionStorage.getItem("lastActivity");
      const now = Date.now();
      const last = stored ? parseInt(stored, 10) : now;
      const elapsed = now - last;

      if (elapsed >= SESSION_TIMEOUT_MS) {
        sessionExpiredRef.current = true;
        redirectToTimeout("idle");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [canCheckSession, redirectToTimeout]);

  // ─── Server-side validation heartbeat ───
  useEffect(() => {
    if (SESSION_TIMEOUT_DISABLED) return;
    if (!canCheckSession()) return;

    // ═══════════════════════════════════════════════════
    // 🚨 DISABLED in dev to prevent Fast Refresh loop
    // ═══════════════════════════════════════════════════
    if (process.env.NODE_ENV === "development") {
      return;
    }

    const interval = setInterval(
      async () => {
        if (document.hidden) return;
        if (sessionExpiredRef.current) return;

        try {
          const res = await fetch("/api/auth/validate-session", {
            credentials: "include",
            headers: { "Cache-Control": "no-cache" },
          });
          const data = await res.json().catch(() => ({ valid: false }));

          if (!data.valid && !isPublicRoute()) {
            console.warn(
              "[session] validate-session returned invalid:",
              data.reason,
            );
            sessionExpiredRef.current = true;
            redirectToTimeout(
              data.reason === "session_id_mismatch"
                ? "invalidated"
                : "idle",
            );
          }
        } catch {
          // Network error — do not log out.
        }
      },
      5 * 60 * 1000, // ← increased from 2 min to 5 min
    );

    return () => clearInterval(interval);
  }, [canCheckSession, isPublicRoute, redirectToTimeout]);

  return (
    <>
      {!warningDismissed && secondsRemaining !== null && (
        <SessionTimeoutBanner
          secondsRemaining={secondsRemaining}
          onExtend={handleExtendFromBanner}
          onDismiss={handleDismissWarning}
        />
      )}
      {children}
    </>
  );
}