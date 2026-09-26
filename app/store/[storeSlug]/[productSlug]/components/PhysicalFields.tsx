// app/store/[storeSlug]/[productSlug]/components/PhysicalFields.tsx
"use client";

import { memo, useCallback } from "react";
import { Label } from "@/app/components/ui/label";
import { Minus, Plus, Check } from "lucide-react";
import { PaymentOption } from "../utils/types";

interface Props {
  variants: any[];
  selectedVariantSkus: Set<string>;
  variantQuantities: Record<string, number>;
  onToggleVariant: (sku: string) => void;
  onSetQuantity: (sku: string, qty: number) => void;
  lockedFields: boolean;
  pagePrice: number;
  selectedPaymentOption?: PaymentOption;
  installmentCount?: number;
  variantStockMap?: Record<string, number> | null;
}

interface TileProps {
  sku: string;
  name: string;
  isSelected: boolean;
  qty: number;
  perPayment: number;
  isInstallment: boolean;
  isSoldOut: boolean;
  isUnlimited: boolean;
  remaining: number | null;
  maxQty: number;
  lockedFields: boolean;
  onToggle: (sku: string) => void;
  onSetQty: (sku: string, qty: number) => void;
}

const VariantTile = memo(function VariantTile({
  sku,
  name,
  isSelected,
  qty,
  perPayment,
  isInstallment,
  isSoldOut,
  isUnlimited,
  remaining,
  maxQty,
  lockedFields,
  onToggle,
  onSetQty,
}: TileProps) {
  const handleToggle = useCallback(() => {
    if (lockedFields || isSoldOut) return;
    onToggle(sku);
  }, [lockedFields, isSoldOut, onToggle, sku]);

  const handleDec = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSetQty(sku, Math.max(1, qty - 1));
    },
    [onSetQty, sku, qty]
  );

  const handleInc = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSetQty(sku, Math.min(maxQty, qty + 1));
    },
    [onSetQty, sku, qty, maxQty]
  );

  return (
    <div
      className={`relative flex flex-col rounded-xl border transition ${
        isSoldOut
          ? "border-border opacity-50 cursor-not-allowed"
          : isSelected
          ? "border-[#FDC020] bg-[#FDC020]/5"
          : "border-border hover:border-[#FDC020]/60 cursor-pointer"
      }`}
    >
      {/* Checkbox — decorative only */}
      {!isSoldOut && !lockedFields && (
        <span
          className={`pointer-events-none absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-md border transition ${
            isSelected
              ? "border-[#FDC020] bg-[#FDC020]"
              : "border-border bg-background"
          }`}
        >
          {isSelected && (
            <Check className="h-3.5 w-3.5 text-[#191919]" strokeWidth={3} />
          )}
        </span>
      )}

      {/* Toggle area */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={lockedFields || isSoldOut}
        aria-pressed={isSelected}
        aria-label={`${isSelected ? "Remove" : "Add"} ${name}`}
        className="flex flex-1 flex-col items-start p-3 pr-10 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FDC020] focus-visible:ring-offset-1 focus-visible:ring-offset-background rounded-xl disabled:cursor-not-allowed"
      >
        <p
          className={`w-full truncate text-sm font-medium ${
            isSoldOut ? "line-through text-foreground/40" : ""
          }`}
          title={name}
        >
          {name}
        </p>
        <p className="mt-1 text-sm font-semibold text-foreground/80">
          ₦{perPayment.toLocaleString()}
          {isInstallment && (
            <span className="ml-1 text-xs font-normal text-foreground/40">
              /pay
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-foreground/40">
          {isSoldOut
            ? "Sold out"
            : isUnlimited
            ? "In stock"
            : `${remaining} left`}
        </p>
      </button>

      {/* Quantity stepper — separate from toggle button */}
      {isSelected && !isSoldOut && (
        <div className="flex items-center justify-between border-t border-[#FDC020]/20 px-2 py-1.5">
          <button
            type="button"
            disabled={lockedFields || qty <= 1}
            onClick={handleDec}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label={`Decrease ${name} quantity`}
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="text-xs font-medium tabular-nums">{qty}</span>
          <button
            type="button"
            disabled={lockedFields || qty >= maxQty}
            onClick={handleInc}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label={`Increase ${name} quantity`}
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
});

export function PhysicalFields({
  variants,
  selectedVariantSkus,
  variantQuantities,
  onToggleVariant,
  onSetQuantity,
  lockedFields,
  pagePrice,
  selectedPaymentOption = "full",
  installmentCount = 1,
  variantStockMap = null,
}: Props) {
  const selected = selectedVariantSkus ?? new Set<string>();
  const quantities = variantQuantities ?? {};

  if (variants.length === 0) return null;

  const isInstallment =
    selectedPaymentOption === "installment" && installmentCount > 1;

  const remainingFor = (sku: string): number | null => {
    if (variantStockMap && sku in variantStockMap) {
      const n = Number(variantStockMap[sku]);
      if (n === Infinity) return null;
      return Number.isFinite(n) ? n : 0;
    }
    return null;
  };

  // Detect a saved selection that no longer matches any live variant
  const hasOrphanedSavedSelection =
    lockedFields &&
    selected.size > 0 &&
    !variants.some((v: any, i: number) => {
      const sku = v.sku || v.name || `variant-${i}`;
      return selected.has(sku);
    });

  const showEmptySavedSelection =
    lockedFields && selected.size === 0;

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <Label className="block text-sm font-medium">
          {lockedFields ? "Your selection" : "Select variants"}
        </Label>
        {!lockedFields && selected.size > 0 && (
          <span className="text-xs text-foreground/50">
            {selected.size} selected
          </span>
        )}
      </div>

      {isInstallment && (
        <p className="mb-3 text-xs text-foreground/50">
          Prices shown are per payment ({installmentCount} payments total)
        </p>
      )}

      {!lockedFields && variants.length > 1 && (
        <p className="mb-3 text-xs text-foreground/50">
          Tap a variant to add or remove it. Mix and match freely.
        </p>
      )}

      {/* ─── Saved selection no longer available ─── */}
      {(showEmptySavedSelection || hasOrphanedSavedSelection) && (
        <p className="mb-3 text-xs text-red-500">
          Your saved selection is no longer available. Please contact the store.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {variants.map((v: any, idx: number) => {
          const sku = v.sku || v.name || `variant-${idx}`;
          const isSelected = selected.has(sku);
          const qty = quantities[sku] || 1;

          const fullPrice = Number(v.price) || pagePrice || 0;
          const perPayment = isInstallment
            ? Math.round((fullPrice / installmentCount) * 100) / 100
            : fullPrice;

          const remaining = remainingFor(sku);
          const isUnlimited = remaining === null;
          const isSoldOut = !isUnlimited && remaining <= 0;
          const maxQty = isUnlimited ? 99 : remaining;

          return (
            <VariantTile
              key={sku}
              sku={sku}
              name={v.name || sku}
              isSelected={isSelected}
              qty={qty}
              perPayment={perPayment}
              isInstallment={isInstallment}
              isSoldOut={isSoldOut}
              isUnlimited={isUnlimited}
              remaining={remaining}
              maxQty={maxQty}
              lockedFields={lockedFields}
              onToggle={onToggleVariant}
              onSetQty={onSetQuantity}
            />
          );
        })}
      </div>
    </div>
  );
}