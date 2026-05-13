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
  console.log("💰 PROCESSING SUBSCRIPTION PAYMENT");
  console.log("=".repeat(60));
  console.log("Order Reference:", orderReference);
  console.log("Transaction ID:", nombaTransactionId);

  // Extract metadata from MULTIPLE possible locations
  const orderMetadata = payload.data?.order?.metadata || {};
  const transactionMetadata = payload.data?.transaction?.metadata || {};
  const payloadMetadata = payload.metadata || {};
  
  // Try all possible locations
  const planTier = orderMetadata.planTier || transactionMetadata.planTier || payloadMetadata.planTier;
  const billingPeriod = orderMetadata.billingPeriod || transactionMetadata.billingPeriod || payloadMetadata.billingPeriod || 'monthly';
  const userId = orderMetadata.userId || transactionMetadata.userId || payloadMetadata.userId;

  console.log("📊 Extracted Metadata:", { 
    planTier, 
    billingPeriod, 
    userId,
    hasOrderMetadata: !!Object.keys(orderMetadata).length,
    hasTransactionMetadata: !!Object.keys(transactionMetadata).length
  });

  if (!userId || !planTier) {
    console.error("❌ Missing required metadata!");
    console.log("Full payload order:", JSON.stringify(payload.data?.order, null, 2));
    return { success: false, message: "Missing subscription metadata" };
  }

  // Find payment - don't filter by status since webhook comes fast
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

  console.log("✅ Found payment:", { 
    id: payment.id, 
    status: payment.status, 
    amount: payment.amount 
  });

  // Check if already processed
  if (payment.status === 'completed' && payment.nomba_transaction_id) {
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

  // Check for existing active subscription
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
  const { error: updatePaymentError } = await supabase
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

  if (updatePaymentError) {
    console.error("❌ Failed to update payment:", updatePaymentError);
  } else {
    console.log("✅ Payment record updated");
  }

  // Update user record
  const { error: updateUserError } = await supabase
    .from('users')
    .update({
      subscription_tier: planTier,
      subscription_expires_at: expiresAt.toISOString(),
      updated_at: now,
    })
    .eq('id', userId);

  if (updateUserError) {
    console.error("❌ Failed to update user:", updateUserError);
  } else {
    console.log("✅ User updated with tier:", planTier);
  }

  // SEND EMAILS
  if (user.email) {
    console.log("📧 Sending emails to:", user.email);
    
    const planNames: Record<string, string> = {
      zidlite: "ZidLite",
      growth: "Growth",
      premium: "Premium",
      elite: "Elite"
    };

    // Send receipt email
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

    // Send activation email
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
  } else {
    console.error("❌ No email address for user:", userId);
  }

  console.log("=".repeat(60));
  console.log("🎉 SUBSCRIPTION ACTIVATED SUCCESSFULLY!");
  console.log("=".repeat(60));
  console.log(`User: ${user.email}`);
  console.log(`Plan: ${planTier}`);
  console.log(`Expires: ${expiresAt.toISOString()}`);
  console.log(`Subscription ID: ${subscriptionId}`);

  return {
    success: true,
    message: "Subscription activated successfully",
    subscription_id: subscriptionId
  };
}

export function checkIfSubscriptionPayment(orderReference: string, payload: any): boolean {
  if (orderReference?.startsWith("SUB_")) return true;
  const metadata = payload.data?.order?.metadata || {};
  return metadata.type === "subscription" || !!metadata.planTier;
}