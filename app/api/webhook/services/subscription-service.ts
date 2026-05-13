// app/api/webhook/services/subscription-service.ts

import { createClient } from "@supabase/supabase-js";
import { 
  sendSubscriptionReceiptWithPDF, 
  sendSubscriptionActivationEmail 
} from "../../../../lib/subscription-emails";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl = process.env.NODE_ENV === "development"
  ? "http://localhost:3000"
  : "https://zidwell.com";

function calculateExpiration(billingPeriod: 'monthly' | 'yearly'): Date {
  const expiresAt = new Date();
  if (billingPeriod === 'yearly') {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }
  return expiresAt;
}

export async function processSubscriptionPayment(
  payload: any,
  params: { nombaTransactionId: string; orderReference: string }
): Promise<{ success: boolean; message: string; subscription_id?: string }> {
  const { nombaTransactionId, orderReference } = params;

  console.log("=".repeat(60));
  console.log("💰 PROCESSING SUBSCRIPTION CARD PAYMENT");
  console.log("=".repeat(60));
  console.log("Order Reference:", orderReference);
  console.log("Transaction ID:", nombaTransactionId);

  // Extract from ALL possible locations
  const orderData = payload.data?.order || {};
  const transactionData = payload.data?.transaction || {};
  
  // Try multiple locations for planTier
  const planTier = 
    orderData.planTier ||
    orderData.metadata?.planTier ||
    orderData.metadata?.planTier ||
    transactionData.planTier ||
    transactionData.metadata?.planTier;
  
  // Try multiple locations for userId  
  const userId = 
    orderData.userId ||
    orderData.customerId ||
    orderData.metadata?.userId ||
    transactionData.userId ||
    transactionData.metadata?.userId;
  
  // Try multiple locations for billingPeriod
  const billingPeriod = 
    orderData.billingPeriod ||
    orderData.metadata?.billingPeriod ||
    transactionData.billingPeriod ||
    transactionData.metadata?.billingPeriod ||
    'monthly';

  console.log("📊 Extracted Metadata:", { planTier, billingPeriod, userId });
  console.log("📊 Order data keys:", Object.keys(orderData));
  console.log("📊 Metadata object:", orderData.metadata);

  if (!userId || !planTier) {
    console.error("❌ Missing required metadata!");
    console.log("Full order:", JSON.stringify(orderData, null, 2));
    return { success: false, message: "Missing subscription metadata" };
  }

  // Find payment - get by reference
  const { data: payment, error: paymentError } = await supabase
    .from('subscription_payments')
    .select('*')
    .eq('reference', orderReference)
    .maybeSingle();

  if (paymentError) {
    console.error("❌ Error finding payment:", paymentError);
    return { success: false, message: "Database error" };
  }

  if (!payment) {
    console.error("❌ Payment not found:", orderReference);
    return { success: false, message: "Payment not found" };
  }

  console.log("✅ Found payment:", { id: payment.id, status: payment.status, amount: payment.amount });

  // Check if already processed
  if (payment.status === 'completed') {
    console.log("✅ Payment already processed");
    return { success: true, message: "Already processed" };
  }

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

  console.log("✅ User found:", { id: user.id, email: user.email });

  // Calculate expiration
  const expiresAt = calculateExpiration(billingPeriod);
  const now = new Date().toISOString();

  // UPDATE OR CREATE SUBSCRIPTION
  let subscriptionId: string;

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (existingSub) {
    // Update existing subscription
    console.log("📝 Updating existing subscription:", existingSub.id);
    const { data: updated, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        tier: planTier,
        status: 'active',
        expires_at: expiresAt.toISOString(),
        updated_at: now,
        payment_method: 'card',
        cancelled_at: null,
      })
      .eq('id', existingSub.id)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Failed to update subscription:", updateError);
      return { success: false, message: "Failed to update subscription" };
    }
    subscriptionId = updated.id;
    console.log("✅ Subscription updated");
  } else {
    // Create new subscription
    console.log("📝 Creating new subscription");
    const { data: newSub, error: createError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        tier: planTier,
        status: 'active',
        started_at: now,
        expires_at: expiresAt.toISOString(),
        auto_renew: false,
        payment_method: 'card',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (createError) {
      console.error("❌ Failed to create subscription:", createError);
      return { success: false, message: "Failed to create subscription" };
    }
    subscriptionId = newSub.id;
    console.log("✅ New subscription created");
  }

  // Update payment record
  await supabase
    .from('subscription_payments')
    .update({
      status: 'completed',
      nomba_transaction_id: nombaTransactionId,
      payment_method: 'card',
      subscription_id: subscriptionId,
      paid_at: now,
      updated_at: now,
    })
    .eq('id', payment.id);

  // Update user record
  await supabase
    .from('users')
    .update({
      subscription_tier: planTier,
      subscription_expires_at: expiresAt.toISOString(),
      updated_at: now,
    })
    .eq('id', userId);

  console.log("✅ User updated with tier:", planTier);
  console.log("✅ User expires at:", expiresAt.toISOString());

  // SEND EMAILS
  if (user.email) {
    console.log("📧 Sending emails to:", user.email);
    
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

  console.log("=".repeat(60));
  console.log("🎉 SUBSCRIPTION ACTIVATED SUCCESSFULLY!");
  console.log(`User: ${user.email}`);
  console.log(`Plan: ${planTier}`);
  console.log(`Expires: ${expiresAt.toISOString()}`);
  console.log("=".repeat(60));

  return {
    success: true,
    message: "Subscription activated successfully",
    subscription_id: subscriptionId
  };
}

export function checkIfSubscriptionPayment(orderReference: string, payload: any): boolean {
  if (orderReference?.startsWith("SUB_")) return true;
  const orderData = payload.data?.order || {};
  return orderData.type === "subscription" || !!orderData.planTier || !!orderData.metadata?.planTier;
}

export function checkIfSubscriptionBankTransfer(aliasAccountReference: string, payload: any): boolean {
  if (!aliasAccountReference) return false;
  return aliasAccountReference.startsWith("VA-SUB-");
}

export function getAutoLoginUrl(userId: string, email: string, planTier: string): string {
  return `${baseUrl}/api/auth/auto-login?userId=${userId}&email=${encodeURIComponent(email)}&plan=${planTier}`;
}