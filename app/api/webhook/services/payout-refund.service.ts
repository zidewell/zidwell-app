// app/api/webhook/services/payout-refund.service.ts

import { createClient } from "@supabase/supabase-js";
import { sendRefundEmail } from "../helpers/email-helpers";

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

  // ─────────────────────────────────────────────────────────────
  // Case A: user was never deducted — nothing to credit back.
  //         Tag the original tx so it's auditable and move on.
  // ─────────────────────────────────────────────────────────────
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
        refund_processed_at: new Date().toISOString(),
        refund_amount: 0,
        refunded_at: new Date().toISOString(),
        refund_note:
          "Nomba refunded to corporate wallet, but user was never debited",
        nomba_wallet_before: walletBalanceBefore,
        nomba_wallet_after: walletBalanceAfter,
      },
      updated_at: new Date().toISOString(),
    };

    // Only set `reference` here if it's currently empty. We don't want to
    // overwrite an existing reference (UNIQUE constraint) or clash with
    // another row that already holds the Nomba id.
    if (!originalTx.reference && nombaTransactionId) {
      updateData.reference = nombaTransactionId;
    }

    await supabase
      .from("transactions")
      .update(updateData)
      .eq("id", originalTx.id);

    return { success: true, message: "Refund noted — no user credit needed" };
  }

  // ─────────────────────────────────────────────────────────────
  // Case B: user WAS deducted — credit the wallet back.
  // ─────────────────────────────────────────────────────────────
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

  // ─── 1. Credit the wallet ───
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

  // ─── 2. Insert refund ledger row ───
  //
  // `reference` is UNIQUE, so we use a deterministic refund reference.
  // The Nomba tx id is stashed in metadata (it already exists on the
  // original tx — duplicating it in `merchant_tx_ref` would violate
  // the `unique_merchant_tx_ref` constraint).
  //
  // `balance_before` / `balance_after` are set at INSERT time so the
  // journal trigger captures them.
  const refundReference = `REFUND-${originalTx.id}-${nombaTransactionId}`;

  const { data: refundTx, error: refundTxError } = await supabase
    .from("transactions")
    .insert({
      user_id: originalTx.user_id,
      type: "refund",
      amount: totalRefund,
      fee: 0,
      net_amount: totalRefund,
      status: "success",
      reference: refundReference,                // ✅ UNIQUE
      merchant_tx_ref: null,                     // ✅ Nomba id lives on the original tx
      description: `Refund for failed transfer to ${
        originalTx.receiver?.name || "recipient"
      }`,
      narration: "Payout refunded by Nomba",
      channel: "payout_refund",
      sender: originalTx.receiver || null,
      receiver: originalTx.sender || null,
      balance_before: balanceBefore,             // ✅ on insert
      balance_after: balanceAfter,               // ✅ on insert
      deducted_at: new Date().toISOString(),
      metadata: {
        refunded_transaction_id: originalTx.id,
        refunded_transaction_reference: originalTx.reference,
        refunded_transaction_merchant_tx_ref: originalTx.merchant_tx_ref,
        nomba_transaction_id: nombaTransactionId,
        refund_amount: totalRefund,
        wallet_balance_before: balanceBefore,
        wallet_balance_after: balanceAfter,
        nomba_wallet_before: walletBalanceBefore,
        nomba_wallet_after: walletBalanceAfter,
      },
      external_response: {
        refunded_transaction_id: originalTx.id,
        nomba_transaction_id: nombaTransactionId,
        refund_data: payload,
      },
    })
    .select("id")
    .single();

  if (refundTxError) {
    console.error(
      "⚠️ Refund credited but ledger insert failed:",
      refundTxError,
    );
  }

  // ─── 3. Update original tx — record refund + wallet balance snapshot ───
  const originalUpdate: any = {
    status: "refunded",
    external_response: {
      ...originalTx.external_response,
      refund_data: payload,
      refund_processed: true,
      refund_processed_at: new Date().toISOString(),
      refund_tx_id: refundTx?.id || null,
      refund_amount: totalRefund,
      refunded_at: new Date().toISOString(),
      wallet_balance_before_refund: balanceBefore,
      wallet_balance_after_refund: balanceAfter,
      nomba_wallet_before: walletBalanceBefore,
      nomba_wallet_after: walletBalanceAfter,
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

  // ─── 4. Notify the user (email signature unchanged) ───
  const receiver = originalTx.receiver || {};
  await sendRefundEmail(
    originalTx.user_id,
    Number(originalTx.amount),
    totalRefund,
    receiver.name || "N/A",
    receiver.accountNumber || "N/A",
    receiver.bankName || "N/A",
    originalTx.id,
    Number(originalTx.fee || 0),
  ).catch((err) => console.error("Refund email failed:", err));

  return {
    success: true,
    message: "Refund processed and wallet credited",
    refunded_amount: totalRefund,
    new_balance: balanceAfter,
  };
}