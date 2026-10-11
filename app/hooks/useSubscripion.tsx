// app/hooks/useSubscripion.tsx
"use client";

import { useUserContextData } from "../context/userData";
import { useCallback, useEffect, useMemo } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import useSWR from "swr";

export type SubscriptionTier =
  | "free"
  | "starter"
  | "sme"
  | "enterprise"
  | "console";

// Tier hierarchy for access control — lowest → highest
const TIER_HIERARCHY: SubscriptionTier[] = [
  "free",
  "starter",
  "sme",
  "enterprise",
  "console",
];

// Display names, kept in one place so every consumer agrees
const TIER_DISPLAY_NAME: Record<SubscriptionTier, string> = {
  free: "Free",
  starter: "Starter",
  sme: "SME",
  enterprise: "Enterprise",
  console: "Console",
};

// Fetcher for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch subscription data");
  }
  return response.json();
};

export const useSubscription = () => {
  const {
    subscription,
    subscriptionLoading,
    refreshSubscription,
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

  const { data: cachedSubscription, mutate: mutateSubscription } = useSWR(
    subscriptionCacheKey,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      fallbackData: subscription,
      onError: (error) => {
        console.error("SWR subscription fetch error:", error);
      },
    },
  );

  // Realtime subscription sync
  useEffect(() => {
    if (!userData?.id) return;

    const channelName = `subscription-changes-${userData.id}`;

    // Remove any existing channel with this name (StrictMode / re-render guard)
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
          refreshSubscription();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData?.id, mutateSubscription, refreshSubscription, supabase]);

  // ─── Current tier / status ───
  const currentTier: SubscriptionTier =
    ((cachedSubscription?.tier || subscription?.tier) as SubscriptionTier) ||
    "free";

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

  // Async version (kept for compatibility with context API)
  const enhancedCanAccessFeature = useCallback(
    async (featureKey: string, currentCount?: number) => {
      return canAccessFeature(featureKey, currentCount);
    },
    [canAccessFeature],
  );

  // ─── Plan limits (per-tier feature map) ───
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
        invoices: "unlimited",
        receipts: "unlimited",
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
      console: {
        invoices: "unlimited",
        receipts: "unlimited",
        contracts: "unlimited",
        teamMembers: "unlimited",
        bankAccounts: "unlimited",
        businessBankAccount: true,
        businessPlanTemplate: true,
        automaticBookkeeping: true,
        onlineStorefront: true,
        documentVault: true,
        internationalPayments: true,
        connectBankAccounts: true,
        increasedTransactionLimits: true,
        dedicatedSupportTeam: true,
        subAccounts: true,
        rolesPermissions: true,
        approvalSystem: true,
        payrollSystem: true,
        advancedReporting: true,
        customFinancialStructure: true,
        dedicatedAccountManager: true,
      },
    };

    return limits[currentTier] || limits.free;
  }, [currentTier]);

  // ─── Upgrade benefits map ───
  const enhancedGetUpgradeBenefits = useCallback(
    (targetTier: SubscriptionTier): string[] => {
      const benefitsMap: Record<string, string[]> = {
        free_to_starter: [
          "Unlimited invoices & receipts",
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
        free_to_console: [
          "Everything in Enterprise, plus:",
          "Sub Accounts",
          "Roles & Permissions",
          "Approvals",
          "Unlimited users",
          "Custom pricing",
        ],
        starter_to_sme: [
          "International payments",
          "One Extra User",
          "Add-ons: Payroll, HMO, Tax Filing Support",
        ],
        starter_to_enterprise: [
          "International payments",
          "Connect Your Bank Accounts",
          "Increased transaction limits",
          "Three Extra Users",
          "Dedicated support team",
        ],
        starter_to_console: [
          "Everything in Enterprise, plus:",
          "Sub Accounts",
          "Roles & Permissions",
          "Approvals",
          "Unlimited users",
        ],
        sme_to_enterprise: [
          "Increased transaction limits",
          "Connect Your Bank Accounts",
          "Three Extra Users (up from 1)",
          "Dedicated support team",
        ],
        sme_to_console: [
          "Everything in Enterprise, plus:",
          "Sub Accounts",
          "Roles & Permissions",
          "Approvals",
          "Unlimited users",
        ],
        enterprise_to_console: [
          "Sub Accounts",
          "Roles & Permissions",
          "Approvals",
          "Unlimited users",
          "Custom pricing",
        ],
      };

      const key = `${currentTier}_to_${targetTier}`;
      return (
        benefitsMap[key] ||
        contextGetUpgradeBenefits(targetTier) ||
        []
      );
    },
    [currentTier, contextGetUpgradeBenefits],
  );

  // ─── Refresh helper ───
  const refreshAll = useCallback(async () => {
    await Promise.all([mutateSubscription(), refreshSubscription()]);
  }, [mutateSubscription, refreshSubscription]);

  // ─── Tier boolean flags ───
  const isFree = currentTier === "free";
  const isStarter = currentTier === "starter";
  const isSME = currentTier === "sme";
  const isEnterprise = currentTier === "enterprise";
  const isConsole = currentTier === "console";

  // ─── Feature access helpers ───
  const hasUnlimitedInvoices = isStarter || isSME || isEnterprise || isConsole;
  const hasUnlimitedReceipts = isStarter || isSME || isEnterprise || isConsole;
  const hasUnlimitedContracts = isConsole;

  const canAccessTaxCalculator = isSME || isEnterprise || isConsole;
  const canAccessTaxSupport = isEnterprise || isConsole;
  const canAccessFullTaxFiling = isConsole;
  const canAddLawyerSignature = isEnterprise || isConsole;

  // ─── Display helpers ───
  const getTierDisplayName = useCallback((): string => {
    return TIER_DISPLAY_NAME[currentTier];
  }, [currentTier]);

  const getTierIconName = useCallback((): string => {
    if (isConsole) return "Sparkles";
    if (isEnterprise) return "Crown";
    if (isSME) return "Zap";
    if (isStarter) return "Briefcase";
    return "Star";
  }, [isConsole, isEnterprise, isSME, isStarter]);

  const getTierColors = useCallback(() => {
    if (isConsole) {
      return {
        bg: "bg-purple-100 dark:bg-purple-900/20",
        border: "border-purple-200 dark:border-purple-800",
        text: "text-purple-600 dark:text-purple-400",
        badge:
          "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
        hover: "hover:bg-purple-50 dark:hover:bg-purple-900/30",
        icon: "text-purple-600 dark:text-purple-400",
      };
    }
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
  }, [isConsole, isEnterprise, isSME, isStarter]);

  // ─── Expiry info ───
  const expiresAt = cachedSubscription?.expiresAt || subscription?.expiresAt;
  const daysRemaining = expiresAt
    ? Math.ceil(
        (new Date(expiresAt).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  return {
    // Core subscription data
    subscription: cachedSubscription || subscription,
    loading: subscriptionLoading,
    refreshSubscription: refreshAll,

    // Tier info
    userTier: currentTier,
    currentTier,
    currentStatus,

    // Tier boolean flags (canonical names)
    isFree,
    isStarter,
    isSME,
    isEnterprise,
    isConsole,

    // Legacy aliases from an earlier naming pass
    isZidLite: isStarter,
    isGrowth: isSME,
    isPremium: isEnterprise,
    isElite: isConsole,

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