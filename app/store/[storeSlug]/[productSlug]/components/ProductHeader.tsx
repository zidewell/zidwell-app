"use client";

import { Store as StoreIcon } from "lucide-react";
import { StoreData } from "../utils/types";

interface Props {
  store: StoreData;
  storeNameUpper: string;
  cartBadgeCount: number;
}

export function ProductHeader({ store, storeNameUpper, cartBadgeCount }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-[1180px] items-center gap-4 px-4 lg:px-6">
        <a
          href={`/store/${store.slug}`}
          aria-label={`Back to ${store.name}`}
          className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80"
        >
          <span className="text-base font-bold tracking-tight text-[#F5B800]">
            {storeNameUpper}
          </span>
        </a>

        <a
          href={`/store/${store.slug}`}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground/80 transition hover:border-[#F5B800] hover:text-[#F5B800]"
          aria-label={`Go to ${store.name}`}
        >
          <StoreIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Go to store</span>
        </a>
      </div>
    </header>
  );
}