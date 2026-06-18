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
  transferReference?: string;
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
      students?: string[];
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
  customFields?: any,
  selectedStudents?: string[],
): Promise<void> {
  if (!creatorEmail || !creatorEmail.includes('@')) return;
  
  const totalFee = nombaFee + appFee;
  const netAmount = amount - totalFee;
  
  // Build student list HTML
  let studentsHtml = '';
  if (selectedStudents && selectedStudents.length > 0) {
    studentsHtml = `
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
        <p style="font-weight: 600; margin-bottom: 5px;">Students:</p>
        <ul style="margin: 0; padding-left: 20px;">
          ${selectedStudents.map(name => `<li>${name}</li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  // Build custom fields HTML
  let customFieldsHtml = '';
  if (customFields && Object.keys(customFields).length > 0) {
    customFieldsHtml = `
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
        <p style="font-weight: 600; margin-bottom: 5px;">Additional Information:</p>
        ${Object.entries(customFields)
          .filter(([key]) => !['customAmount', 'name', 'email', 'phone'].includes(key))
          .map(([key, value]) => `
            <p style="margin: 2px 0; font-size: 14px;">
              <strong>${key}:</strong> ${value || 'N/A'}
            </p>
          `).join('')}
      </div>
    `;
  }
  
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
            ${customerEmail ? `<p><strong>Email:</strong> ${customerEmail}</p>` : ''}
            ${studentsHtml}
            ${customFieldsHtml}
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
  studentNames: string[],
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
      const studentName = student.name || student.childName || student.studentName;
      const isSelected = studentNames.some(
        name => name?.toLowerCase().trim() === studentName?.toLowerCase().trim()
      );
      
      if (isSelected) {
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
    
    console.log(`✅ Updated paid status for students: ${studentNames.join(', ')}`);
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

// ============================================================
// HELPER: Extract narration code from transaction
// Supports both PL_XXXX and PLXXXX formats
// ============================================================
function extractNarrationCode(narration: string): string | null {
  if (!narration) return null;
  
  console.log(`🔍 Extracting narration code from: ${narration.substring(0, 50)}...`);
  
  // Try multiple patterns in order of specificity
  const patterns = [
    /PL_[A-Z0-9]{4,6}/,    // PL_XXXX, PL_XXXXX, PL_XXXXXX
    /PL[A-Z0-9]{4,6}/,     // PLXXXX, PLXXXXX, PLXXXXXX
    /PL_[A-Z0-9]+/,        // PL_ followed by any alphanumeric
    /PL[A-Z0-9_]+/,        // PL followed by alphanumeric or underscore
  ];
  
  for (const pattern of patterns) {
    const match = narration.match(pattern);
    if (match) {
      const code = match[0];
      console.log(`✅ Extracted narration code: ${code}`);
      return code;
    }
  }
  
  // If no pattern matches, try to find any PL prefix
  const fallbackMatch = narration.match(/PL[A-Z0-9_]{2,}/);
  if (fallbackMatch) {
    console.log(`✅ Extracted fallback narration code: ${fallbackMatch[0]}`);
    return fallbackMatch[0];
  }
  
  console.log(`⚠️ No narration code found in: ${narration.substring(0, 50)}...`);
  return null;
}

// ============================================================
// HELPER: Normalize narration code (remove underscores for comparison)
// ============================================================
function normalizeNarrationCode(code: string): string {
  if (!code) return '';
  return code.replace(/_/g, '').toUpperCase();
}

// ============================================================
// HELPER: Extract student names from narration
// ============================================================
function extractStudentNamesFromNarration(narration: string, students: any[]): string[] {
  if (!narration || !students || students.length === 0) return [];
  
  const matchedStudents: string[] = [];
  
  for (const student of students) {
    const studentName = student.name || student.childName || student.studentName;
    if (studentName && narration.toLowerCase().includes(studentName.toLowerCase())) {
      matchedStudents.push(studentName);
    }
  }
  
  return matchedStudents;
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
    transferReference,
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
  console.log("📄 Page type:", paymentPage.page_type);

  // ============================================================
  // FIND PENDING PAYMENT BY NARRATION CODE
  // ============================================================
  let pendingPayment = null;
  const narration = tx?.narration || tx?.senderName || "";
  
  // Extract narration code from the transaction narration
  const narrationCode = extractNarrationCode(narration);
  const normalizedNarrationCode = narrationCode ? normalizeNarrationCode(narrationCode) : null;
  
  console.log(`🔍 Extracted narration code: ${narrationCode || 'none'}`);
  console.log(`🔍 Normalized narration code: ${normalizedNarrationCode || 'none'}`);

  // Check for duplicate webhook FIRST
  const { data: existingWebhook } = await supabase
    .from("payment_page_payments")
    .select("id")
    .eq("nomba_transaction_id", nombaTransactionId)
    .maybeSingle();

  if (existingWebhook) {
    console.log(`⏭️ Webhook already processed for transaction: ${nombaTransactionId}`);
    return { success: true, message: "Already processed" };
  }

  // ============================================================
  // STRATEGY 1: Find pending payment by narration code
  // ============================================================
  if (narrationCode) {
    console.log(`🔍 Looking for pending payment with narration code: ${narrationCode}`);
    
    // Get all pending payments for this page
    const { data: pendingPayments, error: findError } = await supabase
      .from("payment_page_payments")
      .select("id, metadata, customer_name, customer_email, customer_phone, transfer_reference, student_name, selected_students, parent_name")
      .eq("payment_page_id", paymentPage.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    
    if (pendingPayments && pendingPayments.length > 0) {
      console.log(`📦 Found ${pendingPayments.length} pending payments for this page`);
      
      for (const payment of pendingPayments) {
        const paymentNarration = payment.metadata?.narration;
        const normalizedPaymentNarration = paymentNarration ? normalizeNarrationCode(paymentNarration) : null;
        
        console.log(`📦 Checking payment ${payment.id.substring(0, 8)}: narration = ${paymentNarration}, normalized = ${normalizedPaymentNarration}`);
        
        // Check exact match
        if (paymentNarration === narrationCode) {
          pendingPayment = payment;
          console.log(`✅ Found pending payment by exact narration match: ${pendingPayment.id}`);
          break;
        }
        
        // Check normalized match (ignoring underscores)
        if (normalizedPaymentNarration && normalizedNarrationCode && 
            normalizedPaymentNarration === normalizedNarrationCode) {
          pendingPayment = payment;
          console.log(`✅ Found pending payment by normalized match (ignoring underscores): ${pendingPayment.id}`);
          console.log(`   Payment: ${paymentNarration} -> Normalized: ${normalizedPaymentNarration}`);
          console.log(`   Webhook: ${narrationCode} -> Normalized: ${normalizedNarrationCode}`);
          break;
        }
        
        // Check if narration code is contained in the payment narration
        if (paymentNarration && narrationCode && paymentNarration.includes(narrationCode)) {
          pendingPayment = payment;
          console.log(`✅ Found pending payment by narration contains match: ${pendingPayment.id}`);
          break;
        }
        
        // Check if payment narration is contained in the narration code
        if (paymentNarration && narrationCode && narrationCode.includes(paymentNarration)) {
          pendingPayment = payment;
          console.log(`✅ Found pending payment by reverse contains match: ${pendingPayment.id}`);
          break;
        }
        
        // Check if normalized versions contain each other
        if (normalizedPaymentNarration && normalizedNarrationCode) {
          if (normalizedPaymentNarration.includes(normalizedNarrationCode) ||
              normalizedNarrationCode.includes(normalizedPaymentNarration)) {
            pendingPayment = payment;
            console.log(`✅ Found pending payment by normalized contains match: ${pendingPayment.id}`);
            break;
          }
        }
      }
    }
  }

  // ============================================================
  // STRATEGY 2: Find by transfer reference
  // ============================================================
  if (!pendingPayment && transferReference) {
    console.log(`🔍 Looking for pending payment by transfer reference: ${transferReference}`);
    
    const { data: existing, error: findError } = await supabase
      .from("payment_page_payments")
      .select("id, metadata, customer_name, customer_email, customer_phone, transfer_reference, student_name, selected_students, parent_name")
      .eq("transfer_reference", transferReference)
      .eq("status", "pending")
      .maybeSingle();
    
    if (existing) {
      pendingPayment = existing;
      console.log(`✅ Found pending payment by transfer reference: ${pendingPayment.id}`);
    }
  }

  // ============================================================
  // STRATEGY 3: Find by narration text fallback
  // ============================================================
  if (!pendingPayment && narration.length > 5) {
    console.log(`🔍 Looking for pending payment by narration text fallback: ${narration.substring(0, 30)}...`);
    
    const { data: pendingPayments, error: findError } = await supabase
      .from("payment_page_payments")
      .select("id, metadata, customer_name, customer_email, customer_phone, transfer_reference, student_name, selected_students, parent_name")
      .eq("payment_page_id", paymentPage.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    
    if (pendingPayments && pendingPayments.length > 0) {
      for (const payment of pendingPayments) {
        const paymentNarration = payment.metadata?.narration;
        if (paymentNarration && narration.includes(paymentNarration)) {
          pendingPayment = payment;
          console.log(`✅ Found pending payment by narration text match: ${pendingPayment.id}`);
          break;
        }
        if (paymentNarration && paymentNarration.includes(narration.substring(0, 10))) {
          pendingPayment = payment;
          console.log(`✅ Found pending payment by partial narration text match: ${pendingPayment.id}`);
          break;
        }
      }
    }
  }

  // ============================================================
  // PREPARE DATA FOR PAYMENT
  // ============================================================
  const senderName = tx?.senderName || customer?.name || pendingPayment?.customer_name || "Bank Transfer Customer";
  const customerEmail = customer?.email || pendingPayment?.customer_email || null;
  const customerPhone = pendingPayment?.customer_phone || tx?.senderPhone || null;

  // ============================================================
  // HANDLE STUDENT MATCHING FOR SCHOOL PAGES
  // ============================================================
  let matchedStudentNames: string[] = [];
  let matchedParentName = null;
  const students = paymentPage.metadata?.students || [];
  
  // First, check if the pending payment has selected students
  if (pendingPayment) {
    if (pendingPayment.selected_students && Array.isArray(pendingPayment.selected_students) && pendingPayment.selected_students.length > 0) {
      matchedStudentNames = pendingPayment.selected_students;
      matchedParentName = pendingPayment.parent_name || senderName;
      console.log(`✅ Found ${matchedStudentNames.length} students from pending payment:`, matchedStudentNames);
    } else if (pendingPayment.student_name) {
      matchedStudentNames = [pendingPayment.student_name];
      matchedParentName = pendingPayment.parent_name || senderName;
      console.log(`✅ Found single student from pending payment: ${pendingPayment.student_name}`);
    }
  }
  
  // If no students from pending payment, try to extract from narration
  if (matchedStudentNames.length === 0 && students.length > 0) {
    matchedStudentNames = extractStudentNamesFromNarration(narration, students);
    matchedParentName = senderName;
    if (matchedStudentNames.length > 0) {
      console.log(`✅ Matched ${matchedStudentNames.length} students from narration:`, matchedStudentNames);
    }
  }

  // If still no students and it's a school page, try to find from narration
  if (matchedStudentNames.length === 0 && paymentPage.page_type === "school") {
    for (const student of students) {
      const studentName = student.name || student.childName || student.studentName;
      if (studentName && narration.toLowerCase().includes(studentName.toLowerCase())) {
        matchedStudentNames.push(studentName);
      }
    }
    if (matchedStudentNames.length > 0) {
      matchedParentName = senderName;
      console.log(`✅ Matched ${matchedStudentNames.length} students from narration fallback:`, matchedStudentNames);
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
      narration: narrationCode || narration,
    };
  }

  // Add webhook data (overwrites conflicting keys)
  const webhookData = {
    narration: narrationCode || narration,
    bank_transaction_id: nombaTransactionId,
    matched_students: matchedStudentNames,
    matched_parent: matchedParentName,
    gross_amount: transactionAmount,
    nomba_fee: nombaFee,
    app_fee: appFee,
    total_fee: totalFee,
    net_credit: netAmount,
    webhook_processed_at: new Date().toISOString(),
  };

  // Merge: webhook data takes precedence, but preserve user data
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
    
    const updateData: any = {
      status: "completed",
      nomba_transaction_id: nombaTransactionId,
      paid_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
      net_amount: netAmount,
      amount: transactionAmount,
      fee: totalFee,
      customer_name: pendingPayment.customer_name || senderName,
      customer_email: pendingPayment.customer_email || customerEmail,
      customer_phone: pendingPayment.customer_phone || customerPhone,
      metadata: mergedMetadata,
      receipt_sent: false,
    };
    
    // Preserve student data if it's a school page
    if (paymentPage.page_type === "school") {
      if (matchedStudentNames.length === 1) {
        updateData.student_name = matchedStudentNames[0];
        updateData.parent_name = matchedParentName || senderName;
      } else if (matchedStudentNames.length > 1) {
        updateData.selected_students = matchedStudentNames;
        updateData.parent_name = matchedParentName || senderName;
      }
    }
    
    const { data: updated, error: updateError } = await supabase
      .from("payment_page_payments")
      .update(updateData)
      .eq("id", pendingPayment.id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update payment:", updateError);
      return { error: "Failed to update payment", status: 500 };
    }
    
    paymentResult = updated;
    console.log(`✅ Updated pending payment: ${paymentResult.id}`);
    console.log(`✅ Customer: ${paymentResult.customer_name}, Email: ${paymentResult.customer_email}`);
    if (matchedStudentNames.length > 0) {
      console.log(`✅ Students: ${matchedStudentNames.join(', ')}`);
    }
  } else {
    // CREATE new payment record (fallback)
    console.log(`📝 Creating new payment record (no pending payment found)`);
    console.log(`⚠️ This means user data (name, email, custom fields) will be missing!`);
    
    const insertData: any = {
      payment_page_id: paymentPage.id,
      user_id: paymentPage.user_id,
      amount: transactionAmount,
      fee: totalFee,
      net_amount: netAmount,
      status: "pending",
      customer_name: senderName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      payment_method: "virtual_account",
      order_reference: orderReference,
      metadata: mergedMetadata,
      receipt_sent: false,
    };
    
    // Add student data for school pages
    if (paymentPage.page_type === "school") {
      if (matchedStudentNames.length === 1) {
        insertData.student_name = matchedStudentNames[0];
        insertData.parent_name = matchedParentName || senderName;
      } else if (matchedStudentNames.length > 1) {
        insertData.selected_students = matchedStudentNames;
        insertData.parent_name = matchedParentName || senderName;
      }
    }
    
    const { data: payment, error: insertError } = await supabase
      .from("payment_page_payments")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create payment:", insertError);
      return { error: "Failed to create payment", status: 500 };
    }
    
    paymentResult = payment;
    
    // Update to completed
    const completeData: any = {
      status: "completed",
      nomba_transaction_id: nombaTransactionId,
      paid_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
      net_amount: netAmount,
    };
    
    const { data: completed, error: completeError } = await supabase
      .from("payment_page_payments")
      .update(completeData)
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
  // UPDATE STUDENT PAID STATUS FOR SCHOOL PAGES
  // ============================================================
  if (paymentPage.page_type === "school" && matchedStudentNames.length > 0) {
    // Calculate amount per student
    const amountPerStudent = transactionAmount / matchedStudentNames.length;
    
    await updateStudentPaidStatus(
      paymentPage.id,
      matchedStudentNames,
      matchedParentName || senderName,
      amountPerStudent,
    );
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
    description: `Bank transfer payment for "${paymentPage.title}" from ${senderName}${matchedStudentNames.length > 0 ? ` for ${matchedStudentNames.join(', ')}` : ''}`,
    channel: "payment_page_virtual_account",
    sender: { 
      name: senderName, 
      email: customerEmail, 
      phone: customerPhone,
      narration: narration,
      gross_amount: transactionAmount,
      nomba_fee: nombaFee,
      app_fee: appFee,
      total_fee: totalFee,
      net_credit: netAmount,
      custom_fields: mergedMetadata.customFields || null,
      students: matchedStudentNames.length > 0 ? matchedStudentNames : null,
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

  // ============================================================
  // SEND RECEIPT TO CUSTOMER
  // ============================================================
  if (customerEmail) {
    console.log(`📧 Sending receipt to: ${customerEmail}`);
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
        narration: narrationCode || narration,
        matched_students: matchedStudentNames,
        matched_parent: matchedParentName,
        gross_amount: transactionAmount,
        nomba_fee: nombaFee,
        app_fee: appFee,
        total_fee: totalFee,
        net_amount: netAmount,
        custom_fields: mergedMetadata.customFields || null,
        reference_code: mergedMetadata.referenceCode || null,
        selected_students: matchedStudentNames,
      },
    ).catch(err => console.error("Failed to send receipt:", err));
    
    await supabase
      .from("payment_page_payments")
      .update({ receipt_sent: true })
      .eq("id", paymentResult.id);
  } else {
    console.log(`⚠️ No customer email found, receipt not sent`);
  }

  // ============================================================
  // SEND NOTIFICATION TO PAGE CREATOR
  // ============================================================
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
      narrationCode || narration,
      nombaFee,
      appFee,
      mergedMetadata.customFields || null,
      matchedStudentNames.length > 0 ? matchedStudentNames : null,
    );
  }

  // ============================================================
  // UPDATE PAYMENT PAGE STATS
  // ============================================================
  await supabase
    .from("payment_pages")
    .update({
      total_revenue: supabase.rpc('increment', { row_count: transactionAmount }),
      total_payments: supabase.rpc('increment', { row_count: 1 }),
    })
    .eq("id", paymentPage.id);

  // ============================================================
  // FINAL LOG
  // ============================================================
  console.log("🎉 ========== PAYMENT PROCESSING COMPLETED ==========");
  console.log(`   Gross: ₦${transactionAmount.toLocaleString()}`);
  console.log(`   Nomba Fee: -₦${nombaFee.toLocaleString()}`);
  console.log(`   App Fee (2%): -₦${appFee.toLocaleString()}`);
  console.log(`   Total Fees: -₦${totalFee.toLocaleString()}`);
  console.log(`   Net Credited: ₦${netAmount.toLocaleString()}`);
  console.log(`   Page Type: ${paymentPage.page_type}`);
  console.log(`   Students (${matchedStudentNames.length}): ${matchedStudentNames.join(', ') || 'N/A'}`);
  console.log(`   Customer: ${senderName} (${customerEmail || 'no email'})`);
  console.log(`   Customer Phone: ${customerPhone || 'no phone'}`);
  console.log(`   Custom Fields:`, mergedMetadata.customFields || 'None');
  console.log(`   Narration Code: ${narrationCode || 'none'}`);
  console.log(`   Payment ID: ${paymentResult.id}`);
  console.log(`   Receipt Sent: ${customerEmail ? 'Yes' : 'No'}`);
  console.log(`   Pending Payment Found: ${pendingPayment ? 'Yes' : 'No'}`);

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
    students: matchedStudentNames,
  };
}

export function checkIfPaymentPageVirtualAccount(aliasAccountReference: string): boolean {
  return aliasAccountReference?.startsWith("PP") ?? false;
}