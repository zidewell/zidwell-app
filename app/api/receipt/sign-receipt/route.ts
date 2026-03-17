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

// SVG icons as strings
const svgIcons = {
  receipt: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  building: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  mail: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  phone: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  mapPin: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  creditCard: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  fileText: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
};

// Generate the Receipt HTML with new UI style
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

  // Parse items for template
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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #ffffff;
      color: #374151;
      line-height: 1.5;
      padding: 20px;
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
    
    .gold-gradient {
      background: linear-gradient(135deg, #2b825b 0%, #b38606 100%);
    }
    
    .gold-light-bg {
      background-color: rgba(194, 147, 7, 0.1);
    }
    
    .gold-border {
      border-color: #2b825b;
    }
    
    .gold-text {
      color: #2b825b;
    }
    
    .watermark {
      opacity: 0.1;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 120px;
      color: #2b825b;
      pointer-events: none;
      z-index: -1;
    }
  </style>
</head>
<body>
  <!-- Watermark -->
  <div class="watermark">ZIDWELL</div>
  
  <div class="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden max-w-4xl mx-auto mb-8">
    <!-- Header -->
    <div class="gold-gradient p-8 text-white">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
            <img src="${logo}" alt="Zidwell Logo" class="h-7 w-7" />
          </div>
          <div>
            <p class="text-sm opacity-90 uppercase tracking-wide">
              Receipt #${receipt.receipt_id}
            </p>
            <h1 class="text-2xl font-bold mt-1">
              ${receipt.business_name || receipt.initiator_name}
            </h1>
            <p class="text-sm opacity-90 mt-1">
              Issued on ${formattedIssueDate}
            </p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-sm opacity-90">Total Amount</p>
          <p class="text-3xl font-bold">
            ${formattedTotal}
          </p>
          <div class="mt-2 inline-block bg-white/20 px-3 py-1 rounded-full text-sm">
            Status: <span class="font-semibold">SIGNED</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="p-8 space-y-8">
      <!-- Business Details -->
      <div class="grid md:grid-cols-2 gap-8">
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 gold-light-bg rounded-lg flex items-center justify-center">
              ${svgIcons.building}
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">From</h3>
              <p class="text-gray-600">${receipt.business_name || receipt.initiator_name}</p>
              ${
                receipt.initiator_email
                  ? `
              <p class="text-sm text-gray-500 mt-1 flex items-center gap-2">
                ${svgIcons.mail}
                ${receipt.initiator_email}
              </p>
              `
                  : ""
              }
              ${
                receipt.initiator_phone
                  ? `
              <p class="text-sm text-gray-500 mt-1 flex items-center gap-2">
                ${svgIcons.phone}
                ${receipt.initiator_phone}
              </p>
              `
                  : ""
              }
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 gold-light-bg rounded-lg flex items-center justify-center">
              ${svgIcons.user}
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">To</h3>
              <p class="text-gray-600">${signeeName}</p>
              <div class="space-y-1 mt-1">
                ${
                  receipt.client_email
                    ? `
                <p class="text-sm text-gray-500 flex items-center gap-2">
                  ${svgIcons.mail}
                  ${receipt.client_email}
                </p>
                `
                    : ""
                }
                ${
                  receipt.client_phone
                    ? `
                <p class="text-sm text-gray-500 flex items-center gap-2">
                  ${svgIcons.phone}
                  ${receipt.client_phone}
                </p>
                `
                    : ""
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Billing Address -->
      ${
        receipt.bill_to
          ? `
      <div class="bg-gray-50 rounded-xl p-6">
        <div class="flex items-center gap-3 mb-4">
          ${svgIcons.mapPin}
          <h3 class="font-semibold text-gray-900">Billing Address</h3>
        </div>
        <p class="text-gray-700 whitespace-pre-line">${receipt.bill_to}</p>
      </div>
      `
          : ""
      }

      <!-- Items Table -->
      ${
        formattedItems.length > 0
          ? `
      <div class="border rounded-xl overflow-hidden">
        <div class="bg-gray-50 px-6 py-4 border-b">
          <h3 class="font-semibold text-gray-900">Items Details</h3>
        </div>
        <div class="divide-y">
          <!-- Header -->
          <div class="grid grid-cols-12 px-6 py-4 bg-gray-50/50 text-sm font-medium text-gray-600 border-b">
            <div class="col-span-6">Description</div>
            <div class="col-span-2 text-center">Quantity</div>
            <div class="col-span-2 text-right">Unit Price</div>
            <div class="col-span-2 text-right">Amount</div>
          </div>
          
          <!-- Items -->
          ${formattedItems
            .map(
              (item: any) => `
          <div class="grid grid-cols-12 px-6 py-4 hover:bg-gray-50/50 transition-colors">
            <div class="col-span-6">
              <p class="font-medium text-gray-900">${item.description}</p>
              <p class="text-sm text-gray-500 mt-1">Item #${item.index}</p>
            </div>
            <div class="col-span-2 text-center">
              <p class="text-gray-700">${item.quantity}</p>
            </div>
            <div class="col-span-2 text-right">
              <p class="text-gray-700">${formatCurrency(item.unit_price)}</p>
            </div>
            <div class="col-span-2 text-right">
              <p class="font-semibold text-gray-900">${formatCurrency(item.amount)}</p>
            </div>
          </div>
          `,
            )
            .join("")}
          
          <!-- Totals -->
          <div class="bg-gray-50 px-6 py-4">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-sm text-gray-600">Subtotal</p>
                <p class="text-2xl font-bold gold-text">${formattedTotal}</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-600">Total Amount</p>
                <p class="text-2xl font-bold gold-text">${formattedTotal}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      `
          : '<p class="text-gray-500 italic">No items listed</p>'
      }

      <!-- Payment & Notes -->
      <div class="grid md:grid-cols-2 gap-8">
        <div class="bg-gray-50 rounded-xl p-6">
          <div class="flex items-center gap-3 mb-4">
            ${svgIcons.creditCard}
            <h3 class="font-semibold text-gray-900">Payment Details</h3>
          </div>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-600">Payment Method:</span>
              <span class="font-medium capitalize">
                ${receipt.payment_method === "transfer" ? "Bank Transfer" : receipt.payment_method || "Not specified"}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Payment For:</span>
              <span class="font-medium capitalize">${receipt.payment_for || "General"}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Issue Date:</span>
              <span class="font-medium">${formattedIssueDate}</span>
            </div>
            ${
              receipt.verification_code
                ? `
            <div class="flex justify-between">
              <span class="text-gray-600">Verification Code:</span>
              <span class="font-medium font-mono">${receipt.verification_code}</span>
            </div>
            `
                : ""
            }
          </div>
        </div>

        <div class="bg-gray-50 rounded-xl p-6">
          <div class="flex items-center gap-3 mb-4">
            ${svgIcons.fileText}
            <h3 class="font-semibold text-gray-900">Notes</h3>
          </div>
          <p class="text-gray-700">
            ${receipt.customer_note || "No additional notes provided."}
          </p>
        </div>
      </div>

      <!-- Signatures -->
      <div class="border-t pt-8">
        <h3 class="font-semibold text-gray-900 mb-6 text-center">Signatures</h3>
        <div class="grid md:grid-cols-2 gap-8">
          <!-- Seller Signature -->
          <div class="space-y-4">
            <div class="text-center">
              <p class="font-medium text-gray-900 mb-2">Seller's Signature</p>
              <p class="text-sm text-gray-600">${receipt.business_name || receipt.initiator_name}</p>
            </div>
            <div class="h-32 border-2 border-dashed border-gray-300 rounded-lg bg-white flex items-center justify-center">
              ${
                hasSellerSignature
                  ? `
              <img src="${receipt.seller_signature}" alt="Seller signature" class="max-h-20" />
              `
                  : `
              <span class="text-gray-400">No signature provided</span>
              `
              }
            </div>
          </div>

          <!-- Client Signature -->
          <div class="space-y-4">
            <div class="text-center">
              <p class="font-medium text-gray-900 mb-2">Client's Signature</p>
              <p class="text-sm text-gray-600">${signeeName}</p>
            </div>
            <div class="h-32 border-2 border-dashed border-gray-300 rounded-lg bg-white flex items-center justify-center">
              ${
                hasClientSignature
                  ? `
              <img src="${signatureImage}" alt="Client signature" class="max-h-20" />
              `
                  : `
              <span class="text-gray-400">Signed</span>
              `
              }
            </div>
          </div>
        </div>
        
        <!-- Signature Dates -->
        <div class="grid md:grid-cols-2 gap-8 mt-6">
          <div class="text-center">
            <p class="text-sm text-gray-600">Issued Date</p>
            <p class="font-medium">${formattedIssueDate}</p>
          </div>
          <div class="text-center">
            <p class="text-sm text-gray-600">Signed Date</p>
            <p class="font-medium">${formattedCurrentDate}</p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t pt-8 text-center text-gray-500 text-sm">
        <p>This receipt was generated electronically by Zidwell Receipts</p>
        ${
          receipt.signing_link
            ? `
        <p class="mt-1">For verification, visit: <a href="${receipt.signing_link}" class="text-blue-600 hover:underline">${receipt.signing_link}</a></p>
        `
            : ""
        }
        <div class="mt-4 text-xs text-gray-400">
          <p>Receipt ID: ${receipt.receipt_id} | Generated on: ${formattedCurrentDate}</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// Generate PDF from HTML
async function generatePdfBufferFromHtml(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
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

    // Validation
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

    // Get receipt from database
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

    // Check if receipt is already signed
    if (receipt.status === "signed") {
      return NextResponse.json(
        { success: false, error: "Receipt already signed" },
        { status: 400 },
      );
    }

    // Verify code if receipt has one
    if (receipt.verification_code) {
      // console.log("Receipt requires verification. Code in DB:", receipt.verification_code);
      // console.log("Provided code:", verificationCode);

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

    // Update receipt with signature - REMOVED signee_email column
    const { data: updatedReceipt, error: updateError } = await supabase
      .from("receipts")
      .update({
        client_signature: signatureImage,
        signee_name: signeeName,
        // signee_email: signeeEmail || receipt.client_email, // REMOVED - column doesn't exist
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

    // Generate PDF receipt with signatures
    const logo = getLogoBase64();
    const htmlContent = generateReceiptHTML(
      updatedReceipt,
      logo,
      signeeName,
      signatureImage,
    );
    const pdfBuffer = await generatePdfBufferFromHtml(htmlContent);

    // Base URL for email images
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const headerImageUrl = `${baseUrl}/zidwell-header.png`;
    const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

    // Send confirmation emails with PDF attachment
    const emailPromises = [];

    // Send to client
    if (updatedReceipt.client_email) {
      const clientEmailPromise = transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: updatedReceipt.client_email,
        subject: `Receipt #${updatedReceipt.receipt_id} Signed Successfully`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Inter', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .content { padding: 40px; }
        .success-icon { color: #10b981; font-size: 48px; text-align: center; margin-bottom: 20px; }
        .receipt-details { background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .btn { background: linear-gradient(135deg, #2b825b 0%, #b38606 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <img src="${headerImageUrl}" alt="Zidwell Header" style="width: 100%;" />
        <div class="content">
            <div class="success-icon">✅</div>
            <h2 style="text-align: center; color: #111827; margin-bottom: 20px;">Receipt Successfully Signed!</h2>
            <p style="color: #4b5563; line-height: 1.6;">Hello ${signeeName},</p>
            <p style="color: #4b5563; line-height: 1.6;">You have successfully signed and acknowledged receipt #${updatedReceipt.receipt_id}.</p>
            
            <div class="receipt-details">
                <p style="margin: 10px 0;"><strong>Receipt ID:</strong> ${updatedReceipt.receipt_id}</p>
                <p style="margin: 10px 0;"><strong>From:</strong> ${updatedReceipt.business_name || updatedReceipt.initiator_name}</p>
                <p style="margin: 10px 0;"><strong>Amount:</strong> ${formatCurrency(updatedReceipt.total || 0)}</p>
                <p style="margin: 10px 0;"><strong>Signed Date:</strong> ${new Date(
                  now,
                ).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</p>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6; margin-top: 20px;">
                Your signed receipt has been recorded and a copy has been sent to ${updatedReceipt.initiator_email}. 
                You can find the signed PDF attached to this email.
            </p>
            
            <p style="color: #4b5563; line-height: 1.6; margin-top: 20px;">
                This is a legally binding acknowledgement of receipt. Please keep a copy for your records.
            </p>

            
            <p style="color: #4b5563; line-height: 1.6; margin-top: 30px;">
                Best regards,<br>
                <strong>The Zidwell Team</strong>
            </p>
        </div>
        <img src="${footerImageUrl}" alt="Zidwell Footer" style="width: 100%;" />
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

    // Send to business
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
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .content { padding: 40px; }
        .success-icon { color: #10b981; font-size: 48px; text-align: center; margin-bottom: 20px; }
        .receipt-details { background: #f0f9ff; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .btn { background: linear-gradient(135deg, #2b825b 0%, #b38606 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <img src="${headerImageUrl}" alt="Zidwell Header" style="width: 100%;" />
        <div class="content">
            <div class="success-icon">✅</div>
            <h2 style="text-align: center; color: #111827; margin-bottom: 20px;">Receipt Acknowledged!</h2>
            <p style="color: #4b5563; line-height: 1.6;">Good news! Your receipt has been signed and acknowledged by the client.</p>
            
            <div class="receipt-details">
                <p style="margin: 10px 0;"><strong>Receipt ID:</strong> ${updatedReceipt.receipt_id}</p>
                <p style="margin: 10px 0;"><strong>Client Name:</strong> ${signeeName}</p>
                <p style="margin: 10px 0;"><strong>Client Email:</strong> ${signeeEmail || updatedReceipt.client_email}</p>
                <p style="margin: 10px 0;"><strong>Amount:</strong> ${formatCurrency(updatedReceipt.total || 0)}</p>
                <p style="margin: 10px 0;"><strong>Signed Date:</strong> ${new Date(
                  now,
                ).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</p>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6; margin-top: 20px;">
                The client has acknowledged receipt of the items/services described in receipt #${updatedReceipt.receipt_id}.
                A signed PDF copy is attached to this email.
            </p>
            
            <p style="color: #4b5563; line-height: 1.6; margin-top: 20px;">
                This digital signature serves as legal acknowledgement of receipt.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
                <a href="#" class="btn">Download Receipt</a>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6; margin-top: 30px;">
                Best regards,<br>
                <strong>The Zidwell Team</strong>
            </p>
        </div>
        <img src="${footerImageUrl}" alt="Zidwell Footer" style="width: 100%;" />
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

    // Send all emails in parallel
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
