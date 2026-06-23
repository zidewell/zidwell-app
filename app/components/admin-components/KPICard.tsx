// app/components/admin-components/KPICard.tsx
import { ReactNode } from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  growth?: ReactNode;
  className?: string;
  icon?: ReactNode;
  subtitle?: string;
  isLoading?: boolean;
}

export default function KPICard({
  title,
  value,
  growth,
  className = "",
  icon,
  subtitle,
  isLoading = false,
}: KPICardProps) {
  if (isLoading) {
    return (
      <div className={`bg-[var(--bg-primary)] p-6 squircle-lg shadow-soft border border-[var(--border-color)] animate-pulse ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 bg-[var(--bg-secondary)] squircle-sm w-24"></div>
          <div className="h-4 bg-[var(--bg-secondary)] squircle-sm w-8"></div>
        </div>
        <div className="h-8 bg-[var(--bg-secondary)] squircle-sm w-3/4 mb-2"></div>
        {subtitle && <div className="h-3 bg-[var(--bg-secondary)] squircle-sm w-full"></div>}
      </div>
    );
  }

  return (
    <div className={`bg-[var(--bg-primary)] p-6 squircle-lg shadow-soft border border-[var(--border-color)] relative hover:shadow-pop transition-shadow duration-200 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <div className="shrink-0 text-[var(--text-secondary)]">{icon}</div>}
          <div className="text-sm font-medium text-[var(--text-secondary)]">{title}</div>
        </div>
        {growth && <div className="shrink-0">{growth}</div>}
      </div>
      <div className="mb-1">
        <div className="text-2xl font-bold text-[var(--text-primary)] truncate font-[var(--font-space-grotesk)]">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
      </div>
      {subtitle && (
        <div className="text-xs text-[var(--text-secondary)] mt-1 truncate">{subtitle}</div>
      )}
    </div>
  );
}