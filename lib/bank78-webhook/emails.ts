// lib/bank78-webhook/emails.ts
import { createClient } from "@supabase/supabase-js";
import { transporter } from "@/lib/node-mailer";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL
    : process.env.NEXT_PUBLIC_BASE_URL;

export async function sendBank78DepositEmail(opts: {
  userId: string;
  amount: number;
  fee: number;
  netAmount: number;
  senderName: string;
  senderBank: string | null;
  narration: string | null;
  transactionId: string;
}) {
  const { data: user } = await supabase
    .from("users")
    .select("email, first_name")
    .eq("id", opts.userId)
    .single();
  if (!user?.email) return;

  await transporter.sendMail({
    from: `Zidwell <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `💰 Credit Alert — ₦${opts.netAmount.toLocaleString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <img src="${baseUrl}/zidwell-header.png" style="width:100%;" />
        <div style="padding:20px;">
          <h3 style="color:#22c55e;">✅ Wallet Funded</h3>
          <p>Hi ${user.first_name || "there"},</p>
          <div style="background:#f8fafc;padding:15px;border-radius:8px;">
            <p><strong>Amount received:</strong> ₦${opts.amount.toLocaleString()}</p>
            <p><strong>Fee:</strong> ₦${opts.fee.toLocaleString()}</p>
            <p><strong>Credited:</strong> ₦${opts.netAmount.toLocaleString()}</p>
            <p><strong>From:</strong> ${opts.senderName}</p>
            <p><strong>Bank:</strong> ${opts.senderBank || "N/A"}</p>
            <p><strong>Narration:</strong> ${opts.narration || "N/A"}</p>
            <p><strong>Reference:</strong> ${opts.transactionId}</p>
          </div>
        </div>
        <img src="${baseUrl}/zidwell-footer.png" style="width:100%;" />
      </div>
    `,
  });
}

export async function sendBank78WithdrawalEmail(opts: {
  userId: string;
  status: "success" | "failed";
  amount: number;
  fee: number;
  recipientName: string;
  recipientAccount: string;
  bankName: string;
  transactionId: string;
  errorDetail?: string;
}) {
  const { data: user } = await supabase
    .from("users")
    .select("email, first_name")
    .eq("id", opts.userId)
    .single();
  if (!user?.email) return;

  const ok = opts.status === "success";
  await transporter.sendMail({
    from: `Zidwell <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: ok
      ? `✅ Transfer Successful — ₦${opts.amount.toLocaleString()}`
      : `❌ Transfer Failed — ₦${opts.amount.toLocaleString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <img src="${baseUrl}/zidwell-header.png" style="width:100%;" />
        <div style="padding:20px;">
          <h3 style="color:${ok ? "#22c55e" : "#ef4444"};">
            ${ok ? "✅ Transfer Successful" : "❌ Transfer Failed"}
          </h3>
          <p>Hi ${user.first_name || "there"},</p>
          <div style="background:#f8fafc;padding:15px;border-radius:8px;">
            <p><strong>Amount:</strong> ₦${opts.amount.toLocaleString()}</p>
            ${opts.fee ? `<p><strong>Fee:</strong> ₦${opts.fee.toLocaleString()}</p>` : ""}
            <p><strong>Recipient:</strong> ${opts.recipientName}</p>
            <p><strong>Account:</strong> ${opts.recipientAccount}</p>
            <p><strong>Bank:</strong> ${opts.bankName}</p>
            <p><strong>Reference:</strong> ${opts.transactionId}</p>
            ${!ok && opts.errorDetail ? `<p><strong>Reason:</strong> ${opts.errorDetail}</p>` : ""}
          </div>
          ${!ok ? '<p style="color:#22c55e;">✅ Your wallet was never charged if the transfer failed.</p>' : ""}
        </div>
        <img src="${baseUrl}/zidwell-footer.png" style="width:100%;" />
      </div>
    `,
  });
}