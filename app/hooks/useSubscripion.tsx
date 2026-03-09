// hooks/useSubscription.ts
import { useUserContextData } from "../context/userData";
import { useState, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

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
    // First check if user has active trial
    const trial = await checkTrialStatus(featureKey);
    if (trial.isActive) {
      return true;
    }

    // Then check regular subscription access
    return canAccessFeature(featureKey, currentCount);
  }, [canAccessFeature, checkTrialStatus]);

  return {
    subscription,
    loading: subscriptionLoading,
    refreshSubscription,
    checkFeatureAccess,
    subscribe,
    cancelSubscription,
    getUpgradeBenefits,
    canAccessFeature: enhancedCanAccessFeature,
    checkTrialStatus,
    activateTrial,
    trialStatus,
    isFree: subscription?.tier === 'free',
    isGrowth: subscription?.tier === 'growth',
    isPremium: subscription?.tier === 'premium',
    isElite: subscription?.tier === 'elite',
    isActive: subscription?.status === 'active',
    userTier: subscription?.tier || 'free',
    userId: userData?.id,
  };
};