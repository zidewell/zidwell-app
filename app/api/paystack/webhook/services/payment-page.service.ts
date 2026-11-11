// app/api/paystack/webhook/services/payment-page.service.ts

import { createClient } from "@supabase/supabase-js";
import { processCardPaymentWebhook } from "@/app/api/webhook/services/card-payment.service";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function processPaymentPageFromPaystack(
  payload: any
): Promise<
  | { success: true; message: string; payment_id: string }
  | { error: string; status?: number }
> {
  const d = payload?.data;
  if (!d) return { error: "Missing data in payload", status: 400 };

  const orderReference = d.reference;
  if (!orderReference) {
    return { error: "Missing reference in payload", status: 400 };
  }

  const paystackTransactionId = String(d.id);
  const amountNaira = Number(d.amount) / 100;

  const { data: payment, error: paymentError } = await supabase
    .from("payment_page_payments")
    .select("*, payment_pages(*)")
    .eq("order_reference", orderReference)
    .eq("status", "pending")
    .maybeSingle();

  if (paymentError) {
    console.error("[paystack webhook] payment lookup failed:", paymentError);
    return { error: "Payment lookup failed", status: 500 };
  }

  if (!payment) {
    const { data: alreadyPaid } = await supabase
      .from("payment_page_payments")
      .select("id")
      .eq("order_reference", orderReference)
      .eq("status", "completed")
      .maybeSingle();

    if (alreadyPaid) {
      return {
        success: true,
        message: "Already processed",
        payment_id: alreadyPaid.id,
      };
    }

    return { error: "Payment not found", status: 404 };
  }

  if (Math.abs(Number(payment.amount) - amountNaira) > 0.01) {
    console.error("[paystack webhook] amount mismatch", {
      orderReference,
      expected: Number(payment.amount),
      received: amountNaira,
    });
    return { error: "Amount mismatch — refusing to credit", status: 400 };
  }

  payment.payment_method = "card_payment";

  return processCardPaymentWebhook(payload, {
    nombaTransactionId: paystackTransactionId,
    orderReference,
    payment,
  });
}
