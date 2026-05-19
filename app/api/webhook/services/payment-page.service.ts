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

// Function to send notification to merchant
async function sendPaymentPageNotificationEmail(
  creatorEmail: string,
  pageTitle: string,
  amount: number,
  customerName: string,
  fee?: number,
  metadata?: any,
): Promise<void> {
  console.log(`📧 [NOTIFICATION] Sending merchant notification to: ${creatorEmail}`);
  
  if (!creatorEmail || !creatorEmail.includes('@')) {
    console.error(`❌ [NOTIFICATION] Invalid merchant email: ${creatorEmail}`);
    return;
  }
  
  try {
    let additionalInfo = "";

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

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: creatorEmail,
      subject: `💰 Bank Transfer Received for "${pageTitle}" - ₦${amount.toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: #22c55e;">✅ Bank Transfer Received! 🏦</h3>
          <p>You've received a bank transfer payment for your payment page <strong>${pageTitle}</strong>.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
            ${fee ? `<p><strong>Processing Fee:</strong> ₦${fee.toLocaleString()}</p>` : ""}
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Payment Method:</strong> Bank Transfer</p>
            <p><strong>Status:</strong> <span style="color: #22c55e;">Completed</span></p>
          </div>
          ${additionalInfo}
          <p>The funds have been added to your payment page balance. You can withdraw them to your bank account anytime.</p>
          <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
        </div>
      `,
    });

    console.log(`✅ Notification sent to ${creatorEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send notification to ${creatorEmail}:`, error);
  }
}

// Function to update student paid status
async function updateStudentPaidStatus(
  paymentPageId: string,
  childName: string,
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
      if (studentName?.toLowerCase().trim() === childName?.toLowerCase().trim()) {
        return {
          ...student,
          paid: true,
          paidAt: new Date().toISOString(),
          paidAmount: (student.paidAmount || 0) + amount,
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
  } catch (error) {
    console.error("Error updating student paid status:", error);
  }
}

// ============================================================
// PROCESS PAYMENT PAGE VIRTUAL ACCOUNT (BANK TRANSFER ONLY)
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

  // Extract payment page ID from virtual account reference (PP- prefix)
  const extractPaymentPageId = (ref: string): string | null => {
    if (!ref) return null;
    // Pattern for PP-{pageId} format
    const ppPattern = /^PP-([a-f0-9]{8,36})/i;
    const match = ref.match(ppPattern);
    return match ? match[1] : null;
  };

  const paymentPageId = extractPaymentPageId(aliasAccountReference);

  if (!paymentPageId) {
    console.error("❌ Invalid virtual account reference - no PP- prefix found");
    return { error: "Invalid virtual account reference", status: 400 };
  }

  // Get payment page details
  const { data: paymentPage, error: pageError } = await supabase
    .from("payment_pages")
    .select("id, title, user_id, page_type, metadata")
    .eq("id", paymentPageId)
    .single();

  if (pageError || !paymentPage) {
    console.error("❌ Payment page not found:", paymentPageId);
    return { error: "Payment page not found", status: 404 };
  }

  console.log("✅ Payment page found:", paymentPage.title);

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

  const netAmount = transactionAmount - nombaFee;
  const customerName = customer?.name || tx?.senderName || "Bank Transfer Customer";
  const customerEmail = customer?.email || null;
  const narration = tx?.narration || "";

  // Find pending payment for this page with matching amount
  const { data: pendingPayment } = await supabase
    .from("payment_page_payments")
    .select("*")
    .eq("payment_page_id", paymentPageId)
    .eq("status", "pending")
    .eq("amount", transactionAmount)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let paymentRecord = pendingPayment;

  // If no pending payment found, create one
  if (!paymentRecord) {
    console.log("📝 No pending payment found, creating new payment record");
    const orderReference = `VA-${paymentPage.id.substring(0, 8)}-${Date.now()}`;
    
    const { data: newPayment, error: insertError } = await supabase
      .from("payment_page_payments")
      .insert({
        payment_page_id: paymentPageId,
        user_id: paymentPage.user_id,
        amount: transactionAmount,
        fee: nombaFee,
        net_amount: netAmount,
        status: "pending",
        customer_name: customerName,
        customer_email: customerEmail,
        payment_method: "virtual_account",
        order_reference: orderReference,
        metadata: {
          virtual_account_number: aliasAccountReference,
          narration: narration,
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ Failed to create payment record:", insertError);
      return { error: "Failed to create payment record", status: 500 };
    }

    paymentRecord = newPayment;
    console.log("✅ Created new payment record:", paymentRecord.id);
  }

  // Update payment to completed
  const { error: updateError } = await supabase
    .from("payment_page_payments")
    .update({
      status: "completed",
      nomba_transaction_id: nombaTransactionId,
      paid_at: new Date().toISOString(),
      net_amount: netAmount,
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
    { p_page_id: paymentPageId, p_amount: netAmount },
  );

  if (balanceError) {
    console.error("❌ Failed to increment balance:", balanceError);
  } else {
    console.log(`✅ Credited ₦${netAmount} to page balance. New balance: ₦${newBalance}`);
  }

  // Update student paid status for school pages
  const childName = tx?.metadata?.childName;
  const parentName = tx?.metadata?.parentName || customerName;
  
  if (paymentPage.page_type === "school" && childName) {
    await updateStudentPaidStatus(paymentPageId, childName, parentName, transactionAmount);
  }

  // Create transaction record
  const { error: txError } = await supabase.from("transactions").insert({
    user_id: paymentPage.user_id,
    type: "credit",
    amount: transactionAmount,
    fee: nombaFee,
    net_amount: netAmount,
    status: "success",
    reference: `VA-${paymentPageId}-${nombaTransactionId}`,
    description: `Bank transfer payment for page "${paymentPage.title}" from ${customerName}`,
    channel: "payment_page_virtual_account",
    sender: { name: customerName, email: customerEmail },
    receiver: { user_id: paymentPage.user_id, payment_page_id: paymentPageId },
    external_response: {
      nomba_transaction_id: nombaTransactionId,
      nomba_fee: nombaFee,
      virtual_account: aliasAccountReference,
    },
  });

  if (txError) {
    console.error("❌ Failed to create transaction record:", txError);
  } else {
    console.log("✅ Transaction record created");
  }

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
        "virtual_account",
        new Date().toISOString(),
        { narration, payment_method: "virtual_account" },
      );
      console.log(`✅ Receipt sent to: ${customerEmail}`);
    } catch (error) {
      console.error("Failed to send receipt:", error);
    }
  }

  // Send notification to merchant
  const { data: creator } = await supabase
    .from("users")
    .select("email")
    .eq("id", paymentPage.user_id)
    .single();

  if (creator?.email) {
    await sendPaymentPageNotificationEmail(
      creator.email,
      paymentPage.title,
      netAmount,
      customerName,
      nombaFee,
      { pageType: paymentPage.page_type },
    );
  }

  console.log("🎉 ========== PAYMENT PAGE VIRTUAL ACCOUNT PROCESSING COMPLETED ==========");

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
  // Check for PP- prefix (Payment Page virtual accounts)
  return aliasAccountReference.startsWith("PP-");
}