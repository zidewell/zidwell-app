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
  const [isVisible, setIsVisible] = useState(false); // Start with false
  const [mounted, setMounted] = useState(false);

  // Handle mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check localStorage only after mount
  useEffect(() => {
    if (mounted) {
      const dismissed = localStorage.getItem("upgradeBannerDismissed");
      if (dismissed !== "true") {
        setIsVisible(true);
      }
    }
  }, [mounted]);

  // Don't render anything during SSR or while loading
  if (!mounted || loading) {
    return null;
  }

  // Only show for free users and if visible
  if (!isFree || !isVisible) {
    return null;
  }

  const handleUpgrade = () => {
    router.push("/pricing?upgrade=zidlite");
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <motion.div
              className="relative overflow-hidden rounded-2xl shadow-[0_10px_40px_-10px_rgba(43,130,91,0.3)] dark:shadow-[0_10px_40px_-10px_rgba(43,130,91,0.5)] border border-(--color-accent-yellow)/20"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-linear-to-r from-(--color-accent-yellow) via-[#3a9b6e] to-(--color-accent-yellow) bg-size-[200%_100%] animate-gradient-x opacity-10 dark:opacity-20" />

              {/* Main gradient overlay */}
              <div className="absolute inset-0 bg-linear-to-br from-(--color-accent-yellow)/5 via-transparent to-(--color-accent-yellow)/10 dark:from-(--color-accent-yellow)/20 dark:via-transparent dark:to-(--color-accent-yellow)/30" />

              {/* Glow effect */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-(--color-accent-yellow)/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-(--color-accent-yellow)/10 rounded-full blur-3xl animate-pulse delay-1000" />

              {/* Content */}
              <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-4 py-3 sm:px-6">
                <div className="flex items-center gap-3">
                  {/* Icon with pulse animation */}
                  <motion.div
                    className="shrink-0"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="h-8 w-8 rounded-xl bg-linear-to-br from-(--color-accent-yellow) to-[#1e5f43] flex items-center justify-center shadow-lg shadow-(--color-accent-yellow)/30">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
                        You're on the Free Trial Plan
                        <motion.span
                          className="inline-flex items-center px-2 py-0.5 rounded-full bg-(--color-accent-yellow)/10 text-(--color-accent-yellow) text-[10px] font-semibold"
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          Upgrade Available
                        </motion.span>
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Upgrade to ZidLite to get 10 invoices, 10 receipts,
                        bookkeeping trials, and WhatsApp community access.
                      </p>
                    </div>

                    {/* Upgrade Button with hover effect */}
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={handleUpgrade}
                        size="sm"
                        className="bg-linear-to-r from-(--color-accent-yellow) to-[#1e5f43] hover:from-[#1e5f43] hover:to-(--color-accent-yellow) text-white h-8 sm:h-9 text-xs sm:text-sm whitespace-nowrap shadow-lg shadow-(--color-accent-yellow)/30 border border-(--color-accent-yellow)/50"
                      >
                        Upgrade to ZidLite
                        <Zap className="h-3 w-3 sm:h-4 sm:w-4 ml-1.5" />
                      </Button>
                    </motion.div>
                  </div>

                  {/* Close button with hover effect */}
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
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
