// app/payment-callback/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<
    "loading" | "success" | "failed" | "pending" | "processing"
  >("loading");
  const [message, setMessage] = useState("");
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [orderReference, setOrderReference] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [redirectionLink, setRedirectionLink] = useState<string | null>("");
  useEffect(() => {
    const statusParam = searchParams.get("status");
    const redirectUrl = searchParams.get("redirectUrl");
    const errorParam = searchParams.get("error");
    const reasonParam = searchParams.get("reason");
    const invoiceIdParam = searchParams.get("invoiceId");
    const orderReferenceParam = searchParams.get("orderReference");
    const paidAmount = searchParams.get("paidAmount");
    const totalAmount = searchParams.get("totalAmount");
    setInvoiceId(invoiceIdParam);
    setOrderReference(orderReferenceParam);
    setRedirectionLink(redirectUrl);

    // Handle status determination
    if (statusParam === "paid" || statusParam === "success") {
      setStatus("success");
      setMessage("Payment completed successfully!");
    } else if (statusParam === "failed" || errorParam) {
      setStatus("failed");
      setMessage(
        reasonParam || errorParam || "Payment failed. Please try again.",
      );
    } else if (statusParam === "pending" || statusParam === "processing") {
      setStatus("processing");
      setMessage("Payment is being processed. This may take a few moments...");

      // Auto-verify pending payments
      if (invoiceIdParam && orderReferenceParam) {
        setTimeout(() => {
          verifyPaymentStatus(invoiceIdParam, orderReferenceParam);
        }, 3000);
      }
    } else {
      setStatus("failed");
      setMessage("Unable to determine payment status.");
    }
  }, [searchParams]);

  const verifyPaymentStatus = async (
    invoiceId: string,
    orderReference: string,
  ) => {
    if (isVerifying) return;

    setIsVerifying(true);

    try {
      const response = await fetch(
        `/api/payments/verify-payment?invoiceId=${invoiceId}&orderReference=${orderReference}`,
      );
      const data = await response.json();

      if (data.success) {
        if (data.paymentStatus === "paid" || data.paymentStatus === "success") {
          setStatus("success");
          setMessage("Payment completed successfully!");
        } else if (data.paymentStatus === "failed") {
          setStatus("failed");
          setMessage("Payment failed. Please try again.");
        } else {
          // Still processing, check again in 5 seconds
          setStatus("processing");
          setMessage("Payment is still being processed...");
          setTimeout(() => {
            verifyPaymentStatus(invoiceId, orderReference);
          }, 5000);
        }
      } else {
        setStatus("failed");
        setMessage(data.error || "Unable to verify payment status.");
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      setStatus("processing");
      setMessage("Still waiting for payment confirmation...");

      // Retry after 5 seconds
      setTimeout(() => {
        verifyPaymentStatus(invoiceId, orderReference);
      }, 5000);
    } finally {
      setIsVerifying(false);
    }
  };

  const retryVerification = () => {
    if (invoiceId && orderReference) {
      verifyPaymentStatus(invoiceId, orderReference);
    }
  };

  const renderContent = () => {
    switch (status) {
      case "success":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-(--color-lemon-green)/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-(--color-lemon-green)"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-(--color-lemon-green) mb-2">
              Payment Successful!
            </h1>
            <p className="text-(--text-secondary) mb-6">
              Your payment has been processed successfully.
            </p>

            <div className="bg-(--color-lemon-green)/10 border border-(--color-lemon-green)/20 rounded-lg p-4 mb-6">
              <p className="text-(--color-lemon-green) text-sm">
                Thank you for your payment. You will receive a confirmation
                email shortly.
              </p>
              {invoiceId && (
                <p className="text-(--color-lemon-green) text-sm mt-2">
                  Invoice: <strong>{invoiceId}</strong>
                </p>
              )}
            </div>

            <div className="space-y-4">
              {redirectionLink && (
                <Link
                  href={redirectionLink as string}
                  className="inline-block ml-4 text-(--color-accent-yellow) hover:text-(--color-accent-yellow)/80 underline"
                >
                  Click here
                </Link>
              )}
            </div>
          </div>
        );

      case "failed":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">
              Payment Failed
            </h1>
            <p className="text-(--text-secondary) mb-6">{message}</p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">
                Please check your payment details and try again. If the problem
                persists, contact support.
              </p>
              {invoiceId && (
                <p className="text-red-700 text-sm mt-2">
                  Invoice: <strong>{invoiceId}</strong>
                </p>
              )}
            </div>

            <div className="space-y-4">
              <button
                onClick={() => window.history.back()}
                className="inline-block bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        );

      case "processing":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <h1 className="text-2xl font-bold text-blue-600 mb-2">
              Processing Payment
            </h1>
            <p className="text-(--text-secondary) mb-4">{message}</p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                We're confirming your payment with our payment processor. This
                usually takes 10-30 seconds.
              </p>
              {invoiceId && (
                <p className="text-blue-700 text-sm mt-2">
                  Invoice: <strong>{invoiceId}</strong>
                </p>
              )}
            </div>

            <div className="space-y-4">
              <button
                onClick={retryVerification}
                disabled={isVerifying}
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isVerifying ? "Checking..." : "Check Status Again"}
              </button>
              <p className="text-sm text-(--text-secondary)">
                Page will update automatically...
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-(--bg-secondary) rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--color-accent-yellow)"></div>
            </div>
            <h1 className="text-2xl font-bold text-(--text-secondary) mb-2">
              Checking Payment Status
            </h1>
            <p className="text-(--text-secondary)">
              Please wait while we verify your payment...
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-(--bg-secondary) flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-(--bg-primary) rounded-lg shadow-soft p-6 border border-(--border-color)">
        {renderContent()}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-(--bg-secondary) flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-(--color-accent-yellow) mx-auto mb-4"></div>
            <p className="text-(--text-secondary)">Loading payment status...</p>
          </div>
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}
