// app/api/subscription/callback/route.ts (UPDATED)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processSubscriptionPayment, getAutoLoginUrl  } from "../../webhook/services/subscription-service"; 

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl = process.env.NODE_ENV === "development"
  ? "http://localhost:3000"
  : "https://zidwell.com";

export async function GET(request: NextRequest) {
  try {
    console.log("====== Subscription Callback Received (GET) ======");
    
    const searchParams = request.nextUrl.searchParams;
    const orderReference = searchParams.get("orderReference") || searchParams.get("order_reference");
    const orderId = searchParams.get("orderId");
    const status = searchParams.get("status") || searchParams.get("paymentStatus");
    const transactionId = searchParams.get("transactionId") || searchParams.get("transaction_id");

    console.log("Callback params:", { orderReference, orderId, status, transactionId });

    if (!orderReference) {
      console.error("❌ No orderReference provided");
      return NextResponse.redirect(`${baseUrl}/pricing?payment=error&reason=missing_reference`);
    }

    // First, check if payment exists
    const { data: payment, error: paymentError } = await supabase
      .from('subscription_payments')
      .select('*')
      .eq('reference', orderReference)
      .maybeSingle();

    if (paymentError) {
      console.error("❌ Database error:", paymentError);
      return NextResponse.redirect(`${baseUrl}/pricing?payment=error&reason=database_error`);
    }

    if (!payment) {
      console.error("❌ Payment not found for reference:", orderReference);
      return NextResponse.redirect(`${baseUrl}/pricing?payment=error&reason=not_found`);
    }

    console.log("✅ Found payment:", { id: payment.id, status: payment.status, metadata: payment.metadata });

    // If payment is already completed, redirect to success
    if (payment.status === 'completed') {
      console.log("✅ Payment already completed, redirecting to dashboard");
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', payment.user_id)
        .single();

      const planTier = payment.metadata?.planTier || '';
      
      if (user?.email) {
        const autoLoginUrl = getAutoLoginUrl(payment.user_id, user.email, planTier);
        console.log("🔄 Redirecting to auto-login:", autoLoginUrl);
        return NextResponse.redirect(autoLoginUrl);
      }
      
      return NextResponse.redirect(`${baseUrl}/dashboard?subscription=success&plan=${planTier}`);
    }

    // Check if webhook already processed this payment
    if (payment.nomba_transaction_id) {
      console.log("✅ Payment already processed by webhook, updating status in callback");
      
      // Update payment status if webhook already processed
      const { error: updateError } = await supabase
        .from('subscription_payments')
        .update({ 
          status: 'completed',
          paid_at: new Date().toISOString(),
        })
        .eq('id', payment.id)
        .eq('status', 'pending');

      if (!updateError) {
        // Get user and redirect
        const { data: user } = await supabase
          .from('users')
          .select('email')
          .eq('id', payment.user_id)
          .single();

        if (user?.email) {
          return NextResponse.redirect(getAutoLoginUrl(payment.user_id, user.email, payment.metadata?.planTier || ''));
        }
      }
    }

    // If payment is still pending, wait a bit and check again
    if (payment.status === 'pending') {
      console.log("⏳ Payment still pending, waiting for webhook...");
      
      // Wait up to 10 seconds for webhook to process
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const { data: updatedPayment } = await supabase
          .from('subscription_payments')
          .select('status, nomba_transaction_id')
          .eq('id', payment.id)
          .single();
        
        if (updatedPayment?.status === 'completed') {
          console.log("✅ Payment completed after", attempts + 1, "seconds");
          
          const { data: user } = await supabase
            .from('users')
            .select('email')
            .eq('id', payment.user_id)
            .single();
          
          if (user?.email) {
            return NextResponse.redirect(getAutoLoginUrl(payment.user_id, user.email, payment.metadata?.planTier || ''));
          }
        }
        
        attempts++;
      }
      
      // If still pending after timeout, show processing page
      console.log("⏳ Payment still processing, showing processing page");
      return NextResponse.redirect(`${baseUrl}/pricing?payment=processing&reference=${orderReference}`);
    }

    // If payment failed
    if (payment.status === 'failed') {
      console.log("❌ Payment failed");
      return NextResponse.redirect(`${baseUrl}/pricing?payment=failed`);
    }

    // Default: show processing page
    console.log("🔄 Unknown status, showing processing page");
    return NextResponse.redirect(`${baseUrl}/pricing?payment=processing&reference=${orderReference}`);

  } catch (error: any) {
    console.error("🔥 Callback error:", error);
    return NextResponse.redirect(`${baseUrl}/pricing?payment=error&reason=${encodeURIComponent(error.message)}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("====== Subscription Callback Received (POST) ======");
    console.log("Body:", JSON.stringify(body, null, 2));

    let orderReference = body.orderReference || body.order_reference;
    let status = body.status || body.paymentStatus || body.event_type;
    let transactionId = body.transactionId || body.transaction_id;

    // Handle Nomba's specific format
    if (body.data?.order?.orderReference) {
      orderReference = body.data.order.orderReference;
    }
    if (body.data?.transaction?.transactionId) {
      transactionId = body.data.transaction.transactionId;
    }
    if (body.event_type) {
      status = body.event_type;
    }

    console.log("Extracted:", { orderReference, status, transactionId });

    if (!orderReference) {
      return NextResponse.json({ error: "Missing order reference" }, { status: 400 });
    }

    // Find the payment
    const { data: payment, error: paymentError } = await supabase
      .from('subscription_payments')
      .select('*')
      .eq('reference', orderReference)
      .maybeSingle();

    if (paymentError || !payment) {
      console.error("Payment not found:", orderReference);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Check if already processed
    if (payment.status === 'completed') {
      console.log("Payment already completed");
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    // Handle successful payment
    const isSuccess = status === "payment_success" || status === "success" || status === "completed";

    if (isSuccess) {
      console.log("✅ Payment successful, processing...");
      
      // Call the subscription service to process
      const { processSubscriptionPayment } = await import("../../webhook/services/subscription-service");
      const result = await processSubscriptionPayment(
        { data: { order: { metadata: payment.metadata } } },
        { nombaTransactionId: transactionId || orderReference, orderReference }
      );
      
      console.log("Processing result:", result);
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: true, message: "Payment processing" });

  } catch (error: any) {
    console.error("POST callback error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}