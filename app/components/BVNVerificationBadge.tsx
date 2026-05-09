// BVNVerificationBadge.tsx
"use client";

import { AlertCircle, Loader2, Banknote } from "lucide-react";
import { Button } from "./ui/button";
import { useUserContextData } from "@/app/context/userData";
import { useVerificationModal } from "@/app/context/verificationModalContext";

interface BVNVerificationBadgeProps {
  className?: string;
}

const BVNVerificationBadge = ({
  className = "",
}: BVNVerificationBadgeProps) => {
  const { userData } = useUserContextData();
  const { openVerificationModal, isOpen } = useVerificationModal();

  // Check if user needs verification
  const isPending = userData?.bvnVerification === "pending";
  const isNotSubmitted = userData?.bvnVerification === "not_submitted";

  // If already verified, show nothing
  if (userData?.bvnVerification === "verified") {
    return null;
  }

  // Don't show if not needed
  if (!isPending && !isNotSubmitted) {
    return null;
  }

  const handleVerifyClick = () => {
    // Prevent opening if already open
    if (!isOpen) {
      openVerificationModal();
    }
  };

  return (
    <div className={`sticky top-0 left-0 right-0 z-30 w-full ${className}`}>
      <div
        className={`w-full px-4 py-3 border-b shadow-sm ${
          isPending
            ? "bg-(--color-accent-yellow)/10 border-(--color-accent-yellow)/30"
            : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="shrink-0">
            {isPending ? (
              <Loader2 className="h-5 w-5 text-(--color-accent-yellow) animate-spin" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h4
                className={`text-sm font-semibold ${
                  isPending
                    ? "text-(--color-accent-yellow)"
                    : "text-red-800 dark:text-red-400"
                }`}
              >
                {isPending
                  ? "BVN Verification Pending"
                  : "Complete Your Profile"}
              </h4>
              <p
                className={`text-xs ${
                  isPending
                    ? "text-(--text-secondary)"
                    : "text-red-700 dark:text-red-500"
                }`}
              >
                {isPending
                  ? "Your BVN verification is being processed."
                  : "Verify your BVN to unlock full wallet features and get your virtual account."}
              </p>
            </div>
            {isNotSubmitted && (
              <Button
                onClick={handleVerifyClick}
                size="sm"
                className="bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) h-8 text-xs whitespace-nowrap"
                type="button"
              >
                <Banknote className="h-3 w-3 mr-1" />
                Verify Now
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BVNVerificationBadge;
