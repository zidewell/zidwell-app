// app/reset-pin/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "../components/ui/button";
import { Loader2, CheckCircle, XCircle, Shield } from "lucide-react";
import { motion } from "framer-motion";

function ResetPinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const userId = searchParams.get("userId");

  const inputCount = 4;

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    if (!token || !userId) {
      setError("Invalid reset link. Please request a new PIN reset.");
      setIsValidating(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch("/api/profile/validate-pin-reset-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, userId }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Invalid or expired reset link");
        }
        setIsValidating(false);
      } catch (err: any) {
        setError(err.message);
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits");
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/profile/reset-transaction-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, userId, newPin: pin }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset PIN");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to reset PIN");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--bg-secondary) dark:bg-[#01402e]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-(--color-accent-yellow) mx-auto" />
          <p className="mt-4 text-(--text-primary) dark:text-(--bg-secondary)">
            Validating reset link...
          </p>
        </div>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--bg-secondary) dark:bg-[#01402e] px-4">
        <div className="max-w-md w-full bg-(--bg-primary) dark:bg-[#01402e] border-2 border-(--border-color) dark:border-(--bg-secondary) shadow-soft p-8 text-center rounded-xl">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-(--text-primary) dark:text-(--bg-secondary) mb-2">
            Invalid Reset Link
          </h1>
          <p className="text-(--text-secondary) dark:text-(--bg-secondary)/70 mb-6">
            {error}
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            variant="default"
            className="bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--bg-secondary) dark:bg-[#01402e] px-4">
        <div className="max-w-md w-full bg-(--bg-primary) dark:bg-[#01402e] border-2 border-(--border-color) dark:border-(--bg-secondary) shadow-soft p-8 text-center rounded-xl">
          <CheckCircle className="w-16 h-16 text-(--color-lemon-green) mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-(--text-primary) dark:text-(--bg-secondary) mb-2">
            PIN Reset Successful!
          </h1>
          <p className="text-(--text-secondary) dark:text-(--bg-secondary)/70 mb-4">
            Your transaction PIN has been reset successfully.
          </p>
          <p className="text-sm text-(--text-secondary)/60 dark:text-(--bg-secondary)/50">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--bg-secondary) dark:bg-[#01402e] px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="max-w-md w-full bg-(--bg-primary) dark:bg-[#01402e] border-2 border-(--border-color) dark:border-(--bg-secondary) shadow-soft p-8 rounded-xl"
      >
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 text-(--color-accent-yellow) mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-(--text-primary) dark:text-(--bg-secondary)">
            Set New Transaction PIN
          </h1>
          <p className="text-(--text-secondary) dark:text-(--bg-secondary)/70 mt-2">
            Enter a new 4-digit PIN for your transactions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-(--text-primary) dark:text-(--bg-secondary) mb-2">
              New PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={inputCount}
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, inputCount))
              }
              className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-extrabold rounded-lg border-2 border-(--border-color) dark:border-(--bg-secondary) bg-(--bg-primary) dark:bg-[#01402e] text-(--text-primary) dark:text-(--bg-secondary) focus:border-(--color-accent-yellow) focus:outline-none"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-(--text-primary) dark:text-(--bg-secondary) mb-2">
              Confirm PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={inputCount}
              value={confirmPin}
              onChange={(e) =>
                setConfirmPin(
                  e.target.value.replace(/\D/g, "").slice(0, inputCount),
                )
              }
              className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-extrabold rounded-lg border-2 border-(--border-color) dark:border-(--bg-secondary) bg-(--bg-primary) dark:bg-[#01402e] text-(--text-primary) dark:text-(--bg-secondary) focus:border-(--color-accent-yellow) focus:outline-none"
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={
              isLoading || pin.length !== inputCount || confirmPin.length !== inputCount
            }
            className="w-full bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) py-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Resetting PIN...
              </>
            ) : (
              "Reset PIN"
            )}
          </Button>
        </form>

        <p className="text-xs text-(--text-secondary)/50 text-center mt-6">
          For security, this link will expire in 1 hour. If you didn't request
          this, please contact support immediately.
        </p>
      </motion.div>
    </div>
  );
}

export default function ResetPinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-(--bg-secondary) dark:bg-[#01402e]">
          <Loader2 className="w-8 h-8 animate-spin text-(--color-accent-yellow)" />
        </div>
      }
    >
      <ResetPinContent />
    </Suspense>
  );
}