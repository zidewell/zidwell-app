// app/components/store/ZidstoreSubscriberBadge.tsx
"use client";

import { Sparkles, Crown, Zap } from "lucide-react";

interface Props {
  tier: 'starter' | 'sme' | 'enterprise' | 'booster';
  size?: 'sm' | 'md' | 'lg';
}

export function ZidstoreSubscriberBadge({ tier, size = 'md' }: Props) {
  if (tier === 'starter') return null;

  const configs = {
    sme: {
      label: "✨ Verified Seller",
      icon: Sparkles,
      className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300",
    },
    enterprise: {
      label: "👑 Premium Seller",
      icon: Crown,
      className: "bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-semibold border-amber-400",
    },
    booster: {
      label: "🚀 Growth Partner",
      icon: Zap,
      className: "bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold border-purple-500",
    },
  };

  const config = configs[tier];
  if (!config) return null;

  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-3 py-1 gap-1.5",
    lg: "text-base px-4 py-1.5 gap-2",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${sizeClasses[size]} ${config.className}`}
      aria-label={config.label}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}
