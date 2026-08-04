// lib/bank78/webhook-service.ts

import { createClient } from "@supabase/supabase-js";
import { sendVirtualAccountDepositEmail } from "@/app/api/webhook/helpers/email-helpers";
import { sendPaymentPageReceiptWithPDF } from "@/lib/generate-payment-receipts-pdf";
import { sendTransactionReceiptWithPDF } from "@/lib/generate-payment-receipts-pdf";
import { updateInvoiceTotals } from "@/app/api/webhook/helpers/invoice-helpers";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl = process.env.NODE_ENV === "development"
  ? process.env.NEXT_PUBLIC_DEV_URL
  : process.env.NEXT_PUBLIC_BASE_URL;

// ============================================================
// PROCESS BANK78 DEPOSIT (Regular Wallet)
// ============================================================
export async function processBank78Deposit(data: any, user: any) {
  const amount = parseFloat(data.amount);
  const transactionId = data.transactionId || data.paymentReference || `B78-${Date.now()}`;
  const narration = data.narration || data.description || "";
  const senderName = data.originatorAccountName || data.senderName || "Bank Transfer";
  const senderAccount = data.originatorAccountNumber || data.senderAccountNumber;
  const fee = parseFloat(data.fee || data.charges || 0);
  const netAmount = amount - fee;

  console.log(`💰 Processing Bank78 deposit for user ${user.id}: ₦${amount}`);

  // Check for duplicate transaction
  const { data: existingTx } = await supabase
    .from("transactions")
    .select("id")
    .eq("provider_transaction_id", transactionId)
    .eq("provider", "bank78")
    .maybeSingle();

  if (existingTx) {
    console.log(`⏭️ Duplicate Bank78 transaction: ${transactionId}`);
    return { success: true, message: "Already processed" };
  }

  // Create transaction
  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: "credit",
      provider: "bank78",
      provider_transaction_id: transactionId,
      amount: amount,
      fee: fee,
      net_amount: netAmount,
      status: "success",
      reference: `B78-${transactionId}`,
      description: `Bank78 deposit from ${senderName}`,
      narration: narration,
      channel: "bank78_deposit",
      sender: {
        name: senderName,
        account_number: senderAccount,
      },
      receiver: {
        user_id: user.id,
        account_number: data.accountNumber,
      },
      external_response: data,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (txError) {
    console.error("❌ Failed to create Bank78 transaction:", txError);
    return { error: "Failed to create transaction" };
  }

  // Credit user wallet
  const { error: creditError } = await supabase.rpc("increment_wallet_balance", {
    user_id: user.id,
    amt: netAmount,
  });

  if (creditError) {
    console.error("❌ Failed to credit wallet:", creditError);
    // Fallback: Direct update
    const { data: userData } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();
    
    if (userData) {
      const newBalance = Number(userData.wallet_balance) + netAmount;
      await supabase
        .from("users")
        .update({ wallet_balance: newBalance })
        .eq("id", user.id);
    }
  }

  console.log(`✅ Credited ₦${netAmount} to user ${user.id}`);

  // Send deposit email
  await sendVirtualAccountDepositEmail(
    user.id,
    amount,
    transactionId,
    "Bank78",
    data.accountNumber || "N/A",
    data.accountName || "N/A",
    senderName,
    narration,
    fee
  ).catch(console.error);

  return {
    success: true,
    message: "Bank78 deposit processed",
    credited_amount: netAmount,
    transaction_id: transaction.id,
  };
}

