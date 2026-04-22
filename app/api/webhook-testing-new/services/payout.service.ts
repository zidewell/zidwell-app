import { createClient } from "@supabase/supabase-js";
import { sendWithdrawalEmail } from "../helpers/email-helpers";

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

  // Find the pending/processing transaction
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

  // Check for duplicate webhook processing
  const webhookProcessed = pendingTx.external_response?.webhook_processed;
  if (webhookProcessed) {
    console.log("⚠️ Webhook already processed this transaction, skipping");
    return { success: true, message: "Already processed" };
  }

  if (eventType === "payout_success" || txStatus === "success") {
    console.log("✅ Payout successful - NOW deducting balance (Zero Fund Loss Pattern)");

    const totalDeduction = pendingTx.total_deduction || pendingTx.amount + (pendingTx.fee || 0);

    // Deduct balance only on webhook confirmation
    const { data: deductResult, error: deductError } = await supabase.rpc(
      "deduct_wallet_balance_with_lock",
      {
        p_user_id: pendingTx.user_id,
        p_amount: totalDeduction,
        p_transaction_id: pendingTx.id
      }
    );

    if (deductError || deductResult === null || deductResult === -1) {
      console.error("❌ Balance deduction failed:", deductError);

      // Mark transaction as failed (no refund needed)
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          external_response: {
            ...pendingTx.external_response,
            webhook_data: payload,
            deduction_error: deductError?.message || "Insufficient funds or lock error",
            failed_at: new Date().toISOString(),
            webhook_processed: true,
            note: "Balance was never deducted - no refund required"
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", pendingTx.id);

      const receiver = pendingTx.receiver || {};
      sendWithdrawalEmail(
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
        message: "Transaction failed - balance was never deducted"
      };
    }

    console.log(`✅ Deducted ₦${totalDeduction} from user ${pendingTx.user_id}. New balance: ₦${deductResult}`);

    // Update transaction to SUCCESS
    await supabase
      .from("transactions")
      .update({
        status: "success",
        external_response: {
          ...pendingTx.external_response,
          webhook_data: payload,
          deducted_at: new Date().toISOString(),
          deducted_amount: totalDeduction,
          new_balance: deductResult,
          completed_at: new Date().toISOString(),
          webhook_processed: true
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", pendingTx.id);

    const receiver = pendingTx.receiver || {};
    sendWithdrawalEmail(
      pendingTx.user_id,
      "success",
      pendingTx.amount,
      receiver.name || "N/A",
      receiver.accountNumber || "N/A",
      receiver.bankName || "N/A",
      pendingTx.id,
      undefined,
      pendingTx.fee,
    ).catch(console.error);

    return {
      success: true,
      message: "Payout processed and balance deducted",
      new_balance: deductResult
    };

  } else if (eventType === "payout_failed" || txStatus === "failed") {
    console.log("❌ Payout failed - NO refund needed (balance never deducted)");

    const errorDetail = tx.responseMessage ||
      payload.data?.transaction?.responseMessage ||
      "Transaction failed";

    // Update to FAILED (balance was never deducted)
    await supabase
      .from("transactions")
      .update({
        status: "failed",
        external_response: {
          ...pendingTx.external_response,
          webhook_data: payload,
          failed_at: new Date().toISOString(),
          error: errorDetail,
          webhook_processed: true,
          note: "Balance was never deducted - no refund required"
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", pendingTx.id);

    console.log(`✅ Transaction marked as failed. User ${pendingTx.user_id} was never charged.`);

    const receiver = pendingTx.receiver || {};
    sendWithdrawalEmail(
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
      note: "User was not charged for this failed transaction"
    };
  }

  return { success: true };
}