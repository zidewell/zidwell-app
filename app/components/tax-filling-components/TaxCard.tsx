// app/components/tax-filling-components/TaxCard.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  RotateCcw,
  FileText,
  Crown,
  Zap,
  Sparkles,
  Star,
  Lock,
} from "lucide-react";
import { formatNaira } from "@/app/utils/tax-calculation";
import Link from "next/link";

interface TaxCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  result: React.ReactNode | null;
  statusLabel?: string | null;
  documents: string[];
  disclaimer: string;
  isPremium: boolean;
  onPremiumClick: () => void;
  onCalculate: () => void;
  onReset: () => void;
  userTier?: "free" | "zidlite" | "growth" | "premium" | "elite";
}

export function TaxCard({
  title,
  description,
  children,
  result,
  statusLabel,
  documents,
  disclaimer,
  isPremium,
  onPremiumClick,
  onCalculate,
  onReset,
  userTier = "free",
}: TaxCardProps) {
  const [showUpgradeTooltip, setShowUpgradeTooltip] = useState(false);

  // Get tier-specific messaging
  const getTierMessage = () => {
    if (userTier === "free") {
      return {
        icon: Lock,
        title: "Growth Plan Required",
        message: "Upgrade to Growth plan to access tax calculations",
        buttonText: "View Plans",
        buttonLink: "/pricing?upgrade=growth",
        bgColor: "bg-gray-100",
        textColor: "text-gray-700",
        borderColor: "border-gray-200",
      };
    }
    if (userTier === "zidlite") {
      return {
        icon: Zap,
        title: "Growth Plan Required",
        message: "Tax calculator requires Growth plan or higher",
        buttonText: "Upgrade to Growth",
        buttonLink: "/pricing?upgrade=growth",
        bgColor: "bg-blue-100",
        textColor: "text-blue-700",
        borderColor: "border-blue-200",
      };
    }
    if (userTier === "growth") {
      return {
        icon: Zap,
        title: "Basic Tax Calculator",
        message:
          "You have access to basic calculations. Upgrade to Premium for filing support.",
        buttonText: "Upgrade to Premium",
        buttonLink: "/pricing?upgrade=premium",
        bgColor: "bg-green-100",
        textColor: "text-green-700",
        borderColor: "border-green-200",
      };
    }
    if (userTier === "premium") {
      return {
        icon: Crown,
        title: "Premium Feature",
        message: "You have full access to all tax calculations",
        buttonText: "Upgrade to Elite",
        buttonLink: "/pricing?upgrade=elite",
        bgColor: "bg-[#2b825b]/10",
        textColor: "text-[#2b825b]",
        borderColor: "border-[#2b825b]",
      };
    }
    if (userTier === "elite") {
      return {
        icon: Sparkles,
        title: "Elite Feature",
        message: "You have full access including tax filing support",
        buttonText: "Contact Support",
        buttonLink: "/contact",
        bgColor: "bg-purple-100",
        textColor: "text-purple-700",
        borderColor: "border-purple-200",
      };
    }
    return null;
  };

  // Get tier icon for badge
  const getTierIcon = () => {
    if (userTier === "elite") return Sparkles;
    if (userTier === "premium") return Crown;
    if (userTier === "growth") return Zap;
    if (userTier === "zidlite") return Zap;
    if (userTier === "free") return Star;
    return Lock;
  };

  const tierInfo = getTierMessage();
  const TierIcon = getTierIcon();

  // Get tier colors for badge
  const getTierColors = () => {
    if (userTier === "elite")
      return { bg: "bg-purple-100", text: "text-purple-600" };
    if (userTier === "premium")
      return { bg: "bg-[#2b825b]/10", text: "text-[#2b825b]" };
    if (userTier === "growth")
      return { bg: "bg-green-100", text: "text-green-600" };
    if (userTier === "zidlite")
      return { bg: "bg-blue-100", text: "text-blue-600" };
    return { bg: "bg-gray-100", text: "text-gray-600" };
  };

  const badgeColors = getTierColors();

  return (
    <div
      className="relative rounded-2xl border-2 border-[#e6e6e6] dark:border-[#2e2e2e] bg-[#ffffff] dark:bg-[#161616] p-8 md:p-10 space-y-8 transition-all"
      onMouseEnter={() => setShowUpgradeTooltip(true)}
      onMouseLeave={() => setShowUpgradeTooltip(false)}
    >
      {/* Header with Tier Badge */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-heading text-[#242424] dark:text-[#ffffff]">
            {title}
          </h2>
          <p className="mt-2 text-sm text-[#6b6b6b] dark:text-[#b3b3b3]">
            {description}
          </p>
        </div>

        {/* Tier Badge */}
        {userTier && (
          <div
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${badgeColors.bg} ${badgeColors.text}`}
          >
            <TierIcon className="w-3 h-3" />
            <span className="capitalize">
              {userTier === "zidlite"
                ? "ZidLite"
                : userTier === "free"
                  ? "Free Trial"
                  : userTier}
            </span>
          </div>
        )}
      </div>

      {/* Premium overlay for users without access */}
      {!isPremium && (
        <div
          className="absolute inset-0 z-10 rounded-2xl bg-[#ffffff]/60 dark:bg-[#161616]/60 backdrop-blur-[2px] flex items-center justify-center cursor-pointer"
          onClick={onPremiumClick}
        >
          <div className="text-center space-y-3 p-6 max-w-sm">
            <div className="w-16 h-16 mx-auto bg-[#2b825b]/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-[#2b825b]" />
            </div>
            <p className="font-subheading text-lg font-semibold text-[#242424] dark:text-[#ffffff]">
              {tierInfo?.title || "Premium Feature"}
            </p>
            <p className="text-sm text-[#6b6b6b] dark:text-[#b3b3b3]">
              {tierInfo?.message || "Click to unlock tax calculations"}
            </p>
            <Link href={tierInfo?.buttonLink || "/pricing"}>
              <button className="mt-2 px-6 py-2 bg-[#2b825b] text-white rounded-lg text-sm font-semibold hover:bg-[#1e5d42] transition-colors">
                {tierInfo?.buttonText || "View Plans"}
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Inputs */}
      <div className="space-y-4">{children}</div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onCalculate}
          disabled={!isPremium}
          className="px-6 py-2.5 rounded-xl bg-[#2b825b] dark:bg-[#ffffff] text-[#ffffff] dark:text-[#0e0e0e] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Calculate
        </button>
        <button
          onClick={onReset}
          disabled={!isPremium}
          className="px-4 py-2.5 rounded-xl border border-[#e6e6e6] dark:border-[#2e2e2e] text-[#6b6b6b] dark:text-[#b3b3b3] text-sm hover:bg-[#f5f5f5] dark:hover:bg-[#242424] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="p-4 rounded-xl bg-[#f5f5f5] dark:bg-[#242424] border border-[#e6e6e6] dark:border-[#2e2e2e] space-y-2"
          >
            {result}
            {statusLabel && (
              <span
                className={`inline-block mt-1 px-3 py-1 text-xs font-semibold rounded-full ${
                  statusLabel.includes("owe")
                    ? "bg-[#dc2828]/10 text-[#dc2828]"
                    : "bg-[#2b825b]/10 dark:bg-[#ffffff]/10 text-[#2b825b] dark:text-[#ffffff]"
                }`}
              >
                {statusLabel}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Documents */}
      <div className="space-y-2">
        <h4 className="text-sm font-subheading text-[#242424] dark:text-[#ffffff] flex items-center gap-1.5">
          <FileText className="w-4 h-4" /> Supporting Documents
        </h4>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {documents.map((doc) => (
            <li
              key={doc}
              className="text-xs text-[#6b6b6b] dark:text-[#b3b3b3] flex items-start gap-1.5"
            >
              <span className="mt-0.5 w-1 h-1 rounded-full bg-[#6b6b6b] dark:bg-[#b3b3b3] flex-shrink-0" />
              {doc}
            </li>
          ))}
        </ul>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-[#6b6b6b] dark:text-[#b3b3b3] italic border-t border-[#e6e6e6] dark:border-[#2e2e2e] pt-4">
        {disclaimer}
      </p>

      {/* Filing Link - Only show for Premium+ users */}
      {(userTier === "premium" || userTier === "elite") && (
        <div className="space-y-2">
          <a
            href="https://taxpromax.firs.gov.ng"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#2b825b] dark:text-[#ffffff] hover:underline"
          >
            <ExternalLink className="w-4 h-4" /> File via TaxPro Max
          </a>
          {userTier === "elite" && (
            <p className="text-xs text-purple-600 dark:text-purple-400">
              ✨ Elite benefit: We'll handle your filing for you. Contact your
              account manager.
            </p>
          )}
        </div>
      )}

      {/* Upgrade prompt for non-Premium users */}
      {(userTier === "free" ||
        userTier === "zidlite" ||
        userTier === "growth") && (
        <div className="border-t border-[#e6e6e6] dark:border-[#2e2e2e] pt-4">
          <p className="text-xs text-[#6b6b6b] dark:text-[#b3b3b3] flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Tax filing available on Premium and Elite plans
          </p>
          {userTier === "growth" && (
            <p className="text-xs text-green-600 mt-1">
              Upgrade to Premium for tax filing support
            </p>
          )}
          {userTier === "zidlite" && (
            <p className="text-xs text-blue-600 mt-1">
              Upgrade to Growth for tax calculator access
            </p>
          )}
        </div>
      )}
    </div>
  );
}
