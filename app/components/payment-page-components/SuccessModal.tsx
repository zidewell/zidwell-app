// app/components/payment-page-components/SuccessModal.tsx

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Copy, Link2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";

interface SuccessModalProps {
  isOpen: boolean;
  pageUrl: string;
  copied: boolean;
  onClose: () => void;
  onCopy: () => void;
  onPreview: () => void;
  onDashboard: () => void;
}

export function SuccessModal({
  isOpen,
  pageUrl,
  copied,
  onClose,
  onCopy,
  onPreview,
  onDashboard,
}: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-[var(--bg-primary)] rounded-3xl p-4 sm:p-6 md:p-8 max-w-[90%] sm:max-w-md md:max-w-lg lg:max-w-xl w-full text-center shadow-2xl border border-[var(--border-color)] mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">
            🎉
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">
            Payment Page Created!
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] mb-4 sm:mb-6">
            Your page is now live and ready to collect payments.
          </p>

          <div className="bg-[var(--bg-secondary)] rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-[var(--border-color)]">
            <Label className="text-xs sm:text-sm font-semibold text-[var(--color-accent-yellow)] mb-2 block text-left">
              Your Payment Link:
            </Label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-2 flex-1 bg-[var(--bg-primary)] rounded-lg p-2 sm:p-3 border border-[var(--border-color)]">
                <Link2 className="h-4 w-4 text-[var(--color-accent-yellow)] shrink-0" />
                <code className="text-xs sm:text-sm font-mono text-[var(--text-primary)] break-all flex-1 text-left">
                  {pageUrl}
                </code>
              </div>
              <button
                onClick={onCopy}
                className="relative p-2 sm:p-3 rounded-lg bg-[var(--color-accent-yellow)]/10 hover:bg-[var(--color-accent-yellow)]/20 transition-colors group shrink-0"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-lemon-green)]" />
                ) : (
                  <Copy className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-accent-yellow)]" />
                )}
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--color-ink)] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {copied ? "Copied!" : "Copy link"}
                </span>
              </button>
            </div>
            {copied && (
              <p className="text-xs text-[var(--color-lemon-green)] mt-2 text-center animate-pulse">
                ✓ Link copied to clipboard!
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              onClick={onPreview}
            >
              Preview Page
            </Button>
            <Button
              variant="default"
              className="flex-1 bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90"
              onClick={onDashboard}
            >
              Go to Dashboard
            </Button>
          </div>

          <button
            onClick={onClose}
            className="mt-4 text-xs sm:text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
