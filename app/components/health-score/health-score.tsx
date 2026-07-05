import { Sparkles, TrendingUp, TrendingDown, Coins } from "lucide-react";
import InsightCard from "../insightcard";

export function HealthScore() {
  const score = 82;
  const r = 56;
  const C = 2 * Math.PI * r;
  const dash = (score / 100) * C;

  return (
    <div className="squircle-lg bg-background border shadow-float p-5 sm:p-8">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 140 140" className="h-48 w-48">
            <circle cx="70" cy="70" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="14" />
            <circle
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke="var(--leaf)"
              strokeWidth="14"
              strokeDasharray={`${dash} ${C - dash}`}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
            />
            <text x="70" y="70" textAnchor="middle" className="fill-foreground" style={{ fontSize: 32, fontWeight: 600 }}>
              {score}
            </text>
            <text x="70" y="90" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 10 }}>
              / 100
            </text>
          </svg>
          <p className="mt-3 font-display text-lg font-semibold">Financially healthy</p>
          <p className="text-xs text-muted-foreground">Cashflow stable · Income diversified</p>
        </div>

        <div className="space-y-3">
          <InsightCard
            icon={TrendingUp}
            tone="leaf"
            text={<>Your cashflow increased <b>18%</b> from last month.</>}
          />
          <InsightCard
            icon={Coins}
            tone="gold"
            text={<>You spent <b>₦ 43,000</b> on transport this month.</>}
          />
          <InsightCard
            icon={TrendingDown}
            tone="ink"
            text={<>Your biggest expense category is <b>inventory</b>.</>}
          />
          <InsightCard
            icon={Sparkles}
            tone="leaf"
            text={<>Most of your income came from <b>transfers</b>.</>}
          />
        </div>
      </div>
    </div>
  );
}

