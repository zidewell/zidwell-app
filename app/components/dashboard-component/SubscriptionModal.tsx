// app/components/dashboard-component/SubscriptionModal.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Zap, Crown, Rocket, Briefcase } from "lucide-react";
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

  // Enterprise is the highest real tier — nothing to upgrade to.
  if (userTier === "enterprise") return null;

  const getNextTier = (): string => {
    switch (userTier) {
      case "free":
      case "starter":
        return "sme";
      case "sme":
        return "enterprise";
      default:
        return "sme";
    }
  };

  const handleViewPricing = () => {
    onClose();
    navigate.push("/pricing?upgrade=" + getNextTier());
  };

  const getNextTierInfo = () => {
    switch (userTier) {
      case "free":
      case "starter":
        return {
          currentTier: "Free",
          nextTier: "SME",
          title: "Upgrade to SME",
          description: "Run your business properly",
          icon: <Rocket className="h-6 w-6 text-white" />,
          badge: "RUN YOUR BUSINESS",
          primaryCta: "Go SME",
          monthlyPrice: "₦16,658",
          annualPrice: "₦199,900",
          annualSavings: "one annual payment",
          features: [
            "Unlimited invoices & receipts",
            "International payments",
            "One Extra User",
            "Tax calculator",
            "Financial statements",
            "1 Contract",
          ],
        };
      case "sme":
        return {
          currentTier: "SME",
          nextTier: "Enterprise",
          title: "Upgrade to Enterprise",
          description: "Full business finance system",
          icon: <Crown className="h-6 w-6 text-white" />,
          badge: "GO ENTERPRISE",
          primaryCta: "Upgrade to Enterprise",
          monthlyPrice: "₦49,992",
          annualPrice: "₦599,900",
          annualSavings: "one annual payment",
          features: [
            "Everything in SME, plus:",
            "Increased transaction limits",
            "Connect Bank Accounts",
            "Three Extra Users",
            "Lawyer Signature on Contracts",
            "10 Contracts",
            "Dedicated support team",
          ],
        };
      default:
        return {
          currentTier: "Free",
          nextTier: "SME",
          title: "Upgrade to SME",
          description: "Run your business properly",
          icon: <Rocket className="h-6 w-6 text-white" />,
          badge: "RUN YOUR BUSINESS",
          primaryCta: "Go SME",
          monthlyPrice: "₦16,658",
          annualPrice: "₦199,900",
          annualSavings: "one annual payment",
          features: [
            "Unlimited invoices & receipts",
            "International payments",
            "One Extra User",
            "Tax calculator",
            "Financial statements",
            "1 Contract",
          ],
        };
    }
  };

  const tierInfo = getNextTierInfo();

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
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl bg-white dark:bg-[#1a1a1a] shadow-2xl flex flex-col md:flex-row"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-20 rounded-full p-1.5 text-gray-400 transition-all hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Left Column - Gradient Header */}
            <div className="relative md:w-2/5 bg-linear-to-br from-(--color-accent-yellow) to-[#e0a800] p-6 text-white flex flex-col justify-between">
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
                <h2 className="text-2xl font-bold tracking-tight mb-2 text-(--color-ink)">
                  {tierInfo.title}
                </h2>
                <p className="text-(--color-ink)/80 text-sm">
                  {tierInfo.description}
                </p>
              </div>

              <div className="relative z-10 mt-4">
                <p className="text-(--color-ink)/70 text-xs uppercase tracking-wider mb-2">
                  Key benefits:
                </p>
                <ul className="space-y-2">
                  {tierInfo.features.slice(0, 4).map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2 text-xs">
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/20">
                        <Check className="h-2.5 w-2.5 text-(--color-ink)" />
                      </div>
                      <span className="text-(--color-ink)/90">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column - Pricing & CTA */}
            <div className="md:w-3/5 p-6 bg-white dark:bg-[#1a1a1a]">
              <div className="mb-3 text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Current:{" "}
                  <span className="font-semibold text-gray-900 dark:text-gray-50">
                    {tierInfo.currentTier}
                  </span>
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setSelectedPlan("monthly")}
                    className={`relative px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                      selectedPlan === "monthly"
                        ? "bg-(--color-accent-yellow) text-(--color-ink) shadow-lg shadow-(--color-accent-yellow)/25"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    Monthly equivalent
                  </button>
                  <button
                    onClick={() => setSelectedPlan("annual")}
                    className={`relative px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                      selectedPlan === "annual"
                        ? "bg-(--color-accent-yellow) text-(--color-ink) shadow-lg shadow-(--color-accent-yellow)/25"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    Annual
                    <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-yellow-900 text-[8px] font-bold px-1 py-0.5 rounded-full">
                      BEST
                    </span>
                  </button>
                </div>
              </div>

              <div className="relative rounded-xl bg-linear-to-br from-(--color-accent-yellow)/5 to-transparent border-2 border-(--color-accent-yellow) p-4 shadow-lg mb-4">
                <div className="absolute -top-2 left-4 bg-(--color-accent-yellow) text-(--color-ink) text-[10px] font-bold px-2 py-0.5 rounded-full">
                  RECOMMENDED
                </div>

                <div className="flex items-center gap-2 mb-2">
                  {tierInfo.icon}
                  <h3 className="font-semibold text-base">
                    {tierInfo.nextTier} Plan
                  </h3>
                </div>

                <div className="mb-2">
                  <span className="text-2xl font-bold">
                    {selectedPlan === "annual"
                      ? tierInfo.annualPrice
                      : tierInfo.monthlyPrice}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">
                    {selectedPlan === "annual" ? "/year" : "/mo"}
                  </span>
                  {selectedPlan === "annual" && (
                    <p className="text-[10px] text-(--color-accent-yellow)">
                      {tierInfo.annualSavings}
                    </p>
                  )}
                </div>

                <ul className="space-y-1 mb-3">
                  {tierInfo.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-1.5 text-xs"
                    >
                      <Check className="h-3 w-3 shrink-0 mt-0.5 text-(--color-accent-yellow)" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Button
                  onClick={handleViewPricing}
                  className="w-full rounded-lg py-3 text-sm font-semibold shadow-lg transition-all hover:scale-[1.02] bg-(--color-accent-yellow) hover:bg-[#e0a800] text-(--color-ink) shadow-(--color-accent-yellow)/25"
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
                  7-day free trial on all plans
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SubscriptionModal;