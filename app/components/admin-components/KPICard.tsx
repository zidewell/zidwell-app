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
    <div className={`card ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-(--text-secondary)">
            {title}
          </p>
          {isLoading ? (
            <div className="mt-3 h-7 w-24 bg-(--bg-secondary) squircle-sm animate-pulse" />
          ) : (
            <p className="mt-2 text-2xl font-semibold font-(--font-space-grotesk) text-(--text-primary) truncate">
              {value}
            </p>
          )}
          {subtitle && (
            <p className="mt-1 text-xs text-(--text-secondary) truncate">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className="shrink-0 w-10 h-10 squircle-sm bg-(--bg-secondary) flex items-center justify-center text-(--text-secondary)">
            {icon}
          </div>
        )}
      </div>
      {growth && <div className="mt-3">{growth}</div>}
    </div>
  );
}
