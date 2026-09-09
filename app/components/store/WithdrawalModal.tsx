// app/components/store/WithdrawalModal.tsx

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Wallet, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Banknote,
  ArrowRight,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => Promise<void>;
  maxAmount: number;
  isLoading?: boolean;
  isVerified?: boolean;
  onVerify?: () => void;
}

// ✅ Updated constants
const MIN_WITHDRAWAL = 1000;
const WITHDRAWAL_FEE = 0; // ✅ FREE

export function WithdrawalModal({
  isOpen,
  onClose,
  onConfirm,
  maxAmount,
  isLoading = false,
  isVerified = true,
  onVerify,
}: WithdrawalModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"input" | "confirm" | "success">("input");

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
    setAmount(String(maxAmount));
    setError("");
  };

  const validateAmount = () => {
    const numAmount = Number(amount);
    
    if (!amount || numAmount <= 0) {
      setError("Please enter a valid amount");
      return false;
    }
    
    if (numAmount < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal is ₦${MIN_WITHDRAWAL.toLocaleString()}`);
      return false;
    }
    
    if (numAmount > maxAmount) {
      setError(`Maximum withdrawal is ₦${maxAmount.toLocaleString()}`);
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
    }
  };

  const handleConfirm = async () => {
    const numAmount = Number(amount);
    setIsSubmitting(true);
    
    try {
      await onConfirm(numAmount);
      setStep("success");
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error: any) {
      setError(error.message || "Withdrawal failed. Please try again.");
      setStep("input");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setStep("input");
    setError("");
  };

  const numAmount = Number(amount) || 0;
  // ✅ No withdrawal fee
  const fee = WITHDRAWAL_FEE;
  const netAmount = numAmount;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            disabled={isSubmitting || step === "success"}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
              // BVN Verification Required
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
              // Amount Input Step
              <div className="space-y-4">
                {/* Balance Display */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Available Balance</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      ₦{maxAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Enter Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-500 dark:text-gray-400">
                      ₦
                    </span>
                    <input
                      type="text"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="0.00"
                      className={cn(
                        "w-full pl-10 pr-4 py-4 text-xl font-semibold bg-gray-50 dark:bg-gray-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all",
                        error
                          ? "border-red-500 dark:border-red-500"
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
                    onClick={handleMaxClick}
                    className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 hover:underline font-medium"
                  >
                    Withdraw All (₦{maxAmount.toLocaleString()})
                  </button>
                </div>

                {/* ✅ Fee Breakdown - NO FEE */}
                {numAmount > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Amount</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ₦{numAmount.toLocaleString()}
                      </span>
                    </div>
                   
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-900 dark:text-white">You'll Receive</span>
                      <span className="text-green-600 dark:text-green-400">
                        ₦{netAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Next Button */}
                <button
                  onClick={handleNext}
                  disabled={!amount || Number(amount) < MIN_WITHDRAWAL || Number(amount) > maxAmount}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-semibold transition-colors",
                    !amount || Number(amount) < MIN_WITHDRAWAL || Number(amount) > maxAmount
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                      : "bg-yellow-500 text-black hover:bg-yellow-600"
                  )}
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>

                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Minimum withdrawal: ₦{MIN_WITHDRAWAL.toLocaleString()} • ✅ Fee: FREE
                </p>
              </div>
            ) : step === "confirm" ? (
              // Confirm Step
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
                    You are about to withdraw funds to your main wallet
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Amount</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ₦{numAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Fee</span>
                    <span className="font-medium text-green-600">✅ FREE</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-900 dark:text-white">Net Amount</span>
                    <span className="text-green-600 dark:text-green-400">
                      ₦{netAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleBack}
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-yellow-500 text-black hover:bg-yellow-600 px-4 py-3 font-semibold transition-colors"
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
            ) : (
              // Success Step
              <div className="text-center py-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Withdrawal Initiated!
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ₦{netAmount.toLocaleString()} has been sent to your main wallet.
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ✅ No fees were deducted
                </p>
                <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Reference: WDR-{Date.now().toString().slice(-8)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}