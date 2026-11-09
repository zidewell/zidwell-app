// app/api/subscription/checkout/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const DIGITAL_PAYSTACK_SECRET_KEY = process.env.DIGITAL_PAYSTACK_SECRET_KEY;

if (!DIGITAL_PAYSTACK_SECRET_KEY) {
  console.error(
    "[subscription-checkout] FATAL: DIGITAL_PAYSTACK_SECRET_KEY is not set",
  );
}

const BASE_URL =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL || "http://localhost:3000"
    : process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";

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
  const { user, newTokens } = await isAuthenticatedWithRefresh(request);

  const wrap = async (data: any, status = 200) => {
    if (newTokens) return createAuthResponse(data, newTokens);
    return NextResponse.json(data, { status });
  };

  if (!user) {
    return wrap(
      { success: false, error: "Please log in to subscribe", logout: true },
      401,
    );
  }

  try {
    if (!DIGITAL_PAYSTACK_SECRET_KEY) {
      return wrap(
        {
          success: false,
          error: "Payment service not configured. Please contact support.",
        },
        500,
      );
    }

    const userId = user.id;
    const userEmail = user.email;

    const body = await request.json();
    const { planTier, amount, billingPeriod } = body as {
      planTier: string;
      amount: number;
      billingPeriod: "monthly" | "yearly";
    };

    if (planTier === "starter") {
      return wrap(
        {
          success: false,
          error: "Starter is free — no payment required.",
          code: "FREE_PLAN",
        },
        400,
      );
    }

    if (planTier === "booster") {
      return wrap(
        {
          success: false,
          error: "Booster is a custom plan. Please contact sales@zidwell.com.",
          code: "CUSTOM_QUOTE_ONLY",
        },
        400,
      );
    }

    if (!(VALID_TIERS as readonly string[]).includes(planTier)) {
      console.warn(
        `❌ Invalid plan tier "${planTier}". Expected: ${VALID_TIERS.join(", ")}`,
      );
      return wrap({ success: false, error: "Invalid plan tier" }, 400);
    }

    const paidTier = planTier as PaidTier;

    if (billingPeriod !== "monthly" && billingPeriod !== "yearly") {
      return wrap({ success: false, error: "Invalid billing period" }, 400);
    }

    const expectedAmount =
      billingPeriod === "yearly"
        ? TIER_PRICES[paidTier].yearly
        : TIER_PRICES[paidTier].monthly;

    if (Number(amount) !== expectedAmount) {
      return wrap(
        {
          success: false,
          error: `Amount mismatch. Expected ₦${expectedAmount.toLocaleString()} for ${paidTier} (${billingPeriod}).`,
        },
        400,
      );
    }

    const { data: dbUser, error: userError } = await supabase
      .from("users")
      .select("id, email, subscription_tier")
      .eq("id", userId)
      .single();

    if (userError || !dbUser?.email) {
      console.error("❌ User not found in DB:", userId, userError);
      return wrap(
        { success: false, error: "User not found", logout: true },
        404,
      );
    }

    // Block if user already has an active non-expired paid subscription
    if (
      dbUser.subscription_tier &&
      ["sme", "enterprise"].includes(dbUser.subscription_tier)
    ) {
      const { data: activeSub } = await supabase
        .from("subscriptions")
        .select("tier, expires_at")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (
        activeSub?.expires_at &&
        new Date(activeSub.expires_at) > new Date()
      ) {
        return wrap(
          {
            success: false,
            error: `You already have an active ${activeSub.tier.toUpperCase()} subscription that expires on ${new Date(activeSub.expires_at).toLocaleDateString()}.`,
            code: "ALREADY_SUBSCRIBED",
            current_subscription: {
              plan_tier: activeSub.tier,
              expires_at: activeSub.expires_at,
            },
          },
          400,
        );
      }
    }

    const orderReference = generateOrderReference(userId);

    const { data: payment, error: paymentError } = await supabase
      .from("subscription_payments")
      .insert({
        user_id: userId,
        amount: expectedAmount,
        payment_method: null,
        status: "pending",
        reference: orderReference,
        plan_tier: paidTier,
        billing_period: billingPeriod,
        paid_at: null, // prevent default now()
        metadata: {
          planTier: paidTier,
          billingPeriod,
          userId,
          provider: "paystack",
          initiated_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Failed to create payment record:", paymentError);
      return wrap(
        { success: false, error: "Failed to initialize payment" },
        500,
      );
    }

    const callbackUrl = `${BASE_URL}/api/subscription/callback?reference=${encodeURIComponent(
      orderReference,
    )}`;

    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DIGITAL_PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: dbUser.email || userEmail,
          amount: Math.round(expectedAmount * 100),
          currency: "NGN",
          reference: orderReference,
          callback_url: callbackUrl,
          channels: ["card", "bank_transfer"],
          metadata: {
            type: "platform_subscription",
            userId,
            plan_tier: paidTier,
            billing_period: billingPeriod,
            paymentId: payment.id,
            custom_fields: [
              {
                display_name: "Plan",
                variable_name: "plan",
                value: paidTier.toUpperCase(),
              },
              {
                display_name: "Billing",
                variable_name: "billing",
                value: billingPeriod,
              },
            ],
          },
        }),
      },
    );

    const paystackJson = await paystackRes.json();

    if (!paystackRes.ok || !paystackJson?.status) {
      console.error("Paystack init error:", paystackJson);
      await supabase
        .from("subscription_payments")
        .update({ status: "failed" })
        .eq("id", payment.id);
      return wrap(
        {
          success: false,
          error: paystackJson?.message || "Paystack initialization failed",
        },
        502,
      );
    }

    return wrap({
      success: true,
      checkoutLink: paystackJson.data.authorization_url,
      authorization_url: paystackJson.data.authorization_url,
      access_code: paystackJson.data.access_code,
      orderReference,
    });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return wrap(
      { success: false, error: error.message || "Internal server error" },
      500,
    );
  }
}