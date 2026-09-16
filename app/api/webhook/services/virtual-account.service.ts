// app/api/webhook/services/virtual-account.service.ts

import { createClient } from "@supabase/supabase-js";
import { sendVirtualAccountDepositEmail } from "../helpers/email-helpers";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface VirtualAccountParams {
  aliasAccountReference: string;
  nombaTransactionId: string;
  transactionAmount: number;
  nombaFee: number;
  customer: any;
  tx: any;
}

function extractInvoiceReference(narration: string): string | null {
  const patterns = [
    /INV[A-Za-z0-9]+/,
    /INV_[A-Za-z0-9]+/,
    /INV-[A-Za-z0-9]+/,
    /INVOICE[A-Za-z0-9]+/,
    /INVOICE_[A-Za-z0-9]+/,
    /INVOICE-[A-Za-z0-9]+/,
  ];

  for (const pattern of patterns) {
    const match = narration.match(pattern);
    if (match) {
      console.log(`✅ Extracted invoice reference: ${match[0]} from pattern ${pattern}`);
      return match[0];
    }
  }

  return null;
}

export async function processVirtualAccountDeposit(payload: any, params: VirtualAccountParams) {
  const {
    aliasAccountReference,
    nombaTransactionId,
    transactionAmount,
    nombaFee,
    customer,
    tx,
  } = params;

  console.log("🏦 Processing virtual account deposit...");
  console.log("🔍 Virtual Account Details:", {
    userId: aliasAccountReference,
    amount: transactionAmount,
    nombaFee,
    narration: tx.narration,
  });

  const userId = aliasAccountReference;
  const narration = tx.narration || "";
  const senderName = customer.senderName || customer.name || "Bank Transfer";
  const netAmount = transactionAmount - nombaFee;

  const invoiceMatch = extractInvoiceReference(narration);

  if (invoiceMatch) {
    console.log("🧾 Invoice payment detected, delegating to invoice service...");
    const { processVirtualAccountInvoicePayment } = await import('./invoice-payment.service');
    return processVirtualAccountInvoicePayment(payload, {
      aliasAccountReference,
      nombaTransactionId,
      transactionAmount,
      nombaFee,
      customer,
      tx,
      invoiceRef: invoiceMatch,
    });
  }

  console.log("💰 Regular wallet deposit via virtual account");

  const { data: existingTx } = await supabase
    .from("transactions")
    .select("*")
    .eq("merchant_tx_ref", nombaTransactionId)
    .maybeSingle();

  if (existingTx) {
    console.log("⚠️ Duplicate VA deposit detected, skipping");
    return {
      success: true,
      message: "Virtual account deposit already processed",
      gross_amount: transactionAmount,
      fee_deducted: nombaFee,
      net_credit: netAmount,
    };
  }

  // ✅ Build rich metadata
  const txMetadata = {
    deposit_source: "virtual_account",
    nomba_transaction_id: nombaTransactionId,
    gross_amount: transactionAmount,
    nomba_fee: nombaFee,
    net_amount: netAmount,
    sender_name: senderName,
    sender_bank: customer.bankName || null,
    sender_bank_code: customer.bankCode || null,
    sender_account_number: customer.accountNumber || null,
    narration: narration || null,
    alias_account_reference: aliasAccountReference,
    alias_account_number: tx.aliasAccountNumber || null,
    alias_account_name: tx.aliasAccountName || null,
    received_at: new Date().toISOString(),
  };

  // ✅ Create the transaction row
  const { data: newTx, error: txError } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      type: "virtual_account_deposit",
      amount: transactionAmount,
      fee: nombaFee,
      net_amount: netAmount,
      gross_amount: transactionAmount,
      status: "success",
      reference: nombaTransactionId,
      merchant_tx_ref: nombaTransactionId,
      description: "Virtual account deposit",
      narration: narration || "N/A",
      channel: "virtual_account",
      sender: {
        name: senderName,
        bank: customer.bankName || null,
        account_number: customer.accountNumber || null,
        bank_code: customer.bankCode || null,
      },
      receiver: {
        user_id: userId,
        account_number: tx.aliasAccountNumber || null,
        account_name: tx.aliasAccountName || null,
      },
      metadata: txMetadata,
      external_response: {
        nomba_transaction_id: nombaTransactionId,
        nomba_fee: nombaFee,
        gross_amount: transactionAmount,
        net_amount: netAmount,
      },
    })
    .select("id")
    .single();

  if (txError || !newTx) {
    console.error("❌ Failed to create VA transaction:", txError);
    return { error: "Failed to create transaction" };
  }

  // ✅ Credit wallet atomically — records balance_before / balance_after / metadata
  const { data: newBalance, error: creditError } = await supabase.rpc(
    "mutate_wallet_balance",
    {
      p_user_id: userId,
      p_amount: netAmount,                // positive = credit
      p_transaction_id: newTx.id,
      p_reason: "virtual_account_deposit",
    }
  );

  if (creditError) {
    console.error("❌ Failed to credit wallet:", creditError);

    // Fallback (rare — mutate_wallet_balance is preferred)
    const { data: user } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", userId)
      .single();

    if (user) {
      const fallbackBalance = Number(user.wallet_balance) + netAmount;
      await supabase
        .from("users")
        .update({ wallet_balance: fallbackBalance })
        .eq("id", userId);

      await supabase
        .from("transactions")
        .update({
          balance_before: Number(user.wallet_balance),
          balance_after: fallbackBalance,
          metadata: txMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq("id", newTx.id);
    }
  } else {
    console.log(
      `✅ Credited ₦${netAmount} (after ₦${nombaFee} fee) to wallet ${userId}. New balance: ₦${newBalance}`
    );
  }

  // ✅ Send deposit email
  const { data: userExists, error: userError } = await supabase
    .from("users")
    .select("id, email")
    .eq("id", userId)
    .single();

  if (userError || !userExists) {
    console.error("❌ Cannot find user for ID:", userId, userError);
  } else {
    console.log("✅ Found user, sending deposit email to:", userExists.email);
    await sendVirtualAccountDepositEmail(
      userExists.id,
      transactionAmount,
      nombaTransactionId,
      customer.bankName || "N/A",
      tx.aliasAccountNumber || "N/A",
      tx.aliasAccountName || "N/A",
      senderName,
      narration,
      nombaFee,
    ).catch(console.error);
  }

  return {
    success: true,
    message: "Virtual account deposit processed",
    gross_amount: transactionAmount,
    fee_deducted: nombaFee,
    net_credit: netAmount,
  };
}