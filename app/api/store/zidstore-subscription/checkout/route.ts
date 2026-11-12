// app/api/store/zidstore-subscription/checkout/route.ts

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
  console.error("[zidstore-checkout] FATAL: DIGITAL_PAYSTACK_SECRET_KEY is not set");
}

const BASE_URL =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL || "http://localhost:3000"
    : process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";

export async function POST(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    const unauthorized = NextResponse.json(
      { error: "Please login to subscribe", logout: true },
      { status: 401 },
    );
    if (newTokens) {
      return createAuthResponse(await unauthorized.json(), newTokens);
    }
    return unauthorized;
  }

  try {
    if (!DIGITAL_PAYSTACK_SECRET_KEY) {
      const err = NextResponse.json(
        { error: "Payment service not configured. Please contact support." },
        { status: 500 },
      );
      if (newTokens) return createAuthResponse(await err.json(), newTokens);
      return err;
    }

    const { data: existingSub } = await supabase
      .from("zidstore_subscriptions")
      .select("id, plan_tier, current_period_end, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (existingSub) {
      const periodEnd = new Date(existingSub.current_period_end);
      if (periodEnd.getTime() > Date.now()) {
        const err = NextResponse.json(
          {
            error: `You already have an active ${existingSub.plan_tier.toUpperCase()} subscription that renews on ${periodEnd.toLocaleDateString()}. You can subscribe again after it expires.`,
            code: "ALREADY_SUBSCRIBED",
            current_subscription: {
              plan_tier: existingSub.plan_tier,
              expires_at: existingSub.current_period_end,
            },
          },
          { status: 400 },
        );
        if (newTokens) return createAuthResponse(await err.json(), newTokens);
        return err;
      }
    }

    const body = await req.json();
    const { planTier, billingPeriod } = body as {
      planTier: string;
      billingPeriod: "monthly" | "yearly";
    };

    if (!planTier || !billingPeriod) {
      const err = NextResponse.json(
        { error: "planTier and billingPeriod are required" },
        { status: 400 },
      );
      if (newTokens) return createAuthResponse(await err.json(), newTokens);
      return err;
    }

    // ─── Free / custom-quote tiers are not payable via this endpoint ───
    if (planTier === "starter") {
      const err = NextResponse.json(
        {
          error: "Starter is free — no payment required.",
          code: "FREE_PLAN",
        },
        { status: 400 },
      );
      if (newTokens) return createAuthResponse(await err.json(), newTokens);
      return err;
    }

    if (planTier === "booster") {
      const err = NextResponse.json(
        {
          error: "Booster is a custom plan. Please contact sales@zidwell.com.",
          code: "CUSTOM_QUOTE_ONLY",
        },
        { status: 400 },
      );
      if (newTokens) return createAuthResponse(await err.json(), newTokens);
      return err;
    }

    const { data: plan, error: planErr } = await supabase
      .from("zidstore_plans")
      .select("*")
      .eq("tier", planTier)
      .eq("is_active", true)
      .maybeSingle();

    if (planErr || !plan) {
      const err = NextResponse.json(
        { error: "Plan not found or inactive" },
        { status: 404 },
      );
      if (newTokens) return createAuthResponse(await err.json(), newTokens);
      return err;
    }

    const amount =
      billingPeriod === "yearly"
        ? Number(plan.amount_yearly)
        : Number(plan.amount_monthly);

    if (amount <= 0) {
      const err = NextResponse.json(
        {
          error: "This plan is free — no payment required",
          code: "FREE_PLAN",
        },
        { status: 400 },
      );
      if (newTokens) return createAuthResponse(await err.json(), newTokens);
      return err;
    }

    const { data: dbUser, error: userErr } = await supabase
      .from("users")
      .select("id, email, full_name")
      .eq("id", user.id)
      .single();

    if (userErr || !dbUser?.email) {
      const err = NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
      if (newTokens) return createAuthResponse(await err.json(), newTokens);
      return err;
    }

    const reference = `ZS-${planTier.toUpperCase()}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;

    const callbackUrl = `${BASE_URL}/online-store?reference=${encodeURIComponent(
      reference,
    )}&from_checkout=1`;

    try {
      const parsed = new URL(callbackUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Invalid callback URL protocol");
      }
    } catch (e) {
      console.error("[zidstore-checkout] Invalid callback URL:", callbackUrl);
      const err = NextResponse.json(
        { error: "Server misconfiguration: invalid callback URL" },
        { status: 500 },
      );
      if (newTokens) return createAuthResponse(await err.json(), newTokens);
      return err;
    }

    const { error: insertErr } = await supabase
      .from("zidstore_subscription_payments")
      .insert({
        user_id: dbUser.id,
        plan_tier: planTier,
        billing_period: billingPeriod,
        amount,
        currency: "NGN",
        provider: "paystack",
        reference,
        status: "pending",
      });

    if (insertErr) {
      console.error("[zidstore checkout] insert failed:", insertErr);
      const err = NextResponse.json(
        { error: "Could not create payment record" },
        { status: 500 },
      );
      if (newTokens) return createAuthResponse(await err.json(), newTokens);
      return err;
    }

    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DIGITAL_PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: dbUser.email,
          amount: Math.round(amount * 100),
          currency: "NGN",
          reference,
          callback_url: callbackUrl,
          channels: ["card", "bank_transfer"],
          metadata: {
            type: "zidstore_subscription",
            user_id: dbUser.id,
            plan_tier: planTier,
            billing_period: billingPeriod,
            custom_fields: [
              {
                display_name: "Plan",
                variable_name: "plan",
                value: plan.name,
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
      console.error("[zidstore checkout] paystack error:", paystackJson);
      await supabase
        .from("zidstore_subscription_payments")
        .update({
          status: "failed",
          failure_reason: paystackJson?.message || "Init failed",
        })
        .eq("reference", reference);
      const err = NextResponse.json(
        { error: paystackJson?.message || "Paystack initialization failed" },
        { status: 502 },
      );
      if (newTokens) return createAuthResponse(await err.json(), newTokens);
      return err;
    }

    await supabase
      .from("zidstore_subscription_payments")
      .update({ authorization_url: paystackJson.data.authorization_url })
      .eq("reference", reference);

    const responseData = {
      success: true,
      reference,
      authorization_url: paystackJson.data.authorization_url,
      access_code: paystackJson.data.access_code,
    };

    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("[zidstore checkout] unhandled:", err);
    const errorResponse = NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 },
    );
    if (newTokens) {
      return createAuthResponse(await errorResponse.json(), newTokens);
    }
    return errorResponse;
  }
}