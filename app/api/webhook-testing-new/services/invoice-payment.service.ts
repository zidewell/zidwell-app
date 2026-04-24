import { createClient } from "@supabase/supabase-js";
import { sendPaymentSuccessEmail } from "@/lib/invoice-email-confirmation";
import { sendInvoiceCreatorNotificationEmail } from "../helpers/email-helpers";
import { updateInvoiceTotals } from "../helpers/invoice-helpers";
import { sendTransactionReceipt } from "../helpers/receipt-helpers";

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

  // Send TRANSACTION RECEIPT to payer (NEW FEATURE)
  await sendTransactionReceipt(
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