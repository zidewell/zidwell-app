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
  // Try multiple patterns to match the invoice reference
  const patterns = [
    /INV[A-Za-z0-9]+/,        // INV... format
    /INV_[A-Za-z0-9]+/,       // INV_... format
    /INV-[A-Za-z0-9]+/,       // INV-... format
    /INVOICE[A-Za-z0-9]+/,    // INVOICE... format
    /INVOICE_[A-Za-z0-9]+/,   // INVOICE_... format
    /INVOICE-[A-Za-z0-9]+/,   // INVOICE-... format
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
    tx
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
  
  // Check if this is an invoice payment by looking for invoice reference in narration
  const invoiceMatch = extractInvoiceReference(narration);
  
  // If it's an invoice payment, delegate to invoice service
  if (invoiceMatch) {
    console.log("🧾 Invoice payment detected, delegating to invoice service...");
    // Import dynamically to avoid circular dependency
    const { processVirtualAccountInvoicePayment } = await import('./invoice-payment.service');
    return processVirtualAccountInvoicePayment(payload, {
      aliasAccountReference,
      nombaTransactionId,
      transactionAmount,
      nombaFee,
      customer,
      tx,
      invoiceRef: invoiceMatch
    });
  }

  // Regular wallet deposit (no invoice)
  console.log("💰 Regular wallet deposit via virtual account");

  const { data: existingTx } = await supabase
    .from("transactions")
    .select("*")
    .eq("merchant_tx_ref", nombaTransactionId)
    .maybeSingle();

  if (!existingTx) {
    const { error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: "virtual_account_deposit",
        amount: transactionAmount,
        fee: nombaFee,
        net_amount: netAmount,
        status: "success",
        reference: nombaTransactionId,
        merchant_tx_ref: nombaTransactionId,
        description: "Virtual account deposit",
        narration: narration,
        channel: "virtual_account",
        sender: {
          name: senderName,
          bank: customer.bankName,
          account_number: customer.accountNumber
        },
        external_response: {
          nomba_transaction_id: nombaTransactionId,
          nomba_fee: nombaFee,
          gross_amount: transactionAmount,
          net_amount: netAmount,
        },
      });

    if (txError) {
      console.error("❌ Failed to create VA transaction:", txError);
      return { error: "Failed to create transaction" };
    }

    // Credit wallet
    const { error: creditError } = await supabase.rpc("increment_wallet_balance", {
      user_id: userId,
      amt: netAmount,
    });

    if (creditError) {
      console.error("❌ Failed to credit wallet:", creditError);

      const { data: user } = await supabase
        .from("users")
        .select("wallet_balance")
        .eq("id", userId)
        .single();

      if (user) {
        const newBalance = Number(user.wallet_balance) + netAmount;
        await supabase
          .from("users")
          .update({ wallet_balance: newBalance })
          .eq("id", userId);
      }
    } else {
      console.log(`✅ Credited ₦${netAmount} (after ₦${nombaFee} fee) to wallet ${userId}`);
    }

    // Send deposit email for regular wallet deposit
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
  } else {
    console.log("⚠️ Duplicate VA deposit detected, skipping");
  }

  return {
    success: true,
    message: "Virtual account deposit processed",
    gross_amount: transactionAmount,
    fee_deducted: nombaFee,
    net_credit: netAmount,
  };
}