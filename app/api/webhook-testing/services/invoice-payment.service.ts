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

export async function processInvoicePayment(payload: any, params: InvoicePaymentParams) {
  const {
    nombaTransactionId,
    transactionAmount,
    nombaFee,
    orderReference,
    customer,
    tx
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

  // Check for duplicate payment
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

  // FIXED: Get customer email and name from correct sources
  const orderData = payload.data?.order || {};
  const customerEmail = orderData.customerEmail || customer.email || invoice.client_email;
  const customerName = orderData.customerName || customer.name || invoice.client_name || "Customer";
  const netAmount = transactionAmount - nombaFee;

  // Create payment record
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

  // Create transaction record
  await supabase.from("transactions").insert({
    user_id: invoice.user_id,
    type: "credit",
    amount: netAmount,
    gross_amount: transactionAmount,
    fee: nombaFee,
    status: "success",
    reference: `INV-${invoice.invoice_id}-${nombaTransactionId}`,
    description: `Payment received for invoice ${invoice.invoice_id} from ${customerName}`,
    channel: "invoice_payment",
    sender: { name: customerName, email: customerEmail },
    receiver: { name: invoice.from_name, email: invoice.from_email },
    external_response: {
      nomba_transaction_id: nombaTransactionId,
      nomba_fee: nombaFee,
    },
  });

  // Credit wallet
  const { error: creditError } = await supabase.rpc("increment_wallet_balance", {
    user_id: invoice.user_id,
    amt: netAmount,
  });

  if (creditError) {
    console.error("Failed to credit wallet:", creditError);
  } else {
    console.log(`✅ Credited ₦${netAmount} (after ₦${nombaFee} fee) to user ${invoice.user_id}`);
  }

  // Update invoice totals
  const { newStatus } = await updateInvoiceTotals(invoice, transactionAmount);

  // Send payment success email to customer
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

  // Send notification to invoice creator
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

export async function processVirtualAccountInvoicePayment(payload: any, params: VirtualAccountInvoiceParams) {
  const {
    aliasAccountReference,
    nombaTransactionId,
    transactionAmount,
    nombaFee,
    customer,
    tx,
    invoiceRef
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
  
  // Extract invoice reference from narration if not provided
  let extractedInvoiceRef = invoiceRef;
  if (!extractedInvoiceRef) {
    extractedInvoiceRef = extractInvoiceReference(narration);
  }

  if (!extractedInvoiceRef) {
    console.log("⚠️ No invoice reference found in narration");
    return { error: "No invoice reference found" };
  }

  // Normalize the invoice reference (remove separators)
  const normalizedRef = extractedInvoiceRef.replace(/[_-]/g, '').toUpperCase();
  console.log("🔍 Normalized reference:", normalizedRef);

  let invoice = null;

  // METHOD 1: Try exact match first
  const { data: exactMatch } = await supabase
    .from("invoices")
    .select("*")
    .eq("invoice_id", extractedInvoiceRef)
    .single();

  if (exactMatch) {
    invoice = exactMatch;
    console.log("✅ Found invoice by exact match:", invoice.invoice_id);
  }

  // METHOD 2: If not found, try normalized match
  if (!invoice) {
    console.log("🔍 No exact match, trying normalized match...");
    
    // Get all invoices that start with INV
    const { data: allInvoices } = await supabase
      .from("invoices")
      .select("*")
      .ilike("invoice_id", "INV%");

    if (allInvoices && allInvoices.length > 0) {
      // Find invoice where normalized invoice_id matches normalized reference
      invoice = allInvoices.find(inv => {
        const normalizedInvoiceId = inv.invoice_id.replace(/[_-]/g, '').toUpperCase();
        return normalizedInvoiceId === normalizedRef;
      });

      if (invoice) {
        console.log("✅ Found invoice by normalized match:", invoice.invoice_id);
        console.log(`   (${invoice.invoice_id} matched ${extractedInvoiceRef})`);
      }
    }
  }

  // METHOD 3: Try variations with underscores and dashes
  if (!invoice) {
    console.log("🔍 Trying variations with underscores and dashes...");
    
    const variations = [
      extractedInvoiceRef,
      extractedInvoiceRef.replace(/^INV/, 'INV_'),
      extractedInvoiceRef.replace(/^INV/, 'INV-'),
      extractedInvoiceRef.replace(/_/g, ''),
      extractedInvoiceRef.replace(/-/g, ''),
      // Also try with INV prefix variations
      `INV${extractedInvoiceRef.replace(/^INV[_-]?/, '')}`,
      `INV_${extractedInvoiceRef.replace(/^INV[_-]?/, '')}`,
      `INV-${extractedInvoiceRef.replace(/^INV[_-]?/, '')}`,
    ];

    // Remove duplicates
    const uniqueVariations = [...new Set(variations)];
    console.log("🔍 Trying variations:", uniqueVariations);

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

  // METHOD 4: Try to find by searching in narration pattern
  if (!invoice) {
    console.log("🔍 Trying to find invoice by pattern search...");
    
    // Try to find any invoice that matches the pattern
    const { data: allInvoices } = await supabase
      .from("invoices")
      .select("*")
      .ilike("invoice_id", "INV%");

    if (allInvoices && allInvoices.length > 0) {
      // Try to match by checking if any invoice ID is contained in the narration
      for (const inv of allInvoices) {
        const invoiceIdPattern = inv.invoice_id.replace(/[_-]/g, '').toUpperCase();
        if (normalizedRef.includes(invoiceIdPattern) || invoiceIdPattern.includes(normalizedRef)) {
          invoice = inv;
          console.log("✅ Found invoice by pattern search:", invoice.invoice_id);
          console.log(`   (${invoice.invoice_id} matched ${extractedInvoiceRef})`);
          break;
        }
      }
    }
  }

  if (!invoice) {
    console.log("⚠️ No invoice found for reference:", extractedInvoiceRef);
    console.log("   Tried exact match, normalized match, variations, and pattern search");
    return { error: "Invoice not found" };
  }

  console.log("✅ Found invoice for VA payment:", {
    invoice_id: invoice.invoice_id,
    owner_id: invoice.user_id,
    depositor_id: userId,
  });

  // Check for duplicate payment
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

  // Get customer email
  const customerEmail = customer.email || invoice.client_email;
  const customerName = senderName;

  // Create payment record
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

  // Create transaction record
  await supabase.from("transactions").insert({
    user_id: creditUserId,
    type: "credit",
    amount: transactionAmount,
    fee: nombaFee,
    net_amount: netAmount,
    status: "success",
    reference: `VA-INV-${invoice.invoice_id}-${nombaTransactionId}`,
    description: `Payment received for invoice ${invoice.invoice_id} via virtual account from ${senderName}`,
    channel: "virtual_account",
    sender: {
      name: senderName,
      bank: customer.bankName,
      user_id: isCrossUser ? userId : null
    },
    receiver: {
      name: invoice.from_name,
      email: invoice.from_email
    },
    external_response: {
      nomba_transaction_id: nombaTransactionId,
      nomba_fee: nombaFee,
      gross_amount: transactionAmount,
      net_amount: netAmount,
      is_cross_user: isCrossUser
    },
  });

  // Credit wallet
  const { error: creditError } = await supabase.rpc("increment_wallet_balance", {
    user_id: creditUserId,
    amt: netAmount,
  });

  if (creditError) {
    console.error("❌ Failed to credit invoice owner:", creditError);
    // Fallback: Update wallet directly
    const { data: user } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", creditUserId)
      .single();
    
    if (user) {
      const newBalance = Number(user.wallet_balance) + netAmount;
      await supabase
        .from("users")
        .update({ wallet_balance: newBalance })
        .eq("id", creditUserId);
    }
  } else {
    console.log(`✅ Credited ₦${netAmount} (after ₦${nombaFee} fee) to invoice owner ${creditUserId}`);
  }

  // Update invoice totals
  await updateInvoiceTotals(invoice, transactionAmount);

  // Send TRANSACTION RECEIPT to payer
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

  // Send notification to invoice creator
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

  // Send deposit email to depositor if cross-user
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