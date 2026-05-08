"use client";

import React from "react";
import { Check, Download } from "lucide-react";
import { Button } from "../ui/button";

type ReceiptType =
  | "general"
  | "product"
  | "service"
  | "bookings"
  | "rental"
  | "funds_transfer";

interface SellerInfo {
  name: string;
  phone: string;
  email: string;
}

interface ReceiverInfo {
  name: string;
  email?: string;
  phone?: string;
}

interface ReceiptItem {
  id: string;
  description: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
}

interface ReceiptPreviewProps {
  receiptType: ReceiptType;
  seller: SellerInfo;
  receiver: ReceiverInfo;
  items: ReceiptItem[];
  paymentMethod: string;
  sellerSignature: string;
  onLoadSavedSignature?: () => void;
  isProcessingPayment?: boolean;
}

const receiptTypeLabels: Record<ReceiptType, string> = {
  general: "General",
  product: "Product",
  service: "Service",
  bookings: "Bookings",
  rental: "Rental",
  funds_transfer: "Funds Transfer",
};

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  receiptType,
  seller,
  receiver,
  items,
  paymentMethod,
  sellerSignature,
  onLoadSavedSignature,
  isProcessingPayment = false,
}) => {
  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.amount || 0), 0);
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 sm:p-8 max-w-2xl mx-auto border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="text-center border-b border-gray-300 dark:border-gray-700 pb-6 mb-6">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-(--color-accent-yellow) dark:bg-(--color-accent-yellow) flex items-center justify-center">
            <span className="text-2xl font-bold text-white">Z</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {receiptTypeLabels[receiptType]} Receipt
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          #{`REC-${new Date().getFullYear()}-XXXX`}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Seller & Receiver Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Seller Info */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            From (Seller)
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <p className="font-medium text-gray-900 dark:text-white">
              {seller.name || "Not specified"}
            </p>
            {seller.email && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {seller.email}
              </p>
            )}
            {seller.phone && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {seller.phone}
              </p>
            )}
          </div>
        </div>

        {/* Receiver Info */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            To (Receiver)
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <p className="font-medium text-gray-900 dark:text-white">
              {receiver.name || "Not specified"}
            </p>
            {receiver.email && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {receiver.email}
              </p>
            )}
            {receiver.phone && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {receiver.phone}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Items / Services
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Qty
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Unit Price
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  className={
                    index % 2 === 0
                      ? "bg-white dark:bg-gray-900"
                      : "bg-gray-50 dark:bg-gray-800/30"
                  }
                >
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                    {item.description || "Item description"}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white">
                    {item.quantity || 1}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white">
                    ₦{formatCurrency(item.unitPrice || 0)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white font-medium">
                    ₦{formatCurrency(item.amount || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="border-t-2 border-(--color-accent-yellow) dark:border-(--color-accent-yellow) mt-4 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Total
            </span>
            <span className="text-2xl font-bold text-(--color-accent-yellow) dark:text-(--color-accent-yellow)">
              ₦{formatCurrency(calculateTotal())}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Payment Method
        </h2>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
            {paymentMethod || "Not specified"}
          </p>
        </div>
      </div>

      {/* Signatures */}
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Signatures
          </h2>
          {onLoadSavedSignature && (
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadSavedSignature}
              disabled={!!sellerSignature || isProcessingPayment}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs"
            >
              {sellerSignature ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Signature Loaded
                </>
              ) : (
                <>
                  <Download className="h-3 w-3 mr-1" />
                  Load Saved Signature
                </>
              )}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Seller Signature
            </h3>
            {sellerSignature ? (
              <div className="h-32 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 p-3 flex items-center justify-center">
                <img
                  src={sellerSignature}
                  alt="Seller signature"
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
                <span className="text-sm text-gray-400 dark:text-gray-500">
                  No signature yet
                </span>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Receiver Signature
            </h3>
            <div className="h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
              <span className="text-sm text-gray-400 dark:text-gray-500">
                Will be signed by receiver
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-6 border-t border-gray-300 dark:border-gray-700 mt-6">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          This is a live preview of your receipt. Changes in the form will
          update this preview in real-time.
        </p>
      </div>
    </div>
  );
};
