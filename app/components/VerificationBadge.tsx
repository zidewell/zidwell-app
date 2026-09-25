"use client";

import { AlertCircle, Loader2, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useUserContextData } from "@/app/context/userData";
import { useVerificationModal } from "@/app/context/verificationModalContext";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface VerificationBadgeProps {
  className?: string;
  variant?: "store" | "withdrawal" | "default";
  dismissable?: boolean;
  onDismiss?: () => void;
}

const VerificationBadge = ({
  className = "",
  variant = "default",
  dismissable = true,
  onDismiss,
}: VerificationBadgeProps) => {
  const { userData } = useUserContextData();
  const { openVerificationModal, isOpen } = useVerificationModal();
  const [dismissed, setDismissed] = useState(false);

  const isVerified =
    userData?.bvnVerification === "verified" ||
    userData?.ninVerification === "verified";
  const isPending = userData?.bvnVerification === "pending";
  const isNotSubmitted = userData?.bvnVerification === "not_submitted";

  if (isVerified) return null;
  if (dismissed && dismissable) return null;
  if (!isPending && !isNotSubmitted && userData?.bvnVerification) return null;

  const getMessages = () => {
    switch (variant) {
      case "store":
        return {
          title: "Identity Verification",
          pending: "Your identity verification is being processed.",
          notSubmitted:
            "Verify your identity to enable withdrawals and full store features.",
          buttonText: "Verify Now",
          cannotSkip: false,
        };
      case "withdrawal":
        return {
          title: "Verification Required",
          pending: "Verification pending. You must verify to withdraw funds.",
          notSubmitted: "Verify your identity to withdraw funds.",
          buttonText: "Verify Now",
          cannotSkip: true,
        };
      default:
        return {
          title: isPending
            ? "Verification Pending"
            : "Identity Verification",
          pending: "Your verification is being processed.",
          notSubmitted: "Verify your identity to unlock full features.",
          buttonText: "Verify Now",
          cannotSkip: false,
        };
    }
  };

  const messages = getMessages();
  const message = isPending ? messages.pending : messages.notSubmitted;
  const cannotSkip = messages.cannotSkip || false;

  const handleVerify = () => {
    if (!isOpen) openVerificationModal();
  };

  const handleDismiss = () => {
    if (dismissable && !cannotSkip) {
      setDismissed(true);
      onDismiss?.();
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "w-full rounded-xl border px-4 py-3",
          isPending
            ? "border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/10"
            : "border-(--color-accent-yellow)/40 bg-(--color-accent-yellow)/5"
        )}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="shrink-0">
            {isPending ? (
              <Loader2 className="h-5 w-5 text-yellow-600 dark:text-yellow-400 animate-spin" />
            ) : (
              <AlertCircle className="h-5 w-5 text-(--color-accent-yellow)" />
            )}
          </div>

          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
              <div>
                <h4 className="text-sm font-medium text-(--text-primary)">
                  {messages.title}
                  {cannotSkip && (
                    <span className="ml-2 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full">
                      Required
                    </span>
                  )}
                </h4>
                <p className="text-xs text-(--text-secondary)">{message}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                <Button
                  onClick={handleVerify}
                  size="sm"
                  className="h-9 text-xs font-semibold bg-(--color-accent-yellow) hover:opacity-90 text-(--color-ink) rounded-lg cursor-pointer"
                  type="button"
                >
                  {messages.buttonText}
                </Button>

                {dismissable && !cannotSkip && (
                  <button
                    onClick={handleDismiss}
                    className="p-1 rounded-full hover:bg-(--bg-secondary) transition-colors text-(--text-secondary)"
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

export default VerificationBadge;