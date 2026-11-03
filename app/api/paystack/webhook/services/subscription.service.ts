// app/api/paystack/webhook/services/subscription.service.ts

import { createClient } from "@supabase/supabase-js";
import { transporter } from "@/lib/node-mailer";
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function calculatePeriodEnd(billingPeriod: "monthly" | "yearly"): Date {
  const date = new Date();
  if (billingPeriod === "yearly") {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date;
}

async function sendSubscriptionEmail(params: {
  email: string;
  name?: string | null;
  planTier: string;
  billingPeriod: string;
  amount: number;
  reference: string;
  periodEnd: string;
}) {
  const planLabel = params.planTier.toUpperCase();

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 24px;">
      <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e5e5;">
        <h1 style="margin: 0 0 8px; font-size: 22px; color: #111;">Subscription confirmed 🎉</h1>
        <p style="margin: 0 0 24px; color: #555; font-size: 15px;">
          Hi${params.name ? ` ${params.name}` : ""}, your ZidStore subscription is active.
        </p>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <table style="width: 100%; font-size: 14px; color: #333; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #777;">Plan</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${planLabel}</td></tr>
            <tr><td style="padding: 6px 0; color: #777;">Billing</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${params.billingPeriod}</td></tr>
            <tr><td style="padding: 6px 0; color: #777;">Amount</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">₦${params.amount.toLocaleString()}</td></tr>
            <tr><td style="padding: 6px 0; color: #777;">Next renewal</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${new Date(params.periodEnd).toLocaleDateString()}</td></tr>
            <tr><td style="padding: 6px 0; color: #777;">Reference</td><td style="padding: 6px 0; text-align: right; font-family: monospace; font-size: 12px;">${params.reference}</td></tr>
          </table>
        </div>
        <p style="margin: 24px 0 0; color: #555; font-size: 14px;">Your ${planLabel} features are now unlocked.</p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://zidwell.com"}/dashboard/services/payment/dashboard"
           style="display: inline-block; margin-top: 24px; background: #F5B800; color: #191919; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
          Go to dashboard →
        </a>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Zidwell" <${process.env.EMAIL_USER}>`,
      to: params.email,
      subject: `Your ZidStore ${planLabel} subscription is active`,
      html,
    });
    console.log(`[subscription email] ✅ sent to ${params.email}`);
  } catch (err) {
    console.error("[subscription email] ❌ send failed:", err);
  }
}

export async function processSubscriptionFromPaystack(payload: any) {
  const data = payload?.data || {};
  const reference = data.reference;

  if (!reference) {
    return { error: "Missing reference", status: 400 };
  }

  console.log("[subscription webhook] processing reference:", reference);

  // ─── ATOMIC CLAIM: only one caller gets through ───
  // Anyone else (webhook + verify poll + callback) hits this conditional update
  // and sees zero affected rows.
  const { data: claimed, error: claimErr } = await supabase
    .from("zidstore_subscription_payments")
    .update({
      status: "processing",
      updated_at: new Date().toISOString(),
    })
    .eq("reference", reference)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (claimErr) {
    console.error("[subscription webhook] claim failed:", claimErr);
    return { error: "Claim failed", status: 500 };
  }

  if (!claimed) {
    // Either already processing, or already success — check current status
    const { data: existing } = await supabase
      .from("zidstore_subscription_payments")
      .select("status, subscription_id")
      .eq("reference", reference)
      .maybeSingle();

    console.log(
      "[subscription webhook] already claimed by another caller. Status:",
      existing?.status
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
  const planTier = payment.plan_tier || metadata.plan_tier;
  const billingPeriod =
    payment.billing_period || metadata.billing_period || "monthly";
  const userId = payment.user_id;

  if (!planTier) {
    await supabase
      .from("zidstore_subscription_payments")
      .update({ status: "pending" })
      .eq("id", payment.id);
    return { error: "Missing plan_tier in payment record", status: 400 };
  }

  const now = new Date().toISOString();
  const periodEnd = calculatePeriodEnd(billingPeriod as "monthly" | "yearly");

  // Cancel existing active subscriptions
  await supabase
    .from("zidstore_subscriptions")
    .update({ status: "cancelled", cancelled_at: now, updated_at: now })
    .eq("user_id", userId)
    .eq("status", "active");

  // Create subscription
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
    console.error(
      "[subscription webhook] failed to create subscription:",
      subError
    );
    // Release the claim so a retry can happen
    await supabase
      .from("zidstore_subscription_payments")
      .update({ status: "pending" })
      .eq("id", payment.id);
    return { error: "Failed to create subscription", status: 500 };
  }

  // Mark payment success
  await supabase
    .from("zidstore_subscription_payments")
    .update({
      status: "success",
      paid_at: now,
      provider_transaction_id: data.id,
      subscription_id: subscription.id,
      updated_at: now,
    })
    .eq("id", payment.id);

  console.log("[subscription webhook] success:", {
    subscriptionId: subscription.id,
    planTier,
    billingPeriod,
  });

  // Send email
  try {
    const { data: user } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", userId)
      .maybeSingle();

    if (user?.email) {
      await sendSubscriptionEmail({
        email: user.email,
        name: user.full_name,
        planTier,
        billingPeriod,
        amount: Number(payment.amount) || 0,
        reference,
        periodEnd: periodEnd.toISOString(),
      });
    }
  } catch (emailErr) {
    console.error("[subscription webhook] email step threw:", emailErr);
  }

  return { success: true, subscription_id: subscription.id };
}
