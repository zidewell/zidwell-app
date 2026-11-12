// app/api/payment-page/status/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { paystackVerify } from "@/lib/paystack";
import { processPaymentPageFromPaystack } from "../../paystack/webhook/services/payment-page.service"


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json({ error: "reference required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const fetchPayment = async () => {
    const { data } = await supabase
      .from("payment_page_payments")
      .select("*")
      .eq("order_reference", reference)
      .maybeSingle();
    return data;
  };

  let payment = await fetchPayment();
  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // Verify with Paystack if still pending and >30s old
  if (payment.status === "pending") {
    const age = Date.now() - new Date(payment.created_at).getTime();
    if (age > 30_000) {
      try {
        const tx = await paystackVerify(reference);
        if (tx.status === "success") {
          const syntheticPayload = {
            event: "charge.success",
            data: {
              id: tx.transactionId,
              reference: tx.reference,
              amount: tx.amount,
              currency: tx.currency,
              status: "success",
              paid_at: tx.paid_at,
              channel: tx.channel,
              fees: tx.fees,
              customer: tx.customer,
              metadata: tx.metadata || {},
              gateway_response: tx.gateway_response,
            },
          };
          await processPaymentPageFromPaystack(syntheticPayload);
          payment = await fetchPayment();
        }
      } catch (err) {
        console.error("[status] verify failed:", err);
      }
    }
  }

  const meta = (payment?.metadata as Record<string, any>) || {};

  return NextResponse.json({
    payment: {
      status: payment?.status || "pending",
      amount: payment?.amount,
      redirectUrl: meta.redirectUrl || null,
      metadata: meta,
    },
  });
}
