// app/components/subscription-components/SubscriptionDashboard.tsx
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
} from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { SubscriptionBadge } from "./subscriptionBadges";

export function SubscriptionDashboard() {
  const {
    subscription,
    loading,
    cancelSubscription,
    getUpgradeBenefits,
    userTier,
    isActive,
    checkTrialStatus,
    getPlanLimits,
    isFree,
    isZidLite,
    isGrowth,
    isPremium,
    isElite,
  } = useSubscription();
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [bookkeepingTrial, setBookkeepingTrial] = useState<any>(null);
  const [taxCalculatorTrial, setTaxCalculatorTrial] = useState<any>(null);

  // Check for active trials
  useEffect(() => {
    if (isFree || isZidLite) {
      checkTrialStatus("bookkeeping_access").then(setBookkeepingTrial);
      checkTrialStatus("tax_calculator_access").then(setTaxCalculatorTrial);
    }
  }, [isFree, isZidLite, checkTrialStatus]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2b825b]"></div>
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
    switch (tier) {
      case "free":
        return <Star className="w-5 h-5 text-gray-600" />;
      case "zidlite":
        return <Zap className="w-5 h-5 text-blue-600" />;
      case "growth":
        return <Zap className="w-5 h-5 text-green-600" />;
      case "premium":
        return <Crown className="w-5 h-5 text-[#2b825b]" />;
      case "elite":
        return <Sparkles className="w-5 h-5 text-purple-600" />;
      default:
        return null;
    }
  };

  const getPlanDisplayName = (tier: string) => {
    switch (tier) {
      case "free":
        return "Free Trial";
      case "zidlite":
        return "ZidLite";
      case "growth":
        return "Growth";
      case "premium":
        return "Premium";
      case "elite":
        return "Elite";
      default:
        return tier;
    }
  };

  const limits = getPlanLimits();

  // Helper function to safely check if a feature is included
  const isFeatureIncluded = (featureName: string): boolean => {
    return (limits as any)[featureName] === true;
  };

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

            {subscription.expiresAt && !isFree && !isZidLite && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <Calendar className="w-4 h-4" />
                <span>
                  {subscription.status === "active"
                    ? `Renews on ${formatDate(subscription.expiresAt)}`
                    : `Expired on ${formatDate(subscription.expiresAt)}`}
                </span>
              </div>
            )}

            {(isFree || isZidLite) && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isFree
                    ? "You're on the Free Trial plan. Upgrade to access more features and higher limits."
                    : "You're on the ZidLite plan. Upgrade to Growth or higher for unlimited features."}
                </p>

                {/* Show trial information if active */}
                <div className="space-y-2 mt-3">
                  {bookkeepingTrial?.isActive && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                        <Clock className="w-4 h-4" />
                        <span className="font-semibold">
                          Bookkeeping Trial Active
                        </span>
                      </div>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        You have {bookkeepingTrial.daysRemaining} days remaining
                        in your free trial.
                        {bookkeepingTrial.daysRemaining <= 3 && (
                          <span className="block mt-1 font-medium">
                            ⚠️ Your trial ends soon! Upgrade to keep access.
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {taxCalculatorTrial?.isActive && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                        <Clock className="w-4 h-4" />
                        <span className="font-semibold">
                          Tax Calculator Trial Active
                        </span>
                      </div>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        You have {taxCalculatorTrial.daysRemaining} days
                        remaining in your free trial.
                        {taxCalculatorTrial.daysRemaining <= 3 && (
                          <span className="block mt-1 font-medium">
                            ⚠️ Your trial ends soon! Upgrade to keep access.
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

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
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Transfer fee:
                    </span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-gray-50">
                      ₦{limits.transferFee} per transfer
                    </span>
                  </div>
                </div>

                {/* Feature Access Section */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Feature Access
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Bookkeeping:
                      </span>
                      <span className="ml-2 font-semibold">
                        {bookkeepingTrial?.isActive ? (
                          <span className="text-green-600 dark:text-green-400">
                            Trial ({bookkeepingTrial.daysRemaining} days)
                          </span>
                        ) : isFeatureIncluded('bookkeepingAccess') ? (
                          <span className="text-green-600 dark:text-green-400">Included</span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-500">Not Available</span>
                        )}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Tax Calculator:
                      </span>
                      <span className="ml-2 font-semibold">
                        {taxCalculatorTrial?.isActive ? (
                          <span className="text-green-600 dark:text-green-400">
                            Trial ({taxCalculatorTrial.daysRemaining} days)
                          </span>
                        ) : isFeatureIncluded('taxCalculator') ? (
                          <span className="text-green-600 dark:text-green-400">Included</span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-500">Not Available</span>
                        )}
                      </span>
                    </div>
                    {isFeatureIncluded('whatsappCommunity') && (
                      <div className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          WhatsApp Community:
                        </span>
                        <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                          ✓ Included
                        </span>
                      </div>
                    )}
                    {isFeatureIncluded('prioritySupport') && (
                      <div className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Priority Support:
                        </span>
                        <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                          ✓ Included
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isGrowth && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">
                  Growth Plan Benefits
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Invoices:</span> Unlimited
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Receipts:</span> Unlimited
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Contracts:</span> 5 total
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Bookkeeping:</span> Included
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Tax Calculator:</span> Included
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Support:</span> WhatsApp
                  </div>
                </div>
              </div>
            )}

            {isPremium && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">
                  Premium Plan Benefits
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Invoices:</span> Unlimited
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Receipts:</span> Unlimited
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Contracts:</span> Unlimited
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Payment Reminders:</span> Included
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Financial Statements:</span> Included
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Tax Support:</span> Included
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Support:</span> Priority
                  </div>
                </div>
              </div>
            )}

            {isElite && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">
                  Elite Plan Benefits
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">
                      Everything in Premium, plus:
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Transfer Fee:</span> ₦0
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Full Tax Filing:</span> VAT,
                    PAYE, WHT
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">CIT Audit:</span> Included
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">CFO Guidance:</span> Included
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Support:</span> Direct
                    WhatsApp
                  </div>
                </div>
              </div>
            )}
          </div>

          {!isFree && !isZidLite && subscription.status === "active" && (
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

      {/* Features List - Only for paid tiers */}
      {!isFree && !isZidLite && subscription.features && Object.keys(subscription.features).length > 0 && (
        <div className="bg-white dark:bg-gray-900 border-2 border-gray-900 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] p-6 mb-8">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-50">
            All Features Included
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(subscription.features || {}).map(
              ([key, feature]: [string, any]) => (
                <div key={key} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#2b825b] shrink-0 mt-0.5" />
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

      {/* Payment History - Placeholder for now */}
      {!isFree && !isZidLite && (
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
      {!isElite && (
        <div className="bg-white dark:bg-gray-900 border-2 border-gray-900 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-50">
            Upgrade Your Plan
          </h3>
          <div className="space-y-4">
            {["zidlite", "growth", "premium", "elite"]
              .filter((tier) => {
                const tiers = ["free", "zidlite", "growth", "premium", "elite"];
                const currentIndex = tiers.indexOf(subscription.tier);
                const targetIndex = tiers.indexOf(tier);
                return targetIndex > currentIndex;
              })
              .map((tier) => (
                <div
                  key={tier}
                  className="border-2 border-gray-200 dark:border-gray-700 p-4 rounded-lg hover:border-[#2b825b] transition-colors"
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
                          .map((benefit:any, i:any) => (
                            <li
                              key={i}
                              className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                            >
                              <Check className="w-3 h-3 text-[#2b825b] shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        {getUpgradeBenefits(tier as any).length > 4 && (
                          <li className="text-sm text-[#2b825b] mt-1">
                            +{getUpgradeBenefits(tier as any).length - 4} more benefits
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