// ============================================================
// PROCESS BANK78 PAYMENT PAGE PAYMENT
// ============================================================
export async function processBank78PaymentPagePayment(data: any, user: any) {
  const amount = parseFloat(data.amount);
  const transactionId = data.transactionId || data.paymentReference || `B78-${Date.now()}`;
  const narration = data.narration || data.description || "";
  const senderName = data.originatorAccountName || data.senderName || "Bank Transfer";
  const fee = parseFloat(data.fee || data.charges || 0);
  const appFee = amount * 0.02; // 2% app fee
  const totalFee = fee + appFee;
  const netAmount = amount - totalFee;

  console.log(`📄 Processing Bank78 payment page payment: ₦${amount}`);

  // Extract payment page reference from narration
  const ppMatch = narration.match(/PP[_-]?([A-Z0-9]+)/i) || narration.match(/PPL([A-Z0-9]+)/i);
  if (!ppMatch) {
    console.error("❌ No payment page reference found in narration");
    return { error: "No payment page reference found" };
  }

  const pageReference = ppMatch[0];
  console.log(`🔍 Found payment page reference: ${pageReference}`);

  // Find payment page
  const { data: paymentPage, error: pageError } = await supabase
    .from("payment_pages")
    .select("id, title, user_id, page_type, metadata")
    .or(`metadata->paymentReference->>code.eq.${pageReference},id.ilike.%${pageReference}%`)
    .maybeSingle();

  if (pageError || !paymentPage) {
    console.error(`❌ Payment page not found: ${pageReference}`);
    return { error: "Payment page not found", status: 404 };
  }

  console.log(`✅ Found payment page: ${paymentPage.id} - ${paymentPage.title}`);

  // Find pending payment
  const { data: pendingPayment, error: pendingError } = await supabase
    .from("payment_page_payments")
    .select("*")
    .eq("payment_page_id", paymentPage.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let paymentResult;

  if (pendingPayment) {
    console.log(`✅ Found pending payment: ${pendingPayment.id}`);
    
    // Update payment to completed
    const { data: updated, error: updateError } = await supabase
      .from("payment_page_payments")
      .update({
        status: "completed",
        provider: "bank78",
        nomba_transaction_id: transactionId,
        paid_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        amount: amount,
        fee: totalFee,
        net_amount: netAmount,
        metadata: {
          ...pendingPayment.metadata,
          bank78_transaction_id: transactionId,
          bank78_data: data,
        },
        receipt_sent: false,
      })
      .eq("id", pendingPayment.id)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Failed to update payment:", updateError);
      return { error: "Failed to update payment" };
    }
    paymentResult = updated;
  } else {
    console.log("📝 Creating new payment record...");
    
    // Create new payment record
    const { data: created, error: createError } = await supabase
      .from("payment_page_payments")
      .insert({
        payment_page_id: paymentPage.id,
        user_id: paymentPage.user_id,
        amount: amount,
        fee: totalFee,
        net_amount: netAmount,
        status: "completed",
        provider: "bank78",
        nomba_transaction_id: transactionId,
        customer_name: senderName,
        payment_method: "bank78_transfer",
        paid_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        metadata: {
          bank78_transaction_id: transactionId,
          bank78_data: data,
          narration: narration,
        },
        receipt_sent: false,
      })
      .select()
      .single();

    if (createError) {
      console.error("❌ Failed to create payment:", createError);
      return { error: "Failed to create payment" };
    }
    paymentResult = created;
  }

  // Update page balance
  const { error: balanceError } = await supabase.rpc(
    "increment_page_balance",
    { p_page_id: paymentPage.id, p_amount: netAmount }
  );

  if (balanceError) {
    console.error("❌ Failed to update page balance:", balanceError);
  }

  // Create transaction
  await supabase.from("transactions").insert({
    user_id: paymentPage.user_id,
    type: "credit",
    provider: "bank78",
    provider_transaction_id: transactionId,
    amount: amount,
    fee: totalFee,
    net_amount: netAmount,
    status: "success",
    reference: `B78-PP-${transactionId}`,
    description: `Bank78 payment for "${paymentPage.title}" from ${senderName}`,
    channel: "bank78_payment_page",
    sender: {
      name: senderName,
      account_number: data.originatorAccountNumber,
    },
    receiver: {
      user_id: paymentPage.user_id,
      payment_page_id: paymentPage.id,
    },
    external_response: data,
    created_at: new Date().toISOString(),
  });

  // Send receipt
  if (pendingPayment?.customer_email) {
    await sendPaymentPageReceiptWithPDF(
      pendingPayment.customer_email,
      paymentPage,
      paymentResult,
      senderName,
      amount,
      transactionId,
      "bank78_transfer",
      new Date().toISOString(),
      {
        narration: narration,
        bank78_transaction_id: transactionId,
      }
    ).catch(console.error);

    await supabase
      .from("payment_page_payments")
      .update({ receipt_sent: true })
      .eq("id", paymentResult.id);
  }

  console.log(`✅ Bank78 payment page payment processed: ₦${netAmount} credited`);
  
  return {
    success: true,
    message: "Bank78 payment page payment processed",
    credited_amount: netAmount,
    payment_id: paymentResult.id,
    gross_amount: amount,
    total_fee: totalFee,
    net_credit: netAmount,
  };
}

