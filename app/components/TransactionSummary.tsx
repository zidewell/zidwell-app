"use client";

import FeeDisplay from "./FeeDisplay";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface TransactionSummaryProps {
  senderName: string;
  senderAccount: string;
  recipientName: any;
  recipientAccount: string;
  recipientBank: string;
  purpose: string;
  amount: number | string;
  confirmTransaction: boolean;
  onBack: () => void;
  onConfirm: () => void;
   paymentMethod?: "checkout" | "virtual_account" | "bank_transfer" | "p2p";
  isP2P?: boolean; 
}

export default function TransactionSummary({
  senderName,
  senderAccount,
  recipientName,
  recipientAccount,
  recipientBank,
  purpose,
  amount,
  confirmTransaction,
  onBack,
  onConfirm,
  paymentMethod = "bank_transfer",
  isP2P = false, 
}: TransactionSummaryProps) {


  return (
    <AnimatePresence>
      {confirmTransaction && (
        <>
          {/* 🔲 Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 dark:bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onBack}
          />

          {/* 📤 Modal Container */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-lg p-6 space-y-3 dark:bg-gray-800 dark:border dark:border-gray-700">
              {/* P2P Badge */}
              {isP2P && (
                <div className="flex justify-center mb-2">
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                    P2P Transfer
                  </span>
                </div>
              )}

              <div className="flex flex-col items-center ">
                <div className="text-gray-500 text-sm dark:text-gray-400">You're sending</div>
               <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
  ₦
  {typeof amount === "number"
    ? amount.toLocaleString()
    : Number(amount).toLocaleString()}
</div>
                {/* Only show FeeDisplay for non-P2P transfers (P2P is free) */}
                {!isP2P && (
                  <FeeDisplay
                    type="transfer"
                    amount={typeof amount === "string" ? Number(amount) : amount}
                    paymentMethod={paymentMethod}
                  />
                )}
                {/* For P2P, show that it's free */}
                {isP2P && (
                  <div className="mt-2 text-sm text-green-600 font-medium dark:text-green-400">
                    ✓ No transfer fees for P2P
                  </div>
                )}
              </div>

              {/* FROM Section */}
              <div>
                <h3 className="text-gray-700 text-sm font-semibold mb-2 dark:text-gray-300">
                  From
                </h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm dark:bg-gray-700">
                  <p className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Account Name</span>
                    <span className="text-gray-900 dark:text-gray-100">{senderName}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Account Number</span>
                    <span className="text-gray-900 dark:text-gray-100">{senderAccount}</span>
                  </p>
                </div>
              </div>

              {/* TO Section */}
              <div>
                <h3 className="text-gray-700 text-sm font-semibold mb-2 dark:text-gray-300">
                  {isP2P ? "To (Zidwell User)" : "To"}
                </h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm dark:bg-gray-700">
                  <p className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Account Name</span>
                    <span className="text-gray-900 dark:text-gray-100">{recipientName}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      {isP2P ? "Zidwell Account" : "Account Number"}
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">{recipientAccount}</span>
                  </p>
                  {!isP2P && (
                    <p className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Bank Name</span>
                      <span className="text-gray-900 dark:text-gray-100">{recipientBank}</span>
                    </p>
                  )}
                  {isP2P && (
                    <p className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Platform</span>
                      <span className="text-gray-900 dark:text-gray-100">Zidwell Wallet</span>
                    </p>
                  )}
                  <p className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Purpose</span>
                    <span className="text-gray-900 dark:text-gray-100">{purpose}</span>
                  </p>
                </div>
              </div>

              {/* Warning - Different message for P2P */}
              <div className={`${
                isP2P 
                  ? "bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                  : "bg-orange-50 border border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400"
              } rounded-lg p-3 text-sm flex items-start gap-2`}>
                {isP2P ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mt-0.5 text-green-500 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mt-0.5 text-orange-500 dark:text-orange-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01M5.07 19h13.86c1.14 0 1.72-1.37 1.05-2.24L13.05 4.76a1.25 1.25 0 00-2.1 0L4.02 16.76c-.67.87-.09 2.24 1.05 2.24z"
                    />
                  </svg>
                )}
                <p>
                  {isP2P
                    ? "P2P transfers to Zidwell users are instant. Please verify the recipient details before confirming."
                    : "Ensure you verify that the recipient is genuine as payments cannot be reversed after approval."}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Back
                </Button>
                <Button
                  onClick={onConfirm}
                  className={`${
                    isP2P 
                      ? "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800" 
                      : "bg-[#2b825b] hover:bg-[#236b49] dark:bg-[#2b825b] dark:hover:bg-[#1e5f43]"
                  } text-white`}
                >
                  {isP2P ? "Send to User" : "Make Payment"}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}