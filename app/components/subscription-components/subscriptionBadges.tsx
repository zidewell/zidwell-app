"use client";

import { useSubscription } from "@/app/hooks/useSubscripion";
import { Crown, Zap, Sparkles, Star, AlertCircle, Clock, Building2, Briefcase, Gem } from "lucide-react";
import { useEffect, useState } from "react";

// Tier display names mapping
const TIER_DISPLAY_NAMES = {
  free: "Free",
  solopreneur: "Solopreneur",
  sme: "SME",
  enterprise: "Enterprise",
  corporation: "Corporation",
};

const tierConfig = {
  free: {
    icon: Star,
    color: "text-gray-600",
    bg: "bg-gray-100",
    darkBg: "dark:bg-gray-800",
    darkColor: "dark:text-gray-300",
    label: TIER_DISPLAY_NAMES.free,
  },
  solopreneur: {
    icon: Briefcase,
    color: "text-blue-600",
    bg: "bg-blue-100",
    darkBg: "dark:bg-blue-900/30",
    darkColor: "dark:text-blue-300",
    label: TIER_DISPLAY_NAMES.solopreneur,
  },
  sme: {
    icon: Building2,
    color: "text-green-600",
    bg: "bg-green-100",
    darkBg: "dark:bg-green-900/30",
    darkColor: "dark:text-green-300",
    label: TIER_DISPLAY_NAMES.sme,
  },
  enterprise: {
    icon: Crown,
    color: "text-amber-600",
    bg: "bg-amber-100",
    darkBg: "dark:bg-amber-900/30",
    darkColor: "dark:text-amber-300",
    label: TIER_DISPLAY_NAMES.enterprise,
  },
  corporation: {
    icon: Gem,
    color: "text-purple-600",
    bg: "bg-purple-100",
    darkBg: "dark:bg-purple-900/30",
    darkColor: "dark:text-purple-300",
    label: TIER_DISPLAY_NAMES.corporation,
  },
};

// Legacy aliases for backward compatibility
const LEGACY_TIER_MAP: Record<string, string> = {
  zidlite: "solopreneur",
  growth: "sme",
  premium: "enterprise",
  elite: "corporation",
};

interface SubscriptionBadgeProps {
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  showTrial?: boolean;
  featureKey?: string;
}

export function SubscriptionBadge({
  className = "",
  showIcon = true,
  size = "md",
  showTrial = false,
  featureKey = "bookkeeping_access",
}: SubscriptionBadgeProps) {
  const { subscription, isActive } = useSubscription();
  const [trialInfo, setTrialInfo] = useState<any>(null);
  
  let tier = subscription?.tier || "free";
  
  // Map legacy tiers to new tiers
  if (tier in LEGACY_TIER_MAP) {
    tier = LEGACY_TIER_MAP[tier];
  }
  
  const config = tierConfig[tier as keyof typeof tierConfig];
  const Icon = config?.icon || Star;

 
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  if (showTrial && tier === "free" && trialInfo?.isActive) {
    return (
      <div
        className={`inline-flex items-center gap-1 rounded-full font-medium 
        bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300
        ${sizeClasses[size]} ${className}`}
      >
        <Clock
          className={
            size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"
          }
        />
        <span>Trial • {trialInfo.daysRemaining} days left</span>
      </div>
    );
  }

  if (!isActive && tier !== "free") {
    return (
      <div
        className={`inline-flex items-center gap-1 rounded-full font-medium 
        bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300 
        ${sizeClasses[size]} ${className}`}
      >
        <AlertCircle
          className={
            size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"
          }
        />
        <span>Expired</span>
      </div>
    );
  }

  if (!config) {
    return (
      <div
        className={`inline-flex items-center gap-1 rounded-full font-medium 
        bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300
        ${sizeClasses[size]} ${className}`}
      >
        <span>{tier}</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full font-medium 
      ${config.bg} ${config.color} ${config.darkBg} ${config.darkColor} 
      ${sizeClasses[size]} ${className}`}
    >
      {showIcon && (
        <Icon
          className={
            size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"
          }
        />
      )}
      <span>{config.label}</span>
    </div>
  );
}