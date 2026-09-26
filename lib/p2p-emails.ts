// lib/p2p-emails.ts
import { createClient } from "@supabase/supabase-js";
import { transporter } from "@/lib/node-mailer";
import {
  getLogoBase64,
  generatePdfBufferFromHtml,
} from "@/app/api/webhook/helpers/email-helpers";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL
    : process.env.NEXT_PUBLIC_BASE_URL;

const headerImageUrl = `${baseUrl}/zidwell-header.png`;
const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

// ─────────────────────────────────────────────────────────────
// Sender: P2P success email (with receipt PDF)
// ─────────────────────────────────────────────────────────────
export async function sendP2PSuccessEmail(opts: {
  userId: string;
  receiverName: string;
  amount: number;
  transactionRef: string;
  transactionId: string;
  narration?: string;
  isInvoicePayment?: boolean;
  invoiceReference?: string;
  receiptHtml?: string;
}) {
  try {
    const { data: user } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", opts.userId)
      .single();

    if (!user?.email) return;

    const subject = opts.isInvoicePayment
      ? `✅ Invoice Payment Sent — ₦${opts.amount.toLocaleString()}`
      : `✅ P2P Transfer Successful — ₦${opts.amount.toLocaleString()}`;

    const greeting = user.full_name ? `Hi ${user.full_name},` : "Hello,";

    const mailOptions: any = {
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject,
      html: `
        <div>
          <img src="${headerImageUrl}" style="width:100%;" />
          <div style="padding:20px;">
            <p>${greeting}</p>
            <h3>✅ ${opts.isInvoicePayment ? "Invoice Payment" : "P2P Transfer"} Successful</h3>
            <p><strong>Amount:</strong> ₦${opts.amount.toLocaleString()}</p>
            <p><strong>${opts.isInvoicePayment ? "Invoice:" : "Recipient:"}</strong>
              ${opts.isInvoicePayment ? opts.invoiceReference : opts.receiverName}
            </p>
            <p><strong>Reference:</strong> ${opts.transactionRef}</p>
            ${
              !opts.isInvoicePayment
                ? "<p>📎 Your receipt is attached.</p>"
                : ""
            }
            <p>Thank you for using Zidwell!</p>
          </div>
          <img src="${footerImageUrl}" style="width:100%;" />
        </div>
      `,
    };

    if (opts.receiptHtml && opts.transactionId) {
      try {
        const logo = getLogoBase64();
        let finalHtml = opts.receiptHtml;
        if (logo) {
          finalHtml = finalHtml.replace(
            /src="[^"]*\/logo\.png"/g,
            `src="${logo}"`
          );
        }
        const pdf = await generatePdfBufferFromHtml(finalHtml);
        mailOptions.attachments = [
          {
            filename: `zidwell-receipt-${opts.transactionId}.pdf`,
            content: pdf,
            contentType: "application/pdf",
          },
        ];
      } catch (err) {
        console.error("[p2p] PDF generation failed:", err);
      }
    }

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("[p2p] sender email failed:", err);
  }
}

// ─────────────────────────────────────────────────────────────
// Receiver: P2P credit email
// ─────────────────────────────────────────────────────────────
export async function sendP2PReceivedEmail(opts: {
  receiverId: string;
  senderName: string;
  amount: number;
  transactionRef: string;
  narration?: string;
  isInvoicePayment?: boolean;
  invoiceReference?: string;
}) {
  try {
    const { data: user } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", opts.receiverId)
      .single();

    if (!user?.email) return;

    const subject = opts.isInvoicePayment
      ? `💰 Invoice Payment Received — ₦${opts.amount.toLocaleString()}`
      : `💰 P2P Transfer Received — ₦${opts.amount.toLocaleString()}`;

    const greeting = user.full_name ? `Hi ${user.full_name},` : "Hello,";

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject,
      html: `
        <div>
          <img src="${headerImageUrl}" style="width:100%;" />
          <div style="padding:20px;">
            <p>${greeting}</p>
            <h3>💰 ${opts.isInvoicePayment ? "Invoice Payment" : "P2P Transfer"} Received</h3>
            <p><strong>Amount:</strong> ₦${opts.amount.toLocaleString()}</p>
            <p><strong>${opts.isInvoicePayment ? "Invoice:" : "Sender:"}</strong>
              ${opts.isInvoicePayment ? opts.invoiceReference : opts.senderName}
            </p>
            <p><strong>Reference:</strong> ${opts.transactionRef}</p>
            <p>Thank you for using Zidwell!</p>
          </div>
          <img src="${footerImageUrl}" style="width:100%;" />
        </div>
      `,
    });
  } catch (err) {
    console.error("[p2p] receiver email failed:", err);
  }
}