// app/components/journal/SummaryCards.tsx

"use client";
import { Wallet, TrendingUp, TrendingDown, Activity, Calendar } from "lucide-react";
import { SummaryCard } from "./SummaryCard";
import { PeriodSummary } from "./types";

interface SummaryCardsProps {
  today: PeriodSummary & { actualBalance?: number };
  week: PeriodSummary & { actualBalance?: number };
  month: PeriodSummary & { actualBalance?: number };
  year: PeriodSummary & { actualBalance?: number };
  allTime: PeriodSummary & { actualBalance?: number };
  balance: number;
}

export function SummaryCards({ 
  today, 
  week, 
  month, 
  year, 
  allTime, 
  balance
}: SummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {/* Balance Card - Show Actual Account Balance */}
      <div className="p-4 rounded-2xl border shadow-soft bg-(--color-accent-yellow) border-(--color-accent-yellow)/30 squircle-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-(--color-ink)/70">
              Account Balance
            </p>
            <p className="text-2xl font-bold text-(--color-ink) tabular-nums">
              ₦{balance.toLocaleString()}
            </p>
          </div>
          <div className="p-2 rounded-xl bg-(--color-ink)/10">
            <Wallet className="h-5 w-5 text-(--color-ink)" />
          </div>
        </div>
      </div>

      {/* Today's Summary */}
      <SummaryCard
        title="Today"
        amount={today.net}
        icon={Activity}
        variant="net"
      />

      {/* This Week */}
      <SummaryCard
        title="This Week"
        amount={week.net}
        icon={Calendar}
        variant="net"
      />

      {/* This Month */}
      <SummaryCard
        title="This Month"
        amount={month.net}
        icon={TrendingUp}
        variant="net"
      />

      {/* This Year */}
      <SummaryCard
        title="This Year"
        amount={year.net}
        icon={TrendingDown}
        variant="net"
      />
    </div>
  );
}