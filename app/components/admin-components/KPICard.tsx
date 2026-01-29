// components/admin-components/KPICard.tsx
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
      <div
        className={`bg-white p-6 rounded-2xl shadow-sm border animate-pulse ${className}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-8"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        {subtitle && <div className="h-3 bg-gray-100 rounded w-full"></div>}
      </div>
    );
  }

  return (
    <div
      className={`bg-white p-6 rounded-2xl shadow-sm border relative hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <div className="shrink-0">{icon}</div>}
          <div className="text-sm font-medium text-gray-500">{title}</div>
        </div>
        {growth && <div className="shrink-0">{growth}</div>}
      </div>
      <div className="mb-1">
        <div className="text-2xl font-bold text-gray-900 truncate">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
      </div>
      {subtitle && (
        <div className="text-xs text-gray-400 mt-1 truncate">{subtitle}</div>
      )}
    </div>
  );
}
