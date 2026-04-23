import { transporter } from "@/lib/node-mailer";
import { createClient } from "@supabase/supabase-js";

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL
    : process.env.NEXT_PUBLIC_BASE_URL;
    const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const headerImageUrl = `${baseUrl}/zidwell-header.png`;
const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

export async function sendInvoiceCreatorNotificationEmail(
  creatorEmail: string,
  invoiceId: string,
  amount: number,
  customerName: string,
  invoice: any,
  nombaFee?: number,
) {
  try {
    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: creatorEmail,
      subject: `💰 Payment Received - ₦${amount.toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: #22c55e;">✅ Payment Received!</h3>
          <p>You've received a payment for invoice <strong>${invoiceId}</strong>.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
           
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Status:</strong> <span style="color: #22c55e;">Completed</span></p>
          </div>
          <p>Your wallet has been credited with the full amount.</p>
          <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send invoice notification:", error);
  }
}

export async function sendVirtualAccountDepositEmail(
  userId: string,
  amount: number,
  transactionId: string,
  bankName: string,
  accountNumber: string,
  accountName: string,
  senderName: string,
  narration?: string,
  nombaFee?: number,
) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("email, first_name")
      .eq("id", userId)
      .single();

    if (error || !user) return;

    const creditedAmount = amount - (nombaFee || 0);

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `💰 Account Deposit Received - ₦${creditedAmount.toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: #22c55e;">✅ Deposit Successful</h3>
          <p>Hi ${user.first_name || "there"},</p>
          <p>Your account has been credited with <strong>₦${creditedAmount.toLocaleString()}</strong>.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p><strong>Amount Received:</strong> ₦${amount.toLocaleString()}</p>
          
            <p><strong>Net Credit:</strong> ₦${creditedAmount.toLocaleString()}</p>
            <p><strong>Bank:</strong> ${bankName}</p>
            <p><strong>Account:</strong> ${accountNumber}</p>
            <p><strong>Sender:</strong> ${senderName}</p>
            <p><strong>Narration:</strong> ${narration || "N/A"}</p>
          </div>
          <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send deposit email:", error);
  }
}

export async function sendWithdrawalEmail(
  userId: string,
  status: "success" | "failed",
  amount: number,
  recipientName: string,
  recipientAccount: string,
  bankName: string,
  transactionId?: string,
  errorDetail?: string,
  fee?: number,
) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("email, first_name")
      .eq("id", userId)
      .single();

    if (error || !user) return;

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject:
        status === "success"
          ? `✅ Transfer Successful - ₦${amount.toLocaleString()}`
          : `❌ Transfer Failed - ₦${amount.toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: ${status === "success" ? "#22c55e" : "#ef4444"};">
            ${status === "success" ? "✅ Transfer Successful" : "❌ Transfer Failed"}
          </h3>
          <p>Hi ${user.first_name || "there"},</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
            ${fee ? `<p><strong>Fee:</strong> ₦${fee.toLocaleString()}</p>` : ""}
            <p><strong>Recipient:</strong> ${recipientName}</p>
            <p><strong>Account:</strong> ${recipientAccount}</p>
            <p><strong>Bank:</strong> ${bankName}</p>
            ${status === "failed" ? `<p><strong>Reason:</strong> ${errorDetail || "Transaction failed"}</p>` : ""}
          </div>
          ${status === "failed" ? '<p style="color: #22c55e;">✅ Your wallet was never charged for this transaction.</p>' : ""}
          <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send withdrawal email:", error);
  }
}