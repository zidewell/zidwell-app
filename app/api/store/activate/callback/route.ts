// app/api/store/activate/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { paystackVerify } from "@/lib/paystack";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL || "http://localhost:3000"
    : process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Paystack sends `reference` and `trxref` (same value)
  const reference =
    searchParams.get("reference") || searchParams.get("trxref");
  // Legacy Nomba param — still supported for old in-flight payments
  const paymentId = searchParams.get("payment_id");

  const fail = (msg: string) =>
    NextResponse.redirect(
      `${baseUrl}/dashboard/services/payment/dashboard?error=${encodeURIComponent(
        msg
      )}`
    );

  const success = () =>
    NextResponse.redirect(
      `${baseUrl}/dashboard/services/payment/dashboard?success=store_activated`
    );

  try {
    // ─── Resolve payment row ───
    let payment: any = null;

    if (reference) {
      const { data } = await supabase
        .from("store_activation_payments")
        .select("*")
        .eq("reference", reference)
        .maybeSingle();
      payment = data;
    } else if (paymentId) {
      const { data } = await supabase
        .from("store_activation_payments")
        .select("*")
        .eq("id", paymentId)
        .maybeSingle();
      payment = data;
    }

    if (!payment) return fail("payment_not_found");

    // ─── Already done? ───
    if (payment.status === "completed") {
      return success();
    }

    // ─── Verify with Paystack (or fallback for legacy Nomba reference) ───
    let verified = false;

    if (reference && reference.startsWith("ZA-")) {
      try {
        const tx = await paystackVerify(reference);
        verified = tx.status === "success";
      } catch (e) {
        console.error("[activation callback] verify failed:", e);
      }
    } else {
      // Legacy Nomba payment — trust query params
      const status = (searchParams.get("status") || "").toLowerCase();
      verified =
        status === "success" ||
        status === "successful" ||
        status === "completed";
    }

    if (!verified) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/services/payment/dashboard?status=processing&payment_id=${payment.id}`
      );
    }

    // ─── Finalize (idempotent) ───
    await supabase
      .from("store_activation_payments")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        paid_at: new Date().toISOString(),
      })
      .eq("id", payment.id)
      .eq("status", "pending");

    await supabase
      .from("online_stores")
      .update({
        is_active: true,
        activation_paid: true,
        activated_at: new Date().toISOString(),
      })
      .eq("id", payment.store_id);

    await supabase
      .from("store_create_drafts")
      .delete()
      .eq("user_id", payment.user_id);

    return success();
  } catch (error: any) {
    console.error("[activation callback] unhandled:", error);
    return fail(error.message || "callback_failed");
  }
}
