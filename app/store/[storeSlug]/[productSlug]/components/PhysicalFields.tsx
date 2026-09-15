// app/store/[storeSlug]/[productSlug]/components/PhysicalFields.tsx
"use client";

import { Label } from "@/app/components/ui/label";
import { PaymentOption } from "../utils/types";

interface Props {
  variants: any[];
  selectedVariantSku: string | null;
  setSelectedVariantSku: (sku: string) => void;
  lockedFields: boolean;
  pagePrice: number;
  selectedPaymentOption?: PaymentOption;
  installmentCount?: number;
  variantStockMap?: Record<string, number> | null;
}

export function PhysicalFields({
  variants,
  selectedVariantSku,
  setSelectedVariantSku,
  lockedFields,
  pagePrice,
  selectedPaymentOption = "full",
  installmentCount = 1,
  variantStockMap = null,
}: Props) {
  if (variants.length === 0) return null;

  const isInstallment =
    selectedPaymentOption === "installment" && installmentCount > 1;

  return (
    <div className="mt-6">
      <Label className="mb-2 block text-sm font-medium">
        {lockedFields ? "Your variant" : "Select variant"}
      </Label>

      {isInstallment && (
        <p className="mb-3 text-xs text-foreground/50">
          Prices shown are per payment ({installmentCount} payments total)
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {variants.map((v: any, idx: number) => {
          const sku = v.sku || v.name || `variant-${idx}`;
          const selected = selectedVariantSku === sku;

          const fullPrice = Number(v.price) || pagePrice || 0;
          const perPayment = isInstallment
            ? Math.round((fullPrice / installmentCount) * 100) / 100
            : fullPrice;

          let remaining: number | null = null;

          if (variantStockMap && sku in variantStockMap) {
            const m = Number(variantStockMap[sku]);
            // Infinity = unlimited
            if (Number.isFinite(m)) remaining = m;
            else if (m === Infinity) remaining = null;
            else remaining = null;
          } else {
            const raw = v.stock;
            const parsed = raw != null && raw !== "" ? Number(raw) : NaN;
            remaining =
              Number.isFinite(parsed) && parsed > 0 ? parsed : null;
          }

          const isUnlimited = remaining === null;
          const isSoldOut = !isUnlimited && remaining <= 0;

          return (
            <button
              key={sku}
              type="button"
              onClick={() => {
                if (lockedFields || isSoldOut) return;
                setSelectedVariantSku(sku);
              }}
              disabled={lockedFields || isSoldOut}
              className={`rounded-xl border p-3 text-center transition ${
                isSoldOut
                  ? "cursor-not-allowed border-border opacity-50"
                  : selected
                  ? "border-[#FDC020] bg-[#FDC020]/5"
                  : "border-border hover:border-[#FDC020]/60"
              } ${
                lockedFields && !selected && !isSoldOut ? "opacity-40" : ""
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  isSoldOut ? "line-through text-foreground/40" : ""
                }`}
              >
                {v.name}
              </p>

              <p className="mt-1 text-sm text-foreground/60">
                ₦{perPayment.toLocaleString()}
                {isInstallment && (
                  <span className="ml-1 text-xs text-foreground/40">
                    / payment
                  </span>
                )}
              </p>

              {isSoldOut ? (
                <p className="mt-1 text-xs font-medium text-red-500">
                  Out of stock
                </p>
              ) : (
                !isUnlimited && (
                  <p className="mt-1 text-xs text-foreground/40">
                    {remaining} left
                  </p>
                )
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}