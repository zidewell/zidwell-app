// app/api/webhook/services/payment-reversal.service.ts

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface ReversalParams {
  nombaTransactionId: string;
  transactionAmount: number;
  tx: any;
}

export async function processPaymentReversal(
  payload: any,
  params: ReversalParams,
) {
  const { nombaTransactionId, transactionAmount, tx } = params;

  console.log("🔁 Processing payment reversal...");

  const { data: originalTx } = await supabase
    .from("transactions")
    .select("*")
    .or(
      `reference.eq.${nombaTransactionId},merchant_tx_ref.eq.${nombaTransactionId}`,
    )
    .eq("type", "credit")
    .eq("status", "success")
    .maybeSingle();

  if (!originalTx) {
    console.log("⚠️ No matching credit transaction for reversal");
    return { success: true, message: "No matching transaction" };
  }

  if (originalTx.external_response?.reversal_processed) {
    return { success: true, message: "Already reversed" };
  }

  const reversalAmount =
    transactionAmount ||
    Number(originalTx.net_amount) ||
    Number(originalTx.amount);

  const { data: user } = await supabase
    .from("users")
    .select("id, wallet_balance")
    .eq("id", originalTx.user_id)
    .single();

  if (!user) {
    return { error: "User not found" };
  }

  const balanceBefore = Number(user.wallet_balance);
  const balanceAfter = Math.max(0, balanceBefore - reversalAmount);

  const { error: debitError } = await supabase
    .from("users")
    .update({
      wallet_balance: balanceAfter,
      wallet_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", originalTx.user_id);

  if (debitError) {
    console.error("❌ Reversal debit failed:", debitError);
    return { error: "Reversal debit failed" };
  }

  await supabase.from("transactions").insert({
    user_id: originalTx.user_id,
    type: "reversal",
    amount: reversalAmount,
    fee: 0,
    net_amount: reversalAmount,
    status: "success",
    reference: `REVERSAL-${originalTx.id}-${nombaTransactionId}`,
    description: `Payment reversal — ${originalTx.description || "prior credit"}`,
    narration: "Reversal by Nomba",
    channel: "payment_reversal",
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    deducted_at: new Date().toISOString(),
    external_response: {
      reversed_transaction_id: originalTx.id,
      nomba_transaction_id: nombaTransactionId,
      reversal_data: payload,
    },
  });

  await supabase
    .from("transactions")
    .update({
      status: "reversed",
      external_response: {
        ...originalTx.external_response,
        reversal_processed: true,
        reversal_data: payload,
        reversed_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", originalTx.id);

  console.log(
    `✅ Reversal processed. Balance: ₦${balanceBefore} → ₦${balanceAfter}`,
  );

  return {
    success: true,
    message: "Payment reversal processed",
    reversed_amount: reversalAmount,
    new_balance: balanceAfter,
  };
}