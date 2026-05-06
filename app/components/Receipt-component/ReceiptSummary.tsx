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
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onBack}
          />

          {/* Modal Container */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <div className="max-w-2xl w-full mx-auto bg-[var(--bg-primary)] rounded-2xl shadow-pop p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-[var(--border-color)] squircle-lg">
              {/* Header */}
              <div className="flex flex-col items-center border-b border-[var(--border-color)] pb-4">
                <div className="text-[var(--color-accent-yellow)] text-sm font-medium bg-[var(--color-accent-yellow)]/10 px-3 py-1 rounded-full">
                  ✓ Free - Included in Your Plan
                </div>
                <div className="text-3xl font-bold text-[var(--text-primary)] mt-2">
                  Receipt Preview
                </div>
                <div className="text-sm text-[var(--text-secondary)] mt-1">
                  Professional Receipt -{" "}
                  {receiptType.charAt(0).toUpperCase() + receiptType.slice(1)}{" "}
                  Type
                </div>
              </div>

              {/* RECEIPT DETAILS Section */}
              <div>
                <h3 className="text-[var(--text-secondary)] text-sm font-semibold mb-3">
                  Receipt Details
                </h3>
                <div className="bg-[var(--bg-secondary)] rounded-lg p-4 space-y-3 text-sm squircle-md">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Receipt Number</span>
                    <span className="text-[var(--text-primary)] font-medium">
                      {receiptData.receiptId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Issue Date</span>
                    <span className="text-[var(--text-primary)]">
                      {receiptData.issue_date}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Payment For</span>
                    <span className="text-[var(--text-primary)] text-right">
                      {receiptData.payment_for || "Not specified"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Receipt Type</span>
                    <span className="text-[var(--text-primary)] text-right">
                      {receiptType.charAt(0).toUpperCase() + receiptType.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* PARTIES INVOLVED Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FROM Section */}
                <div>
                  <h3 className="text-[var(--text-secondary)] text-sm font-semibold mb-2">
                    From (Seller)
                  </h3>
                  <div className="bg-[var(--bg-secondary)] rounded-lg p-3 space-y-2 text-sm squircle-md">
                    <div>
                      <span className="text-[var(--text-secondary)] block text-xs">Name</span>
                      <span className="text-[var(--text-primary)] font-medium">
                        {receiptData.from}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)] block text-xs">Email</span>
                      <span className="text-[var(--text-primary)]">{initiatorEmail}</span>
                    </div>
                    {sellerPhone && (
                      <div>
                        <span className="text-[var(--text-secondary)] block text-xs">Phone</span>
                        <span className="text-[var(--text-primary)]">{sellerPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* TO Section */}
                <div>
                  <h3 className="text-[var(--text-secondary)] text-sm font-semibold mb-2">
                    To (Receiver)
                  </h3>
                  <div className="bg-[var(--bg-secondary)] rounded-lg p-3 space-y-2 text-sm squircle-md">
                    <div>
                      <span className="text-[var(--text-secondary)] block text-xs">Customer Name</span>
                      <span className="text-[var(--text-primary)] font-medium">
                        {receiptData.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)] block text-xs">Email</span>
                      <span className="text-[var(--text-primary)]">
                        {receiptData.email || "Not provided"}
                      </span>
                    </div>
                    {receiverPhone && (
                      <div>
                        <span className="text-[var(--text-secondary)] block text-xs">Phone</span>
                        <span className="text-[var(--text-primary)]">{receiverPhone}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[var(--text-secondary)] block text-xs">Bill To</span>
                      <span className="text-[var(--text-primary)]">
                        {receiptData.bill_to || receiptData.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ITEMS SUMMARY */}
              <div>
                <h3 className="text-[var(--text-secondary)] text-sm font-semibold mb-2">
                  Items Summary
                </h3>
                <div className="bg-[var(--bg-secondary)] rounded-lg p-4 squircle-md">
                  <div className="space-y-2">
                    {receiptData.receipt_items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-[var(--text-primary)]">
                          {item.item} (Qty: {item.quantity})
                        </span>
                        <span className="text-[var(--text-primary)] font-medium">
                          ₦
                          {(
                            Number(item.quantity) * Number(item.price)
                          ).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[var(--border-color)] mt-3 pt-3 flex justify-between font-semibold">
                    <span className="text-[var(--text-primary)]">Total Amount</span>
                    <span className="text-[var(--color-accent-yellow)]">
                      ₦{totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* CUSTOMER NOTE */}
              {receiptData.customer_note && (
                <div>
                  <h3 className="text-[var(--text-secondary)] text-sm font-semibold mb-2">
                    Customer Note
                  </h3>
                  <div className="bg-[var(--bg-secondary)] rounded-lg p-3 text-sm squircle-md">
                    <p className="text-[var(--text-primary)]">{receiptData.customer_note}</p>
                  </div>
                </div>
              )}

              {/* Important Notes */}
              <div className="bg-[var(--color-lemon-green)]/10 border border-[var(--color-lemon-green)]/30 rounded-lg p-4 text-sm text-[var(--color-lemon-green)] flex items-start gap-3 squircle-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mt-0.5 text-[var(--color-lemon-green)] shrink-0"
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
              <div className="flex justify-between pt-4 border-t border-[var(--border-color)]">
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-md"
                >
                  Back to Edit
                </Button>
                <Button
                  onClick={onConfirm}
                  className="bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 px-8 squircle-md"
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