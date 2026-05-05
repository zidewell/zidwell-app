import { cn } from "@/lib/utils";
import { PeriodSummary } from "./types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ProgressIndicatorProps {
  label: string;
  summary: PeriodSummary;
  currency?: string;
}

export function ProgressIndicator({
  label,
  summary,
  currency = "₦",
}: ProgressIndicatorProps) {
  const formatAmount = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  const getTrendIcon = () => {
    if (summary.net > 0) return TrendingUp;
    if (summary.net < 0) return TrendingDown;
    return Minus;
  };

  const TrendIcon = getTrendIcon();
  const netPercentage =
    summary.income > 0
      ? Math.min(100, Math.max(0, (summary.net / summary.income) * 100))
      : 0;

  return (
    <div className="p-4 rounded-xl border bg-[var(--bg-primary)] border-[var(--border-color)] shadow-soft squircle-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[var(--text-secondary)]">
          {label}
        </span>
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
          )}
          style={{
            backgroundColor:
              summary.net >= 0
                ? "rgba(0, 182, 79, 0.1)"
                : "rgba(239, 68, 68, 0.1)",
            color: summary.net >= 0 ? "var(--color-lemon-green)" : "var(--destructive)",
          }}
        >
          <TrendIcon className="h-3 w-3" />
          {currency}
          {formatAmount(Math.abs(summary.net))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-[var(--text-secondary)]">
          <span>
            Income: {currency}
            {formatAmount(summary.income)}
          </span>
          <span>
            Expenses: {currency}
            {formatAmount(summary.expenses)}
          </span>
        </div>

        <div className="h-2 rounded-full overflow-hidden bg-[var(--bg-secondary)]">
          <div
            className={cn("h-full rounded-full transition-all duration-500")}
            style={{
              width: `${Math.abs(netPercentage)}%`,
              background: summary.net >= 0 ? "var(--color-accent-yellow)" : "var(--destructive)",
            }}
          />
        </div>
      </div>
    </div>
  );
}