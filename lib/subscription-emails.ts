// app/lib/subscription-emails.ts

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
    const planNames: Record<string, string> = {
      zidlite: "ZidLite",
      growth: "Growth",
      premium: "Premium",
      elite: "Elite"
    };

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🧾 Subscription Payment Receipt - ${planNames[planTier] || planTier}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: #22c55e;">✅ Payment Confirmed!</h3>
          <p>Hello ${customerName},</p>
          <p>Thank you for subscribing to <strong>${planNames[planTier] || planTier}</strong> plan.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p><strong>Plan:</strong> ${planNames[planTier] || planTier}</p>
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
    const planNames: Record<string, string> = {
      zidlite: "ZidLite",
      growth: "Growth",
      premium: "Premium",
      elite: "Elite"
    };

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎉 Subscription Activated - ${planNames[planTier] || planTier} Plan`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: #22c55e;">🎉 Subscription Activated!</h3>
          <p>Hello ${customerName},</p>
          <p>Your <strong>${planNames[planTier] || planTier}</strong> subscription has been activated successfully.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p><strong>Billing Period:</strong> ${billingPeriod}</p>
            <p><strong>Next Billing Date:</strong> ${expiresAt.toLocaleDateString()}</p>
          </div>
          <p>You can now enjoy premium features:</p>
          <ul>
            ${planTier === 'zidlite' ? '<li>20 Invoices & Receipts</li><li>2 Contracts</li><li>WhatsApp Support</li>' : ''}
            ${planTier === 'growth' ? '<li>Unlimited Invoices & Receipts</li><li>Bookkeeping Tool</li><li>Tax Calculator</li>' : ''}
            ${planTier === 'premium' ? '<li>Unlimited Contracts</li><li>Financial Statement Preparation</li><li>Priority Support</li>' : ''}
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