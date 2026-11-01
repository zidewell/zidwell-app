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

    // Check if user has already used a promo (permanent block)
    const { data: usedPromo } = await supabase
      .from("store_activation_promos")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "used")
      .maybeSingle();

    if (usedPromo) {
      const err = NextResponse.json(
        { error: "You have already used an activation promo code" },
        { status: 400 }
      );
      if (newTokens) return createAuthResponse(await err.json(), newTokens);
      return err;
    }

    // Check for existing active promo
    const { data: activePromo } = await supabase
      .from("store_activation_promos")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (activePromo) {
      const expiresAt = new Date(activePromo.expires_at);
      const now = new Date(serverNow);

      if (expiresAt > now) {
        // Return existing active promo without resetting timer
        return createAuthResponse(
          {
            promoId: activePromo.id,
            originalFee: activePromo.original_fee,
            discountedFee: activePromo.discounted_fee,
            expiresAt: activePromo.expires_at,
            serverNow,
          },
          newTokens
        );
      } else {
        // Expired - mark it expired and fall through to create new one
        await supabase
          .from("store_activation_promos")
          .update({ status: "expired", updated_at: serverNow })
          .eq("id", activePromo.id);
      }
    }

    // Create new active promo
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
      console.error("Promo creation failed:", error);
      const err = NextResponse.json({ error: "Failed to create promo" }, { status: 500 });
      if (newTokens) return createAuthResponse(await err.json(), newTokens);
      return err;
    }

    const responseData = {
      promoId: newPromo.id,
      originalFee: newPromo.original_fee,
      discountedFee: newPromo.discounted_fee,
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
