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
  userTier?: "free" | "solopreneur" | "sme" | "enterprise" | "corporation";
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

  // Only Enterprise/Corporation users have filing support
  const hasFilingSupport = userTier === "enterprise" || userTier === "corporation";

  // Get tier icon for badge
  const getTierIcon = () => {
    if (userTier === "corporation") return Sparkles;
    if (userTier === "enterprise") return Crown;
    if (userTier === "sme") return Star;
    if (userTier === "solopreneur") return Zap;
    if (userTier === "free") return Star;
    return Lock;
  };

  const TierIcon = getTierIcon();

  // Get tier colors for badge
  const getTierColors = () => {
    if (userTier === "corporation")
      return {
        bg: "bg-purple-100 dark:bg-purple-900/20",
        text: "text-purple-700 dark:text-purple-400",
      };
    if (userTier === "enterprise")
      return {
        bg: "bg-amber-100 dark:bg-amber-900/20",
        text: "text-amber-700 dark:text-amber-400",
      };
    if (userTier === "sme")
      return {
        bg: "bg-(--color-accent-yellow)/10",
        text: "text-(--color-accent-yellow)",
      };
    if (userTier === "solopreneur")
      return {
        bg: "bg-blue-100 dark:bg-blue-900/20",
        text: "text-blue-600 dark:text-blue-400",
      };
    return {
      bg: "bg-gray-100 dark:bg-gray-800",
      text: "text-gray-600 dark:text-gray-400",
    };
  };

  const badgeColors = getTierColors();

  return (
    <div
      className="relative rounded-2xl border-2 border-(--border-color) bg-(--bg-primary) p-8 md:p-10 space-y-8 transition-all"
      onMouseEnter={() => setShowUpgradeTooltip(true)}
      onMouseLeave={() => setShowUpgradeTooltip(false)}
    >
      {/* Header with Tier Badge */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-heading text-(--text-primary)">
            {title}
          </h2>
          <p className="mt-2 text-sm text-(--text-secondary)">
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
              {userTier === "solopreneur"
                ? "Solopreneur"
                : userTier === "free"
                ? "Free"
                : userTier}
            </span>
          </div>
        )}
      </div>

      {/* NO premium overlay — calculator is free for everyone */}

      {/* Inputs */}
      <div className="space-y-4">{children}</div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onCalculate}
          className="px-6 py-2.5 rounded-xl bg-(--color-accent-yellow) text-(--color-ink) font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Calculate
        </button>
        <button
          onClick={onReset}
          className="px-4 py-2.5 rounded-xl border border-(--border-color) text-(--text-secondary) text-sm hover:bg-(--bg-secondary) transition-colors flex items-center gap-1.5"
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
            className="p-4 rounded-xl bg-(--bg-secondary) border border-(--border-color) space-y-2"
          >
            {result}
            {statusLabel && (
              <span
                className={`inline-block mt-1 px-3 py-1 text-xs font-semibold rounded-full ${
                  statusLabel.includes("owe")
                    ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                    : "bg-(--color-accent-yellow)/10 text-(--color-accent-yellow)"
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
        <h4 className="text-sm font-subheading text-(--text-primary) flex items-center gap-1.5">
          <FileText className="w-4 h-4" /> Supporting Documents
        </h4>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {documents.map((doc) => (
            <li
              key={doc}
              className="text-xs text-(--text-secondary) flex items-start gap-1.5"
            >
              <span className="mt-0.5 w-1 h-1 rounded-full bg-(--text-secondary) shrink-0" />
              {doc}
            </li>
          ))}
        </ul>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-(--text-secondary) italic border-t border-(--border-color) pt-4">
        {disclaimer}
      </p>

      {/* Filing Link - Only show for Enterprise+ users */}
      {hasFilingSupport && (
        <div className="space-y-2">
          <a
            href="https://taxpromax.firs.gov.ng"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-(--color-accent-yellow) hover:underline"
          >
            <ExternalLink className="w-4 h-4" /> File via TaxPro Max
          </a>
          {userTier === "corporation" && (
            <p className="text-xs text-purple-600 dark:text-purple-400">
              ✨ Corporation benefit: We'll handle your filing for you. Contact your
              account manager.
            </p>
          )}
        </div>
      )}

      {/* Filing upsell for non-Enterprise users */}
      {!hasFilingSupport && (
        <div className="border-t border-(--border-color) pt-4">
          <p className="text-xs text-(--text-secondary) flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Tax filing support available on Enterprise and Corporation plans
          </p>
          <Link
            href="/pricing?upgrade=enterprise"
            className="text-xs text-(--color-accent-yellow) mt-1 inline-block hover:underline"
          >
            Upgrade to Enterprise for tax filing support →
          </Link>
        </div>
      )}
    </div>
  );
}