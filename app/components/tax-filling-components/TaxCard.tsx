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
        bgColor: "bg-gray-100 dark:bg-gray-800",
        textColor: "text-gray-700 dark:text-gray-300",
        borderColor: "border-gray-200 dark:border-gray-700",
      };
    }
    if (userTier === "zidlite") {
      return {
        icon: Zap,
        title: "Growth Plan Required",
        message: "Tax calculator requires Growth plan or higher",
        buttonText: "Upgrade to Growth",
        buttonLink: "/pricing?upgrade=growth",
        bgColor: "bg-blue-100 dark:bg-blue-900/20",
        textColor: "text-blue-700 dark:text-blue-400",
        borderColor: "border-blue-200 dark:border-blue-800",
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
        bgColor: "bg-[var(--color-accent-yellow)]/10",
        textColor: "text-[var(--color-accent-yellow)]",
        borderColor: "border-[var(--color-accent-yellow)]/30",
      };
    }
    if (userTier === "premium") {
      return {
        icon: Crown,
        title: "Premium Feature",
        message: "You have full access to all tax calculations",
        buttonText: "Upgrade to Elite",
        buttonLink: "/pricing?upgrade=elite",
        bgColor: "bg-[var(--color-accent-yellow)]/10",
        textColor: "text-[var(--color-accent-yellow)]",
        borderColor: "border-[var(--color-accent-yellow)]",
      };
    }
    if (userTier === "elite") {
      return {
        icon: Sparkles,
        title: "Elite Feature",
        message: "You have full access including tax filing support",
        buttonText: "Contact Support",
        buttonLink: "/contact",
        bgColor: "bg-purple-100 dark:bg-purple-900/20",
        textColor: "text-purple-700 dark:text-purple-400",
        borderColor: "border-purple-200 dark:border-purple-800",
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
      return { bg: "bg-purple-100 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400" };
    if (userTier === "premium")
      return { bg: "bg-[var(--color-accent-yellow)]/10", text: "text-[var(--color-accent-yellow)]" };
    if (userTier === "growth")
      return { bg: "bg-[var(--color-accent-yellow)]/10", text: "text-[var(--color-accent-yellow)]" };
    if (userTier === "zidlite")
      return { bg: "bg-blue-100 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" };
    return { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400" };
  };

  const badgeColors = getTierColors();

  return (
    <div
      className="relative rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-primary)] p-8 md:p-10 space-y-8 transition-all"
      onMouseEnter={() => setShowUpgradeTooltip(true)}
      onMouseLeave={() => setShowUpgradeTooltip(false)}
    >
      {/* Header with Tier Badge */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-heading text-[var(--text-primary)]">
            {title}
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
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
          className="absolute inset-0 z-10 rounded-2xl bg-[var(--bg-primary)]/60 backdrop-blur-[2px] flex items-center justify-center cursor-pointer"
          onClick={onPremiumClick}
        >
          <div className="text-center space-y-3 p-6 max-w-sm">
            <div className="w-16 h-16 mx-auto bg-[var(--color-accent-yellow)]/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-[var(--color-accent-yellow)]" />
            </div>
            <p className="font-subheading text-lg font-semibold text-[var(--text-primary)]">
              {tierInfo?.title || "Premium Feature"}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              {tierInfo?.message || "Click to unlock tax calculations"}
            </p>
            <Link href={tierInfo?.buttonLink || "/pricing"}>
              <button className="mt-2 px-6 py-2 bg-[var(--color-accent-yellow)] text-[var(--color-ink)] rounded-lg text-sm font-semibold hover:bg-[var(--color-accent-yellow)]/90 transition-colors">
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
          className="px-6 py-2.5 rounded-xl bg-[var(--color-accent-yellow)] text-[var(--color-ink)] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Calculate
        </button>
        <button
          onClick={onReset}
          disabled={!isPremium}
          className="px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-secondary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
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
            className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-2"
          >
            {result}
            {statusLabel && (
              <span
                className={`inline-block mt-1 px-3 py-1 text-xs font-semibold rounded-full ${
                  statusLabel.includes("owe")
                    ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                    : "bg-[var(--color-accent-yellow)]/10 text-[var(--color-accent-yellow)]"
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
        <h4 className="text-sm font-subheading text-[var(--text-primary)] flex items-center gap-1.5">
          <FileText className="w-4 h-4" /> Supporting Documents
        </h4>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {documents.map((doc) => (
            <li
              key={doc}
              className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5"
            >
              <span className="mt-0.5 w-1 h-1 rounded-full bg-[var(--text-secondary)] shrink-0" />
              {doc}
            </li>
          ))}
        </ul>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-[var(--text-secondary)] italic border-t border-[var(--border-color)] pt-4">
        {disclaimer}
      </p>

      {/* Filing Link - Only show for Premium+ users */}
      {(userTier === "premium" || userTier === "elite") && (
        <div className="space-y-2">
          <a
            href="https://taxpromax.firs.gov.ng"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-accent-yellow)] hover:underline"
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
        <div className="border-t border-[var(--border-color)] pt-4">
          <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Tax filing available on Premium and Elite plans
          </p>
          {userTier === "growth" && (
            <p className="text-xs text-[var(--color-accent-yellow)] mt-1">
              Upgrade to Premium for tax filing support
            </p>
          )}
          {userTier === "zidlite" && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Upgrade to Growth for tax calculator access
            </p>
          )}
        </div>
      )}
    </div>
  );
}