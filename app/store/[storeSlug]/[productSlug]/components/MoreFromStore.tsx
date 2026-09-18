"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import type { MoreProduct } from "../utils/types";

interface Props {
  products: MoreProduct[];
  storeSlug: string;
  storeName: string;
  currentProductId: string;
}

function firstImage(p: MoreProduct): string | null {
  if (Array.isArray(p.product_images) && p.product_images.length > 0) {
    return p.product_images[0];
  }
  if (typeof p.product_images === "string") {
    try {
      const parsed = JSON.parse(p.product_images);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    } catch {
      /* noop */
    }
  }
  return p.cover_image || null;
}

export function MoreFromStore({
  products,
  storeSlug,
  storeName,
  currentProductId,
}: Props) {
  const items = products.filter((p) => p.id !== currentProductId).slice(0, 8);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1320px] px-5 pb-16 lg:px-10">
      <div className="mb-5 flex items-baseline justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            More from {storeName}
          </h2>
          <p className="mt-1 text-xs text-foreground/50">
            Other products you might like
          </p>
        </div>
        <Link
          href={`/store/${storeSlug}`}
          className="text-xs font-medium text-foreground/60 underline hover:text-foreground"
        >
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {items.map((p) => {
          const img = firstImage(p);
          const productStoreSlug = p.metadata?.storeSlug || storeSlug;
          return (
            <Link
              key={p.id}
              href={`/store/${productStoreSlug}/${p.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition-all duration-300 hover:-translate-y-0.5 hover:border-[#FDC020]/50 hover:shadow-lg"
            >
              <div className="relative aspect-square overflow-hidden bg-muted/30">
                {img ? (
                  <img
                    src={img}
                    alt={p.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-10 w-10 text-foreground/20" />
                  </div>
                )}

                {p.page_type && (
                  <div className="absolute left-2 top-2">
                    <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                      {p.page_type}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col p-3">
                <h3 className="line-clamp-1 text-sm font-semibold transition-colors group-hover:text-[#FDC020]">
                  {p.title}
                </h3>
                <div className="mt-auto flex items-baseline justify-between pt-2">
                  <p className="text-sm font-bold text-[#191919] dark:text-[#FDC020]">
                    ₦{Number(p.price || 0).toLocaleString()}
                  </p>
                  {p.price_type === "installment" && (
                    <span className="text-[10px] font-medium text-foreground/50">
                      installments
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}