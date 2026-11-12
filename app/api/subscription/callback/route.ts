// app/api/subscription/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAutoLoginUrl } from "../../webhook/services/subscription-service";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const baseUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://zidwell.com";

export async function GET(request: NextRequest) {
  try {
    console.log("====== Subscription Callback (Paystack) ======");

    const searchParams = request.nextUrl.searchParams;

    // Paystack sends ?reference=... and ?trxref=...
    const orderReference =
      searchParams.get("reference") ||
      searchParams.get("trxref") ||
      searchParams.get("orderReference") ||
      searchParams.get("order_reference");

    console.log("Callback params:", { orderReference });

    if (!orderReference) {
      return NextResponse.redirect(
        `${baseUrl}/pricing?payment=error&reason=missing_reference`,
      );
    }

    const { data: payment, error: paymentError } = await supabase
      .from("subscription_payments")
      .select("*")
      .eq("reference", orderReference)
      .maybeSingle();

    if (paymentError || !payment) {
      console.error("❌ Payment not found:", orderReference);
      return NextResponse.redirect(
        `${baseUrl}/pricing?payment=error&reason=not_found`,
      );
    }

    console.log("✅ Found payment:", {
      id: payment.id,
      status: payment.status,
    });

    if (payment.status === "completed") {
      const { data: user } = await supabase
        .from("users")
        .select("email")
        .eq("id", payment.user_id)
        .single();

      const planTier =
        payment.metadata?.planTier || payment.plan_tier || "";

      if (user?.email) {
        const autoLoginUrl = getAutoLoginUrl(
          payment.user_id,
          user.email,
          planTier,
        );
        return NextResponse.redirect(autoLoginUrl);
      }

      return NextResponse.redirect(
        `${baseUrl}/dashboard?subscription=success&plan=${planTier}`,
      );
    }

    // Webhook hasn't processed yet — return to pricing with "processing" state.
    // The frontend can poll /api/subscription for the final status.
    return NextResponse.redirect(
      `${baseUrl}/pricing?payment=processing&reference=${encodeURIComponent(
        orderReference,
      )}`,
    );
  } catch (error: any) {
    console.error("🔥 Callback error:", error);
    return NextResponse.redirect(
      `${baseUrl}/pricing?payment=error&reason=${encodeURIComponent(
        error.message,
      )}`,
    );
  }
}

// POST is no longer needed — Paystack uses the webhook route.
export async function POST() {
  return NextResponse.json(
    { error: "Not supported. Use Paystack webhook." },
    { status: 405 },
  );
}