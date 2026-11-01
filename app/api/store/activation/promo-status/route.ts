// app/api/store/activation/promo-status/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    const unauthorized = NextResponse.json(
      { error: "Please login to check promo status", logout: true },
      { status: 401 }
    );
    if (newTokens) return createAuthResponse(await unauthorized.json(), newTokens);
    return unauthorized;
  }

  try {
    const serverNow = new Date().toISOString();

    // Check for used promo
    const { data: usedPromo } = await supabase
      .from("store_activation_promos")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "used")
      .maybeSingle();

    if (usedPromo) {
      return createAuthResponse(
        { active: false, used: true, serverNow },
        newTokens
      );
    }

    // Check for active promo
    const { data: activePromo } = await supabase
      .from("store_activation_promos")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!activePromo) {
      return createAuthResponse(
        { active: false, promo: null, serverNow },
        newTokens
      );
    }

    const expiresAt = new Date(activePromo.expires_at);
    const now = new Date(serverNow);

    if (expiresAt <= now) {
      // Expired - mark it expired
      await supabase
        .from("store_activation_promos")
        .update({ status: "expired", updated_at: serverNow })
        .eq("id", activePromo.id);

      return createAuthResponse(
        { active: false, expired: true, serverNow },
        newTokens
      );
    }

    return createAuthResponse(
      {
        active: true,
        promo: {
          promoId: activePromo.id,
          originalFee: activePromo.original_fee,
          discountedFee: activePromo.discounted_fee,
          expiresAt: activePromo.expires_at,
        },
        serverNow,
      },
      newTokens
    );
  } catch (err: any) {
    console.error("[promo-status] unhandled:", err);
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
