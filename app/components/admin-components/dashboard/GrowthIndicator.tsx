// components/admin/dashboard/GrowthIndicator.tsx
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface GrowthIndicatorProps {
  value: number;
  className?: string;
}

export const GrowthIndicator = ({ value, className = "" }: GrowthIndicatorProps) => {
  if (value === 0) {
    return (
      <div className={`flex items-center text-gray-500 ${className}`}>
        <Minus size={14} />
        <span className="ml-1 text-xs">0%</span>
      </div>
    );
  }

  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isPositive ? "text-green-600" : "text-red-600";

  return (
    <div className={`flex items-center ${colorClass} ${className}`}>
      <Icon size={14} />
      <span className="ml-1 text-xs font-medium">
        {Math.abs(value).toFixed(1)}%
      </span>
    </div>
  );
};