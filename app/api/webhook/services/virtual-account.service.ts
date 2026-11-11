// app/api/webhook/services/virtual-account.service.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface VirtualAccountDepositParams {
  userId: string;
  netAmount: number;
  grossAmount: number;
  nombaFee?: number;
  nombaTransactionId: string;
  senderName?: string;
  senderBank?: string;
  narration?: string;
}

/**
 * Credit a user's wallet for a virtual-account deposit.
 * Uses idempotency key `va_deposit_${newTx.id}` so webhook retries
 * cannot double-credit the wallet.
 */
export async function handleVirtualAccountDeposit({
  userId,
  netAmount,
  grossAmount,
  nombaFee = 0,
  nombaTransactionId,
  senderName,
  senderBank,
  narration,
}: VirtualAccountDepositParams): Promise<{ ok: boolean; message: string }> {
  try {
    if (netAmount <= 0) {
      console.warn(
        `[va-deposit] Skipping zero/negative net amount for user ${userId}`
      );
      return { ok: true, message: "Zero/negative amount skipped" };
    }

    // 1. Create transaction row (pending, mutated to success by RPC)
    const reference = `VA_DEPOSIT_${nombaTransactionId}`;

    // Check if this transaction already exists (extra idempotency safety)
    const { data: existingTx } = await supabase
      .from("transactions")
      .select("id, status")
      .eq("reference", reference)
      .maybeSingle();

    if (existingTx && existingTx.status === "success") {
      console.log(
        `[va-deposit] Deposit ${nombaTransactionId} already processed (tx ${existingTx.id}), skipping`
      );
      return { ok: true, message: "Already processed" };
    }

    const { data: newTx, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: "virtual_account_deposit",
        amount: netAmount,
        status: "pending",
        reference,
        description:
          narration ||
          `Virtual account deposit from ${senderName || "Unknown"} (${
            senderBank || "Unknown Bank"
          })`,
        external_response: {
          nomba_transaction_id: nombaTransactionId,
          gross_amount: grossAmount,
          nomba_fee: nombaFee,
          sender_name: senderName,
          sender_bank: senderBank,
        },
      })
      .select()
      .single();

    if (txError || !newTx) {
      // If unique constraint violation, it's already been inserted
      if (txError?.code === "23505") {
        console.log(
          `[va-deposit] Race on insert for ${nombaTransactionId}, treating as already processed`
        );
        return { ok: true, message: "Already processed" };
      }
      console.error("[va-deposit] Failed to create tx:", txError);
      return { ok: false, message: txError?.message || "Tx insert failed" };
    }

    // 2. Atomically credit the wallet with idempotency
    const { data: newBalance, error: creditError } = await supabase.rpc(
      "mutate_wallet_balance",
      {
        p_user_id: userId,
        p_amount: netAmount,
        p_transaction_id: newTx.id,
        p_reason: "virtual_account_deposit",
        p_idempotency_key: `va_deposit_${newTx.id}`,
      }
    );

    if (creditError) {
      console.error("[va-deposit] Credit RPC failed:", creditError);
      // Mark tx failed so it can be retried
      await supabase
        .from("transactions")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", newTx.id);
      return { ok: false, message: creditError.message };
    }

    // 3. Mark tx success
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: "success",
        updated_at: new Date().toISOString(),
      })
      .eq("id", newTx.id);

    if (updateError) {
      console.error(
        "[va-deposit] Failed to mark tx success (balance already credited):",
        updateError
      );
      // Non-fatal: money is credited, status update will be reconciled
    }

    console.log(
      `[va-deposit] Deposited ${netAmount} to user ${userId}. New balance: ${newBalance}`
    );
    return { ok: true, message: "Deposit credited" };
  } catch (err: any) {
    console.error("[va-deposit] Unexpected error:", err);
    return { ok: false, message: err?.message || "Unexpected error" };
  }
}