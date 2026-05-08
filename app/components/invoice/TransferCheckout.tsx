"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Copy,
  Check,
  Building2,
  CreditCard,
  FileText,
  ArrowRight,
  Shield,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useToast } from "@/app/hooks/use-toast";

// Types
interface BankDetails {
  bankName: string | undefined;
  accountName: string;
  accountNumber: string;
}

interface InvoiceDetails {
  invoiceId: string;
  amount: number;
  currency: string;
  description: string;
  dueDate?: string;
}

interface PayerInfo {
  email: string;
  name: string;
  phone: string;
}

interface PaymentCheckResponse {
  paymentExists: boolean;
  foundIn?: string;
  paymentId?: string;
  transactionId?: string;
  status?: string;
  amount?: number;
  paid_amount?: number;
  message?: string;
  suggestions?: string[];
  checkedPlaces?: string[];
  error?: string;
}

interface TransferCheckoutProps {
  bankDetails?: BankDetails;
  invoiceDetails?: InvoiceDetails;
  onConfirmTransfer?: (payerInfo?: PayerInfo) => Promise<void>;
  payerInfo?: PayerInfo;
}

interface DetailRowProps {
  label: string;
  value: string;
  onCopy: () => void;
  isCopied: boolean;
  highlight?: boolean;
  isValid?: boolean | "";
}

