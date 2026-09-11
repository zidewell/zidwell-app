// app/api/store/activate/checkout/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getNombaToken } from "@/lib/nomba";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl = process.env.NODE_ENV === "development"
  ? "http://localhost:3000"
  : "https://zidwell.com";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const paymentId = searchParams.get("payment_id");

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from("store_activation_payments")
      .select("*, store:store_id(*), user:user_id(*)")
      .eq("id", paymentId)
      .eq("status", "pending")
      .single();

    if (paymentError || !payment) {
      console.error("Payment not found:", paymentError);
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Get Nomba token
    const accessToken = await getNombaToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: "Payment service unavailable" },
        { status: 503 }
      );
    }

    const orderReference = `ACT-${payment.id}-${Date.now()}`;

    // Create checkout
    const checkoutPayload = {
      order: {
        callbackUrl: `${baseUrl}/api/store/activate/callback?payment_id=${payment.id}`,
        customerEmail: payment.user?.email || "customer@example.com",
        amount: payment.amount.toString(),
        currency: "NGN",
        orderReference: orderReference,
        customerId: payment.user_id,
        accountId: process.env.NOMBA_ACCOUNT_ID,
        allowedPaymentMethods: ["Card", "Bank Transfer"],
        metadata: {
          type: "store_activation",
          paymentId: payment.id,
          storeId: payment.store_id,
        },
      },
      tokenizeCard: false,
    };


    

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
      console.error("Checkout creation failed:", data);
      return NextResponse.json(
        { error: data.description || "Failed to create checkout" },
        { status: 500 }
      );
    }

    console.log("Nomba debug:", {
  env: process.env.NODE_ENV,
  nombaUrl: process.env.NOMBA_URL,
  accountId: process.env.NOMBA_ACCOUNT_ID,
  customerEmail: checkoutPayload.order.customerEmail,
  amount: checkoutPayload.order.amount,
  allowedMethods: checkoutPayload.order.allowedPaymentMethods,
  tokenPrefix: accessToken.slice(0, 15),
});

    // Update payment with order reference
    await supabase
      .from("store_activation_payments")
      .update({ order_reference: orderReference })
      .eq("id", payment.id);

    return NextResponse.redirect(data.data.checkoutLink);
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}