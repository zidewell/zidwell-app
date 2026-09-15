// app/store/[storeSlug]/[productSlug]/components/QuantityPicker.tsx
"use client";

import { Minus, Plus, Lock } from "lucide-react";

interface Props {
  quantity: number;
  setQuantity: (n: number) => void;
  productStock: number | null;
  lockedFields: boolean;
}

export function QuantityPicker({
  quantity,
  setQuantity,
  productStock,
  lockedFields,
}: Props) {
  return (
    <div className="mt-6 border-y border-border py-4">
      <div className="flex items-center">
        <span className="mr-4 text-sm font-medium text-foreground/70">
          Quantity
        </span>
        <div className="flex items-center rounded-full border border-border px-3 py-1.5">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            aria-label="Decrease quantity"
            disabled={quantity <= 1 || lockedFields}
            className="disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Minus size={14} />
          </button>
          <span className="min-w-10 text-center text-sm font-medium">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => {
              const next = quantity + 1;
              if (productStock !== null && next > productStock) return;
              setQuantity(next);
            }}
            aria-label="Increase quantity"
            disabled={
              lockedFields ||
              (productStock !== null && quantity >= productStock)
            }
            className="disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus size={14} />
          </button>
        </div>
        {lockedFields && (
          <span className="ml-3 inline-flex items-center gap-1 text-xs text-foreground/50">
            <Lock className="h-3 w-3" />
            Locked
          </span>
        )}
        {productStock !== null && !lockedFields && (
          <span className="ml-auto text-xs text-foreground/50">
            Max {productStock}
          </span>
        )}
      </div>
    </div>
  );
}