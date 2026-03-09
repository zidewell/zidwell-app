// lib/subscription-service.ts
import { createClient } from "@supabase/supabase-js";



const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SubscriptionFeature {
  feature_key: string;
  feature_value: string;
  feature_limit: number | null;
}

export interface SubscriptionInfo {
  tier: 'free' | 'growth' | 'premium' | 'elite';
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  expiresAt: Date | null;
  features: Record<string, any>;
}

export const SUBSCRIPTION_PRICES = {
  free: { monthly: 0, yearly: 0 },
  growth: { monthly: 10000, yearly: 100000 },
  premium: { monthly: 50000, yearly: 500000 },
  elite: { monthly: 100000, yearly: null }, // Custom pricing
};

export const FREE_TIER_LIMITS = {
  invoices: 5,
  receipts: 5,
  contracts: 1,
  bookkeeping_trial_days: 14,
};

export class SubscriptionService {
  static async getUserSubscription(userId: string): Promise<SubscriptionInfo | null> {
    try {
      // Check if any subscriptions are expired
      await this.checkExpiredSubscriptions();

      // Get user's current subscription
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("subscription_tier, subscription_expires_at")
        .eq("id", userId)
        .single();

      if (userError || !user) {
        console.error("Error fetching user subscription:", userError);
        return null;
      }

      // Get active subscription from subscriptions table
      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (subError && subError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error("Error fetching subscription:", subError);
      }

      // If no active subscription but user has tier set, create a free subscription
      if (!subscription && user.subscription_tier === 'free') {
        await this.createFreeSubscription(userId);
      }

      // Get features for the tier
      const features = await this.getTierFeatures(user.subscription_tier || 'free');

      return {
        tier: user.subscription_tier as any || 'free',
        status: subscription?.status || 
                (user.subscription_expires_at && new Date(user.subscription_expires_at) < new Date() 
                  ? 'expired' 
                  : 'active'),
        expiresAt: user.subscription_expires_at ? new Date(user.subscription_expires_at) : null,
        features,
      };
    } catch (error) {
      console.error("Error in getUserSubscription:", error);
      return null;
    }
  }

  static async getTierFeatures(tier: string): Promise<Record<string, any>> {
    const { data, error } = await supabase
      .from("subscription_features")
      .select("feature_key, feature_value, feature_limit")
      .eq("tier", tier);

    if (error || !data) {
      console.error("Error fetching tier features:", error);
      return {};
    }

    return data.reduce((acc:any, feature:any) => {
      acc[feature.feature_key] = {
        value: feature.feature_value,
        limit: feature.feature_limit,
      };
      return acc;
    }, {} as Record<string, any>);
  }

