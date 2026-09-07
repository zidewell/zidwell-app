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
        <button className="flex items-center gap-2 rounded-[2rem] border border-border bg-card px-4 py-3 text-sm font-bold text-foreground hover:bg-muted transition-colors shadow-sm">
          <CalendarDays className="size-4 text-muted-foreground" />
          <span className="text-foreground">{label}</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-auto rounded-3xl p-2 bg-card border-border shadow-xl backdrop-blur-sm"
        sideOffset={8}
      >
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
                  "flex w-full items-center justify-between rounded-2xl px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors",
                  value === p.key && "bg-muted"
                )}
              >
                {p.key === "all" ? p.label : `Last ${p.label}`}
                {value === p.key && <Check className="size-4 text-primary" />}
              </button>
            ))}
            <button
              onClick={() => setCustomMode(true)}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors",
                value === "custom" && "bg-muted"
              )}
            >
              Custom date range
              {value === "custom" && <Check className="size-4 text-primary" />}
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
              className="pointer-events-auto p-2 bg-card"
            />
            <div className="flex justify-between gap-2 px-2 pb-2">
              <Button variant="ghost" size="sm" onClick={() => setCustomMode(false)}>
                Back
              </Button>
              <Button size="sm" onClick={() => setOpen(false)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Apply
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}