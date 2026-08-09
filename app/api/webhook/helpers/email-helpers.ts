import { transporter } from "@/lib/node-mailer";
import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

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
const cheersImageUrl =
  `${baseUrl}/cheers-transanction.gif` || `${baseUrl}/cheers-transanction.gif`;

// Convert logo to base64
export function getLogoBase64() {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    console.log(`🔍 Looking for logo at: ${logoPath}`);
    
    if (fs.existsSync(logoPath)) {
      const imageBuffer = fs.readFileSync(logoPath);
      const base64 = `data:image/png;base64,${imageBuffer.toString("base64")}`;
      console.log(`✅ Logo found! Size: ${imageBuffer.length} bytes`);
      return base64;
    } else {
      console.warn(`⚠️ Logo file NOT found at: ${logoPath}`);
      return "";
    }
  } catch (error) {
    console.error("❌ Error loading logo:", error);
    return "";
  }
}

// Generate PDF from HTML using Puppeteer
export async function generatePdfBufferFromHtml(html: string): Promise<Buffer> {
  console.log('🔄 Starting PDF generation with Puppeteer...');
  console.log(`📄 HTML length: ${html.length} bytes`);
  console.log(`📄 HTML preview: ${html.substring(0, 500)}...`);
  
  let browser = null;
  try {
    console.log('🚀 Launching Puppeteer browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });
    console.log('✅ Browser launched successfully');
    
    const page = await browser.newPage();
    console.log('✅ New page created');
    
    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 1,
    });
    console.log('✅ Viewport set');
    
    console.log('📄 Setting page content...');
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    console.log('✅ Page content set');
    
    console.log('⏳ Waiting for rendering...');
    await page.waitForTimeout(1000);
    console.log('✅ Rendering complete');
    
    console.log('📄 Generating PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '40px',
        bottom: '40px',
        left: '40px',
        right: '40px'
      },
      displayHeaderFooter: false,
      preferCSSPageSize: true,
    });
    
    console.log(`✅ PDF generated successfully! Size: ${pdf.length} bytes`);
    return Buffer.from(pdf);
    
  } catch (error) {
    console.error("❌ Puppeteer PDF generation error:", error);
    console.error("❌ Error details:", JSON.stringify(error, null, 2));
    throw error;
  } finally {
    if (browser) {
      console.log('🔚 Closing browser...');
      await browser.close();
      console.log('✅ Browser closed');
    }
  }
}

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
      subject: `💰 Account Deposit Received - ₦${amount.toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: #22c55e;">✅ Credit alert</h3>
          <p>Hi ${user.first_name || "there"},</p>
           <img src="${cheersImageUrl}" style="width: 100%; margin: 10px 0; border-radius: 8px;" />
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p><strong>Amount Received:</strong> ₦${amount.toLocaleString()}</p>
            <p><strong>Bank:</strong> ${bankName}</p>
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
  receiptHtml?: string
) {
  console.log('='.repeat(60));
  console.log('📧 SEND WITHDRAWAL EMAIL - DEBUG START');
  console.log('='.repeat(60));
  
  try {
    console.log(`📧 Status: ${status}`);
    console.log(`📧 User ID: ${userId}`);
    console.log(`📧 Amount: ${amount}`);
    console.log(`📧 Recipient: ${recipientName}`);
    console.log(`📧 Transaction ID: ${transactionId}`);
    console.log(`📧 Receipt HTML provided: ${!!receiptHtml}`);
    console.log(`📧 Receipt HTML length: ${receiptHtml?.length || 0}`);
    
    if (receiptHtml) {
      console.log(`📧 Receipt HTML preview: ${receiptHtml.substring(0, 300)}...`);
    }

    // Fetch user
    console.log('🔍 Fetching user from Supabase...');
    const { data: user, error } = await supabase
      .from("users")
      .select("email, first_name")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("❌ Failed to fetch user:", error);
      return;
    }

    if (!user) {
      console.error("❌ User not found for ID:", userId);
      return;
    }

    if (!user.email) {
      console.error("❌ User has no email address:", userId);
      return;
    }

    console.log(`✅ User found: ${user.email}`);

    // Prepare email options
    const mailOptions: any = {
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
          ${status === "success" ? '<p style="margin-top: 15px;">📎 Please find your receipt attached to this email.</p>' : ""}
          <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
        </div>
      `,
    };

    // ✅ ATTEMPT TO ATTACH RECEIPT
    let attachmentAttempted = false;
    let attachmentSuccess = false;
    let attachmentError = null;

    if (status === "success" && transactionId) {
      console.log('📎 RECEIPT ATTACHMENT START');
      console.log(`📎 Transaction ID: ${transactionId}`);
      attachmentAttempted = true;
      
      try {
        // Use provided receipt HTML or generate fallback
        let finalReceiptHtml = receiptHtml;
        if (!finalReceiptHtml) {
          console.warn('⚠️ No receipt HTML provided, generating fallback receipt');
          finalReceiptHtml = generateFallbackReceipt({
            transactionId,
            amount,
            recipientName,
            recipientAccount,
            bankName,
            fee: fee || 0,
          });
          console.log(`✅ Fallback receipt generated: ${finalReceiptHtml.length} bytes`);
        }
        
        // Get logo as base64
        console.log('🔍 Getting logo as base64...');
        const logoBase64 = getLogoBase64();
        console.log(`📎 Logo base64 available: ${!!logoBase64}`);
        if (logoBase64) {
          console.log(`📎 Logo base64 length: ${logoBase64.length} bytes`);
        }
        
        // Replace logo URL with base64 if available
        let finalHtml = finalReceiptHtml;
        if (logoBase64) {
          const originalHtml = finalReceiptHtml;
          finalHtml = finalReceiptHtml.replace(
            /src="[^"]*\/logo\.png"/g,
            `src="${logoBase64}"`
          );
          if (originalHtml !== finalHtml) {
            console.log('✅ Logo URL replaced with base64');
          } else {
            console.warn('⚠️ No logo URL found to replace');
          }
        }
        
        // Generate PDF using Puppeteer
        console.log('🔄 Generating PDF with Puppeteer...');
        const pdfBuffer = await generatePdfBufferFromHtml(finalHtml);
        console.log(`✅ PDF generated! Size: ${pdfBuffer.length} bytes`);
        
        // Attach the PDF
        mailOptions.attachments = [
          {
            filename: `zidwell-receipt-${transactionId}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          }
        ];
        attachmentSuccess = true;
        console.log(`✅ PDF receipt attached successfully!`);
        console.log(`📎 Attachment filename: zidwell-receipt-${transactionId}.pdf`);
        console.log(`📎 Attachment size: ${pdfBuffer.length} bytes`);
        
      } catch (pdfError) {
        attachmentError = pdfError;
        console.error("❌ PDF generation/attachment failed:", pdfError);
        console.error("❌ Error details:", JSON.stringify(pdfError, null, 2));
        
        // Add error note to email
        mailOptions.html += `
          <p style="color: #ff6b6b; margin-top: 20px;">
            ⚠️ We were unable to generate a PDF receipt for this transaction. 
            Please contact support if you need a copy of your receipt.
          </p>
        `;
        console.log(`⚠️ Email will be sent without PDF attachment`);
      }
    } else {
      console.log(`⚠️ Skipping receipt attachment: status=${status}, hasTransactionId=${!!transactionId}`);
    }

    // Log final attachment status
    console.log('📎 ATTACHMENT SUMMARY:');
    console.log(`📎 Attempted: ${attachmentAttempted}`);
    console.log(`📎 Success: ${attachmentSuccess}`);
    if (attachmentError) {
      console.log(`📎 Error: ${attachmentError.message}`);
    }
    console.log(`📎 Has attachments: ${!!mailOptions.attachments}`);
    if (mailOptions.attachments) {
      console.log(`📎 Attachments count: ${mailOptions.attachments.length}`);
      mailOptions.attachments.forEach((att: any, index: number) => {
        console.log(`📎 Attachment ${index + 1}:`);
        console.log(`   - Filename: ${att.filename}`);
        console.log(`   - ContentType: ${att.contentType}`);
        console.log(`   - Size: ${att.content?.length || 0} bytes`);
      });
    }

    // Send the email
    console.log('📧 Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully!`);
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📧 To: ${user.email}`);
    console.log(`📧 Subject: ${mailOptions.subject}`);
    
    console.log('='.repeat(60));
    console.log('📧 SEND WITHDRAWAL EMAIL - DEBUG END');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error("❌ Failed to send withdrawal email:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    console.log('='.repeat(60));
    console.log('📧 SEND WITHDRAWAL EMAIL - DEBUG END WITH ERROR');
    console.log('='.repeat(60));
  }
}

// Fallback receipt generator
function generateFallbackReceipt(data: any): string {
  console.log('📄 Generating fallback receipt for:', data.transactionId);
  
  const amountDisplay = `₦${Number(data.amount).toLocaleString("en-NG", { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  })}`;
  
  const date = new Date().toLocaleString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Zidwell Receipt</title>
<style>
  body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
  .receipt { max-width: 500px; margin: 0 auto; background: #fff; border: 2px solid #E5B333; padding: 30px; border-radius: 10px; }
  .header { text-align: center; border-bottom: 2px solid #E5B333; padding-bottom: 20px; margin-bottom: 20px; }
  .logo { font-size: 24px; font-weight: bold; color: #E5B333; }
  .amount { font-size: 28px; font-weight: bold; color: #E5B333; text-align: center; margin: 20px 0; }
  .detail { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
  .detail:last-child { border-bottom: none; }
  .label { color: #666; }
  .value { font-weight: 500; }
  .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 2px solid #E5B333; color: #666; font-size: 12px; }
</style>
</head>
<body>
<div class="receipt">
  <div class="header">
    <div class="logo">Zidwell</div>
    <p>Payment Receipt</p>
  </div>
  <div class="amount">${amountDisplay}</div>
  <div class="detail"><span class="label">Transaction ID:</span><span class="value">${data.transactionId}</span></div>
  <div class="detail"><span class="label">Date:</span><span class="value">${date}</span></div>
  <div class="detail"><span class="label">Recipient:</span><span class="value">${data.recipientName}</span></div>
  <div class="detail"><span class="label">Account:</span><span class="value">${data.recipientAccount}</span></div>
  <div class="detail"><span class="label">Bank:</span><span class="value">${data.bankName}</span></div>
  ${data.fee > 0 ? `<div class="detail"><span class="label">Fee:</span><span class="value">₦${data.fee.toLocaleString()}</span></div>` : ''}
  <div class="footer">Thank you for using Zidwell.</div>
</div>
</body>
</html>`;

  console.log(`✅ Fallback receipt HTML generated: ${html.length} bytes`);
  return html;
}

export function generateTransferReceipt(data: any): string {
  console.log('📄 Generating transfer receipt for:', data.transactionId);
  
  const amountDisplay = `₦${Number(data.amount).toLocaleString("en-NG", { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  })}`;
  
  const formattedDate = new Date(data.date).toLocaleString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const feeDisplay = data.fee && data.fee > 0 
    ? `₦${Number(data.fee).toLocaleString("en-NG", { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      })}` 
    : "";

  const escapeHtml = (str: string) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Zidwell Receipt | ${data.transactionId}</title>
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Arial', 'Helvetica', sans-serif;
  }
  body {
    background: #101010;
    display: flex;
    justify-content: center;
    padding: 30px 20px;
  }
  .receipt {
    width: 550px;
    background: #fff;
    border: 2px solid #E5B333;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
  }
  .header {
    height: 120px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }
  .header::after {
    content: "";
    position: absolute;
    bottom: 0px;
    left: 50%;
    transform: translateX(-50%);
    width: 280px;
    height: 130px;
    background: #101010;
    border: 2px solid #E5B333;
    clip-path: polygon(0 0, 100% 0, 88% 100%, 12% 100%);
    border-radius: 0 0 240px 240px;
  }
  .logo {
    position: relative;
    z-index: 2;
  }
  .logo img {
    width: 130px;
  }
  .content {
    padding: 30px 40px 30px;
  }
  .status-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 20px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .status-icon svg {
    width: 48px;
    height: 48px;
  }
  .title {
    text-align: center;
  }
  .title h1 {
    font-size: 25px;
    margin-bottom: 10px;
  }
  .title p {
    color: #777;
  }
  .divider {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 15px 0;
  }
  .divider-line {
    flex: 1;
    height: 1px;
    background: #E5B333;
  }
  .dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #E5B333;
  }
  .amount {
    text-align: center;
  }
  .amount-label {
    color: #777;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .amount-value {
    font-size: 30px;
    font-weight: 700;
    margin-top: 10px;
  }
  .section-title {
    display: flex;
    align-items: center;
    gap: 15px;
    margin: 40px 0 25px;
  }
  .section-title .line {
    flex: 1;
    height: 1px;
    background: #E5B333;
  }
  .section-title span {
    color: #E5B333;
    font-weight: 600;
    text-transform: uppercase;
  }
  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 20px 0;
    border-bottom: 1px solid #f0e0a3;
  }
  .detail-row-last {
    border-bottom: none;
  }
  .left {
    display: flex;
    gap: 15px;
    align-items: center;
  }
  .icon {
    width: 42px;
    height: 42px;
    background: #101010;
    border-radius: 50%;
    color: #E5B333;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .detail-title {
    font-size: 15px;
    color: #444;
  }
  .detail-value {
    font-weight: 600;
    margin-top: 4px;
  }
  .sub {
    color: #777;
    font-size: 14px;
  }
  .right {
    font-weight: 600;
  }
  .footer {
    height: 50px;
    color: #fff;
    font-size:12px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    background: #101010;
  }
  .footer::before {
    content: "";
    position: absolute;
    top: -40px;
    left: 0;
    width: 100%;
    height: 80px;
    background: #101010;
    border-top: 2px solid #E5B333;
    border-top-left-radius: 70%;
    border-top-right-radius: 70%;
  }
  .footer span {
    position: relative;
    z-index: 2;
  }
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
      <div class="amount-value">${amountDisplay}</div>
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
        <div>
          <div class="detail-title">Date & Time</div>
        </div>
      </div>
      <div class="right">${formattedDate}</div>
    </div>

    <div class="detail-row">
      <div class="left">
        <div class="icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="19" x2="12" y2="5"/>
            <polyline points="5 12 12 5 19 12"/>
          </svg>
        </div>
        <div>
          <div class="detail-title">From</div>
          <div class="detail-value">${escapeHtml(data.senderName || 'Zidwell User')}</div>
          ${data.senderAccount ? `<div class="sub">${escapeHtml(data.senderAccount)}</div>` : ''}
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
        <div>
          <div class="detail-title">To</div>
          <div class="detail-value">${escapeHtml(data.recipientName || 'N/A')}</div>
          ${data.recipientAccount ? `<div class="sub">${escapeHtml(data.recipientAccount)}</div>` : ''}
          ${data.recipientBank ? `<div class="sub">${escapeHtml(data.recipientBank)}</div>` : ''}
        </div>
      </div>
    </div>

    ${data.narration ? `
    <div class="detail-row">
      <div class="left">
        <div class="icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div>
          <div class="detail-title">Narration</div>
          <div class="detail-value" style="font-weight: 400; font-size: 14px;">${escapeHtml(data.narration)}</div>
        </div>
      </div>
    </div>
    ` : ''}

    ${data.fee && data.fee > 0 ? `
    <div class="detail-row">
      <div class="left">
        <div class="icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div>
          <div class="detail-title">Fee</div>
        </div>
      </div>
      <div class="right">${feeDisplay}</div>
    </div>
    ` : ''}

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
        <div>
          <div class="detail-title">Transaction ID</div>
          <div class="detail-value">${escapeHtml(data.transactionId)}</div>
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

  console.log(`✅ Transfer receipt HTML generated: ${html.length} bytes`);
  return html;
}