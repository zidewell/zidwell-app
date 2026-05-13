// app/lib/subscription/subscription-service.ts

import { createClient } from "@supabase/supabase-js";
import { 
  sendSubscriptionReceiptWithPDF, 
  sendSubscriptionActivationEmail 
} from "../../../../lib/subscription-emails";
import { ProcessSubscriptionParams, BankTransferSubscriptionParams } from "../../../../lib/subscription-types";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl = process.env.NODE_ENV === "development"
  ? "http://localhost:3000"
  : "https://zidwell.com";

// Helper to extract subscription reference
function extractSubscriptionIdFromReference(orderReference: string): string | null {
  if (!orderReference) return null;
  if (orderReference.startsWith("SUB_")) return orderReference;
  return null;
}

// Helper to extract from virtual account
function extractSubscriptionIdFromVirtualAccount(aliasAccountReference: string): string | null {
  if (!aliasAccountReference) return null;
  const subPattern = /^VA-SUB-(.+)$/i;
  const match = aliasAccountReference.match(subPattern);
  if (match && match[1]) return `SUB_${match[1]}`;
  return null;
}

// Calculate subscription expiration
function calculateExpiration(billingPeriod: 'monthly' | 'yearly'): Date {
  const expiresAt = new Date();
  if (billingPeriod === 'yearly') {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }
  return expiresAt;
}

