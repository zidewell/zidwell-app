// app/api/webhook/services/payment-page.service.ts

import { createClient } from "@supabase/supabase-js";
import { transporter } from "@/lib/node-mailer";
import { sendPaymentPageReceiptWithPDF } from "@/lib/generate-payment-receipts-pdf";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL
    : process.env.NEXT_PUBLIC_BASE_URL;

const headerImageUrl = `${baseUrl}/zidwell-header.png`;
const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

interface PaymentPageVirtualAccountParams {
  nombaTransactionId: string;
  nombaFee: number;
  aliasAccountReference: string;
  transactionAmount: number;
  customer: any;
  tx: any;
  transferReference?: string; // Added
}

type ServiceResult =
  | {
      success: true;
      message: string;
      credited_amount?: number;
      new_balance?: number | null;
      payment_id?: string;
      gross_amount?: number;
      nomba_fee?: number;
      app_fee?: number;
      total_fee?: number;
      net_credit?: number;
      metadata?: any;
    }
  | { error: string; status?: number };

function calculateAppFee(amount: number): number {
  const FEE_PERCENTAGE = 0.02;
  return amount * FEE_PERCENTAGE;
}

async function sendPaymentPageNotificationEmail(
  creatorEmail: string,
  pageTitle: string,
  amount: number,
  customerName: string,
  customerEmail: string,
  narration: string,
  nombaFee: number,
  appFee: number,
): Promise<void> {
  if (!creatorEmail || !creatorEmail.includes('@')) return;
  
  const totalFee = nombaFee + appFee;
  const netAmount = amount - totalFee;
  
  try {
    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: creatorEmail,
      subject: `💰 Payment Received for "${pageTitle}" - ₦${netAmount.toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: #22c55e;">✅ Payment Received! 🏦</h3>
          <p>You've received a bank transfer payment for <strong>${pageTitle}</strong>.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
            <p><strong>Total Fees:</strong> - ₦${totalFee.toLocaleString()}</p>
            <p><strong>Amount Credited:</strong> ₦${netAmount.toLocaleString()}</p>
            <p><strong>Sender:</strong> ${customerName}</p>
          </div>
          <p>Funds added to your page balance after fee deductions.</p>
          <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}

async function updateStudentPaidStatus(
  paymentPageId: string,
  studentName: string,
  parentName: string,
  amount: number,
): Promise<void> {
  try {
    const { data: paymentPage, error: fetchError } = await supabase
      .from("payment_pages")
      .select("metadata")
      .eq("id", paymentPageId)
      .single();

    if (fetchError || !paymentPage?.metadata?.students) {
      return;
    }

    const updatedStudents = paymentPage.metadata.students.map((student: any) => {
      const existingStudentName = student.name || student.childName || student.studentName;
      if (existingStudentName?.toLowerCase().trim() === studentName?.toLowerCase().trim()) {
        const currentPaidAmount = student.paidAmount || 0;
        const newPaidAmount = currentPaidAmount + amount;
        const totalAmount = student.totalAmount || paymentPage.metadata.totalAmountPerStudent || 0;
        
        return {
          ...student,
          paid: newPaidAmount >= totalAmount,
          paidAt: new Date().toISOString(),
          paidAmount: newPaidAmount,
          parentName: parentName,
          lastPaymentDate: new Date().toISOString(),
        };
      }
      return student;
    });

    await supabase
      .from("payment_pages")
      .update({
        metadata: {
          ...paymentPage.metadata,
          students: updatedStudents,
        },
      })
      .eq("id", paymentPageId);
    
    console.log(`✅ Updated paid status for student: ${studentName}`);
  } catch (error) {
    console.error("Error updating student paid status:", error);
  }
}

function extractPaymentPageId(aliasAccountReference: string): string | null {
  if (!aliasAccountReference) return null;
  let cleanRef = aliasAccountReference.replace(/^PP/i, '');
  if (cleanRef.length === 32) {
    return cleanRef;
  }
  return cleanRef;
}

export async function processPaymentPageVirtualAccount(
  payload: any,
  params: PaymentPageVirtualAccountParams,
): Promise<ServiceResult> {
  const {
    nombaTransactionId,
    nombaFee,
    aliasAccountReference,
    transactionAmount,
    customer,
    tx,
    transferReference, // Added
  } = params;

  console.log("🏦 ========== PROCESSING PAYMENT PAGE VIRTUAL ACCOUNT ==========");
  console.log("Transaction ID:", nombaTransactionId);
  console.log("Virtual Account Ref:", aliasAccountReference);
  console.log("Gross Amount:", transactionAmount);
  console.log("Nomba Fee:", nombaFee);

  const appFee = calculateAppFee(transactionAmount);
  const totalFee = nombaFee + appFee;
  const netAmount = transactionAmount - totalFee;

  console.log(`💰 Fee Breakdown:`);
  console.log(`   Nomba Fee: ₦${nombaFee.toLocaleString()}`);
  console.log(`   App Fee (2%): ₦${appFee.toLocaleString()}`);
  console.log(`   Total Fees: ₦${totalFee.toLocaleString()}`);
  console.log(`   Net to Merchant: ₦${netAmount.toLocaleString()}`);

  // Find payment page by account number
  const virtualAccountNumber = tx.aliasAccountNumber;
  let paymentPage = null;

  if (virtualAccountNumber) {
    const { data: foundPage, error: pageError } = await supabase
      .from("payment_pages")
      .select("id, title, user_id, page_type, metadata")
      .eq("metadata->virtual_account->>accountNumber", virtualAccountNumber)
      .maybeSingle();
    
    if (foundPage) {
      paymentPage = foundPage;
      console.log("✅ Found payment page by account number:", paymentPage.id);
    }
  }

  // Try by ID match if not found
  if (!paymentPage) {
    const shortPageId = extractPaymentPageId(aliasAccountReference);
    if (shortPageId) {
      const { data: foundPage, error: pageError } = await supabase
        .from("payment_pages")
        .select("id, title, user_id, page_type, metadata")
        .ilike("id", `%${shortPageId.substring(0, 15)}%`)
        .maybeSingle();
      
      if (foundPage) {
        paymentPage = foundPage;
        console.log("✅ Found payment page by ID match:", paymentPage.id);
      }
    }
  }

  if (!paymentPage) {
    console.error("❌ Payment page not found for reference:", aliasAccountReference);
    return { error: "Payment page not found", status: 404 };
  }

  console.log("✅ Payment page found:", paymentPage.title);

  // ============================================================
  // NEW: CHECK FOR EXISTING PENDING PAYMENT TO PRESERVE USER DATA
  // ============================================================
  let pendingPayment = null;
  const narration = tx?.narration || tx?.senderName || "";
  
  // Try to find pending payment by transfer reference
  let searchRef = transferReference;
  
  if (!searchRef) {
    // Try to extract from narration
    const refMatch = narration.match(/TRF_[A-Za-z0-9]+/);
    if (refMatch) {
      searchRef = refMatch[0];
    }
  }

  if (searchRef) {
    console.log(`🔍 Looking for pending payment with reference: ${searchRef}`);
    
    const { data: existing, error: findError } = await supabase
      .from("payment_page_payments")
      .select("id, metadata, customer_name, customer_email, customer_phone, transfer_reference")
      .or(`transfer_reference.eq.${searchRef},metadata->narration.eq.${searchRef}`)
      .eq("status", "pending")
      .maybeSingle();
    
    if (existing) {
      pendingPayment = existing;
      console.log(`✅ Found pending payment: ${pendingPayment.id}`);
      console.log(`📦 Existing metadata:`, JSON.stringify(pendingPayment.metadata, null, 2));
    }
  }

  // Check for duplicate webhook
  const { data: existingWebhook } = await supabase
    .from("payment_page_payments")
    .select("id")
    .eq("nomba_transaction_id", nombaTransactionId)
    .maybeSingle();

  if (existingWebhook) {
    console.log(`⏭️ Webhook already processed for transaction: ${nombaTransactionId}`);
    return { success: true, message: "Already processed" };
  }

  // Prepare data
  const senderName = tx?.senderName || customer?.name || pendingPayment?.customer_name || "Bank Transfer Customer";
  const customerEmail = customer?.email || pendingPayment?.customer_email || null;

  let matchedStudentName = null;
  let matchedParentName = null;
  const students = paymentPage.metadata?.students || [];
  
  for (const student of students) {
    const studentName = student.name || student.childName;
    if (studentName && narration.toLowerCase().includes(studentName.toLowerCase())) {
      matchedStudentName = studentName;
      matchedParentName = senderName;
      console.log(`✅ Matched student from narration: ${studentName}`);
      break;
    }
  }

  const orderReference = `VA-${paymentPage.id.substring(0, 8)}-${Date.now()}`;

  // ============================================================
  // BUILD MERGED METADATA - PRESERVES USER DATA
  // ============================================================
  let mergedMetadata: any = pendingPayment?.metadata || {};

  // If no pending payment metadata, start with basic
  if (!mergedMetadata || Object.keys(mergedMetadata).length === 0) {
    mergedMetadata = {
      narration: narration,
    };
  }

  // Add webhook data (overwrites conflicting keys)
  const webhookData = {
    narration: narration,
    bank_transaction_id: nombaTransactionId,
    matched_student: matchedStudentName,
    matched_parent: matchedParentName,
    gross_amount: transactionAmount,
    nomba_fee: nombaFee,
    app_fee: appFee,
    total_fee: totalFee,
    net_credit: netAmount,
  };

  // Merge: webhook data takes precedence
  mergedMetadata = {
    ...mergedMetadata,
    ...webhookData,
  };

  console.log(`📦 Final merged metadata:`, JSON.stringify(mergedMetadata, null, 2));

  // ============================================================
  // CREATE OR UPDATE PAYMENT
  // ============================================================
  let paymentResult;

  if (pendingPayment) {
    // UPDATE existing pending payment - PRESERVES ALL USER DATA
    console.log(`🔄 Updating existing pending payment: ${pendingPayment.id}`);
    
    const { data: updated, error: updateError } = await supabase
      .from("payment_page_payments")
      .update({
        status: "completed",
        nomba_transaction_id: nombaTransactionId,
        paid_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        net_amount: netAmount,
        amount: transactionAmount,
        fee: totalFee,
        customer_name: pendingPayment.customer_name || senderName,
        customer_email: pendingPayment.customer_email || customerEmail,
        metadata: mergedMetadata, // PRESERVES custom fields
      })
      .eq("id", pendingPayment.id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update payment:", updateError);
      return { error: "Failed to update payment", status: 500 };
    }
    
    paymentResult = updated;
    console.log(`✅ Updated pending payment: ${paymentResult.id}`);
  } else {
    // CREATE new payment record (fallback)
    console.log(`📝 Creating new payment record (no pending payment found)`);
    
    const { data: payment, error: insertError } = await supabase
      .from("payment_page_payments")
      .insert({
        payment_page_id: paymentPage.id,
        user_id: paymentPage.user_id,
        amount: transactionAmount,
        fee: totalFee,
        net_amount: netAmount,
        status: "pending",
        customer_name: senderName,
        customer_email: customerEmail,
        payment_method: "virtual_account",
        order_reference: orderReference,
        metadata: mergedMetadata,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create payment:", insertError);
      return { error: "Failed to create payment", status: 500 };
    }
    
    paymentResult = payment;
    
    // Update to completed
    const { data: completed, error: completeError } = await supabase
      .from("payment_page_payments")
      .update({
        status: "completed",
        nomba_transaction_id: nombaTransactionId,
        paid_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        net_amount: netAmount,
      })
      .eq("id", payment.id)
      .select()
      .single();

    if (completeError) {
      console.error("Failed to complete payment:", completeError);
    } else {
      paymentResult = completed;
    }
  }

  // ============================================================
  // UPDATE PAGE BALANCE
  // ============================================================
  const { data: newBalance, error: balanceError } = await supabase.rpc(
    "increment_page_balance",
    { p_page_id: paymentPage.id, p_amount: netAmount },
  );

  let finalBalance = null;
  if (balanceError) {
    console.error("❌ Failed to increment balance:", balanceError);
    const { data: page } = await supabase
      .from("payment_pages")
      .select("page_balance")
      .eq("id", paymentPage.id)
      .single();
    
    if (page) {
      const newBalanceValue = Number(page.page_balance) + netAmount;
      await supabase
        .from("payment_pages")
        .update({ page_balance: newBalanceValue })
        .eq("id", paymentPage.id);
      finalBalance = newBalanceValue;
      console.log(`✅ Manually updated balance to ₦${newBalanceValue}`);
    }
  } else {
    finalBalance = newBalance;
    console.log(`✅ Credited ₦${netAmount} to page balance. New balance: ₦${newBalance}`);
  }

  // ============================================================
  // CREATE TRANSACTION RECORD
  // ============================================================
  const { error: txError } = await supabase.from("transactions").insert({
    user_id: paymentPage.user_id,
    type: "credit",
    amount: transactionAmount,
    fee: totalFee,
    net_amount: netAmount,
    status: "success",
    reference: `VA-${paymentPage.id}-${nombaTransactionId}`,
    description: `Bank transfer payment for "${paymentPage.title}" from ${senderName}`,
    channel: "payment_page_virtual_account",
    sender: { 
      name: senderName, 
      email: customerEmail, 
      narration: narration,
      gross_amount: transactionAmount,
      nomba_fee: nombaFee,
      app_fee: appFee,
      total_fee: totalFee,
      net_credit: netAmount,
    },
    receiver: {
      user_id: paymentPage.user_id,
      payment_page_id: paymentPage.id,
    },
    external_response: {
      nomba_transaction_id: nombaTransactionId,
      nomba_fee: nombaFee,
      app_fee: appFee,
      gross_amount: transactionAmount,
      net_amount: netAmount,
      metadata: mergedMetadata,
    },
  });

  if (txError) {
    console.error("Failed to create transaction:", txError);
  }

  // Update student paid status for school pages
  if (matchedStudentName && paymentPage.page_type === "school") {
    await updateStudentPaidStatus(
      paymentPage.id,
      matchedStudentName,
      matchedParentName || senderName,
      transactionAmount,
    );
  }

  // Send receipt to customer
  if (customerEmail) {
    await sendPaymentPageReceiptWithPDF(
      customerEmail,
      paymentPage,
      paymentResult,
      senderName,
      transactionAmount,
      nombaTransactionId,
      "virtual_account",
      new Date().toISOString(),
      {
        narration,
        matched_student: matchedStudentName,
        gross_amount: transactionAmount,
        nomba_fee: nombaFee,
        app_fee: appFee,
        total_fee: totalFee,
        net_amount: netAmount,
        custom_fields: mergedMetadata.customFields || null,
      },
    ).catch(err => console.error("Failed to send receipt:", err));
    
    await supabase
      .from("payment_page_payments")
      .update({ receipt_sent: true })
      .eq("id", paymentResult.id);
  }

  // Send notification to page creator
  const { data: creator } = await supabase
    .from("users")
    .select("email")
    .eq("id", paymentPage.user_id)
    .single();

  if (creator?.email) {
    await sendPaymentPageNotificationEmail(
      creator.email,
      paymentPage.title,
      transactionAmount,
      senderName,
      customerEmail || "",
      narration,
      nombaFee,
      appFee,
    );
  }

  // Final log
  console.log("🎉 ========== PAYMENT PROCESSING COMPLETED ==========");
  console.log(`   Gross: ₦${transactionAmount.toLocaleString()}`);
  console.log(`   Nomba Fee: -₦${nombaFee.toLocaleString()}`);
  console.log(`   App Fee (2%): -₦${appFee.toLocaleString()}`);
  console.log(`   Total Fees: -₦${totalFee.toLocaleString()}`);
  console.log(`   Net Credited: ₦${netAmount.toLocaleString()}`);
  console.log(`   Student: ${matchedStudentName || 'N/A'}`);
  console.log(`   Customer: ${senderName} (${customerEmail || 'no email'})`);
  console.log(`   Custom Fields:`, mergedMetadata.customFields || 'None');
  console.log(`   Payment ID: ${paymentResult.id}`);

  return {
    success: true,
    message: "Virtual account payment processed",
    credited_amount: netAmount,
    new_balance: finalBalance,
    payment_id: paymentResult.id,
    gross_amount: transactionAmount,
    nomba_fee: nombaFee,
    app_fee: appFee,
    total_fee: totalFee,
    net_credit: netAmount,
    metadata: mergedMetadata,
  };
}

export function checkIfPaymentPageVirtualAccount(aliasAccountReference: string): boolean {
  return aliasAccountReference?.startsWith("PP") ?? false;
}