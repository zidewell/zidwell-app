// app/components/PinPopOver.tsx
"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Loader2, X, Mail, AlertCircle } from "lucide-react";
import ForgotPinModal from "./transfer-components/ForgotPinModal"; 

interface PinPopOverProps {
  setIsOpen: (isOpen: boolean) => void;
  isOpen: boolean;
  pin: string[];
  setPin: (pin: string[]) => void;
  inputCount: number;
  onConfirm?: (code: string) => Promise<void> | void;
  error?: string | null;
  onClearError?: () => void;
  isLoading?: boolean;
  /** Required — used by the forgot-PIN OTP flow. */
  userId: string;
  /** Optional — fired after a successful PIN reset so the caller can reset its form. */
  onPinReset?: () => void;
}

export default function PinPopOver({
  setIsOpen,
  isOpen,
  pin,
  setPin,
  inputCount,
  onConfirm,
  error,
  onClearError,
  isLoading = false,
  userId,
  onPinReset,
}: PinPopOverProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isPinLocked, setIsPinLocked] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showForgotPin, setShowForgotPin] = useState(false);

  const isBusy = isLoading || isProcessing;

  // Sync with parent error prop
  useEffect(() => {
    if (error) {
      setLocalError(error);
      setIsProcessing(false);
      setPin(Array(inputCount).fill(""));
      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 100);
    }
  }, [error, inputCount, setPin]);

  // Reset all local state when popover closes
  useEffect(() => {
    if (!isOpen) {
      setLocalError(null);
      setAttempts(0);
      setIsProcessing(false);
      setIsPinLocked(false);
      setLockedUntil(null);
      setShowForgotPin(false);
      if (onClearError) onClearError();
    }
  }, [isOpen, onClearError]);

  // Countdown for locked state
  useEffect(() => {
    if (isPinLocked && lockedUntil) {
      const updateTimer = () => {
        const now = new Date();
        const remaining = Math.max(0, lockedUntil.getTime() - now.getTime());
        setTimeRemaining(Math.ceil(remaining / 60000));

        if (remaining <= 0) {
          setIsPinLocked(false);
          setLockedUntil(null);
          setLocalError(null);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 60000);
      return () => clearInterval(interval);
    }
  }, [isPinLocked, lockedUntil]);

  // Auto-focus first input on open
  useEffect(() => {
    if (isOpen && !isBusy && !isPinLocked && !showForgotPin) {
      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 100);
    }
  }, [isOpen, isBusy, isPinLocked, showForgotPin]);

  const handleInput = (index: number, value: string) => {
    if (isBusy || isPinLocked) return;
    if (!/^\d?$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (localError) {
      setLocalError(null);
      if (onClearError) onClearError();
    }

    if (value && index < inputCount - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (isBusy || isPinLocked) return;

    if (e.key === "Backspace" || e.key === "Delete") {
      if (!pin[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    }

    if (e.key === "Enter" && pin.join("").length === inputCount) {
      handleSubmit(e as any);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (isBusy || isPinLocked) return;
    e.preventDefault();

    const text = e.clipboardData.getData("text").trim();
    if (!new RegExp(`^[0-9]{${inputCount}}$`).test(text)) {
      setLocalError(`PIN must be ${inputCount} digits`);
      return;
    }

    const digits = text.split("");
    setPin(digits);
    inputsRef.current[inputCount - 1]?.focus();

    if (localError) {
      setLocalError(null);
      if (onClearError) onClearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = pin.join("");

    if (isBusy || isPinLocked || code.length !== inputCount) {
      if (code.length !== inputCount) {
        setLocalError(`Please enter all ${inputCount} digits`);
      }
      return;
    }

    setIsProcessing(true);
    setLocalError(null);
    if (onClearError) onClearError();

    try {
      if (onConfirm) {
        await onConfirm(code);
      }
      setAttempts(0);
    } catch (err: any) {
      console.error("Error during PIN confirmation:", err);

      if (err?.locked || err?.message?.includes("locked")) {
        setIsPinLocked(true);
        setLockedUntil(err?.lockedUntil ? new Date(err.lockedUntil) : null);
        setLocalError(err.message);
        if (err?.attempts !== undefined) {
          setAttempts(err.attempts);
        }
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 2) {
          setLocalError(
            err?.message ||
              `Invalid PIN. ${3 - newAttempts} attempt${3 - newAttempts !== 1 ? "s" : ""} remaining before PIN is locked.`,
          );
        } else {
          setLocalError(err?.message || "Invalid PIN. Please try again.");
        }
      }

      setPin(Array(inputCount).fill(""));

      if (!isPinLocked) {
        setTimeout(() => {
          inputsRef.current[0]?.focus();
        }, 100);
      }

      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isBusy) {
      setIsOpen(false);
      setPin(Array(inputCount).fill(""));
      setLocalError(null);
      setAttempts(0);
      setIsPinLocked(false);
      setLockedUntil(null);
      setShowForgotPin(false);
      if (onClearError) onClearError();
    }
  };

  const handleRetry = () => {
    setLocalError(null);
    setPin(Array(inputCount).fill(""));
    if (onClearError) onClearError();
    inputsRef.current[0]?.focus();
  };

  const handlePinResetSuccess = () => {
    setShowForgotPin(false);
    setPin(Array(inputCount).fill(""));
    setLocalError(null);
    setAttempts(0);
    setIsPinLocked(false);
    setLockedUntil(null);
    if (onPinReset) onPinReset();
    if (onClearError) onClearError();
    setIsOpen(false);
  };

  const isPinComplete = pin.join("").length === inputCount;

  // ─── Locked state ───────────────────────────────────────────
  if (isPinLocked) {
    return (
      <>
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                className="fixed inset-0 bg-(--color-ink)/50 backdrop-blur-sm z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
              />

              <motion.div
                className="fixed inset-0 flex items-center justify-center z-50 px-4"
                initial={{ opacity: 0, y: 60, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              >
                <div className="max-w-md w-full text-center bg-(--bg-primary) px-4 sm:px-8 py-10 rounded-xl shadow-xl border border-(--border-color) relative">
                  <button
                    onClick={handleClose}
                    disabled={isBusy}
                    className="absolute top-4 right-4 p-2 rounded-full transition-colors text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-secondary)"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <header className="mb-6">
                    <div className="flex justify-center mb-4">
                      <div className="bg-red-100 p-3 rounded-full">
                        <AlertCircle className="w-12 h-12 text-red-600" />
                      </div>
                    </div>
                    <h1 className="text-2xl font-bold mb-2 text-(--text-primary)">
                      PIN Locked
                    </h1>
                    <p className="text-[15px] text-(--text-secondary)">
                      {localError || "Too many failed attempts"}
                    </p>
                  </header>

                  <div className="space-y-4">
                    {timeRemaining > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-amber-800 font-medium">
                          Locked for {timeRemaining} minute
                          {timeRemaining !== 1 ? "s" : ""}
                        </p>
                        <p className="text-sm text-amber-700 mt-1">
                          Please try again after the lock period, or reset your
                          PIN with an email verification code.
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={() => setShowForgotPin(true)}
                      className="w-full bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) py-3"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Reset PIN with verification code
                    </Button>

                    {timeRemaining > 0 && (
                      <Button
                        onClick={handleClose}
                        variant="outline"
                        className="w-full border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary)"
                      >
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <ForgotPinModal
          isOpen={showForgotPin}
          onClose={() => setShowForgotPin(false)}
          userId={userId}
          onSuccess={handlePinResetSuccess}
        />
      </>
    );
  }

  // ─── Normal PIN entry ───────────────────────────────────────
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-(--color-ink)/50 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />

            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 px-4"
              initial={{ opacity: 0, y: 60, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
              <div className="max-w-md w-full text-center bg-(--bg-primary) px-4 sm:px-8 py-10 rounded-xl shadow-xl border border-(--border-color) relative">
                <button
                  onClick={handleClose}
                  disabled={isBusy}
                  className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                    isBusy
                      ? "text-(--text-secondary)/50 cursor-not-allowed"
                      : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-secondary)"
                  }`}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>

                <header className="mb-6">
                  <h1 className="text-2xl font-bold mb-1 text-(--text-primary)">
                    Transaction PIN
                  </h1>
                  <p className="text-[15px] text-(--text-secondary)">
                    {isBusy ? (
                      <span className="text-(--color-accent-yellow) font-medium flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing transaction...
                      </span>
                    ) : localError ? (
                      <span className="text-red-500 font-medium">
                        {localError}
                      </span>
                    ) : (
                      <>
                        Enter your {inputCount}-digit PIN to complete this
                        transaction
                        {attempts > 0 && (
                          <span className="block text-xs text-amber-600 mt-1">
                            {3 - attempts} attempt
                            {3 - attempts !== 1 ? "s" : ""} remaining
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </header>

                <form onSubmit={handleSubmit}>
                  <div className="flex items-center justify-center gap-3">
                    {pin.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          inputsRef.current[i] = el;
                        }}
                        type="password"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleInput(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, i)}
                        onFocus={(e) => !isBusy && e.target.select()}
                        onPaste={handlePaste}
                        className={`w-14 h-14 text-center text-2xl font-extrabold rounded-lg outline-none transition-all ${
                          isBusy
                            ? "bg-(--bg-secondary) text-(--text-secondary) border-(--border-color) cursor-not-allowed"
                            : localError
                              ? "bg-red-50 text-red-900 border-2 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                              : "bg-(--bg-secondary) text-(--text-primary) border-2 border-transparent hover:border-(--color-accent-yellow)/50 focus:border-(--color-accent-yellow) focus:ring-2 focus:ring-(--color-accent-yellow)/20"
                        }`}
                        disabled={isBusy}
                        aria-label={`PIN digit ${i + 1}`}
                      />
                    ))}
                  </div>

                  {localError && !isBusy && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        className="text-(--color-accent-yellow) border-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/10 mx-auto"
                      >
                        Try Again
                      </Button>
                    </motion.div>
                  )}

                  <div className="max-w-[260px] mx-auto mt-6">
                    <Button
                      type="submit"
                      className={`w-full inline-flex justify-center items-center whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 ${
                        isBusy || !isPinComplete
                          ? "bg-gray-400 cursor-not-allowed hover:bg-gray-400 focus:ring-gray-400 text-white"
                          : localError
                            ? "bg-red-500 hover:bg-red-600 focus:ring-red-500 text-white"
                            : "bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) focus:ring-(--color-accent-yellow)"
                      }`}
                      disabled={isBusy || !isPinComplete}
                    >
                      {isBusy ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : localError ? (
                        "Try Again"
                      ) : (
                        "Confirm Payment"
                      )}
                    </Button>

                    {!isBusy && (
                      <p className="mt-4 text-sm">
                        <button
                          type="button"
                          onClick={() => setShowForgotPin(true)}
                          className="text-(--color-accent-yellow) hover:underline focus:outline-none"
                        >
                          Forgot PIN?
                        </button>
                      </p>
                    )}
                  </div>
                </form>

                {attempts > 0 && !isBusy && !localError && (
                  <div className="mt-4 pt-4 border-t border-(--border-color)">
                    <p className="text-xs text-(--text-secondary) flex items-center justify-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>
                        PIN will lock after {3 - attempts} more failed attempt
                        {3 - attempts !== 1 ? "s" : ""}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ForgotPinModal
        isOpen={showForgotPin}
        onClose={() => setShowForgotPin(false)}
        userId={userId}
        onSuccess={handlePinResetSuccess}
      />
    </>
  );
}