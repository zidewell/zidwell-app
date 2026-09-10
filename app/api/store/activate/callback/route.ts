// app/api/store/activate/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl = process.env.NODE_ENV === "development"
  ? "http://localhost:3000"
  : process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const paymentId = searchParams.get("payment_id");
    const status = searchParams.get("status");
    const orderId = searchParams.get("orderId");

    console.log("Store activation callback received:", { paymentId, status, orderId });

    if (!paymentId) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/services/payment/dashboard?error=missing_payment`
      );
    }

    // Check if payment is already completed
    const { data: payment, error: paymentError } = await supabase
      .from("store_activation_payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      console.error("Payment not found:", paymentError);
      return NextResponse.redirect(
        `${baseUrl}/dashboard/services/payment/dashboard?error=payment_not_found`
      );
    }

    // If already completed, redirect to dashboard
    if (payment.status === "completed") {
      console.log("Payment already completed");
      return NextResponse.redirect(
        `${baseUrl}/dashboard/services/payment/dashboard?success=store_activated`
      );
    }

    // If status is success from Nomba
    if (status === "success" || status === "completed") {
      console.log("Payment successful, activating store...");

      // Activate store
      await supabase
        .from("online_stores")
        .update({
          is_active: true,
          activation_paid: true,
          activated_at: new Date().toISOString(),
          activation_reference: payment.reference,
        })
        .eq("id", payment.store_id);

      // Update payment
      await supabase
        .from("store_activation_payments")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          paid_at: new Date().toISOString(),
          ...(orderId && { order_reference: orderId }),
        })
        .eq("id", payment.id);

      // Create wallet
      const { data: existingWallet } = await supabase
        .from("store_owner_wallets")
        .select("id")
        .eq("user_id", payment.user_id)
        .maybeSingle();

      if (!existingWallet) {
        await supabase
          .from("store_owner_wallets")
          .insert({
            user_id: payment.user_id,
            store_id: payment.store_id,
            available_balance: 0,
            pending_balance: 0,
            total_earned: 0,
            total_withdrawn: 0,
            last_activity_at: new Date().toISOString(),
          });
      }

      return NextResponse.redirect(
        `${baseUrl}/dashboard/services/payment/dashboard?success=store_activated`
      );
    }

    // Still pending - redirect with pending status
    return NextResponse.redirect(
      `${baseUrl}/dashboard/services/payment/dashboard?status=pending`
    );
  } catch (error: any) {
    console.error("Callback error:", error);
    return NextResponse.redirect(
      `${baseUrl}/dashboard/services/payment/dashboard?error=${encodeURIComponent(error.message)}`
    );
  }
}