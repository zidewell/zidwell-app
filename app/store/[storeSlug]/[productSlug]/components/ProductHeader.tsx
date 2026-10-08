// app/store/[storeSlug]/[productSlug]/components/ProductHeader.tsx
"use client";

import { Store as StoreIcon, Search } from "lucide-react";
import { StoreData } from "../utils/types";

interface Props {
  store: StoreData;
  storeNameUpper: string;
  cartBadgeCount: number;
}

export function ProductHeader({ store, storeNameUpper, cartBadgeCount }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-[1180px] items-center gap-4 px-4 lg:px-6">
        {/* Logo / store name */}
        <a
          href={`/store/${store.slug}`}
          aria-label={`Back to ${store.name}`}
          className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80"
        >
          <span className="text-base font-bold tracking-tight text-[#FDC020]">
            {storeNameUpper}
          </span>
        </a>

        {/* Fake search bar (Jumia style) */}
        <div className="hidden flex-1 sm:block">
          <div className="flex h-9 items-center rounded-md border border-gray-300 bg-gray-50 px-3">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search in ${store.name}...`}
              className="ml-2 w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Store link */}
        <a
          href={`/store/${store.slug}`}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-[#FDC020] hover:text-[#FDC020]"
          aria-label={`Go to ${store.name}`}
        >
          <StoreIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Go to store</span>
        </a>
      </div>
    </header>
  );
}