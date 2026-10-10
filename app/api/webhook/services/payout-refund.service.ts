// app/api/webhook/services/payout-refund.service.ts

import { createClient } from "@supabase/supabase-js";
import { sendWithdrawalEmail } from "../helpers/email-helpers";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface PayoutRefundParams {
  nombaTransactionId: string;
  eventType: string;
  tx: any;
  walletBalanceBefore: number;
  walletBalanceAfter: number;
  refundAmount: number;
}

export async function processPayoutRefund(
  payload: any,
  params: PayoutRefundParams,
) {
  const {
    nombaTransactionId,
    tx,
    walletBalanceBefore,
    walletBalanceAfter,
    refundAmount,
  } = params;

  console.log("💸 Processing payout refund webhook...");
  console.log("Refund amount:", refundAmount);
  console.log("Nomba wallet before:", walletBalanceBefore);
  console.log("Nomba wallet after:", walletBalanceAfter);

  const merchantTxRef = tx.merchantTxRef;
  const searchRefs = [nombaTransactionId, merchantTxRef].filter(Boolean);

  let originalTx: any = null;

  for (const ref of searchRefs) {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .or(`merchant_tx_ref.eq.${ref},reference.eq.${ref}`)
      .in("status", ["success", "failed", "processing", "pending"])
      .maybeSingle();

    if (data) {
      originalTx = data;
      break;
    }
  }

  if (!originalTx) {
    console.warn("⚠️ No matching original transaction for refund:", {
      merchantTxRef,
      nombaTransactionId,
    });
    return { success: true, message: "No matching transaction" };
  }

  console.log(
    `📦 Found original tx ${originalTx.id} — status: ${originalTx.status}`,
  );

  if (originalTx.external_response?.refund_processed) {
    console.log("⚠️ Refund already processed, skipping");
    return { success: true, message: "Already refunded" };
  }

  const totalRefund =
    refundAmount ||
    Number(originalTx.total_deduction) ||
    Number(originalTx.amount);

  const wasDeducted =
    originalTx.status === "success" && originalTx.deducted_at != null;

  if (!wasDeducted) {
    console.log(
      "ℹ️ User was never deducted for this tx — nothing to refund. Just tagging.",
    );

    const updateData: any = {
      status: "refunded",
      external_response: {
        ...originalTx.external_response,
        refund_data: payload,
        refund_processed: true,
        refund_amount: 0,
        refunded_at: new Date().toISOString(),
        refund_note:
          "Nomba refunded to corporate wallet, but user was never debited",
      },
      updated_at: new Date().toISOString(),
    };

    // Only record reference if we don't already have one
    if (!originalTx.reference && nombaTransactionId) {
      updateData.reference = nombaTransactionId;
    }

    await supabase
      .from("transactions")
      .update(updateData)
      .eq("id", originalTx.id);

    return { success: true, message: "Refund noted — no user credit needed" };
  }

  console.log(
    `💰 Crediting ₦${totalRefund} back to user ${originalTx.user_id}`,
  );

  const { data: userRow, error: userErr } = await supabase
    .from("users")
    .select("id, wallet_balance")
    .eq("id", originalTx.user_id)
    .single();

  if (userErr || !userRow) {
    console.error(
      "❌ Cannot find user for refund credit:",
      originalTx.user_id,
      userErr,
    );
    return { error: "User not found for refund" };
  }

  const balanceBefore = Number(userRow.wallet_balance);
  const balanceAfter = balanceBefore + totalRefund;

  const { error: creditError } = await supabase
    .from("users")
    .update({
      wallet_balance: balanceAfter,
      wallet_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", originalTx.user_id);

  if (creditError) {
    console.error("❌ Failed to credit refund:", creditError);
    return { error: "Refund credit failed" };
  }

  console.log(`✅ Credited ₦${totalRefund} — new balance ₦${balanceAfter}`);

  const { error: refundTxError } = await supabase
    .from("transactions")
    .insert({
      user_id: originalTx.user_id,
      type: "refund",
      amount: totalRefund,
      fee: 0,
      net_amount: totalRefund,
      status: "success",
      reference: `REFUND-${originalTx.id}-${nombaTransactionId}`,
      merchant_tx_ref: merchantTxRef ? `REFUND-${merchantTxRef}` : null,
      description: `Refund for failed transfer to ${
        originalTx.receiver?.name || "recipient"
      }`,
      narration: "Payout refunded by Nomba",
      channel: "payout_refund",
      sender: originalTx.receiver || null,
      receiver: originalTx.sender || null,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      deducted_at: new Date().toISOString(),
      external_response: {
        refunded_transaction_id: originalTx.id,
        nomba_transaction_id: nombaTransactionId,
        nomba_wallet_before: walletBalanceBefore,
        nomba_wallet_after: walletBalanceAfter,
        refund_data: payload,
      },
    });

  if (refundTxError) {
    console.error(
      "⚠️ Refund credited but ledger insert failed:",
      refundTxError,
    );
  }

  // Update original tx — only set reference if missing
  const originalUpdate: any = {
    status: "refunded",
    external_response: {
      ...originalTx.external_response,
      refund_data: payload,
      refund_processed: true,
      refund_amount: totalRefund,
      refunded_at: new Date().toISOString(),
    },
    updated_at: new Date().toISOString(),
  };

  if (!originalTx.reference && nombaTransactionId) {
    originalUpdate.reference = nombaTransactionId;
  }

  await supabase
    .from("transactions")
    .update(originalUpdate)
    .eq("id", originalTx.id);

  const receiver = originalTx.receiver || {};
  await sendWithdrawalEmail(
    originalTx.user_id,
    "failed",
    originalTx.amount,
    receiver.name || "N/A",
    receiver.accountNumber || "N/A",
    receiver.bankName || "N/A",
    originalTx.id,
    `Transfer was refunded by the bank. ₦${totalRefund.toLocaleString()} has been returned to your wallet.`,
    originalTx.fee,
  ).catch((err) => console.error("Refund email failed:", err));

  return {
    success: true,
    message: "Refund processed and wallet credited",
    refunded_amount: totalRefund,
    new_balance: balanceAfter,
  };
}