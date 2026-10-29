// app/store/[storeSlug]/[productSlug]/components/PhysicalFields.tsx
"use client";

import { Minus, Plus } from "lucide-react";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/lib/utils";

interface VariantLike {
  sku?: string;
  name?: string;
  price?: number | string;
  stock?: number | string | null;
  image?: string | null;
}

interface Props {
  variants: VariantLike[];
  selectedVariantSkus: Set<string>;
  variantQuantities: Record<string, number>;
  onToggleVariant: (sku: string) => void;
  onSetQuantity: (sku: string, qty: number) => void;
  lockedFields?: boolean;
  pagePrice?: number;
  selectedPaymentOption?: "full" | "installment";
  installmentCount?: number;
  variantStockMap?: Record<string, number> | null;
}

function remainingFor(
  variantStockMap: Record<string, number> | null | undefined,
  sku: string,
): number | null {
  if (!variantStockMap || !(sku in variantStockMap)) return null;
  const n = Number(variantStockMap[sku]);
  if (!Number.isFinite(n)) return 0;
  if (n === Infinity) return null;
  return n;
}

export function PhysicalFields({
  variants,
  selectedVariantSkus,
  variantQuantities,
  onToggleVariant,
  onSetQuantity,
  lockedFields = false,
  pagePrice = 0,
  selectedPaymentOption = "full",
  installmentCount = 1,
  variantStockMap = null,
}: Props) {
  if (!variants || variants.length === 0) return null;

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <Label className="text-sm font-medium">
          Choose your {variants.length > 1 ? "options" : "option"}
        </Label>
        <span className="text-xs text-foreground/50">
          {selectedVariantSkus.size} selected
        </span>
      </div>

      <div className="space-y-3">
        {variants.map((v, i) => {
          const sku = v.sku || v.name || `variant-${i}`;
          const label = v.name || sku;
          const unitPrice = Number(v.price) || pagePrice || 0;
          const isSelected = selectedVariantSkus.has(sku);
          const remaining = remainingFor(variantStockMap, sku);
          const isSoldOut = remaining !== null && remaining <= 0;
          const qty = Math.max(1, variantQuantities[sku] || 1);
          const maxQty = remaining ?? Infinity;

          const perUnit =
            selectedPaymentOption === "full"
              ? unitPrice
              : unitPrice / Math.max(1, installmentCount);

          return (
            <div
              key={sku}
              className={cn(
                "rounded-2xl border p-4 transition-colors",
                isSelected
                  ? "border-[#FDC020] bg-[#FDC020]/5"
                  : "border-border bg-background hover:border-foreground/30",
                isSoldOut && "opacity-60",
              )}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => !lockedFields && !isSoldOut && onToggleVariant(sku)}
                  disabled={lockedFields || isSoldOut}
                  aria-pressed={isSelected}
                  className={cn(
                    "mt-1 h-5 w-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors",
                    isSelected
                      ? "border-[#FDC020] bg-[#FDC020]"
                      : "border-border bg-background",
                    (lockedFields || isSoldOut) && "cursor-not-allowed",
                  )}
                >
                  {isSelected && (
                    <svg
                      viewBox="0 0 12 12"
                      className="h-3 w-3 text-black"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M2 6.5L4.5 9L10 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm">{label}</span>
                    {isSoldOut ? (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                        Sold out
                      </Badge>
                    ) : remaining !== null ? (
                      <Badge className="bg-muted text-foreground/70 hover:bg-muted">
                        {remaining} left
                      </Badge>
                    ) : (
                      <Badge className="bg-muted text-foreground/70 hover:bg-muted">
                        In stock
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-foreground/70">
                    ₦{perUnit.toLocaleString()}
                    {selectedPaymentOption === "installment" && (
                      <span className="text-xs text-foreground/50">
                        {" "}
                        per payment
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Quantity control (only when selected) */}
              {isSelected && !isSoldOut && (
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-foreground/60">Quantity</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onSetQuantity(sku, Math.max(1, qty - 1))
                      }
                      disabled={lockedFields || qty <= 1}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors",
                        (lockedFields || qty <= 1) &&
                          "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = qty + 1;
                        if (maxQty !== Infinity && next > maxQty) return;
                        onSetQuantity(sku, next);
                      }}
                      disabled={lockedFields || qty >= maxQty}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors",
                        (lockedFields || qty >= maxQty) &&
                          "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}