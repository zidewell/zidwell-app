"use client";

import { AlertCircle, Loader2, Banknote, Shield, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useUserContextData } from "@/app/context/userData";
import { useVerificationModal } from "@/app/context/verificationModalContext";
import { useState } from "react";

interface BVNVerificationBadgeProps {
  className?: string;
  variant?: "store" | "withdrawal" | "default";
  dismissable?: boolean;
  onDismiss?: () => void;
}

const BVNVerificationBadge = ({
  className = "",
  variant = "default",
  dismissable = true,
  onDismiss,
}: BVNVerificationBadgeProps) => {
  const { userData } = useUserContextData();
  const { openVerificationModal, isOpen } = useVerificationModal();
  const [dismissed, setDismissed] = useState(false);

  const isPending = userData?.bvnVerification === "pending";
  const isNotSubmitted = userData?.bvnVerification === "not_submitted";
  const isVerified = userData?.bvnVerification === "verified";

  // If verified, hide
  if (isVerified) {
    return null;
  }

  // If dismissed and dismissable, hide
  if (dismissed && dismissable) {
    return null;
  }

  // If not showing and not pending/not_submitted, hide
  if (!isPending && !isNotSubmitted) {
    return null;
  }

  const getMessages = () => {
    switch (variant) {
      case "store":
        return {
          title: "BVN Verification Required to Create Store",
          pending: "BVN verification pending. You must verify to create your store.",
          notSubmitted: "You must verify your BVN to create a store and start accepting payments.",
          buttonText: "Verify BVN Now",
          cannotSkip: true,
        };
      case "withdrawal":
        return {
          title: "BVN Verification Required to Withdraw",
          pending: "BVN verification pending. You must verify to withdraw funds.",
          notSubmitted: "You must verify your BVN to withdraw funds from your store balance.",
          buttonText: "Verify BVN Now",
          cannotSkip: true,
        };
      default:
        return {
          title: isPending ? "BVN Verification Pending" : "Complete Your Profile",
          pending: "BVN verification is being processed.",
          notSubmitted: "Verify your BVN to unlock full features.",
          buttonText: "Verify Now",
          cannotSkip: false,
        };
    }
  };

  const messages = getMessages();
  const message = isPending ? messages.pending : messages.notSubmitted;
  const cannotSkip = messages.cannotSkip || false;

  const handleVerify = () => {
    if (!isOpen) {
      openVerificationModal();
    }
  };

  const handleDismiss = () => {
    if (dismissable && !cannotSkip) {
      setDismissed(true);
      if (onDismiss) onDismiss();
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`w-full px-4 py-3 border rounded-xl shadow-sm ${
          isPending
            ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700"
            : "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
        } ${cannotSkip ? "border-l-4 border-l-red-500" : ""}`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="shrink-0">
            {isPending ? (
              <Loader2 className="h-5 w-5 text-yellow-600 dark:text-yellow-400 animate-spin" />
            ) : (
              <Shield className="h-5 w-5 text-red-500 dark:text-red-400" />
            )}
          </div>

          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
              <div>
                <h4
                  className={`text-sm font-semibold ${
                    isPending
                      ? "text-yellow-800 dark:text-yellow-300"
                      : "text-red-800 dark:text-red-400"
                  }`}
                >
                  {messages.title}
                  {cannotSkip && (
                    <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                      Required
                    </span>
                  )}
                </h4>
                <p
                  className={`text-xs ${
                    isPending
                      ? "text-yellow-700 dark:text-yellow-400/80"
                      : "text-red-700 dark:text-red-400/80"
                  }`}
                >
                  {message}
                  {cannotSkip && (
                    <span className="block text-[10px] font-medium mt-0.5 text-red-600 dark:text-red-400">
                      ⚠️ You cannot proceed without verifying your BVN
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                <Button
                  onClick={handleVerify}
                  size="sm"
                  className={`shrink-0 h-9 text-xs whitespace-nowrap font-semibold ${
                    variant === "store" || variant === "withdrawal"
                      ? "bg-[#e1bf46] hover:bg-[#e1bf46]/90 text-[#023528]"
                      : "bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink)"
                  }`}
                  type="button"
                >
                  <Banknote className="h-3.5 w-3.5 mr-1.5" />
                  {messages.buttonText}
                </Button>

                {dismissable && !cannotSkip && (
                  <button
                    onClick={handleDismiss}
                    className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-gray-400"
                    aria-label="Dismiss"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BVNVerificationBadge;