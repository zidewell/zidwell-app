// app/store/[storeSlug]/[productSlug]/components/PhysicalFields.tsx
"use client";

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

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <Label className="block text-sm font-medium">
          {lockedFields ? "Your selection" : "Select variants"}
        </Label>
        {!lockedFields && selectedVariantSkus.size > 0 && (
          <span className="text-xs text-foreground/50">
            {selectedVariantSkus.size} selected
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

      <div className="space-y-2">
        {variants.map((v: any, idx: number) => {
          const sku = v.sku || v.name || `variant-${idx}`;
          const selected = selectedVariantSkus.has(sku);
          const qty = variantQuantities[sku] || 1;

          const fullPrice = Number(v.price) || pagePrice || 0;
          const perPayment = isInstallment
            ? Math.round((fullPrice / installmentCount) * 100) / 100
            : fullPrice;

          const remaining = remainingFor(sku);
          const isUnlimited = remaining === null;
          const isSoldOut = !isUnlimited && remaining <= 0;
          const maxQty = isUnlimited ? 99 : remaining;

          return (
            <div
              key={sku}
              className={`rounded-xl border transition ${
                isSoldOut
                  ? "border-border opacity-50"
                  : selected
                  ? "border-[#FDC020] bg-[#FDC020]/5"
                  : "border-border hover:border-[#FDC020]/60"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  if (lockedFields || isSoldOut) return;
                  onToggleVariant(sku);
                }}
                disabled={lockedFields || isSoldOut}
                className="flex w-full items-center gap-3 p-3 text-left"
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                    selected
                      ? "border-[#FDC020] bg-[#FDC020]"
                      : "border-border bg-transparent"
                  }`}
                >
                  {selected && (
                    <Check
                      className="h-3.5 w-3.5 text-[#191919]"
                      strokeWidth={3}
                    />
                  )}
                </span>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      isSoldOut ? "line-through text-foreground/40" : ""
                    }`}
                    title={v.name}
                  >
                    {v.name}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground/60">
                    ₦{perPayment.toLocaleString()}
                    {isInstallment && (
                      <span className="ml-1 text-foreground/40">
                        / payment
                      </span>
                    )}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  {isSoldOut ? (
                    <p className="text-xs font-medium text-red-500">
                      Sold out
                    </p>
                  ) : isUnlimited ? (
                    <p className="text-xs text-foreground/40">In stock</p>
                  ) : (
                    <p className="text-xs text-foreground/40">
                      {remaining} left
                    </p>
                  )}
                </div>
              </button>

              {selected && !isSoldOut && (
                <div className="flex items-center justify-between border-t border-[#FDC020]/20 px-3 py-2">
                  <span className="text-xs text-foreground/60">Quantity</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={lockedFields || qty <= 1}
                      onClick={() => onSetQuantity(sku, Math.max(1, qty - 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-[2rem] text-center text-sm font-medium tabular-nums">
                      {qty}
                    </span>
                    <button
                      type="button"
                      disabled={lockedFields || qty >= maxQty}
                      onClick={() =>
                        onSetQuantity(sku, Math.min(maxQty, qty + 1))
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Increase quantity"
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