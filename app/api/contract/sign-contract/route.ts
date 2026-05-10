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

      const getOrdinalSuffix = (n: number) => {
        if (n > 3 && n < 21) return "th";
        switch (n % 10) {
          case 1: return "st";
          case 2: return "nd";
          case 3: return "rd";
          default: return "th";
        }
      };

      return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
    } catch (e) {
      return dateString;
    }
  };

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
    return metadataObj?.contract_date
      ? formatDate(metadataObj.contract_date)
      : formatDate(contract.created_at);
  };

  const contractDate = getContractDate();
  const signedDate = contract.signed_at
    ? formatDate(contract.signed_at)
    : contractDate;

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
  const partyA = contract.initiator_name || "Contract Creator";
  const partyB = signeeName || contract.signee_name || "Signee";

  const partyASignatureHTML = creatorSignatureImage
    ? `<img src="${creatorSignatureImage}" alt="Signature of ${partyA}" style="height: 40px; object-fit: contain; max-width: 180px;">`
    : `<span style="color: #9ca3af; font-size: 14px;">Signature</span>`;

  const partyBSignatureHTML = signeeSignatureImage
    ? `<img src="${signeeSignatureImage}" alt="Signature of ${partyB}" style="height: 40px; object-fit: contain; max-width: 180px;">`
    : `<span style="color: #9ca3af; font-size: 14px;">Signature</span>`;

  const hasLawyerSignature =
    contract.include_lawyer_signature ||
    (typeof contract.metadata === "object" && contract.metadata?.lawyer_signature) ||
    (typeof contract.metadata === "string" && JSON.parse(contract.metadata || "{}")?.lawyer_signature);

  const parseTerms = () => {
    if (!contract.contract_text) return null;
    const content = contract.contract_text;
    const sanitizedContent = content.replace(/src="http:\/\//gi, 'src="https://');
    return sanitizedContent;
  };

  const contractContent = parseTerms();

  const styledContractContent = contractContent
    ? contractContent
        .replace(/<h1[^>]*>/g, '<h1 style="page-break-after: avoid; margin-top: 30px; margin-bottom: 20px; font-size: 24px; font-weight: bold; color: #111827;">')
        .replace(/<h2[^>]*>/g, '<h2 style="page-break-after: avoid; margin-top: 25px; margin-bottom: 15px; font-size: 20px; font-weight: bold; color: #111827;">')
        .replace(/<h3[^>]*>/g, '<h3 style="page-break-after: avoid; margin-top: 20px; margin-bottom: 10px; font-size: 18px; font-weight: bold; color: #111827;">')
        .replace(/<p[^>]*>/g, '<p style="margin: 10px 0; line-height: 1.6; color: #4b5563;">')
        .replace(/<ul[^>]*>/g, '<ul style="margin: 15px 0; padding-left: 30px;">')
        .replace(/<ol[^>]*>/g, '<ol style="margin: 15px 0; padding-left: 30px;">')
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
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            color: #333;
            background: #ffffff;
            max-width: 100%;
            min-height: 100vh;
            padding: 20px;
        }
        
        .header-image {
            width: 100%;
            max-width: 800px;
            margin: 0 auto 20px;
            display: block;
        }
        
        .footer-image {
            width: 100%;
            max-width: 800px;
            margin: 20px auto 0;
            display: block;
        }
        
        .content-flow {
            max-width: 800px;
            margin: 0 auto;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .contract-title {
            color: #191919;
            background-color: #FDC020;
            font-size: 24px;
            font-weight: bold;
            padding: 12px 0;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .contract-intro {
            font-size: 14px;
            color: #4b5563;
            margin-bottom: 20px;
        }
        
        .party-info {
            margin-bottom: 30px;
            text-align: left;
            max-width: 400px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .party-row {
            display: flex;
            align-items: flex-start;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .party-label {
            font-weight: bold;
            min-width: 80px;
            color: #111827;
        }
        
        .party-value {
            margin-left: 16px;
            color: #4b5563;
        }
        
        .section-divider {
            display: flex;
            align-items: center;
            gap: 16px;
            margin: 32px 0;
        }
        
        .divider-line {
            flex: 1;
            height: 2px;
            background-color: #FDC020;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            white-space: nowrap;
            color: #111827;
        }
        
        .terms-section {
            margin-bottom: 40px;
        }
        
        .term-content {
            font-size: 14px;
            line-height: 1.7;
            color: #4b5563;
            text-align: justify;
        }
        
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
        
        .payment-terms-section {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        
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
            background-color: #F5F5F5;
            color: #111827;
            border: 1px solid #E5E5E5;
        }
        
        .signatures-table td {
            padding: 24px 16px;
            text-align: center;
            vertical-align: top;
            border: 1px solid #E5E5E5;
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
            font-size: 14px;
        }
        
        .signature-line {
            width: 180px;
            height: 50px;
            border-bottom: 2px dotted #999;
            overflow: hidden;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .lawyer-signature {
            margin-top: 30px;
            padding: 20px;
            background-color: #F5F5F5;
            border-radius: 16px;
            border: 1px solid #E5E5E5;
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
            background-color: #FDC020;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
        }
        
        .lawyer-check span {
            color: #191919;
            font-size: 12px;
            font-weight: bold;
        }
        
        .lawyer-title {
            font-size: 14px;
            font-weight: 600;
            color: #FDC020;
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
            background-color: rgba(253, 192, 32, 0.1);
            color: #FDC020;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .contract-footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            font-size: 11px;
            color: #6b7280;
            line-height: 1.5;
        }
        
        @media print {
            body {
                padding: 10mm !important;
                margin: 0 !important;
            }
            
            .header-image, .footer-image {
                max-width: 100% !important;
            }
            
            .contract-title {
                font-size: 18px;
                padding: 8px 0;
            }
            
            .section-title {
                font-size: 16px;
            }
            
            .term-content {
                font-size: 12px;
            }
            
            .signature-line {
                width: 140px;
                height: 40px;
            }
        }
        
        @media (max-width: 640px) {
            .section-divider {
                gap: 8px;
            }
            
            .section-title {
                font-size: 14px;
                white-space: normal;
            }
            
            .party-row {
                flex-direction: column;
                gap: 4px;
            }
            
            .party-label {
                min-width: auto;
            }
            
            .party-value {
                margin-left: 0;
            }
        }
    </style>
</head>
<body>
    <div class="content-flow">
        ${headerImageUrl ? `<img src="${headerImageUrl}" alt="Zidwell Header" class="header-image" />` : ""}
        
        <div class="header">
            <div class="contract-title">${contract.contract_title || "Service Contract"}</div>
            <p class="contract-intro">
                This is a service agreement entered into between:
            </p>
            
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
        
        ${paymentTerms ? `
        <div class="payment-terms-section">
            <div class="section-divider">
                <div class="divider-line"></div>
                <div class="section-title">PAYMENT TERMS</div>
                <div class="divider-line"></div>
            </div>
            
            <div class="term-content">
                ${paymentTerms}
            </div>
        </div>
        ` : ""}
        
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
                        <td>
                            <div class="signature-cell">
                                <div class="signature-name">${partyA}</div>
                                <div class="signature-line">
                                    ${partyASignatureHTML}
                                </div>
                            </div>
                        </td>
                        
                        ${hasLawyerSignature ? `
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
                            </div>
                        </div>
                        ` : ""}
                        
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
            
            ${hasLawyerSignature ? `
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
            ` : ""}
        </div>
        
        <div class="contract-footer">
            THIS CONTRACT WAS CREATED AND SIGNED ON zidwell.com
            <br />
            Contract ID: ${contract.token?.substring(0, 8).toUpperCase() || "N/A"}
            ${hasLawyerSignature ? "<br />⚖️ Includes Verified Legal Witness Signature" : ""}
            ${contract.verification_status === "verified"
              ? "<br />✓ Identity Verified"
              : contract.verification_status === "pending"
                ? "<br />⚠ Identity Verification Pending"
                : "<br />⛔ Identity Not Verified"}
            <br />
            Generated on: ${new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
        </div>
        
        ${footerImageUrl ? `<img src="${footerImageUrl}" alt="Zidwell Footer" class="footer-image" />` : ""}
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
    await page.setViewport({ width: 1200, height: 800 });
    
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
      const images = Array.from(document.querySelectorAll("img"));
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve, reject) => {
            img.addEventListener("load", resolve);
            img.addEventListener("error", reject);
          });
        })
      );
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "15mm",
        right: "15mm",
        bottom: "15mm",
        left: "15mm",
      },
      preferCSSPageSize: false,
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
    const { contractToken, signeeName, signeeEmail, signatureImage } = await request.json();

    if (!contractToken || !signeeEmail || !signeeName || !signatureImage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

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

    if (contract.verification_status !== "verified") {
      return NextResponse.json(
        { error: "Identity verification required before signing" },
        { status: 403 },
      );
    }

    let creatorSignatureImage = contract.creator_signature || null;

    if (!creatorSignatureImage) {
      const { data: creatorData } = await supabase
        .from("users")
        .select("signature")
        .eq("email", contract.initiator_email)
        .single();

      creatorSignatureImage = creatorData?.signature || null;
    }

    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        signee_name: signeeName,
        status: "signed",
        signed_at: new Date().toISOString(),
        signee_signature_image: signatureImage,
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

    const pdfBuffer = await generatePdfBuffer(
      contract,
      signeeName,
      signatureImage,
      creatorSignatureImage,
    );

    const fileName = `signed-contract-${
      contract.contract_title
        ? contract.contract_title.replace(/[^a-z0-9]/gi, "-").toLowerCase()
        : "contract"
    }-${new Date().getTime()}.pdf`;

    await transporter.sendMail({
      from: `Zidwell Contracts <${process.env.EMAIL_FROM}>`,
      to: `${contract.initiator_email}, ${signeeEmail}`,
      subject: `✓ Contract Signed: ${contract.contract_title || "Contract Agreement"}`,
      html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Contract Signed - Zidwell</title>
    <style>
        body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 28px; overflow: hidden; }
        .header { background: #FDC020; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .success-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
        .info-box { background: #F5F5F5; padding: 20px; border-radius: 16px; margin: 20px 0; }
        .btn { background: #FDC020; color: #191919; padding: 12px 24px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #191919; margin: 0;">Zidwell Contracts</h1>
        </div>
        <div class="content">
            <div class="success-icon">✓</div>
            <h2 style="text-align: center; color: #191919;">Contract Successfully Signed!</h2>
            <p style="text-align: center; color: #666;">The contract "${contract.contract_title || "Service Contract"}" has been signed and is now legally binding.</p>
            
            <div class="info-box">
                <p><strong>Contract ID:</strong> ${contract.token?.substring(0, 8).toUpperCase()}</p>
                <p><strong>Signed by:</strong> ${signeeName} (${signeeEmail})</p>
                <p><strong>Signed on:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p>The signed PDF document is attached to this email. Please keep it for your records.</p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>The Zidwell Team</strong></p>
        </div>
    </div>
</body>
</html>
      `,
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
          contentType: "application/pdf",
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
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in sign-contract:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process contract signing",
      },
      { status: 500 },
    );
  }
}