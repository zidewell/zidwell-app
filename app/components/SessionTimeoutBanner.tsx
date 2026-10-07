// app/components/SessionTimeoutBanner.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface SessionTimeoutBannerProps {
  /** Seconds remaining until expiry. Pass null to hide the banner. */
  secondsRemaining: number | null;
  /** Called when the user clicks "Stay Logged In". */
  onExtend: () => Promise<void> | void;
  /** Called when the user dismisses the banner. */
  onDismiss?: () => void;
}

export default function SessionTimeoutBanner({
  secondsRemaining,
  onExtend,
  onDismiss,
}: SessionTimeoutBannerProps) {
  const [visible, setVisible] = useState(false);
  const [extending, setExtending] = useState(false);

  useEffect(() => {
    setVisible(secondsRemaining !== null && secondsRemaining > 0);
  }, [secondsRemaining]);

  const handleExtend = useCallback(async () => {
    if (extending) return;
    setExtending(true);
    try {
      await onExtend();
    } finally {
      setExtending(false);
    }
  }, [extending, onExtend]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  if (!visible || secondsRemaining === null) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeLabel =
    minutes > 0
      ? `${minutes}m ${seconds.toString().padStart(2, "0")}s`
      : `${seconds}s`;

  const progressPercent = Math.max(
    0,
    Math.min(100, (secondsRemaining / 60) * 100),
  );

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[100] pointer-events-none"
    >
      <div className="h-0.5 w-full bg-amber-200/40">
        <div
          className="h-full bg-amber-500 transition-[width] duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="pointer-events-auto bg-amber-50 border-b border-amber-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-3">
          <div className="shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="w-4 h-4 text-amber-600" strokeWidth={2} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm text-amber-900 font-medium truncate">
              Session expiring in{" "}
              <span className="tabular-nums font-semibold">{timeLabel}</span>
            </p>
            <p className="text-xs text-amber-700 hidden sm:block">
              Click &quot;Stay Logged In&quot; to keep your session active.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleExtend}
              disabled={extending}
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm h-8 px-3 rounded-md font-medium transition-colors"
            >
              {extending ? "Extending…" : "Stay Logged In"}
            </Button>

            <button
              onClick={handleDismiss}
              aria-label="Dismiss warning"
              className="p-1.5 rounded-md text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}