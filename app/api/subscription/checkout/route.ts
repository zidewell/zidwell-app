// app/api/subscription/checkout/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getNombaToken } from "@/lib/nomba";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl = process.env.NODE_ENV === "development"
  ? "http://localhost:3000"
  : "https://zidwell.com";

const generateOrderReference = (userId: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `SUB_${userId.slice(-8)}_${timestamp}_${random}`;
};

export async function POST(request: Request) {
  try {
    const { planTier, amount, billingPeriod, userEmail, userId } = await request.json();

    const validTiers = ['zidlite', 'growth', 'premium'];
    if (!validTiers.includes(planTier)) {
      return NextResponse.json(
        { success: false, error: "Invalid plan tier" },
        { status: 400 }
      );
    }

    // Verify user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, subscription_tier')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const orderReference = generateOrderReference(userId);

    // Create payment record - FIXED: removed extra comma
    const { data: payment, error: paymentError } = await supabase
      .from('subscription_payments')
      .insert({
        user_id: userId,
        amount: amount,
        payment_method: 'pending',
        status: 'pending',  // ✅ No trailing comma
        reference: orderReference,
        metadata: { planTier, billingPeriod }
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Failed to create payment record:", paymentError);
      return NextResponse.json(
        { success: false, error: "Failed to initialize payment" },
        { status: 500 }
      );
    }

    console.log("✅ Payment record created:", { 
      id: payment.id, 
      reference: orderReference, 
      status: payment.status 
    });

    const accessToken = await getNombaToken();

    if (!accessToken) {
      // Update payment to failed since we can't proceed
      await supabase
        .from('subscription_payments')
        .update({ status: 'failed' })
        .eq('id', payment.id);
      
      return NextResponse.json(
        { success: false, error: "Payment service unavailable" },
        { status: 503 }
      );
    }

    const checkoutPayload = {
  order: {
    callbackUrl: `${baseUrl}/api/subscription/callback`,
    customerEmail: userEmail,
    amount: amount.toString(),
    currency: "NGN",
    orderReference: orderReference,
    customerId: userId,
    accountId: process.env.NOMBA_ACCOUNT_ID,
    allowedPaymentMethods: ["Card", "Transfer"],
    metadata: {
      type: "subscription",
      planTier: planTier,       
      billingPeriod: billingPeriod, 
      userId: userId,           
      paymentId: payment.id,
    },
  },
  tokenizeCard: false,
};

    console.log("🚀 Sending checkout request to Nomba...");

    const response = await fetch(`${process.env.NOMBA_URL}/v1/checkout/order`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accountId: process.env.NOMBA_ACCOUNT_ID!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkoutPayload),
    });

    const data = await response.json();

    if (!response.ok || data.code !== "00") {
      console.error("Nomba checkout error:", data);
      await supabase
        .from('subscription_payments')
        .update({ status: 'failed' })
        .eq('id', payment.id);
      throw new Error(data.description || "Failed to create checkout");
    }

    console.log("✅ Checkout created successfully:", { 
      checkoutLink: data.data.checkoutLink,
      orderReference 
    });

    return NextResponse.json({
      success: true,
      checkoutLink: data.data.checkoutLink,
      orderReference: orderReference,
    });

  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}