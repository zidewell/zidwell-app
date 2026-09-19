"use client";

import { Eye } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface PreviewButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}

export function PreviewButton({
  onClick,
  disabled,
  label = "Preview",
}: PreviewButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className="border-(--color-accent-yellow) text-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/10"
    >
      <Eye className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}