// app/store/[storeSlug]/[productSlug]/components/ProductHeader.tsx
"use client";

import { ShoppingCart, Store as StoreIcon } from "lucide-react";
import { StoreData } from "../utils/types";
import { PRIMARY_BG, PRIMARY_TEXT } from "../utils/helpers";

interface Props {
  store: StoreData;
  storeNameUpper: string;
  cartBadgeCount: number;
}

export function ProductHeader({ store, storeNameUpper, cartBadgeCount }: Props) {
  return (
    <header className="mx-auto flex h-20 max-w-[1320px] items-center justify-between px-5 lg:px-10">
      <a
        href={`/store/${store.slug}`}
        aria-label={`Back to ${store.name}`}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <span className="text-sm font-semibold tracking-widest uppercase text-foreground">
          {storeNameUpper}
        </span>
      </a>

      <nav className="flex items-center gap-2 sm:gap-3">
        <a
          href={`/store/${store.slug}`}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-medium text-foreground/70 transition hover:border-[#FDC020] hover:text-foreground"
          aria-label={`Go to ${store.name}`}
        >
          <StoreIcon className="h-3.5 w-3.5" />
          <span>Go to store</span>
        </a>

        <a
          href={`/store/${store.slug}`}
          className="inline-flex sm:hidden items-center justify-center rounded-full border border-border p-2.5 text-foreground/70 transition hover:border-[#FDC020] hover:text-foreground"
          aria-label={`Go to ${store.name}`}
        >
          <StoreIcon className="h-4 w-4" />
        </a>

        {/* <button
          className="relative rounded-full border border-border p-2.5"
          type="button"
          aria-label="Shopping cart"
        >
          <ShoppingCart size={18} className="text-foreground/60" />
          <span
            className={`absolute -right-1 -top-1 flex min-w-4 h-4 items-center justify-center rounded-full ${PRIMARY_BG} text-[10px] font-semibold ${PRIMARY_TEXT} px-1`}
          >
            {cartBadgeCount}
          </span>
        </button> */}
      </nav>
    </header>
  );
}