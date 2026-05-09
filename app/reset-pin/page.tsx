// app/reset-pin/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "../components/ui/button";
import { Loader2, CheckCircle, XCircle, Shield } from "lucide-react";
import { motion } from "framer-motion";
import PinPopOver from "../components/PinPopOver";

function ResetPinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const userId = searchParams.get("userId");

  const inputCount = 4;
  const [pin, setPin] = useState(Array(inputCount).fill(""));
  const [confirmPin, setConfirmPin] = useState(Array(inputCount).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [localPin, setLocalPin] = useState(Array(inputCount).fill(""));
  const [modalError, setModalError] = useState<string | null>(null);
  const [tempPin, setTempPin] = useState(Array(inputCount).fill(""));

  useEffect(() => {
    // Validate token exists
    if (!token || !userId) {
      setError("Invalid reset link. Please request a new PIN reset.");
      setIsValidating(false);
      return;
    }

    // Validate token with backend
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

  const handleOpenModal = () => {
    setModalError(null);
    setLocalPin(Array(inputCount).fill(""));
    setIsPinModalOpen(true);
  };

  const handlePinConfirm = async (code: string) => {
    const pinCode = code;

    if (pinCode.length !== inputCount) {
      throw new Error(`Please enter all ${inputCount} digits`);
    }

    if (step === "enter") {
      // Store the PIN and move to confirm step
      setPin(
        Array(inputCount)
          .fill("")
          .map((_, i) => pinCode[i] || ""),
      );
      setTempPin(
        Array(inputCount)
          .fill("")
          .map((_, i) => pinCode[i] || ""),
      );
      setStep("confirm");
      setIsPinModalOpen(false);
      return;
    } else {
      // Confirm the PIN
      if (code !== pin.join("")) {
        throw new Error("PINs do not match. Please try again.");
      }

      // Reset the PIN
      setIsLoading(true);

      const response = await fetch("/api/profile/reset-transaction-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, userId, newPin: code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset PIN");
      }

      setSuccess(true);
      setIsPinModalOpen(false);

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    }
  };

  const handlePinInputClick = () => {
    if (!isLoading && !success) {
      handleOpenModal();
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
    <>
      <PinPopOver
        isOpen={isPinModalOpen}
        setIsOpen={setIsPinModalOpen}
        pin={localPin}
        setPin={setLocalPin}
        inputCount={inputCount}
        onConfirm={handlePinConfirm}
        error={modalError}
        onClearError={() => setModalError(null)}
      />

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
              {step === "enter"
                ? "Set New Transaction PIN"
                : "Confirm Your PIN"}
            </h1>
            <p className="text-(--text-secondary) dark:text-(--bg-secondary)/70 mt-2">
              {step === "enter"
                ? "Enter a new 4-digit PIN for your transactions"
                : "Please confirm your new PIN"}
            </p>
          </div>

          <div className="space-y-6">
            {/* Make the PIN display clickable */}
            <div
              className="flex items-center justify-center gap-3 cursor-pointer"
              onClick={handlePinInputClick}
            >
              {(step === "enter" ? pin : confirmPin).map((digit, i) => (
                <div
                  key={i}
                  className="w-14 h-14 flex items-center justify-center text-center text-2xl font-extrabold rounded-lg border-2 border-(--border-color) bg-(--bg-secondary) text-(--text-primary) hover:border-(--color-accent-yellow) transition-colors"
                >
                  {digit ? "•" : ""}
                </div>
              ))}
            </div>

            <div className="max-w-[260px] mx-auto">
              <Button
                onClick={handleOpenModal}
                disabled={isLoading || success}
                className="w-full inline-flex justify-center items-center whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 focus:ring-(--color-accent-yellow) text-(--color-ink)"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {step === "enter" ? "Processing..." : "Resetting PIN..."}
                  </>
                ) : step === "enter" ? (
                  "Set PIN"
                ) : (
                  "Confirm PIN"
                )}
              </Button>
            </div>

            {step === "confirm" && (
              <button
                type="button"
                onClick={() => {
                  setStep("enter");
                  setError(null);
                  setConfirmPin(Array(inputCount).fill(""));
                  setPin(Array(inputCount).fill(""));
                }}
                className="w-full text-center text-sm text-(--text-secondary) hover:text-(--text-primary) mt-4"
              >
                ← Back to edit PIN
              </button>
            )}
          </div>

          <p className="text-xs text-(--text-secondary)/50 text-center mt-6">
            For security, this link will expire in 1 hour. If you didn't request
            this, please contact support immediately.
          </p>
        </motion.div>
      </div>
    </>
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
