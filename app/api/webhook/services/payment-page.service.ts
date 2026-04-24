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

interface BankTransferParams {
  nombaTransactionId: string;
  nombaFee: number;
  aliasAccountReference: string;
  transactionAmount: number;
  customer: any;
  tx: any;
}

type ServiceResult = 
  | { success: true; message: string; credited_amount?: number; new_balance?: number | null; payment_id?: string }
  | { error: string; status?: number };

async function sendPaymentPageNotificationEmail(
  creatorEmail: string,
  pageTitle: string,
  amount: number,
  customerName: string,
  fee?: number,
  metadata?: any,
  paymentMethod: string = "card"
): Promise<void> {
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

    const paymentMethodText = paymentMethod === "card" ? "Card Payment" : "Bank Transfer";
    const paymentMethodIcon = paymentMethod === "card" ? "💳" : "🏦";

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: creatorEmail,
      subject: `💰 ${paymentMethodText} Received for "${pageTitle}" - ₦${amount.toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: #22c55e;">✅ ${paymentMethodText} Received! ${paymentMethodIcon}</h3>
          <p>You've received a ${paymentMethod.toLowerCase()} payment for your payment page <strong>${pageTitle}</strong>.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
            ${fee ? `<p><strong>Processing Fee:</strong> ₦${fee.toLocaleString()}</p>` : ""}
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Payment Method:</strong> ${paymentMethodText}</p>
            <p><strong>Status:</strong> <span style="color: #22c55e;">Completed</span></p>
          </div>
          ${additionalInfo}
          <p>The funds have been added to your payment page balance. You can withdraw them to your bank account anytime.</p>
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
  paymentMethod: string = "card"
): Promise<void> {
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

    const paymentMethodText = paymentMethod === "card" ? "Card" : "Bank Transfer";

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `Payment Receipt - ${pageTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: #22c55e;">✅ Payment Successful!</h3>
          <p>Thank you for your ${paymentMethodText.toLowerCase()} payment.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p><strong>Page:</strong> ${pageTitle}</p>
            <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
            <p><strong>Payment Method:</strong> ${paymentMethodText}</p>
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

// Helper to extract payment page ID from order reference (card payments)
function extractPaymentPageIdFromReference(orderReference: string): string | null {
  if (!orderReference) return null;
  
  console.log("📝 Extracting from orderReference:", orderReference);
  
  // New pattern: PP-{shortId(12)}-{timestamp}-{random}
  // Example: PP-5980740302e5-modh6afz-tgzy
  const ppPattern = /^PP-([a-f0-9]{12})-[a-z0-9]+-[a-z0-9]+$/i;
  let match = orderReference.match(ppPattern);
  
  if (match && match[1]) {
    console.log("✅ Extracted short ID (PP format):", match[1]);
    return match[1];
  }
  
  // Legacy pattern: P{shortId(8)}-{timestamp}-{random} (for backward compatibility)
  const legacyPattern = /^P([a-f0-9]{8})-[a-z0-9]+-[a-z0-9]+$/i;
  match = orderReference.match(legacyPattern);
  
  if (match && match[1]) {
    console.log("⚠️ Legacy format detected, short ID:", match[1]);
    return match[1];
  }
  
  console.log("❌ Failed to extract from orderReference:", orderReference);
  return null;
}

// Helper to extract payment page ID from virtual account reference (bank transfers)
function extractPaymentPageIdFromVirtualAccount(aliasAccountReference: string): string | null {
  if (!aliasAccountReference) return null;
  
  console.log("📝 Extracting from virtual account reference:", aliasAccountReference);
  
  let uuidPattern = /^VA-PP-([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
  let match = aliasAccountReference.match(uuidPattern);
  
  if (match && match[1]) {
    console.log("✅ Extracted UUID from VA-PP format:", match[1]);
    return match[1];
  }
  
  uuidPattern = /^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
  match = aliasAccountReference.match(uuidPattern);
  
  if (match && match[1]) {
    console.log("✅ Extracted UUID directly:", match[1]);
    return match[1];
  }
  
  console.log("❌ Failed to extract UUID from:", aliasAccountReference);
  return null;
}

// Process CARD payments
export async function processPaymentPagePayment(payload: any, params: PaymentPageParams): Promise<ServiceResult> {
  const { nombaTransactionId, nombaFee, orderReference } = params;

  console.log("💰 Processing Payment Page CARD payment...");
  console.log("🔑 Order Reference:", orderReference);
  console.log("🆔 Nomba Transaction ID:", nombaTransactionId);

  const metadata = payload.data?.order?.metadata || {};
  console.log("📋 Metadata from order:", metadata);
  
  let paymentPageId = metadata.paymentPageId;
  let paymentId = metadata.paymentId;

  console.log("📌 From metadata - paymentPageId:", paymentPageId, "paymentId:", paymentId);

  if (!paymentPageId && orderReference) {
    const extractedId = extractPaymentPageIdFromReference(orderReference);
    console.log("📌 Extracted ID from orderReference:", extractedId);
    
    if (extractedId) {
      // Search for payment page where ID ends with the extracted ID
      console.log("🔍 Searching for payment page with ID ending with:", extractedId);
      
      // Get all payment pages and filter in JavaScript
      const { data: allPages, error: searchError } = await supabase
        .from("payment_pages")
        .select("id, title, user_id");
      
      if (searchError) {
        console.error("❌ Error searching for payment pages:", searchError);
      } else if (allPages) {
        // Find the page whose ID ends with the extracted ID
        const foundPage = allPages.find(page => 
          page.id.endsWith(extractedId)
        );
        
        if (foundPage) {
          paymentPageId = foundPage.id;
          console.log("✅ Found payment page by ID suffix:", paymentPageId);
          console.log("   Page title:", foundPage.title);
        } else {
          console.log("❌ No payment page found with ID ending with:", extractedId);
          // List available pages for debugging
          console.log("📋 Available payment page IDs:");
          allPages.slice(0, 5).forEach(page => {
            console.log(`   - ${page.id} (ends with: ${page.id.slice(-12)})`);
          });
        }
      }
    }
  }

  if (!paymentPageId) {
    console.error("❌ Missing payment page ID");
    return { error: "Missing payment page identifier", status: 400 };
  }

  console.log("🎯 Final payment page ID:", paymentPageId);

  const { data: paymentPageCheck, error: pageError } = await supabase
    .from("payment_pages")
    .select("id, title, user_id")
    .eq("id", paymentPageId)
    .maybeSingle();

  if (pageError) {
    console.error("❌ Error checking payment page:", pageError);
    return { error: "Error checking payment page", status: 500 };
  }
  
  if (!paymentPageCheck) {
    console.error("❌ Payment page not found with ID:", paymentPageId);
    return { error: "Payment page not found", status: 404 };
  }
  
  console.log("✅ Found payment page:", paymentPageCheck.title);

  let paymentRecord = null;
  
  if (paymentId) {
    console.log("🔍 Looking for payment by ID:", paymentId);
    const { data: payment, error: paymentError } = await supabase
      .from("payment_page_payments")
      .select("*")
      .eq("id", paymentId)
      .maybeSingle();
    
    if (paymentError) {
      console.error("❌ Error fetching payment by ID:", paymentError);
    } else if (payment) {
      console.log("✅ Found payment by ID:", payment.id);
      paymentRecord = payment;
    }
  }

  if (!paymentRecord) {
    console.log("🔍 Looking for pending payment by page_id:", paymentPageId);
    const { data: payment, error: paymentError } = await supabase
      .from("payment_page_payments")
      .select("*")
      .eq("payment_page_id", paymentPageId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (paymentError) {
      console.error("❌ Error fetching payment by page_id:", paymentError);
    } else if (payment) {
      console.log("✅ Found pending payment by page_id:", payment.id);
      paymentRecord = payment;
    }
  }

  if (!paymentRecord) {
    console.error("❌ Payment record not found for page:", paymentPageId);
    
    // Check if there are any payments at all for this page
    const { data: allPayments, error: allError } = await supabase
      .from("payment_page_payments")
      .select("*")
      .eq("payment_page_id", paymentPageId)
      .order("created_at", { ascending: false })
      .limit(5);
    
    if (allError) {
      console.error("❌ Error fetching all payments:", allError);
    } else if (allPayments && allPayments.length > 0) {
      console.log(`📊 Found ${allPayments.length} total payments for this page`);
      allPayments.forEach((p, idx) => {
        console.log(`   ${idx + 1}. ID: ${p.id}, Status: ${p.status}, Amount: ${p.amount}`);
      });
    } else {
      console.log("📊 No payments found for this page");
    }
    
    return { error: "Payment record not found", status: 404 };
  }

  console.log("✅ Found payment record:", {
    id: paymentRecord.id,
    amount: paymentRecord.amount,
    customer: paymentRecord.customer_name,
  });

  // Check for duplicate
  const { data: existingWebhook, error: duplicateError } = await supabase
    .from("payment_page_payments")
    .select("nomba_transaction_id, id")
    .eq("nomba_transaction_id", nombaTransactionId)
    .maybeSingle();

  if (duplicateError) {
    console.error("❌ Error checking duplicate:", duplicateError);
  }

  if (existingWebhook) {
    console.log("⚠️ Duplicate payment detected, skipping");
    return { success: true, message: "Already processed" };
  }

  // Update payment status
  console.log("📝 Updating payment status to 'completed'");
  const { error: updateError } = await supabase
    .from("payment_page_payments")
    .update({
      status: "completed",
      nomba_transaction_id: nombaTransactionId,
      payment_method: "card",
      paid_at: new Date().toISOString(),
    })
    .eq("id", paymentRecord.id);

  if (updateError) {
    console.error("❌ Failed to update payment record:", updateError);
    return { error: "Failed to update payment", status: 500 };
  }

  // Credit the page balance
  const pageCreditAmount = paymentRecord.net_amount;
  console.log(`💰 Crediting page balance: ₦${pageCreditAmount}`);

  const { data: newBalance, error: balanceError } = await supabase.rpc(
    "increment_page_balance",
    {
      p_page_id: paymentPageId,
      p_amount: pageCreditAmount,
    },
  );

  let finalBalance: number | null = null;
  if (balanceError) {
    console.error("❌ Failed to increment page balance:", balanceError);
  } else {
    finalBalance = typeof newBalance === 'number' ? newBalance : null;
    console.log(`✅ Credited ₦${pageCreditAmount}. New balance: ₦${finalBalance}`);
  }

  // Get payment page details
  const { data: paymentPage, error: pageDetailsError } = await supabase
    .from("payment_pages")
    .select("title, user_id, page_type, metadata")
    .eq("id", paymentPageId)
    .single();

  if (pageDetailsError) {
    console.error("❌ Error fetching payment page details:", pageDetailsError);
  }

  // Create transaction record
  const { error: txError } = await supabase.from("transactions").insert({
    user_id: paymentRecord.user_id,
    type: "credit",
    amount: paymentRecord.amount,
    fee: paymentRecord.fee,
    net_amount: pageCreditAmount,
    status: "success",
    reference: `PP-${paymentPageId}-${nombaTransactionId}`,
    description: `Card payment received for page "${paymentPage?.title}" from ${paymentRecord.customer_name}`,
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
      payment_method: "card"
    },
  });

  if (txError) {
    console.error("❌ Failed to create transaction record:", txError);
  }

  // Send email notifications
  if (paymentRecord.customer_email) {
    sendPaymentPageReceiptEmail(
      paymentRecord.customer_email,
      paymentPage?.title || "Payment Page",
      paymentRecord.amount,
      nombaTransactionId,
      paymentRecord.metadata,
      "card"
    ).catch(console.error);
  }

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
      "card"
    ).catch(console.error);
  }

  console.log("🎉 Card payment processing completed!");
  
  return {
    success: true,
    message: "Card payment processed",
    credited_amount: pageCreditAmount,
    new_balance: finalBalance,
  };
}

// Process BANK TRANSFER payments
export async function processPaymentPageBankTransfer(payload: any, params: BankTransferParams): Promise<ServiceResult> {
  const { 
    nombaTransactionId, 
    nombaFee, 
    aliasAccountReference,
    transactionAmount,
    customer,
    tx 
  } = params;

  console.log("🏦 Processing Payment Page BANK TRANSFER...");
  console.log("📦 Virtual Account Reference:", aliasAccountReference);
  console.log("💰 Amount:", transactionAmount);

  const paymentPageId = extractPaymentPageIdFromVirtualAccount(aliasAccountReference);
  
  if (!paymentPageId) {
    console.error("❌ Could not extract payment page ID");
    return { error: "Invalid virtual account reference", status: 400 };
  }

  console.log("🎯 Extracted payment page ID:", paymentPageId);

  const { data: paymentPage, error: pageError } = await supabase
    .from("payment_pages")
    .select("id, title, user_id, balance")
    .eq("id", paymentPageId)
    .single();

  if (pageError || !paymentPage) {
    console.error("❌ Payment page not found");
    return { error: "Payment page not found", status: 404 };
  }

  console.log("✅ Found payment page:", paymentPage.title);

  const { data: existingTransfer, error: duplicateError } = await supabase
    .from("payment_page_payments")
    .select("id, status")
    .eq("nomba_transaction_id", nombaTransactionId)
    .maybeSingle();

  if (duplicateError) {
    console.error("❌ Error checking duplicate:", duplicateError);
  }

  if (existingTransfer) {
    console.log(`⚠️ Duplicate bank transfer detected`);
    return { success: true, message: "Already processed" };
  }

  const netAmount = transactionAmount - nombaFee;
  const customerName = customer?.name || tx?.customerName || tx?.senderName || "Bank Transfer Customer";
  const customerEmail = customer?.email || tx?.customerEmail || null;
  const customerPhone = customer?.phone || tx?.customerPhone || null;

  console.log("📝 Creating payment record for bank transfer...");
  
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
      customer_phone: customerPhone,
      payment_method: "bank_transfer",
      nomba_transaction_id: nombaTransactionId,
      order_reference: orderReference,
      metadata: {
        virtual_account: aliasAccountReference,
        bank_transfer: true,
        customer_details: customer,
        transaction_details: tx,
        payment_type: "backtransfer"
      },
      paid_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error("❌ Failed to create payment record:", insertError);
    return { error: "Failed to create payment record", status: 500 };
  }

  console.log("✅ Bank transfer payment record created:", paymentRecord.id);

  console.log(`💰 Crediting page balance: ₦${netAmount}`);

  const { data: newBalance, error: balanceError } = await supabase.rpc(
    "increment_page_balance",
    {
      p_page_id: paymentPageId,
      p_amount: netAmount,
    },
  );

  let finalBalance: number | null = null;
  if (balanceError) {
    console.error("❌ Failed to increment page balance:", balanceError);
  } else {
    finalBalance = typeof newBalance === 'number' ? newBalance : null;
    console.log(`✅ Credited ₦${netAmount}. New balance: ₦${finalBalance}`);
  }

  const { error: txError } = await supabase.from("transactions").insert({
    user_id: paymentPage.user_id,
    type: "credit",
    amount: transactionAmount,
    fee: nombaFee,
    net_amount: netAmount,
    status: "success",
    reference: `BT-${paymentPageId}-${nombaTransactionId}`,
    description: `Bank transfer payment for page "${paymentPage.title}" from ${customerName}`,
    channel: "bank_transfer",
    sender: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      bank_transfer: true,
      virtual_account: aliasAccountReference
    },
    receiver: {
      user_id: paymentPage.user_id,
      payment_page_id: paymentPageId,
    },
    external_response: {
      nomba_transaction_id: nombaTransactionId,
      nomba_fee: nombaFee,
      virtual_account: aliasAccountReference,
      payment_method: "bank_transfer"
    },
  });

  if (txError) {
    console.error("❌ Failed to create transaction record:", txError);
  }

  const { data: creator } = await supabase
    .from("users")
    .select("email, full_name")
    .eq("id", paymentPage.user_id)
    .single();

  if (creator?.email) {
    sendPaymentPageNotificationEmail(
      creator.email,
      paymentPage.title,
      netAmount,
      customerName,
      nombaFee,
      { pageType: "bank_transfer" },
      "bank_transfer"
    ).catch(console.error);
  }

  if (customerEmail) {
    sendPaymentPageReceiptEmail(
      customerEmail,
      paymentPage.title,
      transactionAmount,
      nombaTransactionId,
      { virtual_account: aliasAccountReference },
      "bank_transfer"
    ).catch(console.error);
  }

  console.log("🎉 Bank transfer processing completed!");
  
  return {
    success: true,
    message: "Bank transfer payment processed",
    credited_amount: netAmount,
    new_balance: finalBalance,
    payment_id: paymentRecord.id
  };
}

