// app/components/tax-filling-components/InfoTooltip.tsx
import { Info } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface InfoTooltipProps {
  content: string;
}

export function InfoTooltip({ content }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <span className="relative inline-block ml-1.5" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="text-(--text-secondary) hover:text-(--text-primary) transition-colors"
        aria-label="More info"
      >
        <Info className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-64 p-3 rounded-lg bg-(--bg-primary) border border-(--border-color) shadow-lg text-sm text-(--text-primary) animate-fade-in-up">
          {content}
        </div>
      )}
    </span>
  );
}
