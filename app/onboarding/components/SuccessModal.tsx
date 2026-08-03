// app/onboarding/components/SuccessModal.tsx
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import confetti from "canvas-confetti";
import { useEffect } from "react";

export interface CompleteResult {
  accountNumber: string;
  accountName: string;
  bankName: string;
}

interface SuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: CompleteResult | null;
  onGoToDashboard?: () => void;
}

export default function SuccessModal({
  open,
  onOpenChange,
  result,
  onGoToDashboard,
}: SuccessModalProps) {
  // Trigger confetti when modal opens and result is available
  useEffect(() => {
    if (open && result) {
      // Small delay to ensure modal is rendered
      const timer = setTimeout(() => {
        confetti({
          particleCount: 180,
          spread: 100,
          origin: { y: 0.6 },
          colors: ["#00B64F", "#FDC020", "#191919", "#FFFFFF"],
        });
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [open, result]);

  const handleGoToDashboard = () => {
    onOpenChange(false);
    if (onGoToDashboard) {
      onGoToDashboard();
    }
  };

  // Show loading state if open but no result yet
  if (open && !result) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <DialogHeader className="flex flex-col items-center text-center space-y-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Setting up your account...
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Please wait while we finalize your account setup.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  // Don't render if not open or no result
  if (!open || !result) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <DialogHeader className="flex flex-col items-center text-center space-y-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            🎉 Account Activated!
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Your Zidwell account has been successfully activated. You can now
            start using all the features.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 rounded-xl bg-gray-50 dark:bg-gray-700/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Account Name
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {result.accountName || "N/A"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Account Number
            </span>
            <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
              {result.accountNumber || "N/A"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Bank
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {result.bankName || "N/A"}
            </span>
          </div>
        </div>

        <DialogFooter className="sm:justify-center mt-6">
          <Button
            type="button"
            onClick={handleGoToDashboard}
            className="w-full sm:w-auto h-12 px-8 bg-yellow-400 text-black hover:bg-yellow-500 font-semibold gap-2"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}