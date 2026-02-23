import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, RotateCcw, FileText } from "lucide-react";
import { formatNaira } from "@/app/utils/tax-calculation"; 

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
}: TaxCardProps) {
  return (
    <div
      className="relative rounded-2xl border-2 border-[#e6e6e6] dark:border-[#2e2e2e] bg-[#ffffff] dark:bg-[#161616] p-8 md:p-10 space-y-8 transition-all"
      onClick={isPremium ? undefined : onPremiumClick}
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-heading text-[#242424] dark:text-[#ffffff]">{title}</h2>
        <p className="mt-2 text-sm text-[#6b6b6b] dark:text-[#b3b3b3]">{description}</p>
      </div>

      {/* Premium overlay */}
      {!isPremium && (
        <div
          className="absolute inset-0 z-10 rounded-2xl bg-[#ffffff]/60 dark:bg-[#161616]/60 backdrop-blur-[2px] flex items-center justify-center cursor-pointer"
          onClick={onPremiumClick}
        >
          <div className="text-center space-y-2 p-4">
            <p className="font-subheading text-lg font-semibold text-[#242424] dark:text-[#ffffff]">🔒 Premium Feature</p>
            <p className="text-sm text-[#6b6b6b] dark:text-[#b3b3b3]">Click to unlock tax calculations</p>
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
          className="px-6 py-2.5 rounded-xl bg-[#C29307] dark:bg-[#ffffff] text-[#ffffff] dark:text-[#0e0e0e] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
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
                    : "bg-[#C29307]/10 dark:bg-[#ffffff]/10 text-[#C29307] dark:text-[#ffffff]"
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
            <li key={doc} className="text-xs text-[#6b6b6b] dark:text-[#b3b3b3] flex items-start gap-1.5">
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

      {/* Filing Link */}
      <a
        href="https://taxpromax.firs.gov.ng"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#C29307] dark:text-[#ffffff] hover:underline"
      >
        <ExternalLink className="w-4 h-4" /> File via TaxPro Max
      </a>
    </div>
  );
}
