// app/components/payment-page-components/PhysicalFields.tsx
"use client";

import { Plus, X, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Switch } from "@/app/components/ui/switch";
import type { Variant } from "@/app/hooks/useStore";

interface Props {
  variants: Variant[];
  setVariants: (v: Variant[]) => void;
  requiresShipping: boolean;
  setRequiresShipping: (v: boolean) => void;
  stock: number | null;
  setStock: (v: number | null) => void;
  allowMultiple: boolean;
  setAllowMultiple: (v: boolean) => void;
  /** Page price — used to pre-fill new variants and warn on drift */
  pagePrice?: number;
}

const PhysicalFields = ({
  variants,
  setVariants,
  requiresShipping,
  setRequiresShipping,
  stock,
  setStock,
  allowMultiple,
  setAllowMultiple,
  pagePrice = 0,
}: Props) => {
  const hasVariants = variants.length > 0;

  // ─────────────────────────────────────────────────────────────────────
  // INVENTORY MATH
  // Only a POSITIVE stock number is a real cap. Anything else (null,
  // undefined, "", 0, negative) is treated as unlimited.
  // ─────────────────────────────────────────────────────────────────────
 const variantStockValues = variants
  .map((v) => {
    const raw = v?.stock as unknown;
    if (raw == null) return null;
    const trimmed = String(raw).trim();
    if (trimmed === "") return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  })
  .filter((n): n is number => n !== null);

  const variantSum = variantStockValues.reduce((s, n) => s + n, 0);

  const hasRealPageStock = stock !== null && Number(stock) > 0;
  const allVariantsCounted = variantStockValues.length === variants.length;
  const someVariantsCounted = variantStockValues.length > 0;

  const overAllocated =
    hasVariants &&
    hasRealPageStock &&
    allVariantsCounted &&
    variantSum > Number(stock);

  const mixedAllocation =
    hasVariants &&
    hasRealPageStock &&
    someVariantsCounted &&
    !allVariantsCounted;

  const underAllocated =
    hasVariants &&
    hasRealPageStock &&
    allVariantsCounted &&
    variantSum < Number(stock);

  const allocationBalanced =
    hasVariants &&
    hasRealPageStock &&
    allVariantsCounted &&
    variantSum === Number(stock);

  // ─────────────────────────────────────────────────────────────────────
  // ADD VARIANT
  // Pre-fill price with the page price and stock with `undefined`
  // (unlimited). The merchant can override both afterward.
  // ─────────────────────────────────────────────────────────────────────
  const addVariant = () => {
    const isFirstVariant = variants.length === 0;
    const suggestedStock =
      isFirstVariant && hasRealPageStock ? Number(stock) : undefined;

    setVariants([
      ...variants,
      {
        name: "",
        price: Number(pagePrice) || 0,
        sku: "",
        stock: suggestedStock as any,
      },
    ]);
  };

  const updateVariant = (i: number, patch: Partial<Variant>) => {
    const updated = [...variants];
    updated[i] = { ...updated[i], ...patch };
    setVariants(updated);
  };

  const removeVariant = (i: number) =>
    setVariants(variants.filter((_, idx) => idx !== i));

  const hasPriceDrift = (v: Variant): boolean => {
    const variantPrice = Number(v.price) || 0;
    const basePrice = Number(pagePrice) || 0;
    if (variantPrice <= 0 || basePrice <= 0) return false;
    const ratio = variantPrice / basePrice;
    return ratio < 0.2 || ratio > 5;
  };

  // ✅ Display helper: treat 0 / null / undefined / NaN as empty,
  // so the input can be cleared and doesn't get stuck on "0".
  const priceDisplayValue = (v: Variant): string | number => {
    const p = v?.price;
    if (p === 0 || p === null || p === undefined) return "";
    const n = Number(p);
    return Number.isFinite(n) && n !== 0 ? n : "";
  };

const stockDisplayValue = (v: Variant): string | number => {
  const s = v?.stock as unknown;
  if (s === 0 || s === null || s === undefined) return "";
  if (String(s).trim() === "") return "";
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : "";
};

  return (
    <div className="space-y-6">
      {/* ─── Product Stock (only when no variants) ─── */}
      {!hasVariants && (
        <div className="p-4 rounded-xl border border-(--border-color) bg-(--bg-primary)">
          <div className="flex items-start gap-2 mb-3">
            <Info className="h-4 w-4 text-(--color-accent-yellow) mt-0.5 shrink-0" />
            <div>
              <Label className="text-sm font-bold text-(--text-primary)">
                Available Quantity
              </Label>
              <p className="text-xs text-(--text-secondary) mt-0.5">
                How many units do you have in stock? Leave empty for unlimited.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={0}
              value={stock === null ? "" : stock}
              onChange={(e) => {
                const val = e.target.value;
                setStock(val === "" ? null : Math.max(0, parseInt(val) || 0));
              }}
              placeholder="e.g. 50 (leave empty for unlimited)"
              className="flex-1 h-11 text-sm border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
            />
            {stock !== null && (
              <button
                type="button"
                onClick={() => setStock(null)}
                className="text-xs text-(--text-secondary) hover:text-(--text-primary) underline whitespace-nowrap"
              >
                Unlimited
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {[1, 5, 10, 50, 100].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStock(n)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                  stock === n
                    ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)/10 text-(--color-accent-yellow)"
                    : "border-(--border-color) text-(--text-secondary) hover:border-(--color-accent-yellow)/50"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Allow multiple ─── */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-(--border-color) bg-(--bg-primary)">
        <div className="pr-4">
          <Label className="text-sm font-bold text-(--text-primary)">
            Allow buying multiple units
          </Label>
          <p className="text-xs text-(--text-secondary) mt-1">
            {allowMultiple
              ? "Buyers can pick quantity (e.g. 3 bags at once)"
              : "Buyers pay for exactly 1 unit at a time"}
          </p>
        </div>
        <Switch
          checked={allowMultiple}
          onCheckedChange={setAllowMultiple}
          className="data-[state=checked]:bg-(--color-accent-yellow)"
        />
      </div>

      {/* ─── Variants ─── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Label className="text-sm font-semibold text-(--text-primary)">
            Product Variants
          </Label>
          <span className="text-xs text-(--text-secondary)">
            (optional — e.g. Size, Color)
          </span>
        </div>
        <p className="text-xs text-(--text-secondary) mb-3">
          If you have variants (like S/M/L), each variant gets its own stock.
          Otherwise, the product itself is the single item for sale.
        </p>

        {/* ✅ Inventory Summary Card — only when variants exist */}
        {hasVariants && (
          <div
            className={`mb-4 rounded-xl border p-4 ${
              overAllocated
                ? "border-red-500/40 bg-red-500/5"
                : allocationBalanced
                ? "border-green-500/40 bg-green-500/5"
                : underAllocated || mixedAllocation
                ? "border-yellow-500/40 bg-yellow-500/5"
                : "border-(--border-color) bg-(--bg-secondary)/40"
            }`}
          >
            <div className="flex items-start gap-2 mb-3">
              {overAllocated ? (
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              ) : allocationBalanced ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              ) : (
                <Info className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-sm font-bold text-(--text-primary)">
                  Inventory Summary
                </p>

                <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-(--text-secondary)">Page stock</p>
                    <p className="font-bold text-(--text-primary)">
                      {hasRealPageStock ? Number(stock) : "Unlimited"}
                    </p>
                  </div>
                  <div>
                    <p className="text-(--text-secondary)">
                      Total across variants
                    </p>
                    <p className="font-bold text-(--text-primary)">
                      {allVariantsCounted
                        ? variantSum
                        : mixedAllocation
                        ? `${variantSum} + unlimited`
                        : "Unlimited"}
                    </p>
                  </div>
                </div>

                {overAllocated && (
                  <p className="mt-3 text-xs font-medium text-red-700 dark:text-red-400">
                    Your variants add up to{" "}
                    <strong>{variantSum}</strong>, but you only have{" "}
                    <strong>{Number(stock)}</strong> in stock. Reduce the
                    variant stocks or raise the page stock.
                  </p>
                )}

                {underAllocated && (
                  <p className="mt-3 text-xs font-medium text-yellow-700 dark:text-yellow-400">
                    Variants add up to <strong>{variantSum}</strong>, but you
                    set <strong>{Number(stock)}</strong> in page stock.{" "}
                    <strong>
                      {Number(stock) - variantSum} unit
                      {Number(stock) - variantSum === 1 ? "" : "s"}
                    </strong>{" "}
                    aren't assigned to any variant.
                  </p>
                )}

                {mixedAllocation && (
                  <p className="mt-3 text-xs font-medium text-yellow-700 dark:text-yellow-400">
                    Some variants have a fixed stock and others are unlimited.
                    Buyers will see caps on the fixed ones.
                  </p>
                )}

                {allocationBalanced && (
                  <p className="mt-3 text-xs font-medium text-green-700 dark:text-green-400">
                    {variantSum} unit{variantSum === 1 ? "" : "s"} allocated
                    across {variants.length} variant
                    {variants.length === 1 ? "" : "s"}. Looks good.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {variants.map((v, vi) => {
            const driftWarning = hasPriceDrift(v);

            return (
              <div
                key={vi}
                className="p-4 rounded-xl border border-(--border-color) bg-(--bg-secondary)/30 space-y-3"
              >
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Variant name (e.g. Size: L)"
                    value={v.name || ""}
                    onChange={(e) =>
                      updateVariant(vi, { name: e.target.value })
                    }
                    className="flex-1 h-10 text-sm border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(vi)}
                    className="h-8 w-8 rounded-md bg-(--destructive)/10 flex items-center justify-center text-(--destructive) hover:bg-(--destructive)/20"
                    aria-label="Remove variant"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Price — can be cleared, placeholder shows page price hint */}
                  <Input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    placeholder={
                      pagePrice > 0
                        ? `Price (e.g. ₦${pagePrice})`
                        : "Price"
                    }
                    value={priceDisplayValue(v)}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        updateVariant(vi, { price: 0 });
                      } else {
                        const parsed = parseFloat(raw);
                        updateVariant(vi, {
                          price: Number.isFinite(parsed) ? parsed : 0,
                        });
                      }
                    }}
                    className="h-10 text-sm border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
                  />

                  <Input
                    placeholder="SKU"
                    value={v.sku || ""}
                    onChange={(e) => updateVariant(vi, { sku: e.target.value })}
                    className="h-10 text-sm border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
                  />

                  {/* Stock — empty = unlimited */}
                  <Input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    placeholder="Stock (empty = ∞)"
                    value={stockDisplayValue(v)}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        updateVariant(vi, { stock: undefined as any });
                      } else {
                        const parsed = parseInt(raw, 10);
                        updateVariant(vi, {
                          stock: Number.isFinite(parsed)
                            ? Math.max(1, parsed)
                            : (undefined as any),
                        });
                      }
                    }}
                    className="h-10 text-sm border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
                  />
                </div>

                {driftWarning && (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                      This variant is ₦
                      {Number(v.price || 0).toLocaleString()} but the page
                      price is ₦{Number(pagePrice).toLocaleString()}. Make
                      sure that's what you want.
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addVariant}
            className="border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary)"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Variant
          </Button>
        </div>
      </div>

      {/* ─── Shipping ─── */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-(--border-color) bg-(--bg-primary)">
        <div className="pr-4">
          <Label className="text-sm font-bold text-(--text-primary)">
            Requires Shipping
          </Label>
          <p className="text-xs text-(--text-secondary) mt-1">
            Collect the buyer's delivery address at checkout
          </p>
        </div>
        <Switch
          checked={requiresShipping}
          onCheckedChange={setRequiresShipping}
          className="data-[state=checked]:bg-(--color-accent-yellow)"
        />
      </div>
    </div>
  );
};

export default PhysicalFields;