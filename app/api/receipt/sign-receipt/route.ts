import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { transporter } from "@/lib/node-mailer";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Convert logo to base64
function getLogoBase64() {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const imageBuffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${imageBuffer.toString("base64")}`;
  } catch (err) {
    console.error("Error loading logo:", err);
    return "";
  }
}

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Format date
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
};

// Generate the Receipt HTML with inline styles (no CSS variables)
function generateReceiptHTML(
  receipt: any,
  logo: string,
  signeeName: string,
  signatureImage: string,
) {
  const receiptItems =
    typeof receipt.receipt_items === "string"
      ? JSON.parse(receipt.receipt_items)
      : receipt.receipt_items || [];

  const total =
    receipt.total ||
    receiptItems.reduce((sum: number, item: any) => {
      return sum + (item.total || item.quantity * item.unit_price);
    }, 0) ||
    0;

  const formattedTotal = formatCurrency(total);
  const formattedIssueDate = formatDate(receipt.issue_date);
  const now = new Date();
  const formattedCurrentDate = now.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedItems = receiptItems.map((item: any, index: number) => ({
    description: item.description || item.item || "N/A",
    quantity: item.quantity,
    unit_price: item.unit_price || item.price || 0,
    amount: item.total || item.quantity * (item.unit_price || item.price || 0),
    index: index + 1,
  }));

  const hasSellerSignature =
    receipt.seller_signature &&
    receipt.seller_signature !== "null" &&
    receipt.seller_signature !== "";

  const hasClientSignature =
    signatureImage && signatureImage !== "null" && signatureImage !== "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Receipt - ${receipt.receipt_id}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      background-color: #F5F5F5;
      color: #191919;
      line-height: 1.5;
      padding: 40px 20px;
    }
    
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      @page {
        margin: 20mm;
      }
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 28px;
      overflow: hidden;
      box-shadow: 0 20px 35px -8px rgba(0, 0, 0, 0.15), 0 5px 12px -4px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      background: #FDC020;
      padding: 32px;
      color: #191919;
      position: relative;
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 24px;
    }
    
    .business-info h2 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
      font-family: 'Georgia', serif;
    }
    
    .business-info p {
      font-size: 14px;
      opacity: 0.8;
    }
    
    .invoice-title {
      text-align: right;
    }
    
    .invoice-title h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .invoice-title p {
      font-size: 14px;
      margin-bottom: 4px;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      background: #191919;
      color: #FDC020;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 8px;
    }
    
    .content {
      padding: 32px;
    }
    
    .parties-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid #E5E5E5;
    }
    
    .party-box h3 {
      font-size: 14px;
      font-weight: 600;
      color: #666666;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .party-box p {
      font-size: 14px;
      margin-bottom: 4px;
    }
    
    .party-box .name {
      font-weight: 600;
      color: #191919;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
    }
    
    .items-table th {
      background: #F5F5F5;
      padding: 14px 16px;
      text-align: left;
      font-size: 13px;
      font-weight: 600;
      color: #666666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #E5E5E5;
    }
    
    .items-table td {
      padding: 16px;
      font-size: 14px;
      border-bottom: 1px solid #E5E5E5;
    }
    
    .items-table tr:last-child td {
      border-bottom: none;
    }
    
    .totals-section {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #E5E5E5;
      text-align: right;
    }
    
    .totals-row {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 8px;
    }
    
    .totals-label {
      width: 150px;
      font-size: 14px;
      color: #666666;
    }
    
    .totals-value {
      width: 150px;
      font-size: 14px;
      font-weight: 500;
      text-align: right;
    }
    
    .grand-total {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 2px solid #E5E5E5;
    }
    
    .grand-total .totals-label {
      font-weight: 700;
      color: #191919;
      font-size: 16px;
    }
    
    .grand-total .totals-value {
      font-weight: 700;
      color: #FDC020;
      font-size: 20px;
    }
    
    .signature-section {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #E5E5E5;
    }
    
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 24px;
    }
    
    .signature-box {
      text-align: center;
    }
    
    .signature-box h4 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #666666;
    }
    
    .signature-image {
      background: #F5F5F5;
      border: 1px dashed #E5E5E5;
      border-radius: 16px;
      padding: 16px;
      min-height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .signature-image img {
      max-height: 80px;
      max-width: 100%;
      object-fit: contain;
    }
    
    .signature-date {
      font-size: 12px;
      color: #666666;
      margin-top: 8px;
    }
    
    .footer {
      background: #F5F5F5;
      padding: 20px 32px;
      text-align: center;
      font-size: 12px;
      color: #666666;
      border-top: 1px solid #E5E5E5;
    }
    
    .logo {
      max-height: 50px;
      margin-bottom: 16px;
    }
    
    @media (max-width: 640px) {
      .header-content {
        flex-direction: column;
        text-align: center;
      }
      .invoice-title {
        text-align: center;
      }
      .parties-section {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      .signature-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-content">
        <div class="business-info">
          ${logo ? `<img src="${logo}" alt="Zidwell Logo" class="logo" />` : ""}
          <h2>${receipt.business_name || receipt.initiator_name}</h2>
          <p>${receipt.initiator_email || ""}</p>
          ${receipt.initiator_phone ? `<p>${receipt.initiator_phone}</p>` : ""}
        </div>
        <div class="invoice-title">
          <h1>RECEIPT</h1>
          <p><strong>Receipt #:</strong> ${receipt.receipt_id}</p>
          <p><strong>Issue Date:</strong> ${formattedIssueDate}</p>
          <div><span class="status-badge">SIGNED</span></div>
        </div>
      </div>
    </div>
    
    <div class="content">
      <!-- Parties Section -->
      <div class="parties-section">
        <div class="party-box">
          <h3>From</h3>
          <p class="name">${receipt.business_name || receipt.initiator_name}</p>
          <p>${receipt.initiator_email || ""}</p>
          ${receipt.initiator_phone ? `<p>${receipt.initiator_phone}</p>` : ""}
        </div>
        <div class="party-box">
          <h3>To</h3>
          <p class="name">${signeeName}</p>
          <p>${receipt.client_email || ""}</p>
          ${receipt.client_phone ? `<p>${receipt.client_phone}</p>` : ""}
        </div>
      </div>
      
      <!-- Items Table -->
      ${formattedItems.length > 0 ? `
      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: center;">Quantity</th>
            <th style="text-align: right;">Unit Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${formattedItems.map((item: any) => `
            <tr>
              <td>${item.description}</td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right;">${formatCurrency(item.unit_price)}</td>
              <td style="text-align: right;">${formatCurrency(item.amount)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      ` : '<p style="text-align: center; color: #666666;">No items listed</p>'}
      
      <!-- Totals -->
      <div class="totals-section">
        <div class="totals-row">
          <span class="totals-label">Subtotal:</span>
          <span class="totals-value">${formattedTotal}</span>
        </div>
        <div class="totals-row grand-total">
          <span class="totals-label">Total Amount:</span>
          <span class="totals-value">${formattedTotal}</span>
        </div>
      </div>
      
      <!-- Signatures -->
      <div class="signature-section">
        <div class="signature-grid">
          <div class="signature-box">
            <h4>Seller's Signature</h4>
            <div class="signature-image">
              ${hasSellerSignature ? `<img src="${receipt.seller_signature}" alt="Seller signature" />` : '<span style="color: #999;">No signature</span>'}
            </div>
            <div class="signature-date">${receipt.business_name || receipt.initiator_name}</div>
          </div>
          <div class="signature-box">
            <h4>Client's Signature</h4>
            <div class="signature-image">
              ${hasClientSignature ? `<img src="${signatureImage}" alt="Client signature" />` : '<span style="color: #999;">No signature</span>'}
            </div>
            <div class="signature-date">${signeeName}</div>
          </div>
        </div>
        <div class="signature-grid" style="margin-top: 16px;">
          <div class="signature-box">
            <div class="signature-date">Issued: ${formattedIssueDate}</div>
          </div>
          <div class="signature-box">
            <div class="signature-date">Signed: ${formattedCurrentDate}</div>
          </div>
        </div>
      </div>
      
      <!-- Payment Details -->
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E5E5E5;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div>
            <p style="font-size: 12px; color: #666666; margin-bottom: 4px;">Payment Method</p>
            <p style="font-size: 14px;">${receipt.payment_method === "transfer" ? "Bank Transfer" : receipt.payment_method || "Not specified"}</p>
          </div>
          <div>
            <p style="font-size: 12px; color: #666666; margin-bottom: 4px;">Payment For</p>
            <p style="font-size: 14px;">${receipt.payment_for || "General"}</p>
          </div>
          ${receipt.verification_code ? `
          <div>
            <p style="font-size: 12px; color: #666666; margin-bottom: 4px;">Verification Code</p>
            <p style="font-size: 14px; font-family: monospace;">${receipt.verification_code}</p>
          </div>
          ` : ""}
        </div>
      </div>
      
      ${receipt.customer_note ? `
      <div style="margin-top: 24px; padding: 16px; background: #F5F5F5; border-radius: 16px;">
        <p style="font-size: 12px; color: #666666; margin-bottom: 8px;">Note to Customer</p>
        <p style="font-size: 14px;">${receipt.customer_note}</p>
      </div>
      ` : ""}
    </div>
    
    <div class="footer">
      <p>This receipt was generated electronically by Zidwell</p>
      <p style="margin-top: 8px; font-size: 10px;">
        For verification, please contact ${receipt.initiator_email || "support@zidwell.com"}
      </p>
      <p style="margin-top: 8px; font-size: 10px;">
        Receipt ID: ${receipt.receipt_id} | Generated: ${formattedCurrentDate}
      </p>
    </div>
  </div>
</body>
</html>`;
}

async function generatePdfBufferFromHtml(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
  const page = await browser.newPage();
  
  // Set viewport to ensure proper rendering
  await page.setViewport({ width: 1200, height: 800 });
  
  await page.setContent(html, { 
    waitUntil: "networkidle0",
    timeout: 30000 
  });
  
  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "20px",
      right: "20px",
      bottom: "20px",
      left: "20px",
    },
  });
  
  await browser.close();
  return Buffer.from(pdf);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      receiptToken,
      signeeName,
      signeeEmail,
      signatureImage,
      verificationCode,
    } = body;

    console.log("Sign request received:", {
      receiptToken,
      signeeName,
      hasSignature: !!signatureImage,
      verificationCode,
    });

    const missingFields = [];
    if (!receiptToken) missingFields.push("receiptToken");
    if (!signeeName) missingFields.push("signeeName");
    if (!signatureImage) missingFields.push("signatureImage");

    if (missingFields.length > 0) {
      console.error("Missing fields:", missingFields);
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .select("*")
      .eq("token", receiptToken)
      .single();

    if (receiptError || !receipt) {
      console.error("Receipt not found:", receiptError);
      return NextResponse.json(
        { success: false, error: "Receipt not found" },
        { status: 404 },
      );
    }

    if (receipt.status === "signed") {
      return NextResponse.json(
        { success: false, error: "Receipt already signed" },
        { status: 400 },
      );
    }

    if (receipt.verification_code) {
      if (!verificationCode) {
        return NextResponse.json(
          { success: false, error: "Verification code is required" },
          { status: 401 },
        );
      }

      if (receipt.verification_code !== verificationCode) {
        return NextResponse.json(
          { success: false, error: "Invalid verification code" },
          { status: 401 },
        );
      }
    }

    const now = new Date().toISOString();

    const { data: updatedReceipt, error: updateError } = await supabase
      .from("receipts")
      .update({
        client_signature: signatureImage,
        signee_name: signeeName,
        status: "signed",
        signed_at: now,
        updated_at: now,
      })
      .eq("token", receiptToken)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      throw updateError;
    }

    console.log("Receipt updated successfully");

    const logo = getLogoBase64();
    const htmlContent = generateReceiptHTML(
      updatedReceipt,
      logo,
      signeeName,
      signatureImage,
    );
    const pdfBuffer = await generatePdfBufferFromHtml(htmlContent);

    // Send emails with PDF attachment
    const emailPromises = [];

    if (updatedReceipt.client_email || signeeEmail) {
      const clientEmailPromise = transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: signeeEmail || updatedReceipt.client_email,
        subject: `Receipt #${updatedReceipt.receipt_id} Signed Successfully`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Inter', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 28px; overflow: hidden; border: 1px solid #E5E5E5; }
        .header { background: #FDC020; padding: 24px; text-align: center; }
        .content { padding: 32px; }
        .btn { background: #FDC020; color: #191919; padding: 12px 24px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; }
        .receipt-details { background: #F5F5F5; padding: 20px; border-radius: 16px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #191919; margin: 0;">Zidwell Receipt</h1>
        </div>
        <div class="content">
            <h2 style="color: #191919; margin-bottom: 20px;">Receipt Successfully Signed!</h2>
            <p>Hello ${signeeName},</p>
            <p>You have successfully signed and acknowledged receipt #${updatedReceipt.receipt_id}.</p>
            
            <div class="receipt-details">
                <p><strong>Receipt ID:</strong> ${updatedReceipt.receipt_id}</p>
                <p><strong>From:</strong> ${updatedReceipt.business_name || updatedReceipt.initiator_name}</p>
                <p><strong>Amount:</strong> ${formatCurrency(updatedReceipt.total || 0)}</p>
                <p><strong>Signed Date:</strong> ${new Date(now).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</p>
            </div>
            
            <p>A signed PDF copy of this receipt is attached to this email.</p>
            
            <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>The Zidwell Team</strong>
            </p>
        </div>
    </div>
</body>
</html>
        `,
        attachments: [
          {
            filename: `receipt_${updatedReceipt.receipt_id}_signed.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });
      emailPromises.push(clientEmailPromise);
    }

    if (updatedReceipt.initiator_email) {
      const businessEmailPromise = transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: updatedReceipt.initiator_email,
        subject: `Receipt #${updatedReceipt.receipt_id} Signed by ${signeeName}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Inter', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 28px; overflow: hidden; border: 1px solid #E5E5E5; }
        .header { background: #FDC020; padding: 24px; text-align: center; }
        .content { padding: 32px; }
        .receipt-details { background: #F5F5F5; padding: 20px; border-radius: 16px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #191919; margin: 0;">Zidwell Receipt</h1>
        </div>
        <div class="content">
            <h2 style="color: #191919; margin-bottom: 20px;">Receipt Acknowledged!</h2>
            <p>Good news! Your receipt has been signed and acknowledged by the client.</p>
            
            <div class="receipt-details">
                <p><strong>Receipt ID:</strong> ${updatedReceipt.receipt_id}</p>
                <p><strong>Client Name:</strong> ${signeeName}</p>
                <p><strong>Client Email:</strong> ${signeeEmail || updatedReceipt.client_email}</p>
                <p><strong>Amount:</strong> ${formatCurrency(updatedReceipt.total || 0)}</p>
                <p><strong>Signed Date:</strong> ${new Date(now).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</p>
            </div>
            
            <p>A signed PDF copy of this receipt is attached to this email.</p>
            
            <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>The Zidwell Team</strong>
            </p>
        </div>
    </div>
</body>
</html>
        `,
        attachments: [
          {
            filename: `receipt_${updatedReceipt.receipt_id}_client_signed.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });
      emailPromises.push(businessEmailPromise);
    }

    await Promise.all(emailPromises);

    return NextResponse.json({
      success: true,
      message: "Receipt signed successfully",
      receipt: updatedReceipt,
      pdfGenerated: true,
    });
  } catch (error: any) {
    console.error("Error signing receipt:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}