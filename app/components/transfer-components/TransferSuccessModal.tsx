"use client";

import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Download, X, CheckCircle, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";

interface TransferSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  amount: number;
  transactionId: string;
  recipientName: string;
  recipientAccount?: string;
  recipientBank?: string;
  senderName?: string;
  isDownloading?: boolean;
}

export default function TransferSuccessModal({
  isOpen,
  onClose,
  onDownload,
  amount,
  transactionId,
  recipientName,
  recipientAccount,
  recipientBank,
  senderName,
  isDownloading = false,
}: TransferSuccessModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      triggerConfetti();
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#E5B333", "#ffd700", "#ffed4e", "#ffffff", "#fbbf24"],
    });
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#E5B333", "#ffd700", "#ffed4e"],
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#E5B333", "#ffd700", "#ffed4e"],
      });
    }, 150);
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.8 },
        colors: ["#E5B333", "#ffd700", "#ffed4e"],
      });
    }, 300);
  };

  if (!isOpen && !isVisible) return null;

  const formattedAmount = `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
  })}`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Success Icon */}
          <div className="pt-8 pb-2 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Transfer Successful! 🎉
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Your transaction has been processed successfully.
            </p>

            {/* Transaction Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6 text-left">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Amount</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formattedAmount}
                </span>
              </div>
              {senderName && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">From</span>
                  <span className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[200px]">
                    {senderName}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 text-sm">To</span>
                <span className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[200px]">
                  {recipientName || "N/A"}
                </span>
              </div>
              {recipientAccount && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Account</span>
                  <span className="font-mono text-sm text-gray-900 dark:text-white">
                    {recipientAccount}
                  </span>
                </div>
              )}
              {recipientBank && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Bank</span>
                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                    {recipientBank}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Transaction ID</span>
                <span className="font-mono text-xs text-gray-900 dark:text-white truncate max-w-[180px]">
                  {transactionId}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={onDownload}
                disabled={isDownloading}
                className="flex-1 bg-[#E5B333] hover:bg-[#d4a020] text-black font-medium transition-colors"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Receipt
                  </>
                )}
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Done
              </Button>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
              A receipt has also been sent to your email.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}