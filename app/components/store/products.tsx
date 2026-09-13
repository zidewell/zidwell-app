"use client";

import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Pencil, ExternalLink, QrCode, Link2, Trash2, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/app/context/StoreContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Format large numbers compactly:
 *   999           → "999"
 *   1500          → "1,500"
 *   150000        → "150K"
 *   1500000       → "1.5M"
 *   1500000000    → "1.5B"
 *   1500000000000 → "1.5T"
 *
 * Use this for sales/views badges where space is tight. For the
 * price itself we keep the full number but let it wrap / shrink.
 */
function compactNumber(n: number): string {
  const v = Number(n) || 0;
  if (Math.abs(v) < 1000) return v.toString();
  if (Math.abs(v) < 1_000_000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}K`;
  if (Math.abs(v) < 1_000_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (Math.abs(v) < 1_000_000_000_000) return `${(v / 1_000_000_000).toFixed(v % 1_000_000_000 === 0 ? 0 : 1)}B`;
  return `${(v / 1_000_000_000_000).toFixed(1)}T`;
}

/**
 * Price formatter. Uses compact form only when the number is very
 * long, so normal prices show in full (₦3,000) but huge ones shrink
 * (₦1.5B) instead of blowing the card width.
 */
function formatPrice(n: number): string {
  const v = Number(n) || 0;
  const full = v.toLocaleString();
  if (full.length <= 12) return full;      // up to ₦999,999,999,999
  return compactNumber(v);
}

function ProductCard({ product }: { product: any }) {
  const [copied, setCopied] = useState(false);

  const copyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/p/${product.slug || product.id}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    toast.success("Product URL copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    toast(action);
  };

  const isActive = product.isPublished === true;

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-border bg-card p-4 transition-shadow hover:shadow-[0_18px_40px_-28px_rgba(0,0,0,0.4)]">
      {/* Image */}
      <div className="relative flex h-40 w-full shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] bg-muted/30">
        {product.coverImage || product.logo ? (
          <img
            src={product.coverImage || product.logo}
            alt={product.title}
            className="h-full w-full object-cover rounded-[1.5rem] transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <span className="text-6xl">📦</span>
        )}
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest",
            isActive
              ? "bg-background text-foreground"
              : "bg-foreground text-background",
          )}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              aria-label={`Actions for ${product.title}`}
              className="absolute right-3 top-3 rounded-full bg-background p-2 text-foreground shadow-sm"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-2xl">
            <DropdownMenuItem onClick={(e) => handleAction(e, "Editing " + product.title)}>
              <Pencil className="size-4 mr-2" /> Edit product
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                const url = `${window.location.origin}/p/${product.slug || product.id}`;
                window.open(url, "_blank");
              }}
            >
              <ExternalLink className="size-4 mr-2" /> View public link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleAction(e, "QR code downloaded")}>
              <QrCode className="size-4 mr-2" /> Download QR code
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                const url = `${window.location.origin}/p/${product.slug || product.id}`;
                navigator.clipboard?.writeText(url);
                toast.success("Product URL copied");
              }}
            >
              <Link2 className="size-4 mr-2" /> Copy URL
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) =>
                handleAction(e, isActive ? "Product made inactive" : "Product activated")
              }
            >
              <EyeOff className="size-4 mr-2" />{" "}
              {isActive ? "Make inactive" : "Make active"}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => handleAction(e, "Product deleted")}
            >
              <Trash2 className="size-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Body — flex-1 min-w-0 lets children shrink properly */}
      <div className="mt-4 flex-1 min-w-0 px-1">
        <p className="eyebrow truncate text-muted-foreground">
          {product.pageType || "Product"}
        </p>
        <h3
          className="mt-1 font-display text-lg font-bold leading-tight line-clamp-2 break-words"
          title={product.title}
        >
          {product.title}
        </h3>
        <p
          className="mt-2 font-display text-xl font-bold tabular-nums break-all"
          title={`₦${(product.price || 0).toLocaleString()}`}
        >
          ₦{formatPrice(product.price || 0)}
        </p>
      </div>

      {/* Footer — compact numbers keep it on one line */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border px-1 pt-3 text-sm font-semibold text-muted-foreground">
        <span className="truncate tabular-nums" title={`${product.totalPayments || 0} sales`}>
          {compactNumber(product.totalPayments || 0)} sales
        </span>
        <span className="truncate tabular-nums" title={`${product.pageViews || 0} views`}>
          {compactNumber(product.pageViews || 0)} views
        </span>
      </div>
    </article>
  );
}

export function ProductGrid() {
  const { pages, loading, fetchPages } = useStore();
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const productPages = pages.filter(p => p.pageType !== 'link' && p.pageType !== 'donation');
    setProducts(productPages);
  }, [pages]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-3xl border border-border bg-card p-4 animate-pulse">
            <div className="h-40 rounded-[1.5rem] bg-muted/50" />
            <div className="mt-4 h-4 w-24 bg-muted/50 rounded" />
            <div className="mt-2 h-6 w-32 bg-muted/50 rounded" />
            <div className="mt-2 h-6 w-20 bg-muted/50 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <button
        onClick={() => toast("New product form")}
        className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border p-6 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
      >
        <span className="flex size-12 items-center justify-center rounded-2xl bg-gold text-gold-foreground">
          <Plus className="size-6" strokeWidth={2.6} />
        </span>
        <span className="font-display text-base font-bold">Add product</span>
        <span className="max-w-[180px] text-center text-sm">List a new item on your storefront</span>
      </button>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}