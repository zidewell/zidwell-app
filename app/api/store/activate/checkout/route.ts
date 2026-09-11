// app/api/store/activate/checkout/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getNombaToken } from "@/lib/nomba";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl =
  process.env.NODE_ENV === "development"
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

    // Make sure user email exists
    if (!payment.user?.email) {
      return NextResponse.json(
        { error: "User email required for payment" },
        { status: 400 }
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

    // Generate order reference
    const orderReference = `ACT-${payment.id}-${Date.now()}`;

    // Nomba checkout payload
    const checkoutPayload = {
      order: {
        callbackUrl: `${baseUrl}/api/store/activate/callback?payment_id=${payment.id}`,

        customerEmail: payment.user.email,

        amount: payment.amount.toString(),

        currency: "NGN",

        orderReference,

        customerId: payment.user_id,

        accountId: process.env.NOMBA_ACCOUNT_ID,

        // Allow both Card and Transfer
        allowedPaymentMethods: ["Card", "Transfer"],

        metadata: {
          type: "store_activation",
          paymentId: payment.id,
          storeId: payment.store_id,
          userId: payment.user_id,
        },
      },

      tokenizeCard: false,
    };

    console.log(
      "📤 Nomba checkout payload:",
      JSON.stringify(checkoutPayload, null, 2)
    );

    const response = await fetch(
      `${process.env.NOMBA_URL}/v1/checkout/order`,
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${accessToken}`,
          accountId: process.env.NOMBA_ACCOUNT_ID!,
          "Content-Type": "application/json",
        },

        body: JSON.stringify(checkoutPayload),
      }
    );

    const data = await response.json();

    console.log("📥 Nomba response:", JSON.stringify(data, null, 2));

    if (!response.ok || data.code !== "00") {
      console.error("❌ Checkout creation failed:", data);

      return NextResponse.json(
        {
          error:
            data.description ||
            data.message ||
            "Failed to create checkout",
        },
        { status: 500 }
      );
    }

    // Save order reference
    const { error: updateError } = await supabase
      .from("store_activation_payments")
      .update({
        order_reference: orderReference,
      })
      .eq("id", payment.id);

    if (updateError) {
      console.error(
        "Failed to save order reference:",
        updateError
      );
    }

    console.log("✅ Checkout created:", {
      paymentId: payment.id,
      orderReference,
      checkoutLink: data.data.checkoutLink,
    });

    return NextResponse.redirect(data.data.checkoutLink);
  } catch (error: any) {
    console.error("❌ Checkout error:", error);

    return NextResponse.json(
      {
        error:
          error.message ||
          "Internal server error",
      },
      { status: 500 }
    );
  }
}