// Process CARD subscription payment
export async function processSubscriptionPayment(
  payload: any,
  params: ProcessSubscriptionParams
): Promise<{ success: boolean; message: string; subscription_id?: string }> {
  const { nombaTransactionId, orderReference } = params;

  console.log("💰 Processing Subscription CARD payment...");
  console.log("🔑 Order Reference:", orderReference);

  // Extract metadata
  const metadata = payload.data?.order?.metadata || {};
  const planTier = metadata.planTier;
  const billingPeriod = metadata.billingPeriod || 'monthly';
  const userId = metadata.userId;

  console.log("📊 Metadata:", { planTier, billingPeriod, userId });

  // Find pending payment
  const { data: payment, error: paymentError } = await supabase
    .from('subscription_payments')
    .select('*')
    .eq('reference', orderReference)
    .eq('status', 'pending')
    .maybeSingle();

  if (paymentError) {
    console.error("❌ Error finding payment:", paymentError);
    return { success: false, message: "Database error finding payment" };
  }

  if (!payment) {
    // Check if already processed
    const { data: existingPayment } = await supabase
      .from('subscription_payments')
      .select('status')
      .eq('reference', orderReference)
      .maybeSingle();

    if (existingPayment?.status === 'completed') {
      console.log("✅ Payment already completed");
      return { success: true, message: "Already processed" };
    }
    
    console.error("❌ Payment not found for reference:", orderReference);
    return { success: false, message: "Payment not found" };
  }

  console.log("✅ Found payment:", { id: payment.id, status: payment.status, amount: payment.amount });

  // Check for duplicate transaction
  const { data: duplicateTx } = await supabase
    .from('subscription_payments')
    .select('id')
    .eq('nomba_transaction_id', nombaTransactionId)
    .maybeSingle();

  if (duplicateTx) {
    console.log("⚠️ Duplicate transaction detected:", nombaTransactionId);
    return { success: true, message: "Already processed" };
  }

  // Get user data
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, full_name')
    .eq('id', payment.user_id)
    .single();

  if (userError || !user) {
    console.error("❌ User not found:", payment.user_id);
    return { success: false, message: "User not found" };
  }

  console.log("✅ Found user:", { id: user.id, email: user.email });

  // Update payment status with idempotency check
  const { error: updateError, count } = await supabase
    .from('subscription_payments')
    .update({
      status: 'completed',
      nomba_transaction_id: nombaTransactionId,
      payment_method: 'card',
      paid_at: new Date().toISOString(),
    })
    .eq('id', payment.id)
    .eq('status', 'pending');

  if (updateError) {
    console.error("❌ Failed to update payment:", updateError);
    return { success: false, message: "Failed to update payment" };
  }

  if (!count || count === 0) {
    console.log("⚠️ Payment already updated by another process");
    return { success: true, message: "Already processed" };
  }

  console.log("✅ Payment updated to completed");

  // Calculate expiration
  const expiresAt = calculateExpiration(billingPeriod);
  console.log("📅 Expiration date:", expiresAt);

  // Deactivate existing active subscriptions
  await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', payment.user_id)
    .eq('status', 'active');

  // Create new subscription
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: payment.user_id,
      tier: planTier,
      status: 'active',
      expires_at: expiresAt.toISOString(),
      auto_renew: false,
      payment_method: 'card',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (subError) {
    console.error("❌ Failed to create subscription:", subError);
    // Rollback: Revert payment status
    await supabase
      .from('subscription_payments')
      .update({ status: 'pending' })
      .eq('id', payment.id);
    return { success: false, message: "Failed to create subscription" };
  }

  console.log("✅ Subscription created:", { id: subscription.id, tier: planTier });

  // Link payment to subscription
  await supabase
    .from('subscription_payments')
    .update({ subscription_id: subscription.id })
    .eq('id', payment.id);

  // Update user record
  const { error: userUpdateError } = await supabase
    .from('users')
    .update({
      subscription_tier: planTier,
      subscription_expires_at: expiresAt.toISOString(),
    })
    .eq('id', payment.user_id);

  if (userUpdateError) {
    console.error("❌ Failed to update user:", userUpdateError);
  } else {
    console.log("✅ User updated with new subscription tier:", planTier);
  }

  // Send email receipts (don't block on errors)
  if (user.email) {
    try {
      await sendSubscriptionReceiptWithPDF(
        user.email,
        user.full_name || user.email,
        planTier,
        payment.amount,
        nombaTransactionId,
        billingPeriod,
        expiresAt
      );
      console.log("✅ Receipt email sent");
    } catch (error) {
      console.error("❌ Failed to send receipt email:", error);
    }

    try {
      await sendSubscriptionActivationEmail(
        user.email,
        user.full_name || user.email,
        planTier,
        billingPeriod,
        expiresAt
      );
      console.log("✅ Activation email sent");
    } catch (error) {
      console.error("❌ Failed to send activation email:", error);
    }
  }

  console.log("🎉 Subscription activated successfully!", { userId: payment.user_id, tier: planTier });

  return {
    success: true,
    message: "Subscription activated successfully",
    subscription_id: subscription.id
  };
}

