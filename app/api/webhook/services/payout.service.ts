// app/api/webhook/services/payout.service.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface PayoutWebhookParams {
  pendingTxId: string;
  success: boolean;
  nombaTransactionId: string;
  nombaFee?: number;
  failureReason?: string;
}

export async function handlePayoutWebhook({
  pendingTxId,
  success,
  nombaTransactionId,
  nombaFee = 0,
  failureReason,
}: PayoutWebhookParams): Promise<{ ok: boolean; message: string }> {
  try {
    const { data: pendingTx, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", pendingTxId)
      .single();

    if (txError || !pendingTx) {
      console.error(
        `[payout-webhook] Pending tx ${pendingTxId} not found:`,
        txError,
      );
      return { ok: false, message: "Pending transaction not found" };
    }

    if (pendingTx.status === "success" || pendingTx.status === "failed") {
      console.log(
        `[payout-webhook] Tx ${pendingTxId} already finalized (${pendingTx.status}), skipping`,
      );
      return { ok: true, message: "Already processed" };
    }

    // ============================================================
    // CORRECT: user only pays what was quoted in total_deduction.
    // Nomba's fee is a platform cost — do NOT add it on top.
    // ============================================================
    const totalDeduction =
      Number(pendingTx.total_deduction) ||
      Number(pendingTx.amount) ||
      0;

    if (totalDeduction <= 0) {
      console.error(
        `[payout-webhook] Invalid deducted amount for tx ${pendingTxId}`,
      );
      return { ok: false, message: "Invalid deducted amount" };
    }

    if (success) {
      const wasDeducted =
        pendingTx.deducted_at != null && pendingTx.balance_before != null;

      if (!wasDeducted) {
        console.warn(
          `[payout-webhook] ⚠️ Tx ${pendingTxId} succeeded but never deducted — retroactively deducting ${totalDeduction}`,
        );

        const { data: newBalance, error: deductError } = await supabase.rpc(
          "mutate_wallet_balance",
          {
            p_user_id: pendingTx.user_id,
            p_amount: -totalDeduction, // ✅ exact quoted total
            p_transaction_id: pendingTx.id,
            p_reason: "payout_webhook_retroactive_deduction",
            p_idempotency_key: `payout_retro_deduct_${pendingTx.id}`,
          },
        );

        if (deductError) {
          console.error(
            `[payout-webhook] ❌ Retroactive deduction failed:`,
            deductError,
          );
          return { ok: false, message: deductError.message };
        }

        console.log(
          `[payout-webhook] ✅ Deducted ₦${totalDeduction}. New balance: ₦${newBalance}`,
        );
      }

      await supabase
        .from("transactions")
        .update({
          status: "success",
          reference: pendingTx.reference || nombaTransactionId, // ✅ ensure set
          external_response: {
            ...(pendingTx.external_response || {}),
            nomba_transaction_id: nombaTransactionId,
            nomba_fee: nombaFee,
            finalized_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", pendingTx.id);

      return { ok: true, message: "Payout finalized" };
    }

    // FAILURE path
    const wasDeducted =
      pendingTx.deducted_at != null && pendingTx.balance_before != null;

    if (wasDeducted && totalDeduction > 0) {
      const { data: refundTx, error: refundTxError } = await supabase
        .from("transactions")
        .insert({
          user_id: pendingTx.user_id,
          type: "refund",
          amount: totalDeduction,
          status: "pending",
          reference: `REFUND_${
            pendingTx.reference ||
            pendingTx.merchant_tx_ref ||
            pendingTx.id
          }`,
          description: `Refund for failed payout ${
            pendingTx.reference ||
            pendingTx.merchant_tx_ref ||
            pendingTx.id
          }`,
        })
        .select()
        .single();

      if (refundTxError || !refundTx) {
        console.error(
          `[payout-webhook] Failed to create refund tx:`,
          refundTxError,
        );
        return { ok: false, message: "Failed to create refund tx" };
      }

      const { data: newBalance, error: refundError } = await supabase.rpc(
        "mutate_wallet_balance",
        {
          p_user_id: pendingTx.user_id,
          p_amount: totalDeduction,
          p_transaction_id: refundTx.id,
          p_reason: "payout_failure_refund",
          p_idempotency_key: `payout_refund_${pendingTx.id}`,
        },
      );

      if (refundError) {
        console.error(
          `[payout-webhook] Refund RPC failed:`,
          refundError,
        );
        return { ok: false, message: refundError.message };
      }

      await supabase
        .from("transactions")
        .update({ status: "success", updated_at: new Date().toISOString() })
        .eq("id", refundTx.id);

      console.log(
        `[payout-webhook] ✅ Refunded ₦${totalDeduction}. New balance: ₦${newBalance}`,
      );
    } else {
      console.log(
        `[payout-webhook] Tx ${pendingTxId} was never deducted — no refund needed`,
      );
    }

    await supabase
      .from("transactions")
      .update({
        status: "failed",
        external_response: {
          ...(pendingTx.external_response || {}),
          nomba_transaction_id: nombaTransactionId,
          failure_reason: failureReason || "Payout failed at gateway",
          refunded: wasDeducted,
          finalized_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", pendingTx.id);

    return { ok: true, message: "Payout failed, refunded" };
  } catch (err: any) {
    console.error("[payout-webhook] Unexpected error:", err);
    return { ok: false, message: err?.message || "Unexpected error" };
  }
}
