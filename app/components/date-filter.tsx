// app/components/date-filter.tsx
"use client";

import { useState } from "react";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar"; 
import { Button } from "./ui/button"; 
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

export type PeriodKey = "7d" | "30d" | "90d" | "all" | "custom";

export const PERIODS = [
  { key: "7d" as const, label: "7 days" },
  { key: "30d" as const, label: "30 days" },
  { key: "90d" as const, label: "90 days" },
  { key: "all" as const, label: "All time" },
];

export function DateFilter({
  value,
  onChange,
  range,
  onRangeChange,
}: {
  value: PeriodKey;
  onChange: (v: PeriodKey) => void;
  range: DateRange | undefined;
  onRangeChange: (r: DateRange | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);

  const label =
    value === "custom"
      ? range?.from
        ? `${range.from.toLocaleDateString()} – ${range.to ? range.to.toLocaleDateString() : "…"}`
        : "Custom range"
      : `Last ${PERIODS.find((p) => p.key === value)?.label}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 squircle-lg border border-border-color bg-bg-primary px-4 py-3 text-sm font-bold hover:bg-bg-secondary transition-colors">
          <CalendarDays className="size-4" />
          {label}
          <ChevronDown className="size-4 text-text-secondary" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto rounded-3xl p-2 bg-bg-primary border-border-color">
        {!customMode ? (
          <div className="w-56">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => {
                  onChange(p.key);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl px-4 py-2.5 text-sm font-semibold hover:bg-bg-secondary transition-colors",
                  value === p.key && "bg-bg-secondary"
                )}
              >
                {p.key === "all" ? p.label : `Last ${p.label}`}
                {value === p.key && <Check className="size-4 text-accent-yellow" />}
              </button>
            ))}
            <button
              onClick={() => setCustomMode(true)}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl px-4 py-2.5 text-sm font-semibold hover:bg-bg-secondary transition-colors",
                value === "custom" && "bg-bg-secondary"
              )}
            >
              Custom date range
              {value === "custom" && <Check className="size-4 text-accent-yellow" />}
            </button>
          </div>
        ) : (
          <div className="p-1">
            <Calendar
              mode="range"
              selected={range}
              onSelect={(r) => {
                onRangeChange(r);
                onChange("custom");
              }}
              numberOfMonths={1}
              className="pointer-events-auto p-2"
            />
            <div className="flex justify-between gap-2 px-2 pb-2">
              <Button variant="ghost" size="sm" onClick={() => setCustomMode(false)}>
                Back
              </Button>
              <Button size="sm" onClick={() => setOpen(false)} className="btn-zidwell-primary">
                Apply
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}