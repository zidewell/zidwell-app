"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Check,
  Zap,
  Star,
  Crown,
  Rocket,
  Target,
  Gem,
} from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/app/hooks/useSubscripion";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const navigate = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">(
    "monthly",
  );
  const { userTier } = useSubscription();

  // Don't render if user tier is elite
  if (userTier === "elite") {
    return null;
  }

  const handleViewPricing = () => {
    onClose();
    navigate.push("/pricing?upgrade=" + getNextTier());
  };

  const getNextTier = () => {
    switch (userTier) {
      case "free":
        return "zidlite";
      case "zidlite":
        return "growth";
      case "growth":
        return "premium";
      case "premium":
        return "elite";
      default:
        return "zidlite";
    }
  };

  const getNextTierInfo = () => {
    switch (userTier) {
      case "free":
        return {
          currentTier: "Free Trial",
          nextTier: "ZidLite",
          title: "Upgrade to ZidLite",
          description: "Test what finance automation looks like",
          icon: <Zap className="h-6 w-6 text-white" />,
          badge: "UPGRADE NOW",
          primaryCta: "Go ZidLite",
          monthlyPrice: "₦4,900",
          annualPrice: "₦49,000",
          annualSavings: "save ₦9,800",
          features: [
            "10 Invoices • 10 Receipts • 2 Contracts",
            "Bookkeeping & Tax Calculator trials",
            "WhatsApp Business Community",
            "Unlimited transfers at ₦50 each",
          ],
        };
      case "zidlite":
        return {
          currentTier: "ZidLite",
          nextTier: "Growth",
          title: "Upgrade to Growth",
          description: "Structure without stress",
          icon: <Rocket className="h-6 w-6 text-white" />,
          badge: "GROW FASTER",
          primaryCta: "Go Growth",
          monthlyPrice: "₦9,900",
          annualPrice: "₦99,000",
          annualSavings: "save ₦19,800",
          features: [
            "Unlimited Invoices & Receipts",
            "5 Contracts • Bookkeeping Tool",
            "Tax Calculator Included",
            "WhatsApp Community + Support",
          ],
        };
      case "growth":
        return {
          currentTier: "Growth",
          nextTier: "Premium",
          title: "Upgrade to Premium",
          description: "For founders who want hands-on help",
          icon: <Crown className="h-6 w-6 text-white" />,
          badge: "GO PREMIUM",
          primaryCta: "Upgrade to Premium",
          monthlyPrice: "₦49,900",
          annualPrice: "₦499,000",
          annualSavings: "save ₦99,800",
          features: [
            "Unlimited Contracts",
            "Payment Reminders",
            "Financial Statements",
            "Tax Filing Support • Priority Support",
          ],
        };
      case "premium":
        return {
          currentTier: "Premium",
          nextTier: "Elite",
          title: "Upgrade to Elite",
          description: "For businesses that need tax support",
          icon: <Gem className="h-6 w-6 text-white" />,
          badge: "GO ELITE",
          primaryCta: "Contact Us",
          monthlyPrice: "₦100,000+",
          annualPrice: "Custom",
          annualSavings: "",
          features: [
            "Full Tax Filing (VAT, PAYE, WHT)",
            "CIT Audit • CFO Guidance",
            "Direct WhatsApp Support",
            "Annual Audit Coordination",
          ],
        };
      default:
        return {
          currentTier: "Free Trial",
          nextTier: "ZidLite",
          title: "Upgrade to ZidLite",
          description: "Test what finance automation looks like",
          icon: <Zap className="h-6 w-6 text-white" />,
          badge: "UPGRADE NOW",
          primaryCta: "Go ZidLite",
          monthlyPrice: "₦4,900",
          annualPrice: "₦49,000",
          annualSavings: "save ₦9,800",
          features: [
            "10 Invoices • 10 Receipts • 2 Contracts",
            "Bookkeeping & Tax Calculator trials",
            "WhatsApp Business Community",
            "Unlimited transfers at ₦50 each",
          ],
        };
    }
  };

  const tierInfo = getNextTierInfo();
  const nextTier = getNextTier();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal - Compact size */}
          <motion.div
            className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl bg-white dark:bg-[#1a1a1a] shadow-2xl flex flex-col md:flex-row"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-20 rounded-full p-1.5 text-gray-400 transition-all hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Left Column - Gradient Header */}
            <div className="relative md:w-2/5 bg-linear-to-br from-[#2b825b] to-[#1e5f43] p-6 text-white flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full blur-2xl -ml-12 -mb-12" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    {tierInfo.icon}
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold backdrop-blur-sm">
                      <Zap className="h-2.5 w-2.5" />
                      {tierInfo.badge}
                    </span>
                  </div>
                </div>

                <h2 className="text-2xl font-bold tracking-tight mb-2">
                  {tierInfo.title}
                </h2>
                <p className="text-white/80 text-sm">{tierInfo.description}</p>
              </div>

              {/* Features in left column - compact */}
              <div className="relative z-10 mt-4">
                <p className="text-white/70 text-xs uppercase tracking-wider mb-2">
                  Key benefits:
                </p>
                <ul className="space-y-2">
                  {tierInfo.features.slice(0, 4).map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2 text-xs">
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/20">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                      <span className="text-white/90">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ZidCoin reminder - compact */}
              <div className="relative z-10 mt-3 pt-3 border-t border-white/20">
                <p className="text-white/60 text-[10px]">
                  ✦ Earn ZidCoins (1 ZC = ₦1) on every transaction
                </p>
              </div>
            </div>

            {/* Right Column - Pricing & CTA */}
            <div className="md:w-3/5 p-6 bg-white dark:bg-[#1a1a1a]">
              {/* Current Tier Indicator */}
              <div className="mb-3 text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Current:{" "}
                  <span className="font-semibold text-gray-900 dark:text-gray-50">
                    {tierInfo.currentTier}
                  </span>
                </span>
              </div>

              {/* Pricing Toggle - Hide for Elite */}
              {userTier !== "premium" && (
                <div className="mb-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setSelectedPlan("monthly")}
                      className={`relative px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                        selectedPlan === "monthly"
                          ? "bg-[#2b825b] text-white shadow-lg shadow-[#2b825b]/25"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setSelectedPlan("annual")}
                      className={`relative px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                        selectedPlan === "annual"
                          ? "bg-[#2b825b] text-white shadow-lg shadow-[#2b825b]/25"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      Annual
                      <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-yellow-900 text-[8px] font-bold px-1 py-0.5 rounded-full">
                        -20%
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Single Pricing Card */}
              <div
                className={`relative rounded-xl ${
                  userTier === "premium"
                    ? "bg-linear-to-br from-purple-50 to-transparent border-2 border-purple-500"
                    : "bg-linear-to-br from-[#2b825b]/5 to-transparent border-2 border-[#2b825b]"
                } p-4 shadow-lg mb-4`}
              >
                {userTier !== "premium" && (
                  <div className="absolute -top-2 left-4 bg-[#2b825b] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    RECOMMENDED
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  {tierInfo.icon}
                  <h3 className="font-semibold text-base">
                    {tierInfo.nextTier} Plan
                  </h3>
                </div>

                <div className="mb-2">
                  <span className="text-2xl font-bold">
                    {userTier === "premium"
                      ? tierInfo.monthlyPrice
                      : selectedPlan === "annual"
                        ? tierInfo.annualPrice
                        : tierInfo.monthlyPrice}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">
                    {userTier === "premium"
                      ? "/mo"
                      : selectedPlan === "annual"
                        ? "/yr"
                        : "/mo"}
                  </span>
                  {selectedPlan === "annual" && userTier !== "premium" && (
                    <p className="text-[10px] text-[#2b825b]">
                      {tierInfo.annualSavings}
                    </p>
                  )}
                </div>

                {/* Features List - compact */}
                <ul className="space-y-1 mb-3">
                  {tierInfo.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-1.5 text-xs"
                    >
                      <Check
                        className={`h-3 w-3 shrink-0 mt-0.5 ${
                          userTier === "premium"
                            ? "text-purple-500"
                            : "text-[#2b825b]"
                        }`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Price Comparison */}
                {userTier !== "free" && userTier !== "premium" && (
                  <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      vs {tierInfo.currentTier}:{" "}
                      {selectedPlan === "annual"
                        ? tierInfo.annualSavings
                        : "More features"}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col items-center gap-2">
                <Button
                  onClick={handleViewPricing}
                  className={`w-full rounded-lg py-3 text-sm font-semibold shadow-lg transition-all hover:scale-[1.02] ${
                    userTier === "premium"
                      ? "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/25"
                      : "bg-[#2b825b] hover:bg-[#1e5f43] text-white shadow-[#2b825b]/25"
                  }`}
                >
                  {tierInfo.primaryCta}
                  <Zap className="ml-1.5 h-3.5 w-3.5" />
                </Button>
                <button
                  onClick={onClose}
                  className="text-xs text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Maybe later
                </button>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                  {userTier === "premium"
                    ? "Contact sales for custom pricing"
                    : "14-day trials available on select features"}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
