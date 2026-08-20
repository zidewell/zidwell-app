// app/lib/subscription-emails.ts (UPDATED with real plan names)

import { transporter } from "@/lib/node-mailer";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const baseUrl = process.env.NODE_ENV === "development"
  ? process.env.NEXT_PUBLIC_DEV_URL
  : process.env.NEXT_PUBLIC_BASE_URL;

const headerImageUrl = `${baseUrl}/zidwell-header.png`;
const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

// Get plan display name (UPDATED with real plan names)
const getPlanDisplayName = (tier: string): string => {
  const planNames: Record<string, string> = {
    free: "Free",
    starter: "STARTER",
    sme: "SME",
    enterprise: "Enterprise",
    console: "CONSOLE"
  };
  return planNames[tier] || tier.charAt(0).toUpperCase() + tier.slice(1);
};

// Get plan features for email (UPDATED with real plan names)
const getPlanFeatures = (tier: string): string[] => {
  const features: Record<string, string[]> = {
    free: [
      '5 invoices per month',
      '5 receipts per month',
      '0 contracts',
      'Manual bookkeeping',
      'Auto bookkeeping',
      'Payment links',
      'Business bank account',
      'Basic financial overview'
    ],
    starter: [
      'Unlimited invoices',
      'Unlimited receipts',
      '0 contracts',
      'Manual bookkeeping',
      'Auto bookkeeping',
      'Payment links',
      'Business bank account',
      'Basic financial overview'
    ],
    sme: [
      'Unlimited Invoices & Receipts',
      'Bank statement upload (PDF/Excel/CSV)',
      'Connect up to 3 bank accounts',
      'Vault for financial documents',
      'Tax calculator',
      'Financial statements (P&L, Cash Flow, Balance Sheet)',
      '1 extra team member'
    ],
    enterprise: [
      'Multi-user access (full team)',
      'Role-based permissions',
      'Approval system for payments, invoices, receipts',
      'Connect up to 5 bank accounts',
      'Downloadable financial reports',
      '10 contracts',
      'Dedicated onboarding support'
    ],
    console: [
      'Unlimited contracts',
      'Department-based access (HR, Finance, Ops…)',
      'Connect unlimited bank accounts',
      'Simple payroll system',
      'Advanced financial reporting',
      'Custom financial structure setup',
      'Priority onboarding & dedicated account manager'
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
  billingPeriod: 'monthly' | 'yearly',
  expiresAt: Date
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
  billingPeriod: 'monthly' | 'yearly',
  expiresAt: Date
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
            ${features.map(f => `<li>${f}</li>`).join('')}
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

// Send cancellation email
export async function sendSubscriptionCancellationEmail(
  email: string,
  customerName: string,
  planTier: string
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
