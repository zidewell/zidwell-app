// app/api/paystack/webhook/services/store-activation.service.ts

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function processStoreActivationFromPaystack(payload: any) {
  const data = payload?.data || {};
  const metadata = data.metadata || {};
  const reference = data.reference;

  if (!reference) {
    return { error: "Missing reference", status: 400 };
  }

  console.log("[store-activation webhook] processing reference:", reference);

  // Find payment record in store_activation_payments
  const { data: payment, error: paymentError } = await supabase
    .from("store_activation_payments")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();

  if (paymentError || !payment) {
    console.error("[store-activation webhook] payment not found:", paymentError);
    return { error: "Payment not found", status: 404 };
  }

  // Idempotency check - check for "completed" status (Nomba/Paystack both use completed)
  if (payment.status === "completed") {
    console.log("[store-activation webhook] already processed, skipping");
    return { success: true, message: "Already processed" };
  }

  const storeId = metadata.store_id;
  const now = new Date().toISOString();

  if (!storeId) {
    return { error: "Missing store_id in metadata", status: 400 };
  }

  // Update payment record - use "completed" status to match Nomba flow
  const { error: updateError } = await supabase
    .from("store_activation_payments")
    .update({
      status: "completed",
      paid_at: now,
      completed_at: now,
      nomba_transaction_id: data.id, // Reuse this column for Paystack transaction ID
      updated_at: now,
    })
    .eq("reference", reference);

  if (updateError) {
    console.error("[store-activation webhook] failed to update payment:", updateError);
    return { error: "Failed to update payment", status: 500 };
  }

  // Mark promo as used if applicable
  // Extract promo_id from order_reference (stored as PROMO_<promoId>)
  let promoId = metadata.promo_id;
  if (!promoId && payment.order_reference?.startsWith("PROMO_")) {
    promoId = payment.order_reference.replace("PROMO_", "");
  }

  if (promoId) {
    const { error: promoError } = await supabase
      .from("store_activation_promos")
      .update({
        status: "used",
        used_at: now,
        payment_id: payment.id,
        updated_at: now,
      })
      .eq("id", promoId);

    if (promoError) {
      console.error("[store-activation webhook] failed to mark promo used:", promoError);
    }
  }

  // Activate store
  const { data: store, error: storeError } = await supabase
    .from("online_stores")
    .update({
      activation_paid: true,
      is_active: true,
      activated_at: now,
      activation_reference: `ACT_${data.id}`,
      updated_at: now,
    })
    .eq("id", storeId)
    .select()
    .single();

  if (storeError || !store) {
    console.error("[store-activation webhook] failed to activate store:", storeError);
    return { error: "Failed to activate store", status: 500 };
  }

  console.log("[store-activation webhook] success:", {
    storeId: store.id,
    storeSlug: store.slug,
  });

  return { success: true, store_id: store.id };
}
