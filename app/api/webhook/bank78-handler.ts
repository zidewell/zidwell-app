// app/api/webhook/bank78-handler.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bank78Client from "@/lib/bank78/client";
import { 
  processBank78Deposit, 
  processBank78WithdrawalWebhook,
  processBank78PaymentPagePayment,
  processBank78InvoicePayment
} from "@/lib/bank78/webhook-service";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function handleBank78Webhook(payload: any, req: NextRequest) {
  console.log("🏦 ========== BANK78 WEBHOOK RECEIVED ==========");
  console.log("Event type:", payload.event || payload.event_type);

  try {
    // Verify Bank78 signature
    const signature = req.headers.get("x-bank78-signature");
    const isValid = await bank78Client.verifyWebhookSignature(payload, signature);
    
    if (!isValid) {
      console.error("❌ Invalid Bank78 webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const eventType = payload.event || payload.event_type;
    const data = payload.data || payload;

    // Log webhook for audit - using your actual table structure
    const { data: webhook, error: webhookError } = await supabase
      .from("bank78_webhooks")
      .insert({
        event_type: eventType,
        payload: payload,
        processed: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (webhookError) {
      console.error("❌ Failed to log webhook:", webhookError);
      // Continue processing even if logging fails
    }

    let result;

    // Route based on event type
    switch (eventType) {
      case "account.funded":
      case "deposit.success":
      case "payment.received":
      case "transfer.success":
        result = await routeBank78Payment(data);
        break;

      case "transfer.failed":
      case "payout.failed":
        result = await processBank78WithdrawalWebhook(data);
        break;

      case "account.created":
        result = await handleBank78AccountCreated(data);
        break;

      default:
        console.log(`⚠️ Unhandled Bank78 event type: ${eventType}`);
        result = { message: "Event ignored", success: true };
    }

    // Mark webhook as processed
    if (webhook) {
      await supabase
        .from("bank78_webhooks")
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
        })
        .eq("id", webhook.id);
    }

    console.log("✅ Bank78 webhook processed successfully");
    return NextResponse.json({ success: true, result });

  } catch (error: any) {
    console.error("❌ Bank78 webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// ============================================================
// ROUTE BANK78 PAYMENT TO APPROPRIATE SERVICE
// ============================================================
async function routeBank78Payment(data: any) {
  console.log("🔍 Routing Bank78 payment...");
  
  // Extract payment details - handle various field names
  const accountNumber = data.accountNumber || data.beneficiaryAccountNumber || data.account_number || data.beneficiaryAccount;
  const amount = parseFloat(data.amount || data.amount_paid || data.transactionAmount || 0);
  const narration = data.narration || data.description || data.reference || data.remarks || "";
  const transactionId = data.transactionId || data.paymentReference || data.transaction_id || data.reference || `B78-${Date.now()}`;
  const senderName = data.originatorAccountName || data.senderName || data.sender_account_name || data.sender || "Bank Transfer";
  const senderAccount = data.originatorAccountNumber || data.senderAccountNumber || data.sender_account_number;
  const fee = parseFloat(data.fee || data.charges || data.transactionFee || 0);
  
  if (!accountNumber) {
    console.error("❌ No account number found in Bank78 webhook");
    console.log("Data received:", JSON.stringify(data, null, 2));
    return { error: "No account number found" };
  }

  console.log(`📊 Payment details:`);
  console.log(`   Account: ${accountNumber}`);
  console.log(`   Amount: ₦${amount}`);
  console.log(`   Narration: ${narration}`);
  console.log(`   Transaction ID: ${transactionId}`);
  console.log(`   Sender: ${senderName}`);

  // Check if the account belongs to a user
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, bank78_personal_account_number, bank78_personal_account_id, bank78_business_account_number, bank78_business_account_id, primary_provider, email, full_name, first_name, last_name")
    .or(`bank78_personal_account_number.eq.${accountNumber},bank78_business_account_number.eq.${accountNumber}`)
    .maybeSingle();

  if (userError || !user) {
    console.error(`❌ User not found for Bank78 account: ${accountNumber}`);
    return { error: "User not found", status: 404 };
  }

  console.log(`✅ Found user: ${user.id} (${user.full_name || user.email})`);

  // Check what type of payment this is
  // 1. Payment Page Payment (PP- or PPL in narration)
  if (narration.includes("PP-") || narration.includes("PPL") || narration.includes("PAYMENT-") || narration.includes("PAY-")) {
    console.log("📄 Processing Bank78 payment page payment...");
    return await processBank78PaymentPagePayment({ ...data, transactionId, amount, narration, senderName, fee }, user);
  }

  // 2. Invoice Payment (INV- or INVOICE- in narration)
  if (narration.includes("INV-") || narration.includes("INVOICE-") || narration.includes("INVOICE_") || narration.includes("INV_")) {
    console.log("📄 Processing Bank78 invoice payment...");
    return await processBank78InvoicePayment({ ...data, transactionId, amount, narration, senderName, fee }, user);
  }

  // 3. Regular wallet deposit
  console.log("💰 Processing Bank78 wallet deposit...");
  return await processBank78Deposit({ ...data, transactionId, amount, narration, senderName, senderAccount, fee }, user);
}

// ============================================================
// HANDLE BANK78 ACCOUNT CREATED
// ============================================================
async function handleBank78AccountCreated(data: any) {
  console.log("📝 Processing Bank78 account created webhook...");
  
  const accountNumber = data.accountNumber || data.number || data.account_number || data.bankAccountNumber;
  const accountName = data.accountName || data.account_name || data.name || data.accountHolderName;
  const bankName = data.bankName || data.bank_name || data.bank || "Bank78";
  const accountId = data.accountId || data.account_id || data.reference || data.accountReference;
  const customerId = data.customerId || data.customer_id || data.userId;
  
  console.log(`📊 Account details:`, {
    accountNumber,
    accountName,
    bankName,
    accountId,
    customerId
  });

  if (!accountNumber) {
    console.error("❌ No account number in account created webhook");
    return { error: "No account number" };
  }

  // Try to find user by the account reference
  let { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email, full_name")
    .eq("bank78_personal_account_number", accountNumber)
    .maybeSingle();

  // If not found by personal, try business
  if (!user) {
    const { data: bizUser } = await supabase
      .from("users")
      .select("id, email, full_name")
      .eq("bank78_business_account_number", accountNumber)
      .maybeSingle();
    user = bizUser;
  }

  // If still not found, try by ID if we have a customerId
  if (!user && customerId) {
    const { data: idUser } = await supabase
      .from("users")
      .select("id, email, full_name")
      .eq("id", customerId)
      .maybeSingle();
    user = idUser;
  }

  if (userError || !user) {
    console.error(`❌ User not found for Bank78 account: ${accountNumber}`);
    return { error: "User not found", status: 404 };
  }

  console.log(`✅ Found user: ${user.id} (${user.full_name || user.email})`);

  // Update user with Bank78 account info
  const updateData: any = {
    bank78_verified: true,
    bank78_verified_at: new Date().toISOString(),
    primary_provider: "bank78",
    wallet_provider: "bank78",
    verification_completed: true,
    verification_step: 6,
    updated_at: new Date().toISOString(),
  };

  // Determine if this is personal or business account
  // If we have customerId, check if user has a business
  if (customerId) {
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (business) {
      // This might be a business account
      updateData.bank78_business_account_number = accountNumber;
      updateData.bank78_business_account_name = accountName;
      updateData.bank78_business_bank_name = bankName;
      updateData.bank78_business_account_id = accountId;
      
      // Also update business table
      await supabase
        .from("businesses")
        .update({
          bank78_account_number: accountNumber,
          bank78_account_name: accountName,
          bank78_bank_name: bankName,
          bank78_account_id: accountId,
          verification_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    } else {
      // Personal account
      updateData.bank78_personal_account_number = accountNumber;
      updateData.bank78_personal_account_name = accountName;
      updateData.bank78_personal_bank_name = bankName;
      updateData.bank78_personal_account_id = accountId;
    }
  } else {
    // Default to personal account
    updateData.bank78_personal_account_number = accountNumber;
    updateData.bank78_personal_account_name = accountName;
    updateData.bank78_personal_bank_name = bankName;
    updateData.bank78_personal_account_id = accountId;
  }

  const { data: updatedUser, error: updateError } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", user.id)
    .select()
    .single();

  if (updateError) {
    console.error(`❌ Failed to update user:`, updateError);
    return { error: "Failed to update user" };
  }

  console.log(`✅ Bank78 account verified for user: ${user.id}`);
  return { 
    success: true, 
    userId: user.id,
    accountNumber,
    accountType: updateData.bank78_business_account_number ? "business" : "personal"
  };
}