// ============================================================
// PROCESS BANK78 INVOICE PAYMENT
// ============================================================
export async function processBank78InvoicePayment(data: any, user: any) {
  const amount = parseFloat(data.amount);
  const transactionId = data.transactionId || data.paymentReference || `B78-${Date.now()}`;
  const narration = data.narration || data.description || "";
  const senderName = data.originatorAccountName || data.senderName || "Bank Transfer";
  const fee = parseFloat(data.fee || data.charges || 0);
  const netAmount = amount - fee;

  console.log(`📄 Processing Bank78 invoice payment: ₦${amount}`);

  // Extract invoice reference from narration
  const invMatch = narration.match(/INV[_-]?([A-Z0-9]+)/i) || narration.match(/INVOICE[_-]?([A-Z0-9]+)/i);
  if (!invMatch) {
    console.error("❌ No invoice reference found in narration");
    return { error: "No invoice reference found" };
  }

  const invoiceRef = invMatch[0];
  console.log(`🔍 Found invoice reference: ${invoiceRef}`);

  // Find invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*")
    .eq("invoice_id", invoiceRef)
    .single();

  if (invoiceError || !invoice) {
    console.error(`❌ Invoice not found: ${invoiceRef}`);
    return { error: "Invoice not found", status: 404 };
  }

  console.log(`✅ Found invoice: ${invoice.invoice_id}`);

  // Check for duplicate payment
  const { data: existingPayment } = await supabase
    .from("invoice_payments")
    .select("id")
    .eq("nomba_transaction_id", transactionId)
    .maybeSingle();

  if (existingPayment) {
    console.log(`⏭️ Duplicate Bank78 invoice payment: ${transactionId}`);
    return { success: true, message: "Already processed" };
  }

  // Get customer email
  const customerEmail = invoice.client_email || data.originatorEmail;

  // Create payment record
  const { data: payment, error: paymentError } = await supabase
    .from("invoice_payments")
    .insert({
      invoice_id: invoice.id,
      user_id: invoice.user_id,
      order_reference: transactionId,
      payer_name: senderName,
      payer_email: customerEmail || invoice.client_email,
      amount: amount,
      paid_amount: amount,
      fee_amount: fee,
      nomba_fee: fee,
      net_amount: netAmount,
      user_received: netAmount,
      platform_fee: 0,
      status: "completed",
      nomba_transaction_id: transactionId,
      payment_method: "bank78_transfer",
      narration: narration,
      paid_at: new Date().toISOString(),
      provider: "bank78",
      provider_data: data,
    })
    .select()
    .single();

  if (paymentError) {
    console.error("❌ Failed to create invoice payment:", paymentError);
    return { error: "Failed to create payment record" };
  }

  // Create transaction
  await supabase.from("transactions").insert({
    user_id: invoice.user_id,
    type: "credit",
    provider: "bank78",
    provider_transaction_id: transactionId,
    amount: amount,
    fee: fee,
    net_amount: netAmount,
    status: "success",
    reference: `B78-INV-${transactionId}`,
    description: `Bank78 payment for invoice ${invoice.invoice_id} from ${senderName}`,
    channel: "bank78_invoice",
    sender: {
      name: senderName,
      account_number: data.originatorAccountNumber,
    },
    receiver: {
      user_id: invoice.user_id,
      invoice_id: invoice.id,
    },
    external_response: data,
    created_at: new Date().toISOString(),
  });

  // Credit user wallet
  const { error: creditError } = await supabase.rpc("increment_wallet_balance", {
    user_id: invoice.user_id,
    amt: netAmount,
  });

  if (creditError) {
    console.error("❌ Failed to credit wallet:", creditError);
  }

  // Update invoice totals
  await updateInvoiceTotals(invoice, amount);

  // Send receipt
  if (customerEmail) {
    await sendTransactionReceiptWithPDF(
      customerEmail,
      senderName,
      invoice,
      {
        amount: amount,
        nombaFee: fee,
        netAmount: netAmount,
        transactionId: transactionId,
        paymentMethod: "bank78_transfer",
        paidAt: new Date().toISOString(),
        narration: narration,
      }
    ).catch(console.error);
  }

  console.log(`✅ Bank78 invoice payment processed: ₦${netAmount} credited`);

  return {
    success: true,
    message: "Bank78 invoice payment processed",
    credited_amount: netAmount,
    payment_id: payment.id,
  };
}

// ============================================================
// PROCESS BANK78 WITHDRAWAL WEBHOOK
// ============================================================
export async function processBank78WithdrawalWebhook(data: any) {
  const transactionId = data.transactionId || data.reference;
  const status = data.status || data.transactionStatus;

  console.log(`💸 Processing Bank78 withdrawal webhook: ${transactionId} - ${status}`);

  // Find transaction
  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .select("*")
    .eq("provider_transaction_id", transactionId)
    .eq("provider", "bank78")
    .maybeSingle();

  if (txError || !transaction) {
    console.error(`❌ Transaction not found: ${transactionId}`);
    return { error: "Transaction not found" };
  }

  if (transaction.status === "success" || transaction.status === "failed") {
    console.log(`⏭️ Transaction already processed: ${transactionId}`);
    return { success: true, message: "Already processed" };
  }

  if (status === "success" || status === "completed") {
    // Update transaction to success
    await supabase
      .from("transactions")
      .update({
        status: "success",
        external_response: {
          ...transaction.external_response,
          bank78_webhook: data,
          completed_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);

    console.log(`✅ Bank78 withdrawal completed: ${transactionId}`);
    
    return {
      success: true,
      message: "Withdrawal completed",
      transaction_id: transaction.id,
    };
  } else if (status === "failed" || status === "reversed") {
    // Refund the user (balance was never deducted in the new flow)
    // Or if it was deducted, we need to reverse it
    const wasDeducted = transaction.external_response?.deducted_at;
    
    if (wasDeducted) {
      // Refund the user
      await supabase.rpc("increment_wallet_balance", {
        user_id: transaction.user_id,
        amt: transaction.total_deduction || transaction.amount + (transaction.fee || 0),
      });
    }

    await supabase
      .from("transactions")
      .update({
        status: "failed",
        external_response: {
          ...transaction.external_response,
          bank78_webhook: data,
          failed_at: new Date().toISOString(),
          refunded: wasDeducted,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);

    console.log(`❌ Bank78 withdrawal failed: ${transactionId}`);
    
    return {
      success: true,
      message: "Withdrawal failed",
      transaction_id: transaction.id,
      refunded: wasDeducted,
    };
  }

  return { success: true, message: "Status not handled" };
}