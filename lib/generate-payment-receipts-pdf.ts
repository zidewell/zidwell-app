// lib/generate-payment-receipts-pdf.ts

import { createClient } from "@supabase/supabase-js";
import { transporter } from "@/lib/node-mailer";

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

// Helper function to generate Payment Page PDF HTML with installment support
function generatePaymentPagePDFHTML(
  paymentPage: any,
  paymentRecord: any,
  customerName: string,
  customerEmail: string,
  amount: number,
  transactionId: string,
  paymentMethod: string,
  paidAt: string,
  metadata?: any,
): string {
  const formatCurrency = (value: number): string => {
    return `₦${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime())
        ? dateString
        : date.toLocaleDateString("en-NG", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
    } catch {
      return dateString;
    }
  };

  const pageTitle = metadata?.pageTitle || paymentPage?.title || "Payment Page";
  const isInstallment = metadata?.isInstallment === true || paymentRecord?.payment_type === "installment";
  const installmentNumber = metadata?.installmentNumber || paymentRecord?.installment_number || 1;
  const totalInstallments = metadata?.totalInstallments || paymentRecord?.total_installments || 1;

  let paymentMethodText = "Card Payment";
  if (paymentMethod === "bank_transfer" || paymentMethod === "virtual_account" || metadata?.bank_transfer === true) {
    paymentMethodText = "Bank Transfer";
  } else if (paymentMethod === "card" || paymentMethod === "card_payment") {
    paymentMethodText = "Card Payment";
  }

  let additionalInfo = "";

  if (metadata?.pageType === "school") {
    additionalInfo = `
      <div class="info-section">
        <h3>🎓 Student Information</h3>
        <div class="info-row">
          <span class="info-label">Student Name:</span>
          <span class="info-value">${metadata.childName || metadata.selectedStudents?.join(", ") || "N/A"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Registration Number:</span>
          <span class="info-value">${metadata.regNumber || "N/A"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Parent Name:</span>
          <span class="info-value">${metadata.parentName || "N/A"}</span>
        </div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Receipt - ${pageTitle}</title>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #f5f5f5; padding: 40px 20px; }
        .receipt-container { max-width: 800px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #FDC020 0%, #1a5c40 100%); color: white; padding: 40px; text-align: center; }
        .header img { max-height: 60px; margin-bottom: 20px; }
        .header h1 { font-size: 32px; margin-bottom: 10px; }
        .success-badge { display: inline-block; padding: 8px 20px; background: #22c55e; border-radius: 30px; font-size: 14px; font-weight: bold; margin-top: 15px; }
        .content { padding: 40px; }
        .info-section { background: #f8fafc; padding: 20px; border-radius: 12px; border-left: 4px solid #FDC020; margin-bottom: 25px; }
        .info-section h3 { color: #FDC020; font-size: 16px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-weight: 600; color: #475569; }
        .info-value { color: #1e293b; text-align: right; }
        .amount-box { background: linear-gradient(135deg, #FDC020 0%, #1a5c40 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0; }
        .amount-box .label { font-size: 14px; opacity: 0.9; margin-bottom: 10px; }
        .amount-box .amount { font-size: 48px; font-weight: bold; }
        .installment-box { background: #e0f2fe; padding: 15px 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #0284c7; }
        .installment-box h4 { color: #0369a1; margin-bottom: 10px; }
        .note { background: #fef3c7; padding: 15px 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #f59e0b; font-size: 14px; color: #92400e; }
        .footer { background: #f8fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer img { max-height: 40px; margin-bottom: 15px; }
        .footer p { color: #64748b; font-size: 12px; margin: 5px 0; }
        @media print { body { background: white; padding: 0; } .receipt-container { box-shadow: none; border-radius: 0; } }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <img src="${headerImageUrl}" alt="Zidwell Logo" />
          <h1>PAYMENT RECEIPT</h1>
          <div class="success-badge">✓ PAYMENT SUCCESSFUL</div>
        </div>
        
        <div class="content">
          <div class="amount-box">
            <div class="label">AMOUNT PAID</div>
            <div class="amount">${formatCurrency(amount)}</div>
          </div>
          
          ${isInstallment ? `
          <div class="installment-box">
            <h4>📅 Installment Payment</h4>
            <div class="info-row">
              <span class="info-label">Installment:</span>
              <span class="info-value">${installmentNumber} of ${totalInstallments}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Amount:</span>
              <span class="info-value">${formatCurrency(metadata?.totalAmount || paymentRecord?.total_amount || amount * totalInstallments)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Remaining Balance:</span>
              <span class="info-value">${formatCurrency((metadata?.totalAmount || paymentRecord?.total_amount || amount * totalInstallments) - amount)}</span>
            </div>
          </div>
          ` : ''}
          
          <div class="info-section">
            <h3>💰 TRANSACTION DETAILS</h3>
            <div class="info-row">
              <span class="info-label">Transaction ID:</span>
              <span class="info-value">${transactionId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Method:</span>
              <span class="info-value">${paymentMethodText}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Date:</span>
              <span class="info-value">${formatDate(paidAt)}</span>
            </div>
          </div>
          
          <div class="info-section">
            <h3>📄 PAYMENT PAGE</h3>
            <div class="info-row">
              <span class="info-label">Page Title:</span>
              <span class="info-value">${pageTitle}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Reference:</span>
              <span class="info-value">${paymentRecord.order_reference || "N/A"}</span>
            </div>
          </div>
          
          <div class="info-section">
            <h3>👤 CUSTOMER INFORMATION</h3>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span class="info-value">${customerName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${customerEmail}</span>
            </div>
            ${paymentRecord.customer_phone ? `
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span class="info-value">${paymentRecord.customer_phone}</span>
            </div>
            ` : ''}
          </div>
          
          ${additionalInfo}
          
          <div class="note">
            <strong>Thank you for your payment!</strong> This is an official receipt for your transaction. 
            Please keep this for your records.
          </div>
        </div>
        
        <div class="footer">
          <img src="${footerImageUrl}" alt="Zidwell Footer" />
          <p>This is an official payment receipt from Zidwell.</p>
          <p>Generated on ${new Date().toLocaleString("en-NG")}</p>
          <p>© ${new Date().getFullYear()} Zidwell. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper function to generate PDF from API
async function generatePDFFromAPI(html: string): Promise<Buffer> {
  try {
    const response = await fetch(`${baseUrl}/api/generate-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html }),
    });

    if (!response.ok) {
      throw new Error(`PDF generation failed: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Error calling PDF generation API:", error);
    throw error;
  }
}

// Send payment page receipt with PDF attachment
export async function sendPaymentPageReceiptWithPDF(
  customerEmail: string,
  paymentPage: any,
  paymentRecord: any,
  customerName: string,
  amount: number,
  transactionId: string,
  paymentMethod: string,
  paidAt: string,
  metadata?: any,
): Promise<{ success: boolean }> {
  try {
    console.log("📧 Sending payment page receipt to:", customerEmail);
    console.log("📊 Receipt data:", { amount, transactionId, paymentMethod, metadata });

    // Generate PDF HTML
    const pdfHTML = generatePaymentPagePDFHTML(
      paymentPage,
      paymentRecord,
      customerName,
      customerEmail,
      amount,
      transactionId,
      paymentMethod,
      paidAt,
      metadata,
    );

    // Generate PDF
    const pdfBuffer = await generatePDFFromAPI(pdfHTML);

    const formatCurrency = (value: number): string => {
      return `₦${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const pageTitle = metadata?.pageTitle || paymentPage?.title || "Payment Page";
    const isInstallment = metadata?.isInstallment === true;
    const installmentNumber = metadata?.installmentNumber || 1;
    const totalInstallments = metadata?.totalInstallments || 1;

    let paymentMethodText = "Card Payment";
    if (paymentMethod === "bank_transfer" || metadata?.bank_transfer === true) {
      paymentMethodText = "Bank Transfer";
    }

    let installmentText = "";
    if (isInstallment) {
      installmentText = `<p style="margin-top: 10px;"><strong>Installment:</strong> ${installmentNumber} of ${totalInstallments}</p>`;
    }

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `${isInstallment ? `📅 Installment ${installmentNumber}/${totalInstallments} - ` : "✅ "}Payment Receipt - ${pageTitle} - ${formatCurrency(amount)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          
          <h3 style="color: #22c55e;">✅ Payment Successful!</h3>
          
          <p>Dear ${customerName},</p>
          
          <p>Thank you for your payment. Your transaction has been completed successfully.</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h4 style="margin: 0 0 15px 0; color: #FDC020;">Payment Details</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;"><strong>Page:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${pageTitle}</td>
              </tr>
              ${isInstallment ? `
              <tr>
                <td style="padding: 8px 0;"><strong>Installment:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${installmentNumber} of ${totalInstallments}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0;"><strong>Amount Paid:</strong></td>
                <td style="padding: 8px 0; text-align: right; color: #22c55e; font-size: 18px; font-weight: bold;">${formatCurrency(amount)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Payment Method:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${paymentMethodText}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Transaction ID:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${transactionId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Payment Date:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${new Date(paidAt).toLocaleString()}</td>
              </tr>
            </table>
          </div>
          
          <p>Please find attached your official receipt in PDF format.</p>
          
          ${installmentText}
          
          <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
          
          <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 20px;">
            This is an automated message from Zidwell. Please do not reply to this email.
          </p>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `payment_receipt_${transactionId.slice(-8)}${isInstallment ? `_installment_${installmentNumber}` : ''}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    console.log(`✅ Payment page receipt PDF sent to ${customerEmail}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send payment page receipt PDF:", error);
    
    // Fallback without PDF
    try {
      const formatCurrency = (value: number): string => {
        return `₦${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      };
      
      await transporter.sendMail({
        from: `Zidwell <${process.env.EMAIL_USER}>`,
        to: customerEmail,
        subject: `Payment Receipt - ${metadata?.pageTitle || paymentPage?.title || "Payment Page"}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
            <h3 style="color: #22c55e;">✅ Payment Successful!</h3>
            <p>Dear ${customerName},</p>
            <p>Thank you for your payment of ${formatCurrency(amount)}.</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
              <p><strong>Page:</strong> ${metadata?.pageTitle || paymentPage?.title || "Payment Page"}</p>
              ${metadata?.isInstallment ? `<p><strong>Installment:</strong> ${metadata.installmentNumber || 1} of ${metadata.totalInstallments || 1}</p>` : ''}
              <p><strong>Amount:</strong> ${formatCurrency(amount)}</p>
              <p><strong>Transaction ID:</strong> ${transactionId}</p>
            </div>
            <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
          </div>
        `,
      });
      console.log(`✅ Fallback receipt email sent to ${customerEmail}`);
    } catch (fallbackError) {
      console.error("Fallback email also failed:", fallbackError);
    }
    
    return { success: false };
  }
}

// Helper function for invoice receipt (kept for compatibility)
export async function sendTransactionReceiptWithPDF(
  payerEmail: string,
  payerName: string,
  invoice: any,
  paymentDetails: any,
): Promise<{ success: boolean }> {
  try {
    // Simple fallback for invoice receipts
    const formatCurrency = (value: number): string => {
      return `₦${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: payerEmail,
      subject: `🧾 Transaction Receipt - ${invoice.invoice_id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: #22c55e;">✅ Payment Successful!</h3>
          <p>Dear ${payerName},</p>
          <p>Thank you for your payment of ${formatCurrency(paymentDetails.amount)}.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p><strong>Invoice:</strong> ${invoice.invoice_id}</p>
            <p><strong>Amount:</strong> ${formatCurrency(paymentDetails.amount)}</p>
            <p><strong>Transaction ID:</strong> ${paymentDetails.transactionId}</p>
          </div>
          <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
        </div>
      `,
    });

    console.log(`✅ Transaction receipt sent to ${payerEmail}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send transaction receipt:", error);
    return { success: false };
  }
}