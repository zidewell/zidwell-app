// app/api/paystack/webhook/services/platform-subscription.service.ts

import { createClient } from "@supabase/supabase-js";
import {
  sendSubscriptionReceiptWithPDF,
  sendSubscriptionActivationEmail,
} from "@/lib/subscription-emails";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const PAID_TIERS = ["sme", "enterprise"] as const;

function calculateExpiration(billingPeriod: "monthly" | "yearly"): Date {
  const d = new Date();
  if (billingPeriod === "yearly") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

export async function processPlatformSubscriptionFromPaystack(payload: any) {
  const data = payload?.data || {};
  const reference = data.reference;

  if (!reference) {
    return { error: "Missing reference", status: 400 };
  }

  console.log("[platform-sub webhook] processing reference:", reference);

  // ─── ATOMIC CLAIM ───
  const { data: claimed, error: claimErr } = await supabase
    .from("subscription_payments")
    .update({
      status: "processing",
      updated_at: new Date().toISOString(),
    })
    .eq("reference", reference)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (claimErr) {
    console.error("[platform-sub webhook] claim failed:", claimErr);
    return { error: "Claim failed", status: 500 };
  }

  if (!claimed) {
    const { data: existing } = await supabase
      .from("subscription_payments")
      .select("status, subscription_id")
      .eq("reference", reference)
      .maybeSingle();

    console.log(
      "[platform-sub webhook] already claimed. Status:",
      existing?.status,
    );

    return {
      success: true,
      message: `Already handled (status=${existing?.status || "unknown"})`,
      subscription_id: existing?.subscription_id,
    };
  }

  // ─── We own it. Do the work. ───
  const payment = claimed;
  const metadata = payment.metadata || {};
  const planTier: string = payment.plan_tier || metadata.planTier;
  const billingPeriod = (
    payment.billing_period ||
    metadata.billingPeriod ||
    "monthly"
  ).toLowerCase() as "monthly" | "yearly";
  const userId = payment.user_id || metadata.userId;

  if (!userId || !planTier) {
    await supabase
      .from("subscription_payments")
      .update({ status: "pending" })
      .eq("id", payment.id);
    return { error: "Missing subscription metadata", status: 400 };
  }

  if (!(PAID_TIERS as readonly string[]).includes(planTier)) {
    await supabase
      .from("subscription_payments")
      .update({ status: "failed" })
      .eq("id", payment.id);
    return { error: "Invalid plan tier", status: 400 };
  }

  // Amount sanity check — Paystack sends kobo
  const paidNaira = Number(data.amount) / 100;
  if (Math.abs(paidNaira - Number(payment.amount)) > 0.01) {
    console.error("[platform-sub webhook] amount mismatch", {
      reference,
      expected: Number(payment.amount),
      received: paidNaira,
    });
    await supabase
      .from("subscription_payments")
      .update({ status: "pending" })
      .eq("id", payment.id);
    return { error: "Amount mismatch", status: 400 };
  }

  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("id, email, full_name")
    .eq("id", userId)
    .single();

  if (userErr || !user) {
    await supabase
      .from("subscription_payments")
      .update({ status: "pending" })
      .eq("id", payment.id);
    return { error: "User not found", status: 404 };
  }

  const expiresAt = calculateExpiration(billingPeriod);
  const now = new Date().toISOString();

  // Cancel any existing active platform subscription
  await supabase
    .from("subscriptions")
    .update({ status: "cancelled", cancelled_at: now, updated_at: now })
    .eq("user_id", userId)
    .eq("status", "active");

  const { data: subscription, error: subErr } = await supabase
    .from("subscriptions")
    .insert({
      user_id: userId,
      tier: planTier,
      status: "active",
      started_at: now,
      expires_at: expiresAt.toISOString(),
      billing_period: billingPeriod,
      auto_renew: false,
      payment_method: "paystack",
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (subErr || !subscription) {
    console.error("[platform-sub webhook] create subscription failed:", subErr);
    // Release the claim so retry is possible
    await supabase
      .from("subscription_payments")
      .update({ status: "pending" })
      .eq("id", payment.id);
    return { error: "Failed to create subscription", status: 500 };
  }

  await supabase
    .from("subscription_payments")
    .update({
      status: "completed",
      payment_method: "paystack",
      subscription_id: subscription.id,
      paid_at: now,
      updated_at: now,
      metadata: {
        ...metadata,
        paystack_transaction_id: data.id,
        paystack_reference: data.reference,
        paystack_channel: data.channel,
        paystack_paid_at: data.paid_at,
      },
    })
    .eq("id", payment.id);

  await supabase
    .from("users")
    .update({
      subscription_tier: planTier,
      subscription_expires_at: expiresAt.toISOString(),
      updated_at: now,
    })
    .eq("id", userId);

  console.log("[platform-sub webhook] success:", {
    subscriptionId: subscription.id,
    planTier,
    billingPeriod,
  });

  // ─── Emails — non-blocking ───
  if (user.email) {
    try {
      await sendSubscriptionReceiptWithPDF(
        user.email,
        user.full_name || user.email,
        planTier,
        Number(payment.amount),
        data.reference,
        billingPeriod,
        expiresAt,
      );
      console.log("[platform-sub webhook] ✅ receipt email sent");
    } catch (e) {
      console.error("[platform-sub webhook] ❌ receipt email failed:", e);
    }

    try {
      await sendSubscriptionActivationEmail(
        user.email,
        user.full_name || user.email,
        planTier,
        billingPeriod,
        expiresAt,
      );
      console.log("[platform-sub webhook] ✅ activation email sent");
    } catch (e) {
      console.error("[platform-sub webhook] ❌ activation email failed:", e);
    }
  }

  return { success: true, subscription_id: subscription.id };
}