// app/store/[storeSlug]/[productSlug]/components/StockBadge.tsx
"use client";

import { AlertTriangle, Package } from "lucide-react";

interface Props {
  showQuantity: boolean;
  productStock: number | null;
  isOutOfStock: boolean;
}

export function StockBadge({ showQuantity, productStock, isOutOfStock }: Props) {
  if (showQuantity && productStock !== null) {
    return (
      <div className="mt-4">
        {isOutOfStock ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground/70">
            <AlertTriangle className="h-3.5 w-3.5" />
            Out of stock
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground/70">
            <Package className="h-3.5 w-3.5" />
            {productStock.toLocaleString()}{" "}
            {productStock === 1 ? "unit" : "units"} available
          </span>
        )}
      </div>
    );
  }

  if (showQuantity && productStock === null && !isOutOfStock) {
    return (
      <div className="mt-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground/70">
          <Package className="h-3.5 w-3.5" />
          In stock
        </span>
      </div>
    );
  }

  return null;
}