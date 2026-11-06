// app/components/ForgotPinModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Loader2, X, CheckCircle2, AlertCircle, Mail, Clock } from "lucide-react";
import { toast } from "sonner";

interface ForgotPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userId: string;
}

const OTP_LENGTH = 6;
const PIN_LENGTH = 4;
const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPinModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
}: ForgotPinModalProps) {
  const [step, setStep] = useState<"request" | "verify" | "done">("request");
  const [otp, setOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [maskedEmail, setMaskedEmail] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownMessage, setCooldownMessage] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Reset all local state on close ────────────────────────
  const resetState = () => {
    setStep("request");
    setOtp("");
    setNewPin("");
    setConfirmPin("");
    setMaskedEmail("");
    setError(null);
    setCooldownMessage(null);
    setLoading(false);
    setResendCountdown(0);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const handleClose = () => {
    if (loading) return; // don't allow close while in-flight
    resetState();
    onClose();
  };

  // ─── Cleanup on unmount ─────────────────────────────────────
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // ─── Auto-reset state when modal closes externally ─────────
  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  // ─── Countdown driver ───────────────────────────────────────
  useEffect(() => {
    if (resendCountdown <= 0) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }

    if (countdownRef.current) return; // already ticking

    countdownRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [resendCountdown]);

  // ─── Step 1: request OTP ────────────────────────────────────
  const requestOtp = async (opts?: { isResend?: boolean }) => {
    if (loading) return;
    if (resendCountdown > 0 && opts?.isResend) return;

    setLoading(true);
    setError(null);
    setCooldownMessage(null);

    try {
      const res = await fetch("/api/profile/request-pin-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.error || "Failed to send verification code.";

        if (res.status === 429) {
          setCooldownMessage(msg);
          toast.info(msg);
          return;
        }

        setError(msg);
        toast.error(msg);
        return;
      }

      setMaskedEmail(data.maskedEmail || "your email");
      setStep("verify");
      setOtp("");
      setNewPin("");
      setConfirmPin("");
      setResendCountdown(RESEND_COOLDOWN_SECONDS);

      toast.success(
        opts?.isResend
          ? "New verification code sent to your email."
          : "Verification code sent to your email.",
      );
    } catch (err: any) {
      const msg =
        err?.message === "Failed to fetch"
          ? "Network error. Check your connection and try again."
          : "Something went wrong. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: verify OTP + set new PIN ───────────────────────
  const verifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!/^\d{6}$/.test(otp)) {
      const msg = "Verification code must be exactly 6 digits.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      const msg = "Transaction PIN must be exactly 4 digits.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (newPin !== confirmPin) {
      const msg = "PINs do not match.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setError(null);
    setCooldownMessage(null);

    try {
      const res = await fetch("/api/profile/verify-pin-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otp, newPin }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.error || "Failed to reset transaction PIN.";

        // ── Cooldown active (24h limit) — keep OTP so user can retry later ──
        if (res.status === 429) {
          setCooldownMessage(msg);
          toast.info(msg);
          return;
        }

        // ── Concurrent change or consumed OTP — reset to request step ──
        if (res.status === 409) {
          setError(msg);
          toast.error(msg);
          setOtp("");
          setNewPin("");
          setConfirmPin("");
          setStep("request");
          setResendCountdown(0);
          toast.info("Please request a new verification code.");
          return;
        }

        // ── Wrong OTP / expired / per-OTP attempts exhausted ──
        setError(msg);
        toast.error(msg);

        const lower = typeof msg === "string" ? msg.toLowerCase() : "";
        if (
          res.status === 429 ||
          lower.includes("expired") ||
          lower.includes("too many")
        ) {
          setOtp("");
          setNewPin("");
          setConfirmPin("");
          setStep("request");
          setResendCountdown(0);
          toast.info("Please request a new verification code.");
        }
        return;
      }

      // ✅ Success
      setStep("done");
      toast.success("Transaction PIN reset successfully.");

      onSuccess?.();

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      const msg =
        err?.message === "Failed to fetch"
          ? "Network error. Check your connection and try again."
          : "Something went wrong. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Derived flags ──────────────────────────────────────────
  const otpValid = /^\d{6}$/.test(otp);
  const newPinValid = /^\d{4}$/.test(newPin);
  const confirmPinValid = /^\d{4}$/.test(confirmPin);
  const pinsMatch = newPin === confirmPin && newPin.length === 4;

  const canSubmit =
    !loading && otpValid && newPinValid && confirmPinValid && pinsMatch;

  const canResend = !loading && resendCountdown === 0 && step === "verify";

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md bg-(--bg-primary) border border-(--border-color) rounded-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className={`absolute top-4 right-4 text-(--text-secondary) hover:text-(--text-primary) transition-colors ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ─── STEP: request ────────────────────────────────── */}
        {step === "request" && (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-(--color-accent-yellow)/15 flex items-center justify-center">
                <Mail className="w-5 h-5 text-(--color-accent-yellow)" />
              </div>
              <h2 className="text-lg font-bold text-(--text-primary)">
                Forgot your transaction PIN?
              </h2>
            </div>
            <p className="text-sm text-(--text-secondary) mb-6">
              We&apos;ll send a 6-digit verification code to the email address
              on your account. You&apos;ll need it to set a new PIN.
            </p>

            {cooldownMessage && (
              <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  {cooldownMessage}
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            )}

            <Button
              onClick={() => requestOtp()}
              disabled={loading}
              className="w-full bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) font-medium py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending verification code...
                </>
              ) : (
                "Send verification code"
              )}
            </Button>
          </>
        )}

        {/* ─── STEP: verify ─────────────────────────────────── */}
        {step === "verify" && (
          <form onSubmit={verifyAndReset} className="space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-(--color-accent-yellow)/15 flex items-center justify-center">
                <Mail className="w-5 h-5 text-(--color-accent-yellow)" />
              </div>
              <h2 className="text-lg font-bold text-(--text-primary)">
                Enter verification code
              </h2>
            </div>
            <p className="text-sm text-(--text-secondary) mb-2">
              A 6-digit code was sent to{" "}
              <strong className="text-(--text-primary)">{maskedEmail}</strong>.
              It expires in 10 minutes.
            </p>

            {cooldownMessage && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  {cooldownMessage}
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            )}

            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-(--text-primary) mb-1"
              >
                Verification code
              </label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={OTP_LENGTH}
                value={otp}
                onChange={(e) =>
                  setOtp(
                    e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH),
                  )
                }
                placeholder="123456"
                className="text-center text-xl tracking-[0.5em] font-mono"
                disabled={loading || !!cooldownMessage}
              />
              {otp && !otpValid && (
                <p className="text-xs text-amber-600 mt-1">
                  Code must be {OTP_LENGTH} digits.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="newPin"
                className="block text-sm font-medium text-(--text-primary) mb-1"
              >
                New {PIN_LENGTH}-digit transaction PIN
              </label>
              <Input
                id="newPin"
                type="password"
                inputMode="numeric"
                maxLength={PIN_LENGTH}
                value={newPin}
                onChange={(e) =>
                  setNewPin(
                    e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH),
                  )
                }
                placeholder="••••"
                className="text-center text-xl tracking-[0.5em]"
                disabled={loading || !!cooldownMessage}
              />
              {newPin && !newPinValid && (
                <p className="text-xs text-amber-600 mt-1">
                  PIN must be {PIN_LENGTH} digits.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPin"
                className="block text-sm font-medium text-(--text-primary) mb-1"
              >
                Confirm new PIN
              </label>
              <Input
                id="confirmPin"
                type="password"
                inputMode="numeric"
                maxLength={PIN_LENGTH}
                value={confirmPin}
                onChange={(e) =>
                  setConfirmPin(
                    e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH),
                  )
                }
                placeholder="••••"
                className="text-center text-xl tracking-[0.5em]"
                disabled={loading || !!cooldownMessage}
              />
              {confirmPin && !confirmPinValid && (
                <p className="text-xs text-amber-600 mt-1">
                  Confirm PIN must be {PIN_LENGTH} digits.
                </p>
              )}
              {confirmPinValid && newPinValid && !pinsMatch && (
                <p className="text-xs text-red-500 mt-1">
                  PINs do not match.
                </p>
              )}
              {pinsMatch && (
                <p className="text-xs text-(--color-lemon-green) mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> PINs match
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => requestOtp({ isResend: true })}
                disabled={!canResend}
                className="flex-1"
              >
                {resendCountdown > 0 ? (
                  <>Resend in {resendCountdown}s</>
                ) : loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend code"
                )}
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="flex-1 bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset PIN"
                )}
              </Button>
            </div>

            <p className="text-xs text-(--text-secondary) text-center pt-1">
              Didn&apos;t get the code? Check your spam folder. Still nothing?
              Wait for the countdown, then tap <strong>Resend code</strong>.
            </p>
          </form>
        )}

        {/* ─── STEP: done ───────────────────────────────────── */}
        {step === "done" && (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-lg font-bold text-(--text-primary) mb-2">
              PIN reset successfully
            </h2>
            <p className="text-sm text-(--text-secondary)">
              You can now use your new PIN to authorize transfers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}