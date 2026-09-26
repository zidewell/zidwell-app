// lib/bank78-webhook/payout-refund.ts
import { createClient } from "@supabase/supabase-js";
import { sendBank78WithdrawalEmail } from "./emails";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Bank78 returned money to your corporate wallet for a failed transfer
 * that had ALREADY debited the user. Credit them back.
 */
export async function processBank78PayoutRefund(payload: any) {
  const d = payload.data || payload;
  const providerTxId =
    d.transactionId || d.id || d.batchReference || d.reference;
  const refundAmount = Number(d.amount ?? d.refundAmount ?? 0);

  const { data: original } = await supabase
    .from("transactions")
    .select("*")
    .eq("provider", "bank78")
    .or(
      `provider_transaction_id.eq.${providerTxId},merchant_tx_ref.eq.${d.beneficiaryReference}`
    )
    .maybeSingle();

  if (!original) {
    return { ok: true, message: "No matching transaction" };
  }

  if (original.external_response?.refund_processed) {
    return { ok: true, message: "Already refunded" };
  }

  const wasDebited = original.status === "success" && original.deducted_at;

  if (!wasDebited) {
    await supabase
      .from("transactions")
      .update({
        status: "refunded",
        external_response: {
          ...original.external_response,
          refund_data: payload,
          refund_processed: true,
          refund_amount: 0,
          refunded_at: new Date().toISOString(),
          note: "Refund received but user was never debited",
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", original.id);

    return { ok: true, message: "Refund noted — no credit needed" };
  }

  const amountToRefund =
    refundAmount ||
    Number(original.total_deduction) ||
    Number(original.amount) + Number(original.fee || 0);

  const { data: user } = await supabase
    .from("users")
    .select("id, wallet_balance")
    .eq("id", original.user_id)
    .single();

  if (!user) return { ok: false, error: "User not found" };

  const balanceBefore = Number(user.wallet_balance || 0);
  const balanceAfter = balanceBefore + amountToRefund;

  // Insert refund transaction
  await supabase.from("transactions").insert({
    user_id: original.user_id,
    type: "refund",
    amount: amountToRefund,
    fee: 0,
    net_amount: amountToRefund,
    status: "success",
    reference: `B78-REFUND-${original.id}-${providerTxId}`,
    description: `Refund for failed transfer to ${
      original.receiver?.name || "recipient"
    }`,
    narration: "Bank78 payout refunded",
    channel: "bank78_payout_refund",
    provider: "bank78",
    provider_transaction_id: providerTxId,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    sender: original.receiver || null,
    receiver: original.sender || null,
    external_response: payload,
  });

  // Credit wallet
  const { error: rpcErr } = await supabase.rpc("mutate_wallet_balance", {
    p_user_id: original.user_id,
    p_amount: amountToRefund,
    p_transaction_id: original.id,
    p_reason: "bank78_payout_refund",
  });

  if (rpcErr) {
    await supabase
      .from("users")
      .update({
        wallet_balance: balanceAfter,
        wallet_updated_at: new Date().toISOString(),
      })
      .eq("id", original.user_id);
  }

  await supabase
    .from("transactions")
    .update({
      status: "refunded",
      external_response: {
        ...original.external_response,
        refund_data: payload,
        refund_processed: true,
        refund_amount: amountToRefund,
        refunded_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", original.id);

  const receiver = original.receiver || {};
  await sendBank78WithdrawalEmail({
    userId: original.user_id,
    status: "failed",
    amount: Number(original.amount),
    fee: Number(original.fee || 0),
    recipientName: receiver.name || "N/A",
    recipientAccount: receiver.accountNumber || "N/A",
    bankName: receiver.bankName || "N/A",
    transactionId: original.id,
    errorDetail: `Transfer was refunded. ₦${amountToRefund.toLocaleString()} returned to your wallet.`,
  });

  return {
    ok: true,
    message: "Refund credited",
    refundedAmount: amountToRefund,
    newBalance: balanceAfter,
  };
}