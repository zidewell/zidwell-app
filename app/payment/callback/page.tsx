// app/payment/callback/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "redirecting">("loading");
  const [message, setMessage] = useState("");
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [orderReference, setOrderReference] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const orderRef = searchParams.get("orderReference");
    const statusParam = searchParams.get("status");
    const orderId = searchParams.get("orderId");

    console.log("📞 Payment callback received:");
    console.log("  sessionId:", sessionId);
    console.log("  orderReference:", orderRef);
    console.log("  statusParam:", statusParam);
    console.log("  orderId:", orderId);

    setOrderReference(orderRef);

    // Extract payment ID from session ID
    let paymentId = null;
    if (sessionId) {
      paymentId = sessionId.split('_')[0];
    }

    if (!paymentId && !orderRef) {
      setStatus("failed");
      setMessage("Missing payment reference.");
      return;
    }

    // Check payment status
    const checkPayment = async () => {
      try {
        let query = supabase
          .from("payment_page_payments")
          .select("*, payment_pages(*)");

        if (paymentId) {
          query = query.eq("id", paymentId);
        } else if (orderRef) {
          query = query.eq("order_reference", orderRef);
        }

        const { data: payment, error } = await query.maybeSingle();

        if (error) {
          console.error("❌ Error fetching payment:", error);
          setStatus("failed");
          setMessage("Error verifying payment.");
          return;
        }

        if (!payment) {
          console.log("❌ Payment not found");
          setStatus("failed");
          setMessage("Payment not found. Please check your reference.");
          return;
        }

        console.log("📊 Payment found:", {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          customer: payment.customer_name,
        });

        // ✅ Check if payment is completed
        if (payment.status === "completed") {
          setStatus("success");
          setMessage("Payment completed successfully!");

          // Get redirect URL from payment metadata or page metadata
          const page = payment.payment_pages;
          const redirectUrlFromMetadata = payment.metadata?.redirectUrl || 
                                         page?.metadata?.linkConfig?.redirectUrl ||
                                         page?.metadata?.redirectUrl ||
                                         null;

          let finalRedirectUrl = redirectUrlFromMetadata;
          
          if (!finalRedirectUrl && page) {
            const storeSlug = page?.metadata?.storeSlug || '';
            const pageSlug = page?.slug;
            finalRedirectUrl = `/store/${storeSlug}/${pageSlug}`;
          }

          if (!finalRedirectUrl) {
            finalRedirectUrl = '/';
          }

          setRedirectUrl(finalRedirectUrl);

          // ✅ Auto-redirect after 3 seconds
          setTimeout(() => {
            console.log(`🔄 Redirecting to: ${finalRedirectUrl}`);
            router.push(finalRedirectUrl);
          }, 3000);

          return;
        }

        // ❌ Payment failed
        if (payment.status === "failed") {
          setStatus("failed");
          setMessage("Payment failed. Please try again.");
          return;
        }

        // ⏳ Payment still pending - poll for updates
        setStatus("loading");
        setMessage("Payment is being processed...");

        // Poll for status updates
        let attempts = 0;
        const maxAttempts = 10;
        const pollInterval = setInterval(async () => {
          attempts++;

          const { data: updatedPayment, error: pollError } = await supabase
            .from("payment_page_payments")
            .select("*, payment_pages(*)")
            .eq("id", payment.id)
            .maybeSingle();

          if (pollError) {
            console.error("❌ Polling error:", pollError);
            return;
          }

          if (updatedPayment?.status === "completed") {
            clearInterval(pollInterval);
            setStatus("success");
            setMessage("Payment completed successfully!");
            
            // Get redirect URL
            const page = updatedPayment.payment_pages;
            const redirectUrlFromMetadata = updatedPayment.metadata?.redirectUrl || 
                                           page?.metadata?.linkConfig?.redirectUrl ||
                                           page?.metadata?.redirectUrl ||
                                           null;
            let finalRedirectUrl = redirectUrlFromMetadata;
            
            if (!finalRedirectUrl && page) {
              const storeSlug = page?.metadata?.storeSlug || '';
              const pageSlug = page?.slug;
              finalRedirectUrl = `/store/${storeSlug}/${pageSlug}`;
            }
            
            if (!finalRedirectUrl) {
              finalRedirectUrl = '/';
            }
            
            setRedirectUrl(finalRedirectUrl);
            
            setTimeout(() => {
              console.log(`🔄 Redirecting to: ${finalRedirectUrl}`);
              router.push(finalRedirectUrl);
            }, 3000);
            
            return;
          }

          if (updatedPayment?.status === "failed") {
            clearInterval(pollInterval);
            setStatus("failed");
            setMessage("Payment failed. Please try again.");
            return;
          }

          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setStatus("failed");
            setMessage("Payment verification timed out. Please check your email for confirmation.");
          }
        }, 3000);

        return () => clearInterval(pollInterval);

      } catch (error: any) {
        console.error("❌ Callback error:", error);
        setStatus("failed");
        setMessage(error.message || "An error occurred.");
      }
    };

    checkPayment();
  }, [searchParams, router]);

  // Render based on status
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[var(--bg-primary)] rounded-lg shadow-soft p-8 border border-[var(--border-color)] text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-yellow)] mx-auto mb-4"></div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">Verifying Payment</h1>
          <p className="text-[var(--text-secondary)]">{message || "Please wait while we confirm your payment..."}</p>
          {orderReference && (
            <p className="text-xs text-[var(--text-secondary)] mt-4">Reference: {orderReference}</p>
          )}
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[var(--bg-primary)] rounded-lg shadow-soft p-8 border border-[var(--border-color)] text-center">
          <div className="w-16 h-16 bg-[var(--color-lemon-green)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--color-lemon-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-lemon-green)] mb-2">Payment Successful!</h1>
          <p className="text-[var(--text-secondary)] mb-4">{message}</p>
          
          <div className="bg-[var(--color-lemon-green)]/10 border border-[var(--color-lemon-green)]/20 rounded-lg p-4 mb-6">
            <p className="text-[var(--text-secondary)] text-sm">Thank you for your payment. A receipt has been sent to your email.</p>
            {orderReference && (
              <p className="text-[var(--text-secondary)] text-sm mt-2">Reference: <strong>{orderReference}</strong></p>
            )}
          </div>

          <div className="text-sm text-[var(--text-secondary)]">
            Redirecting{redirectUrl ? ` to ${redirectUrl}` : ''}...
          </div>
        </div>
      </div>
    );
  }

  // Failed status
  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[var(--bg-primary)] rounded-lg shadow-soft p-8 border border-[var(--border-color)] text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h1>
        <p className="text-[var(--text-secondary)] mb-4">{message || "Unable to process your payment."}</p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">Please check your payment details and try again. If the problem persists, contact support.</p>
          {orderReference && (
            <p className="text-red-700 text-sm mt-2">Reference: <strong>{orderReference}</strong></p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="w-full bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
          <Link href="/" className="block text-sm text-[var(--text-secondary)] hover:text-[var(--color-accent-yellow)]">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-yellow)] mx-auto mb-4"></div>
            <p className="text-[var(--text-secondary)]">Loading payment status...</p>
          </div>
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}