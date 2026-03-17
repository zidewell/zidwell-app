// hooks/useSubscription.ts
import { useUserContextData } from "../context/userData";
import { useState, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export type SubscriptionTier = 'free' | 'zidlite' | 'growth' | 'premium' | 'elite';

// Tier hierarchy for access control
const TIER_HIERARCHY: SubscriptionTier[] = ['free', 'zidlite', 'growth', 'premium', 'elite'];

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
  const [trialStatus, setTrialStatus] = useState<Record<string, any>>({});

  // Check if user has required tier
  const hasRequiredTier = useCallback((requiredTier: SubscriptionTier): boolean => {
    if (!subscription?.tier) return false;
    
    const userTierIndex = TIER_HIERARCHY.indexOf(subscription.tier as SubscriptionTier);
    const requiredTierIndex = TIER_HIERARCHY.indexOf(requiredTier);
    
    return userTierIndex >= requiredTierIndex;
  }, [subscription?.tier]);

  // Check trial status for a specific feature
  const checkTrialStatus = useCallback(async (featureKey: string) => {
    if (!userData?.id) return { isActive: false };

    try {
      const { data: trial, error } = await supabase
        .from("user_trials")
        .select("*")
        .eq("user_id", userData.id)
        .eq("feature_key", featureKey)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;

      if (!trial) {
        return { isActive: false };
      }

      const now = new Date();
      const endsAt = new Date(trial.ends_at);

      if (endsAt > now) {
        const daysRemaining = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const hoursRemaining = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60));
        
        return { 
          isActive: true, 
          daysRemaining,
          hoursRemaining,
          endsAt,
          trialId: trial.id
        };
      } else {
        // Auto-expire if past date
        await supabase
          .from("user_trials")
          .update({ status: "expired", updated_at: new Date().toISOString() })
          .eq("id", trial.id);
        
        return { isActive: false };
      }
    } catch (error) {
      console.error("Error checking trial status:", error);
      return { isActive: false };
    }
  }, [userData?.id, supabase]);

  // Activate a trial for a feature
  const activateTrial = useCallback(async (featureKey: string, durationDays: number = 14) => {
    if (!userData?.id) return { success: false, error: "User not authenticated" };

    try {
      // Check if user already had or has a trial
      const { data: existingTrial } = await supabase
        .from("user_trials")
        .select("*")
        .eq("user_id", userData.id)
        .eq("feature_key", featureKey)
        .maybeSingle();

      if (existingTrial) {
        if (existingTrial.status === 'active') {
          return { success: false, error: "You already have an active trial for this feature" };
        }
        if (existingTrial.status === 'expired') {
          return { success: false, error: "Your trial for this feature has already expired" };
        }
      }

      // Calculate trial dates
      const startsAt = new Date();
      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + durationDays);

      // Create trial record
      const { data: trial, error } = await supabase
        .from("user_trials")
        .insert({
          user_id: userData.id,
          feature_key: featureKey,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setTrialStatus(prev => ({
        ...prev,
        [featureKey]: { isActive: true, endsAt, daysRemaining: durationDays }
      }));

      return { success: true, trial, endsAt };
    } catch (error: any) {
      console.error("Error activating trial:", error);
      return { success: false, error: error.message };
    }
  }, [userData?.id, supabase]);

  // Enhanced canAccessFeature with trial support
  const enhancedCanAccessFeature = useCallback(async (featureKey: string, currentCount?: number) => {
    // Special handling for trial features
    const trialFeatures = ['bookkeeping_access', 'tax_calculator_access'];
    
    if (trialFeatures.includes(featureKey)) {
      // First check if user has active trial
      const trial = await checkTrialStatus(featureKey);
      if (trial.isActive) {
        return true;
      }
    }

    // Then check regular subscription access
    return canAccessFeature(featureKey, currentCount);
  }, [canAccessFeature, checkTrialStatus]);

  // Get plan limits based on current tier
  const getPlanLimits = useCallback(() => {
    const tier = subscription?.tier || 'free';
    
    const limits = {
      free: {
        invoices: 5,
        receipts: 5,
        contracts: 1,
        transferFee: 50,
        bookkeepingTrial: 14,
        taxCalculatorTrial: 14,
      },
      zidlite: {
        invoices: 10,
        receipts: 10,
        contracts: 2,
        transferFee: 50,
        bookkeepingTrial: 14,
        taxCalculatorTrial: 14,
        whatsappCommunity: true,
      },
      growth: {
        invoices: 'unlimited',
        receipts: 'unlimited',
        contracts: 5,
        transferFee: 50,
        bookkeepingAccess: true,
        taxCalculator: true,
        whatsappCommunity: true,
      },
      premium: {
        invoices: 'unlimited',
        receipts: 'unlimited',
        contracts: 'unlimited',
        transferFee: 50,
        bookkeepingAccess: true,
        taxCalculator: true,
        paymentReminders: true,
        financialStatements: true,
        taxSupport: true,
        prioritySupport: true,
      },
      elite: {
        invoices: 'unlimited',
        receipts: 'unlimited',
        contracts: 'unlimited',
        transferFee: 0,
        bookkeepingAccess: true,
        taxCalculator: true,
        paymentReminders: true,
        financialStatements: true,
        taxSupport: true,
        fullTaxFiling: true,
        vatFiling: true,
        payeFiling: true,
        whtFiling: true,
        citAudit: true,
        monthlyTaxFiling: true,
        yearlyTaxFiling: true,
        cfoGuidance: true,
        directWhatsappSupport: true,
        auditCoordination: true,
      },
    };

    return limits[tier as keyof typeof limits] || limits.free;
  }, [subscription?.tier]);

  // Get upgrade benefits when moving to a new tier
  const enhancedGetUpgradeBenefits = useCallback((targetTier: SubscriptionTier): string[] => {
    const currentTier = (subscription?.tier || 'free') as SubscriptionTier;
    
    const benefitsMap = {
      free_to_zidlite: [
        "10 invoices total",
        "10 receipts total",
        "2 contracts total",
        "Access to WhatsApp Business Community",
        "WhatsApp support"
      ],
      free_to_growth: [
        "Unlimited invoices",
        "Unlimited receipts",
        "5 contracts total",
        "Bookkeeping tool",
        "Tax Calculator",
        "Access to WhatsApp Business Community",
        "WhatsApp support"
      ],
      free_to_premium: [
        "Unlimited invoices & receipts",
        "Unlimited contracts",
        "Invoice Payment Reminders",
        "Financial Statement Preparation",
        "Tax filing support",
        "Priority support"
      ],
      free_to_elite: [
        "Everything in Premium",
        "Full Tax Filing Support",
        "CFO-Level Financial Guidance",
        "Direct WhatsApp Support",
        "Annual Audit Coordination"
      ],
      zidlite_to_growth: [
        "Unlimited invoices",
        "Unlimited receipts",
        "5 contracts total (up from 2)",
        "Bookkeeping tool",
        "Tax Calculator"
      ],
      zidlite_to_premium: [
        "Unlimited invoices & receipts",
        "Unlimited contracts",
        "Invoice Payment Reminders",
        "Financial Statement Preparation",
        "Tax filing support",
        "Priority support"
      ],
      zidlite_to_elite: [
        "Everything in Premium",
        "Full Tax Filing Support",
        "CFO-Level Financial Guidance",
        "Direct WhatsApp Support",
        "Annual Audit Coordination"
      ],
      growth_to_premium: [
        "Unlimited contracts (up from 5)",
        "Invoice Payment Reminders",
        "Financial Statement Preparation",
        "Tax filing support",
        "Priority support"
      ],
      growth_to_elite: [
        "Everything in Premium",
        "Full Tax Filing Support",
        "CFO-Level Financial Guidance",
        "Direct WhatsApp Support",
        "Annual Audit Coordination"
      ],
      premium_to_elite: [
        "Full Tax Filing Support (VAT, PAYE, WHT)",
        "CIT Audit",
        "Monthly & Yearly Tax Filing",
        "CFO-Level Financial Guidance",
        "Direct WhatsApp Support",
        "Annual Audit Coordination"
      ]
    };

    const key = `${currentTier}_to_${targetTier}` as keyof typeof benefitsMap;
    return benefitsMap[key] || getUpgradeBenefits(targetTier) || [];
  }, [subscription?.tier, getUpgradeBenefits]);

  return {
    subscription,
    loading: subscriptionLoading,
    refreshSubscription,
    checkFeatureAccess,
    subscribe,
    cancelSubscription,
    getUpgradeBenefits: enhancedGetUpgradeBenefits,
    canAccessFeature: enhancedCanAccessFeature,
    checkTrialStatus,
    activateTrial,
    trialStatus,
    hasRequiredTier,
    getPlanLimits,
    
    // Boolean flags for current tier
    isFree: subscription?.tier === 'free',
    isZidLite: subscription?.tier === 'zidlite',
    isGrowth: subscription?.tier === 'growth',
    isPremium: subscription?.tier === 'premium',
    isElite: subscription?.tier === 'elite',
    
    // Status flags
    isActive: subscription?.status === 'active',
    isExpired: subscription?.status === 'expired',
    isCancelled: subscription?.status === 'cancelled',
    
    // Tier info
    userTier: subscription?.tier || 'free',
    userId: userData?.id,
    
    // Expiry info
    expiresAt: subscription?.expiresAt,
    daysRemaining: subscription?.expiresAt 
      ? Math.ceil((new Date(subscription.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null,
  };
};