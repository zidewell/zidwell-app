"use client";

import React from "react";

export type ReceiptType =
  | "general"
  | "product"
  | "service"
  | "bookings"
  | "rental"
  | "funds_transfer";

const receiptTypeLabels: Record<ReceiptType, string> = {
  general: "General",
  product: "Product",
  service: "Service",
  bookings: "Bookings",
  rental: "Rental",
  funds_transfer: "Funds Transfer",
};

const receiptTypeIcons: Record<ReceiptType, string> = {
  general: "📄",
  product: "🛒",
  service: "🔧",
  bookings: "📅",
  rental: "🏠",
  funds_transfer: "💰",
};

interface ReceiptTypeSelectorProps {
  value: ReceiptType;
  onChange: (value: ReceiptType) => void;
  disabled?: boolean;
}

export const ReceiptTypeSelector: React.FC<ReceiptTypeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const receiptTypes: ReceiptType[] = [
    "general",
    "product",
    "service",
    "bookings",
    "rental",
    "funds_transfer",
  ];

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">
        Receipt Type
      </label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {receiptTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => !disabled && onChange(type)}
            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all duration-200 ${
              value === type
                ? "border-[#2b825b] bg-[#2b825b]/10 shadow-sm"
                : "border-border bg-card hover:border-[#2b825b]/50 hover:bg-secondary"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={disabled}
          >
            <span className="text-2xl">{receiptTypeIcons[type]}</span>
            <span className="text-xs font-medium text-center text-foreground">
              {receiptTypeLabels[type]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
