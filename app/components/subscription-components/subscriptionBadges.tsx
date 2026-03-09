// components/subscriptionBadges.tsx
"use client";

import { useSubscription } from '@/app/hooks/useSubscripion'; 
import { Crown, Zap, Star, Sparkles, AlertCircle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

const tierConfig = {
  free: {
    icon: Star,
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    darkBg: 'dark:bg-gray-800',
    darkColor: 'dark:text-gray-300',
    label: 'Free',
  },
  growth: {
    icon: Zap,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    darkBg: 'dark:bg-blue-900/30',
    darkColor: 'dark:text-blue-300',
    label: 'Growth',
  },
  premium: {
    icon: Crown,
    color: 'text-[#C29307]',
    bg: 'bg-[#C29307]/10',
    darkBg: 'dark:bg-[#C29307]/20',
    darkColor: 'dark:text-[#C29307]',
    label: 'Premium',
  },
  elite: {
    icon: Sparkles,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    darkBg: 'dark:bg-purple-900/30',
    darkColor: 'dark:text-purple-300',
    label: 'Elite',
  },
};

interface SubscriptionBadgeProps {
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTrial?: boolean;
  featureKey?: string;
}

export function SubscriptionBadge({ 
  className = '', 
  showIcon = true,
  size = 'md',
  showTrial = false,
  featureKey = 'bookkeeping_access'
}: SubscriptionBadgeProps) {
  const { subscription, isActive, checkTrialStatus } = useSubscription();
  const [trialInfo, setTrialInfo] = useState<any>(null);
  const tier = subscription?.tier || 'free';
  const config = tierConfig[tier as keyof typeof tierConfig];
  const Icon = config.icon;

  useEffect(() => {
    if (showTrial && tier === 'free') {
      checkTrialStatus(featureKey).then(setTrialInfo);
    }
  }, [showTrial, tier, featureKey, checkTrialStatus]);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  // Show trial badge if user is on free tier and has active trial
  if (showTrial && tier === 'free' && trialInfo?.isActive) {
    return (
      <div className={`inline-flex items-center gap-1 rounded-full font-medium 
        bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300
        ${sizeClasses[size]} ${className}`}>
        <Clock className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} />
        <span>Trial • {trialInfo.daysRemaining} days left</span>
      </div>
    );
  }

  if (!isActive && tier !== 'free') {
    return (
      <div className={`inline-flex items-center gap-1 rounded-full font-medium 
        bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300 
        ${sizeClasses[size]} ${className}`}>
        <AlertCircle className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} />
        <span>Expired</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 rounded-full font-medium 
      ${config.bg} ${config.color} ${config.darkBg} ${config.darkColor} 
      ${sizeClasses[size]} ${className}`}>
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} />}
      <span>{config.label}</span>
    </div>
  );
}