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
  /** ✅ Optional: called when the buyer wants to abort a stuck checkout */
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
    <div className="mt-6 border-t border-border pt-6">
      <Button
        onClick={onClick}
        disabled={disabled}
        className={`w-full rounded-full py-6 text-base font-semibold transition ${
          disabled
            ? "bg-muted text-foreground/40 cursor-not-allowed"
            : `${PRIMARY_BG} ${PRIMARY_TEXT} ${PRIMARY_BG_HOVER}`
        }`}
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing
          </>
        ) : isOutOfStock ? (
          <>
            <AlertTriangle className="mr-2 h-5 w-5" /> Out of stock
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-5 w-5" />
            {isDonation
              ? `Donate ₦${(Number(donorAmount) || 0).toLocaleString()}`
              : showQuantity && quantity > 1
              ? `Pay ₦${currentTotalAmount.toLocaleString()} for ${quantity} items`
              : `Pay ₦${currentTotalAmount.toLocaleString()}`}
          </>
        )}
      </Button>

      {/* ✅ Cancel button — only shows while a checkout is in progress */}
      {processing && onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-foreground/60 hover:text-foreground transition-colors"
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
    </div>
  );
}