  static async checkFeatureAccess(
    userId: string,
    featureKey: string,
    currentCount?: number
  ): Promise<{ hasAccess: boolean; limit?: number; message?: string }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription) {
        return { hasAccess: false, message: "No subscription found" };
      }

      const feature = subscription.features[featureKey];
      
      if (!feature) {
        return { hasAccess: false, message: "Feature not available in your plan" };
      }

      // Check if feature value is "true" or has a limit
      if (feature.value === 'true') {
        return { hasAccess: true };
      }

      if (feature.value === 'unlimited') {
        return { hasAccess: true };
      }

      // Check numeric limits
      if (feature.limit && currentCount !== undefined) {
        const limit = parseInt(feature.limit);
        if (currentCount >= limit) {
          return { 
            hasAccess: false, 
            limit,
            message: `You've reached your ${featureKey} limit of ${limit} for the ${subscription.tier} plan` 
          };
        }
        return { hasAccess: true, limit };
      }

      return { hasAccess: true };
    } catch (error) {
      console.error("Error checking feature access:", error);
      return { hasAccess: false, message: "Error checking access" };
    }
  }

  static async createSubscription(
    userId: string,
    tier: 'growth' | 'premium' | 'elite',
    paymentMethod: string,
    amount: number,
    paymentReference: string,
    isYearly: boolean = false
  ) {
    try {
      // Calculate expiration date
      const expiresAt = new Date();
      if (isYearly) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      // Create subscription record
      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          tier,
          status: 'active',
          expires_at: expiresAt.toISOString(),
          auto_renew: true,
          payment_method: paymentMethod,
        })
        .select()
        .single();

      if (subError) {
        throw new Error(`Failed to create subscription: ${subError.message}`);
      }

      // Update user's subscription tier
      const { error: userError } = await supabase
        .from("users")
        .update({
          subscription_tier: tier,
          subscription_expires_at: expiresAt.toISOString(),
        })
        .eq("id", userId);

      if (userError) {
        throw new Error(`Failed to update user: ${userError.message}`);
      }

      // Record payment
      const { error: paymentError } = await supabase
        .from("subscription_payments")
        .insert({
          user_id: userId,
          subscription_id: subscription.id,
          amount,
          payment_method: paymentMethod,
          status: 'completed',
          reference: paymentReference,
        });

      if (paymentError) {
        console.error("Failed to record payment:", paymentError);
      }

      return { success: true, subscription };
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      return { success: false, error: error.message };
    }
  }

  static async createFreeSubscription(userId: string) {
    try {
      // Check if user already has a free subscription
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .eq("tier", "free")
        .eq("status", "active")
        .single();

      if (existing) {
        return { success: true, subscription: existing };
      }

      // Set expiration to far future (never expires)
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 100); // Effectively never expires

      const { data: subscription, error } = await supabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          tier: 'free',
          status: 'active',
          expires_at: expiresAt.toISOString(),
          auto_renew: true,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, subscription };
    } catch (error) {
      console.error("Error creating free subscription:", error);
      return { success: false, error };
    }
  }

  static async cancelSubscription(userId: string) {
    try {
      const { data: subscription, error: findError } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (findError) {
        throw new Error("No active subscription found");
      }

      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          auto_renew: false,
        })
        .eq("id", subscription.id);

      if (updateError) {
        throw updateError;
      }

      // Don't downgrade user immediately - they keep access until expiration
      return { success: true };
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      return { success: false, error: error.message };
    }
  }

  static async checkExpiredSubscriptions() {
    try {
      // This function should be called by a cron job
      // For now, we'll just run it when needed
      const { error } = await supabase.rpc('check_subscription_status');
      
      if (error) {
        console.error("Error checking expired subscriptions:", error);
      }
    } catch (error) {
      console.error("Error in checkExpiredSubscriptions:", error);
    }
  }

  static getUpgradeBenefits(currentTier: string, targetTier: string): string[] {
    const benefits: Record<string, Record<string, string[]>> = {
      free: {
        growth: [
          "Unlimited invoices",
          "Unlimited receipts",
          "5 contracts per month",
          "Bookkeeping tool access",
          "Tax calculator",
          "Invoice payment reminders",
          "WhatsApp community access",
          "WhatsApp support",
        ],
        premium: [
          "Everything in Growth",
          "Unlimited contracts",
          "Financial statement preparation",
          "Tax calculation support",
          "Tax filing support",
          "Priority support",
        ],
        elite: [
          "Everything in Premium",
          "Full tax filing support",
          "VAT, PAYE, WHT filing",
          "CIT audit",
          "Monthly & yearly tax filing",
          "CFO-level guidance",
          "Direct WhatsApp support",
          "Annual audit coordination",
        ],
      },
      growth: {
        premium: [
          "Unlimited contracts",
          "Financial statement preparation",
          "Tax calculation support",
          "Tax filing support",
          "Priority support",
        ],
        elite: [
          "Everything in Premium",
          "Full tax filing support",
          "VAT, PAYE, WHT filing",
          "CIT audit",
          "Monthly & yearly tax filing",
          "CFO-level guidance",
          "Direct WhatsApp support",
          "Annual audit coordination",
        ],
      },
      premium: {
        elite: [
          "Full tax filing support",
          "VAT, PAYE, WHT filing",
          "CIT audit",
          "Monthly & yearly tax filing",
          "CFO-level guidance",
          "Direct WhatsApp support",
          "Annual audit coordination",
        ],
      },
    };

    return benefits[currentTier]?.[targetTier] || [];
  }
}