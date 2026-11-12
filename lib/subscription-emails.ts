// lib/subscription-emails.ts

import { transporter } from "@/lib/node-mailer";
import { createClient } from "@supabase/supabase-js";

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

const getPlanDisplayName = (tier: string): string => {
  const planNames: Record<string, string> = {
    starter: "Starter",
    sme: "SME",
    enterprise: "Enterprise",
    console: "Console",
  };
  return planNames[tier] || tier.charAt(0).toUpperCase() + tier.slice(1);
};

const getPlanFeatures = (tier: string): string[] => {
  const features: Record<string, string[]> = {
    starter: [
      "Business bank account",
      "Business Plan Template",
      "Automatic Bookkeeping",
      "Invoice Tool",
      "Receipt Tool",
      "Online storefront",
      "Document Vault",
    ],
    sme: [
      "Business bank account",
      "Business Plan Template",
      "Automatic Bookkeeping",
      "Invoice Tool",
      "Receipt Tool",
      "International payments",
      "Online storefront",
      "Document Vault",
      "One Extra User",
    ],
    enterprise: [
      "Business bank account",
      "Increased transaction limits",
      "Business Plan Template",
      "Automatic Bookkeeping",
      "Connect Your Bank Accounts",
      "Invoice Tool",
      "Receipt Tool",
      "International payments",
      "Online storefront",
      "Document Vault",
      "Three Extra Users",
      "Dedicated support team",
    ],
    console: [
      "Everything in Enterprise",
      "Sub Accounts",
      "Roles & Permissions",
      "Approvals",
      "Unlimited users",
      "Custom pricing",
    ],
  };
  return features[tier] || [];
};

export async function sendSubscriptionReceiptWithPDF(
  email: string,
  customerName: string,
  planTier: string,
  amount: number,
  transactionId: string,
  billingPeriod: "monthly" | "yearly",
  expiresAt: Date,
): Promise<void> {
  try {
    const planName = getPlanDisplayName(planTier);

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🧾 Subscription Payment Receipt - ${planName} Plan`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: #22c55e;">✅ Payment Confirmed!</h3>
          <p>Hello ${customerName},</p>
          <p>Thank you for subscribing to <strong>${planName}</strong> plan.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p><strong>Plan:</strong> ${planName}</p>
            <p><strong>Billing Period:</strong> ${billingPeriod}</p>
            <p><strong>Amount Paid:</strong> ₦${amount.toLocaleString()}</p>
            <p><strong>Transaction ID:</strong> ${transactionId}</p>
            <p><strong>Valid Until:</strong> ${expiresAt.toLocaleDateString()}</p>
          </div>
          <p>You now have access to all features included in your plan.</p>
          <p><a href="${baseUrl}/dashboard" style="background: #e1bf46; color: #023528; padding: 10px 20px; text-decoration: none; border-radius: 8px;">Go to Dashboard</a></p>
          <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send subscription receipt:", error);
  }
}

export async function sendSubscriptionActivationEmail(
  email: string,
  customerName: string,
  planTier: string,
  billingPeriod: "monthly" | "yearly",
  expiresAt: Date,
): Promise<void> {
  try {
    const planName = getPlanDisplayName(planTier);
    const features = getPlanFeatures(planTier);

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎉 Subscription Activated - ${planName} Plan`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: #22c55e;">🎉 Subscription Activated!</h3>
          <p>Hello ${customerName},</p>
          <p>Your <strong>${planName}</strong> subscription has been activated successfully.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p><strong>Billing Period:</strong> ${billingPeriod}</p>
            <p><strong>Next Billing Date:</strong> ${expiresAt.toLocaleDateString()}</p>
          </div>
          <p>You can now enjoy premium features:</p>
          <ul>
            ${features.map((f) => `<li>${f}</li>`).join("")}
          </ul>
          <p><a href="${baseUrl}/dashboard" style="background: #e1bf46; color: #023528; padding: 10px 20px; text-decoration: none; border-radius: 8px;">Start Using Zidwell</a></p>
          <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send activation email:", error);
  }
}

export async function sendSubscriptionCancellationEmail(
  email: string,
  customerName: string,
  planTier: string,
): Promise<void> {
  try {
    const planName = getPlanDisplayName(planTier);

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `⚠️ Subscription Cancelled - ${planName} Plan`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: #f59e0b;">⚠️ Subscription Cancelled</h3>
          <p>Hello ${customerName},</p>
          <p>Your <strong>${planName}</strong> subscription has been cancelled.</p>
          <p>You will continue to have access until the end of your current billing period.</p>
          <p>If this was a mistake, you can resubscribe anytime from your dashboard.</p>
          <p><a href="${baseUrl}/dashboard" style="background: #e1bf46; color: #023528; padding: 10px 20px; text-decoration: none; border-radius: 8px;">Go to Dashboard</a></p>
          <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send cancellation email:", error);
  }
}