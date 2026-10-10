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

async function activateStoreAndClearDraft(payment: {
  id: string;
  user_id: string;
  store_id: string;
}) {
  await supabase
    .from("online_stores")
    .update({ is_active: true, activation_paid: true })
    .eq("id", payment.store_id);

  await supabase
    .from("store_create_drafts")
    .delete()
    .eq("user_id", payment.user_id);
}

export async function GET(req: NextRequest) {
  try {
    const paymentId = req.nextUrl.searchParams.get("payment_id");
    const status = req.nextUrl.searchParams.get("status");

    if (!paymentId) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/services/payment/dashboard?error=missing_payment`
      );
    }

    const { data: payment } = await supabase
      .from("store_activation_payments")
      .select("*")
      .eq("id", paymentId)
      .maybeSingle();

    if (!payment) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/services/payment/dashboard?error=payment_not_found`
      );
    }

    // Already completed — ensure state, then redirect
    if (payment.status === "completed") {
      await activateStoreAndClearDraft(payment);
      return NextResponse.redirect(
        `${baseUrl}/dashboard/services/payment/dashboard?success=store_activated`
      );
    }

    // Fallback: Nomba query param says success → mark completed now
    const normalized = (status || "").toLowerCase();
    const success =
      normalized === "success" ||
      normalized === "successful" ||
      normalized === "completed";

    if (success) {
      await supabase
        .from("store_activation_payments")
        .update({ status: "completed" })
        .eq("id", payment.id)
        .eq("status", "pending");

      await activateStoreAndClearDraft(payment);

      return NextResponse.redirect(
        `${baseUrl}/dashboard/services/payment/dashboard?success=store_activated`
      );
    }

    // Still pending — hand off with processing flag (draft untouched)
    return NextResponse.redirect(
      `${baseUrl}/dashboard/services/payment/dashboard?status=processing&payment_id=${payment.id}`
    );
  } catch (error: any) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/services/payment/dashboard?error=${encodeURIComponent(
        error.message || "callback_failed"
      )}`
    );
  }
}