// app/components/admin-components/KPICard.tsx
"use client";

import React from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  growth?: React.ReactNode;
  icon?: React.ReactNode;
  subtitle?: string;
  className?: string;
  isLoading?: boolean;
}

export default function KPICard({
  title,
  value,
  growth,
  icon,
  subtitle,
  className = "",
  isLoading = false,
}: KPICardProps) {
  return (
    <div className={`card min-w-0 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-(--text-secondary) leading-tight">
            {title}
          </p>

          {isLoading ? (
            <div className="mt-3 h-7 w-24 bg-(--bg-secondary) squircle-sm animate-pulse" />
          ) : (
            <p
              className="mt-2 text-lg sm:text-xl xl:text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary) leading-tight break-words"
              title={String(value)}
            >
              {value}
            </p>
          )}

          {subtitle && (
            <p className="mt-1 text-[11px] sm:text-xs text-(--text-secondary) leading-snug break-words">
              {subtitle}
            </p>
          )}
        </div>

        {icon && (
          <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 squircle-sm bg-(--bg-secondary) flex items-center justify-center text-(--text-secondary) text-sm sm:text-base">
            {icon}
          </div>
        )}
      </div>

      {growth && <div className="mt-3">{growth}</div>}
    </div>
  );
}