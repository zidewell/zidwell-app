// app/components/journal/TierBadge.tsx

import { Sparkles, Zap, Crown, Briefcase } from 'lucide-react';
import { UserTier } from '@/types/tier'; 
import { cn } from '@/lib/utils';

interface TierBadgeProps {
  tier: UserTier;
  className?: string;
  size?: 'sm' | 'md';
}

export function TierBadge({ tier, className, size = 'sm' }: TierBadgeProps) {
  const cfg = {
    free: { label: 'Free', icon: Sparkles, bg: 'bg-secondary text-secondary-foreground' },
    lite: { label: 'Books', icon: Zap, bg: 'bg-primary/20 text-primary' },
    premium: { label: 'Sync', icon: Crown, bg: 'bg-success/20 text-success' },
    business: { label: 'Sync Unlimited', icon: Briefcase, bg: 'bg-foreground text-background' },
  }[tier];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium squircle-sm',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        cfg.bg,
        className
      )}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {cfg.label}
    </span>
  );
}