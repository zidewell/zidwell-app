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
  const { userTier, loading } = useSubscription();
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

  if (userTier && userTier !== "free") {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  const handleUpgrade = () => {
    router.push("/pricing?upgrade=solopreneur");
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("upgradeBannerDismissed", "true");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`sticky top-0 left-0 right-0 w-full ${className}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <motion.div
              className="relative overflow-hidden rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              {/* Simple solid background - no gradients */}
              <div className="px-4 py-3 sm:px-6">
                <div className="flex items-start sm:items-center gap-3">
                  {/* Icon with pulse animation */}
                  <motion.div
                    className="shrink-0 mt-0.5 sm:mt-0"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="h-8 w-8 rounded-xl bg-yellow-400 flex items-center justify-center shadow-sm">
                      <Sparkles className="h-4 w-4 text-black" />
                    </div>
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-50 flex items-center flex-wrap gap-2">
                        You're on the Free Plan
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-[10px] font-semibold">
                          Upgrade Available
                        </span>
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Upgrade to <span className="font-semibold text-yellow-600 dark:text-yellow-400">Solopreneur</span> for ₦4,900/month — get 10 invoices, unlimited receipts, branded invoices, expense tracking & financial insights.
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          onClick={handleUpgrade}
                          size="sm"
                          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold h-8 sm:h-9 text-xs sm:text-sm whitespace-nowrap shadow-sm"
                        >
                          Upgrade Now
                          <Zap className="h-3 w-3 sm:h-4 sm:w-4 ml-1.5" />
                        </Button>
                      </motion.div>

                      <motion.button
                        onClick={handleDismiss}
                        className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-1.5 transition-colors"
                        aria-label="Dismiss"
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}