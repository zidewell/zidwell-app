// app/components/admin-components/FilterBar.tsx
"use client";

import React from "react";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
}

interface FilterBarProps {
  filters: FilterDef[];
  onClear?: () => void;
  hasActiveFilters?: boolean;
}

export default function FilterBar({
  filters,
  onClear,
  hasActiveFilters = false,
}: FilterBarProps) {
  return (
    <div className="squircle-lg border border-(--border-color) bg-(--bg-primary) shadow-soft p-4">
      <div className="flex flex-col lg:flex-row lg:items-end gap-3">
        {filters.map((f) => (
          <div key={f.id} className="flex-1 min-w-0">
            <label
              htmlFor={f.id}
              className="block text-xs font-semibold uppercase tracking-widest text-(--text-secondary) mb-1.5"
            >
              {f.label}
            </label>
            <select
              id={f.id}
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              className="w-full h-11 squircle-md border border-(--border-color) bg-(--bg-secondary) text-(--text-primary) text-sm px-3 pr-9 appearance-none cursor-pointer hover:border-(--color-accent-yellow) focus:outline-none focus:ring-2 focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow) transition-colors"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.75rem center",
                backgroundSize: "1rem",
              }}
            >
              <option value="">
                {f.placeholder || `All ${f.label}`}
              </option>
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {onClear && hasActiveFilters && (
          <button
            onClick={onClear}
            className="h-11 squircle-md border border-(--border-color) bg-(--bg-primary) text-(--text-primary) text-sm font-medium px-4 hover:bg-(--bg-secondary) hover:border-destructive hover:text-destructive transition-colors whitespace-nowrap"
          >
            ✕ Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
