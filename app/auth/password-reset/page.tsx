// app/auth/password-reset/page.tsx
"use client";

import React, { FormEvent, useState, useEffect, useCallback } from "react";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

const STORAGE_KEY = "password_reset_cooldown";

interface StoredCooldown {
  email: string;
  endsAt: number; // Unix ms
  reason?: string;
}

export default function PasswordReset() {
  const [email, setEmail] = useState<string>("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(false);

  // Cooldown state
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [cooldownReason, setCooldownReason] = useState<string>("");
  const [cooldownEmail, setCooldownEmail] = useState<string>("");

  const router = useRouter();

  // ═══════════════════════════════════════════════════════════════
  // Load cooldown from localStorage on mount
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: StoredCooldown = JSON.parse(stored);
        const now = Date.now();
        if (data.endsAt > now) {
          const remaining = Math.ceil((data.endsAt - now) / 1000);
          setCooldownSeconds(remaining);
          setCooldownEmail(data.email);
          setCooldownReason(data.reason || "");
          // Pre-fill email so user knows which one is locked
          setEmail(data.email);
        } else {
          // Expired — clean up
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error("Failed to read cooldown from localStorage:", e);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // Persist cooldown changes to localStorage
  // ═══════════════════════════════════════════════════════════════
  const saveCooldown = useCallback(
    (emailValue: string, seconds: number, reason?: string) => {
      try {
        const endsAt = Date.now() + seconds * 1000;
        const data: StoredCooldown = {
          email: emailValue,
          endsAt,
          reason,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setCooldownSeconds(seconds);
        setCooldownEmail(emailValue);
        setCooldownReason(reason || "");
      } catch (e) {
        console.error("Failed to save cooldown:", e);
      }
    },
    [],
  );

  // ═══════════════════════════════════════════════════════════════
  // Tick countdown every second
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          // Clear localStorage when done
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {}
          setCooldownReason("");
          setCooldownEmail("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // ═══════════════════════════════════════════════════════════════
  // Check server cooldown when email changes (debounced)
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!email) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return;

    // Skip if already showing cooldown for a different email
    if (cooldownSeconds > 0 && cooldownEmail === normalizedEmail) return;

    const timeout = setTimeout(async () => {
      setCheckingStatus(true);
      try {
        const res = await fetch(
          `/api/forgot-password?email=${encodeURIComponent(normalizedEmail)}`,
        );
        const data = await res.json();

        if (data.onCooldown && data.retry_after_seconds > 0) {
          saveCooldown(
            normalizedEmail,
            data.retry_after_seconds,
            data.reason,
          );
        }
      } catch (e) {
        console.error("Status check failed:", e);
      } finally {
        setCheckingStatus(false);
      }
    }, 600);

    return () => clearTimeout(timeout);
  }, [email, cooldownSeconds, cooldownEmail, saveCooldown]);

  // ═══════════════════════════════════════════════════════════════
  // Format countdown
  // ═══════════════════════════════════════════════════════════════
  const formatCountdown = (seconds: number): string => {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${mins}m`;
    }
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    }
    return `${seconds}s`;
  };

  // ═══════════════════════════════════════════════════════════════
  // Submit
  // ═══════════════════════════════════════════════════════════════
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Block if on cooldown
    if (cooldownSeconds > 0) {
      Swal.fire({
        title: "Please Wait",
        text: `You need to wait ${formatCountdown(
          cooldownSeconds,
        )} before requesting another reset email.`,
        icon: "warning",
        confirmButtonColor: "var(--color-accent-yellow)",
      });
      return;
    }

    const newErrors: { [key: string]: string } = {};

    if (!email || !/^[\w-.]+@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const result = await response.json();

      if (response.status === 429) {
        // Rate limited
        const retryAfter = result.retry_after_seconds || 60;
        saveCooldown(
          email.trim().toLowerCase(),
          retryAfter,
          result.reason,
        );

        Swal.fire({
          title:
            result.reason === "daily_limit"
              ? "Daily Limit Reached"
              : result.reason === "hourly_limit"
                ? "Hourly Limit Reached"
                : "Please Wait",
          text:
            result.error ||
            `You need to wait ${formatCountdown(
              retryAfter,
            )} before trying again.`,
          icon: "warning",
          confirmButtonColor: "var(--color-accent-yellow)",
        });
        return;
      }

      if (!response.ok) {
        throw new Error(result.error || "Failed to send reset email");
      }

      // Success
      const cooldownSec = result.cooldown_seconds || 90;
      saveCooldown(
        email.trim().toLowerCase(),
        cooldownSec,
        "cooldown",
      );

      await Swal.fire({
        title: "Reset Email Sent",
        html: `
          <div class="text-left">
            <p>Check your inbox at <strong>${email}</strong> for the reset link.</p>
            <p class="text-sm text-gray-600 mt-3">
              You can request another email in <strong>${formatCountdown(
                cooldownSec,
              )}</strong>.
            </p>
            <p class="text-xs text-gray-500 mt-2">
              The link expires in 24 hours.
            </p>
          </div>
        `,
        icon: "success",
        confirmButtonColor: "var(--color-accent-yellow)",
      });
    } catch (error: any) {
      console.error(error);
      await Swal.fire({
        title: "Failed",
        text: error.message || "Unable to send password reset email.",
        icon: "error",
        confirmButtonColor: "var(--color-accent-yellow)",
      });
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || cooldownSeconds > 0 || checkingStatus;

  return (
    <main className="p-5 h-screen">
      {/* Back Button */}
      <div className="flex justify-start mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
      </div>

      <div className="flex flex-col justify-center items-center h-[70%]">
        <h2 className="text-2xl mb-2">Forgotten Password</h2>
        <p className="mb-4">Input your email for verification</p>

        {/* ═══ COOLDOWN ALERT ═══ */}
        {cooldownSeconds > 0 && (
          <div className="mb-4 w-[300px] p-3 squircle-md bg-amber-50 border border-amber-300 text-amber-800 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-lg">⏳</span>
              <div>
                <p className="font-medium">
                  {cooldownReason === "daily_limit"
                    ? "Daily limit reached"
                    : cooldownReason === "hourly_limit"
                      ? "Too many requests"
                      : "Please wait before retrying"}
                </p>
                <p className="text-xs mt-1">
                  Try again in{" "}
                  <strong>{formatCountdown(cooldownSeconds)}</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-[300px]">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="email">Email</Label>
            <input
              className="p-2 outline-none border border-gray-300 rounded-md bg-transparent focus:border-black disabled:opacity-60"
              type="email"
              id="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
              disabled={loading || cooldownSeconds > 0}
            />
            {checkingStatus && (
              <p className="text-xs text-gray-500">
                Checking status...
              </p>
            )}
          </div>

          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email}</p>
          )}
          {errors.general && (
            <p className="text-red-500 text-sm">{errors.general}</p>
          )}

          <Button
            className="bg-(--color-accent-yellow) mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={isDisabled}
          >
            {loading
              ? "Sending..."
              : cooldownSeconds > 0
                ? `Wait ${formatCountdown(cooldownSeconds)}`
                : "Send Reset Link"}
          </Button>

          {cooldownSeconds === 0 && (
            <p className="text-xs text-gray-500 text-center mt-2">
              You can request a new link every 90 seconds
            </p>
          )}
        </form>
      </div>
    </main>
  );
}