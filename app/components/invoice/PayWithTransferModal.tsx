"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { TransferCheckout } from "@/app/components/invoice/TransferCheckout";
import { useToast } from "@/app/hooks/use-toast";
import { AlertCircle } from "lucide-react";

// Types
interface PayerInfo {
  fullName: string;
  email: string;
  phone: string;
}

interface PayWithTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  amount: number;
  payerInfo: PayerInfo;
  initiatorAccountName?: string;
  initiatorAccountNumber?: string;
  initiatorBankName?: string;
}

interface PaymentCheckResponse {
  paymentExists: boolean;
  paymentId?: string;
  transactionId?: string;
  status?: string;
}

export function PayWithTransferModal({
  isOpen,
  onClose,
  invoiceId,
  amount,
  payerInfo,
  initiatorAccountName,
  initiatorAccountNumber,
  initiatorBankName,
}: PayWithTransferModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "verified" | "not_found"
  >("pending");
  const [autoCheckInterval, setAutoCheckInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [lastCheckResult, setLastCheckResult] =
    useState<PaymentCheckResponse | null>(null);

  const autoCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (autoCheckIntervalRef.current) {
        clearInterval(autoCheckIntervalRef.current);
      }
      if (autoCheckInterval) {
        clearInterval(autoCheckInterval);
      }
    };
  }, [autoCheckInterval]);

  const checkPaymentStatus =
    useCallback(async (): Promise<PaymentCheckResponse> => {
      try {
        const response = await fetch("/api/check-invoice-tranfer-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invoiceId,
            amount,
            payerEmail: payerInfo.email,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Error checking payment status:", error);
        return { paymentExists: false };
      }
    }, [invoiceId, amount, payerInfo.email]);

  const handleStartAutoCheck = useCallback(() => {
    // Clear any existing interval
    if (autoCheckIntervalRef.current) {
      clearInterval(autoCheckIntervalRef.current);
    }

    // Start new interval to check every 30 seconds
    const interval = setInterval(async () => {
      try {
        const result = await checkPaymentStatus();
        if (result.paymentExists) {
          // Payment found! Stop checking and show success
          clearInterval(interval);
          setPaymentStatus("verified");
          setLastCheckResult(result);
          toast({
            title: "Payment Verified!",
            description: "Your payment has been confirmed successfully.",
          });
        }
      } catch (error) {
        console.error("Auto-check error:", error);
      }
    }, 30000); // Check every 30 seconds

    autoCheckIntervalRef.current = interval;
    setAutoCheckInterval(interval);
  }, [checkPaymentStatus, toast]);

  const handleConfirmTransfer = useCallback(async () => {
    if (!initiatorAccountNumber) {
      toast({
        title: "Bank Details Required",
        description:
          "Bank account details are not available. Please contact the invoice sender.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // First check if payment already exists
      const checkResult = await checkPaymentStatus();

      if (checkResult.paymentExists) {
        // Payment already exists
        setPaymentStatus("verified");
        setLastCheckResult(checkResult);
        setIsSubmitting(false);
        toast({
          title: "Payment Already Verified",
          description: "Your payment has already been processed.",
        });
        return;
      }

      // Start automatic checking
      handleStartAutoCheck();

      // Show success message
      toast({
        title: "Transfer Confirmation Started",
        description:
          "We're now checking for your payment. This may take a few minutes.",
      });
    } catch (error) {
      console.error("Transfer confirmation error:", error);
      toast({
        title: "Request Failed",
        description: "Failed to process your request. Please try again later.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  }, [initiatorAccountNumber, checkPaymentStatus, handleStartAutoCheck, toast]);

  const handleManualCheck = useCallback(async () => {
    setIsSubmitting(true);

    try {
      const result = await checkPaymentStatus();
      setLastCheckResult(result);

      if (result.paymentExists) {
        setPaymentStatus("verified");
        toast({
          title: "Payment Found!",
          description: "Your payment has been verified successfully.",
        });

        // Stop auto-checking if payment is found
        if (autoCheckIntervalRef.current) {
          clearInterval(autoCheckIntervalRef.current);
          autoCheckIntervalRef.current = null;
        }
      } else {
        toast({
          title: "Payment Not Found",
          description:
            "We haven't detected your payment yet. Please try again in a few minutes.",
        });
      }
    } catch (error) {
      console.error("Manual check error:", error);
      toast({
        title: "Check Failed",
        description: "Failed to check payment status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [checkPaymentStatus, toast]);

  const bankDetails = {
    bankName: initiatorBankName || "",
    accountName: initiatorAccountName || "",
    accountNumber: initiatorAccountNumber || "",
  };

  const invoiceDetails = {
    invoiceId: invoiceId,
    amount: amount,
    currency: "NGN",
    description: `Payment for invoice ${invoiceId}`,
  };

  // Handle modal close
  const handleClose = () => {
    // Clear intervals when modal closes
    if (autoCheckIntervalRef.current) {
      clearInterval(autoCheckIntervalRef.current);
      autoCheckIntervalRef.current = null;
    }
    if (autoCheckInterval) {
      clearInterval(autoCheckInterval);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {/* <span className="text-[#2b825b]">Pay via Bank Transfer</span> */}
            {paymentStatus === "verified" ? (
              <span className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded-full">
                ✅ Payment Verified
              </span>
            ) : autoCheckIntervalRef.current ? (
              <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded-full animate-pulse">
                🔍 Checking...
              </span>
            ) : null}
          </DialogTitle>
          {/* <DialogDescription>
            Complete your payment through bank transfer
          </DialogDescription> */}
        </DialogHeader>

        <div className="py-4">
          <TransferCheckout
            bankDetails={bankDetails}
            invoiceDetails={invoiceDetails}
            onConfirmTransfer={handleConfirmTransfer}
            payerInfo={{
              email: payerInfo.email,
              name: payerInfo.fullName,
              phone: payerInfo.phone,
            }}
          />
        </div>

        {/* Payment Verification Status */}
        {paymentStatus === "verified" && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-green-800">
                🎉 Payment Verified!
              </h4>
            </div>

            <div className="space-y-2 text-sm text-green-700">
              <p>
                <strong>Invoice:</strong> {invoiceId}
              </p>
              <p>
                <strong>Amount:</strong> ₦{amount.toLocaleString()}
              </p>
              <p>
                <strong>Status:</strong> Verified
              </p>
              {lastCheckResult?.paymentId && (
                <p>
                  <strong>Payment Reference:</strong>{" "}
                  {lastCheckResult.paymentId}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Payment Checking Status */}
        {autoCheckIntervalRef.current && paymentStatus !== "verified" && (
          <div className="mt-4 space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                🔍 Payment Status
              </h4>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-blue-700">
                  ⏳ Automatically checking for your payment
                </span>
                <span className="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded animate-pulse">
                  Live
                </span>
              </div>

              <div className="text-sm text-blue-700 space-y-2">
                <p>• We're checking for your payment every 30 seconds</p>
                <p>• This can take 5-30 minutes depending on your bank</p>
                <p>• You'll be notified when payment is confirmed</p>
                <p>• You can manually check now if you prefer</p>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleManualCheck}
                disabled={isSubmitting}
                variant="outline"
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                🔍 Check Payment Status Now
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-gray-300"
          >
            {paymentStatus === "verified" ? "Close" : "Cancel"}
          </Button>

          {paymentStatus !== "verified" && (
            <Button
              onClick={handleManualCheck}
              disabled={isSubmitting || !payerInfo.email}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Checking...
                </>
              ) : (
                "Check Status"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
