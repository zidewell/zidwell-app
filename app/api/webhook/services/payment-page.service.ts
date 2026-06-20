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
// ============================================================
function extractNarrationCode(narration: string): string | null {
  if (!narration) return null;
  
  console.log(`🔍 Extracting narration code from: ${narration.substring(0, 50)}...`);
  
  // Try to extract the code before the first slash or space
  const beforeSlash = narration.split(/[/\s-]/)[0];
  if (beforeSlash && beforeSlash.startsWith('PL')) {
    console.log(`✅ Extracted narration code (before slash/space): ${beforeSlash}`);
    return beforeSlash;
  }
  
  // Try multiple patterns
  const patterns = [
    /PL_[A-Z0-9]{4,6}/,
    /PL[A-Z0-9]{4,6}/,
    /PL_[A-Z0-9]+/,
    /PL[A-Z0-9_]+/,
  ];
  
  for (const pattern of patterns) {
    const match = narration.match(pattern);
    if (match) {
      console.log(`✅ Extracted narration code: ${match[0]}`);
      return match[0];
    }
  }
  
  const fallbackMatch = narration.match(/PL[A-Z0-9_]{2,}/);
  if (fallbackMatch) {
    console.log(`✅ Extracted fallback narration code: ${fallbackMatch[0]}`);
    return fallbackMatch[0];
  }
  
  console.log(`⚠️ No narration code found`);
  return null;
}

// ============================================================
// HELPER: Normalize narration code (remove underscores, spaces, dashes)
// ============================================================
function normalizeNarrationCode(code: string): string {
  if (!code) return '';
  return code.replace(/[_\s-]/g, '').toUpperCase();
}

