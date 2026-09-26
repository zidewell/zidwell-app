// lib/bank78-webhook/wallet-credit.ts
import { createClient } from "@supabase/supabase-js";
import { sendBank78DepositEmail } from "./emails";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * A transfer arrived in a user's virtual NUBAN.
 * Payload shape (Bank78):
 * {
 *   event: "wallet.credit",
 *   data: {
 *     userId / accountReference,  // "ZIDWELL-<uuid>" or uuid
 *     accountNumber,
 *     amount,
 *     fee,
 *     transactionId,
 *     reference,
 *     narration,
 *     sender: { name, bankName, accountNumber }
 *   }
 * }
 */
export async function processBank78WalletCredit(payload: any) {
  const d = payload.data || payload;

  // Resolve the internal user id
  const rawRef = d.userId || d.accountReference || d.aliasAccountReference;
  const internalUserId = String(rawRef || "").replace(/^ZIDWELL-/, "");

  if (!internalUserId) {
    return { ok: false, error: "Missing user reference" };
  }

  const transactionId = d.transactionId || d.id || d.reference;
  if (!transactionId) {
    return { ok: false, error: "Missing transaction id" };
  }

  const grossAmount = Number(d.amount ?? d.transactionAmount ?? 0);
  const bank78Fee = Number(d.fee ?? 0);
  const netAmount = grossAmount - bank78Fee;

  if (grossAmount <= 0) {
    return { ok: false, error: "Invalid amount" };
  }

  // Idempotency — skip if this provider transaction already recorded
  const { data: existing } = await supabase
    .from("transactions")
    .select("id")
    .eq("provider", "bank78")
    .eq("provider_transaction_id", transactionId)
    .maybeSingle();

  if (existing) {
    return { ok: true, message: "Already recorded" };
  }

  // Verify the user exists
  const { data: user } = await supabase
    .from("users")
    .select("id, wallet_balance, email")
    .eq("id", internalUserId)
    .single();

  if (!user) {
    console.error("[bank78 credit] user not found:", internalUserId);
    return { ok: false, error: "User not found" };
  }

  const balanceBefore = Number(user.wallet_balance || 0);
  const balanceAfter = balanceBefore + netAmount;

  const sender = d.sender || {};
  const metadata = {
    deposit_source: "bank78_virtual_account",
    account_number: d.accountNumber || d.aliasAccountNumber || null,
    account_name: d.accountName || d.aliasAccountName || null,
    sender_name: sender.name || d.senderName || "Bank Transfer",
    sender_bank: sender.bankName || d.senderBank || null,
    sender_account: sender.accountNumber || d.senderAccountNumber || null,
    narration: d.narration || null,
    gross_amount: grossAmount,
    bank78_fee: bank78Fee,
    net_amount: netAmount,
    received_at: new Date().toISOString(),
  };

  // 1. Insert transaction row
  const { data: tx, error: txErr } = await supabase
    .from("transactions")
    .insert({
      user_id: internalUserId,
      type: "deposit",
      amount: grossAmount,
      fee: bank78Fee,
      net_amount: netAmount,
      gross_amount: grossAmount,
      status: "success",
      reference: `B78-DEP-${transactionId}`,
      description: `Wallet funding from ${metadata.sender_name}`,
      narration: d.narration || "Wallet funding",
      channel: "bank78_virtual_account",
      provider: "bank78",
      provider_transaction_id: transactionId,
      sender: {
        name: metadata.sender_name,
        bank: metadata.sender_bank,
        account_number: metadata.sender_account,
      },
      receiver: {
        user_id: internalUserId,
        account_number: metadata.account_number,
        account_name: metadata.account_name,
      },
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      metadata,
      external_response: payload,
    })
    .select("id")
    .single();

  if (txErr || !tx) {
    console.error("[bank78 credit] tx insert failed:", txErr);
    return { ok: false, error: "Failed to record transaction" };
  }

  // 2. Credit wallet (atomic RPC if you have it, else direct update)
  const { error: rpcErr } = await supabase.rpc("mutate_wallet_balance", {
    p_user_id: internalUserId,
    p_amount: netAmount,
    p_transaction_id: tx.id,
    p_reason: "bank78_deposit",
  });

  if (rpcErr) {
    console.warn("[bank78 credit] RPC failed, fallback direct update");
    await supabase
      .from("users")
      .update({
        wallet_balance: balanceAfter,
        wallet_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", internalUserId);
  }

  // 3. Email
  sendBank78DepositEmail({
    userId: internalUserId,
    amount: grossAmount,
    fee: bank78Fee,
    netAmount,
    senderName: metadata.sender_name,
    senderBank: metadata.sender_bank,
    narration: metadata.narration,
    transactionId,
  }).catch((err) => console.error("deposit email failed:", err));

  return {
    ok: true,
    message: "Wallet credited",
    userId: internalUserId,
    netAmount,
    newBalance: balanceAfter,
  };
}