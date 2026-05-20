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

// Send notification to merchant
async function sendPaymentPageNotificationEmail(
  creatorEmail: string,
  pageTitle: string,
  amount: number,
  customerName: string,
  customerEmail: string,
  narration: string,
  fee?: number,
): Promise<void> {
  if (!creatorEmail || !creatorEmail.includes('@')) return;
  
  try {
    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: creatorEmail,
      subject: `💰 Payment Received for "${pageTitle}" - ₦${amount.toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: #22c55e;">✅ Payment Received! 🏦</h3>
          <p>You've received a bank transfer payment for <strong>${pageTitle}</strong>.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
            ${fee ? `<p><strong>Fee:</strong> ₦${fee.toLocaleString()}</p>` : ''}
            <p><strong>Sender:</strong> ${customerName}</p>
            <p><strong>Email:</strong> ${customerEmail || 'Not provided'}</p>
            <p><strong>Narration:</strong> ${narration || 'Not provided'}</p>
          </div>
          <p>Funds added to your page balance.</p>
          <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}

// Extract payment page ID from virtual account reference
function extractPaymentPageId(aliasAccountReference: string): string | null {
  if (!aliasAccountReference) return null;
  // Pattern for PP followed by alphanumeric
  const match = aliasAccountReference.match(/^PP([a-f0-9]+)/i);
  if (match) return match[1];
  return null;
}

// ============================================================
// PROCESS PAYMENT PAGE VIRTUAL ACCOUNT
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
  console.log("Transaction ID:", nombaTransactionId);
  console.log("Virtual Account Ref:", aliasAccountReference);
  console.log("Amount:", transactionAmount);
  console.log("Transaction Data:", JSON.stringify(tx, null, 2));

  // Extract payment page ID
  const shortPageId = extractPaymentPageId(aliasAccountReference);
  if (!shortPageId) {
    return { error: "Invalid virtual account reference", status: 400 };
  }

  // Find payment page
  const { data: paymentPage, error: pageError } = await supabase
    .from("payment_pages")
    .select("id, title, user_id, page_type, metadata")
    .ilike("id", `${shortPageId}%`)
    .single();

  if (pageError || !paymentPage) {
    console.error("Payment page not found:", shortPageId);
    return { error: "Payment page not found", status: 404 };
  }

  // Check for duplicate
  const { data: existing } = await supabase
    .from("payment_page_payments")
    .select("id")
    .eq("nomba_transaction_id", nombaTransactionId)
    .maybeSingle();

  if (existing) {
    return { success: true, message: "Already processed" };
  }

  // Extract payment details from narration
  const narration = tx?.narration || tx?.senderName || "";
  const senderName = tx?.senderName || customer?.name || "Bank Transfer Customer";
  const customerEmail = customer?.email || null;

  console.log("📝 Narration:", narration);
  console.log("👤 Sender:", senderName);

  // Try to find matching student from narration (for school pages)
  let matchedStudentName = null;
  let matchedParentName = null;
  const students = paymentPage.metadata?.students || [];
  
  // Check if narration contains any student name
  for (const student of students) {
    const studentName = student.name || student.childName;
    if (studentName && narration.toLowerCase().includes(studentName.toLowerCase())) {
      matchedStudentName = studentName;
      matchedParentName = senderName;
      console.log(`✅ Matched student from narration: ${studentName}`);
      break;
    }
  }

  // Create payment record
  const orderReference = `VA-${paymentPage.id.substring(0, 8)}-${Date.now()}`;
  const netAmount = transactionAmount - nombaFee;

  const { data: payment, error: insertError } = await supabase
    .from("payment_page_payments")
    .insert({
      payment_page_id: paymentPage.id,
      user_id: paymentPage.user_id,
      amount: transactionAmount,
      fee: nombaFee,
      net_amount: netAmount,
      status: "pending",
      customer_name: senderName,
      customer_email: customerEmail,
      payment_method: "virtual_account",
      order_reference: orderReference,
      metadata: {
        narration: narration,
        bank_transaction_id: nombaTransactionId,
        matched_student: matchedStudentName,
        matched_parent: matchedParentName,
      },
    })
    .select()
    .single();

  if (insertError) {
    console.error("Failed to create payment:", insertError);
    return { error: "Failed to create payment", status: 500 };
  }

  // Update payment to completed
  await supabase
    .from("payment_page_payments")
    .update({
      status: "completed",
      nomba_transaction_id: nombaTransactionId,
      paid_at: new Date().toISOString(),
      net_amount: netAmount,
    })
    .eq("id", payment.id);

  // Credit page balance
  await supabase.rpc("increment_page_balance", {
    p_page_id: paymentPage.id,
    p_amount: netAmount,
  });

  // Create transaction record
  await supabase.from("transactions").insert({
    user_id: paymentPage.user_id,
    type: "credit",
    amount: transactionAmount,
    fee: nombaFee,
    net_amount: netAmount,
    status: "success",
    reference: `VA-${paymentPage.id}-${nombaTransactionId}`,
    description: `Bank transfer for "${paymentPage.title}" from ${senderName}`,
    channel: "payment_page_virtual_account",
    sender: { name: senderName, email: customerEmail, narration: narration },
  });

  // Send receipt
  if (customerEmail) {
    await sendPaymentPageReceiptWithPDF(
      customerEmail,
      paymentPage,
      payment,
      senderName,
      transactionAmount,
      nombaTransactionId,
      "virtual_account",
      new Date().toISOString(),
      { narration, matched_student: matchedStudentName },
    );
  }

  // Send merchant notification
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
      senderName,
      customerEmail || "",
      narration,
      nombaFee,
    );
  }

  return {
    success: true,
    message: "Payment processed",
    credited_amount: netAmount,
    payment_id: payment.id,
  };
}

export function checkIfPaymentPageVirtualAccount(aliasAccountReference: string): boolean {
  return aliasAccountReference?.startsWith("PP") ?? false;
}