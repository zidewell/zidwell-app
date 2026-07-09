"use client";

import { useState } from "react";
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  PiggyBank, 
  Wifi, 
  Smartphone, 
  Utensils, 
  Bus, 
  Wallet 
} from "lucide-react";

const timeFilters = ["Today", "7d", "30d", "60d", "90d", "180d", "365d"] as const;
type TimeFilter = typeof timeFilters[number];

const itemFilters = [
  { key: "inflow", label: "Total Inflow", icon: ArrowDownLeft, tone: "leaf", value: "₦ 1,842,500", pct: "+12.4%", up: true },
  { key: "outflow", label: "Total Outflow", icon: ArrowUpRight, tone: "gold", value: "₦ 734,200", pct: "-4.1%", up: false },
  { key: "saved", label: "Total Saved", icon: PiggyBank, tone: "leaf", value: "₦ 1,108,300", pct: "+18.6%", up: true },
  { key: "data", label: "Data", icon: Wifi, tone: "ink", value: "₦ 28,400", pct: "3.8%", up: false },
  { key: "airtime", label: "Airtime", icon: Smartphone, tone: "ink", value: "₦ 14,900", pct: "2.0%", up: false },
  { key: "food", label: "Food", icon: Utensils, tone: "gold", value: "₦ 86,400", pct: "11.7%", up: false },
  { key: "transport", label: "Transport", icon: Bus, tone: "leaf", value: "₦ 43,000", pct: "5.8%", up: false },
  { key: "wallet", label: "Wallet Spend", icon: Wallet, tone: "ink", value: "₦ 312,000", pct: "42.4%", up: false },
] as const;

type ItemFilterKey = typeof itemFilters[number]["key"];

export function MoneyFlow() {
  const [time, setTime] = useState<TimeFilter>("30d");
  const [item, setItem] = useState<ItemFilterKey>("inflow");

  const active = itemFilters.find((i) => i.key === item)!;
  const toneText = active.tone === "leaf" ? "text-[var(--color-lemon-green)]" : active.tone === "gold" ? "text-[var(--color-accent-yellow)]" : "text-[var(--text-primary)]";

  return (
    <div className="squircle-lg bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-float p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-[var(--text-primary)]">Money Flow</p>
        <div className="inline-flex rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] p-1">
          {timeFilters.map((t) => (
            <button
              key={t}
              onClick={() => setTime(t)}
              className={`px-3 py-1.5 text-[11px] sm:text-xs font-medium rounded-full transition ${
                time === t ? "bg-[var(--color-ink)] dark:bg-white text-white dark:text-[var(--color-ink)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-8 sm:mt-12 text-center">
        <p className="text-xs uppercase tracking-widest text-[var(--text-secondary)]">{active.label} · {time}</p>
        <p className={`mt-3 font-display text-5xl sm:text-7xl font-semibold tracking-tight ${toneText}`}>{active.value}</p>
        <p className={`mt-3 text-sm font-medium ${active.up ? "text-[var(--color-lemon-green)]" : "text-[var(--text-secondary)]"}`}>
          {active.up ? "▲" : "▾"} {active.pct} vs previous period
        </p>
      </div>
      <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {itemFilters.map((f) => {
          const Icon = f.icon;
          const isActive = f.key === item;
          return (
            <button
              key={f.key}
              onClick={() => setItem(f.key)}
              className={`squircle-sm border p-3 text-left transition ${
                isActive
                  ? "bg-[var(--color-ink)] dark:bg-white text-white dark:text-[var(--color-ink)] border-[var(--color-ink)] dark:border-white"
                  : "bg-[var(--bg-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-secondary)]/80"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-[var(--color-accent-yellow)]" : "text-[var(--text-secondary)]"}`} />
              <p className={`mt-2 text-[11px] font-medium ${isActive ? "text-white/80 dark:text-[var(--color-ink)]/80" : "text-[var(--text-primary)]"}`}>{f.label}</p>
              <p className={`text-[10px] ${isActive ? "text-white/60 dark:text-[var(--color-ink)]/60" : "text-[var(--text-secondary)]"}`}>{f.value}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}