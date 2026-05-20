// app/api/webhook/services/payment-page.service.ts
import { createClient } from "@supabase/supabase-js";
import { transporter } from "@/lib/node-mailer";
import { sendPaymentPageReceiptWithPDF } from "@/lib/generate-payment-receipts-pdf";

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

interface PaymentPageVirtualAccountParams {
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

// Send notification to merchant about payment received
async function sendPaymentPageNotificationEmail(
  creatorEmail: string,
  pageTitle: string,
  amount: number,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  selectedStudents: string[],
  narration: string,
  fee?: number,
): Promise<void> {
  console.log(`📧 [NOTIFICATION] Sending merchant notification to: ${creatorEmail}`);
  
  if (!creatorEmail || !creatorEmail.includes('@')) {
    console.error(`❌ [NOTIFICATION] Invalid merchant email: ${creatorEmail}`);
    return;
  }
  
  try {
    const studentsList = selectedStudents.length > 0 
      ? `
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
          <p><strong>Students:</strong> ${selectedStudents.join(", ")}</p>
        </div>
      `
      : '';

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: creatorEmail,
      subject: `💰 Payment Received for "${pageTitle}" - ₦${amount.toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: #22c55e;">✅ Payment Received! 🏦</h3>
          <p>You've received a bank transfer payment for your payment page <strong>${pageTitle}</strong>.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span><strong>Amount:</strong></span>
              <span>₦${amount.toLocaleString()}</span>
            </div>
            ${fee ? `<div style="display: flex; justify-content: space-between; padding: 8px 0;"><span><strong>Fee:</strong></span><span>₦${fee.toLocaleString()}</span></div>` : ''}
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span><strong>Payer Name:</strong></span>
              <span>${customerName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span><strong>Payer Email:</strong></span>
              <span>${customerEmail || 'Not provided'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span><strong>Payer Phone:</strong></span>
              <span>${customerPhone || 'Not provided'}</span>
            </div>
            ${studentsList}
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span><strong>Bank Narration:</strong></span>
              <span>${narration || 'Not provided'}</span>
            </div>
          </div>
          <p>The funds have been added to your payment page balance.</p>
          <p>You can withdraw them to your bank account anytime.</p>
          <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
        </div>
      `,
    });

    console.log(`✅ Notification sent to ${creatorEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send notification:`, error);
  }
}

// Update student paid status in payment page metadata
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
      console.log(`⚠️ No students array found for page ${paymentPageId}`);
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

// Extract payment page ID from virtual account reference
function extractPaymentPageIdFromReference(aliasAccountReference: string): string | null {
  if (!aliasAccountReference) return null;
  
  // Pattern for PP{id} format (no hyphens)
  const ppPattern = /^PP([a-f0-9]{8,})/i;
  const match = aliasAccountReference.match(ppPattern);
  
  if (match && match[1]) {
    // The ID might be truncated, try to find full ID in database
    const shortId = match[1];
    return shortId;
  }
  
  return null;
}

