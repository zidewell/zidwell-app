"use client";

import React from "react";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "framer-motion";


// Types
type ReceiptType =
  | "general"
  | "product"
  | "service"
  | "bookings"
  | "rental"
  | "funds_transfer";

interface ReceiptSummaryItem {
  item: string;
  quantity: string | number;
  price: string | number;
}

interface ReceiptSummaryProps {
  receiptData: {
    name: string;
    email: string;
    receiptId: string;
    bill_to: string;
    from: string;
    issue_date: string;
    customer_note: string;
    payment_for: string;
    receipt_items: ReceiptSummaryItem[];
  };
  totalAmount: number;
  initiatorName: string;
  initiatorEmail: string;
  amount: number;
  confirmReceipt: boolean;
  onBack: () => void;
  onConfirm: () => void;
  receiptType: string;
  sellerPhone?: string;
  receiverPhone?: string;
}

export const ReceiptSummary: React.FC<ReceiptSummaryProps> = ({
  receiptData,
  totalAmount,
  initiatorName,
  initiatorEmail,
  amount,
  confirmReceipt,
  onBack,
  onConfirm,
  receiptType,
  sellerPhone,
  receiverPhone,
}) => {
  
  return (
    <AnimatePresence>
      {confirmReceipt && (
        <>
          {/* 🔲 Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onBack}
          />

          {/* 📄 Modal Container */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <div className="max-w-2xl w-full mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex flex-col items-center border-b dark:border-gray-700 pb-4">
                <div className="text-primary dark:text-primary text-sm font-medium bg-primary-light-bg dark:bg-primary-light-bg px-3 py-1 rounded-full">
                  ✓ Free - Included in Your Plan
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  Receipt Preview
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Professional Receipt -{" "}
                  {receiptType.charAt(0).toUpperCase() + receiptType.slice(1)}{" "}
                  Type
                </div>
              </div>

              {/* RECEIPT DETAILS Section */}
              <div>
                <h3 className="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-3">
                  Receipt Details
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Receipt Number</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {receiptData.receiptId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Issue Date</span>
                    <span className="text-gray-900 dark:text-white">
                      {receiptData.issue_date}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Payment For</span>
                    <span className="text-gray-900 dark:text-white text-right">
                      {receiptData.payment_for || "Not specified"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Receipt Type</span>
                    <span className="text-gray-900 dark:text-white text-right">
                      {receiptType.charAt(0).toUpperCase() + receiptType.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* PARTIES INVOLVED Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FROM Section */}
                <div>
                  <h3 className="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">
                    From (Seller)
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">Name</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {receiptData.from}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">Email</span>
                      <span className="text-gray-900 dark:text-white">{initiatorEmail}</span>
                    </div>
                    {sellerPhone && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block text-xs">
                          Phone
                        </span>
                        <span className="text-gray-900 dark:text-white">{sellerPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* TO Section */}
                <div>
                  <h3 className="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">
                    To (Receiver)
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">
                        Customer Name
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {receiptData.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">Email</span>
                      <span className="text-gray-900 dark:text-white">
                        {receiptData.email || "Not provided"}
                      </span>
                    </div>
                    {receiverPhone && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block text-xs">
                          Phone
                        </span>
                        <span className="text-gray-900 dark:text-white">{receiverPhone}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">
                        Bill To
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {receiptData.bill_to || receiptData.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ITEMS SUMMARY */}
              <div>
                <h3 className="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">
                  Items Summary
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <div className="space-y-2">
                    {receiptData.receipt_items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">
                          {item.item} (Qty: {item.quantity})
                        </span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          ₦
                          {(
                            Number(item.quantity) * Number(item.price)
                          ).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t dark:border-gray-700 mt-3 pt-3 flex justify-between font-semibold">
                    <span className="text-gray-700 dark:text-gray-300">Total Amount</span>
                    <span className="text-gray-900 dark:text-white">
                      ₦{totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* CUSTOMER NOTE */}
              {receiptData.customer_note && (
                <div>
                  <h3 className="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">
                    Customer Note
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-sm">
                    <p className="text-gray-700 dark:text-gray-300">{receiptData.customer_note}</p>
                  </div>
                </div>
              )}

              {/* Important Notes */}
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 text-sm text-green-700 dark:text-green-300 flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mt-0.5 text-green-500 dark:text-green-400 shrink-0"
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
                <div className="space-y-1">
                  <p className="font-medium">Free Receipt Creation</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>This receipt is included in your current plan</li>
                    <li>No additional charges apply</li>
                    <li>Once sent, the receipt cannot be edited</li>
                    <li>Customer will receive a professional PDF receipt</li>
                  </ul>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-between pt-4 border-t dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Back to Edit
                </Button>
                <Button
                  onClick={onConfirm}
                  className="bg-primary hover:bg-primary-dark text-white px-8"
                >
                  Generate Receipt
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};