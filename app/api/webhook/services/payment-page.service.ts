// app/api/webhook/services/payment-page.service.ts

import { createClient } from "@supabase/supabase-js";
import { transporter } from "@/lib/node-mailer";
import {
  sendTransactionReceiptWithPDF,
  sendPaymentPageReceiptWithPDF,
} from "@/lib/generate-payment-receipts-pdf";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL
    : process.env.NEXT_PUBLIC_BASE_URL;

const headerImageUrl = `${baseUrl}/zidwell-header.png`;
const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

interface PaymentPageParams {
  nombaTransactionId: string;
  nombaFee: number;
  orderReference: string;
}

interface BankTransferParams {
  nombaTransactionId: string;
  nombaFee: number;
  aliasAccountReference: string;
  transactionAmount: number;
  customer: any;
  tx: any;
}

type ServiceResult =
  | {
      success: true;
      message: string;
      credited_amount?: number;
      new_balance?: number | null;
      payment_id?: string;
    }
  | { error: string; status?: number };

// Helper function to calculate next due date
function calculateNextDueDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case "weekly":
      now.setDate(now.getDate() + 7);
      break;
    case "bi-weekly":
      now.setDate(now.getDate() + 14);
      break;
    case "monthly":
      now.setMonth(now.getMonth() + 1);
      break;
    default:
      now.setMonth(now.getMonth() + 1);
  }
  return now;
}

