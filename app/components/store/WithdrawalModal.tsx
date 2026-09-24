// app/components/store/WithdrawalModal.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Wallet,
  Loader2,
  AlertCircle,
  Banknote,
  ArrowRight,
  Shield,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => Promise<void>;
  maxAmount: number;
  isVerified?: boolean;
  onVerify?: () => void;
}

export function WithdrawalModal({
  isOpen,
  onClose,
  onConfirm,
  maxAmount,
  isVerified = true,
  onVerify,
}: WithdrawalModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [step, setStep] = useState<"input" | "confirm">("input");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setError("");
      setStep("input");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setAmount(value);
    setError("");
  };

  const handleMaxClick = () => {
    setAmount(String(Math.floor(maxAmount)));
    setError("");
  };

  const validateAmount = (): boolean => {
    const num = Number(amount);

    if (!amount || num <= 0) {
      setError("Please enter a valid amount");
      return false;
    }
    if (num > maxAmount) {
      setError(`You can withdraw at most ₦${maxAmount.toLocaleString()}`);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!isVerified) {
      onVerify?.();
      return;
    }
    if (validateAmount()) {
      setStep("confirm");
      setError("");
    }
  };

  const handleConfirm = async () => {
    const num = Number(amount);
    setIsSubmitting(true);
    setError("");

    try {
      await onConfirm(num);
      // No state updates on success — parent closes the modal
    } catch (err: any) {
      setError(err?.message || "Withdrawal failed. Please try again.");
      setStep("input");
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setStep("input");
    setError("");
  };

  const numAmount = Number(amount) || 0;

  // Continue button enabled whenever there's a valid positive amount ≤ max
  const canContinue =
    !!amount && numAmount > 0 && numAmount <= maxAmount && !isSubmitting;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
                <Wallet className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Withdraw Funds
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Withdraw to your main wallet
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {!isVerified ? (
              /* ─── BVN Required ─── */
              <div className="text-center py-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                    <Shield className="h-8 w-8 text-red-500" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  BVN Verification Required
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  You need to verify your BVN before you can withdraw funds.
                </p>
                <button
                  onClick={onVerify}
                  className="w-full bg-yellow-500 text-black hover:bg-yellow-600 font-medium rounded-xl px-6 py-3 transition-colors flex items-center justify-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Verify BVN Now
                </button>
              </div>
            ) : step === "input" ? (
              /* ─── INPUT STEP ─── */
              <div className="space-y-4">
                {/* Balance */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Available Balance
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      ₦{maxAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Amount input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Enter Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-500">
                      ₦
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="0"
                      disabled={isSubmitting}
                      className={cn(
                        "w-full pl-10 pr-4 py-4 text-xl font-semibold bg-gray-50 dark:bg-gray-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all disabled:opacity-50",
                        error
                          ? "border-red-500"
                          : "border-gray-200 dark:border-gray-700"
                      )}
                      autoFocus
                    />
                  </div>

                  {error && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleMaxClick}
                    disabled={isSubmitting}
                    className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 hover:underline font-medium disabled:opacity-50"
                  >
                    Withdraw All (₦{maxAmount.toLocaleString()})
                  </button>
                </div>

                {/* Summary */}
                {numAmount > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-gray-900 dark:text-white">
                        You'll Receive
                      </span>
                      <span className="text-green-600 dark:text-green-400">
                        ₦{numAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Continue */}
                <button
                  onClick={handleNext}
                  disabled={!canContinue}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-semibold transition-colors",
                    !canContinue
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-yellow-500 text-black hover:bg-yellow-600"
                  )}
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>

                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  No minimum • Fee: FREE
                </p>
              </div>
            ) : (
              /* ─── CONFIRM STEP ─── */
              <div className="space-y-4">
                <div className="text-center py-2">
                  <div className="flex items-center justify-center mb-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
                      <Banknote className="h-8 w-8 text-yellow-500" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Confirm Withdrawal
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This will transfer funds to your main wallet
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Amount
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ₦{numAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-900 dark:text-white">
                      Net Amount
                    </span>
                    <span className="text-green-600 dark:text-green-400">
                      ₦{numAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Error from a failed confirm attempt */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleBack}
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-1 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-yellow-500 text-black hover:bg-yellow-600 px-4 py-3 font-semibold transition-colors disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Confirm"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}