// app/components/journal/HealthScore.tsx

interface HealthScoreProps {
  score: number; // 0-100
  label?: string;
  verdict?: string;
  size?: number;
}

export function HealthScore({ score, label = 'Financial Health', verdict, size = 180 }: HealthScoreProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const stroke =
    clamped >= 75 ? 'hsl(var(--success))' : clamped >= 50 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))';

  const defaultVerdict =
    clamped >= 80
      ? 'Excellent — your finances are thriving.'
      : clamped >= 60
        ? 'Healthy — keep the consistency going.'
        : clamped >= 40
          ? 'Fair — there is room to improve.'
          : 'Needs attention — let\'s build better habits.';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="hsl(var(--muted))"
            strokeWidth={10}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={stroke}
            strokeWidth={10}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 800ms ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-semibold tabular-nums">{Math.round(clamped)}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div className="text-center">
        <p className="font-display font-semibold text-sm">{label}</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">{verdict ?? defaultVerdict}</p>
      </div>
    </div>
  );
}