// app/components/subscription-components/subscriptionBadges.tsx
"use client";

import { useSubscription } from "@/app/hooks/useSubscripion";
import {
  Crown,
  Zap,
  AlertCircle,
  Clock,
  Briefcase,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";

const tierConfig = {
  free: {
    icon: Star,
    color: "text-gray-600",
    bg: "bg-gray-100",
    darkBg: "dark:bg-gray-800",
    darkColor: "dark:text-gray-300",
    label: "Free",
  },
  starter: {
    icon: Briefcase,
    color: "text-blue-600",
    bg: "bg-blue-100",
    darkBg: "dark:bg-blue-900/30",
    darkColor: "dark:text-blue-300",
    label: "Free", // starter IS the free plan
  },
  sme: {
    icon: Zap,
    color: "text-green-600",
    bg: "bg-green-100",
    darkBg: "dark:bg-green-900/30",
    darkColor: "dark:text-green-300",
    label: "SME",
  },
  enterprise: {
    icon: Crown,
    color: "text-(--color-accent-yellow)",
    bg: "bg-(--color-accent-yellow)/10",
    darkBg: "dark:bg-(--color-accent-yellow)/20",
    darkColor: "dark:text-(--color-accent-yellow)",
    label: "Enterprise",
  },
};

const fallbackConfig = tierConfig.starter;

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
  const { subscription, isActive, userTier } = useSubscription();
  const [trialInfo, setTrialInfo] = useState<any>(null);

  // useSubscription already normalizes booster/console → starter
  const tier = (userTier ?? "starter") as keyof typeof tierConfig;
  const config = tierConfig[tier] ?? fallbackConfig;
  const Icon = config.icon;

  useEffect(() => {
    if (showTrial) {
      fetch(`/api/trials/check?feature=${featureKey}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.isActive) setTrialInfo(data);
        })
        .catch(() => setTrialInfo(null));
    }
  }, [showTrial, featureKey]);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  if (showTrial && tier === "starter" && trialInfo?.isActive) {
    return (
      <div
        className={`inline-flex items-center gap-1 rounded-full font-medium bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300 ${sizeClasses[size]} ${className}`}
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

  if (!isActive && tier !== "starter" && tier !== "free") {
    return (
      <div
        className={`inline-flex items-center gap-1 rounded-full font-medium bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300 ${sizeClasses[size]} ${className}`}
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

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full font-medium ${config.bg} ${config.color} ${config.darkBg} ${config.darkColor} ${sizeClasses[size]} ${className}`}
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