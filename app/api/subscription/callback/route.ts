// app/api/subscription/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAutoLoginUrl } from "../../webhook/services/subscription-service";

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

    console.log("Callback params:", { orderReference });

    if (!orderReference) {
      return NextResponse.redirect(`${baseUrl}/pricing?payment=error&reason=missing_reference`);
    }

    const { data: payment, error: paymentError } = await supabase
      .from('subscription_payments')
      .select('*')
      .eq('reference', orderReference)
      .maybeSingle();

    if (paymentError || !payment) {
      console.error("❌ Payment not found:", orderReference);
      return NextResponse.redirect(`${baseUrl}/pricing?payment=error&reason=not_found`);
    }

    console.log("✅ Found payment:", { id: payment.id, status: payment.status });

    if (payment.status === 'completed') {
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', payment.user_id)
        .single();

      const planTier = payment.metadata?.planTier || '';
      
      if (user?.email) {
        const autoLoginUrl = getAutoLoginUrl(payment.user_id, user.email, planTier);
        return NextResponse.redirect(autoLoginUrl);
      }
      
      return NextResponse.redirect(`${baseUrl}/dashboard?subscription=success&plan=${planTier}`);
    }

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

    let orderReference = body.orderReference || body.order_reference;
    let transactionId = body.transactionId || body.transaction_id;

    if (body.data?.order?.orderReference) {
      orderReference = body.data.order.orderReference;
    }
    if (body.data?.transaction?.transactionId) {
      transactionId = body.data.transaction.transactionId;
    }

    if (!orderReference) {
      return NextResponse.json({ error: "Missing order reference" }, { status: 400 });
    }

    const { data: payment } = await supabase
      .from('subscription_payments')
      .select('*')
      .eq('reference', orderReference)
      .maybeSingle();

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === 'completed') {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    const { processSubscriptionPayment } = await import("../../webhook/services/subscription-service");
    const result = await processSubscriptionPayment(
      { data: { order: { metadata: payment.metadata } } },
      { nombaTransactionId: transactionId || orderReference, orderReference }
    );

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("POST callback error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}