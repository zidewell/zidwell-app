// app/store/[storeSlug]/[productSlug]/components/TimePicker.tsx
"use client";

import { format } from "date-fns";

interface Props {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

export function TimePicker({ value, onChange, disabled }: Props) {
  const slots: string[] = [];
  for (let h = 8; h <= 20; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      slots.push(`${hh}:${mm}`);
    }
  }

  return (
    <div className="max-h-64 overflow-y-auto p-1">
      <div className="grid grid-cols-3 gap-1">
        {slots.map((slot) => {
          const selected = value === slot;
          const label = format(new Date(`2000-01-01T${slot}`), "h:mm a");
          return (
            <button
              key={slot}
              type="button"
              disabled={disabled}
              onClick={() => onChange(slot)}
              className={`rounded-md px-3 py-2 text-sm transition ${
                selected
                  ? "bg-[#FDC020] text-[#191919] font-semibold"
                  : "hover:bg-muted text-foreground/80"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}