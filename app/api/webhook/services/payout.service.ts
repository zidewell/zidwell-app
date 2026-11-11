// app/api/webhook/services/payout.service.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PayoutWebhookParams {
  pendingTxId: string;
  success: boolean;
  nombaTransactionId: string;
  nombaFee?: number;
  failureReason?: string;
}

/**
 * Handle payout webhook result:
 * - On SUCCESS: finalize balance deduction (already locked in deduct_wallet_balance_with_lock)
 * - On FAILURE: refund the deducted amount back to user
 *
 * Idempotency key ensures the balance change happens exactly once even if
 * the webhook is delivered multiple times.
 */
export async function handlePayoutWebhook({
  pendingTxId,
  success,
  nombaTransactionId,
  nombaFee = 0,
  failureReason,
}: PayoutWebhookParams): Promise<{ ok: boolean; message: string }> {
  try {
    // 1. Fetch pending transaction
    const { data: pendingTx, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", pendingTxId)
      .single();

    if (txError || !pendingTx) {
      console.error(
        `[payout-webhook] Pending tx ${pendingTxId} not found:`,
        txError
      );
      return { ok: false, message: "Pending transaction not found" };
    }

    // 2. If already finalized, skip (idempotency at app layer too)
    if (pendingTx.status === "success" || pendingTx.status === "failed") {
      console.log(
        `[payout-webhook] Tx ${pendingTxId} already finalized (${pendingTx.status}), skipping`
      );
      return { ok: true, message: "Already processed" };
    }

    const deductedAmount =
      Number(pendingTx.total_deduction) || Number(pendingTx.amount) || 0;
    if (deductedAmount <= 0) {
      console.error(
        `[payout-webhook] Invalid deducted amount for tx ${pendingTxId}`
      );
      return { ok: false, message: "Invalid deducted amount" };
    }

    if (success) {
      // 3a. SUCCESS: Finalize the deduction (balance already moved by
      //     deduct_wallet_balance_with_lock when the payout was initiated)
      const totalDeduction = deductedAmount + Number(nombaFee || 0);

      const { data: deductResult, error: deductError } = await supabase.rpc(
        "deduct_wallet_balance_with_lock",
        {
          p_user_id: pendingTx.user_id,
          p_amount: totalDeduction,
          p_transaction_id: pendingTx.id,
          p_idempotency_key: `payout_${pendingTx.id}`,
        }
      );

      if (deductError) {
        console.error(
          `[payout-webhook] Balance lock/deduct failed for ${pendingTxId}:`,
          deductError
        );
        return { ok: false, message: deductError.message };
      }

      // Update transaction status to success
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          status: "success",
          external_response: {
            nomba_transaction_id: nombaTransactionId,
            nomba_fee: nombaFee,
            finalized_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", pendingTx.id);

      if (updateError) {
        console.error(
          `[payout-webhook] Failed to mark tx ${pendingTxId} success:`,
          updateError
        );
        return { ok: false, message: updateError.message };
      }

      console.log(
        `[payout-webhook] Payout ${pendingTxId} SUCCESS. New balance: ${deductResult}`
      );
      return { ok: true, message: "Payout finalized" };
    }

    // 3b. FAILURE: Refund the deducted amount back to the user
    // Create a refund transaction record first
    const { data: refundTx, error: refundTxError } = await supabase
      .from("transactions")
      .insert({
        user_id: pendingTx.user_id,
        type: "refund",
        amount: deductedAmount,
        status: "success",
        reference: `REFUND_${pendingTx.reference || pendingTx.id}`,
        description: `Refund for failed payout ${pendingTx.reference || pendingTx.id}`,
      })
      .select()
      .single();

    if (refundTxError || !refundTx) {
      console.error(
        `[payout-webhook] Failed to create refund tx for ${pendingTxId}:`,
        refundTxError
      );
      return { ok: false, message: "Failed to create refund tx" };
    }

    const { data: newBalance, error: refundError } = await supabase.rpc(
      "mutate_wallet_balance",
      {
        p_user_id: pendingTx.user_id,
        p_amount: deductedAmount, // positive = credit
        p_transaction_id: refundTx.id,
        p_reason: "payout_failure_refund",
        p_idempotency_key: `payout_refund_${pendingTx.id}`,
      }
    );

    if (refundError) {
      console.error(
        `[payout-webhook] Refund RPC failed for ${pendingTxId}:`,
        refundError
      );
      return { ok: false, message: refundError.message };
    }

    // Mark original tx as failed
    const { error: failUpdateError } = await supabase
      .from("transactions")
      .update({
        status: "failed",
        external_response: {
          nomba_transaction_id: nombaTransactionId,
          failure_reason: failureReason || "Payout failed at gateway",
          refunded: true,
          refund_transaction_id: refundTx.id,
          finalized_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", pendingTx.id);

    if (failUpdateError) {
      console.error(
        `[payout-webhook] Failed to mark tx ${pendingTxId} failed:`,
        failUpdateError
      );
    }

    console.log(
      `[payout-webhook] Payout ${pendingTxId} FAILED → refunded ${deductedAmount}. New balance: ${newBalance}`
    );
    return { ok: true, message: "Payout failed, refunded" };
  } catch (err: any) {
    console.error("[payout-webhook] Unexpected error:", err);
    return { ok: false, message: err?.message || "Unexpected error" };
  }
}