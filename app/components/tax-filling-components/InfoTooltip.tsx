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
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="text-[#6b6b6b] dark:text-[#b3b3b3] hover:text-[#242424] dark:hover:text-[#ffffff] transition-colors"
        aria-label="More info"
      >
        <Info className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-64 p-3 rounded-lg bg-[#ffffff] dark:bg-[#161616] border border-[#e6e6e6] dark:border-[#2e2e2e] shadow-lg text-sm text-[#242424] dark:text-[#ffffff] animate-fade-in-up">
          {content}
        </div>
      )}
    </span>
  );
}
