"use client";

import { useSubscription } from "@/app/hooks/useSubscripion";
import { Button2 } from "../ui/button2";
import {
  Check,
  AlertCircle,
  Calendar,
  CreditCard,
  Zap,
  Crown,
  Sparkles,
  Clock,
  Star,
  Building2,
  Briefcase,
  Gem,
} from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { SubscriptionBadge } from "./subscriptionBadges";

// Tier display names
const TIER_DISPLAY_NAMES: Record<string, string> = {
  free: "Free",
  solopreneur: "Solopreneur",
  sme: "SME",
  enterprise: "Enterprise",
  corporation: "Corporation",
};

// Legacy aliases
const LEGACY_TIER_MAP: Record<string, string> = {
  zidlite: "solopreneur",
  growth: "sme",
  premium: "enterprise",
  elite: "corporation",
};

export function SubscriptionDashboard() {
  const {
    subscription,
    loading,
    cancelSubscription,
    getUpgradeBenefits,
    userTier,
    isActive,
    getPlanLimits,
    isFree,
  } = useSubscription();
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
<<<<<<< HEAD
  
  // Map legacy tier to new tier for display
  const getDisplayTier = (tier: string): string => {
    return LEGACY_TIER_MAP[tier] || tier;
  };
=======
  const [bookkeepingTrial, setBookkeepingTrial] = useState<any>(null);
  const [taxCalculatorTrial, setTaxCalculatorTrial] = useState<any>(null);

>>>>>>> f0dc9f163d2db4c6f24994ecb64105a7d59f7679

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--color-accent-yellow)"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border-2 border-gray-900 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] p-8">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">
          No subscription found
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Get started by choosing a plan that fits your business.
        </p>
        <Button2 onClick={() => (window.location.href = "/#pricing")}>
          View Plans
        </Button2>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300";
      case "expired":
        return "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300";
      case "cancelled":
        return "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return format(new Date(date), "MMM d, yyyy");
  };

  const handleCancel = async () => {
    setCancelling(true);
    const result = await cancelSubscription();
    if (result.success) {
      setShowCancelConfirm(false);
    }
    setCancelling(false);
  };

  const getTierIcon = (tier: string) => {
    const displayTier = getDisplayTier(tier);
    switch (displayTier) {
      case "free":
        return <Star className="w-5 h-5 text-gray-600" />;
      case "solopreneur":
        return <Briefcase className="w-5 h-5 text-blue-600" />;
      case "sme":
        return <Building2 className="w-5 h-5 text-green-600" />;
      case "enterprise":
        return <Crown className="w-5 h-5 text-amber-600" />;
      case "corporation":
        return <Gem className="w-5 h-5 text-purple-600" />;
      default:
        return null;
    }
  };

  const getPlanDisplayName = (tier: string) => {
    const displayTier = getDisplayTier(tier);
    return TIER_DISPLAY_NAMES[displayTier] || displayTier;
  };

  const limits = getPlanLimits();

  const isFeatureIncluded = (featureName: string): boolean => {
    return (limits as any)[featureName] === true;
  };

  const displayTier = getDisplayTier(subscription.tier);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-50">
        Subscription Management
      </h2>

      {/* Current Plan Card */}
      <div className="bg-white dark:bg-gray-900 border-2 border-gray-900 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {getTierIcon(subscription.tier)}
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">
                {getPlanDisplayName(subscription.tier)} Plan
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(subscription.status)}`}
              >
                {subscription.status}
              </span>
            </div>

            {subscription.expiresAt && !isFree && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <Calendar className="w-4 h-4" />
                <span>
                  {subscription.status === "active"
                    ? `Renews on ${formatDate(subscription.expiresAt)}`
                    : `Expired on ${formatDate(subscription.expiresAt)}`}
                </span>
              </div>
            )}

            {isFree && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You're on the Free plan. Upgrade to access more features and
                  higher limits.
                </p>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Invoice limit:
                    </span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-gray-50">
                      {limits.invoices === "unlimited"
                        ? "Unlimited"
                        : limits.invoices}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Receipt limit:
                    </span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-gray-50">
                      {limits.receipts === "unlimited"
                        ? "Unlimited"
                        : limits.receipts}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Contract limit:
                    </span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-gray-50">
                      {limits.contracts === "unlimited"
                        ? "Unlimited"
                        : limits.contracts}
                    </span>
                  </div>
<<<<<<< HEAD
=======
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Transfer fee:
                    </span>
                    {/* <span className="ml-2 font-semibold text-gray-900 dark:text-gray-50">
                      ₦{limits.transferFee} per transfer
                    </span> */}
                  </div>
>>>>>>> f0dc9f163d2db4c6f24994ecb64105a7d59f7679
                </div>
              </div>
            )}

            {/* Plan-specific benefits */}
            {displayTier === "solopreneur" && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">
                  Solopreneur Plan Benefits
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Invoices:</span> 10 total
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Receipts:</span> Unlimited
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Branded Invoices:</span> ✓
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Expense Tracking:</span> ✓
                  </div>
                </div>
              </div>
            )}

            {displayTier === "sme" && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">
                  SME Plan Benefits
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Invoices:</span> Unlimited
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Receipts:</span> Unlimited
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Bank Accounts:</span> 3
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Team Members:</span> 1 extra
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Vault:</span> ✓
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Tax Calculator:</span> ✓
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Financial Statements:</span> ✓
                  </div>
                </div>
              </div>
            )}

            {displayTier === "enterprise" && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">
                  Enterprise Plan Benefits
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Team:</span> Unlimited
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Bank Accounts:</span> 5
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Contracts:</span> 10
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Role Permissions:</span> ✓
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Approval System:</span> ✓
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Dedicated Onboarding:</span> ✓
                  </div>
                </div>
              </div>
            )}

            {displayTier === "corporation" && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">
                  Corporation Plan Benefits
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Contracts:</span> Unlimited
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Bank Accounts:</span>{" "}
                    Unlimited
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Payroll System:</span> ✓
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Department Access:</span> ✓
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Advanced Reporting:</span> ✓
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Dedicated Account Manager:</span> ✓
                  </div>
                </div>
              </div>
            )}
          </div>

          {!isFree && subscription.status === "active" && (
            <div className="mt-4 md:mt-0 md:ml-6">
              {!showCancelConfirm ? (
                <Button2
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Cancel Subscription
                </Button2>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Are you sure?
                  </p>
                  <div className="flex gap-2">
                    <Button2
                      size="sm"
                      variant="outline"
                      className="border-gray-300"
                      onClick={() => setShowCancelConfirm(false)}
                    >
                      No
                    </Button2>
                    <Button2
                      size="sm"
                      className="bg-red-500 hover:bg-red-600 text-white"
                      onClick={handleCancel}
                      disabled={cancelling}
                    >
                      {cancelling ? "Cancelling..." : "Yes"}
                    </Button2>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Features List */}
      {!isFree && subscription.features && Object.keys(subscription.features).length > 0 && (
        <div className="bg-white dark:bg-gray-900 border-2 border-gray-900 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] p-6 mb-8">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-50">
            All Features Included
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(subscription.features || {}).map(
              ([key, feature]: [string, any]) => (
                <div key={key} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-(--color-accent-yellow) shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm text-gray-900 dark:text-gray-50">
                      {key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block">
                      {feature.value === "true"
                        ? "Included"
                        : feature.value === "unlimited"
                          ? "Unlimited"
                          : feature.limit
                            ? `${feature.limit} total`
                            : feature.value}
                    </span>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* Payment History */}
      {!isFree && (
        <div className="bg-white dark:bg-gray-900 border-2 border-gray-900 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] p-6 mb-8">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-50">
            Payment History
          </h3>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <CreditCard className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p>No payment history available</p>
            <p className="text-sm mt-1">Your first payment will appear here</p>
          </div>
        </div>
      )}

      {/* Upgrade Options */}
      {displayTier !== "corporation" && (
        <div className="bg-white dark:bg-gray-900 border-2 border-gray-900 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-50">
            Upgrade Your Plan
          </h3>
          <div className="space-y-4">
            {["solopreneur", "sme", "enterprise", "corporation"]
              .filter((tier) => {
                const tiers = ["free", "solopreneur", "sme", "enterprise", "corporation"];
                const currentIndex = tiers.indexOf(displayTier);
                const targetIndex = tiers.indexOf(tier);
                return targetIndex > currentIndex;
              })
              .map((tier) => (
                <div
                  key={tier}
                  className="border-2 border-gray-200 dark:border-gray-700 p-4 rounded-lg hover:border-(--color-accent-yellow) transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTierIcon(tier)}
                        <h4 className="font-bold text-gray-900 dark:text-gray-50 capitalize">
                          {getPlanDisplayName(tier)} Plan
                        </h4>
                      </div>
                      <ul className="space-y-1 mb-4 md:mb-0">
                        {getUpgradeBenefits(tier as any)
                          .slice(0, 4)
                          .map((benefit: any, i: any) => (
                            <li
                              key={i}
                              className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                            >
                              <Check className="w-3 h-3 text-(--color-accent-yellow) shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        {getUpgradeBenefits(tier as any).length > 4 && (
                          <li className="text-sm text-(--color-accent-yellow) mt-1">
                            +{getUpgradeBenefits(tier as any).length - 4} more
                            benefits
                          </li>
                        )}
                      </ul>
                    </div>
                    <Button2
                      onClick={() => (window.location.href = "/#pricing")}
                      className="md:ml-4 mt-4 md:mt-0"
                    >
                      Upgrade to {getPlanDisplayName(tier)}
                    </Button2>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}