import { createClient } from "@supabase/supabase-js";
import {
  sendWithdrawalEmail,
  generateTransferReceipt,
} from "../helpers/email-helpers";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface PayoutParams {
  nombaTransactionId: string;
  eventType: string;
  txStatus: string;
  tx: any;
}

export async function processPayout(payload: any, params: PayoutParams) {
  const { nombaTransactionId, eventType, txStatus, tx } = params;

  console.log("💸 Processing payout webhook...");

  const merchantTxRef = tx.merchantTxRef;
  const searchRefs = [nombaTransactionId, merchantTxRef].filter(Boolean);

  let pendingTx = null;

  for (const ref of searchRefs) {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .or(`merchant_tx_ref.eq.${ref},reference.eq.${ref}`)
      .in("status", ["pending", "processing"])
      .maybeSingle();

    if (data) {
      pendingTx = data;
      break;
    }
  }

  if (!pendingTx) {
    console.log("⚠️ No matching pending transaction found for payout");
    return { message: "No matching transaction", status: 200 };
  }

  console.log(`📦 Found transaction ${pendingTx.id} in status: ${pendingTx.status}`);

  const webhookProcessed = pendingTx.external_response?.webhook_processed;
  if (webhookProcessed) {
    console.log("⚠️ Webhook already processed this transaction, skipping");
    return { success: true, message: "Already processed" };
  }

  if (eventType === "payout_success" || txStatus === "success") {
    console.log(
      "✅ Payout successful - NOW deducting balance (Zero Fund Loss Pattern)",
    );

    const totalDeduction =
      pendingTx.total_deduction || pendingTx.amount + (pendingTx.fee || 0);

    // Read balance before so we can backfill if RPC version drifts
    const { data: preUser } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", pendingTx.user_id)
      .single();

    const balanceBefore = preUser ? Number(preUser.wallet_balance) : null;

    const { data: deductResult, error: deductError } = await supabase.rpc(
      "deduct_wallet_balance_with_lock",
      {
        p_user_id: pendingTx.user_id,
        p_amount: totalDeduction,
        p_transaction_id: pendingTx.id,
      },
    );

    if (deductError || deductResult === null || deductResult === -1) {
      console.error("❌ Balance deduction failed:", deductError);

      await supabase
        .from("transactions")
        .update({
          status: "failed",
          reference: nombaTransactionId,
          external_response: {
            ...pendingTx.external_response,
            webhook_data: payload,
            deduction_error: deductError?.message || "Insufficient funds",
            failed_at: new Date().toISOString(),
            webhook_processed: true,
            note: "Balance was never deducted - no refund required",
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", pendingTx.id);

      const receiver = pendingTx.receiver || {};
      await sendWithdrawalEmail(
        pendingTx.user_id,
        "failed",
        pendingTx.amount,
        receiver.name || "N/A",
        receiver.accountNumber || "N/A",
        receiver.bankName || "N/A",
        pendingTx.id,
        "Failed to process transfer - insufficient funds",
        pendingTx.fee,
      ).catch(console.error);

      return {
        success: false,
        error: "Deduction failed",
        message: "Transaction failed - balance was never deducted",
      };
    }

    const balanceAfter = Number(deductResult);

    console.log(
      `✅ Deducted ₦${totalDeduction} from user ${pendingTx.user_id}. New balance: ₦${balanceAfter}`,
    );

    await supabase
      .from("transactions")
      .update({
        status: "success",
        reference: nombaTransactionId,
        metadata: {
          ...(pendingTx.metadata || {}),
          webhook_confirmed_at: new Date().toISOString(),
          nomba_transaction_id: nombaTransactionId,
          deducted_amount: totalDeduction,
          new_balance: balanceAfter,
        },
        external_response: {
          ...pendingTx.external_response,
          webhook_data: payload,
          deducted_at: new Date().toISOString(),
          deducted_amount: totalDeduction,
          new_balance: balanceAfter,
          completed_at: new Date().toISOString(),
          webhook_processed: true,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", pendingTx.id);

    // ✅ Belt-and-braces: fill balance columns if RPC didn't (version drift)
    if (balanceBefore != null) {
      await supabase
        .from("transactions")
        .update({
          balance_before: balanceBefore,
          balance_after: balanceAfter,
        })
        .eq("id", pendingTx.id)
        .is("balance_after", null);
    }

    const receiver = pendingTx.receiver || {};

    const receiptHtml = generateTransferReceipt({
      transactionId: pendingTx.id,
      amount: Number(pendingTx.amount),
      date: new Date().toISOString(),
      recipientName: receiver.name || "N/A",
      recipientAccount: receiver.accountNumber || "N/A",
      recipientBank: receiver.bankName || "N/A",
      senderName: pendingTx.sender?.name || "Zidwell User",
      senderAccount: pendingTx.sender?.accountNumber || "N/A",
      narration: pendingTx.narration || "N/A",
      fee: Number(pendingTx.fee || 0),
      type: "bank_transfer",
    });

    await sendWithdrawalEmail(
      pendingTx.user_id,
      "success",
      pendingTx.amount,
      receiver.name || "N/A",
      receiver.accountNumber || "N/A",
      receiver.bankName || "N/A",
      pendingTx.id,
      undefined,
      pendingTx.fee,
      receiptHtml,
    ).catch((err) =>
      console.error("Failed to send withdrawal email:", err),
    );

    return {
      success: true,
      message: "Payout processed and balance deducted",
      new_balance: balanceAfter,
    };
  } else if (eventType === "payout_failed" || txStatus === "failed") {
    console.log("❌ Payout failed - NO refund needed (balance never deducted)");

    const errorDetail =
      tx.responseMessage ||
      payload.data?.transaction?.responseMessage ||
      "Transaction failed";

    await supabase
      .from("transactions")
      .update({
        status: "failed",
        reference: nombaTransactionId,
        external_response: {
          ...pendingTx.external_response,
          webhook_data: payload,
          failed_at: new Date().toISOString(),
          error: errorDetail,
          webhook_processed: true,
          note: "Balance was never deducted - no refund required",
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", pendingTx.id);

    console.log(
      `✅ Transaction marked as failed. User ${pendingTx.user_id} was never charged.`,
    );

    const receiver = pendingTx.receiver || {};
    await sendWithdrawalEmail(
      pendingTx.user_id,
      "failed",
      pendingTx.amount,
      receiver.name || "N/A",
      receiver.accountNumber || "N/A",
      receiver.bankName || "N/A",
      pendingTx.id,
      `${errorDetail} - Your wallet was never charged.`,
      pendingTx.fee,
    ).catch(console.error);

    return {
      success: true,
      message: "Payout failed - balance never deducted",
      note: "User was not charged for this failed transaction",
    };
  }

  return { success: true };
}