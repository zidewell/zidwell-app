import { TrendingUp, Coins, TrendingDown, Sparkles } from "lucide-react";

export function HealthScore() {
  const score = 82;
  const r = 56;
  const C = 2 * Math.PI * r;
  const dash = (score / 100) * C;

  return (
    <div className="squircle-lg bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-float p-5 sm:p-8">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 140 140" className="h-48 w-48">
            <circle cx="70" cy="70" r={r} fill="none" stroke="var(--border-color)" strokeWidth="14" />
            <circle cx="70" cy="70" r={r} fill="none" stroke="var(--color-lemon-green)" strokeWidth="14" strokeDasharray={`${dash} ${C - dash}`} strokeLinecap="round" transform="rotate(-90 70 70)" />
            <text x="70" y="70" textAnchor="middle" className="fill-[var(--text-primary)] text-3xl font-semibold">{score}</text>
            <text x="70" y="90" textAnchor="middle" className="fill-[var(--text-secondary)] text-[10px]">/ 100</text>
          </svg>
          <p className="mt-3 font-display text-lg font-semibold text-[var(--text-primary)]">Financially healthy</p>
          <p className="text-xs text-[var(--text-secondary)]">Cashflow stable · Income diversified</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3 squircle-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4">
            <span className="h-9 w-9 rounded-xl flex items-center justify-center bg-[var(--color-lemon-green)]/10 text-[var(--color-lemon-green)]">
              <TrendingUp className="h-4 w-4" />
            </span>
            <p className="text-sm leading-relaxed text-[var(--text-primary)]">Your cashflow increased <b>18%</b> from last month.</p>
          </div>
          <div className="flex items-start gap-3 squircle-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4">
            <span className="h-9 w-9 rounded-xl flex items-center justify-center bg-[var(--color-accent-yellow)]/15 text-[var(--color-accent-yellow)]">
              <Coins className="h-4 w-4" />
            </span>
            <p className="text-sm leading-relaxed text-[var(--text-primary)]">You spent <b>₦ 43,000</b> on transport this month.</p>
          </div>
          <div className="flex items-start gap-3 squircle-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4">
            <span className="h-9 w-9 rounded-xl flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-primary)]">
              <TrendingDown className="h-4 w-4" />
            </span>
            <p className="text-sm leading-relaxed text-[var(--text-primary)]">Your biggest expense category is <b>inventory</b>.</p>
          </div>
          <div className="flex items-start gap-3 squircle-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4">
            <span className="h-9 w-9 rounded-xl flex items-center justify-center bg-[var(--color-lemon-green)]/10 text-[var(--color-lemon-green)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <p className="text-sm leading-relaxed text-[var(--text-primary)]">Most of your income came from <b>transfers</b>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}