interface FloatingCardProps {
  className?: string;
  title: string;
  amount: string;
  tone: "leaf" | "gold" | "ink";
}

export function FloatingCard({ className = "", title, amount, tone }: FloatingCardProps) {
  const dotClass = tone === "leaf" ? "bg-[var(--color-lemon-green)]" : tone === "gold" ? "bg-[var(--color-accent-yellow)]" : "bg-[var(--color-ink)] dark:bg-white";
  return (
    <div className={`flex items-center gap-3 squircle-sm bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-float px-3 py-2 sm:px-4 sm:py-3 ${className}`}>
      <span className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full shrink-0 ${dotClass}`} />
      <div className="min-w-0">
        <p className="text-[9px] sm:text-[10px] text-[var(--text-secondary)] truncate">{title}</p>
        <p className="text-xs sm:text-sm font-semibold font-display text-[var(--text-primary)] whitespace-nowrap">{amount}</p>
      </div>
    </div>
  );
}