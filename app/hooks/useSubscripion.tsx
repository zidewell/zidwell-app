// app/hooks/useSubscripion.tsx
"use client";

import { useUserContextData } from "../context/userData";
import { useCallback, useEffect, useMemo } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import useSWR from "swr";

// Real Zidwell tiers. "starter" IS the free plan — it's the default
// tier a user lands on and it has zero cost. "free" exists only as a
// pre-subscription sentinel so the hook has a value to return before
// the first subscription row is created.
export type SubscriptionTier = "free" | "starter" | "sme" | "enterprise";

// Tier hierarchy for access control — lowest → highest
const TIER_HIERARCHY: SubscriptionTier[] = [
  "free",
  "starter",
  "sme",
  "enterprise",
];

// Display names — starter and free both render as "Free"
const TIER_DISPLAY_NAME: Record<SubscriptionTier, string> = {
  free: "Free",
  starter: "Free",
  sme: "SME",
  enterprise: "Enterprise",
};

// Fetcher for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch subscription data");
  }
  return response.json();
};

/**
 * Normalize whatever the API returns into a valid SubscriptionTier.
 *
 * - "booster" and "console" are ZidStore-only tiers that can appear in
 *   `users.subscription_tier`. They carry no Zidwell invoice meaning,
 *   so we normalize them down to "starter" (the free plan).
 * - Anything unrecognized or missing → "free".
 */
const normalizeTier = (rawTier?: string | null): SubscriptionTier => {
  if (!rawTier) return "free";
  const lower = rawTier.toLowerCase();
  if (lower === "free") return "free";
  if (lower === "starter") return "starter";
  if (lower === "sme") return "sme";
  if (lower === "enterprise") return "enterprise";
  // "booster", "console", and anything else → treat as starter
  return "starter";
};

