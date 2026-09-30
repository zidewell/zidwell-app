// app/api/webhook/services/virtual-account.service.ts

import { createClient } from "@supabase/supabase-js";
import { sendVirtualAccountDepositEmail } from "../helpers/email-helpers";
import { TIER_CONFIG, type AccountTier } from "@/lib/fee";

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

// ─────────────────────────────────────────────────────────────
// Inflow fee resolver — tier-aware
// Only this amount is charged to the user.
// Nomba's fee is absorbed by Zidwell (recorded for accounting only).
// ─────────────────────────────────────────────────────────────
function getInflowFee(tier: AccountTier): number {
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG.tier_3;
  return config.inflowFee;
}

export async function processVirtualAccountDeposit(
  payload: any,
  params: VirtualAccountParams
) {
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

  // ─────────────────────────────────────────────────────────────
  // Invoice delegation (unchanged)
  // ─────────────────────────────────────────────────────────────
  const invoiceMatch = extractInvoiceReference(narration);
  if (invoiceMatch) {
    console.log("🧾 Invoice payment detected, delegating to invoice service...");
    const { processVirtualAccountInvoicePayment } = await import(
      "./invoice-payment.service"
    );
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

  // ─────────────────────────────────────────────────────────────
  // Duplicate guard
  // ─────────────────────────────────────────────────────────────
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
      inflow_fee: Number(existingTx.metadata?.zidwell_fee ?? 0),
      net_credit: Number(existingTx.net_amount ?? 0),
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Fetch user's tier (source of truth)
  // ─────────────────────────────────────────────────────────────
  const { data: userRow, error: userLookupError } = await supabase
    .from("users")
    .select("id, account_tier, email")
    .eq("id", userId)
    .single();

  if (userLookupError || !userRow) {
    console.error("❌ Cannot find user for ID:", userId, userLookupError);
  }

  const tier: AccountTier =
    (userRow?.account_tier as AccountTier) || "tier_3";

  // ─────────────────────────────────────────────────────────────
  // Inflow fee — ONLY the Zidwell tier fee is charged.
  //   inflowFee  = tier fee (₦50 / ₦100)
  //   netAmount  = transactionAmount − inflowFee
  //   nombaFee   = absorbed by Zidwell (recorded for accounting)
  // ─────────────────────────────────────────────────────────────
  const inflowFee = getInflowFee(tier);
  const netAmount = transactionAmount - inflowFee;

  if (netAmount <= 0) {
    console.error("❌ Inflow fee exceeds deposit — aborting credit", {
      transactionAmount,
      inflowFee,
    });
    return {
      error: "Inflow fee exceeds deposit amount",
      status: 400,
    };
  }

  console.log(
    `💵 Tier ${tier} inflow: gross=₦${transactionAmount}, inflow_fee=₦${inflowFee}, net=₦${netAmount}, nomba_absorbed=₦${nombaFee}`
  );

  // ─────────────────────────────────────────────────────────────
  // Build metadata (full audit trail)
  // ─────────────────────────────────────────────────────────────
  const txMetadata = {
    deposit_source: "virtual_account",
    nomba_transaction_id: nombaTransactionId,

    // Amounts
    gross_amount: transactionAmount,
    inflow_fee: inflowFee,       // what we charged the user
    zidwell_fee: inflowFee,      // alias for clarity
    nomba_fee: nombaFee,         // absorbed by Zidwell (for accounting)
    net_amount: netAmount,

    // Sender info
    sender_name: senderName,
    sender_bank: customer.bankName || null,
    sender_bank_code: customer.bankCode || null,
    sender_account_number: customer.accountNumber || null,
    narration: narration || null,

    // Recipient (VA) info
    alias_account_reference: aliasAccountReference,
    alias_account_number: tx.aliasAccountNumber || null,
    alias_account_name: tx.aliasAccountName || null,

    // Tier snapshot
    account_tier: tier,
    transfer_direction: "inflow",
    fee_label: `Inflow — ${TIER_CONFIG[tier].label} (₦${inflowFee} flat)`,

    received_at: new Date().toISOString(),
  };

  // ─────────────────────────────────────────────────────────────
  // Create transaction row
  //   fee        = inflowFee (only what we charged)
  //   net_amount = transactionAmount − inflowFee
  // ─────────────────────────────────────────────────────────────
  const { data: newTx, error: txError } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      type: "virtual_account_deposit",
      amount: transactionAmount,
      fee: inflowFee,
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
        inflow_fee: inflowFee,
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

  // ─────────────────────────────────────────────────────────────
  // Credit wallet atomically
  // ─────────────────────────────────────────────────────────────
  const { data: newBalance, error: creditError } = await supabase.rpc(
    "mutate_wallet_balance",
    {
      p_user_id: userId,
      p_amount: netAmount, // positive = credit
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
      `✅ Credited ₦${netAmount} (gross ₦${transactionAmount} − inflow_fee ₦${inflowFee}) to wallet ${userId}. New balance: ₦${newBalance}`
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Send deposit email
  // ─────────────────────────────────────────────────────────────
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
      inflowFee, // ← what the user was charged
    ).catch(console.error);
  }

  return {
    success: true,
    message: "Virtual account deposit processed",
    gross_amount: transactionAmount,
    inflow_fee: inflowFee,
    net_credit: netAmount,
    tier,
  };
}