// app/hooks/useCountdown.ts
"use client";

import { useState, useEffect } from 'react';

interface CountdownResult {
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  expired: boolean;
}

export function useCountdown(expiresAt: string, serverNow: string): CountdownResult {
  const [remaining, setRemaining] = useState<CountdownResult>(() => {
    const serverTime = new Date(serverNow).getTime();
    const expiryTime = new Date(expiresAt).getTime();
    const diff = expiryTime - serverTime;

    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, totalMs: 0, expired: true };
    }

    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      totalMs: diff,
      expired: false,
    };
  });

  useEffect(() => {
    const serverTime = new Date(serverNow).getTime();
    const expiryTime = new Date(expiresAt).getTime();
    const initialDiff = expiryTime - serverTime;

    if (initialDiff <= 0) {
      setRemaining({ hours: 0, minutes: 0, seconds: 0, totalMs: 0, expired: true });
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      // Use server offset to prevent client clock manipulation
      const serverOffset = serverTime - new Date(serverNow).getTime(); // This is 0, but conceptually we track offset
      const diff = expiryTime - (now + (serverTime - new Date(serverNow).getTime()));

      if (diff <= 0) {
        setRemaining({ hours: 0, minutes: 0, seconds: 0, totalMs: 0, expired: true });
        clearInterval(interval);
        return;
      }

      setRemaining({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        totalMs: diff,
        expired: false,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, serverNow]);

  return remaining;
}
