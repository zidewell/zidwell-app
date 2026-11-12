// app/api/webhook/helpers/email-helpers.ts
import { transporter } from "@/lib/node-mailer";
import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs";
import path from "path";
import { emailShell, ui, esc, naira, niceDate, EMAIL_BRAND } from "@/lib/email/ui";

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
const cheersImageUrl = `${baseUrl}/cheers-transanction.gif`;

function getLogoBase64() {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const imageBuffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${imageBuffer.toString("base64")}`;
  } catch (error) {
    console.error("Error loading logo:", error);
    return "";
  }
}

async function generatePdfBufferFromHtml(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();
  return Buffer.from(pdf);
}

// currency formatter — inline to avoid circular imports
const formatNaira = (value: number) =>
  `₦${Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

async function sendInvoiceCreatorNotificationEmail(
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
      subject: `💰 Payment received — ${naira(amount)}`,
      html: emailShell({
        title: "Payment received",
        preheader: `You received ${naira(amount)} for invoice ${invoiceId}.`,
        content: `
          ${ui.h1("💰 Payment received")}
          ${ui.p(`You received a payment for invoice <strong>${esc(invoiceId)}</strong>.`)}
          ${ui.kvCard([
            { label: "Amount", value: naira(amount), bold: true, color: EMAIL_BRAND.green },
            { label: "Customer", value: esc(customerName) },
            { label: "Status", value: "Completed" },
          ])}
          ${ui.muted("The net amount has been credited to your Zidwell wallet.")}
          ${ui.signature()}
        `,
      }),
    });
  } catch (error) {
    console.error("Failed to send invoice notification:", error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VIRTUAL ACCOUNT DEPOSIT EMAIL
//
// `inflowFee` is the amount Zidwell charged the user for the inflow.
// Nomba's fee is absorbed by Zidwell and NOT shown to the user.
//
// Backwards-compatible: if `inflowFee` is undefined, defaults to 0
// (no fee shown, full amount credited).
// ─────────────────────────────────────────────────────────────────────────────
async function sendVirtualAccountDepositEmail(
  userId: string,
  amount: number,
  transactionId: string,
  bankName: string,
  accountNumber: string,
  accountName: string,
  senderName: string,
  narration?: string,
  inflowFee: number = 0,
) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("email, first_name")
      .eq("id", userId)
      .single();

    if (error || !user?.email) {
      console.error("❌ Cannot find user for deposit email:", userId, error);
      return;
    }

    const netCredit = amount - inflowFee;

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `💰 Deposit received — ${naira(amount)}`,
      html: emailShell({
        title: "Deposit received",
        preheader: `${naira(netCredit)} has been credited to your Zidwell wallet.`,
        content: `
          ${ui.h1("✅ Credit alert")}
          ${ui.p(`Hi ${esc(user.first_name || "there")},`)}
          ${ui.p("Your virtual account deposit was successful.")}
          ${ui.kvCard([
            { label: "Amount received", value: naira(amount) },
            ...(inflowFee > 0
              ? [{ label: "Fee", value: naira(inflowFee) }]
              : []),
            { label: "Net credit", value: naira(netCredit), bold: true, color: EMAIL_BRAND.green },
            { label: "Bank", value: esc(bankName) },
            { label: "Sender", value: esc(senderName) },
            { label: "Narration", value: esc(narration || "—") },
            { label: "Reference", value: esc(transactionId) },
          ])}
          ${ui.muted(`${naira(netCredit)} is now available in your Zidwell wallet.`)}
          ${ui.signature()}
        `,
      }),
    });
  } catch (error) {
    console.error("Failed to send deposit email:", error);
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// WITHDRAWAL EMAIL — unchanged (already handles fee correctly)
// ─────────────────────────────────────────────────────────────────────────────
async function sendWithdrawalEmail(
  userId: string,
  status: "success" | "failed",
  amount: number,
  recipientName: string,
  recipientAccount: string,
  bankName: string,
  transactionId?: string,
  errorDetail?: string,
  fee?: number,
  receiptHtml?: string,
) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("email, first_name")
      .eq("id", userId)
      .single();

    if (error || !user?.email) {
      console.error("❌ User not found for email:", userId);
      return;
    }

    const isSuccess = status === "success";

    const mailOptions: any = {
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: isSuccess
        ? `✅ Transfer successful — ${naira(amount)}`
        : `❌ Transfer failed — ${naira(amount)}`,
      html: emailShell({
        title: isSuccess ? "Transfer successful" : "Transfer failed",
        preheader: isSuccess
          ? `${naira(amount)} sent to ${recipientName}.`
          : `Your transfer to ${recipientName} failed.`,
        content: `
          ${ui.h1(isSuccess ? "✅ Transfer successful" : "❌ Transfer failed")}
          ${ui.p(`Hi ${esc(user.first_name || "there")},`)}
          ${ui.kvCard([
            { label: "Amount", value: naira(amount) },
            ...(fee ? [{ label: "Fee", value: naira(fee) }] : []),
            { label: "Recipient", value: esc(recipientName) },
            { label: "Account", value: esc(recipientAccount) },
            { label: "Bank", value: esc(bankName) },
            ...(!isSuccess
              ? [{ label: "Reason", value: esc(errorDetail || "Transaction failed") }]
              : []),
          ])}
          ${
            isSuccess
              ? ui.muted("A PDF receipt is attached to this email.")
              : ui.alert(
                  "Your wallet was <strong>never charged</strong> for this transfer.",
                  "success"
                )
          }
          ${ui.signature()}
        `,
      }),
    };

    if (isSuccess && receiptHtml && transactionId) {
      try {
        const logo = getLogoBase64();
        let finalHtml = receiptHtml;
        if (logo) {
          finalHtml = receiptHtml.replace(
            /src="[^"]*\/logo\.png"/g,
            `src="${logo}"`
          );
        }
        const pdfBuffer = await generatePdfBufferFromHtml(finalHtml);
        mailOptions.attachments = [
          {
            filename: `zidwell-receipt-${transactionId}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ];
      } catch (pdfError) {
        console.error("❌ Failed to generate PDF for email:", pdfError);
      }
    }

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("❌ Failed to send withdrawal email:", error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REFUND EMAIL
//
// Sent when a payout fails and Nomba returns the money to our corporate
// wallet, and we credit the user's wallet back. Mirrors the visual format
// of sendWithdrawalEmail so the user experience is consistent.
// ─────────────────────────────────────────────────────────────────────────────
// ─── sendRefundEmail ───
async function sendRefundEmail(
  userId: string,
  amount: number,
  refundAmount: number,
  recipientName: string,
  recipientAccount: string,
  bankName: string,
  transactionId?: string,
  originalFee?: number,
) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("email, first_name")
      .eq("id", userId)
      .single();

    if (error || !user?.email) {
      console.error("❌ User not found for refund email:", userId);
      return;
    }

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `🔄 Refund processed — ${naira(refundAmount)}`,
      html: emailShell({
        title: "Refund processed",
        preheader: `${naira(refundAmount)} has been returned to your wallet.`,
        content: `
          ${ui.h1("🔄 Refund processed")}
          ${ui.p(`Hi ${esc(user.first_name || "there")},`)}
          ${ui.p(
            "Your recent transfer couldn't be completed by the bank. The funds have been returned to your Zidwell wallet."
          )}
          ${ui.kvCard([
            { label: "Refund amount", value: naira(refundAmount), bold: true, color: EMAIL_BRAND.green },
            ...(originalFee && originalFee > 0
              ? [{ label: "Fee refunded", value: naira(originalFee) }]
              : []),
            { label: "Original transfer", value: naira(amount) },
            { label: "Recipient", value: esc(recipientName) },
            { label: "Account", value: esc(recipientAccount) },
            { label: "Bank", value: esc(bankName) },
            ...(transactionId ? [{ label: "Transaction ID", value: esc(transactionId) }] : []),
          ])}
          ${ui.alert(`${naira(refundAmount)} is back in your Zidwell wallet.`, "success")}
          ${ui.signature()}
        `,
      }),
    });
  } catch (error) {
    console.error("❌ Failed to send refund email:", error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REVERSAL EMAIL
//
// Sent when a previously-credited customer payment is reversed by the bank
// (e.g. sender recalls the transfer). The user's wallet is debited and we
// notify them that the funds were clawed back.
//
// Signature matches the call in payment-reversal.service.ts:
//   (userId, reversedAmount, walletDebited, balanceBefore, balanceAfter,
//    transactionReference, description?, shortfall?)
// ─────────────────────────────────────────────────────────────────────────────
// ─── sendReversalEmail ───
async function sendReversalEmail(
  userId: string,
  reversedAmount: number,
  walletDebited: number,
  balanceBefore: number,
  balanceAfter: number,
  transactionReference: string,
  description?: string,
  shortfall: boolean = false,
) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("email, first_name")
      .eq("id", userId)
      .single();

    if (error || !user?.email) {
      console.error("❌ User not found for reversal email:", userId);
      return;
    }

    const shortfallAmount = shortfall ? Math.max(0, reversedAmount - walletDebited) : 0;

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `⚠️ Payment reversal — ${naira(reversedAmount)}`,
      html: emailShell({
        title: "Payment reversal",
        preheader: `A previously credited payment was reversed.`,
        content: `
          ${ui.h1("⚠️ Payment reversal")}
          ${ui.p(`Hi ${esc(user.first_name || "there")},`)}
          ${ui.p(
            "A payment that was previously credited to your wallet has been reversed by the bank."
          )}
          ${ui.kvCard([
            { label: "Reversed amount", value: naira(reversedAmount), bold: true, color: EMAIL_BRAND.red },
            { label: "Debited from wallet", value: naira(walletDebited) },
            { label: "Balance before", value: naira(balanceBefore) },
            { label: "New balance", value: naira(balanceAfter) },
            ...(description ? [{ label: "Description", value: esc(description) }] : []),
            { label: "Reference", value: esc(transactionReference) },
          ])}
          ${
            shortfall
              ? ui.alert(
                  `<strong>Insufficient balance:</strong> only ${naira(
                    walletDebited
                  )} could be recovered. The remaining ${naira(
                    shortfallAmount
                  )} is recorded against your account.`,
                  "warning"
                )
              : ""
          }
          ${ui.signature()}
        `,
      }),
    });
  } catch (error) {
    console.error("❌ Failed to send reversal email:", error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// generateTransferReceipt — fee removed from user-facing receipt
// ─────────────────────────────────────────────────────────────────────────────
function generateTransferReceipt(data: any): string {
  const amountDisplay = Number(data.amount).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedDate = new Date(data.date).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const escapeHtml = (str: string) => {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Zidwell Receipt | ${data.transactionId}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Arial', 'Helvetica', sans-serif; }
  body { background: #101010; display: flex; justify-content: center; padding: 30px 20px; }
  .receipt { width: 550px; background: #fff; border: 2px solid #E5B333; border-radius: 20px; overflow: hidden; box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3); }
  .header { height: 120px; position: relative; display: flex; justify-content: center; align-items: flex-start; }
  .header::after { content: ""; position: absolute; bottom: 0px; left: 50%; transform: translateX(-50%); width: 280px; height: 130px; background: #101010; border: 2px solid #E5B333; clip-path: polygon(0 0, 100% 0, 88% 100%, 12% 100%); border-radius: 0 0 240px 240px; }
  .logo { position: relative; z-index: 2; }
  .logo img { width: 130px; }
  .content { padding: 30px 40px 30px; }
  .status-icon { width: 48px; height: 48px; margin: 0 auto 20px; display: flex; justify-content: center; align-items: center; }
  .status-icon svg { width: 48px; height: 48px; }
  .title { text-align: center; }
  .title h1 { font-size: 25px; margin-bottom: 10px; }
  .title p { color: #777; }
  .divider { display: flex; align-items: center; gap: 8px; margin: 15px 0; }
  .divider-line { flex: 1; height: 1px; background: #E5B333; }
  .dot { width: 5px; height: 5px; border-radius: 50%; background: #E5B333; }
  .amount { text-align: center; }
  .amount-label { color: #777; text-transform: uppercase; letter-spacing: 1px; }
  .amount-value { font-size: 30px; font-weight: 700; margin-top: 10px; }
  .section-title { display: flex; align-items: center; gap: 15px; margin: 25px 0 15px; }
  .section-title .line { flex: 1; height: 1px; background: #E5B333; }
  .section-title span { color: #E5B333; font-weight: 600; text-transform: uppercase; font-size: 13px; }
  .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0e0a3; }
  .detail-row-last { border-bottom: none; }
  .left { display: flex; gap: 15px; align-items: center; flex: 1; }
  .icon { width: 42px; height: 42px; background: #101010; border-radius: 50%; color: #E5B333; display: flex; justify-content: center; align-items: center; flex-shrink: 0; }
  .detail-title { font-size: 13px; color: #444; }
  .detail-value { font-weight: 600; margin-top: 3px; font-size: 14px; }
  .sub { color: #777; font-size: 12px; }
  .right { font-weight: 600; text-align: right; font-size: 14px; }
  .footer { height: 50px; color: #fff; font-size:12px; display: flex; justify-content: center; align-items: center; position: relative; background: #101010; }
  .footer::before { content: ""; position: absolute; top: -40px; left: 0; width: 100%; height: 80px; background: #101010; border-top: 2px solid #E5B333; border-top-left-radius: 70%; border-top-right-radius: 70%; }
  .footer span { position: relative; z-index: 2; }
  .narration-wrapper { display: flex; justify-content: space-between; align-items: center; flex: 1; }
  .narration-text { font-weight: 400; font-size: 13px; text-align: right; max-width: 60%; word-break: break-word; }
</style>
</head>
<body>
<div class="receipt">
  <div class="header">
    <div class="logo">
      <img src="/logo.png" alt="Zidwell Logo">
    </div>
  </div>
  <div class="content">
    <div class="status-icon">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#E5B333" stroke="none"/>
        <path d="M8 12L11 15L16 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="title">
      <h1>Transfer Successful</h1>
      <p>Your transaction has been completed successfully.</p>
    </div>
    <div class="divider">
      <div class="divider-line"></div>
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="divider-line"></div>
    </div>
    <div class="amount">
      <div class="amount-label">Amount</div>
      <div class="amount-value">₦${amountDisplay}</div>
    </div>
    <div class="section-title">
      <div class="line"></div>
      <span>Transaction Details</span>
      <div class="line"></div>
    </div>
    <div class="detail-row">
      <div class="left">
        <div class="icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="narration-wrapper">
          <div>
            <div class="detail-title">Date & Time</div>
          </div>
          <div class="right">${formattedDate}</div>
        </div>
      </div>
    </div>
    <div class="detail-row">
      <div class="left">
        <div class="icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="19" x2="12" y2="5"/>
            <polyline points="5 12 12 5 19 12"/>
          </svg>
        </div>
        <div class="narration-wrapper">
          <div>
            <div class="detail-title">From</div>
            <div class="detail-value">${escapeHtml(data.senderName || "Zidwell User")}</div>
            ${data.senderAccount ? `<div class="sub">${escapeHtml(data.senderAccount)}</div>` : ""}
          </div>
        </div>
      </div>
    </div>
    <div class="detail-row">
      <div class="left">
        <div class="icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <polyline points="19 12 12 19 5 12"/>
          </svg>
        </div>
        <div class="narration-wrapper">
          <div>
            <div class="detail-title">To</div>
            <div class="detail-value">${escapeHtml(data.recipientName || "N/A")}</div>
            ${data.recipientAccount ? `<div class="sub">${escapeHtml(data.recipientAccount)}</div>` : ""}
            ${data.recipientBank ? `<div class="sub">${escapeHtml(data.recipientBank)}</div>` : ""}
          </div>
        </div>
      </div>
    </div>
    ${
      data.narration
        ? `
    <div class="detail-row">
      <div class="left">
        <div class="icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div class="narration-wrapper">
          <div>
            <div class="detail-title">Narration</div>
          </div>
          <div class="narration-text">${escapeHtml(data.narration)}</div>
        </div>
      </div>
    </div>
    `
        : ""
    }
    <div class="detail-row detail-row-last">
      <div class="left">
        <div class="icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div class="narration-wrapper">
          <div>
            <div class="detail-title">Transaction ID</div>
            <div class="detail-value">${escapeHtml(data.transactionId)}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="footer">
    <span>Thank you for using Zidwell.</span>
  </div>
</div>
</body>
</html>`;
}

export {
  getLogoBase64,
  generatePdfBufferFromHtml,
  sendInvoiceCreatorNotificationEmail,
  sendVirtualAccountDepositEmail,
  sendWithdrawalEmail,
  sendRefundEmail,
  sendReversalEmail,
  generateTransferReceipt,
};