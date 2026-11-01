// app/api/paystack/webhook/services/subscription.service.ts

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function calculatePeriodEnd(billingPeriod: 'monthly' | 'yearly'): Date {
  const date = new Date();
  if (billingPeriod === 'yearly') {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date;
}

export async function processSubscriptionFromPaystack(payload: any) {
  const data = payload?.data || {};
  const reference = data.reference;

  if (!reference) {
    return { error: "Missing reference", status: 400 };
  }

  console.log("[subscription webhook] processing reference:", reference);

  // Find payment record
  const { data: payment, error: paymentError } = await supabase
    .from("zidstore_subscription_payments")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();

  if (paymentError || !payment) {
    console.error("[subscription webhook] payment not found:", paymentError);
    return { error: "Payment not found", status: 404 };
  }

  // Idempotency check
  if (payment.status === "success") {
    console.log("[subscription webhook] already processed, skipping");
    return { success: true, message: "Already processed" };
  }

  const metadata = payment.metadata || {};
  const planTier = metadata.plan_tier;
  const billingPeriod = metadata.billing_period || "monthly";
  const userId = payment.user_id;

  if (!planTier) {
    return { error: "Missing plan_tier in metadata", status: 400 };
  }

  const now = new Date().toISOString();
  const periodEnd = calculatePeriodEnd(billingPeriod as 'monthly' | 'yearly');

  // Cancel any existing active subscriptions for this user
  await supabase
    .from("zidstore_subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: now,
      updated_at: now,
    })
    .eq("user_id", userId)
    .eq("status", "active");

  // Create new subscription row
  const { data: subscription, error: subError } = await supabase
    .from("zidstore_subscriptions")
    .insert({
      user_id: userId,
      plan_tier: planTier,
      billing_period: billingPeriod,
      status: "active",
      current_period_start: now,
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
    })
    .select()
    .single();

  if (subError || !subscription) {
    console.error("[subscription webhook] failed to create subscription:", subError);
    return { error: "Failed to create subscription", status: 500 };
  }

  // Update payment record
  const { error: updateError } = await supabase
    .from("zidstore_subscription_payments")
    .update({
      status: "success",
      paid_at: now,
      provider_transaction_id: data.id,
      subscription_id: subscription.id,
      updated_at: now,
    })
    .eq("reference", reference);

  if (updateError) {
    console.error("[subscription webhook] failed to update payment:", updateError);
  }

  console.log("[subscription webhook] success:", {
    subscriptionId: subscription.id,
    planTier,
    billingPeriod,
  });

  return { success: true, subscription_id: subscription.id };
}
