// app/api/webhook/services/invoice-payment.service.ts

import { createClient } from "@supabase/supabase-js";
import { sendPaymentSuccessEmail } from "@/lib/invoice-email-confirmation";
import { sendInvoiceCreatorNotificationEmail, sendVirtualAccountDepositEmail } from "../helpers/email-helpers";
import { updateInvoiceTotals } from "../helpers/invoice-helpers";
import { sendTransactionReceiptWithPDF } from "@/lib/generate-payment-receipts-pdf";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface InvoicePaymentParams {
  nombaTransactionId: string;
  transactionAmount: number;
  nombaFee: number;
  orderReference: string;
  customer: any;
  tx: any;
}

interface VirtualAccountInvoiceParams {
  aliasAccountReference: string;
  nombaTransactionId: string;
  transactionAmount: number;
  nombaFee: number;
  customer: any;
  tx: any;
  invoiceRef: string;
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

// ============================================================
// HELPER: Credit a user's wallet with full audit trail
// Uses mutate_wallet_balance which writes balance_before/after
// and merges metadata onto the transaction row.
// ============================================================
async function creditWalletWithAudit(
  userId: string,
  amount: number,
  transactionReference: string,
  reason: string,
): Promise<{ newBalance: number | null; error: any }> {
  const { data: txRow, error: fetchError } = await supabase
    .from("transactions")
    .select("id")
    .eq("reference", transactionReference)
    .maybeSingle();

  if (fetchError || !txRow) {
    console.error("❌ Cannot find transaction for wallet credit:", fetchError);
    return { newBalance: null, error: fetchError || new Error("Tx not found") };
  }

  const { data: newBalance, error: creditError } = await supabase.rpc(
    "mutate_wallet_balance",
    {
      p_user_id: userId,
      p_amount: amount,
      p_transaction_id: txRow.id,
      p_reason: reason,
    }
  );

  if (creditError) {
    console.error("❌ mutate_wallet_balance failed:", creditError);

    // Fallback — direct update + manual audit
    const { data: user } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", userId)
      .single();

    if (user) {
      const before = Number(user.wallet_balance);
      const after = before + amount;

      await supabase
        .from("users")
        .update({
          wallet_balance: after,
          wallet_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      await supabase
        .from("transactions")
        .update({
          balance_before: before,
          balance_after: after,
          updated_at: new Date().toISOString(),
        })
        .eq("id", txRow.id);

      return { newBalance: after, error: null };
    }

    return { newBalance: null, error: creditError };
  }

  return { newBalance, error: null };
}

// ============================================================
// CARD / PAYMENT PAGE INVOICE PAYMENT
// ============================================================
export async function processInvoicePayment(payload: any, params: InvoicePaymentParams) {
  const {
    nombaTransactionId,
    transactionAmount,
    nombaFee,
    orderReference,
    customer,
    tx,
  } = params;

  console.log("🧾 Processing invoice payment...");

  let invoiceId = payload.data?.order?.metadata?.invoiceId || orderReference;

  if (!invoiceId) {
    console.error("No invoice ID found");
    return { error: "No invoice ID" };
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*")
    .eq("invoice_id", invoiceId)
    .single();

  if (invoiceError || !invoice) {
    console.error("Invoice not found:", invoiceId);
    return { error: "Invoice not found" };
  }

  console.log("✅ Found invoice:", invoice.invoice_id);

  const { data: existingPayment } = await supabase
    .from("invoice_payments")
    .select("*")
    .eq("nomba_transaction_id", nombaTransactionId)
    .maybeSingle();

  if (existingPayment) {
    console.log("⚠️ Duplicate payment, updating totals only");
    await updateInvoiceTotals(invoice, transactionAmount);
    return { success: true };
  }

  const orderData = payload.data?.order || {};
  const customerEmail = orderData.customerEmail || customer.email || invoice.client_email;
  const customerName = orderData.customerName || customer.name || invoice.client_name || "Customer";
  const netAmount = transactionAmount - nombaFee;

  // ── 1. Payment record ──
  const { error: paymentError } = await supabase
    .from("invoice_payments")
    .insert({
      invoice_id: invoice.id,
      user_id: invoice.user_id,
      order_reference: orderReference || nombaTransactionId,
      payer_email: customerEmail,
      payer_name: customerName,
      amount: transactionAmount,
      paid_amount: transactionAmount,
      nomba_fee: nombaFee,
      net_amount: netAmount,
      status: "completed",
      nomba_transaction_id: nombaTransactionId,
      payment_method: "card_payment",
      paid_at: new Date().toISOString(),
    });

  if (paymentError) {
    console.error("Failed to create payment record:", paymentError);
    return { error: "Payment record failed" };
  }

  // ── 2. Transaction record with metadata ──
  const txReference = `INV-${invoice.invoice_id}-${nombaTransactionId}`;

  const txMetadata = {
    invoice_id: invoice.invoice_id,
    invoice_db_id: invoice.id,
    payer_name: customerName,
    payer_email: customerEmail,
    gross_amount: transactionAmount,
    nomba_fee: nombaFee,
    net_amount: netAmount,
    nomba_transaction_id: nombaTransactionId,
    payment_method: "card_payment",
    order_reference: orderReference || null,
    invoice_owner_id: invoice.user_id,
    received_at: new Date().toISOString(),
  };

  await supabase.from("transactions").insert({
    user_id: invoice.user_id,
    type: "credit",
    amount: netAmount,
    gross_amount: transactionAmount,
    fee: nombaFee,
    net_amount: netAmount,
    status: "success",
    reference: txReference,
    description: `Payment received for invoice ${invoice.invoice_id} from ${customerName}`,
    narration: tx.narration || "N/A",
    channel: "invoice_payment",
    sender: { name: customerName, email: customerEmail },
    receiver: { name: invoice.from_name, email: invoice.from_email },
    metadata: txMetadata,
    external_response: {
      nomba_transaction_id: nombaTransactionId,
      nomba_fee: nombaFee,
    },
  });

  // ── 3. Credit wallet with audit trail ──
  const { newBalance, error: creditError } = await creditWalletWithAudit(
    invoice.user_id,
    netAmount,
    txReference,
    "invoice_payment_card",
  );

  if (creditError) {
    console.error("Failed to credit wallet:", creditError);
  } else {
    console.log(`✅ Credited ₦${netAmount} (after ₦${nombaFee} fee) to user ${invoice.user_id}. New balance: ₦${newBalance}`);
  }

  // ── 4. Update invoice totals ──
  await updateInvoiceTotals(invoice, transactionAmount);

  // ── 5. Emails ──
  if (customerEmail) {
    sendPaymentSuccessEmail(
      customerEmail,
      invoice.invoice_id,
      transactionAmount,
      customerName,
      invoice,
    ).catch(console.error);
  }

  await sendTransactionReceiptWithPDF(
    customerEmail,
    customerName,
    invoice,
    {
      amount: transactionAmount,
      nombaFee,
      netAmount,
      transactionId: nombaTransactionId,
      paymentMethod: "card_payment",
      paidAt: new Date().toISOString(),
      narration: tx.narration,
    }
  );

  const { data: creator } = await supabase
    .from("users")
    .select("email")
    .eq("id", invoice.user_id)
    .single();

  if (creator?.email) {
    sendInvoiceCreatorNotificationEmail(
      creator.email,
      invoice.invoice_id,
      netAmount,
      customerName,
      invoice,
      nombaFee,
    ).catch(console.error);
  }

  return { success: true };
}

// ============================================================
// VIRTUAL ACCOUNT INVOICE PAYMENT
// ============================================================
export async function processVirtualAccountInvoicePayment(payload: any, params: VirtualAccountInvoiceParams) {
  const {
    aliasAccountReference,
    nombaTransactionId,
    transactionAmount,
    nombaFee,
    customer,
    tx,
    invoiceRef,
  } = params;

  console.log("🏦 Processing virtual account invoice payment...");
  console.log("🔍 Virtual Account Invoice Details:", {
    userId: aliasAccountReference,
    amount: transactionAmount,
    nombaFee,
    narration: tx.narration,
    invoiceRef,
  });

  const userId = aliasAccountReference;
  const narration = tx.narration || "";
  const senderName = customer.senderName || customer.name || "Bank Transfer";
  const netAmount = transactionAmount - nombaFee;

  let extractedInvoiceRef = invoiceRef;
  if (!extractedInvoiceRef) {
    extractedInvoiceRef = extractInvoiceReference(narration);
  }

  if (!extractedInvoiceRef) {
    console.log("⚠️ No invoice reference found in narration");
    return { error: "No invoice reference found" };
  }

  const normalizedRef = extractedInvoiceRef.replace(/[_-]/g, '').toUpperCase();
  console.log("🔍 Normalized reference:", normalizedRef);

  let invoice = null;

  // METHOD 1: exact match
  const { data: exactMatch } = await supabase
    .from("invoices")
    .select("*")
    .eq("invoice_id", extractedInvoiceRef)
    .single();

  if (exactMatch) {
    invoice = exactMatch;
    console.log("✅ Found invoice by exact match:", invoice.invoice_id);
  }

  // METHOD 2: normalized match
  if (!invoice) {
    const { data: allInvoices } = await supabase
      .from("invoices")
      .select("*")
      .ilike("invoice_id", "INV%");

    if (allInvoices && allInvoices.length > 0) {
      invoice = allInvoices.find(inv => {
        const normalizedInvoiceId = inv.invoice_id.replace(/[_-]/g, '').toUpperCase();
        return normalizedInvoiceId === normalizedRef;
      });

      if (invoice) {
        console.log("✅ Found invoice by normalized match:", invoice.invoice_id);
      }
    }
  }

  // METHOD 3: variations
  if (!invoice) {
    const variations = [
      extractedInvoiceRef,
      extractedInvoiceRef.replace(/^INV/, 'INV_'),
      extractedInvoiceRef.replace(/^INV/, 'INV-'),
      extractedInvoiceRef.replace(/_/g, ''),
      extractedInvoiceRef.replace(/-/g, ''),
      `INV${extractedInvoiceRef.replace(/^INV[_-]?/, '')}`,
      `INV_${extractedInvoiceRef.replace(/^INV[_-]?/, '')}`,
      `INV-${extractedInvoiceRef.replace(/^INV[_-]?/, '')}`,
    ];

    const uniqueVariations = [...new Set(variations)];

    for (const variation of uniqueVariations) {
      const { data: found } = await supabase
        .from("invoices")
        .select("*")
        .eq("invoice_id", variation)
        .single();

      if (found) {
        invoice = found;
        console.log("✅ Found invoice by variation:", variation);
        break;
      }
    }
  }

  // METHOD 4: pattern search
  if (!invoice) {
    const { data: allInvoices } = await supabase
      .from("invoices")
      .select("*")
      .ilike("invoice_id", "INV%");

    if (allInvoices && allInvoices.length > 0) {
      for (const inv of allInvoices) {
        const invoiceIdPattern = inv.invoice_id.replace(/[_-]/g, '').toUpperCase();
        if (normalizedRef.includes(invoiceIdPattern) || invoiceIdPattern.includes(normalizedRef)) {
          invoice = inv;
          console.log("✅ Found invoice by pattern search:", invoice.invoice_id);
          break;
        }
      }
    }
  }

  if (!invoice) {
    console.log("⚠️ No invoice found for reference:", extractedInvoiceRef);
    return { error: "Invoice not found" };
  }

  console.log("✅ Found invoice for VA payment:", {
    invoice_id: invoice.invoice_id,
    owner_id: invoice.user_id,
    depositor_id: userId,
  });

  const { data: existingPayment } = await supabase
    .from("invoice_payments")
    .select("*")
    .eq("nomba_transaction_id", nombaTransactionId)
    .maybeSingle();

  if (existingPayment) {
    console.log("⚠️ Duplicate VA invoice payment, updating totals only");
    await updateInvoiceTotals(invoice, transactionAmount);
    return { success: true };
  }

  const customerEmail = customer.email || invoice.client_email;
  const customerName = senderName;

  // ── 1. Payment record ──
  const { error: paymentError } = await supabase
    .from("invoice_payments")
    .insert({
      invoice_id: invoice.id,
      user_id: invoice.user_id,
      order_reference: nombaTransactionId,
      payer_name: senderName,
      payer_email: customerEmail,
      amount: transactionAmount,
      paid_amount: transactionAmount,
      fee_amount: nombaFee,
      nomba_fee: nombaFee,
      net_amount: netAmount,
      user_received: netAmount,
      platform_fee: 0,
      status: "completed",
      nomba_transaction_id: nombaTransactionId,
      payment_method: "virtual_account",
      narration,
      paid_at: new Date().toISOString(),
      payment_link: `INV-${invoice.invoice_id}-${nombaTransactionId.substring(0, 8)}`,
      is_partial_payment: false,
      remaining_balance: 0,
      payment_attempts: 0,
      is_reusable: false,
      bank_name: customer.bankName || null,
      bank_account: customer.accountNumber || null,
      payer_phone: null,
    });

  if (paymentError) {
    console.error("❌ Failed to create VA invoice payment:", paymentError);
    return { error: "Payment record failed" };
  }

  console.log("✅ VA invoice payment created successfully");

  const creditUserId = invoice.user_id;
  const isCrossUser = invoice.user_id !== userId;

  // ── 2. Transaction with metadata ──
  const txReference = `VA-INV-${invoice.invoice_id}-${nombaTransactionId}`;

  const txMetadata = {
    invoice_id: invoice.invoice_id,
    invoice_db_id: invoice.id,
    payer_name: senderName,
    payer_email: customerEmail,
    payer_bank: customer.bankName || null,
    payer_account: customer.accountNumber || null,
    gross_amount: transactionAmount,
    nomba_fee: nombaFee,
    net_amount: netAmount,
    nomba_transaction_id: nombaTransactionId,
    payment_method: "virtual_account",
    is_cross_user: isCrossUser,
    depositor_user_id: isCrossUser ? userId : null,
    invoice_owner_id: invoice.user_id,
    narration,
    received_at: new Date().toISOString(),
  };

  await supabase.from("transactions").insert({
    user_id: creditUserId,
    type: "credit",
    amount: transactionAmount,
    fee: nombaFee,
    net_amount: netAmount,
    gross_amount: transactionAmount,
    status: "success",
    reference: txReference,
    description: `Payment received for invoice ${invoice.invoice_id} via virtual account from ${senderName}`,
    narration: narration || "N/A",
    channel: "virtual_account",
    sender: {
      name: senderName,
      bank: customer.bankName,
      account_number: customer.accountNumber || null,
      user_id: isCrossUser ? userId : null,
    },
    receiver: {
      name: invoice.from_name,
      email: invoice.from_email,
      user_id: creditUserId,
    },
    metadata: txMetadata,
    external_response: {
      nomba_transaction_id: nombaTransactionId,
      nomba_fee: nombaFee,
      gross_amount: transactionAmount,
      net_amount: netAmount,
      is_cross_user: isCrossUser,
    },
  });

  // ── 3. Credit wallet with audit ──
  const { newBalance, error: creditError } = await creditWalletWithAudit(
    creditUserId,
    netAmount,
    txReference,
    "invoice_payment_va",
  );

  if (creditError) {
    console.error("❌ Failed to credit invoice owner:", creditError);
  } else {
    console.log(`✅ Credited ₦${netAmount} (after ₦${nombaFee} fee) to invoice owner ${creditUserId}. New balance: ₦${newBalance}`);
  }

  // ── 4. Update invoice totals ──
  await updateInvoiceTotals(invoice, transactionAmount);

  // ── 5. Emails ──
  if (customerEmail) {
    await sendTransactionReceiptWithPDF(
      customerEmail,
      senderName,
      invoice,
      {
        amount: transactionAmount,
        nombaFee,
        netAmount,
        transactionId: nombaTransactionId,
        paymentMethod: "virtual_account",
        paidAt: new Date().toISOString(),
        narration,
      }
    );
  }

  const { data: creator } = await supabase
    .from("users")
    .select("email")
    .eq("id", invoice.user_id)
    .single();

  if (creator?.email) {
    sendInvoiceCreatorNotificationEmail(
      creator.email,
      invoice.invoice_id,
      netAmount,
      senderName,
      invoice,
      nombaFee,
    ).catch(console.error);
  }

  if (isCrossUser) {
    const { data: depositorUser, error: depositorError } = await supabase
      .from("users")
      .select("id, email")
      .eq("id", userId)
      .single();

    if (depositorError || !depositorUser) {
      console.error("❌ Cannot find depositor user for ID:", userId, depositorError);
    } else {
      console.log("✅ Found depositor user, sending email to:", depositorUser.email);
      await sendVirtualAccountDepositEmail(
        depositorUser.id,
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
  }

  return {
    success: true,
    message: "Invoice payment via virtual account processed",
    gross_amount: transactionAmount,
    fee_deducted: nombaFee,
    net_credit: netAmount,
  };
}