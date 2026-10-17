// app/components/admin-components/dashboard/GrowthIndicator.tsx
"use client";

import React from "react";

interface GrowthIndicatorProps {
  value: number;
}

export default function GrowthIndicator({ value }: GrowthIndicatorProps) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return <span className="text-xs text-(--text-secondary)">—</span>;
  }

  const positive = value >= 0;
  const formatted = Math.abs(value).toFixed(1);

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        positive ? "text-[--color-lemon-green]" : "text-destructive"
      }`}
    >
      <span aria-hidden>{positive ? "▲" : "▼"}</span>
      <span>{formatted}%</span>
    </span>
  );
}
