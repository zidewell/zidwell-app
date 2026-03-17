// app/api/sign-contract/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { transporter } from "@/lib/node-mailer";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL
    : process.env.NEXT_PUBLIC_BASE_URL;

function generateContractHTML(
  contract: any,
  signeeName: string,
  signeeSignatureImage: string,
  creatorSignatureImage?: string,
): string {
  const formatDate = (dateString: string) => {
    if (!dateString) return "Date not specified";

    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleDateString("en-US", { month: "long" });
      const year = date.getFullYear();

      // Add ordinal suffix
      const getOrdinalSuffix = (n: number) => {
        if (n > 3 && n < 21) return "th";
        switch (n % 10) {
          case 1:
            return "st";
          case 2:
            return "nd";
          case 3:
            return "rd";
          default:
            return "th";
        }
      };

      return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
    } catch (e) {
      return dateString;
    }
  };

  // Get contract date from metadata or created_at
  const getContractDate = () => {
    let metadataObj = contract.metadata;

    if (typeof contract.metadata === "string") {
      try {
        metadataObj = JSON.parse(contract.metadata);
      } catch (e) {
        console.error("Failed to parse metadata:", e);
        return formatDate(contract.created_at);
      }
    }

    // Check for contract_date in metadata first, then fall back
    return metadataObj?.contract_date
      ? formatDate(metadataObj.contract_date)
      : formatDate(contract.created_at);
  };

  const contractDate = getContractDate();
  const signedDate = contract.signed_at
    ? formatDate(contract.signed_at)
    : contractDate;

  // Get payment terms from metadata
  const getPaymentTerms = () => {
    if (!contract.metadata) return null;

    let metadataObj = contract.metadata;
    if (typeof contract.metadata === "string") {
      try {
        metadataObj = JSON.parse(contract.metadata);
      } catch (e) {
        console.error("Failed to parse metadata:", e);
        return null;
      }
    }

    return metadataObj?.payment_terms || null;
  };

  const paymentTerms = getPaymentTerms();

  // Get parties from contract data
  const partyA = contract.initiator_name || "Contract Creator";
  const partyB = signeeName || contract.signee_name || "Signee";

  // Generate signature cells
  const partyASignatureHTML = creatorSignatureImage
    ? `<img src="${creatorSignatureImage}" alt="Signature of ${partyA}" style="height: 40px; object-fit: contain; max-width: 180px;">`
    : `<span style="color: #9ca3af; font-size: 14px;">Signature</span>`;

  const partyBSignatureHTML = signeeSignatureImage
    ? `<img src="${signeeSignatureImage}" alt="Signature of ${partyB}" style="height: 40px; object-fit: contain; max-width: 180px;">`
    : `<span style="color: #9ca3af; font-size: 14px;">Signature</span>`;

  // Check if contract has lawyer signature
  const hasLawyerSignature =
    contract.include_lawyer_signature ||
    (typeof contract.metadata === "object" &&
      contract.metadata?.lawyer_signature) ||
    (typeof contract.metadata === "string" &&
      JSON.parse(contract.metadata || "{}")?.lawyer_signature);

  // Parse terms from contract_text (which now contains HTML from Quill)
  const parseTerms = () => {
    if (!contract.contract_text) return null;

    // Since we're storing HTML from Quill, return it directly
    const content = contract.contract_text;

    // Optional: Add some basic sanitization or adjustments
    // Ensure all images use https for email/PDF compatibility
    const sanitizedContent = content.replace(
      /src="http:\/\//gi,
      'src="https://',
    );

    return sanitizedContent;
  };

  const contractContent = parseTerms();

  // Ensure headers have proper spacing for PDF generation
  const styledContractContent = contractContent
    ? contractContent
        .replace(
          /<h1[^>]*>/g,
          '<h1 style="page-break-after: avoid; margin-top: 30px; margin-bottom: 20px; font-size: 24px; font-weight: bold; color: #111827;">',
        )
        .replace(
          /<h2[^>]*>/g,
          '<h2 style="page-break-after: avoid; margin-top: 25px; margin-bottom: 15px; font-size: 20px; font-weight: bold; color: #111827;">',
        )
        .replace(
          /<h3[^>]*>/g,
          '<h3 style="page-break-after: avoid; margin-top: 20px; margin-bottom: 10px; font-size: 18px; font-weight: bold; color: #111827;">',
        )
        .replace(
          /<p[^>]*>/g,
          '<p style="margin: 10px 0; line-height: 1.6; color: #4b5563;">',
        )
        .replace(
          /<ul[^>]*>/g,
          '<ul style="margin: 15px 0; padding-left: 30px;">',
        )
        .replace(
          /<ol[^>]*>/g,
          '<ol style="margin: 15px 0; padding-left: 30px;">',
        )
        .replace(/<li[^>]*>/g, '<li style="margin: 8px 0; line-height: 1.5;">')
        .replace(/<strong[^>]*>/g, '<strong style="font-weight: bold;">')
        .replace(/<em[^>]*>/g, '<em style="font-style: italic;">')
        .replace(/<u[^>]*>/g, '<u style="text-decoration: underline;">')
    : "No contract terms specified.";

  const headerImageUrl = `${baseUrl}/zidwell-header.png`;
  const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${contract.contract_title || "Service Contract"}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            color: #333;
            background: #ffffff;
            max-width: 100%;
            min-height: 100vh;
        }
        
        /* Header Image */
        .header-image {
            width: 100%;
            max-width: 800px;
            margin: 0 auto 20px;
        }
        
        /* Footer Image */
        .footer-image {
            width: 100%;
            max-width: 800px;
            margin: 20px auto 0;
        }
        
        /* Header */
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .contract-title {
            color: #2b825b;
            background-color: #073b2a;
            font-size: 24px;
            font-weight: bold;
            padding: 8px 0;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .contract-intro {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 20px;
        }
        
        /* Party Information */
        .party-info {
            margin-bottom: 30px;
        }
        
        .party-row {
            display: flex;
            align-items: flex-start;
            margin-bottom: 12px;
        }
        
        .party-label {
            font-weight: bold;
            min-width: 80px;
            color: #111827;
        }
        
        .party-value {
            margin-left: 16px;
            position: relative;
            padding-left: 16px;
        }
        
        .party-value::before {
            content: '';
            position: absolute;
            left: 0;
            top: 10px;
            width: 8px;
            height: 2px;
            background-color: black;
        }
        
        /* Section Divider */
        .section-divider {
            display: flex;
            align-items: center;
            gap: 16px;
            margin: 32px 0;
        }
        
        .divider-line {
            flex: 1;
            height: 1px;
            background-color: #2b825b;
            border-radius: 2px;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: bold;
            text-align: center;
            white-space: nowrap;
            color: #111827;
        }
        
        /* Terms Section */
        .terms-section {
            margin-bottom: 40px;
        }
        
        .term-content {
            font-size: 14px;
            line-height: 1.7;
            color: #4b5563;
            text-align: justify;
        }
        
        /* Quill-specific styles for PDF */
        .term-content h1 {
            font-size: 24px;
            font-weight: bold;
            margin: 30px 0 20px 0;
            color: #111827;
            page-break-after: avoid;
        }
        
        .term-content h2 {
            font-size: 20px;
            font-weight: bold;
            margin: 25px 0 15px 0;
            color: #111827;
            page-break-after: avoid;
        }
        
        .term-content h3 {
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0 10px 0;
            color: #111827;
            page-break-after: avoid;
        }
        
        .term-content p {
            margin: 10px 0;
            line-height: 1.6;
            color: #4b5563;
        }
        
        .term-content ul, 
        .term-content ol {
            margin: 15px 0;
            padding-left: 30px;
        }
        
        .term-content li {
            margin: 8px 0;
            line-height: 1.5;
        }
        
        .term-content strong {
            font-weight: bold;
        }
        
        .term-content em {
            font-style: italic;
        }
        
        .term-content u {
            text-decoration: underline;
        }
        
        .term-content blockquote {
            border-left: 4px solid #e5e7eb;
            margin: 20px 0;
            padding-left: 20px;
            color: #6b7280;
            font-style: italic;
        }
        
        /* Payment Terms Section */
        .payment-terms-section {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        
        .payment-term-content {
            font-size: 14px;
            line-height: 1.7;
            color: #4b5563;
            text-align: justify;
        }
        
        /* Signature Section */
        .signatures-section {
            margin-top: 40px;
            padding-top: 32px;
            border-top: 1px solid #e5e7eb;
            page-break-inside: avoid;
        }
        
        .signatures-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0 auto;
        }
        
        .signatures-table th {
            padding: 12px 16px;
            font-weight: bold;
            text-align: center;
            background-color: #f3f4f6;
            color: #111827;
            border: 1px solid #e5e7eb;
        }
        
        .signatures-table td {
            padding: 24px 16px;
            text-align: center;
            vertical-align: top;
            border: 1px solid #e5e7eb;
        }
        
        .signature-cell {
            min-height: 120px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
        }
        
        .signature-name {
            font-weight: bold;
            margin-bottom: 12px;
            color: #111827;
        }
        
        .signature-line {
            width: 180px;
            height: 45px;
            border-bottom: 2px dotted black;
            overflow: hidden;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        /* Lawyer Signature Styles */
        .lawyer-signature {
            margin-top: 30px;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            page-break-inside: avoid;
        }
        
        .lawyer-header {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
        }
        
        .lawyer-check {
            width: 24px;
            height: 24px;
            background-color: #2b825b;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
        }
        
        .lawyer-check span {
            color: white;
            font-size: 12px;
            font-weight: bold;
        }
        
        .lawyer-title {
            font-size: 14px;
            font-weight: 600;
            color: #2b825b;
        }
        
        .lawyer-signature-line {
            height: 80px;
            border-bottom: 2px solid #d1d5db;
            margin-bottom: 16px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
        }
        
        .lawyer-name {
            font-size: 18px;
            font-style: italic;
            color: #4b5563;
            font-family: 'Georgia', serif;
        }
        
        .lawyer-details {
            text-align: center;
        }
        
        .lawyer-full-name {
            font-weight: 600;
            font-size: 16px;
            color: #111827;
            margin-bottom: 4px;
        }
        
        .lawyer-role {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 8px;
        }
        
        .lawyer-badge {
            display: inline-block;
            padding: 4px 12px;
            background-color: rgba(194, 147, 7, 0.1);
            color: #2b825b;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 500;
        }
        
        /* Footer */
        .contract-footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
            line-height: 1.5;
        }
        
        /* Status Badge */
        .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 8px;
        }
        
        .status-signed {
            background-color: #f0fff4;
            color: #2f855a;
        }
        
        .status-pending {
            background-color: #fff7ed;
            color: #c2410c;
        }
        
        /* Print-specific styles */
        @media print {
            body {
                padding: 10mm 10mm !important;
                margin: 0 !important;
                font-size: 12pt;
                line-height: 1.5;
            }
            
            /* Header and Footer Images for Print */
            .header-image {
                max-width: 100% !important;
                margin-bottom: 15px !important;
            }
            
            .footer-image {
                max-width: 100% !important;
                margin-top: 15px !important;
            }
            
            /* Allow natural page breaks */
            .terms-section {
                page-break-inside: auto;
                margin-bottom: 20px;
            }
            
            .term-content {
                page-break-inside: auto;
                orphans: 3;
                widows: 3;
                margin-bottom: 8px;
                line-height: 1.6;
                font-size: 11pt;
            }
            
            .term-content h1 {
                font-size: 20px !important;
                margin: 20px 0 15px 0 !important;
                page-break-after: avoid !important;
            }
            
            .term-content h2 {
                font-size: 18px !important;
                margin: 18px 0 12px 0 !important;
                page-break-after: avoid !important;
            }
            
            .term-content h3 {
                font-size: 16px !important;
                margin: 15px 0 10px 0 !important;
                page-break-after: avoid !important;
            }
            
            .payment-terms-section {
                page-break-inside: avoid;
                margin-bottom: 20px;
            }
            
            /* Keep signature section together */
            .signatures-section {
                page-break-inside: avoid;
                margin-top: 20px;
                padding-top: 20px;
            }
            
            /* Compact signatures for print */
            .signature-cell {
                min-height: 80px !important;
                padding: 4px 0 !important;
            }
            
            .signature-line {
                width: 160px !important;
                height: 35px !important;
                margin-bottom: 8px !important;
            }
            
            .signature-name {
                margin-bottom: 8px !important;
                font-size: 12px !important;
            }
            
            .signatures-table td {
                padding: 12px 8px !important;
            }
            
            /* Reduce spacing for print */
            .header {
                margin-bottom: 20px;
            }
            
            .contract-title {
                font-size: 18px;
                padding: 6px 0;
                margin-bottom: 12px;
            }
            
            .contract-intro {
                font-size: 12px;
                margin-bottom: 20px;
            }
            
            .section-divider {
                margin: 20px 0;
            }
            
            .section-title {
                font-size: 16px;
            }
            
            /* Prevent orphaned headers */
            h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid;
            }
            
            /* Footer adjustments */
            .contract-footer {
                margin-top: 20px;
                padding-top: 16px;
                font-size: 9px;
                page-break-before: avoid;
            }
            
            /* Lawyer signature compact */
            .lawyer-signature {
                margin-top: 20px;
                padding: 12px;
            }
            
            .lawyer-signature-line {
                height: 60px;
            }
            
            .lawyer-full-name {
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <!-- Header Image -->
    <div style="text-align: center;">
        <img src="${headerImageUrl}" alt="Zidwell Header" class="header-image" />
    </div>
    
    <div class="content-flow">
        <!-- Header -->
        <div class="header">
            <div class="contract-title">${
              contract.contract_title || "Service Contract"
            }</div>
            <p class="contract-intro">
                This is a service agreement entered into between:
            </p>
            
            <!-- Party Information -->
            <div class="party-info">
                <div class="party-row">
                    <span class="party-label">PARTY A:</span>
                    <span class="party-value">${partyA}</span>
                </div>
                <div class="party-row">
                    <span class="party-label">PARTY B:</span>
                    <span class="party-value">${partyB}</span>
                </div>
                <div class="party-row">
                    <span class="party-label">DATE:</span>
                    <span class="party-value">${contractDate}</span>
                </div>
            </div>
        </div>
        
        <!-- Terms Section -->
        <div class="section-divider">
            <div class="divider-line"></div>
            <div class="section-title">THE TERMS OF AGREEMENT ARE AS FOLLOWS</div>
            <div class="divider-line"></div>
        </div>
        
        <div class="terms-section">
            <div class="term-content">
                ${styledContractContent}
            </div>
        </div>
        
        <!-- PAYMENT TERMS Section -->
        ${
          paymentTerms
            ? `
        <div class="payment-terms-section">
            <div class="section-divider">
                <div class="divider-line"></div>
                <div class="section-title">PAYMENT TERMS</div>
                <div class="divider-line"></div>
            </div>
            
            <div class="terms-section">
                <div class="payment-term-content">
                    ${paymentTerms}
                </div>
            </div>
        </div>
        `
            : ""
        }
        
        <!-- Signature Section -->
        <div class="signatures-section">
            <div class="section-divider">
                <div class="divider-line"></div>
                <div class="section-title">SIGNATURES</div>
                <div class="divider-line"></div>
            </div>
            
            <table class="signatures-table">
                <thead>
                    <tr>
                        <th>PARTY A</th>
                        ${hasLawyerSignature ? "<th>LEGAL WITNESS</th>" : ""}
                        <th>PARTY B</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <!-- Party A Signature -->
                        <td>
                            <div class="signature-cell">
                                <div class="signature-name">${partyA}</div>
                                <div class="signature-line">
                                    ${partyASignatureHTML}
                                </div>
                            </div>
                        </td>
                        
                        <!-- Lawyer Witness Signature -->
                        ${
                          hasLawyerSignature
                            ? `
                        <td>
                            <div class="signature-cell">
                                <div class="signature-name">Barr. Adewale Johnson</div>
                                <div class="signature-line">
                                    <span style="color: #6b7280; font-style: italic; font-family: Georgia, serif; font-size: 16px;">
                                        Barr. Adewale Johnson
                                    </span>
                                </div>
                                <div style="margin-top: 8px;">
                                    <span style="font-size: 12px; color: #6b7280;">Legal Counsel</span>
                                </div>
                                <div style="margin-top: 4px;">
                                    <span style="font-size: 11px; padding: 2px 8px; background-color: rgba(194, 147, 7, 0.1); color: #2b825b; border-radius: 12px;">
                                        Verified Lawyer
                                    </span>
                                </div>
                            </div>
                        </td>
                        `
                            : ""
                        }
                        
                        <!-- Party B Signature -->
                        <td>
                            <div class="signature-cell">
                                <div class="signature-name">${partyB}</div>
                                <div class="signature-line">
                                    ${partyBSignatureHTML}
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            
            ${
              hasLawyerSignature
                ? `
            <!-- Lawyer Signature Details -->
            <div class="lawyer-signature">
                <div class="lawyer-header">
                    <div class="lawyer-check">
                        <span>✓</span>
                    </div>
                    <p class="lawyer-title">LEGAL WITNESS SIGNATURE</p>
                </div>
                
                <div class="lawyer-signature-line">
                    <div class="lawyer-name">Barr. Adewale Johnson</div>
                </div>
                
                <div class="lawyer-details">
                    <p class="lawyer-full-name">Barr. Adewale Johnson</p>
                    <p class="lawyer-role">Legal Counsel</p>
                    <span class="lawyer-badge">Verified Lawyer</span>
                </div>
            </div>
            `
                : ""
            }
        </div>
        
        <!-- Footer -->
        <div class="contract-footer">
            THIS CONTRACT WAS CREATED AND SIGNED ON zidwell.com
            <br />
            Contract ID: ${contract.token.substring(0, 8).toUpperCase()}
            ${
              hasLawyerSignature
                ? "<br />⚖️ Includes Verified Legal Witness Signature"
                : ""
            }
            ${
              contract.verification_status === "verified"
                ? "<br />✓ Identity Verified"
                : contract.verification_status === "pending"
                  ? "<br />⚠ Identity Verification Pending"
                  : "<br />⛔ Identity Not Verified"
            }
            <br />
            Generated on: ${new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
        </div>
    </div>
    
    <!-- Footer Image -->
    <div style="text-align: center; margin-top: 40px;">
        <img src="${footerImageUrl}" alt="Zidwell Footer" class="footer-image" />
    </div>
</body>
</html>`;
}
async function generatePdfBuffer(
  contract: any,
  signeeName: string,
  signeeSignatureImage: string,
  creatorSignatureImage?: string,
): Promise<Buffer> {
  let browser = null;

  try {
    let executablePath: string;
    let browserArgs: string[];

    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      executablePath = await chromium.executablePath();
      browserArgs = [
        ...chromium.args,
        "--hide-scrollbars",
        "--disable-web-security",
        "--disable-dev-shm-usage",
      ];
    } else {
      executablePath =
        process.env.CHROME_PATH ||
        (process.platform === "win32"
          ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
          : process.platform === "darwin"
            ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
            : "/usr/bin/google-chrome");

      browserArgs = [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
      ];
    }

    browser = await puppeteer.launch({
      executablePath,
      args: browserArgs,
      headless: true,
    });

    const page = await browser.newPage();
    const htmlContent = generateContractHTML(
      contract,
      signeeName,
      signeeSignatureImage,
      creatorSignatureImage,
    );

    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Wait for images to load
    await page.evaluate(async () => {
      const selectors = Array.from(document.querySelectorAll("img"));
      await Promise.all(
        selectors.map((img) => {
          if (img.complete) return;
          return new Promise((resolve, reject) => {
            img.addEventListener("load", resolve);
            img.addEventListener("error", reject);
          });
        }),
      );
    });

    // Calculate content height
    const contentHeight = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      return Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight,
      );
    });

    // A4 dimensions in pixels (approx)
    const A4_HEIGHT_PX = 1122; // 297mm * 3.78px/mm
    const A4_WIDTH_PX = 793; // 210mm * 3.78px/mm

    // Adjust scale based on content height
    let scale = 1;
    if (contentHeight > A4_HEIGHT_PX * 2) {
      scale = 0.9; // Scale down for very long content
    }

    // Generate PDF with the exact same settings
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
      preferCSSPageSize: true,
      scale: scale,
    });

    return Buffer.from(pdf);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("PDF generation failed: " + (error as Error).message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function POST(request: Request) {
  try {
    const { contractToken, signeeName, signeeEmail, signatureImage } =
      await request.json();

    if (!contractToken || !signeeEmail || !signeeName || !signatureImage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get contract from Supabase
    const { data: contract, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("token", contractToken)
      .single();

    if (error || !contract) {
      console.error("Contract not found:", error);
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 },
      );
    }

    if (contract.signee_email !== signeeEmail) {
      return NextResponse.json(
        { error: "Email does not match the contract signee" },
        { status: 403 },
      );
    }

    // Check if verification is required and completed
    if (contract.verification_status !== "verified") {
      return NextResponse.json(
        { error: "Identity verification required before signing" },
        { status: 403 },
      );
    }

    // Get creator's signature if available
    let creatorSignatureImage = contract.creator_signature || null;

    // If no creator signature, use a default placeholder or fetch from another source
    if (!creatorSignatureImage) {
      // You might want to fetch the creator's signature from a user profile table
      const { data: creatorData } = await supabase
        .from("users") // Assuming you have a users table
        .select("signature")
        .eq("email", contract.initiator_email)
        .single();

      creatorSignatureImage = creatorData?.signature || null;
    }

    // Update contract with signature and mark as signed
    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        signee_name: signeeName,
        status: "signed",
        signed_at: new Date().toISOString(),
        signee_signature_image: signatureImage, // Store the signee's signature
        signature_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("token", contractToken);

    if (updateError) {
      console.error("Error updating contract:", updateError);
      return NextResponse.json(
        { error: "Failed to update contract status" },
        { status: 500 },
      );
    }

    // Generate PDF with BOTH signatures
    const pdfBuffer = await generatePdfBuffer(
      contract,
      signeeName,
      signatureImage,
      creatorSignatureImage,
    );

    // Determine file type
    const isPdf = pdfBuffer.toString("utf8", 0, 4) === "%PDF";
    const fileExtension = isPdf ? "pdf" : "html";
    const fileName = `signed-contract-${
      contract.contract_title
        ? contract.contract_title.replace(/[^a-z0-9]/gi, "-").toLowerCase()
        : "contract"
    }-${new Date().getTime()}.${fileExtension}`;

    // Send email with attached PDF
    await transporter.sendMail({
      from: `Zidwell Contracts <${process.env.EMAIL_USER}>`,
      to: `${contract.initiator_email}, ${signeeEmail}`,
      subject: `✓ Contract Signed: ${
        contract.contract_title || "Contract Agreement"
      }`,
      html: `
       
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contract Signed - Zidwell Finance</title>
    
    <!-- Fonts & Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
        /* Base Styles */
        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', Arial, sans-serif;
            background-color: #f9fafb;
            color: #374151;
            line-height: 1.6;
        }
        
        .email-container {
          
            margin: 0 auto;
            background: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            border-radius: 0 0 12px 12px;
            overflow: hidden;
        }
        
        .content-section {
            padding: 20px;
        }
        
        .info-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .grid-2-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .highlight-box {
            background: linear-gradient(135deg, rgba(194, 147, 7, 0.05), rgba(194, 147, 7, 0.02));
            border-left: 4px solid #2b825b;
            padding: 16px 20px;
            margin: 20px 0;
        }
        
        .success-badge {
            display: inline-flex;
            align-items: center;
            background: #f0fff4;
            color: #2f855a;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 10px;
        }
        
        /* Typography */
        .text-primary { color: #111827; }
        .text-secondary { color: #6b7280; }
        .text-accent { color: #2b825b; }
        .text-success { color: #2f855a; }
        
        .text-sm { font-size: 14px; }
        .text-base { font-size: 16px; }
        .text-lg { font-size: 20px; }
        .text-xl { font-size: 24px; }
        
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }
        
      
        
        .brand-logo {
            color: #c9a227;
            font-size: 36px;
            letter-spacing: 2px;
            margin: 0;
            font-weight: 700;
        }
        
     
      
        
       
        
        /* Mobile Responsive */
        @media (max-width: 600px) {
            .content-section {
                padding: 30px 20px;
            }
            
            .grid-2-col {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            
         
         
        }
    </style>
</head>
<body>
  
    <div class="email-container">
      
        <!-- Content -->
        <div class="content-section">
            <!-- Status Header -->
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="display: inline-block; background: #f0fff4; padding: 10px 30px; border-radius: 12px; border: 2px solid #38a169;">
                    <div style="font-size: 48px; color: #38a169; margin-bottom: 15px;">✓</div>
                    <div class="text-xl font-bold text-success">Contract Successfully Signed</div>
                    <p class="text-secondary" style="margin-top: 10px;">Digital signatures verified and secured</p>
                </div>
            </div>

            <!-- Contract Information -->
            <div class="info-card">
                <h2 class="text-lg font-bold text-primary" style="margin: 0 0 15px 0;">
                    ${contract.contract_title || "Service Contract"}
                </h2>
                <p class="text-base text-secondary" style="margin: 0;">
                    This agreement has been officially executed and is now legally binding for all parties involved.
                </p>
            </div>

            <!-- Parties Information -->
            <div class="grid-2-col">
                <div class="info-card">
                    <div class="text-sm text-accent font-semibold" style="margin-bottom: 8px;">CONTRACT CREATOR</div>
                    <div class="text-base font-bold text-primary">${
                      contract.initiator_name
                    }</div>
                    <div class="text-sm text-secondary" style="margin-top: 4px;">${
                      contract.initiator_email
                    }</div>
                </div>
                
                <div class="info-card">
                    <div class="text-sm text-accent font-semibold" style="margin-bottom: 8px;">SIGNATORY</div>
                    <div class="text-base font-bold text-primary">${signeeName}</div>
                    <div class="text-sm text-secondary" style="margin-top: 4px;">${signeeEmail}</div>
                </div>
            </div>

            <!-- Contract Details -->
            <div class="grid-2-col">
                <div class="info-card">
                    <div class="text-sm text-accent font-semibold" style="margin-bottom: 8px;">DATE EXECUTED</div>
                    <div class="text-base font-bold text-primary">
                        ${new Date().toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                    </div>
                    <div class="text-sm text-secondary" style="margin-top: 4px;">
                        ${new Date().toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </div>
                </div>
                
               
            </div>

            <!-- Important Notice -->
            <div class="highlight-box">
                <div class="text-base font-semibold text-primary" style="margin-bottom: 8px;">
                    📎 Signed Document Attached
                </div>
                <p class="text-sm text-secondary" style="margin: 0;">
                    The fully executed contract PDF with digital signatures is attached to this email. 
                    Please retain this document for your records and future reference.
                </p>
            </div>

            <!-- Disclaimer -->
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 25px;">
                <p class="text-sm text-secondary" style="margin: 0; text-align: center;">
                    This is an automated notification from Zidwell Contracts. Please do not reply to this email.
                </p>
            </div>
        </div>


    </div>
</body>
</html>
 
      `,
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
          contentType: isPdf ? "application/pdf" : "text/html",
        },
      ],
    });

    return NextResponse.json(
      {
        success: true,
        message: "Contract signed and emailed successfully",
        data: {
          contractTitle: contract.contract_title,
          creatorName: contract.initiator_name,
          signeeName,
          signedAt: new Date().toISOString(),
          contractId: contract.token,
          documentType: "PDF",
          hasCreatorSignature: !!creatorSignatureImage,
          hasSigneeSignature: true,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in sign-contract:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process contract signing",
      },
      { status: 500 },
    );
  }
}