// Helper Component
function DetailRow({
  label,
  value,
  onCopy,
  isCopied,
  highlight,
  isValid = true,
}: DetailRowProps) {
  const isInvalidValue =
    !value || value === "Account details not provided" || value === "";

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p
          className={`font-medium ${
            highlight
              ? "text-(--color-accent-yellow) font-mono"
              : "text-foreground"
          } ${isInvalidValue ? "text-gray-500 italic" : ""}`}
        >
          {isInvalidValue ? "Not provided in invoice" : value}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onCopy}
        className="h-8 w-8 hover:bg-secondary"
        disabled={isInvalidValue}
      >
        {isCopied ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <Copy className="w-4 h-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}

// Utility functions
const copyToClipboardUtil = async (
  text: string | undefined,
  fieldName: string,
  toast: any,
) => {
  if (!text || text === "Account details not provided") {
    toast({
      title: "No data to copy",
      description: `No ${fieldName} available to copy`,
      variant: "destructive",
    });
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${fieldName} copied to clipboard`,
    });
    return fieldName;
  } catch (err) {
    console.error("Failed to copy:", err);
    toast({
      title: "Copy Failed",
      description: "Please copy manually",
      variant: "destructive",
    });
    return null;
  }
};

const formatCurrency = (amount: number, currency: string) => {
  if (currency === "NGN") {
    return `₦${amount.toLocaleString()}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

export function TransferCheckout({
  bankDetails,
  invoiceDetails,
  onConfirmTransfer,
  payerInfo,
}: TransferCheckoutProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "not_found" | "found" | "checking" | "error"
  >("not_found");
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [lastCheckResponse, setLastCheckResponse] =
    useState<PaymentCheckResponse | null>(null);
  const [checkCount, setCheckCount] = useState(0);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Safe defaults
  const safeBankDetails = bankDetails || {
    bankName: "First Bank of Nigeria",
    accountName: "Account details not provided",
    accountNumber: "Account details not provided",
  };

  const safeInvoiceDetails = invoiceDetails || {
    invoiceId: "INV-001",
    amount: 0,
    currency: "NGN",
    description: "Invoice Payment",
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  const checkPaymentStatus = useCallback(
    async (showMessages = true): Promise<boolean> => {
      if (!payerInfo?.email) {
        if (showMessages) {
          toast({
            title: "Information Required",
            description: "Please provide your email to check payment status.",
            variant: "destructive",
          });
        }
        return false;
      }

      setIsCheckingPayment(true);
      setPaymentStatus("checking");
      setCheckCount((prev) => prev + 1);

      try {
        console.log("🔍 Checking payment with:", {
          invoiceId: safeInvoiceDetails.invoiceId,
          amount: safeInvoiceDetails.amount,
          payerEmail: payerInfo.email,
          checkCount: checkCount + 1,
        });

        const response = await fetch("/api/check-invoice-tranfer-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invoiceId: safeInvoiceDetails.invoiceId,
            amount: safeInvoiceDetails.amount,
            payerEmail: payerInfo.email,
          }),
        });

        console.log("✅ Response status:", response.status);

        const data: PaymentCheckResponse = await response.json();
        console.log("✅ Response data:", data);

        setLastCheckTime(new Date());
        setLastCheckResponse(data);

        if (data.paymentExists) {
          console.log("🎉 Payment found in:", data.foundIn);
          setPaymentStatus("found");
          setIsConfirmed(true);

          if (showMessages) {
            let description =
              "Your payment has been successfully verified and processed.";
            if (data.foundIn) {
              description = `Payment confirmed (found in ${data.foundIn}).`;
            }

            toast({
              title: "🎉 Payment Verified!",
              description,
              duration: 5000,
            });
          }

          // Stop polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }

          return true;
        } else {
          setPaymentStatus("not_found");
          console.log("⚠️ Payment not found, suggestions:", data.suggestions);

          if (showMessages) {
            toast({
              title: "Payment Not Found Yet",
              description:
                data.message ||
                "We haven't detected your payment yet. This is normal if you just completed the transfer.",
              variant: "default",
            });
          }

          return false;
        }
      } catch (error) {
        console.error("❌ Payment check error:", error);
        setPaymentStatus("error");

        if (showMessages) {
          toast({
            title: "Check Failed",
            description:
              "Unable to check payment status. Please try again in a moment.",
            variant: "destructive",
          });
        }

        return false;
      } finally {
        setIsCheckingPayment(false);
      }
    },
    [safeInvoiceDetails, payerInfo?.email, toast, checkCount],
  );

  const startPaymentPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(() => {
      console.log("🔄 Auto-checking payment status...");
      checkPaymentStatus(false);
    }, 30000); // Check every 30 seconds

    console.log("Started payment polling...");
  }, [checkPaymentStatus]);

  const handleConfirmTransfer = useCallback(async () => {
    if (!payerInfo?.email) {
      toast({
        title: "Information Required",
        description:
          "Please provide your email in the payment form before confirming.",
        variant: "destructive",
      });
      return;
    }

    // Start auto-polling when user confirms transfer
    startPaymentPolling();

    // Show initial check
    await checkPaymentStatus(true);

    if (onConfirmTransfer) {
      await onConfirmTransfer(payerInfo);
    }
  }, [
    payerInfo,
    onConfirmTransfer,
    toast,
    checkPaymentStatus,
    startPaymentPolling,
  ]);

  const copyToClipboard = useCallback(
    async (text: string | undefined, fieldName: string) => {
      const copied = await copyToClipboardUtil(text, fieldName, toast);
      if (copied) {
        setCopiedField(copied);
        setTimeout(() => setCopiedField(null), 2000);
      }
    },
    [toast],
  );

  const handleManualCheck = useCallback(async () => {
    await checkPaymentStatus(true);
  }, [checkPaymentStatus]);

  const handleStopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      console.log("⏹️ Stopped payment polling");
      toast({
        title: "Polling Stopped",
        description: "Automatic payment checks have been stopped.",
      });
    }
  }, [toast]);

  const hasValidAccountDetails =
    safeBankDetails?.accountNumber &&
    safeBankDetails.accountNumber !== "Account details not provided" &&
    safeBankDetails.accountNumber !== "";

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2 text-(--color-accent-yellow)">
          Bank Transfer Payment
        </h1>
        <p className="text-muted-foreground">
          Complete your payment via bank transfer
        </p>

        {/* Payment Status Indicator */}
        {paymentStatus === "found" && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-700 font-semibold">
                ✅ Payment Verified Successfully
              </p>
            </div>
            {lastCheckResponse?.foundIn && (
              <p className="text-sm text-green-600 mt-1">
                Found in: {lastCheckResponse.foundIn}
              </p>
            )}
            {lastCheckTime && (
              <p className="text-xs text-green-600 mt-1">
                Last checked: {lastCheckTime.toLocaleTimeString()}
              </p>
            )}
          </div>
        )}

        {isCheckingPayment && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <p className="text-sm text-blue-700">
                Checking payment status...
              </p>
            </div>
            <p className="text-xs text-blue-600 mt-2 text-center">
              Check #{checkCount} • Please wait
            </p>
          </div>
        )}

        {paymentStatus === "error" && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-700 font-semibold">
                ❌ Error Checking Payment
              </p>
            </div>
            {lastCheckResponse?.error && (
              <p className="text-sm text-red-600 mt-1">
                {lastCheckResponse.error}
              </p>
            )}
          </div>
        )}

        {/* Warning if account details are not available */}
        {!hasValidAccountDetails && (
          <div className="mt-4 p-3 bg-green-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              <strong>Note:</strong> Bank account details not specified in this
              invoice. Please contact the invoice sender for payment
              instructions.
            </p>
          </div>
        )}
      </div>

      {/* Amount Card */}
      <div className="bg-card rounded-xl p-6 border border-border mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-muted-foreground text-sm">Amount Due</span>
          {safeInvoiceDetails.dueDate && (
            <span className="text-xs text-(--color-accent-yellow)">
              Due: {safeInvoiceDetails.dueDate}
            </span>
          )}
        </div>
        <div className="text-4xl font-bold text-(--color-accent-yellow) mb-2">
          {formatCurrency(
            safeInvoiceDetails.amount,
            safeInvoiceDetails.currency,
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {safeInvoiceDetails.description}
        </p>
      </div>

      {/* Invoice ID */}
      <div className="bg-(--color-accent-yellow)/10 border-2 border-(--color-accent-yellow) rounded-xl p-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-(--color-accent-yellow)/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-(--color-accent-yellow)" />
          </div>
          <div>
            <p className="text-xs text-(--color-accent-yellow) font-medium uppercase tracking-wide">
              Invoice ID (Add to Narration)
            </p>
            <p className="text-xs text-muted-foreground">
              Include this in your transfer narration for verification
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between bg-background/50 rounded-lg p-4">
          <span className="font-mono text-xl font-bold text-foreground tracking-wider">
            {safeInvoiceDetails.invoiceId}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              copyToClipboard(safeInvoiceDetails.invoiceId, "Invoice ID")
            }
            className="hover:bg-(--color-accent-yellow)/20"
            disabled={!safeInvoiceDetails.invoiceId}
          >
            {copiedField === "Invoice ID" ? (
              <Check className="w-5 h-5 text-(--color-accent-yellow)" />
            ) : (
              <Copy className="w-5 h-5 text-(--color-accent-yellow)" />
            )}
          </Button>
        </div>
      </div>

      {/* Bank Details */}
      {safeBankDetails && (
        <div className="bg-card rounded-xl p-6 border border-border mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-(--color-accent-yellow)">
                Bank Transfer Details
              </h3>
              <p className="text-xs text-muted-foreground">
                Transfer to the account below
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <DetailRow
              label="Bank Name"
              value={safeBankDetails.bankName || ""}
              onCopy={() =>
                copyToClipboard(safeBankDetails.bankName || "", "Bank Name")
              }
              isCopied={copiedField === "Bank Name"}
              isValid={hasValidAccountDetails}
            />
            <DetailRow
              label="Account Name"
              value={safeBankDetails.accountName || ""}
              onCopy={() =>
                copyToClipboard(
                  safeBankDetails.accountName || "",
                  "Account Name",
                )
              }
              isCopied={copiedField === "Account Name"}
              isValid={hasValidAccountDetails}
            />
            <DetailRow
              label="Account Number"
              value={safeBankDetails.accountNumber || ""}
              onCopy={() =>
                copyToClipboard(
                  safeBankDetails.accountNumber || "",
                  "Account Number",
                )
              }
              isCopied={copiedField === "Account Number"}
              highlight
              isValid={hasValidAccountDetails}
            />
          </div>
        </div>
      )}

      {/* Transfer Instructions */}
      <div className="bg-secondary/50 rounded-xl p-5 mb-6">
        <h4 className="font-semibold text-(--color-accent-yellow) mb-3 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-(--color-accent-yellow)" />
          How to Complete Your Transfer
        </h4>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-(--color-accent-yellow) font-semibold">
              1.
            </span>
            Open your banking app or visit your bank
          </li>
          <li className="flex gap-2">
            <span className="text-(--color-accent-yellow) font-semibold">
              2.
            </span>
            Enter the bank details provided above
          </li>
          <li className="flex gap-2">
            <span className="text-(--color-accent-yellow) font-semibold">
              3.
            </span>
            <span>
              Add{" "}
              <strong className="text-(--color-accent-yellow)">
                {safeInvoiceDetails.invoiceId}
              </strong>{" "}
              as the transfer narration/reference
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-(--color-accent-yellow) font-semibold">
              4.
            </span>
            Complete the transfer and click confirm below
          </li>
        </ol>
      </div>

      {/* Manual Check Button */}
      <div className="mb-4">
        <Button
          onClick={handleManualCheck}
          disabled={isCheckingPayment || !payerInfo?.email}
          variant="outline"
          className="w-full border-(--color-accent-yellow) text-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/10"
          size="lg"
        >
          {isCheckingPayment ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5 mr-2" />
              Check Payment Status
            </>
          )}
        </Button>
        {!payerInfo?.email && (
          <p className="text-xs text-red-500 mt-2 text-center">
            Please provide your email in the payment form to check status
          </p>
        )}
      </div>

      {/* Confirm Button */}
      <Button
        onClick={handleConfirmTransfer}
        disabled={isConfirmed || !hasValidAccountDetails || isCheckingPayment}
        className="w-full mb-4 bg-(--color-accent-yellow) hover:bg-[#1e5d42] text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
        size="lg"
      >
        {isConfirmed ? (
          <>
            <Check className="w-5 h-5 mr-2" />
            Payment Verified
          </>
        ) : isCheckingPayment ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Verifying...
          </>
        ) : !hasValidAccountDetails ? (
          "Account Details Required"
        ) : (
          <>
            I've Made the Transfer
            <ArrowRight className="w-5 h-5 ml-2" />
          </>
        )}
      </Button>

      {/* Stop Polling Button (if polling is active) */}
      {pollIntervalRef.current && !isConfirmed && (
        <Button
          onClick={handleStopPolling}
          variant="outline"
          className="w-full mb-4 border-gray-300"
          size="lg"
        >
          <Loader2 className="w-5 h-5 mr-2" />
          Stop Auto-Checking
        </Button>
      )}

      {/* Status Information */}
      {!isConfirmed && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Payment Verification
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>
              • We'll automatically check for your payment after you confirm
            </li>
            <li>• Payments typically verify within 1-5 minutes</li>
            <li>
              • Ensure <strong>{safeInvoiceDetails.invoiceId}</strong> is in the
              narration
            </li>
            <li>• You can manually check status using the button above</li>
            {pollIntervalRef.current && (
              <li>
                • <strong>Auto-checking active</strong> (every 30 seconds)
              </li>
            )}
          </ul>
          {lastCheckTime && (
            <div className="mt-3">
              <p className="text-xs text-blue-600">
                Last checked: {lastCheckTime.toLocaleTimeString()}
              </p>
              {lastCheckResponse?.checkedPlaces && (
                <p className="text-xs text-blue-500 mt-1">
                  Checked: {lastCheckResponse.checkedPlaces.join(", ")}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-(--color-accent-yellow) mt-6">
        <Shield className="w-4 h-4 text-(--color-accent-yellow)" />
        <span>Secured by Zidwell Payment Protection</span>
      </div>
    </div>
  );
}
