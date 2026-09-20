// app/store/[storeSlug]/[productSlug]/components/CheckoutButton.tsx
"use client";

import { CreditCard, Loader2, AlertTriangle, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  PRIMARY_BG,
  PRIMARY_BG_HOVER,
  PRIMARY_TEXT,
} from "../utils/helpers";

interface Props {
  onClick: () => void;
  disabled: boolean;
  processing: boolean;
  isOutOfStock: boolean;
  isDonation: boolean;
  donorAmount: string;
  showQuantity: boolean;
  quantity: number;
  currentTotalAmount: number;
  disabledReason: string;
  onCancel?: () => void;
}

export function CheckoutButton({
  onClick,
  disabled,
  processing,
  isOutOfStock,
  isDonation,
  donorAmount,
  showQuantity,
  quantity,
  currentTotalAmount,
  disabledReason,
  onCancel,
}: Props) {
  return (
    <>
      <Button
        onClick={onClick}
        disabled={disabled}
        className={`h-11 w-full rounded-2xl px-5 text-sm font-semibold transition ${
          disabled
            ? "bg-muted text-foreground/40 cursor-not-allowed"
            : `${PRIMARY_BG} ${PRIMARY_TEXT} ${PRIMARY_BG_HOVER}`
        }`}
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing
          </>
        ) : isOutOfStock ? (
          <>
            <AlertTriangle className="mr-2 h-4 w-4" /> Out of stock
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            {isDonation
              ? `Donate ₦${(Number(donorAmount) || 0).toLocaleString()}`
              : showQuantity && quantity > 1
              ? `Pay ₦${currentTotalAmount.toLocaleString()} for ${quantity} items`
              : `Pay ₦${currentTotalAmount.toLocaleString()}`}
          </>
        )}
      </Button>

      {processing && onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs font-medium text-foreground/60 transition-colors hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Cancel checkout
        </button>
      )}

      {disabled && !processing && (
        <p className="mt-2 text-center text-xs text-foreground/50">
          {disabledReason}
        </p>
      )}
    </>
  );
}