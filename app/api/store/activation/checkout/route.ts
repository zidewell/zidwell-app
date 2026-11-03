// app/api/store/activation/checkout/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";
import { STORE_ACTIVATION_CONFIG } from "@/lib/store-activation";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

const BASE_URL =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL || "http://localhost:3000"
    : process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";

export async function POST(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    const unauthorized = NextResponse.json(
      { error: "Please login to activate store", logout: true },
      { status: 401 }
    );
    if (newTokens) return createAuthResponse(await unauthorized.json(), newTokens);
    return unauthorized;
  }

  try {
    // Get user's store
    const { data: store, error: storeError } = await supabase
      .from("online_stores")
      .select("id, owner_id, slug, activation_paid")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (storeError || !store) {
      const err = NextResponse.json(
        { error: "Store not found. Please create a store first." },
        { status: 404 }
      );
      if (newTokens) return createAuthResponse(await err.json(), newTokens);
      return err;
    }

    if (store.activation_paid) {
      const err = NextResponse.json(
        { error: "Store is already activated" },
        { status: 400 }
      );
      if (newTokens) return createAuthResponse(await err.json(), newTokens);
      return err;
    }

    // Check for active promo
    const serverNow = new Date().toISOString();
    let activationFee = STORE_ACTIVATION_CONFIG.ORIGINAL_FEE;
    let promoId: string | null = null;

    const { data: activePromo } = await supabase
      .from("store_activation_promos")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .gt("expires_at", serverNow)
      .maybeSingle();

    if (activePromo) {
      activationFee = activePromo.discounted_fee;
      promoId = activePromo.id;
    }

    // Generate payment reference
    const reference = `ZA-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Create payment record
    const { data: payment, error: insertErr } = await supabase
      .from("zidstore_subscription_payments")
      .insert({
        user_id: user.id,
        plan_tier: "activation",
        billing_period: "monthly",
        amount: activationFee,
        currency: "NGN",
        provider: "paystack",
        reference,
        status: "pending",
        metadata: {
          type: "store_activation",
          store_id: store.id,
          promo_id: promoId,
          original_fee: STORE_ACTIVATION_CONFIG.ORIGINAL_FEE,
          activation_fee: activationFee,
        },
      })
      .select()
      .single();

    if (insertErr || !payment) {
      console.error("[activation checkout] insert failed:", insertErr);
      const err = NextResponse.json(
        { error: "Could not create payment record" },
        { status: 500 }
      );
      if (newTokens) return createAuthResponse(await err.json(), newTokens);
      return err;
    }

    // Initialize Paystack transaction
    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: Math.round(activationFee * 100),
          currency: "NGN",
          reference,
          callback_url: `${BASE_URL}/dashboard/store/activation?status=success`,
          channels: ["card", "bank_transfer"],
          metadata: {
            type: "store_activation",
            user_id: user.id,
            store_id: store.id,
            promo_id: promoId,
            payment_id: payment.id,
          },
        }),
      }
    );

    const paystackJson = await paystackRes.json();

    if (!paystackRes.ok || !paystackJson?.status) {
      console.error("[activation checkout] paystack error:", paystackJson);
      await supabase
        .from("zidstore_subscription_payments")
        .update({
          status: "failed",
          failure_reason: paystackJson?.message || "Init failed",
        })
        .eq("reference", reference);

      const err = NextResponse.json(
        { error: paystackJson?.message || "Paystack initialization failed" },
        { status: 502 }
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
    console.error("[activation checkout] unhandled:", err);
    const errorResponse = NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
    if (newTokens) {
      return createAuthResponse(await errorResponse.json(), newTokens);
    }
    return errorResponse;
  }
}
