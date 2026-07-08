"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Receipt,
  FileSignature,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Zap,
  Crown,
  Sparkles,
  Building2,
  Briefcase,
  Gem,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";
import { useSubscription } from "@/app/hooks/useSubscripion";

interface UsageSummaryProps {
  usage: {
    invoices: {
      used: number;
      limit: number | string;
      remaining: number | string;
      type: string;
      requiresUpgrade: boolean;
      canCreate: boolean;
    };
    receipts: {
      used: number;
      limit: number | string;
      remaining: number | string;
      type: string;
      requiresUpgrade: boolean;
      canCreate: boolean;
    };
    contracts: {
      used: number;
      limit: number | string;
      remaining: number | string;
      type: string;
      requiresUpgrade: boolean;
      canCreate: boolean;
    };
    tier: string;
    limits: {
      invoices: number | string;
      receipts: number | string;
      contracts: number | string;
      teamMembers: number | string;
      bankAccounts: number | string;
    };
  };
  onRefresh?: () => void;
}

// Tier display names mapping
const TIER_DISPLAY_NAMES: Record<string, string> = {
  free: "Free",
  solopreneur: "Solopreneur",
  sme: "SME",
  enterprise: "Enterprise",
  corporation: "Corporation",
};

// Tier icons mapping
const TIER_ICONS: Record<string, any> = {
  free: TrendingUp,
  solopreneur: Briefcase,
  sme: Building2,
  enterprise: Crown,
  corporation: Gem,
};

// Legacy tier mapping for backward compatibility
const LEGACY_TIER_MAP: Record<string, string> = {
  zidlite: "solopreneur",
  growth: "sme",
  premium: "enterprise",
  elite: "corporation",
};

