"use client";

import { AlertCircle, Loader2, Shield, X, Check } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useUserContextData } from "@/app/context/userData";
import { useVerificationModal } from "@/app/context/verificationModalContext";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
          title: "BVN Verification",
          pending: "Your BVN verification is being processed.",
          notSubmitted: "Verify your BVN to enable withdrawals and full store features.",
          buttonText: "Verify BVN",
          cannotSkip: false,
        };
      case "withdrawal":
        return {
          title: "BVN Verification Required",
          pending: "Verification pending. You must verify to withdraw funds.",
          notSubmitted: "Verify your BVN to withdraw funds from your store.",
          buttonText: "Verify BVN",
          cannotSkip: true,
        };
      default:
        return {
          title: isPending ? "BVN Verification Pending" : "BVN Verification",
          pending: "Your BVN verification is being processed.",
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
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "w-full rounded-xl border px-4 py-3",
          isPending
            ? "border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/10"
            : "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10"
        )}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Icon */}
          <div className="shrink-0">
            {isPending ? (
              <Loader2 className="h-5 w-5 text-yellow-600 dark:text-yellow-400 animate-spin" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
              <div>
                <h4
                  className={cn(
                    "text-sm font-medium",
                    isPending
                      ? "text-yellow-800 dark:text-yellow-300"
                      : "text-red-800 dark:text-red-400"
                  )}
                >
                  {messages.title}
                  {cannotSkip && (
                    <span className="ml-2 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full">
                      Required
                    </span>
                  )}
                </h4>
                <p
                  className={cn(
                    "text-xs",
                    isPending
                      ? "text-yellow-700 dark:text-yellow-400/70"
                      : "text-red-700 dark:text-red-400/70"
                  )}
                >
                  {message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                <Button
                  onClick={handleVerify}
                  size="sm"
                  className="h-9 text-xs font-semibold bg-[#FDC020] hover:bg-[#e6a800] text-[#191919] rounded-lg"
                  type="button"
                >
                  {messages.buttonText}
                </Button>

                {dismissable && !cannotSkip && (
                  <button
                    onClick={handleDismiss}
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
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