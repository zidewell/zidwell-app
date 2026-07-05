// app/components/journal/PlanSelection.tsx

"use client";

import { useRouter } from 'next/navigation';
import { Sparkles, BookOpen, Link2, Infinity as InfinityIcon, Check, Gift, Globe, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { TIERS, UserTier, TierInfo } from '@/types/tier';
import { useTier } from '@/app/context/TierContext';
import { useRegion } from '@/app/context/RegionContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const displayPrice = (info: TierInfo, isNG: boolean) =>
  isNG ? info.price : info.priceUsd ?? info.price;
const displayYearly = (info: TierInfo, isNG: boolean) =>
  isNG ? info.priceYearly : info.priceUsdYearly;

const GLOBAL_TIERS: UserTier[] = ['free', 'lite'];
const NIGERIA_TIERS: UserTier[] = ['free', 'lite', 'premium', 'business'];

const ICONS: Record<UserTier, typeof Sparkles> = {
  free: Sparkles,
  lite: BookOpen,
  premium: Link2,
  business: InfinityIcon,
};

const CIRCLE_TONE: Record<UserTier, string> = {
  free: 'from-secondary to-muted',
  lite: 'from-primary/30 to-primary/10',
  premium: 'from-success/30 to-success/10',
  business: 'from-foreground to-foreground/70',
};

const CIRCLE_ICON_TONE: Record<UserTier, string> = {
  free: 'text-foreground',
  lite: 'text-primary',
  premium: 'text-success',
  business: 'text-background',
};

interface PlanSelectionProps {
  isSwitcher?: boolean;
  currentTier?: UserTier;
  onSelect?: (tier: UserTier) => void;
  onCancel?: () => void;
}

export function PlanSelection({ isSwitcher = false, currentTier, onSelect, onCancel }: PlanSelectionProps) {
  const router = useRouter();
  const { selectPlan } = useTier();
  const { region } = useRegion();
  const isNG = region === 'nigeria';
  const TIER_ORDER = region === 'nigeria' ? NIGERIA_TIERS : GLOBAL_TIERS;

  const handleSelect = (t: UserTier) => {
    // Navigate to pricing page for all paid plans
    if (t !== 'free') {
      router.push('/pricing');
      return;
    }

    // For free plan, handle selection
    if (onSelect) {
      onSelect(t);
    } else {
      selectPlan(t);
      toast.success(`Welcome to ${TIERS[t].name}`);
    }
  };

  const handleFreePlanSelect = () => {
    if (onSelect) {
      onSelect('free');
    } else {
      selectPlan('free');
      toast.success('Welcome to Zidwell Free');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">
        <div className="flex items-start justify-between gap-4 mb-10">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Zidwell Bookkeeping</p>
            <h1 className="font-display text-3xl md:text-5xl font-semibold tracking-tight">
              Choose Your Bookkeeping Experience
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              Whether you prefer manual bookkeeping, bank statement uploads, or fully automated bookkeeping, Zidwell has an option for you.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSwitcher && onCancel && (
              <Button variant="ghost" onClick={onCancel} className="font-medium">
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Circular plan picker */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-12 place-items-center">
          {TIER_ORDER.map((t, i) => {
            const info = TIERS[t];
            const Icon = ICONS[t];
            const isCurrent = currentTier === t;
            const RegionIcon = info.region === 'global' ? Globe : MapPin;
            return (
              <button
                key={t}
                onClick={() => handleSelect(t)}
                className={cn(
                  'group flex flex-col items-center gap-3 transition-all',
                  i === 1 && 'lg:mt-6',
                  i === 2 && 'lg:mt-3',
                  i === 3 && 'lg:mt-10'
                )}
              >
                <div
                  className={cn(
                    'relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br flex items-center justify-center',
                    'shadow-[var(--shadow-card)] group-hover:shadow-[var(--shadow-elevated)] group-hover:scale-105 transition-all duration-300',
                    CIRCLE_TONE[t],
                    isCurrent && 'ring-4 ring-primary ring-offset-4 ring-offset-background'
                  )}
                >
                  <Icon className={cn('h-12 w-12 md:h-14 md:w-14', CIRCLE_ICON_TONE[t])} strokeWidth={1.6} />
                  {info.badge && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold px-2.5 py-1 bg-foreground text-background rounded-full shadow-[var(--shadow-soft)]">
                      {info.badge}
                    </span>
                  )}
                </div>
                <div className="text-center space-y-1">
                  <p className="font-display font-semibold text-base md:text-lg">{info.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {t === 'free' ? 'Free forever' : `${displayPrice(info, isNG)}/mo`}
                  </p>
                  <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                    <RegionIcon className="h-3 w-3" />
                    <span>{info.region === 'global' ? 'Entrepreneurs anywhere in the world' : 'Entrepreneurs and business owners in Nigeria'}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed plan cards */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {TIER_ORDER.map((t) => {
            const info = TIERS[t];
            const isCurrent = currentTier === t;
            const isHighlight = t === 'premium';
            const RegionIcon = info.region === 'global' ? Globe : MapPin;
            const isFree = t === 'free';

            return (
              <div
                key={t}
                className={cn(
                  'squircle p-6 flex flex-col gap-5 transition-all bg-card border',
                  isHighlight ? 'border-primary shadow-[var(--shadow-premium)]' : 'border-border shadow-[var(--shadow-soft)]',
                  isCurrent && 'ring-2 ring-success'
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold">{info.name}</h3>
                    {isCurrent && <span className="text-[10px] font-semibold uppercase tracking-wider text-success">Current</span>}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-3xl font-semibold">{displayPrice(info, isNG)}</span>
                      {!isFree && <span className="text-sm text-muted-foreground">/month</span>}
                    </div>
                    {displayYearly(info, isNG) && <p className="text-xs text-muted-foreground mt-1">{displayYearly(info, isNG)}</p>}
                  </div>
                  <p className="text-sm text-muted-foreground">{info.tagline}</p>
                  <div className={cn(
                    'inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full',
                    info.region === 'global' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'
                  )}>
                    <RegionIcon className="h-3 w-3" />
                    {info.region === 'global' ? 'Entrepreneurs anywhere in the world' : 'Entrepreneurs and business owners in Nigeria'}
                  </div>
                </div>

                <ul className="space-y-2 flex-1">
                  {info.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {info.bonuses && (
                  <ul className="space-y-1.5 pt-3 border-t border-border">
                    {info.bonuses.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-sm font-medium">
                        <Gift className="h-3.5 w-3.5 text-primary" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <Button
                  onClick={() => handleSelect(t)}
                  disabled={isCurrent}
                  className={cn(
                    'w-full h-11 font-semibold',
                    isHighlight && !isCurrent && 'bg-primary text-primary-foreground hover:opacity-90',
                    t === 'business' && !isCurrent && 'bg-foreground text-background hover:opacity-90',
                    isFree && !isCurrent && 'bg-success text-success-foreground hover:bg-success/90'
                  )}
                  variant={isHighlight || t === 'business' || isFree ? 'default' : 'outline'}
                >
                  {isCurrent ? 'Current plan' : isFree ? 'Start Free' : info.cta}
                </Button>

                {!isFree && (
                  <p className="text-xs text-muted-foreground text-center">{info.note}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}