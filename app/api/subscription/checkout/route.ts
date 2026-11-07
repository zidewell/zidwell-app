// app/api/subscription/checkout/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getNombaToken } from "@/lib/nomba";
import { isAuthenticatedWithRefresh } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const baseUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://zidwell.com";

const generateOrderReference = (userId: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `SUB_${userId.slice(-8)}_${timestamp}_${random}`;
};

// Paid tiers only. Starter is free, Booster is custom-quote.
const VALID_TIERS = ["sme", "enterprise"] as const;
type PaidTier = (typeof VALID_TIERS)[number];

const TIER_PRICES: Record<PaidTier, { monthly: number; yearly: number }> = {
  sme: { monthly: 9900, yearly: 49900 },
  enterprise: { monthly: 19900, yearly: 99900 },
};

export async function POST(request: NextRequest) {
  try {
    const { user, newTokens } = await isAuthenticatedWithRefresh(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Please log in to subscribe", logout: true },
        { status: 401 },
      );
    }

    const userId = user.id;
    const userEmail = user.email;

    const body = await request.json();
    const { planTier, amount, billingPeriod } = body;

    if (planTier === "starter") {
      return NextResponse.json(
        {
          success: false,
          error: "Starter is free — no payment required.",
          code: "FREE_PLAN",
        },
        { status: 400 },
      );
    }

    if (planTier === "booster") {
      return NextResponse.json(
        {
          success: false,
          error: "Booster is a custom plan. Please contact sales@zidwell.com.",
          code: "CUSTOM_QUOTE_ONLY",
        },
        { status: 400 },
      );
    }

    if (!(VALID_TIERS as readonly string[]).includes(planTier)) {
      console.warn(
        `❌ Invalid plan tier "${planTier}". Expected: ${VALID_TIERS.join(", ")}`,
      );
      return NextResponse.json(
        { success: false, error: "Invalid plan tier" },
        { status: 400 },
      );
    }

    const paidTier = planTier as PaidTier;

    if (billingPeriod !== "monthly" && billingPeriod !== "yearly") {
      return NextResponse.json(
        { success: false, error: "Invalid billing period" },
        { status: 400 },
      );
    }

    const expectedAmount =
      billingPeriod === "yearly"
        ? TIER_PRICES[paidTier].yearly
        : TIER_PRICES[paidTier].monthly;

    if (Number(amount) !== expectedAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Amount mismatch. Expected ₦${expectedAmount.toLocaleString()} for ${paidTier} (${billingPeriod}).`,
        },
        { status: 400 },
      );
    }

    const { data: dbUser, error: userError } = await supabase
      .from("users")
      .select("id, email, subscription_tier")
      .eq("id", userId)
      .single();

    if (userError || !dbUser) {
      console.error("❌ User not found in DB:", userId, userError);
      return NextResponse.json(
        { success: false, error: "User not found", logout: true },
        { status: 404 },
      );
    }

    const orderReference = generateOrderReference(userId);

    const { data: payment, error: paymentError } = await supabase
      .from("subscription_payments")
      .insert({
        user_id: userId,
        amount: expectedAmount,
        payment_method: "pending",
        status: "pending",
        reference: orderReference,
        plan_tier: paidTier,
        billing_period: billingPeriod,
        metadata: { planTier: paidTier, billingPeriod, userId },
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Failed to create payment record:", paymentError);
      return NextResponse.json(
        { success: false, error: "Failed to initialize payment" },
        { status: 500 },
      );
    }

    const accessToken = await getNombaToken();

    if (!accessToken) {
      await supabase
        .from("subscription_payments")
        .update({ status: "failed" })
        .eq("id", payment.id);

      return NextResponse.json(
        { success: false, error: "Payment service unavailable" },
        { status: 503 },
      );
    }

    const checkoutPayload = {
      order: {
        callbackUrl: `${baseUrl}/api/subscription/callback`,
        customerEmail: dbUser.email || userEmail,
        amount: expectedAmount.toString(),
        currency: "NGN",
        orderReference,
        customerId: userId,
        accountId: process.env.NOMBA_ACCOUNT_ID,
        allowedPaymentMethods: ["Card", "Transfer"],
        planTier: paidTier,
        billingPeriod,
        userId,
        type: "subscription",
        metadata: {
          planTier: paidTier,
          billingPeriod,
          userId,
          type: "subscription",
          paymentId: payment.id,
        },
      },
      tokenizeCard: false,
    };

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
      },
    );

    const data = await response.json();

    if (!response.ok || data.code !== "00") {
      console.error("Nomba error:", data);
      await supabase
        .from("subscription_payments")
        .update({ status: "failed" })
        .eq("id", payment.id);
      throw new Error(data.description || "Failed to create checkout");
    }

    return NextResponse.json({
      success: true,
      checkoutLink: data.data.checkoutLink,
      orderReference,
    });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}