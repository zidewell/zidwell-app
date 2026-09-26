// lib/bank78-webhook/payout.ts
import { createClient } from "@supabase/supabase-js";
import { sendBank78WithdrawalEmail } from "./emails";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Bank78 tells us the outcome of a withdrawal.
 *
 * IMPORTANT PATTERN (zero fund loss):
 *   - Debit the user ONLY when the payout succeeds.
 *   - If it fails, just mark the tx failed (no refund needed).
 */
export async function processBank78Payout(payload: any) {
  const d = payload.data || payload;
  const eventType = payload.event || payload.event_type || "";

  const batchReference =
    d.batchReference || d.batch_reference || d.reference;
  const beneficiaryRef = d.beneficiaryReference || d.reference;
  const providerTxId = d.transactionId || d.id || batchReference;

  const status = String(
    d.status || (eventType.includes("success") ? "success" : "failed")
  ).toLowerCase();

  // Find our pending transaction
  const { data: tx } = await supabase
    .from("transactions")
    .select("*")
    .eq("provider", "bank78")
    .or(
      `provider_transaction_id.eq.${providerTxId},merchant_tx_ref.eq.${beneficiaryRef},merchant_tx_ref.eq.${batchReference}`
    )
    .in("status", ["pending", "processing"])
    .maybeSingle();

  if (!tx) {
    console.log("[bank78 payout] no matching pending tx:", {
      providerTxId,
      beneficiaryRef,
      batchReference,
    });
    return { ok: true, message: "No matching transaction" };
  }

  if (tx.external_response?.webhook_processed) {
    return { ok: true, message: "Already processed" };
  }

  const isSuccess = status === "success" || status === "completed";
  const isFailed = status === "failed" || status === "reversed";

  if (isSuccess) {
    const totalDeduction =
      Number(tx.total_deduction) || Number(tx.amount) + Number(tx.fee || 0);

    // Debit only on success
    const { data: newBalance, error: debitErr } = await supabase.rpc(
      "deduct_wallet_balance_with_lock",
      {
        p_user_id: tx.user_id,
        p_amount: totalDeduction,
        p_transaction_id: tx.id,
      }
    );

    if (debitErr || newBalance === null || newBalance === -1) {
      // Couldn't debit — treat as failed, no money left user account
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          provider_transaction_id: providerTxId,
          external_response: {
            ...tx.external_response,
            webhook_data: payload,
            webhook_processed: true,
            deduction_error: debitErr?.message || "Insufficient funds",
            failed_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", tx.id);

      const receiver = tx.receiver || {};
      await sendBank78WithdrawalEmail({
        userId: tx.user_id,
        status: "failed",
        amount: Number(tx.amount),
        fee: Number(tx.fee || 0),
        recipientName: receiver.name || "N/A",
        recipientAccount: receiver.accountNumber || "N/A",
        bankName: receiver.bankName || "N/A",
        transactionId: tx.id,
        errorDetail: "Insufficient funds",
      });

      return { ok: true, message: "Marked failed — insufficient funds" };
    }

    await supabase
      .from("transactions")
      .update({
        status: "success",
        provider_transaction_id: providerTxId,
        balance_before: Number(tx.balance_before || 0) || null,
        balance_after: newBalance,
        deducted_at: new Date().toISOString(),
        external_response: {
          ...tx.external_response,
          webhook_data: payload,
          webhook_processed: true,
          deducted_amount: totalDeduction,
          new_balance: newBalance,
          completed_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", tx.id);

    const receiver = tx.receiver || {};
    await sendBank78WithdrawalEmail({
      userId: tx.user_id,
      status: "success",
      amount: Number(tx.amount),
      fee: Number(tx.fee || 0),
      recipientName: receiver.name || "N/A",
      recipientAccount: receiver.accountNumber || "N/A",
      bankName: receiver.bankName || "N/A",
      transactionId: tx.id,
    });

    return { ok: true, message: "Payout completed", newBalance };
  }

  if (isFailed) {
    // User was never debited — just mark failed
    await supabase
      .from("transactions")
      .update({
        status: "failed",
        provider_transaction_id: providerTxId,
        external_response: {
          ...tx.external_response,
          webhook_data: payload,
          webhook_processed: true,
          failed_at: new Date().toISOString(),
          reason: d.responseMessage || d.message || "Transfer failed",
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", tx.id);

    const receiver = tx.receiver || {};
    await sendBank78WithdrawalEmail({
      userId: tx.user_id,
      status: "failed",
      amount: Number(tx.amount),
      fee: Number(tx.fee || 0),
      recipientName: receiver.name || "N/A",
      recipientAccount: receiver.accountNumber || "N/A",
      bankName: receiver.bankName || "N/A",
      transactionId: tx.id,
      errorDetail: d.responseMessage || d.message || "Transfer failed",
    });

    return { ok: true, message: "Payout marked failed" };
  }

  return { ok: true, message: "Unrecognized status" };
}