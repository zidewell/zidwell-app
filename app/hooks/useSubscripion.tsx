// app/hooks/useSubscripion.ts
import { useUserContextData } from "../context/userData";
import { useCallback, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import useSWR from 'swr';

export type SubscriptionTier = 'free' | 'solopreneur' | 'sme' | 'enterprise' | 'corporation';

// Tier hierarchy for access control
const TIER_HIERARCHY: SubscriptionTier[] = ['free', 'solopreneur', 'sme', 'enterprise', 'corporation'];

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch subscription data');
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
    getUpgradeBenefits,
    canAccessFeature,
    userData,
  } = useUserContextData();

  const supabase = createClientComponentClient();

  // Cache key for subscription data
  const subscriptionCacheKey = userData?.id ? `/api/subscription?userId=${userData.id}` : null;

  // Use SWR for subscription data caching
  const { data: cachedSubscription, mutate: mutateSubscription } = useSWR(
    subscriptionCacheKey,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
      fallbackData: subscription,
      onError: (error) => {
        console.error('SWR subscription fetch error:', error);
      },
    }
  );

  // Auto-refresh subscription when data changes
  useEffect(() => {
    if (!userData?.id) return;

    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${userData.id}`,
        },
        () => {
          // Invalidate cache and refetch
          mutateSubscription();
          refreshSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData?.id, mutateSubscription, refreshSubscription, supabase]);

  // Check if user has required tier
  const hasRequiredTier = useCallback((requiredTier: SubscriptionTier): boolean => {
    const currentTier = cachedSubscription?.tier || subscription?.tier || 'free';
    const userTierIndex = TIER_HIERARCHY.indexOf(currentTier as SubscriptionTier);
    const requiredTierIndex = TIER_HIERARCHY.indexOf(requiredTier);
    return userTierIndex >= requiredTierIndex;
  }, [cachedSubscription?.tier, subscription?.tier]);

  // Enhanced canAccessFeature
  const enhancedCanAccessFeature = useCallback(async (featureKey: string, currentCount?: number) => {
    // Check regular subscription access
    return canAccessFeature(featureKey, currentCount);
  }, [canAccessFeature]);

  const getPlanLimits = useCallback(() => {
    const tier = cachedSubscription?.tier || subscription?.tier || 'free';
    
    const limits = {
      free: {
        invoices: 5,
        receipts: 5,
        contracts: 0,
        teamMembers: 0,
        bankAccounts: 0,
        manualBookkeeping: true,
        autoBookkeeping: true,
        paymentLinks: true,
        businessBankAccount: true,
        basicFinancialOverview: true,
      },
      solopreneur: {
        invoices: 10,
        receipts: 'unlimited',
        contracts: 0,
        teamMembers: 0,
        bankAccounts: 0,
        manualBookkeeping: true,
        autoBookkeeping: true,
        brandedInvoices: true,
        expenseTracking: true,
        financialInsights: true,
      },
      sme: {
        invoices: 'unlimited',
        receipts: 'unlimited',
        bankAccounts: 3,
        autoBookkeeping: true,
        bankStatementUpload: true,
        vault: true,
        taxCalculator: true,
        financialStatements: true,
      },
      enterprise: {
        invoices: 'unlimited',
        receipts: 'unlimited',
        contracts: 10,
        teamMembers: 'unlimited',
        bankAccounts: 5,
        manualBookkeeping: true,
        autoBookkeeping: true,
        multiUserAccess: true,
        rolePermissions: true,
        approvalSystem: true,
        downloadableReports: true,
        dedicatedOnboarding: true,
      },
      corporation: {
        invoices: 'unlimited',
        receipts: 'unlimited',
        contracts: 'unlimited',
        teamMembers: 'unlimited',
        bankAccounts: 'unlimited',
        manualBookkeeping: true,
        autoBookkeeping: true,
        departmentAccess: true,
        payrollSystem: true,
        advancedReporting: true,
        customFinancialStructure: true,
        priorityOnboarding: true,
        dedicatedAccountManager: true,
      },
    };

    return limits[tier as keyof typeof limits] || limits.free;
  }, [cachedSubscription?.tier, subscription?.tier]);

  // Get upgrade benefits when moving to a new tier
  const enhancedGetUpgradeBenefits = useCallback((targetTier: SubscriptionTier): string[] => {
    const currentTier = (cachedSubscription?.tier || subscription?.tier || 'free') as SubscriptionTier;
    
    const benefitsMap: Record<string, string[]> = {
      free_to_solopreneur: [
        "Up to 10 invoices (up from 5)",
        "Unlimited receipts (up from 5)",
        "Branded invoices",
        "Better expense tracking",
        "Basic financial insights",
      ],
      free_to_sme: [
        "Upload bank statements (PDF/Excel/CSV)",
        "Connect up to 3 bank accounts",
        "Unlimited invoices",
        "Unlimited receipts",
        "Vault for financial documents",
        "Tax calculator",
        "Financial statements (P&L, Cash Flow, Balance Sheet)",
        "1 extra team member access",
      ],
      free_to_enterprise: [
        "Multi-user access (full team)",
        "Role-based permissions",
        "Request & approval system",
        "Connect 5 bank accounts",
        "Downloadable financial reports",
        "10 contracts",
        "Dedicated onboarding support",
      ],
      free_to_corporation: [
        "Unlimited contracts",
        "Department-based access",
        "Connect unlimited bank accounts",
        "Simple payroll system",
        "Advanced financial reporting",
        "Custom financial structure setup",
        "Priority onboarding support",
        "Dedicated account manager",
      ],
      solopreneur_to_sme: [
        "Upload bank statements (PDF/Excel/CSV)",
        "Connect up to 3 bank accounts",
        "Unlimited invoices (up from 10)",
        "Unlimited receipts",
        "Vault for financial documents",
        "Tax calculator",
        "Financial statements (P&L, Cash Flow, Balance Sheet)",
        "1 extra team member access",
      ],
      solopreneur_to_enterprise: [
        "Multi-user access (full team)",
        "Role-based permissions",
        "Request & approval system",
        "Connect 5 bank accounts",
        "Downloadable financial reports",
        "10 contracts",
        "Dedicated onboarding support",
      ],
      solopreneur_to_corporation: [
        "Unlimited contracts",
        "Department-based access",
        "Connect unlimited bank accounts",
        "Simple payroll system",
        "Advanced financial reporting",
        "Custom financial structure setup",
        "Priority onboarding support",
        "Dedicated account manager",
      ],
      sme_to_enterprise: [
        "Multi-user access (full team) - unlimited team members",
        "Role-based permissions (owner, staff, finance, viewer)",
        "Request & approval system",
        "Connect 5 bank accounts (up from 3)",
        "Downloadable financial reports",
        "10 contracts (up from 1)",
        "Dedicated onboarding support",
      ],
      sme_to_corporation: [
        "Unlimited contracts (up from 1)",
        "Department-based access - HR, Finance, Operations, etc",
        "Connect unlimited bank accounts (up from 3)",
        "Simple payroll system",
        "Advanced financial reporting",
        "Custom financial structure setup",
        "Priority onboarding support",
        "Dedicated account manager",
      ],
      enterprise_to_corporation: [
        "Unlimited contracts (up from 10)",
        "Department-based access - HR, Finance, Operations, etc",
        "Connect unlimited bank accounts (up from 5)",
        "Simple payroll system",
        "Advanced financial reporting",
        "Custom financial structure setup",
        "Priority onboarding support (up from dedicated)",
        "Dedicated account manager",
      ],
    };

    const key = `${currentTier}_to_${targetTier}` as keyof typeof benefitsMap;
    return benefitsMap[key] || getUpgradeBenefits(targetTier) || [];
  }, [cachedSubscription?.tier, subscription?.tier, getUpgradeBenefits]);

  // Manual refresh function
  const refreshAll = useCallback(async () => {
    await Promise.all([
      mutateSubscription(),
      refreshSubscription()
    ]);
  }, [mutateSubscription, refreshSubscription]);

  // Get current tier from cache or context
  const currentTier = cachedSubscription?.tier || subscription?.tier || 'free';
  const currentStatus = cachedSubscription?.status || subscription?.status || 'active';

  // Tier boolean flags
  const isFree = currentTier === 'free';
  const isSolopreneur = currentTier === 'solopreneur';
  const isSME = currentTier === 'sme';
  const isEnterprise = currentTier === 'enterprise';
  const isCorporation = currentTier === 'corporation';

  // Check if user has unlimited access for various features
  const hasUnlimitedInvoices = isSME || isEnterprise || isCorporation;
  const hasUnlimitedReceipts = isSME || isEnterprise || isCorporation;
  const hasUnlimitedContracts = isCorporation || isEnterprise || isSME;

  // Feature access helpers
  const canAccessTaxCalculator = isSME || isEnterprise || isCorporation;
  const canAccessTaxSupport = isEnterprise || isCorporation;
  const canAccessFullTaxFiling = isCorporation;
  const canAddLawyerSignature = isEnterprise || isCorporation;

  // Get tier display name
  const getTierDisplayName = useCallback(() => {
    if (isCorporation) return 'Corporation';
    if (isEnterprise) return 'Enterprise';
    if (isSME) return 'SME';
    if (isSolopreneur) return 'Solopreneur';
    return 'Free Trial';
  }, [isCorporation, isEnterprise, isSME, isSolopreneur]);

  // Get tier icon name (for use with lucide icons)
  const getTierIconName = useCallback(() => {
    if (isCorporation) return 'Sparkles';
    if (isEnterprise) return 'Crown';
    if (isSME) return 'Star';
    if (isSolopreneur) return 'Zap';
    return 'Star';
  }, [isCorporation, isEnterprise, isSME, isSolopreneur]);

  // Get tier colors
  const getTierColors = useCallback(() => {
    if (isCorporation) {
      return {
        bg: 'bg-purple-100 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
        text: 'text-purple-600 dark:text-purple-400',
        badge: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
        hover: 'hover:bg-purple-50 dark:hover:bg-purple-900/30',
        icon: 'text-purple-600 dark:text-purple-400',
      };
    }
    if (isEnterprise) {
      return {
        bg: 'bg-amber-100 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-800',
        text: 'text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        hover: 'hover:bg-amber-50 dark:hover:bg-amber-900/30',
        icon: 'text-amber-600 dark:text-amber-400',
      };
    }
    if (isSME) {
      return {
        bg: 'bg-(--color-accent-yellow)/10',
        border: 'border-(--color-accent-yellow)/30',
        text: 'text-(--color-accent-yellow)',
        badge: 'bg-(--color-accent-yellow)/20 text-(--color-accent-yellow)',
        hover: 'hover:bg-(--color-accent-yellow)/5',
        icon: 'text-(--color-accent-yellow)',
      };
    }
    if (isSolopreneur) {
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-600 dark:text-blue-400',
        badge: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/30',
        icon: 'text-blue-600 dark:text-blue-400',
      };
    }
    return {
      bg: 'bg-gray-100 dark:bg-gray-800',
      border: 'border-gray-200 dark:border-gray-700',
      text: 'text-gray-600 dark:text-gray-400',
      badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      hover: 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
      icon: 'text-gray-600 dark:text-gray-400',
    };
  }, [isCorporation, isEnterprise, isSME, isSolopreneur]);

  // Get limit for a specific feature
  const getFeatureLimit = useCallback((feature: 'invoices' | 'receipts' | 'contracts' | 'teamMembers' | 'bankAccounts'): number | string => {
    const limits = getPlanLimits();
    return limits[feature] || 0;
  }, [getPlanLimits]);

  // Check if user has reached a specific limit
  const hasReachedLimit = useCallback((feature: 'invoices' | 'receipts' | 'contracts' | 'teamMembers' | 'bankAccounts', currentCount: number): boolean => {
    const limit = getFeatureLimit(feature);
    if (limit === 'unlimited') return false;
    return currentCount >= (limit as number);
  }, [getFeatureLimit]);

  // Get remaining count for a specific feature
  const getRemainingCount = useCallback((feature: 'invoices' | 'receipts' | 'contracts' | 'teamMembers' | 'bankAccounts', currentCount: number): number | string => {
    const limit = getFeatureLimit(feature);
    if (limit === 'unlimited') return 'unlimited';
    return Math.max(0, (limit as number) - currentCount);
  }, [getFeatureLimit]);

  return {
    // Core subscription data
    subscription: cachedSubscription || subscription,
    loading: subscriptionLoading,
    refreshSubscription: refreshAll,
    
    // Tier info
    userTier: currentTier,
    currentTier,
    currentStatus,
    
    // Tier boolean flags
    isFree,
    isSolopreneur,
    isSME,
    isEnterprise,
    isCorporation,
    
    // Legacy aliases for backward compatibility (maps to new tier names)
    isZidLite: isSolopreneur,      // Legacy: ZidLite → Solopreneur
    isGrowth: isSME,               // Legacy: Growth → SME
    isPremium: isEnterprise,       // Legacy: Premium → Enterprise
    isElite: isCorporation,        // Legacy: Elite → Corporation
    
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
    getFeatureLimit,
    hasReachedLimit,
    getRemainingCount,
    getTierDisplayName,
    getTierIconName,
    getTierColors,
    
    // Status flags
    isActive: currentStatus === 'active',
    isExpired: currentStatus === 'expired',
    isCancelled: currentStatus === 'cancelled',
    
    // User info
    userId: userData?.id,
    
    // Expiry info
    expiresAt: cachedSubscription?.expiresAt || subscription?.expiresAt,
    daysRemaining: (cachedSubscription?.expiresAt || subscription?.expiresAt)
      ? Math.ceil((new Date(cachedSubscription?.expiresAt || subscription?.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null,
  };
};