// app/store/[storeSlug]/[productSlug]/components/ProductImageGallery.tsx
"use client";

import { ChevronLeft, ChevronRight, Package } from "lucide-react";

interface Props {
  productImages: string[];
  currentImage: number;
  setCurrentImage: (updater: (c: number) => number) => void;
  title: string;
}

export function ProductImageGallery({
  productImages,
  currentImage,
  setCurrentImage,
  title,
}: Props) {
  return (
    <div className="relative lg:pt-1">
      <div className="overflow-hidden rounded-2xl border border-border bg-muted/30">
        {productImages.length > 0 ? (
          <img
            src={productImages[currentImage]}
            alt={title}
            className="aspect-square w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/placeholder-image.png";
              e.currentTarget.onerror = null;
            }}
          />
        ) : (
          <div className="aspect-square w-full flex items-center justify-center">
            <Package className="h-20 w-20 text-foreground/20" />
          </div>
        )}
      </div>

      {productImages.length > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            className="rounded-full border border-border p-2 text-foreground/60 transition hover:bg-muted"
            type="button"
            aria-label="Previous image"
            onClick={() =>
              setCurrentImage((c) =>
                c === 0 ? productImages.length - 1 : c - 1
              )
            }
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex gap-2">
            {productImages.map((_, i) => (
              <span
                key={i}
                className={`size-2 rounded-full ${
                  i === currentImage ? "bg-[#FDC020]" : "bg-border"
                }`}
              />
            ))}
          </div>
          <button
            className="rounded-full border border-border p-2 text-foreground/60 transition hover:bg-muted"
            type="button"
            aria-label="Next image"
            onClick={() =>
              setCurrentImage((c) =>
                c === productImages.length - 1 ? 0 : c + 1
              )
            }
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}