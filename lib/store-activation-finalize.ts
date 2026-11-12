// lib/store-activation-finalize.ts
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { PaystackVerifyResult } from "@/lib/paystack";

export async function finalizeStoreActivation(
  reference: string,
  tx: PaystackVerifyResult
): Promise<{ ok: boolean; reason?: string; paymentId?: string }> {
  const supabase = getSupabaseAdmin();

  // store_activation_payments.promo_id and store_activation_promos
  // are not in the generated Supabase types yet. Cast to `any` for
  // these queries only — runtime works. Remove once types are regenerated.
  const storeDb = supabase as any;

  const { data: payment, error: fetchError } = await storeDb
    .from("store_activation_payments")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();

  if (fetchError || !payment) {
    console.error("Activation payment not found:", reference, fetchError);
    return { ok: false, reason: "Payment not found" };
  }

  if (payment.status === "completed") {
    return { ok: true, paymentId: payment.id, reason: "Already processed" };
  }

  if (payment.status !== "pending") {
    return { ok: false, reason: `Invalid status: ${payment.status}` };
  }

  const paidNaira = tx.amount / 100;
  const expected = Number(payment.amount);
  if (Math.abs(paidNaira - expected) > 1) {
    console.error(
      `Amount mismatch for ${reference}: paid ${paidNaira}, expected ${expected}`
    );
    return { ok: false, reason: "Amount mismatch" };
  }

  const now = new Date().toISOString();

  const { error: updErr } = await supabase
    .from("store_activation_payments")
    .update({
      status: "completed",
      completed_at: now,
      paid_at: tx.paid_at ?? now,
      nomba_transaction_id: String(tx.transactionId),
      updated_at: now,
    })
    .eq("id", payment.id);

  if (updErr) {
    console.error("Failed to update activation payment:", updErr);
    return { ok: false, reason: "DB update failed" };
  }

  // Mark promo used if any
  if (payment.promo_id) {
    await storeDb
      .from("store_activation_promos")
      .update({
        status: "used",
        used_at: now,
        payment_id: payment.id,
        updated_at: now,
      })
      .eq("id", payment.promo_id)
      .then(({ error }: { error: any }) => {
        if (error) console.error("Promo mark-used failed:", error);
      });
  }

  const { error: storeErr } = await supabase
    .from("online_stores")
    .update({
      is_active: true,
      activation_paid: true,
      activated_at: now,
      activation_reference: `ACT_${tx.transactionId}`,
      updated_at: now,
    })
    .eq("id", payment.store_id);

  if (storeErr) {
    console.error("Failed to activate store:", storeErr);
    await supabase
      .from("store_activation_payments")
      .update({
        status: "pending",
        completed_at: null,
        paid_at: null,
        nomba_transaction_id: null,
      })
      .eq("id", payment.id);
    return { ok: false, reason: "Store activation failed" };
  }

  await supabase
    .from("store_create_drafts")
    .delete()
    .eq("user_id", payment.user_id)
    .then(({ error }) => {
      if (error) console.error("Failed to clear draft:", error);
    });

  const { data: wallet } = await supabase
    .from("store_owner_wallets")
    .select("id")
    .eq("user_id", payment.user_id)
    .maybeSingle();

  if (!wallet) {
    await supabase.from("store_owner_wallets").insert({
      user_id: payment.user_id,
      store_id: payment.store_id,
      available_balance: 0,
      pending_balance: 0,
      total_earned: 0,
      total_withdrawn: 0,
      last_activity_at: now,
    });
  }

  return { ok: true, paymentId: payment.id };
}
