// app/components/store/SellerBadge.tsx
// Subscriber badge component for store pages
// Renders different badges based on subscription tier

import { cn } from "@/lib/utils";

export type SellerTier = 'starter' | 'sme' | 'enterprise' | 'booster';

interface SellerBadgeProps {
  tier: SellerTier;
  className?: string;
}

export function SellerBadge({ tier, className }: SellerBadgeProps) {
  // Don't render anything for starter tier
  if (tier === 'starter' || !tier) {
    return null;
  }

  const badgeConfig: Record<SellerTier, { label: string; className: string }> = {
    starter: { label: '', className: '' },
    sme: {
      label: '✨ Verified Seller',
      className: 'bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
    },
    enterprise: {
      label: '👑 Premium Seller',
      className: 'bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-200 text-yellow-900 border border-yellow-400 dark:from-yellow-800 dark:via-yellow-700 dark:to-yellow-800 dark:text-yellow-200',
    },
    booster: {
      label: '🚀 Growth Partner',
      className: 'bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0',
    },
  };

  const config = badgeConfig[tier];
  if (!config.label) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}