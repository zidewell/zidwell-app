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
  Wallet,
  ChevronDown,
} from "lucide-react";

const timeOptions = ["Today", "7d", "30d", "60d", "90d", "180d", "365d"] as const;
type TimeFilter = (typeof timeOptions)[number];

const itemFilters = [
  { key: "inflow", label: "Total Inflow", icon: ArrowDownLeft, tone: "leaf", value: "₦1,842,500", pct: "+12.4%", up: true },
  { key: "outflow", label: "Total Outflow", icon: ArrowUpRight, tone: "gold", value: "₦734,200", pct: "-4.1%", up: false },
  { key: "saved", label: "Total Saved", icon: PiggyBank, tone: "leaf", value: "₦1,108,300", pct: "+18.6%", up: true },
  { key: "data", label: "Data", icon: Wifi, tone: "ink", value: "₦28,400", pct: "3.8%", up: false },
  { key: "airtime", label: "Airtime", icon: Smartphone, tone: "ink", value: "₦14,900", pct: "2.0%", up: false },
  { key: "food", label: "Food", icon: Utensils, tone: "gold", value: "₦86,400", pct: "11.7%", up: false },
  { key: "transport", label: "Transport", icon: Bus, tone: "leaf", value: "₦43,000", pct: "5.8%", up: false },
  { key: "wallet", label: "Wallet Spend", icon: Wallet, tone: "ink", value: "₦312,000", pct: "42.4%", up: false },
] as const;

type ItemFilterKey = (typeof itemFilters)[number]["key"];

export function MoneyFlow() {
  const [time, setTime] = useState<TimeFilter>("30d");
  const [item, setItem] = useState<ItemFilterKey>("inflow");
  const [timeOpen, setTimeOpen] = useState(false);

  const active = itemFilters.find((i) => i.key === item)!;
  const toneText =
    active.tone === "leaf"
      ? "text-leaf"
      : active.tone === "gold"
      ? "text-primary-custom"
      : "text-foreground";

  return (
    <div className="squircle-lg bg-background border border-border shadow-float p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">Money Flow</p>
        <div className="relative">
          <button
            onClick={() => setTimeOpen(!timeOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border text-xs font-medium text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
          >
            Last {time}
            <ChevronDown className="h-3 w-3" />
          </button>
          {timeOpen && (
            <div className="absolute right-0 mt-1 z-20 squircle-sm bg-background border border-border shadow-float py-1 min-w-[120px]">
              {timeOptions.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTime(t);
                    setTimeOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-surface cursor-pointer ${
                    time === t ? "text-primary-custom font-medium" : "text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 sm:mt-12 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {active.label} · {time}
        </p>
        <p
          className={`mt-3 font-display text-5xl sm:text-7xl font-semibold tracking-tight tabular ${toneText}`}
        >
          {active.value}
        </p>
        <p
          className={`mt-3 text-sm font-medium ${
            active.up ? "text-leaf" : "text-muted-foreground"
          }`}
        >
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
              className={`squircle-sm border p-3 text-left transition-colors cursor-pointer ${
                isActive
                  ? "bg-ink dark:bg-white text-background dark:text-ink border-ink dark:border-white"
                  : "bg-surface border-border hover:bg-surface-2"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${
                  isActive ? "text-primary-custom" : "text-muted-foreground"
                }`}
              />
              <p
                className={`mt-2 text-[11px] font-medium ${
                  isActive ? "text-background/80 dark:text-ink/80" : "text-foreground"
                }`}
              >
                {f.label}
              </p>
              <p
                className={`text-[10px] tabular ${
                  isActive
                    ? "text-background/60 dark:text-ink/60"
                    : "text-muted-foreground"
                }`}
              >
                {f.value}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}