export function UsageSummary({ usage, onRefresh }: UsageSummaryProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { userTier } = useSubscription();

  // Map legacy tier to new tier
  const displayTier = (tier: string) => {
    return LEGACY_TIER_MAP[tier] || tier;
  };

  const currentTier = displayTier(usage?.tier || userTier || "free");
  const tierDisplayName = TIER_DISPLAY_NAMES[currentTier] || currentTier;
  const TierIcon = TIER_ICONS[currentTier] || TrendingUp;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    // Simulate loading state
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Calculate percentage for progress bars
  const getPercentage = (used: number, limit: number | string) => {
    if (limit === "unlimited") return 0;
    const numLimit = limit as number;
    if (numLimit === 0) return 0;
    return Math.min((used / numLimit) * 100, 100);
  };

  // Get color for progress bar
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-(--color-accent-yellow)";
  };

  // Get status text
  const getStatusText = (used: number, limit: number | string) => {
    if (limit === "unlimited") return "Unlimited";
    const numLimit = limit as number;
    if (numLimit === 0) return "Not available";
    const remaining = numLimit - used;
    if (remaining <= 0) return "Limit reached";
    if (remaining <= 3) return `${remaining} remaining`;
    return `${remaining} left`;
  };

  // Check if user is on free tier and should upgrade
  const shouldUpgrade = currentTier === "free" || currentTier === "solopreneur";

  // Get suggested upgrade tier
  const getSuggestedUpgrade = () => {
    if (currentTier === "free") return "solopreneur";
    if (currentTier === "solopreneur") return "sme";
    if (currentTier === "sme") return "enterprise";
    if (currentTier === "enterprise") return "corporation";
    return "corporation";
  };

  const suggestedTier = getSuggestedUpgrade();

  return (
    <div className="bg-(--bg-primary) border-2 border-(--border-color) shadow-[4px_4px_0px_var(--border-color)] rounded-xl p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <TierIcon className="h-5 w-5 text-(--color-accent-yellow)" />
            <h3 className="text-sm font-bold text-(--text-primary)">
              Usage Summary
            </h3>
          </div>
          <span className="text-xs px-2 py-0.5 bg-(--color-accent-yellow)/10 text-(--color-accent-yellow) border border-(--color-accent-yellow)/20 rounded-full">
            {tierDisplayName}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1.5 hover:bg-(--bg-secondary) rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 text-(--text-secondary) ${
              isRefreshing ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>

      {/* Usage Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Invoices */}
        <div className="bg-(--bg-secondary) rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-(--color-accent-yellow)" />
              <span className="text-xs font-medium text-(--text-secondary)">
                Invoices
              </span>
            </div>
            <span className="text-xs font-bold text-(--text-primary)">
              {usage?.invoices?.used || 0}
              {usage?.invoices?.limit !== "unlimited" && (
                <span className="text-(--text-secondary) font-normal">
                  /{usage?.invoices?.limit || 0}
                </span>
              )}
            </span>
          </div>
          <div className="h-1.5 bg-(--bg-primary) rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usage?.invoices?.limit === "unlimited"
                  ? "w-full bg-(--color-accent-yellow)"
                  : getProgressColor(
                      getPercentage(
                        usage?.invoices?.used || 0,
                        usage?.invoices?.limit || 0
                      )
                    )
              }`}
              style={{
                width:
                  usage?.invoices?.limit === "unlimited"
                    ? "100%"
                    : `${getPercentage(
                        usage?.invoices?.used || 0,
                        usage?.invoices?.limit || 0
                      )}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-(--text-secondary) mt-1.5">
            {getStatusText(usage?.invoices?.used || 0, usage?.invoices?.limit || 0)}
          </p>
        </div>

        {/* Receipts */}
        <div className="bg-(--bg-secondary) rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-(--color-accent-yellow)" />
              <span className="text-xs font-medium text-(--text-secondary)">
                Receipts
              </span>
            </div>
            <span className="text-xs font-bold text-(--text-primary)">
              {usage?.receipts?.used || 0}
              {usage?.receipts?.limit !== "unlimited" && (
                <span className="text-(--text-secondary) font-normal">
                  /{usage?.receipts?.limit || 0}
                </span>
              )}
            </span>
          </div>
          <div className="h-1.5 bg-(--bg-primary) rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usage?.receipts?.limit === "unlimited"
                  ? "w-full bg-(--color-accent-yellow)"
                  : getProgressColor(
                      getPercentage(
                        usage?.receipts?.used || 0,
                        usage?.receipts?.limit || 0
                      )
                    )
              }`}
              style={{
                width:
                  usage?.receipts?.limit === "unlimited"
                    ? "100%"
                    : `${getPercentage(
                        usage?.receipts?.used || 0,
                        usage?.receipts?.limit || 0
                      )}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-(--text-secondary) mt-1.5">
            {getStatusText(usage?.receipts?.used || 0, usage?.receipts?.limit || 0)}
          </p>
        </div>

        {/* Contracts */}
        <div className="bg-(--bg-secondary) rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-(--color-accent-yellow)" />
              <span className="text-xs font-medium text-(--text-secondary)">
                Contracts
              </span>
            </div>
            <span className="text-xs font-bold text-(--text-primary)">
              {usage?.contracts?.used || 0}
              {usage?.contracts?.limit !== "unlimited" && (
                <span className="text-(--text-secondary) font-normal">
                  /{usage?.contracts?.limit || 0}
                </span>
              )}
            </span>
          </div>
          <div className="h-1.5 bg-(--bg-primary) rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usage?.contracts?.limit === "unlimited"
                  ? "w-full bg-(--color-accent-yellow)"
                  : getProgressColor(
                      getPercentage(
                        usage?.contracts?.used || 0,
                        usage?.contracts?.limit || 0
                      )
                    )
              }`}
              style={{
                width:
                  usage?.contracts?.limit === "unlimited"
                    ? "100%"
                    : `${getPercentage(
                        usage?.contracts?.used || 0,
                        usage?.contracts?.limit || 0
                      )}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-(--text-secondary) mt-1.5">
            {getStatusText(usage?.contracts?.used || 0, usage?.contracts?.limit || 0)}
          </p>
        </div>
      </div>

      {/* Plan Limits Info */}
      {usage?.limits && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-(--bg-secondary) rounded-lg p-2 text-center">
            <p className="text-[10px] text-(--text-secondary)">Team Members</p>
            <p className="text-sm font-bold text-(--text-primary)">
              {usage.limits.teamMembers === "unlimited"
                ? "∞"
                : usage.limits.teamMembers || 0}
            </p>
          </div>
          <div className="bg-(--bg-secondary) rounded-lg p-2 text-center">
            <p className="text-[10px] text-(--text-secondary)">Bank Accounts</p>
            <p className="text-sm font-bold text-(--text-primary)">
              {usage.limits.bankAccounts === "unlimited"
                ? "∞"
                : usage.limits.bankAccounts || 0}
            </p>
          </div>
          <div className="bg-(--bg-secondary) rounded-lg p-2 text-center">
            <p className="text-[10px] text-(--text-secondary)">Transfer Fee</p>
            <p className="text-sm font-bold text-(--text-primary)">₦50</p>
          </div>
          <div className="bg-(--bg-secondary) rounded-lg p-2 text-center">
            <p className="text-[10px] text-(--text-secondary)">Plan</p>
            <p className="text-sm font-bold text-(--color-accent-yellow)">
              {tierDisplayName}
            </p>
          </div>
        </div>
      )}

      {/* Upgrade Alert */}
      {shouldUpgrade && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
              <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
                You're on the <span className="font-bold">{tierDisplayName}</span> plan.
                {currentTier === "free"
                  ? " Upgrade to access more features and higher limits."
                  : " Upgrade to unlock more features and unlimited usage."}
              </p>
            </div>
            <Link href={`/pricing?upgrade=${suggestedTier}`}>
              <Button
                size="sm"
                className="bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) font-bold whitespace-nowrap text-xs sm:text-sm h-8 sm:h-9"
              >
                Upgrade Now
                <Zap className="h-3 w-3 sm:h-4 sm:w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Limit Warning */}
      {usage?.invoices?.requiresUpgrade && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs sm:text-sm text-red-800 dark:text-red-200">
              You've reached your invoice limit of {usage.invoices.limit}. 
              <Link href={`/pricing?upgrade=${suggestedTier}`} className="ml-1 font-bold text-(--color-accent-yellow) hover:underline">
                Upgrade now
              </Link>
              {usage.invoices.limit !== "unlimited" && ` to create more invoices.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsageSummary;