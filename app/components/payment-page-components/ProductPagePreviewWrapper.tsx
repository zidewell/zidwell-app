"use client";

import { useState, ReactNode } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  CustomerPreview,
  PreviewData,
} from "@/app/components/payment-page-components/CustomerPreview";

interface ProductPagePreviewWrapperProps {
  children: (helpers: {
    openPreview: () => void;
    PreviewButton: ReactNode;
  }) => ReactNode;
  getPreviewData: () => PreviewData;
}

/**
 * Wrap your product page creation form with this component to add a
 * live "Customer Preview" feature.
 *
 * Usage:
 *
 * ```tsx
 * <ProductPagePreviewWrapper getPreviewData={() => ({ ... })}>
 *   {({ PreviewButton }) => (
 *     <div>
 *       {PreviewButton}
 *       ...form fields...
 *     </div>
 *   )}
 * </ProductPagePreviewWrapper>
 * ```
 */
export function ProductPagePreviewWrapper({
  children,
  getPreviewData,
}: ProductPagePreviewWrapperProps) {
  const [showPreview, setShowPreview] = useState(false);

  const handleOpen = () => setShowPreview(true);
  const handleClose = () => setShowPreview(false);

  const PreviewButton = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleOpen}
      className="border-(--color-accent-yellow) text-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/10"
    >
      <Eye className="mr-2 h-4 w-4" />
      Preview
    </Button>
  );

  return (
    <>
      {children({ openPreview: handleOpen, PreviewButton })}

      <CustomerPreview
        isOpen={showPreview}
        onClose={handleClose}
        data={getPreviewData()}
      />
    </>
  );
}