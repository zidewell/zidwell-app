// app/components/payment-page-components/PhysicalFields.tsx
"use client";

import { Plus, X, Info } from "lucide-react";
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
}: Props) => {
  const hasVariants = variants.length > 0;

  const addVariant = () =>
    setVariants([...variants, { name: "", price: 0, sku: "", stock: 0 }]);

  const updateVariant = (i: number, patch: Partial<Variant>) => {
    const updated = [...variants];
    updated[i] = { ...updated[i], ...patch };
    setVariants(updated);
  };

  const removeVariant = (i: number) =>
    setVariants(variants.filter((_, idx) => idx !== i));

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

        <div className="space-y-4">
          {variants.map((v, vi) => (
            <div
              key={vi}
              className="p-4 rounded-xl border border-(--border-color) bg-(--bg-secondary)/30 space-y-3"
            >
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Variant name (e.g. Size: L)"
                  value={v.name}
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
                <Input
                  placeholder="Price"
                  type="number"
                  value={v.price || 0}
                  onChange={(e) =>
                    updateVariant(vi, { price: parseFloat(e.target.value) || 0 })
                  }
                  className="h-10 text-sm border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
                />
                <Input
                  placeholder="SKU"
                  value={v.sku || ""}
                  onChange={(e) => updateVariant(vi, { sku: e.target.value })}
                  className="h-10 text-sm border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
                />
                <Input
                  placeholder="Stock"
                  type="number"
                  value={v.stock || 0}
                  onChange={(e) =>
                    updateVariant(vi, { stock: parseInt(e.target.value) || 0 })
                  }
                  className="h-10 text-sm border-(--border-color) bg-(--bg-primary) text-(--text-primary)"
                />
              </div>
            </div>
          ))}

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