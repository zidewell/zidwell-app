"use client";

import { Sparkles, Zap, X } from "lucide-react";
import { Button } from "../ui/button";
import { useSubscription } from "@/app/hooks/useSubscripion";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface UpgradeBannerProps {
  className?: string;
}

export function UpgradeBanner({ className = "" }: UpgradeBannerProps) {
  const router = useRouter();
  const { isFree, loading } = useSubscription();
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const dismissed = localStorage.getItem("upgradeBannerDismissed");
      if (dismissed !== "true") {
        setIsVisible(true);
      }
    }
  }, [mounted]);

  if (!mounted || loading) {
    return null;
  }

  if (!isFree || !isVisible) {
    return null;
  }

  const handleUpgrade = () => {
    router.push("/#pricing");
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("upgradeBannerDismissed", "true");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`sticky top-0 left-0 right-0 z-50 w-full ${className}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2">
            <motion.div
              className="relative overflow-hidden rounded-xl sm:rounded-2xl shadow-[0_10px_40px_-10px_rgba(43,130,91,0.3)] dark:shadow-[0_10px_40px_-10px_rgba(43,130,91,0.5)] border border-(--color-accent-yellow)/20"
              whileHover={{ scale: 1.005 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-2.5 sm:px-4 sm:py-3 md:px-6">
                {/* ── Mobile layout (< sm) ── */}
                <div className="flex items-start gap-2.5 sm:hidden">
                  <motion.div
                    className="shrink-0 mt-0.5"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="h-7 w-7 rounded-lg bg-(--color-accent-yellow) flex items-center justify-center shadow-lg shadow-(--color-accent-yellow)/30">
                      <Sparkles className="h-3.5 w-3.5 text-black dark:text-white" />
                    </div>
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-black dark:text-white leading-tight">
                        You're on the Free Plan
                      </h4>
                      <motion.span
                        className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-(--color-accent-yellow)/10 text-black dark:text-white text-[8px] font-semibold whitespace-nowrap"
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        Upgrade
                      </motion.span>
                    </div>
                    <p className="text-[10px] text-black/70 dark:text-white/70 leading-snug mt-1 line-clamp-2">
                      Unlock unlimited invoices, tax calculator & more with SME.
                    </p>
                    <motion.div
                      className="mt-2"
                      whileTap={{ scale: 0.97 }}
                    >
                      <Button
                        onClick={handleUpgrade}
                        size="sm"
                        className="bg-(--color-accent-yellow) hover:bg-[#1e5f43] text-black dark:text-white h-7 px-3 text-[10px] font-semibold whitespace-nowrap shadow-md shadow-(--color-accent-yellow)/30 border border-(--color-accent-yellow)/50 rounded-lg"
                      >
                        Upgrade to SME
                        <Zap className="h-3 w-3 ml-1" />
                      </Button>
                    </motion.div>
                  </div>

                  <motion.button
                    onClick={handleDismiss}
                    className="shrink-0 text-black dark:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-1 transition-colors"
                    aria-label="Dismiss"
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="h-3 w-3" />
                  </motion.button>
                </div>

                {/* ── Tablet & Desktop layout (≥ sm) ── */}
                <div className="hidden sm:flex items-center gap-3">
                  <motion.div
                    className="shrink-0"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-(--color-accent-yellow) flex items-center justify-center shadow-lg shadow-(--color-accent-yellow)/30">
                      <Sparkles className="h-4 w-4 md:h-[18px] md:w-[18px] text-black dark:text-white" />
                    </div>
                  </motion.div>

                  <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3 min-w-0">
                    <div className="min-w-0">
                      <h4 className="text-sm md:text-base font-bold text-black dark:text-white flex items-center gap-2 flex-wrap">
                        You're on the Free Plan
                        <motion.span
                          className="inline-flex items-center px-2 py-0.5 rounded-full bg-(--color-accent-yellow)/10 text-black dark:text-white text-[10px] font-semibold whitespace-nowrap"
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          Upgrade Available
                        </motion.span>
                      </h4>
                      <p className="text-xs md:text-sm text-black dark:text-white line-clamp-2 md:line-clamp-1 mt-0.5">
                        Upgrade to SME to unlock unlimited invoices & receipts,
                        bank statement uploads, tax calculator, financial
                        statements, and more.
                      </p>
                    </div>

                    <motion.div
                      className="shrink-0"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={handleUpgrade}
                        size="sm"
                        className="bg-(--color-accent-yellow) hover:bg-[#1e5f43] text-black dark:text-white h-8 sm:h-9 text-xs sm:text-sm whitespace-nowrap shadow-lg shadow-(--color-accent-yellow)/30 border border-(--color-accent-yellow)/50"
                      >
                        Upgrade to SME
                        <Zap className="h-3 w-3 sm:h-4 sm:w-4 ml-1.5" />
                      </Button>
                    </motion.div>
                  </div>

                  <motion.button
                    onClick={handleDismiss}
                    className="shrink-0 text-black dark:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-1.5 transition-colors"
                    aria-label="Dismiss"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}