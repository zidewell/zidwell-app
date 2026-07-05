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
      free: "Free",
      solopreneur: "Solopreneur",
      sme: "SME",
      enterprise: "Enterprise",
      corporation: "Corporation"
    };

    const planDisplayName = planNames[planTier] || planTier;

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🧾 Subscription Payment Receipt - ${planDisplayName} Plan`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: #22c55e;">✅ Payment Confirmed!</h3>
          <p>Hello ${customerName},</p>
          <p>Thank you for subscribing to the <strong>${planDisplayName}</strong> plan.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p><strong>Plan:</strong> ${planDisplayName}</p>
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
      free: "Free",
      solopreneur: "Solopreneur",
      sme: "SME",
      enterprise: "Enterprise",
      corporation: "Corporation"
    };

    const planDisplayName = planNames[planTier] || planTier;

    // Feature highlights based on plan
    const getPlanFeatures = (tier: string): string => {
      switch(tier) {
        case 'solopreneur':
          return `
            <li>Up to 10 invoices</li>
            <li>Unlimited receipts</li>
            <li>Branded invoices</li>
            <li>Better expense tracking</li>
            <li>Basic financial insights</li>
          `;
        case 'sme':
          return `
            <li>Upload bank statements (PDF/Excel/CSV)</li>
            <li>Connect up to 3 bank accounts</li>
            <li>Unlimited invoices & receipts</li>
            <li>Vault for financial documents</li>
            <li>Tax calculator</li>
            <li>Financial statements (P&L, Cash Flow, Balance Sheet)</li>
            <li>1 extra team member access</li>
          `;
        case 'enterprise':
          return `
            <li>Multi-user access (full team)</li>
            <li>Role-based permissions</li>
            <li>Request & approval system</li>
            <li>Connect 5 bank accounts</li>
            <li>Downloadable financial reports</li>
            <li>10 contracts</li>
            <li>Dedicated onboarding support</li>
          `;
        case 'corporation':
          return `
            <li>Unlimited contracts</li>
            <li>Department-based access</li>
            <li>Connect unlimited bank accounts</li>
            <li>Simple payroll system</li>
            <li>Advanced financial reporting</li>
            <li>Custom financial structure setup</li>
            <li>Priority onboarding support</li>
            <li>Dedicated account manager</li>
          `;
        default:
          return `
            <li>Manual bookkeeping</li>
            <li>Up to 5 invoices</li>
            <li>Up to 5 receipts</li>
            <li>Basic financial overview</li>
          `;
      }
    };

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎉 Subscription Activated - ${planDisplayName} Plan`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: #22c55e;">🎉 Subscription Activated!</h3>
          <p>Hello ${customerName},</p>
          <p>Your <strong>${planDisplayName}</strong> subscription has been activated successfully.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p><strong>Billing Period:</strong> ${billingPeriod}</p>
            <p><strong>Next Billing Date:</strong> ${expiresAt.toLocaleDateString()}</p>
          </div>
          <p>You can now enjoy these premium features:</p>
          <ul>
            ${getPlanFeatures(planTier)}
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