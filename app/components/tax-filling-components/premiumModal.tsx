// app/components/tax-filling-components/premiumModal.tsx
import { Crown, Zap, Sparkles, Star, X, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface PremiumModalProps {
  open: boolean;
  onClose: () => void;
  currentTier?: "free" | "zidlite" | "growth" | "premium" | "elite";
  feature?: string;
}

// Define a type for the tier details
type TierType = "free" | "zidlite" | "growth" | "premium" | "elite";

interface TierDetail {
  nextTier: TierType | null;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  price: string;
  yearlyPrice?: string;
  features: string[];
}

const tierDetails: Record<TierType, TierDetail> = {
  free: {
    nextTier: "zidlite",
    icon: Star,
    color: "gray",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    textColor: "text-gray-600",
    price: "₦0",
    features: [
      "10 invoices total",
      "10 receipts total",
      "1 contract total",
      "Basic support",
      "1 month bookkeeping trial",
    ],
  },
  zidlite: {
    nextTier: "growth",
    icon: Zap,
    color: "blue",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-600",
    price: "₦4,900/month",
    yearlyPrice: "₦49,000/year",
    features: [
      "10 invoices total",
      "10 receipts total",
      "2 contracts total",
      "WhatsApp Community access",
      "WhatsApp support",
      "14-day bookkeeping trial",
      "14-day tax calculator trial",
    ],
  },
  growth: {
    nextTier: "premium",
    icon: Zap,
    color: "green",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-600",
    price: "₦9,900/month",
    yearlyPrice: "₦99,000/year",
    features: [
      "Tax calculator access",
      "Unlimited invoices",
      "Unlimited receipts",
      "5 contracts total",
      "Bookkeeping access",
      "WhatsApp support",
      "WhatsApp Community",
    ],
  },
  premium: {
    nextTier: "elite",
    icon: Crown,
    color: "amber",
    bgColor: "bg-[#2b825b]/10",
    borderColor: "border-[#2b825b]",
    textColor: "text-[#2b825b]",
    price: "₦49,900/month",
    yearlyPrice: "₦499,000/year",
    features: [
      "Full tax calculator",
      "Tax filing support",
      "Financial statements",
      "Payment reminders",
      "Priority support",
      "Unlimited contracts",
    ],
  },
  elite: {
    nextTier: null,
    icon: Sparkles,
    color: "purple",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-600",
    price: "₦100,000+/month",
    features: [
      "Full tax filing (VAT, PAYE, WHT)",
      "CFO-level guidance",
      "Audit coordination",
      "Dedicated account manager",
      "Direct WhatsApp support",
      "Annual audit coordination",
    ],
  },
};

export function PremiumModal({
  open,
  onClose,
  currentTier = "free",
  feature = "this feature",
}: PremiumModalProps) {
  const [selectedBilling, setSelectedBilling] = useState<"monthly" | "yearly">(
    "monthly",
  );

  if (!open) return null;

  // Safe access with type guard
  const tierData = tierDetails[currentTier as TierType];
  const NextTierIcon = tierData?.icon || Crown;
  const nextTier = tierData?.nextTier;
  const nextTierData = nextTier ? tierDetails[nextTier] : null;

  const getUpgradeMessage = () => {
    if (currentTier === "free") {
      return `Upgrade to ZidLite to get more invoices and receipts, or go straight to Growth for tax calculator access.`;
    }
    if (currentTier === "zidlite") {
      return `Upgrade to Growth to unlock tax calculator, unlimited invoices, and more business tools.`;
    }
    if (currentTier === "growth") {
      return `Take your business to the next level with Premium. Get full tax filing support and financial statements.`;
    }
    if (currentTier === "premium") {
      return `Go Elite for comprehensive tax filing (VAT, PAYE, WHT) and CFO-level guidance.`;
    }
    if (currentTier === "elite") {
      return `You're on the Elite plan. Contact us for custom enterprise solutions.`;
    }
    return `Upgrade to access ${feature}`;
  };

  const getDisplayPrice = () => {
    if (!nextTierData) return "";

    if (nextTier === "elite") {
      return nextTierData.price;
    }

    if (selectedBilling === "yearly" && nextTierData.yearlyPrice) {
      return nextTierData.yearlyPrice;
    }

    return nextTierData.price;
  };

  const getYearlySavings = () => {
    if (nextTier === "zidlite") return "Save ₦9,800";
    if (nextTier === "growth") return "Save ₦19,800";
    if (nextTier === "premium") return "Save ₦99,800";
    return "";
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  // Early return if no tier data (shouldn't happen)
  if (!tierData) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">
            Unlock Premium Features
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Plan Indicator */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Current Plan
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-50 capitalize">
                {currentTier === "zidlite"
                  ? "ZidLite"
                  : currentTier === "free"
                    ? "Free Trial"
                    : currentTier}
              </p>
            </div>
            {currentTier !== "elite" && nextTierData && (
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Upgrade to
                </p>
                <p
                  className={`text-lg font-bold capitalize ${nextTierData.textColor}`}
                >
                  {nextTier === "zidlite" ? "ZidLite" : nextTier}
                </p>
              </div>
            )}
          </div>

          {/* Message */}
          <div
            className={`p-4 rounded-lg ${tierData?.bgColor} ${tierData?.borderColor} border`}
          >
            <p className={`text-sm ${tierData?.textColor}`}>
              {getUpgradeMessage()}
            </p>
          </div>

          {/* Next Tier Details */}
          {nextTierData && (
            <div
              className={`border-2 rounded-xl p-6 ${nextTierData.borderColor}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-full ${nextTierData.bgColor} flex items-center justify-center`}
                >
                  <NextTierIcon
                    className={`w-6 h-6 ${nextTierData.textColor}`}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 capitalize">
                    {nextTier === "zidlite" ? "ZidLite" : nextTier} Plan
                  </h3>
                  <p
                    className={`text-sm font-semibold ${nextTierData.textColor}`}
                  >
                    {getDisplayPrice()}
                  </p>
                </div>
              </div>

              {/* Billing Toggle - Only for non-Elite plans */}
              {nextTier !== "elite" && nextTier !== "free" && (
                <div className="flex items-center gap-2 mb-6">
                  <button
                    onClick={() => setSelectedBilling("monthly")}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      selectedBilling === "monthly"
                        ? "bg-[#2b825b] text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setSelectedBilling("yearly")}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      selectedBilling === "yearly"
                        ? "bg-[#2b825b] text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    Yearly <span className="text-xs ml-1">Save 20%</span>
                  </button>
                </div>
              )}

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {nextTierData.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check
                      className={`w-5 h-5 ${nextTierData.textColor} shrink-0 mt-0.5`}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Price Details */}
              {nextTier !== "elite" && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {selectedBilling === "yearly"
                      ? "Yearly billing"
                      : "Monthly billing"}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                    {getDisplayPrice()}
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      /{selectedBilling === "yearly" ? "year" : "month"}
                    </span>
                  </p>
                  {selectedBilling === "yearly" && (
                    <p className="text-xs text-green-600 mt-1">
                      {getYearlySavings()} annually
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                >
                  Cancel
                </button>
                {nextTier === "elite" ? (
                  <Link href="/contact" className="flex-1">
                    <button className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2">
                      Contact Sales
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                ) : (
                  <Link
                    href={`/pricing?upgrade=${nextTier}${selectedBilling === "yearly" ? "&billing=yearly" : ""}`}
                    className="flex-1"
                  >
                    <button
                      className={`w-full px-4 py-3 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2
                      ${
                        nextTier === "zidlite"
                          ? "bg-blue-600 hover:bg-blue-700"
                          : nextTier === "growth"
                            ? "bg-green-600 hover:bg-green-700"
                            : nextTier === "premium"
                              ? "bg-[#2b825b] hover:bg-[#1e5d42]"
                              : "bg-purple-600 hover:bg-purple-700"
                      }`}
                    >
                      Upgrade to {nextTier === "zidlite" ? "ZidLite" : nextTier}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* No Upgrade Path (Elite) */}
          {currentTier === "elite" && (
            <div className="text-center py-8">
              <Crown className="w-16 h-16 text-[#2b825b] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">
                You're on Elite!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Contact our enterprise team for custom solutions and dedicated
                support.
              </p>
              <Link href="/contact">
                <button className="px-6 py-3 bg-[#2b825b] text-white rounded-lg hover:bg-[#1e5d42] transition-colors font-medium">
                  Contact Account Manager
                </button>
              </Link>
            </div>
          )}

          {/* Trust Badges */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              🔒 Secure payment • Cancel anytime • 14-day money-back guarantee
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
