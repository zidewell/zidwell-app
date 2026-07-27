// app/components/BVNVerificationBadge.tsx
"use client";

import { AlertCircle, Loader2, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { useUserContextData } from "@/app/context/userData";
import { useVerificationModal } from "@/app/context/verificationModalContext";

interface BVNVerificationBadgeProps {
  className?: string;
}

const BVNVerificationBadge = ({ className = "" }: BVNVerificationBadgeProps) => {
  const { userData } = useUserContextData();
  const { openVerificationModal, isOpen } = useVerificationModal();

  const isPending = userData?.bvnVerification === "pending";
  const isNotSubmitted = userData?.bvnVerification === "not_submitted";

  if (userData?.bvnVerification === "verified") {
    return null;
  }

  if (!isPending && !isNotSubmitted) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      <div className={`px-4 py-3 rounded-lg border ${
        isPending 
          ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
          : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
      }`}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="shrink-0">
            {isPending ? (
              <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
            ) : (
              <Shield className="h-5 w-5 text-blue-500" />
            )}
          </div>
          <div className="flex-1 min-w-[200px]">
            <p className={`text-sm font-medium ${
              isPending 
                ? "text-yellow-700 dark:text-yellow-300"
                : "text-blue-700 dark:text-blue-300"
            }`}>
              {isPending ? "Verification pending" : "Verify your account"}
            </p>
            <p className={`text-xs ${
              isPending 
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-blue-600 dark:text-blue-400"
            }`}>
              {isPending 
                ? "We're processing your verification."
                : "Complete verification to unlock all features."
              }
            </p>
          </div>
          {isNotSubmitted && (
            <Button
              onClick={() => !isOpen && openVerificationModal()}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-4 text-xs"
            >
              Verify Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BVNVerificationBadge;