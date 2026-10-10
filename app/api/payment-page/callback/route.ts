// app/payment-page-callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl = process.env.NODE_ENV === "development"
  ? "http://localhost:3000"
  : "https://zidwell.com";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("session_id");
    const orderReference = searchParams.get("orderReference") || searchParams.get("order_reference");
    const status = searchParams.get("status") || searchParams.get("paymentStatus");

    console.log(`📞 Payment callback received: sessionId=${sessionId}, orderReference=${orderReference}, status=${status}`);

    if (!sessionId && !orderReference) {
      return NextResponse.redirect(`${baseUrl}/payment-page/status?status=error&message=Missing+reference`);
    }

    // Extract payment ID from session ID
    let paymentId = null;
    if (sessionId) {
      paymentId = sessionId.split('_')[0];
    }

    // Find the payment
    let payment = null;
    let redirectUrl = null;

    if (paymentId) {
      const { data, error } = await supabase
        .from("payment_page_payments")
        .select("*, payment_pages(*)")
        .eq("id", paymentId)
        .maybeSingle();

      if (!error && data) {
        payment = data;
        // ✅ Get redirect URL from payment metadata or page metadata
        redirectUrl = payment.metadata?.redirectUrl || 
                     payment.payment_pages?.metadata?.linkConfig?.redirectUrl ||
                     payment.payment_pages?.metadata?.redirectUrl ||
                     null;
      }
    }

    // If payment not found by ID, try by order reference
    if (!payment && orderReference) {
      const { data, error } = await supabase
        .from("payment_page_payments")
        .select("*, payment_pages(*)")
        .eq("order_reference", orderReference)
        .maybeSingle();

      if (!error && data) {
        payment = data;
        redirectUrl = payment.metadata?.redirectUrl || 
                     payment.payment_pages?.metadata?.linkConfig?.redirectUrl ||
                     payment.payment_pages?.metadata?.redirectUrl ||
                     null;
      }
    }

    // ✅ Determine final redirect URL
    let finalRedirectUrl = redirectUrl;

    // If no redirect URL from metadata, build from page
    if (!finalRedirectUrl && payment) {
      const storeSlug = payment.payment_pages?.metadata?.storeSlug || '';
      const pageSlug = payment.payment_pages?.slug;
      finalRedirectUrl = `/store/${storeSlug}/${pageSlug}`;
    }

    // Default fallback
    if (!finalRedirectUrl) {
      finalRedirectUrl = '/';
    }

    // ✅ Check payment status
    const isSuccess = status === "success" || status === "successful" || status === "completed" || 
                     (payment && payment.status === "completed");

    // ✅ If payment is completed or success, redirect to the final URL
    if (isSuccess) {
      console.log(`✅ Payment successful, redirecting to: ${finalRedirectUrl}`);
      
      // If it's an external URL, redirect directly
      if (finalRedirectUrl.startsWith('http://') || finalRedirectUrl.startsWith('https://')) {
        return NextResponse.redirect(finalRedirectUrl);
      }
      
      // Otherwise, redirect to the internal page with success params
      const successUrl = `${baseUrl}${finalRedirectUrl}?payment=success&reference=${orderReference || payment?.order_reference || ''}`;
      return NextResponse.redirect(successUrl);
    }

    // ❌ Payment failed or processing
    console.log(`⏳ Payment status: ${status || payment?.status || 'unknown'}, redirecting to payment status page`);
    const statusUrl = `${baseUrl}/payment-page/status?reference=${orderReference || payment?.order_reference || ''}&status=${status || payment?.status || 'processing'}`;
    return NextResponse.redirect(statusUrl);

  } catch (error: any) {
    console.error("Callback error:", error);
    return NextResponse.redirect(`${baseUrl}/payment-page/status?status=error&message=${encodeURIComponent(error.message)}`);
  }
}