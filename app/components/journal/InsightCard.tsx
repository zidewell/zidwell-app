// app/components/journal/InsightCard.tsx

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  icon: LucideIcon;
  message: string;
  tone?: 'positive' | 'neutral' | 'warning';
}

export function InsightCard({ icon: Icon, message, tone = 'neutral' }: InsightCardProps) {
  const toneStyle = {
    positive: 'bg-success/10 text-success',
    neutral: 'bg-primary/15 text-primary',
    warning: 'bg-destructive/10 text-destructive',
  }[tone];

  return (
    <div className="squircle p-4 bg-card border border-border flex items-start gap-3 shadow-[var(--shadow-soft)]">
      <div className={cn('p-2 squircle-sm flex-shrink-0', toneStyle)}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm leading-relaxed pt-0.5">{message}</p>
    </div>
  );
}