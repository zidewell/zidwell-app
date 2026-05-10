// app/api/subscription/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processSubscriptionPayment, getAutoLoginUrl } from "../../webhook/services/subscription-service"; 

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
    const status = searchParams.get("status") || searchParams.get("paymentStatus");
    const transactionId = searchParams.get("transactionId") || searchParams.get("transaction_id");

    if (!orderReference) {
      return NextResponse.redirect(
        `${baseUrl}/pricing?payment=error&reason=missing_reference`
      );
    }

    // Find payment
    const { data: payment, error: paymentError } = await supabase
      .from('subscription_payments')
      .select('*')
      .eq('reference', orderReference)
      .maybeSingle();

    if (paymentError || !payment) {
      return NextResponse.redirect(
        `${baseUrl}/pricing?payment=error&reason=not_found`
      );
    }

    // If already completed
    if (payment.status === 'completed') {
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', payment.user_id)
        .single();

      const planTier = payment.metadata?.planTier || '';
      
      if (user?.email) {
        return NextResponse.redirect(getAutoLoginUrl(payment.user_id, user.email, planTier));
      }
      
      return NextResponse.redirect(`${baseUrl}/dashboard?subscription=success&plan=${planTier}`);
    }

    // Process successful payment
    if (status === "successful" || status === "success" || status === "completed") {
      console.log("✅ Subscription payment successful via callback");
      
      const result = await processSubscriptionPayment(
        { data: { order: { metadata: payment.metadata } } },
        {
          nombaTransactionId: transactionId || orderReference,
          orderReference,
        }
      );

      if (result.success) {
        const { data: user } = await supabase
          .from('users')
          .select('email')
          .eq('id', payment.user_id)
          .single();

        if (user?.email) {
          return NextResponse.redirect(getAutoLoginUrl(payment.user_id, user.email, payment.metadata?.planTier || ''));
        }
      }

      return NextResponse.redirect(`${baseUrl}/dashboard?subscription=success`);
    }

    // Handle failure
    if (status === "failed" || status === "error" || status === "cancelled") {
      await supabase
        .from('subscription_payments')
        .update({
          status: 'failed',
          metadata: {
            ...payment.metadata,
            failure_reason: status,
            failure_transaction_id: transactionId,
          },
        })
        .eq('id', payment.id);

      return NextResponse.redirect(`${baseUrl}/pricing?payment=failed&reason=${status}`);
    }

    // Still processing
    return NextResponse.redirect(`${baseUrl}/pricing?payment=processing`);

  } catch (error: any) {
    console.error("Callback error:", error);
    return NextResponse.redirect(`${baseUrl}/pricing?payment=error&reason=exception`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("====== Subscription Callback Received (POST) ======");

    let orderReference = body.orderReference || body.order_reference;
    let status = body.status || body.paymentStatus || body.event_type;
    let transactionId = body.transactionId || body.transaction_id;

    // Handle Nomba format
    if (body.data?.order?.orderReference) {
      orderReference = body.data.order.orderReference;
    }
    if (body.data?.transaction?.transactionId) {
      transactionId = body.data.transaction.transactionId;
    }
    if (body.event_type) {
      status = body.event_type;
    }

    if (!orderReference) {
      return NextResponse.json({ error: "Missing order reference" }, { status: 400 });
    }

    // Find payment
    const { data: payment } = await supabase
      .from('subscription_payments')
      .select('*')
      .eq('reference', orderReference)
      .maybeSingle();

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Check if already processed
    if (payment.status === 'completed') {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    // Process based on status
    const isSuccess = status === "payment_success" || status === "success" || status === "completed";

    if (isSuccess) {
      const result = await processSubscriptionPayment(
        { data: { order: { metadata: payment.metadata } } },
        {
          nombaTransactionId: transactionId || orderReference,
          orderReference,
        }
      );

      return NextResponse.json(result);
    }

    if (status === "failed" || status === "error") {
      await supabase
        .from('subscription_payments')
        .update({
          status: 'failed',
          metadata: { ...payment.metadata, failure_reason: status },
        })
        .eq('id', payment.id);

      return NextResponse.json({ success: false, message: "Payment failed" });
    }

    return NextResponse.json({ success: true, message: "Payment processing" });

  } catch (error: any) {
    console.error("POST callback error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}