export const useSubscription = () => {
  const {
    subscription,
    subscriptionLoading,
    refreshSubscription: contextRefresh,
    checkFeatureAccess,
    subscribe,
    cancelSubscription,
    getUpgradeBenefits: contextGetUpgradeBenefits,
    canAccessFeature,
    userData,
  } = useUserContextData();

  // Stable Supabase client across renders
  const supabase = useMemo(() => createClientComponentClient(), []);

  // SWR cache key
  const subscriptionCacheKey = userData?.id
    ? `/api/subscription?userId=${userData.id}`
    : null;

  const {
    data: cachedSubscription,
    mutate: mutateSubscription,
    isLoading: swrLoading,
    isValidating,
  } = useSWR(subscriptionCacheKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 1000,
    fallbackData: subscription ?? undefined,
    onError: (error) => {
      console.error("SWR subscription fetch error:", error);
    },
  });

  // Realtime subscription sync
  useEffect(() => {
    if (!userData?.id) return;

    const channelName = `subscription-changes-${userData.id}`;

    const existingChannel = supabase
      .getChannels()
      .find((ch) => ch.topic === `realtime:${channelName}`);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${userData.id}`,
        },
        () => {
          mutateSubscription();
          contextRefresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData?.id, mutateSubscription, contextRefresh, supabase]);

  // ─── Current tier / status (normalized) ───
  const rawTier = cachedSubscription?.tier || subscription?.tier;
  const currentTier: SubscriptionTier = normalizeTier(rawTier);

  const currentStatus =
    cachedSubscription?.status || subscription?.status || "active";

  // ─── Tier hierarchy check ───
  const hasRequiredTier = useCallback(
    (requiredTier: SubscriptionTier): boolean => {
      const userTierIndex = TIER_HIERARCHY.indexOf(currentTier);
      const requiredTierIndex = TIER_HIERARCHY.indexOf(requiredTier);
      return userTierIndex >= requiredTierIndex;
    },
    [currentTier],
  );

  const enhancedCanAccessFeature = useCallback(
    async (featureKey: string, currentCount?: number) => {
      return canAccessFeature(featureKey, currentCount);
    },
    [canAccessFeature],
  );

  // ─── Plan limits (per-tier feature map) ───
  // starter and free are the same plan — 5 invoices / 5 receipts.
  const getPlanLimits = useCallback(() => {
    const limits = {
      free: {
        invoices: 5,
        receipts: 5,
        contracts: 0,
        teamMembers: 0,
        bankAccounts: 0,
        businessBankAccount: true,
        businessPlanTemplate: true,
        automaticBookkeeping: true,
        onlineStorefront: true,
        documentVault: true,
        basicFinancialOverview: true,
      },
      starter: {
        invoices: 5,
        receipts: 5,
        contracts: 0,
        teamMembers: 0,
        bankAccounts: 0,
        businessBankAccount: true,
        businessPlanTemplate: true,
        automaticBookkeeping: true,
        onlineStorefront: true,
        documentVault: true,
      },
      sme: {
        invoices: "unlimited",
        receipts: "unlimited",
        contracts: 0,
        teamMembers: 1,
        bankAccounts: 1,
        businessBankAccount: true,
        businessPlanTemplate: true,
        automaticBookkeeping: true,
        onlineStorefront: true,
        documentVault: true,
        internationalPayments: true,
      },
      enterprise: {
        invoices: "unlimited",
        receipts: "unlimited",
        contracts: 10,
        teamMembers: 3,
        bankAccounts: "multiple",
        businessBankAccount: true,
        businessPlanTemplate: true,
        automaticBookkeeping: true,
        onlineStorefront: true,
        documentVault: true,
        internationalPayments: true,
        connectBankAccounts: true,
        increasedTransactionLimits: true,
        dedicatedSupportTeam: true,
      },
    };

    return limits[currentTier] || limits.free;
  }, [currentTier]);

  // ─── Upgrade benefits map ───
  const enhancedGetUpgradeBenefits = useCallback(
    (targetTier: SubscriptionTier): string[] => {
      const benefitsMap: Record<string, string[]> = {
        free_to_starter: [
          "Business bank account",
          "Business Plan Template",
          "Automatic Bookkeeping",
          "Invoice Tool",
          "Receipt Tool",
          "Online storefront",
          "Document Vault",
        ],
        free_to_sme: [
          "Everything in Starter, plus:",
          "Unlimited invoices & receipts",
          "International payments",
          "One Extra User",
          "Add-ons: Payroll, HMO, Tax Filing Support",
        ],
        free_to_enterprise: [
          "Everything in SME, plus:",
          "Increased transaction limits",
          "Connect Your Bank Accounts",
          "Three Extra Users",
          "Dedicated support team",
        ],
        starter_to_sme: [
          "Unlimited invoices & receipts",
          "International payments",
          "One Extra User",
          "Add-ons: Payroll, HMO, Tax Filing Support",
        ],
        starter_to_enterprise: [
          "Unlimited invoices & receipts",
          "International payments",
          "Connect Your Bank Accounts",
          "Increased transaction limits",
          "Three Extra Users",
          "Dedicated support team",
        ],
        sme_to_enterprise: [
          "Increased transaction limits",
          "Connect Your Bank Accounts",
          "Three Extra Users (up from 1)",
          "Dedicated support team",
        ],
      };

      const key = `${currentTier}_to_${targetTier}`;
      return (
        benefitsMap[key] || contextGetUpgradeBenefits(targetTier) || []
      );
    },
    [currentTier, contextGetUpgradeBenefits],
  );

  // ─── Refresh helper ───
  const refreshAll = useCallback(async () => {
    try {
      await mutateSubscription(undefined, { revalidate: true });
    } catch (err) {
      console.error("[useSubscription] SWR revalidate failed:", err);
    }
    try {
      await contextRefresh();
    } catch (err) {
      console.error("[useSubscription] context refresh failed:", err);
    }
  }, [mutateSubscription, contextRefresh]);

  // ─── Tier boolean flags ───
  const isFree = currentTier === "free" || currentTier === "starter";
  const isStarter = currentTier === "starter";
  const isSME = currentTier === "sme";
  const isEnterprise = currentTier === "enterprise";

  // ─── Feature access helpers ───
  const hasUnlimitedInvoices = isSME || isEnterprise;
  const hasUnlimitedReceipts = isSME || isEnterprise;
  const hasUnlimitedContracts = false;

  const canAccessTaxCalculator = isSME || isEnterprise;
  const canAccessTaxSupport = isEnterprise;
  const canAccessFullTaxFiling = false;
  const canAddLawyerSignature = isEnterprise;

  // ─── Display helpers ───
  const getTierDisplayName = useCallback((): string => {
    return TIER_DISPLAY_NAME[currentTier];
  }, [currentTier]);

  const getTierIconName = useCallback((): string => {
    if (isEnterprise) return "Crown";
    if (isSME) return "Zap";
    if (isStarter) return "Briefcase";
    return "Star";
  }, [isEnterprise, isSME, isStarter]);

  const getTierColors = useCallback(() => {
    if (isEnterprise) {
      return {
        bg: "bg-amber-100 dark:bg-amber-900/20",
        border: "border-amber-200 dark:border-amber-800",
        text: "text-amber-600 dark:text-amber-400",
        badge:
          "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
        hover: "hover:bg-amber-50 dark:hover:bg-amber-900/30",
        icon: "text-amber-600 dark:text-amber-400",
      };
    }
    if (isSME) {
      return {
        bg: "bg-(--color-accent-yellow)/10",
        border: "border-(--color-accent-yellow)/30",
        text: "text-(--color-accent-yellow)",
        badge: "bg-(--color-accent-yellow)/20 text-(--color-accent-yellow)",
        hover: "hover:bg-(--color-accent-yellow)/5",
        icon: "text-(--color-accent-yellow)",
      };
    }
    if (isStarter) {
      return {
        bg: "bg-blue-100 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-600 dark:text-blue-400",
        badge:
          "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
        hover: "hover:bg-blue-50 dark:hover:bg-blue-900/30",
        icon: "text-blue-600 dark:text-blue-400",
      };
    }
    return {
      bg: "bg-gray-100 dark:bg-gray-800",
      border: "border-gray-200 dark:border-gray-700",
      text: "text-gray-600 dark:text-gray-400",
      badge:
        "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
      hover: "hover:bg-gray-50 dark:hover:bg-gray-800/50",
      icon: "text-gray-600 dark:text-gray-400",
    };
  }, [isEnterprise, isSME, isStarter]);

  // ─── Expiry info ───
  const expiresAt = cachedSubscription?.expiresAt || subscription?.expiresAt;
  const daysRemaining = expiresAt
    ? Math.ceil(
        (new Date(expiresAt).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  const loading = !cachedSubscription && (swrLoading || subscriptionLoading);

  return {
    subscription: cachedSubscription || subscription,
    loading,
    isValidating,
    refetch: refreshAll,
    refreshSubscription: refreshAll,

    // Tier info
    userTier: currentTier,
    currentTier,
    currentStatus,

    // Canonical flags
    isFree,
    isStarter,
    isSME,
    isEnterprise,

    // Legacy aliases kept so existing consumers don't break
    isZidLite: isStarter,
    isGrowth: isSME,
    isPremium: isEnterprise,
    isElite: isEnterprise,

    // Feature access helpers
    hasUnlimitedInvoices,
    hasUnlimitedReceipts,
    hasUnlimitedContracts,
    canAccessTaxCalculator,
    canAccessTaxSupport,
    canAccessFullTaxFiling,
    canAddLawyerSignature,

    // Helper functions
    hasRequiredTier,
    checkFeatureAccess,
    subscribe,
    cancelSubscription,
    getUpgradeBenefits: enhancedGetUpgradeBenefits,
    canAccessFeature: enhancedCanAccessFeature,
    getPlanLimits,

    // Display helpers
    getTierDisplayName,
    getTierIconName,
    getTierColors,

    // Status flags
    isActive: currentStatus === "active",
    isExpired: currentStatus === "expired",
    isCancelled: currentStatus === "cancelled",

    // User info
    userId: userData?.id,

    // Expiry info
    expiresAt,
    daysRemaining,
  };
};