// Function to handle installment tracking
async function handleInstallmentTracking(
  paymentRecord: any,
  paymentPage: any,
  nombaTransactionId: string,
): Promise<void> {
  try {
    console.log("📦 Processing installment tracking...");

    const isInstallment =
      paymentPage?.price_type === "installment" ||
      paymentRecord?.metadata?.isInstallment === true;

    if (!isInstallment) {
      console.log("Not an installment payment, skipping tracking");
      return;
    }

    const totalAmount =
      paymentPage?.price || paymentRecord?.metadata?.totalAmount;
    const installmentCount =
      paymentPage?.installment_count ||
      paymentRecord?.metadata?.installmentCount;
    const installmentPeriod =
      paymentRecord?.metadata?.installmentPeriod || "monthly";
    const installmentAmount = totalAmount / installmentCount;

    // Get or create customer installment record
    let { data: customerInstallment, error: installmentError } = await supabase
      .from("payment_page_customer_installments")
      .select("*")
      .eq("payment_page_id", paymentRecord.payment_page_id)
      .eq("customer_email", paymentRecord.customer_email)
      .maybeSingle();

    if (installmentError) {
      console.error("❌ Error fetching customer installment:", installmentError);
    }

    // If no existing record, this is the first installment
    if (!customerInstallment) {
      console.log("🆕 First installment payment - creating tracking record");

      const nextDueDate = calculateNextDueDate(installmentPeriod);

      const { data: newRecord, error: createError } = await supabase
        .from("payment_page_customer_installments")
        .insert({
          payment_page_id: paymentRecord.payment_page_id,
          customer_email: paymentRecord.customer_email,
          customer_name: paymentRecord.customer_name,
          total_amount: totalAmount,
          installment_count: installmentCount,
          paid_installments: 1,
          remaining_amount: totalAmount - installmentAmount,
          next_payment_due: nextDueDate.toISOString(),
          status: installmentCount === 1 ? "completed" : "active",
          installment_period: installmentPeriod,
          installment_amount: installmentAmount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error("❌ Failed to create installment record:", createError);
      } else {
        console.log("✅ Installment tracking created:", newRecord?.id);
      }
    } else {
      // Update existing record
      const newPaidCount = customerInstallment.paid_installments + 1;
      const newRemainingAmount =
        customerInstallment.remaining_amount - installmentAmount;
      const isCompleted = newPaidCount >= customerInstallment.installment_count;

      const nextDueDate = isCompleted
        ? null
        : calculateNextDueDate(customerInstallment.installment_period);

      const { error: updateError } = await supabase
        .from("payment_page_customer_installments")
        .update({
          paid_installments: newPaidCount,
          remaining_amount: newRemainingAmount,
          next_payment_due: nextDueDate?.toISOString(),
          status: isCompleted ? "completed" : "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", customerInstallment.id);

      if (updateError) {
        console.error("❌ Failed to update installment record:", updateError);
      } else {
        console.log(
          `✅ Installment ${newPaidCount}/${customerInstallment.installment_count} completed`,
        );
      }
    }

    // Record individual installment payment
    const installmentNumber = (customerInstallment?.paid_installments || 0) + 1;
    const { error: recordError } = await supabase
      .from("payment_page_installment_payments")
      .insert({
        payment_page_id: paymentRecord.payment_page_id,
        customer_email: paymentRecord.customer_email,
        installment_number: installmentNumber,
        amount_paid: paymentRecord.amount,
        fee: paymentRecord.fee,
        net_amount: paymentRecord.net_amount,
        transaction_id: nombaTransactionId,
        payment_id: paymentRecord.id,
        payment_date: new Date().toISOString(),
        status: "completed",
      });

    if (recordError) {
      console.error("❌ Failed to record installment payment:", recordError);
    } else {
      console.log(
        "✅ Installment payment recorded for installment #" + installmentNumber,
      );
    }
  } catch (error) {
    console.error("❌ Error in installment tracking:", error);
  }
}

// Helper function to get customer's installment history
async function getCustomerInstallmentHistory(
  paymentPageId: string,
  customerEmail: string,
): Promise<any> {
  try {
    const { data: installment, error: installmentError } = await supabase
      .from("payment_page_customer_installments")
      .select("*")
      .eq("payment_page_id", paymentPageId)
      .eq("customer_email", customerEmail)
      .maybeSingle();

    if (installmentError) {
      console.error("Error fetching installment:", installmentError);
      return null;
    }

    if (!installment) return null;

    const { data: payments, error: paymentsError } = await supabase
      .from("payment_page_installment_payments")
      .select("*")
      .eq("payment_page_id", paymentPageId)
      .eq("customer_email", customerEmail)
      .order("installment_number", { ascending: true });

    if (paymentsError) {
      console.error("Error fetching installment payments:", paymentsError);
    }

    return {
      ...installment,
      payments: payments || [],
    };
  } catch (error) {
    console.error("Error getting installment history:", error);
    return null;
  }
}

// Helper function to extract payment page ID from reference
function extractPaymentPageIdFromReference(orderReference: string): string | null {
  if (!orderReference) return null;
  const ppPattern = /^PP-([a-f0-9]{12})-[a-z0-9]+-[a-z0-9]+$/i;
  const match = orderReference.match(ppPattern);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

function extractPaymentPageIdFromVirtualAccount(aliasAccountReference: string): string | null {
  if (!aliasAccountReference) return null;
  const uuidPattern = /^VA-PP-([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
  const match = aliasAccountReference.match(uuidPattern);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

// Email function for payment page notification to creator
async function sendPaymentPageNotificationEmail(
  creatorEmail: string,
  pageTitle: string,
  amount: number,
  customerName: string,
  fee?: number,
  metadata?: any,
  paymentMethod: string = "card",
): Promise<void> {
  try {
    let additionalInfo = "";
    const isInstallment = metadata?.isInstallment === true;
    const installmentNumber = metadata?.installmentNumber || 1;
    const totalInstallments = metadata?.totalInstallments || 1;

    if (metadata?.pageType === "school") {
      additionalInfo = `
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
          <p><strong>Student Information:</strong></p>
          <p>Parent: ${metadata.parentName || "N/A"}</p>
          <p>Number of Students: ${metadata.numberOfStudents || 1}</p>
          ${metadata.selectedStudents ? `<p>Students: ${metadata.selectedStudents.join(", ")}</p>` : ""}
        </div>
      `;
    }

    if (isInstallment) {
      additionalInfo += `
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
          <p><strong>Installment Payment:</strong></p>
          <p>Installment ${installmentNumber} of ${totalInstallments}</p>
        </div>
      `;
    }

    const subject = isInstallment 
      ? `💰 Installment ${installmentNumber}/${totalInstallments} Payment Received for "${pageTitle}" - ₦${amount.toLocaleString()}`
      : `💰 Payment Received for "${pageTitle}" - ₦${amount.toLocaleString()}`;

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: creatorEmail,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: #22c55e;">✅ Payment Received!</h3>
          <p>You've received a payment for your payment page <strong>${pageTitle}</strong>.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
            ${fee ? `<p><strong>Processing Fee:</strong> ₦${fee.toLocaleString()}</p>` : ""}
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Payment Method:</strong> ${paymentMethod === "card" ? "Card" : "Bank Transfer"}</p>
            <p><strong>Status:</strong> <span style="color: #22c55e;">Completed</span></p>
          </div>
          ${additionalInfo}
          <p>The funds have been added to your payment page balance.</p>
          <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
        </div>
      `,
    });
    console.log(`✅ Notification email sent to creator: ${creatorEmail}`);
  } catch (error) {
    console.error("Failed to send payment page notification:", error);
  }
}

// ============================================================
// MAIN PROCESS PAYMENT PAGE PAYMENT FUNCTION (WITH EMAILS)
// ============================================================

export async function processPaymentPagePayment(
  payload: any,
  params: PaymentPageParams,
): Promise<ServiceResult> {
  const { nombaTransactionId, nombaFee, orderReference } = params;

  console.log("💰 Processing Payment Page CARD payment...");
  console.log("🔑 Order Reference:", orderReference);
  console.log("🆔 Nomba Transaction ID:", nombaTransactionId);

  // Extract metadata from the payload
  const metadata = payload.data?.order?.metadata || {};
  let paymentPageId = metadata.paymentPageId;
  let paymentId = metadata.paymentId;

  // If paymentPageId not found in metadata, try to extract from orderReference
  if (!paymentPageId && orderReference) {
    const extractedId = extractPaymentPageIdFromReference(orderReference);
    if (extractedId) {
      const { data: allPages } = await supabase
        .from("payment_pages")
        .select("id");
      if (allPages) {
        const foundPage = allPages.find((page) => page.id.endsWith(extractedId));
        if (foundPage) paymentPageId = foundPage.id;
      }
    }
  }

  if (!paymentPageId) {
    console.error("❌ Missing payment page identifier");
    return { error: "Missing payment page identifier", status: 400 };
  }

  // Find the payment record
  let paymentRecord = null;

  // First try by paymentId from metadata
  if (paymentId) {
    const { data: payment } = await supabase
      .from("payment_page_payments")
      .select("*")
      .eq("id", paymentId)
      .maybeSingle();
    if (payment) paymentRecord = payment;
  }

  // If not found, try by order_reference
  if (!paymentRecord) {
    const { data: payment } = await supabase
      .from("payment_page_payments")
      .select("*")
      .eq("order_reference", orderReference)
      .maybeSingle();
    if (payment) paymentRecord = payment;
  }

  // If still not found, try by payment_page_id with pending status
  if (!paymentRecord) {
    const { data: payment } = await supabase
      .from("payment_page_payments")
      .select("*")
      .eq("payment_page_id", paymentPageId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (payment) paymentRecord = payment;
  }

  if (!paymentRecord) {
    console.error("❌ Payment record not found");
    return { error: "Payment record not found", status: 404 };
  }

  console.log("✅ Payment record found:", { 
    id: paymentRecord.id, 
    status: paymentRecord.status,
    amount: paymentRecord.amount,
    paymentType: paymentRecord.payment_type,
    installmentNumber: paymentRecord.installment_number,
    totalInstallments: paymentRecord.total_installments
  });

  // Check for duplicate webhook
  const { data: existingWebhook } = await supabase
    .from("payment_page_payments")
    .select("nomba_transaction_id")
    .eq("nomba_transaction_id", nombaTransactionId)
    .maybeSingle();

  if (existingWebhook) {
    console.log("⚠️ Duplicate webhook, already processed");
    return { success: true, message: "Already processed" };
  }

  if (paymentRecord.status === "completed") {
    console.log("✅ Payment already completed");
    return { success: true, message: "Already processed" };
  }

  // Calculate net amount after fee (creator bears the fee)
  const netAmount = paymentRecord.amount - (paymentRecord.fee || 0);
  console.log("💰 Net amount after fee:", netAmount);

  // Update payment status
  const { error: updateError, count } = await supabase
    .from("payment_page_payments")
    .update({
      status: "completed",
      nomba_transaction_id: nombaTransactionId,
      payment_method: "card",
      paid_at: new Date().toISOString(),
      net_amount: netAmount,
    })
    .eq("id", paymentRecord.id)
    .eq("status", "pending");

  if (updateError) {
    console.error("❌ Failed to update payment:", updateError);
    return { error: "Failed to update payment", status: 500 };
  }

  if (!count || count === 0) {
    console.log("⚠️ Payment already updated by another process");
    return { success: true, message: "Already processed" };
  }

  console.log("✅ Payment updated to completed");

  // Credit creator's balance with net amount
  const { data: newBalance, error: balanceError } = await supabase.rpc(
    "increment_page_balance",
    { p_page_id: paymentPageId, p_amount: netAmount },
  );

  const finalBalance = !balanceError && typeof newBalance === "number" ? newBalance : null;
  
  if (balanceError) {
    console.error("❌ Failed to increment balance:", balanceError);
  } else {
    console.log("✅ Balance incremented. New balance:", finalBalance);
  }

  // Get payment page details for email
  const { data: paymentPage } = await supabase
    .from("payment_pages")
    .select("title, user_id, page_type, metadata")
    .eq("id", paymentPageId)
    .single();

  // Handle installment tracking
  await handleInstallmentTracking(paymentRecord, paymentPage, nombaTransactionId);

  // ============================================================
  // SEND EMAIL RECEIPT TO CUSTOMER
  // ============================================================
  if (paymentRecord.customer_email) {
    try {
      const isInstallment = paymentRecord.payment_type === "installment";
      const installmentNumber = paymentRecord.installment_number || 1;
      const totalInstallments = paymentRecord.total_installments || 1;
      
      const receiptMetadata = {
        ...paymentRecord.metadata,
        payment_method: "card",
        pageType: paymentPage?.page_type,
        note: "Transaction fees are covered by the merchant",
        isInstallment: isInstallment,
        installmentNumber: installmentNumber,
        totalInstallments: totalInstallments,
        totalAmount: paymentRecord.total_amount || paymentRecord.amount,
        pageTitle: paymentPage?.title,
        amountPerStudent: paymentRecord.metadata?.amountPerStudent,
        selectedStudents: paymentRecord.metadata?.selectedStudents,
        parentName: paymentRecord.metadata?.parentName,
      };

      console.log("📧 Sending receipt email to customer:", {
        email: paymentRecord.customer_email,
        isInstallment,
        installmentNumber,
        totalInstallments
      });

      await sendPaymentPageReceiptWithPDF(
        paymentRecord.customer_email,
        paymentPage || { title: "Payment Page" },
        paymentRecord,
        paymentRecord.customer_name,
        paymentRecord.amount,
        nombaTransactionId,
        "card",
        new Date().toISOString(),
        receiptMetadata,
      );
      console.log("✅ Receipt email sent to customer:", paymentRecord.customer_email);
    } catch (error) {
      console.error("❌ Failed to send receipt email:", error);
    }
  } else {
    console.warn("⚠️ No customer email found, skipping receipt");
  }

  // ============================================================
  // SEND NOTIFICATION EMAIL TO CREATOR
  // ============================================================
  const { data: creator } = await supabase
    .from("users")
    .select("email")
    .eq("id", paymentRecord.user_id)
    .single();

  if (creator?.email) {
    try {
      const isInstallment = paymentRecord.payment_type === "installment";
      
      await sendPaymentPageNotificationEmail(
        creator.email,
        paymentPage?.title || "Payment Page",
        netAmount,
        paymentRecord.customer_name,
        paymentRecord.fee,
        {
          ...paymentRecord.metadata,
          payment_method: "card",
          fee_born_by: "creator",
          pageType: paymentPage?.page_type,
          parentName: paymentRecord.parent_name,
          selectedStudents: paymentRecord.selected_students,
          numberOfStudents: paymentRecord.selected_students?.length || 1,
          isInstallment: isInstallment,
          installmentNumber: paymentRecord.installment_number,
          totalInstallments: paymentRecord.total_installments,
        },
        "card",
      );
      console.log("✅ Notification email sent to creator:", creator.email);
    } catch (error) {
      console.error("❌ Failed to send creator notification:", error);
    }
  }

  // Create transaction record
  const { error: txError } = await supabase.from("transactions").insert({
    user_id: paymentRecord.user_id,
    type: "credit",
    amount: paymentRecord.amount,
    fee: paymentRecord.fee,
    net_amount: netAmount,
    status: "success",
    reference: `PP-${paymentPageId}-${nombaTransactionId}`,
    description: `${paymentRecord.payment_type === "installment" ? `Installment ${paymentRecord.installment_number}/${paymentRecord.total_installments} payment` : "Payment"} received for page "${paymentPage?.title}" from ${paymentRecord.customer_name}`,
    channel: "payment_page",
    sender: {
      name: paymentRecord.customer_name,
      email: paymentRecord.customer_email,
      phone: paymentRecord.customer_phone,
    },
    receiver: {
      user_id: paymentRecord.user_id,
      payment_page_id: paymentPageId,
    },
    external_response: {
      nomba_transaction_id: nombaTransactionId,
      nomba_fee: nombaFee,
      payment_method: "card",
      fee_born_by: "creator",
    },
  });

  if (txError) {
    console.error("❌ Failed to create transaction:", txError);
  } else {
    console.log("✅ Transaction record created");
  }

  console.log("🎉 Payment processing completed successfully!");

  return {
    success: true,
    message: "Card payment processed",
    credited_amount: netAmount,
    new_balance: finalBalance,
  };
}

// ============================================================
// PROCESS BANK TRANSFER PAYMENTS
// ============================================================

export async function processPaymentPageBankTransfer(
  payload: any,
  params: BankTransferParams,
): Promise<ServiceResult> {
  const {
    nombaTransactionId,
    nombaFee,
    aliasAccountReference,
    transactionAmount,
    customer,
    tx,
  } = params;

  console.log("🏦 Processing Payment Page BANK TRANSFER...");

  const paymentPageId = extractPaymentPageIdFromVirtualAccount(aliasAccountReference);

  if (!paymentPageId) {
    return { error: "Invalid virtual account reference", status: 400 };
  }

  const { data: paymentPage, error: pageError } = await supabase
    .from("payment_pages")
    .select("id, title, user_id, page_type, metadata")
    .eq("id", paymentPageId)
    .single();

  if (pageError || !paymentPage) {
    return { error: "Payment page not found", status: 404 };
  }

  const { data: existingTransfer } = await supabase
    .from("payment_page_payments")
    .select("id")
    .eq("nomba_transaction_id", nombaTransactionId)
    .maybeSingle();

  if (existingTransfer) {
    return { success: true, message: "Already processed" };
  }

  const netAmount = transactionAmount - nombaFee;
  const customerName = customer?.name || tx?.customerName || "Bank Transfer Customer";
  const customerEmail = customer?.email || tx?.customerEmail || null;

  const orderReference = `BT-${paymentPageId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  const { data: paymentRecord, error: insertError } = await supabase
    .from("payment_page_payments")
    .insert({
      payment_page_id: paymentPageId,
      user_id: paymentPage.user_id,
      amount: transactionAmount,
      fee: nombaFee,
      net_amount: netAmount,
      status: "completed",
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customer?.phone || null,
      payment_method: "bank_transfer",
      nomba_transaction_id: nombaTransactionId,
      order_reference: orderReference,
      metadata: {
        bank_transfer: true,
        customer_details: customer,
        transaction_details: tx,
      },
      paid_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    return { error: "Failed to create payment record", status: 500 };
  }

  // Handle installment tracking for bank transfer
  await handleInstallmentTracking(paymentRecord, paymentPage, nombaTransactionId);

  // Credit creator's balance
  const { data: newBalance, error: balanceError } = await supabase.rpc(
    "increment_page_balance",
    { p_page_id: paymentPageId, p_amount: netAmount },
  );

  const finalBalance = !balanceError && typeof newBalance === "number" ? newBalance : null;

  // Send receipt to customer
  if (customerEmail) {
    try {
      await sendPaymentPageReceiptWithPDF(
        customerEmail,
        paymentPage,
        paymentRecord,
        customerName,
        transactionAmount,
        nombaTransactionId,
        "bank_transfer",
        new Date().toISOString(),
        {
          payment_method: "bank_transfer",
          pageType: paymentPage.page_type,
        },
      );
      console.log("✅ Receipt email sent to customer:", customerEmail);
    } catch (error) {
      console.error("❌ Failed to send receipt:", error);
    }
  }

  // Send notification to creator
  const { data: creator } = await supabase
    .from("users")
    .select("email")
    .eq("id", paymentPage.user_id)
    .single();

  if (creator?.email) {
    try {
      await sendPaymentPageNotificationEmail(
        creator.email,
        paymentPage.title,
        netAmount,
        customerName,
        nombaFee,
        { pageType: paymentPage.page_type, bank_transfer: true },
        "bank_transfer",
      );
      console.log("✅ Notification sent to creator:", creator.email);
    } catch (error) {
      console.error("❌ Failed to send creator notification:", error);
    }
  }

  return {
    success: true,
    message: "Bank transfer payment processed",
    credited_amount: netAmount,
    new_balance: finalBalance,
    payment_id: paymentRecord.id,
  };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function checkIfPaymentPagePayment(orderReference: string, payload: any): boolean {
  if (orderReference?.startsWith("PP-")) return true;
  const metadata = payload.data?.order?.metadata || {};
  return metadata.type === "payment_page" || metadata.paymentPageId || metadata.paymentId;
}

export function checkIfPaymentPageBankTransfer(aliasAccountReference: string, payload: any): boolean {
  if (!aliasAccountReference) return false;
  const hasPaymentPageId = extractPaymentPageIdFromVirtualAccount(aliasAccountReference);
  if (hasPaymentPageId) return true;
  const metadata = payload.data?.order?.metadata || {};
  return metadata.type === "payment_page_bank_transfer";
}

// Export helper functions for external use
export { getCustomerInstallmentHistory, handleInstallmentTracking };