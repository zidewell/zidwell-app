// app/store/[storeSlug]/[productSlug]/components/ProductImageGallery.tsx
"use client";

import { Package } from "lucide-react";

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
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {/* Thumbnails (vertical on desktop, horizontal on mobile) */}
      {productImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto sm:flex-col sm:overflow-y-auto sm:overflow-x-hidden sm:max-h-[420px]">
          {productImages.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentImage(() => i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition ${
                i === currentImage
                  ? "border-[#FDC020]"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <img
                src={img}
                alt={`${title} ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div className="flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white">
        {productImages.length > 0 ? (
          <img
            src={productImages[currentImage]}
            alt={title}
            className="aspect-square w-full object-contain p-2"
            onError={(e) => {
              e.currentTarget.src = "/placeholder-image.png";
              e.currentTarget.onerror = null;
            }}
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center">
            <Package className="h-20 w-20 text-gray-300" />
          </div>
        )}
      </div>
    </div>
  );
}