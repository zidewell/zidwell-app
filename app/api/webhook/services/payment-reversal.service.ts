// app/api/webhook/services/payment-reversal.service.ts

import { createClient } from "@supabase/supabase-js";
import { sendReversalEmail } from "../helpers/email-helpers";

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

  // Partial coverage: only debit what's available.
  const walletDebited = Math.min(balanceBefore, reversalAmount);
  const balanceAfter = balanceBefore - walletDebited;
  const shortfall = reversalAmount - walletDebited;
  const hasShortfall = shortfall > 0.01;

  // ─── 1. Debit the wallet ───
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

  // ─── 2. Insert reversal ledger row WITH balance_before / balance_after ───
  const { data: reversalTx, error: reversalInsertError } = await supabase
    .from("transactions")
    .insert({
      user_id: originalTx.user_id,
      type: "reversal",
      amount: reversalAmount,
      fee: 0,
      net_amount: walletDebited,
      status: "success",
      reference: `REVERSAL-${originalTx.id}-${nombaTransactionId}`,
      description: `Payment reversal — ${originalTx.description || "prior credit"}`,
      narration: "Reversal by Nomba",
      channel: "payment_reversal",
      balance_before: balanceBefore,   // ✅ recorded on ledger row
      balance_after: balanceAfter,     // ✅ recorded on ledger row
      deducted_at: new Date().toISOString(),
      external_response: {
        reversed_transaction_id: originalTx.id,
        nomba_transaction_id: nombaTransactionId,
        reversal_data: payload,
        reversal_amount: reversalAmount,
        wallet_debited: walletDebited,
        shortfall,
        has_shortfall: hasShortfall,
      },
    })
    .select("id")
    .single();

  if (reversalInsertError) {
    console.error("❌ Reversal ledger insert failed:", reversalInsertError);
  }

  // ─── 3. Update the original credit tx — record reversal + balance snapshot ───
  await supabase
    .from("transactions")
    .update({
      status: "reversed",
      external_response: {
        ...originalTx.external_response,
        reversal_processed: true,
        reversal_processed_at: new Date().toISOString(),
        reversal_tx_id: reversalTx?.id || null,
        reversal_amount: reversalAmount,
        reversal_wallet_debited: walletDebited,
        reversal_shortfall: shortfall,
        reversal_data: payload,
        reversed_at: new Date().toISOString(),
        // Snapshot balances at time of reversal
        wallet_balance_at_reversal: balanceBefore,
        wallet_balance_after_reversal: balanceAfter,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", originalTx.id);

  console.log(
    `✅ Reversal processed. Balance: ₦${balanceBefore} → ₦${balanceAfter}` +
      (hasShortfall ? ` (shortfall ₦${shortfall})` : ""),
  );

  // ─── 4. Notify the user (email signature unchanged) ───
  await sendReversalEmail(
    originalTx.user_id,
    reversalAmount,
    walletDebited,
    balanceBefore,
    balanceAfter,
    originalTx.id,
    originalTx.description || undefined,
    hasShortfall,
  ).catch((err) => console.error("Reversal email failed:", err));

  return {
    success: true,
    message: "Payment reversal processed",
    reversed_amount: reversalAmount,
    wallet_debited: walletDebited,
    shortfall: hasShortfall ? shortfall : 0,
    new_balance: balanceAfter,
  };
}