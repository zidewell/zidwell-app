import { createClient } from "@supabase/supabase-js";
import { transporter } from "@/lib/node-mailer";

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

async function sendPaymentPageNotificationEmail(
  creatorEmail: string,
  pageTitle: string,
  amount: number,
  customerName: string,
  fee?: number,
  metadata?: any,
) {
  try {
    let additionalInfo = "";
    if (metadata?.pageType === "school") {
      additionalInfo = `
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
          <p><strong>Student Information:</strong></p>
          <p>Parent: ${metadata.parentName || "N/A"}</p>
          <p>Student: ${metadata.childName || "N/A"}</p>
          <p>Reg Number: ${metadata.regNumber || "N/A"}</p>
        </div>
      `;
    } else if (metadata?.pageType === "physical") {
      additionalInfo = `
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
          <p><strong>Shipping Information:</strong></p>
          <p>Quantity: ${metadata.quantity || "1"}</p>
          <p>Address: ${metadata.address || "N/A"}</p>
        </div>
      `;
    } else if (metadata?.pageType === "services" && metadata.bookingDate) {
      additionalInfo = `
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
          <p><strong>Booking Details:</strong></p>
          <p>Date: ${metadata.bookingDate || "N/A"}</p>
          <p>Time: ${metadata.bookingTime || "N/A"}</p>
        </div>
      `;
    }

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: creatorEmail,
      subject: `💰 Payment Received for "${pageTitle}" - ₦${amount.toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: #22c55e;">✅ Payment Received!</h3>
          <p>You've received a payment for your payment page <strong>${pageTitle}</strong>.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
            ${fee ? `<p><strong>Processing Fee:</strong> ₦${fee.toLocaleString()}</p>` : ""}
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Status:</strong> <span style="color: #22c55e;">Completed</span></p>
          </div>
          ${additionalInfo}
          <p>The funds have been added to your payment page balance. You can withdraw them to your main wallet anytime.</p>
          <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send payment page notification:", error);
  }
}

async function sendPaymentPageReceiptEmail(
  customerEmail: string,
  pageTitle: string,
  amount: number,
  reference: string,
  metadata?: any,
) {
  try {
    let additionalInfo = "";
    if (metadata?.pageType === "school") {
      additionalInfo = `
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
          <p><strong>Student Information:</strong></p>
          <p>Student Name: ${metadata.childName || "N/A"}</p>
          <p>Registration Number: ${metadata.regNumber || "N/A"}</p>
        </div>
      `;
    } else if (metadata?.pageType === "digital" && metadata.downloadUrl) {
      additionalInfo = `
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
          <p><strong>Download Link:</strong></p>
          <p><a href="${metadata.downloadUrl}" style="color: #e1bf46;">Click here to download</a></p>
        </div>
      `;
    }

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `Payment Receipt - ${pageTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: #22c55e;">✅ Payment Successful!</h3>
          <p>Thank you for your payment.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p><strong>Page:</strong> ${pageTitle}</p>
            <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
            <p><strong>Reference:</strong> ${reference}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          ${additionalInfo}
          <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send receipt email:", error);
  }
}

// Helper to extract payment page ID from order reference
function extractPaymentPageIdFromReference(orderReference: string): string | null {
  if (!orderReference) return null;
  
  // Pattern: PP-{payment_page_id}-{timestamp}-{random}
  // Example: PP-5eaa1f7a-b7ef-4c2f-940b-185a5a64b94f-1776863360573-fhc2fj
  const match = orderReference.match(/^PP-([a-f0-9-]+)-/i);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

export async function processPaymentPagePayment(payload: any, params: PaymentPageParams) {
  const { nombaTransactionId, nombaFee, orderReference } = params;

  console.log("💰 Processing Payment Page payment...");
  console.log("Order Reference:", orderReference);

  // Try to get payment page ID from metadata first, then from order reference
  const metadata = payload.data?.order?.metadata || {};
  let paymentPageId = metadata.paymentPageId;
  let paymentId = metadata.paymentId;

  // If not found in metadata, extract from order_reference
  if (!paymentPageId && orderReference) {
    paymentPageId = extractPaymentPageIdFromReference(orderReference);
    console.log("Extracted paymentPageId from orderReference:", paymentPageId);
  }

  // If still no paymentPageId, we can't proceed
  if (!paymentPageId) {
    console.error("Missing payment page ID. Metadata:", metadata, "OrderReference:", orderReference);
    return { error: "Missing payment page identifier", status: 400 };
  }

  // Find the pending payment record using payment_page_id and status
  let paymentRecord = null;
  
  if (paymentId) {
    // Try by payment ID first if provided
    const { data: payment } = await supabase
      .from("payment_page_payments")
      .select("*")
      .eq("id", paymentId)
      .maybeSingle();
    
    if (payment) {
      paymentRecord = payment;
    }
  }

  // If not found by ID, find by payment_page_id and status = 'pending'
  if (!paymentRecord) {
    const { data: payment } = await supabase
      .from("payment_page_payments")
      .select("*")
      .eq("payment_page_id", paymentPageId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (payment) {
      paymentRecord = payment;
      paymentId = payment.id;
      console.log("Found pending payment by page ID:", paymentId);
    }
  }

  if (!paymentRecord) {
    console.error("Payment record not found for page:", paymentPageId);
    return { error: "Payment record not found", status: 404 };
  }

  console.log("✅ Found payment record:", {
    id: paymentRecord.id,
    pageId: paymentRecord.payment_page_id,
    amount: paymentRecord.amount,
    status: paymentRecord.status,
  });

  // Check for duplicate webhook processing
  const { data: existingWebhook } = await supabase
    .from("payment_page_payments")
    .select("nomba_transaction_id")
    .eq("nomba_transaction_id", nombaTransactionId)
    .maybeSingle();

  if (existingWebhook) {
    console.log("⚠️ Duplicate payment page payment detected, skipping");
    return { success: true, message: "Already processed" };
  }

  // Update payment status
  const { error: updateError } = await supabase
    .from("payment_page_payments")
    .update({
      status: "completed",
      nomba_transaction_id: nombaTransactionId,
      paid_at: new Date().toISOString(),
    })
    .eq("id", paymentRecord.id);

  if (updateError) {
    console.error("Failed to update payment record:", updateError);
    return { error: "Failed to update payment", status: 500 };
  }

  // Credit the page balance
  let pageCreditAmount = paymentRecord.net_amount;

  const { data: newBalance, error: balanceError } = await supabase.rpc(
    "increment_page_balance",
    {
      p_page_id: paymentPageId,
      p_amount: pageCreditAmount,
    },
  );

  if (balanceError) {
    console.error("Failed to increment page balance:", balanceError);
  } else {
    console.log(
      `✅ Credited ₦${pageCreditAmount} to page ${paymentPageId}. New balance: ₦${newBalance}`,
    );
  }

  // Get payment page details
  const { data: paymentPage } = await supabase
    .from("payment_pages")
    .select("title, user_id, page_type, metadata")
    .eq("id", paymentPageId)
    .single();

  // Create transaction record
  await supabase.from("transactions").insert({
    user_id: paymentRecord.user_id,
    type: "credit",
    amount: paymentRecord.amount,
    fee: paymentRecord.fee,
    net_amount: pageCreditAmount,
    status: "success",
    reference: `PP-${paymentPageId}-${nombaTransactionId}`,
    description: `Payment received for page "${paymentPage?.title}" from ${paymentRecord.customer_name}`,
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
    },
  });

  // Send receipt to customer
  if (paymentRecord.customer_email) {
    sendPaymentPageReceiptEmail(
      paymentRecord.customer_email,
      paymentPage?.title || "Payment Page",
      paymentRecord.amount,
      nombaTransactionId,
      paymentRecord.metadata,
    ).catch(console.error);
  }

  // Send notification to page creator
  const { data: creator } = await supabase
    .from("users")
    .select("email")
    .eq("id", paymentRecord.user_id)
    .single();

  if (creator?.email) {
    sendPaymentPageNotificationEmail(
      creator.email,
      paymentPage?.title || "Payment Page",
      pageCreditAmount,
      paymentRecord.customer_name,
      paymentRecord.fee,
      paymentRecord.metadata,
    ).catch(console.error);
  }

  return {
    success: true,
    message: "Payment page payment processed",
    credited_amount: pageCreditAmount,
    new_balance: newBalance,
  };
}

export function checkIfPaymentPagePayment(orderReference: string, payload: any): boolean {
  // Check by order reference pattern
  if (orderReference?.startsWith("PP-")) {
    return true;
  }
  
  // Check by metadata
  return payload.data?.order?.metadata?.type === "payment_page" ||
    payload.data?.order?.metadata?.paymentPageId;
}