// Process BANK TRANSFER subscription payment
export async function processSubscriptionBankTransfer(
  payload: any,
  params: BankTransferSubscriptionParams
): Promise<{ success: boolean; message: string; subscription_id?: string }> {
  const {
    nombaTransactionId,
    aliasAccountReference,
    transactionAmount,
    customer,
    tx,
  } = params;

  console.log("🏦 Processing Subscription BANK TRANSFER...");
  console.log("🔑 Virtual Account:", aliasAccountReference);
  console.log("💰 Amount:", transactionAmount);

  const orderReference = extractSubscriptionIdFromVirtualAccount(aliasAccountReference);

  if (!orderReference) {
    console.error("❌ Invalid virtual account reference");
    return { success: false, message: "Invalid virtual account reference" };
  }

  const metadata = tx?.metadata || customer?.metadata || {};
  const planTier = metadata.planTier;
  const billingPeriod = metadata.billingPeriod || 'monthly';
  const userId = metadata.userId;

  if (!userId || !planTier) {
    console.error("❌ Missing subscription metadata:", { userId, planTier });
    return { success: false, message: "Missing subscription metadata" };
  }

  console.log("📊 Metadata:", { planTier, billingPeriod, userId });

  // Get user data
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, full_name, subscription_tier')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    console.error("❌ User not found:", userId);
    return { success: false, message: "User not found" };
  }

  console.log("✅ Found user:", { id: user.id, email: user.email });

  // Check for duplicate transaction
  const { data: duplicateTx } = await supabase
    .from('subscription_payments')
    .select('id')
    .eq('nomba_transaction_id', nombaTransactionId)
    .maybeSingle();

  if (duplicateTx) {
    console.log("⚠️ Duplicate transaction detected:", nombaTransactionId);
    return { success: true, message: "Already processed" };
  }

  // Create payment record
  const customerName = customer?.name || tx?.customerName || user.full_name || "Bank Transfer Customer";
  const customerEmail = customer?.email || tx?.customerEmail || user.email;

  const { data: payment, error: insertError } = await supabase
    .from('subscription_payments')
    .insert({
      user_id: userId,
      amount: transactionAmount,
      payment_method: 'bank_transfer',
      status: 'completed',
      reference: orderReference,
      nomba_transaction_id: nombaTransactionId,
      metadata: {
        planTier,
        billingPeriod,
        payment_method: 'bank_transfer',
        customer_details: customer,
        transaction_details: tx,
      },
      paid_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error("❌ Failed to create payment record:", insertError);
    return { success: false, message: "Failed to create payment record" };
  }

  console.log("✅ Payment record created:", { id: payment.id });

  const expiresAt = calculateExpiration(billingPeriod);

  // Deactivate existing subscriptions
  await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)
    .eq('status', 'active');

  // Create new subscription
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      tier: planTier,
      status: 'active',
      expires_at: expiresAt.toISOString(),
      auto_renew: false,
      payment_method: 'bank_transfer',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (subError) {
    console.error("❌ Failed to create subscription:", subError);
    return { success: false, message: "Failed to create subscription" };
  }

  console.log("✅ Subscription created:", { id: subscription.id });

  // Link payment to subscription
  await supabase
    .from('subscription_payments')
    .update({ subscription_id: subscription.id })
    .eq('id', payment.id);

  // Update user
  const { error: userUpdateError } = await supabase
    .from('users')
    .update({
      subscription_tier: planTier,
      subscription_expires_at: expiresAt.toISOString(),
    })
    .eq('id', userId);

  if (userUpdateError) {
    console.error("❌ Failed to update user:", userUpdateError);
  } else {
    console.log("✅ User updated with new subscription tier:", planTier);
  }

  // Send emails
  if (customerEmail) {
    try {
      await sendSubscriptionReceiptWithPDF(
        customerEmail,
        customerName,
        planTier,
        transactionAmount,
        nombaTransactionId,
        billingPeriod,
        expiresAt
      );
      console.log("✅ Receipt email sent");
    } catch (error) {
      console.error("❌ Failed to send receipt email:", error);
    }
  }

  console.log("🎉 Bank transfer subscription activated!", { userId, tier: planTier });

  return {
    success: true,
    message: "Bank transfer subscription activated",
    subscription_id: subscription.id
  };
}

// Check if this is a subscription payment
export function checkIfSubscriptionPayment(orderReference: string, payload: any): boolean {
  if (orderReference?.startsWith("SUB_")) return true;
  const metadata = payload.data?.order?.metadata || {};
  return metadata.type === "subscription" || !!metadata.planTier;
}

// Check if this is a subscription bank transfer
export function checkIfSubscriptionBankTransfer(aliasAccountReference: string, payload: any): boolean {
  if (!aliasAccountReference) return false;
  if (aliasAccountReference.startsWith("VA-SUB-")) return true;
  const metadata = payload.data?.order?.metadata || {};
  return metadata.type === "subscription_bank_transfer" && !!metadata.planTier;
}

// Helper to get auto-login URL
export function getAutoLoginUrl(userId: string, email: string, planTier: string): string {
  return `${baseUrl}/api/auth/auto-login?userId=${userId}&email=${encodeURIComponent(email)}&plan=${planTier}`;
}