// Check if this is a card payment
export function checkIfPaymentPagePayment(orderReference: string, payload: any): boolean {
  // Check for PP- prefix (new format)
  if (orderReference?.startsWith("PP-")) {
    console.log("✅ Detected payment page card payment by PP- prefix");
    return true;
  }
  
  // Check for legacy P prefix (backward compatibility)
  if (orderReference?.startsWith("P") && !orderReference?.startsWith("PP-")) {
    console.log("⚠️ Detected legacy payment page card payment by P prefix");
    return true;
  }
  
  const metadata = payload.data?.order?.metadata || {};
  const isPaymentPage = metadata.type === "payment_page" || 
                        metadata.paymentPageId ||
                        metadata.paymentId;
  
  if (isPaymentPage && !metadata.invoiceId) {
    console.log("✅ Detected payment page card payment by metadata");
    return true;
  }
  
  return false;
}

// Check if this is a bank transfer to a payment page
export function checkIfPaymentPageBankTransfer(aliasAccountReference: string, payload: any): boolean {
  if (!aliasAccountReference) return false;
  
  const hasPaymentPageId = extractPaymentPageIdFromVirtualAccount(aliasAccountReference);
  
  if (hasPaymentPageId) {
    console.log("✅ Detected payment page bank transfer by virtual account reference");
    return true;
  }
  
  const metadata = payload.data?.order?.metadata || {};
  const isBankTransfer = metadata.type === "payment_page_bank_transfer" ||
                        payload.data?.transaction?.paymentMethod === "bank_transfer";
  
  if (isBankTransfer && metadata.paymentPageId && !metadata.invoiceId) {
    console.log("✅ Detected payment page bank transfer by metadata");
    return true;
  }
  
  return false;
}