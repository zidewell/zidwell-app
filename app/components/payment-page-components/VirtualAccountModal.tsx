// app/components/payment-page/VirtualAccountModal.tsx
"use client";

import { motion } from "framer-motion";
import { Copy, Check, Clock, Banknote, X, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

interface VirtualAccountModalProps {
  details: {
    accountNumber: string;
    bankName: string;
    accountName: string;
    amount: number;
    orderReference: string;
    expiresAt: string;
  };
  instruction: string;
  paymentId: string;
  onClose: () => void;
  onPaymentConfirmed?: () => void;
}

export const VirtualAccountModal = ({ 
  details, 
  instruction, 
  paymentId,
  onClose,
  onPaymentConfirmed 
}: VirtualAccountModalProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "checking" | "completed" | "failed">("pending");
  const [checkCount, setCheckCount] = useState(0);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Countdown timer
  useEffect(() => {
    const expiresAt = new Date(details.expiresAt);
    
    const updateTimer = () => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (3600000)) / (1000 * 60));
      const seconds = Math.floor((diff % (60000)) / 1000);
      
      setTimeLeft({ hours, minutes, seconds });
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [details.expiresAt]);

  // Check payment status
  const checkPayment = async () => {
    setPaymentStatus("checking");
    try {
      const response = await fetch(`/api/payment-page/public/status?reference=${details.orderReference}`);
      const data = await response.json();
      
      if (data.success && data.payment.status === "completed") {
        setPaymentStatus("completed");
        if (onPaymentConfirmed) {
          setTimeout(() => onPaymentConfirmed(), 2000);
        }
      } else {
        setPaymentStatus("pending");
        setCheckCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error checking payment:", error);
      setPaymentStatus("pending");
    }
  };

  // Auto-check every 30 seconds for 5 minutes
  useEffect(() => {
    if (paymentStatus === "completed") return;
    
    const interval = setInterval(() => {
      if (checkCount < 10) { // Check 10 times max
        checkPayment();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [checkCount, paymentStatus]);

  const formatTime = (hours: number, minutes: number, seconds: number) => {
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FDC020] to-[#1a5c40] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-2xl font-bold">Complete Your Payment</h2>
          <p className="text-white/80 text-sm mt-1">Transfer to the account below</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Amount */}
          <div className="text-center bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">Amount to Pay</p>
            <p className="text-3xl font-bold text-[#1a5c40]">
              ₦{details.amount.toLocaleString()}
            </p>
          </div>

          {/* Virtual Account Details */}
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Bank Name</p>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-lg">{details.bankName}</p>
                <button
                  onClick={() => copyToClipboard(details.bankName, "bank")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {copiedField === "bank" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Account Number</p>
              <div className="flex items-center justify-between">
                <p className="font-mono font-bold text-2xl tracking-wider">
                  {details.accountNumber}
                </p>
                <button
                  onClick={() => copyToClipboard(details.accountNumber, "account")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {copiedField === "account" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Account Name</p>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{details.accountName}</p>
                <button
                  onClick={() => copyToClipboard(details.accountName, "name")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {copiedField === "name" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Instruction */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-start gap-2">
              <Banknote className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Payment Instruction</p>
                <p className="text-sm text-blue-700 mt-1">{instruction}</p>
              </div>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Expires in:</span>
            </div>
            <span className="font-mono font-semibold text-red-600">
              {formatTime(timeLeft.hours, timeLeft.minutes, timeLeft.seconds)}
            </span>
          </div>

          {/* Status Check */}
          {paymentStatus === "checking" && (
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Checking payment status...</span>
            </div>
          )}

          {paymentStatus === "completed" && (
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-green-700 font-semibold">Payment Confirmed!</p>
              <p className="text-sm text-green-600">Redirecting...</p>
            </div>
          )}

          {/* Manual Check Button */}
          {paymentStatus === "pending" && (
            <button
              onClick={checkPayment}
              className="w-full py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              I've Made the Transfer
            </button>
          )}

          <p className="text-xs text-gray-400 text-center">
            Your payment will be confirmed automatically within 5-10 minutes after transfer.
            The transaction fee is covered by the merchant.
          </p>
        </div>
      </motion.div>
    </div>
  );
};