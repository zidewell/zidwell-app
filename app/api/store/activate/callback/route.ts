// app/api/store/activate/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const paymentId = searchParams.get("payment_id");
    const status = searchParams.get("status");
    const orderId = searchParams.get("orderId");

    console.log("Store activation callback received:", {
      paymentId,
      status,
      orderId,
    });

    if (!paymentId) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/services/payment/dashboard?error=missing_payment`
      );
    }

    // Fetch the current payment record
    const { data: payment, error: paymentError } = await supabase
      .from("store_activation_payments")
      .select("*")
      .eq("id", paymentId)
      .maybeSingle();

    if (paymentError || !payment) {
      console.error("Payment not found:", paymentError);
      return NextResponse.redirect(
        `${baseUrl}/dashboard/services/payment/dashboard?error=payment_not_found`
      );
    }

    // ✅ Trust the DB — not the query string.
    // The webhook is the source of truth for payment status.
    if (payment.status === "completed") {
      console.log("✅ Payment completed — redirecting with success");
      return NextResponse.redirect(
        `${baseUrl}/dashboard/services/payment/dashboard?success=store_activated`
      );
    }

    // ✅ If the webhook hasn't finished yet, hand off to the dashboard
    // with a "processing" flag. The dashboard can poll for a few seconds.
    console.log(
      "⏳ Payment still pending — webhook likely still in flight. Current status:",
      payment.status
    );

    return NextResponse.redirect(
      `${baseUrl}/dashboard/services/payment/dashboard?status=processing&payment_id=${payment.id}`
    );
  } catch (error: any) {
    console.error("Callback error:", error);
    return NextResponse.redirect(
      `${baseUrl}/dashboard/services/payment/dashboard?error=${encodeURIComponent(
        error.message || "callback_failed"
      )}`
    );
  }
}