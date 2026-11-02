// app/api/store/activation/apply-promo/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";
import { STORE_ACTIVATION_CONFIG, StoreActivationPromo } from "@/lib/store-activation";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    const unauthorized = NextResponse.json(
      { error: "Please login to apply promo code", logout: true },
      { status: 401 }
    );
    if (newTokens) return createAuthResponse(await unauthorized.json(), newTokens);
    return unauthorized;
  }

  try {
    const body = await req.json();
    const { code } = body as { code?: string };

    const submittedCode = code?.trim().toUpperCase();
    if (!submittedCode) {
      const err = NextResponse.json({ error: "Promo code is required" }, { status: 400 });
      if (newTokens) return createAuthResponse(await err.json(), newTokens);
      return err;
    }

    if (submittedCode !== STORE_ACTIVATION_CONFIG.PROMO_CODE) {
      const err = NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
      if (newTokens) return createAuthResponse(await err.json(), newTokens);
      return err;
    }

    const serverNow = new Date().toISOString();

    // Check if user has any promo history (used or expired) - one promo per user ever
    const { data: anyPromo } = await supabase
      .from("store_activation_promos")
      .select("id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (anyPromo) {
      const err = NextResponse.json(
        { error: "Promo code has already been used. No further discounts available." },
        { status: 400 }
      );
      if (newTokens) return createAuthResponse(await err.json(), newTokens);
      return err;
    }

    // No existing promo - create a new one
    const expiresAt = new Date(Date.now() + STORE_ACTIVATION_CONFIG.DURATION_MINUTES * 60 * 1000).toISOString();

    const { data: newPromo, error } = await supabase
      .from("store_activation_promos")
      .insert({
        user_id: user.id,
        promo_code: submittedCode,
        original_fee: STORE_ACTIVATION_CONFIG.ORIGINAL_FEE,
        discounted_fee: STORE_ACTIVATION_CONFIG.PROMO_FEE,
        status: "active",
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error || !newPromo) {
      // Handle duplicate key error gracefully (race condition)
      if (error?.code === "23505") {
        // Another request already created a promo - fetch it
        const { data: existingPromo } = await supabase
          .from("store_activation_promos")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        if (existingPromo) {
          // Ensure the existing promo has the correct discounted fee
          if (existingPromo.discounted_fee !== STORE_ACTIVATION_CONFIG.PROMO_FEE) {
            await supabase
              .from("store_activation_promos")
              .update({ discounted_fee: STORE_ACTIVATION_CONFIG.PROMO_FEE, updated_at: serverNow })
              .eq("id", existingPromo.id);
            existingPromo.discounted_fee = STORE_ACTIVATION_CONFIG.PROMO_FEE;
          }

          const responseData = {
            promoId: existingPromo.id,
            promoCode: existingPromo.promo_code,
            originalFee: existingPromo.original_fee,
            discountedFee: STORE_ACTIVATION_CONFIG.PROMO_FEE,
            expiresAt: existingPromo.expires_at,
            serverNow,
          };
          if (newTokens) return createAuthResponse(responseData, newTokens);
          return NextResponse.json(responseData);
        }
      }

      console.error("Promo creation failed:", error);
      const err = NextResponse.json({ error: "Failed to create promo" }, { status: 500 });
      if (newTokens) return createAuthResponse(await err.json(), newTokens);
      return err;
    }

    const responseData = {
      promoId: newPromo.id,
      promoCode: newPromo.promo_code,
      originalFee: STORE_ACTIVATION_CONFIG.ORIGINAL_FEE,
      discountedFee: STORE_ACTIVATION_CONFIG.PROMO_FEE,
      expiresAt: newPromo.expires_at,
      serverNow,
    };

    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("[apply-promo] unhandled:", err);
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