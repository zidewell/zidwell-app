"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Loader2, X } from "lucide-react";

interface PinPopOverProps {
  setIsOpen: (isOpen: boolean) => void;
  isOpen: boolean;
  pin: string[];
  setPin: (pin: string[]) => void;
  inputCount: number;
  onConfirm?: (code: string) => Promise<void> | void;
  error?: string | null; // Add error prop from parent
  onClearError?: () => void; // Callback to clear error in parent
  invoiceFeeInfo?: {
    isFree: boolean;
    freeInvoicesLeft: number;
    totalInvoicesCreated: number;
    feeAmount: number;
  };
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
  invoiceFeeInfo,
}: PinPopOverProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  // Sync with parent error
  useEffect(() => {
    if (error) {
      setLocalError(error);
      setIsProcessing(false);
      // Clear PIN on error for security
      setPin(Array(inputCount).fill(""));
      // Focus first input after error
      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 100);
    }
  }, [error, inputCount, setPin]);

  // Clear local error when popup closes
  useEffect(() => {
    if (!isOpen) {
      setLocalError(null);
      setAttempts(0);
      setIsProcessing(false);
      if (onClearError) onClearError();
    }
  }, [isOpen, onClearError]);

  // Auto-focus first input when opened
  useEffect(() => {
    if (isOpen && !isProcessing) {
      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 100);
    }
  }, [isOpen, isProcessing]);

  const handleInput = (index: number, value: string) => {
    if (isProcessing) return;
    if (!/^\d?$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    
    // Clear any error when user starts typing
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
    index: number
  ) => {
    if (isProcessing) return;
    
    if (e.key === "Backspace" || e.key === "Delete") {
      if (!pin[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    }
    
    // Handle Enter key to submit
    if (e.key === "Enter" && pin.join("").length === inputCount) {
      handleSubmit(e as any);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (isProcessing) return;
    e.preventDefault();
    
    const text = e.clipboardData.getData("text").trim();
    if (!new RegExp(`^[0-9]{${inputCount}}$`).test(text)) {
      setLocalError(`PIN must be ${inputCount} digits`);
      return;
    }
    
    const digits = text.split("");
    setPin(digits);
    inputsRef.current[inputCount - 1]?.focus();
    
    // Clear any error
    if (localError) {
      setLocalError(null);
      if (onClearError) onClearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = pin.join("");
    
    if (isProcessing || code.length !== inputCount) {
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
        // Don't clear PIN on success - let parent handle it
      }
    } catch (err: any) {
      console.error("Error during PIN confirmation:", err);
      
      // Increment attempts
      setAttempts(prev => prev + 1);
      
      // Set appropriate error message
      if (err?.message?.toLowerCase().includes("pin")) {
        setLocalError(err.message || "Invalid PIN. Please try again.");
      } else {
        setLocalError(err?.message || "Transaction failed. Please try again.");
      }
      
      // Clear PIN fields for security
      setPin(Array(inputCount).fill(""));
      
      // Focus first input for retry
      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 100);
      
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setIsOpen(false);
      setPin(Array(inputCount).fill(""));
      setLocalError(null);
      setAttempts(0);
      if (onClearError) onClearError();
    }
  };

  const handleRetry = () => {
    setLocalError(null);
    setPin(Array(inputCount).fill(""));
    if (onClearError) onClearError();
    inputsRef.current[0]?.focus();
  };

  const isPinComplete = pin.join("").length === inputCount;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
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
            <div className="max-w-md w-full text-center bg-white px-4 sm:px-8 py-10 rounded-xl shadow-xl relative">
              
              {/* Close button */}
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                  isProcessing 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Invoice Fee Information */}
              {invoiceFeeInfo && (
                <div
                  className={`mb-4 p-3 rounded-lg border ${
                    invoiceFeeInfo.isFree
                      ? "bg-green-50 border-green-200"
                      : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {invoiceFeeInfo.isFree
                          ? "🎉 Free Invoice"
                          : "💰 Invoice Fee"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-xl font-bold ${
                          invoiceFeeInfo.isFree
                            ? "text-green-600"
                            : "text-[#C29307]"
                        }`}
                      >
                        {invoiceFeeInfo.isFree ? "FREE" : `₦${invoiceFeeInfo.feeAmount}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <header className="mb-6">
                <h1 className="text-2xl font-bold mb-1">
                  Transaction PIN
                </h1>
                <p className="text-[15px] text-slate-500">
                  {isProcessing ? (
                    <span className="text-[#C29307] font-medium flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing transaction...
                    </span>
                  ) : localError ? (
                    <span className="text-red-500 font-medium">
                      {localError}
                    </span>
                  ) : (
                    <>
                      Enter your 4-digit PIN to complete this transaction
                      {attempts > 0 && (
                        <span className="block text-xs text-red-400 mt-1">
                          Attempt {attempts + 1}
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
                      onFocus={(e) => !isProcessing && e.target.select()}
                      onPaste={handlePaste}
                      className={`w-14 h-14 text-center text-2xl font-extrabold rounded-lg outline-none transition-all ${
                        isProcessing
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : localError
                          ? 'bg-red-50 text-red-900 border-2 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'bg-slate-100 text-slate-900 border-2 border-transparent hover:border-slate-200 focus:border-[#C29307] focus:ring-2 focus:ring-[#C29307]/20'
                      }`}
                      disabled={isProcessing}
                      aria-label={`PIN digit ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Error message with retry button */}
                {localError && !isProcessing && (
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
                      className="text-[#C29307] border-[#C29307] hover:bg-[#C29307]/10 mx-auto"
                    >
                      Try Again
                    </Button>
                  </motion.div>
                )}

                <div className="max-w-[260px] mx-auto mt-6">
                  <Button
                    type="submit"
                    className={`w-full inline-flex justify-center items-center whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 ${
                      isProcessing || !isPinComplete
                        ? 'bg-gray-400 cursor-not-allowed hover:bg-gray-400 focus:ring-gray-400'
                        : localError
                        ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500'
                        : 'bg-[#C29307] hover:bg-[#C29307]/90 focus:ring-[#C29307]'
                    }`}
                    disabled={isProcessing || !isPinComplete}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : localError ? (
                      "Try Again"
                    ) : invoiceFeeInfo?.isFree ? (
                      "Confirm Free Transaction"
                    ) : (
                      "Confirm Payment"
                    )}
                  </Button>
                  
                  {/* Forgot PIN link */}
                  {!isProcessing && !localError && (
                    <p className="mt-4 text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          // Navigate to reset PIN page or show modal
                          window.location.href = "/dashboard/profile?reset-pin=true";
                        }}
                        className="text-[#C29307] hover:underline focus:outline-none"
                      >
                        Forgot PIN?
                      </button>
                    </p>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}