// ============================================================
// HELPER: Check if two narration codes match
// ============================================================
function doNarrationCodesMatch(code1: string, code2: string): boolean {
  if (!code1 || !code2) return false;
  
  const normalized1 = normalizeNarrationCode(code1);
  const normalized2 = normalizeNarrationCode(code2);
  
  console.log(`   Comparing: "${normalized1}" vs "${normalized2}"`);
  
  // 1. Exact match after normalization
  if (normalized1 === normalized2) {
    console.log(`   ✅ Exact normalized match`);
    return true;
  }
  
  // 2. Check if one contains the other
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    console.log(`   ✅ Contains match`);
    return true;
  }
  
  // 3. Check base match (first 4 characters)
  const base1 = normalized1.substring(0, 4);
  const base2 = normalized2.substring(0, 4);
  if (base1 === base2 && base1.length === 4) {
    console.log(`   ✅ Base match: ${base1}`);
    return true;
  }
  
  // 4. Check if the raw codes match (without normalization)
  if (code1 === code2) {
    console.log(`   ✅ Raw exact match`);
    return true;
  }
  
  return false;
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
  // STEP 1: Check for duplicate webhook
  // ============================================================
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
  // STEP 2: Extract narration code from webhook
  // ============================================================
  const narration = tx?.narration || tx?.senderName || "";
  const webhookNarrationCode = extractNarrationCode(narration);
  
  console.log(`🔍 Webhook narration code: ${webhookNarrationCode || 'none'}`);
  console.log(`🔍 Webhook normalized code: ${webhookNarrationCode ? normalizeNarrationCode(webhookNarrationCode) : 'none'}`);

  // ============================================================
  // STEP 3: FIND PENDING PAYMENT - THIS IS THE KEY STEP
  // ============================================================
  let pendingPayment = null;

  if (webhookNarrationCode) {
    console.log(`🔍 Searching for pending payment with narration code: ${webhookNarrationCode}`);
    
    // Get ALL pending payments for this page
    const { data: pendingPayments, error: findError } = await supabase
      .from("payment_page_payments")
      .select("id, metadata, customer_name, customer_email, customer_phone, transfer_reference, student_name, selected_students, parent_name, status")
      .eq("payment_page_id", paymentPage.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    
    if (pendingPayments && pendingPayments.length > 0) {
      console.log(`📦 Found ${pendingPayments.length} pending payments for this page`);
      
      for (const payment of pendingPayments) {
        const paymentNarration = payment.metadata?.narration || '';
        const paymentNarrationCode = extractNarrationCode(paymentNarration) || paymentNarration;
        
        console.log(`📦 Checking payment ${payment.id.substring(0, 8)}:`);
        console.log(`   Payment narration: "${paymentNarration}"`);
        console.log(`   Payment code: "${paymentNarrationCode}"`);
        console.log(`   Webhook code: "${webhookNarrationCode}"`);
        console.log(`   Customer: ${payment.customer_name} (${payment.customer_email})`);
        
        // Check if the codes match using our matching function
        const codesMatch = doNarrationCodesMatch(paymentNarrationCode, webhookNarrationCode);
        
        if (codesMatch) {
          pendingPayment = payment;
          console.log(`✅ ✅ ✅ FOUND MATCHING PENDING PAYMENT: ${pendingPayment.id}`);
          console.log(`   Customer: ${pendingPayment.customer_name}`);
          console.log(`   Email: ${pendingPayment.customer_email}`);
          break;
        }
      }
    }
    
    // If not found, try a broader search - look at ALL pending payments for this page
    if (!pendingPayment) {
      console.log(`🔍 No match found, trying broader search...`);
      
      const { data: allPending, error: allError } = await supabase
        .from("payment_page_payments")
        .select("id, metadata, customer_name, customer_email, customer_phone, transfer_reference, student_name, selected_students, parent_name, status")
        .eq("payment_page_id", paymentPage.id)
        .eq("status", "pending");
      
      if (allPending && allPending.length > 0) {
        for (const payment of allPending) {
          const paymentNarration = payment.metadata?.narration || '';
          
          // Check if the webhook code appears anywhere in the payment narration
          // This handles cases like "PLZ4GA" vs "PL_Z4G4 - ibrahim lawal"
          const normalizedPayment = normalizeNarrationCode(paymentNarration);
          const normalizedWebhook = normalizeNarrationCode(webhookNarrationCode);
          
          // Check if the first 4 characters match (base match)
          const baseMatch = normalizedPayment.substring(0, 4) === normalizedWebhook.substring(0, 4);
          
          // Check if one contains the other
          const containsMatch = normalizedPayment.includes(normalizedWebhook) || 
                               normalizedWebhook.includes(normalizedPayment);
          
          if (baseMatch || containsMatch) {
            pendingPayment = payment;
            console.log(`✅ ✅ ✅ Found pending payment by broad search: ${pendingPayment.id}`);
            console.log(`   Customer: ${pendingPayment.customer_name}`);
            console.log(`   Email: ${pendingPayment.customer_email}`);
            console.log(`   Match type: ${baseMatch ? 'base match' : 'contains match'}`);
            break;
          }
        }
      }
    }
  }

  // ============================================================
  // STEP 4: If still not found, try by transfer reference
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
      console.log(`   Customer: ${pendingPayment.customer_name}`);
      console.log(`   Email: ${pendingPayment.customer_email}`);
    }
  }

  // ============================================================
  // STEP 5: If still not found, use the most recent pending payment
  // ============================================================
  if (!pendingPayment) {
    console.log(`🔍 No pending payment found, using most recent pending payment`);
    
    const { data: latestPayment, error: latestError } = await supabase
      .from("payment_page_payments")
      .select("id, metadata, customer_name, customer_email, customer_phone, transfer_reference, student_name, selected_students, parent_name")
      .eq("payment_page_id", paymentPage.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (latestPayment) {
      pendingPayment = latestPayment;
      console.log(`✅ Using most recent pending payment: ${pendingPayment.id}`);
      console.log(`   Customer: ${pendingPayment.customer_name}`);
      console.log(`   Email: ${pendingPayment.customer_email}`);
    }
  }

  // ============================================================
  // STEP 6: Extract user data from pending payment
  // ============================================================
  const senderName = pendingPayment?.customer_name || tx?.senderName || customer?.name || "Bank Transfer Customer";
  const customerEmail = pendingPayment?.customer_email || customer?.email || null;
  const customerPhone = pendingPayment?.customer_phone || tx?.senderPhone || null;

  console.log(`📝 Customer data from pending payment:`);
  console.log(`   Name: ${pendingPayment?.customer_name || 'NOT FOUND'}`);
  console.log(`   Email: ${pendingPayment?.customer_email || 'NOT FOUND'}`);
  console.log(`   Phone: ${pendingPayment?.customer_phone || 'NOT FOUND'}`);
  console.log(`   Custom Fields:`, pendingPayment?.metadata?.customFields || 'none');

  // ============================================================
  // STEP 7: Handle student matching for school pages
  // ============================================================
  let matchedStudentNames: string[] = [];
  let matchedParentName = null;
  const students = paymentPage.metadata?.students || [];
  
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
  
  if (matchedStudentNames.length === 0 && students.length > 0) {
    matchedStudentNames = extractStudentNamesFromNarration(narration, students);
    matchedParentName = senderName;
    if (matchedStudentNames.length > 0) {
      console.log(`✅ Matched ${matchedStudentNames.length} students from narration:`, matchedStudentNames);
    }
  }

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
  // STEP 8: Build merged metadata - PRESERVES ALL USER DATA
  // ============================================================
  let mergedMetadata: any = pendingPayment?.metadata || {};

  if (!mergedMetadata || Object.keys(mergedMetadata).length === 0) {
    mergedMetadata = {
      narration: webhookNarrationCode || narration,
    };
  }

  // Add webhook data (overwrites conflicting keys)
  const webhookData = {
    narration: webhookNarrationCode || narration,
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
  // STEP 9: Create or update payment
  // ============================================================
  let paymentResult;

  if (pendingPayment) {
    console.log(`🔄 Updating existing pending payment: ${pendingPayment.id}`);
    console.log(`   Preserving customer name: ${pendingPayment.customer_name}`);
    console.log(`   Preserving customer email: ${pendingPayment.customer_email}`);
    
    const updateData: any = {
      status: "completed",
      nomba_transaction_id: nombaTransactionId,
      paid_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
      net_amount: netAmount,
      amount: transactionAmount,
      fee: totalFee,
      customer_name: pendingPayment.customer_name || senderName,  // PRESERVED
      customer_email: pendingPayment.customer_email || customerEmail,  // PRESERVED
      customer_phone: pendingPayment.customer_phone || customerPhone,  // PRESERVED
      metadata: mergedMetadata,  // PRESERVES ALL USER DATA
      receipt_sent: false,
    };
    
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
    console.log(`✅ Custom Fields:`, mergedMetadata.customFields || 'none');
    if (matchedStudentNames.length > 0) {
      console.log(`✅ Students: ${matchedStudentNames.join(', ')}`);
    }
  } else {
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
  // STEP 10: Update page balance
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
  // STEP 11: Update student paid status for school pages
  // ============================================================
  if (paymentPage.page_type === "school" && matchedStudentNames.length > 0) {
    const amountPerStudent = transactionAmount / matchedStudentNames.length;
    await updateStudentPaidStatus(
      paymentPage.id,
      matchedStudentNames,
      matchedParentName || senderName,
      amountPerStudent,
    );
  }

  // ============================================================
  // STEP 12: Create transaction record
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
  // STEP 13: SEND RECEIPT TO CUSTOMER - USING THE EMAIL FROM PENDING PAYMENT
  // ============================================================
  if (customerEmail) {
    console.log(`📧 Sending receipt to: ${customerEmail}`);
    await sendPaymentPageReceiptWithPDF(
      customerEmail,  // ✅ This is the user's email from the pending payment
      paymentPage,
      paymentResult,
      senderName,  // ✅ This is the user's name from the pending payment
      transactionAmount,
      nombaTransactionId,
      "virtual_account",
      new Date().toISOString(),
      {
        narration: webhookNarrationCode || narration,
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
  // STEP 14: Send notification to page creator
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
      webhookNarrationCode || narration,
      nombaFee,
      appFee,
      mergedMetadata.customFields || null,
      matchedStudentNames.length > 0 ? matchedStudentNames : null,
    );
  }

  // ============================================================
  // STEP 15: Update payment page stats
  // ============================================================
  await supabase
    .from("payment_pages")
    .update({
      total_revenue: supabase.rpc('increment', { row_count: transactionAmount }),
      total_payments: supabase.rpc('increment', { row_count: 1 }),
    })
    .eq("id", paymentPage.id);

  // ============================================================
  // STEP 16: Final log
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
  console.log(`   Narration Code: ${webhookNarrationCode || 'none'}`);
  console.log(`   Payment ID: ${paymentResult.id}`);
  console.log(`   Receipt Sent: ${customerEmail ? 'Yes' : 'No'}`);
  console.log(`   Pending Payment Found: ${pendingPayment ? 'Yes' : 'No'}`)

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
  if (!aliasAccountReference) return false;

  return aliasAccountReference.startsWith("PPL");
}