// ============================================================
// PROCESS PAYMENT PAGE VIRTUAL ACCOUNT (BANK TRANSFER)
// ============================================================
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
  } = params;

  console.log("🏦 ========== PROCESSING PAYMENT PAGE VIRTUAL ACCOUNT ==========");
  console.log("🏦 Transaction ID:", nombaTransactionId);
  console.log("🏦 Virtual Account Ref:", aliasAccountReference);
  console.log("🏦 Amount:", transactionAmount);
  console.log("🏦 Transaction Data:", JSON.stringify(tx, null, 2));

  // Extract payment page ID from virtual account reference
  const shortPageId = extractPaymentPageIdFromReference(aliasAccountReference);

  if (!shortPageId) {
    console.error("❌ Invalid virtual account reference - cannot extract page ID");
    return { error: "Invalid virtual account reference", status: 400 };
  }

  // Find payment page by ID (try exact match or partial)
  let paymentPage = null;
  
  // Try exact match first
  const { data: exactMatch } = await supabase
    .from("payment_pages")
    .select("id, title, user_id, page_type, metadata")
    .eq("id", shortPageId)
    .maybeSingle();
  
  if (exactMatch) {
    paymentPage = exactMatch;
  } else {
    // Try to find by ID containing the short ID
    const { data: partialMatch } = await supabase
      .from("payment_pages")
      .select("id, title, user_id, page_type, metadata")
      .ilike("id", `${shortPageId}%`)
      .maybeSingle();
    
    if (partialMatch) {
      paymentPage = partialMatch;
    }
  }

  if (!paymentPage) {
    console.error("❌ Payment page not found for ID:", shortPageId);
    return { error: "Payment page not found", status: 404 };
  }

  console.log("✅ Payment page found:", paymentPage.title);
  console.log("   Page ID:", paymentPage.id);

  // Check for duplicate webhook
  const { data: existingTransfer } = await supabase
    .from("payment_page_payments")
    .select("id")
    .eq("nomba_transaction_id", nombaTransactionId)
    .maybeSingle();

  if (existingTransfer) {
    console.log("⚠️ Duplicate webhook, already processed");
    return { success: true, message: "Already processed" };
  }

  // Extract customer identification from narration and transaction data
  const narration = tx?.narration || tx?.senderName || "";
  const senderName = tx?.senderName || customer?.name || "Bank Transfer Customer";
  
  // Try to find pending payment with matching amount
  const { data: pendingPayments } = await supabase
    .from("payment_page_payments")
    .select("*")
    .eq("payment_page_id", paymentPage.id)
    .eq("status", "pending")
    .eq("amount", transactionAmount)
    .order("created_at", { ascending: false });

  let paymentRecord = pendingPayments?.[0] || null;

  // If we found a pending payment, use its customer info
  if (paymentRecord) {
    console.log("✅ Found matching pending payment:", paymentRecord.id);
    console.log("   Customer Name:", paymentRecord.customer_name);
    console.log("   Customer Email:", paymentRecord.customer_email);
    console.log("   Metadata:", paymentRecord.metadata);
  } else {
    console.log("⚠️ No pending payment found for amount:", transactionAmount);
    
    // Try to find by narration matching parent name
    const { data: paymentsByNarration } = await supabase
      .from("payment_page_payments")
      .select("*")
      .eq("payment_page_id", paymentPage.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5);
    
    if (paymentsByNarration && paymentsByNarration.length > 0) {
      // Try to match narration with parent name
      for (const payment of paymentsByNarration) {
        const parentName = payment.metadata?.parentName || payment.customer_name;
        if (parentName && narration.toLowerCase().includes(parentName.toLowerCase().substring(0, 10))) {
          paymentRecord = payment;
          console.log("✅ Found pending payment by narration match:", paymentRecord.id);
          break;
        }
      }
    }
  }

  const netAmount = transactionAmount - nombaFee;

  // If no pending payment found, create one from the transfer data
  if (!paymentRecord) {
    console.log("📝 No pending payment found, creating new payment record from transfer");
    
    const orderReference = `VA-${paymentPage.id.substring(0, 8)}-${Date.now()}`;
    
    // Try to extract student names from narration
    const potentialStudents = paymentPage.metadata?.students || [];
    const matchedStudents = potentialStudents.filter((student: any) => 
      narration.toLowerCase().includes((student.name || "").toLowerCase())
    );
    
    const { data: newPayment, error: insertError } = await supabase
      .from("payment_page_payments")
      .insert({
        payment_page_id: paymentPage.id,
        user_id: paymentPage.user_id,
        amount: transactionAmount,
        fee: nombaFee,
        net_amount: netAmount,
        status: "pending",
        customer_name: senderName,
        customer_email: customer?.email || null,
        customer_phone: customer?.phone || null,
        payment_method: "virtual_account",
        order_reference: orderReference,
        metadata: {
          virtual_account_number: aliasAccountReference,
          bank_transfer: true,
          narration: narration,
          identified_from_narration: matchedStudents.length > 0,
          parentName: senderName,
          selectedStudents: matchedStudents.map((s: any) => s.name),
          bank_transaction_id: nombaTransactionId,
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ Failed to create payment record:", insertError);
      return { error: "Failed to create payment record", status: 500 };
    }

    paymentRecord = newPayment;
    console.log("✅ Created new payment record from transfer:", paymentRecord.id);
  }

  // Get customer identification from payment record
  const customerName = paymentRecord.customer_name;
  const customerEmail = paymentRecord.customer_email;
  const customerPhone = paymentRecord.customer_phone;
  const parentName = paymentRecord.metadata?.parentName || paymentRecord.customer_name;
  const selectedStudents = paymentRecord.metadata?.selectedStudents || [];
  const isSchoolPage = paymentPage.page_type === "school";

  console.log("👤 Payment Identification:");
  console.log("   Payer Name:", customerName);
  console.log("   Payer Email:", customerEmail);
  console.log("   Parent Name:", parentName);
  console.log("   Selected Students:", selectedStudents);
  console.log("   Narration from bank:", narration);

  // Update payment to completed
  const { error: updateError } = await supabase
    .from("payment_page_payments")
    .update({
      status: "completed",
      nomba_transaction_id: nombaTransactionId,
      paid_at: new Date().toISOString(),
      net_amount: netAmount,
      metadata: {
        ...paymentRecord.metadata,
        bank_transaction_id: nombaTransactionId,
        bank_narration: narration,
        sender_name: senderName,
        payment_confirmed_at: new Date().toISOString(),
      },
    })
    .eq("id", paymentRecord.id)
    .eq("status", "pending");

  if (updateError) {
    console.error("❌ Failed to update payment:", updateError);
    return { error: "Failed to update payment", status: 500 };
  }

  console.log("✅ Payment updated to completed");

  // Credit creator's balance
  const { data: newBalance, error: balanceError } = await supabase.rpc(
    "increment_page_balance",
    { p_page_id: paymentPage.id, p_amount: netAmount },
  );

  if (balanceError) {
    console.error("❌ Failed to increment balance:", balanceError);
  } else {
    console.log(`✅ Credited ₦${netAmount} to page balance. New balance: ₦${newBalance}`);
  }

  // Update student paid status for school pages
  if (isSchoolPage && selectedStudents.length > 0) {
    const amountPerStudent = transactionAmount / selectedStudents.length;
    for (const studentName of selectedStudents) {
      await updateStudentPaidStatus(
        paymentPage.id,
        studentName,
        parentName,
        amountPerStudent,
      );
    }
  } else if (isSchoolPage && narration) {
    // Try to match student from narration
    const students = paymentPage.metadata?.students || [];
    const matchedStudent = students.find((s: any) => 
      narration.toLowerCase().includes((s.name || "").toLowerCase())
    );
    if (matchedStudent) {
      await updateStudentPaidStatus(
        paymentPage.id,
        matchedStudent.name,
        parentName,
        transactionAmount,
      );
    }
  }

  // Create transaction record for accounting
  const { error: txError } = await supabase.from("transactions").insert({
    user_id: paymentPage.user_id,
    type: "credit",
    amount: transactionAmount,
    fee: nombaFee,
    net_amount: netAmount,
    status: "success",
    reference: `VA-${paymentPage.id}-${nombaTransactionId}`,
    description: `Bank transfer payment for page "${paymentPage.title}" from ${customerName}${selectedStudents.length > 0 ? ` for ${selectedStudents.join(", ")}` : ''}`,
    channel: "payment_page_virtual_account",
    sender: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      bank_transfer: true,
      narration: narration,
    },
    receiver: {
      user_id: paymentPage.user_id,
      payment_page_id: paymentPage.id,
    },
    external_response: {
      nomba_transaction_id: nombaTransactionId,
      nomba_fee: nombaFee,
      payment_method: "virtual_account",
    },
  });

  if (txError) {
    console.error("❌ Failed to create transaction record:", txError);
  } else {
    console.log("✅ Transaction record created");
  }

  // ========== SEND PDF RECEIPT TO CUSTOMER ==========
  if (customerEmail) {
    console.log(`📧 [WEBHOOK] Sending PDF receipt to: ${customerEmail}`);
    try {
      const receiptResult = await sendPaymentPageReceiptWithPDF(
        customerEmail,
        paymentPage,
        paymentRecord,
        customerName,
        transactionAmount,
        nombaTransactionId,
        "virtual_account",
        new Date().toISOString(),
        {
          pageType: paymentPage.page_type,
          pageTitle: paymentPage.title,
          parentName: parentName,
          selectedStudents: selectedStudents,
          narration: narration,
          payment_method: "virtual_account",
          bank_transfer: true,
        },
      );
      console.log(`✅ [WEBHOOK] PDF Receipt sent successfully to: ${customerEmail}`);
      console.log(`📧 [WEBHOOK] Receipt result:`, receiptResult);
    } catch (error) {
      console.error(`❌ [WEBHOOK] Failed to send PDF receipt to ${customerEmail}:`, error);
    }
  } else {
    console.warn(`⚠️ [WEBHOOK] No customer email found, skipping receipt`);
  }

  // Send notification to merchant
  const { data: creator } = await supabase
    .from("users")
    .select("email")
    .eq("id", paymentPage.user_id)
    .single();

  if (creator?.email) {
    console.log(`📧 [WEBHOOK] Sending merchant notification to: ${creator.email}`);
    await sendPaymentPageNotificationEmail(
      creator.email,
      paymentPage.title,
      netAmount,
      customerName,
      customerEmail || "",
      customerPhone || "",
      selectedStudents,
      narration,
      nombaFee,
    );
  }

  console.log("🎉 ========== PAYMENT PAGE VIRTUAL ACCOUNT PROCESSING COMPLETED ==========");
  console.log(`   Payer: ${customerName}`);
  console.log(`   Students: ${selectedStudents.join(", ") || "N/A"}`);
  console.log(`   Amount: ₦${transactionAmount.toLocaleString()}`);
  console.log(`   Receipt sent to: ${customerEmail || "No email"}`);

  return {
    success: true,
    message: "Virtual account payment processed",
    credited_amount: netAmount,
    new_balance: newBalance,
    payment_id: paymentRecord.id,
  };
}

// Helper to check if this is a payment page virtual account
export function checkIfPaymentPageVirtualAccount(
  aliasAccountReference: string,
): boolean {
  if (!aliasAccountReference) return false;
  // Check for PP prefix (Payment Page virtual accounts)
  return aliasAccountReference.startsWith("PP");
}