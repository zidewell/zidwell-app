// /app/api/generate-statement/route.ts
import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export async function POST(req: NextRequest) {
  let browser = null;

  try {
    const { userId, from, to, transactions, user } = await req.json();

    if (!userId || !from || !to) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Calculate totals
    let totalInflow = 0;
    let totalOutflow = 0;
    let totalFees = 0;

    const filteredTransactions = transactions || [];

    filteredTransactions.forEach((tx: any) => {
      const amount = Number(tx.amount) || 0;
      const fee = Number(tx.fee) || 0;

      if (
        [
          "deposit",
          "virtual_account_deposit",
          "card_deposit",
          "p2p_received",
          "referral",
          "referral_reward",
        ].includes(tx.type?.toLowerCase())
      ) {
        totalInflow += amount;
      } else {
        totalOutflow += amount;
      }

      totalFees += fee;
    });

    const netBalance = totalInflow - totalOutflow - totalFees;

    const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_DEV_URL
        : process.env.NEXT_PUBLIC_BASE_URL;

    const headerImageUrl = `${baseUrl}/zidwell-header.png`;
    const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

    // Generate HTML for the statement
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bank Statement - ${user?.name || "Account Holder"}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
            padding: 20px;
        }
        
        .statement-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
        }
        
        /* Header Image */
        .header-image {
            width: 100%;
            max-width: 800px;
            margin: 0 auto 20px;
            display: block;
        }
        
        /* Header */
        .header {
            text-align: center;
            padding: 30px 0;
            border-bottom: 2px solid #e5e7eb;
            margin-bottom: 30px;
        }
        
        .logo {
            font-size: 32px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 10px;
        }
        
        .title {
            font-size: 24px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 10px;
        }
        
        .subtitle {
            color: #6b7280;
            font-size: 14px;
        }
        
        /* User Info */
        .user-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
        }
        
        .info-group h3 {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        .info-group p {
            font-size: 16px;
            color: #1f2937;
            font-weight: 600;
        }
        
        /* Summary Cards */
        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .summary-card {
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        
        .summary-card.inflow {
            background: #dcfce7;
            border: 1px solid #bbf7d0;
        }
        
        .summary-card.outflow {
            background: #fee2e2;
            border: 1px solid #fecaca;
        }
        
        .summary-card.fees {
            background: #fef3c7;
            border: 1px solid #fde68a;
        }
        
        .summary-card.balance {
            background: #dbeafe;
            border: 1px solid #bfdbfe;
        }
        
        .summary-card h4 {
            font-size: 12px;
            color: #4b5563;
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        .summary-card .amount {
            font-size: 20px;
            font-weight: 700;
        }
        
        .inflow .amount { color: #059669; }
        .outflow .amount { color: #dc2626; }
        .fees .amount { color: #d97706; }
        .balance .amount { color: #2563eb; }
        
        /* Transactions Table */
        .transactions-section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .transactions-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        
        .transactions-table th {
            background: #f3f4f6;
            padding: 12px 15px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            color: #4b5563;
            border: 1px solid #e5e7eb;
        }
        
        .transactions-table td {
            padding: 12px 15px;
            font-size: 13px;
            border: 1px solid #e5e7eb;
        }
        
        .transactions-table tr:nth-child(even) {
            background: #f9fafb;
        }
        
        .amount-cell {
            font-weight: 600;
            text-align: right;
        }
        
        .inflow-amount {
            color: #059669;
        }
        
        .outflow-amount {
            color: #dc2626;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
        }
        
        .status-success {
            background: #d1fae5;
            color: #065f46;
        }
        
        .status-pending {
            background: #dbeafe;
            color: #1e40af;
        }
        
        .status-failed {
            background: #fee2e2;
            color: #991b1b;
        }
        
        /* Footer Image */
        .footer-image {
            width: 100%;
            max-width: 800px;
            margin: 40px auto 0;
            display: block;
        }
        
        /* Footer */
        .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }
        
        .footer p {
            margin-bottom: 5px;
        }
        
        /* Print styles */
        @media print {
            body {
                padding: 0;
            }
            
            .statement-container {
                max-width: 100%;
            }
            
            .header-image, .footer-image {
                max-width: 100%;
            }
            
            .summary-cards {
                break-inside: avoid;
            }
            
            .transactions-table {
                break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="statement-container">
        <!-- Header Image -->
        <img src="${headerImageUrl}" alt="Zidwell Header" class="header-image" />
        
        <!-- Header -->
        <div class="header">
            <div class="logo">ZIDWELL FINANCE</div>
            <h1 class="title">Bank Statement</h1>
            <p class="subtitle">Statement Period: ${new Date(
              from
            ).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })} to ${new Date(to).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}</p>
        </div>
        
        <!-- User Information -->
        <div class="user-info">
            <div class="info-group">
                <h3>Account Holder</h3>
                <p>${user?.name || "N/A"}</p>
            </div>
            <div class="info-group">
                <h3>Statement Date</h3>
                <p>${new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</p>
            </div>
            <div class="info-group">
                <h3>Total Transactions</h3>
                <p>${filteredTransactions.length}</p>
            </div>
        </div>
        
        <!-- Summary Cards -->
        <div class="summary-cards">
            <div class="summary-card inflow">
                <h4>TOTAL INFLOW</h4>
                <div class="amount">₦${totalInflow.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}</div>
            </div>
            <div class="summary-card outflow">
                <h4>TOTAL OUTFLOW</h4>
                <div class="amount">₦${totalOutflow.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}</div>
            </div>
            <div class="summary-card fees">
                <h4>TOTAL FEES</h4>
                <div class="amount">₦${totalFees.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}</div>
            </div>
            <div class="summary-card balance">
                <h4>NET BALANCE</h4>
                <div class="amount">₦${netBalance.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}</div>
            </div>
        </div>
        
        <!-- Transactions Section -->
        <div class="transactions-section">
            <h2 class="section-title">Transaction Details</h2>
            
            ${
              filteredTransactions.length > 0
                ? `
            <table class="transactions-table">
                <thead>
                    <tr>
                        <th>Date & Time</th>
                        <th>Description</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Reference</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredTransactions
                      .map((tx: any) => {
                        const txDate = new Date(tx.created_at);
                        const dateStr = txDate.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        });
                        const timeStr = txDate.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        const isOutflow = [
                          "withdrawal",
                          "debit",
                          "airtime",
                          "data",
                          "electricity",
                          "cable",
                          "transfer",
                          "p2p_transfer",
                        ].includes(tx.type?.toLowerCase());

                        const amount = Number(tx.amount) || 0;
                        const fee = Number(tx.fee) || 0;

                        const statusClass =
                          tx.status?.toLowerCase() === "success"
                            ? "status-success"
                            : tx.status?.toLowerCase() === "pending"
                            ? "status-pending"
                            : "status-failed";

                        return `
                        <tr>
                            <td>${dateStr}<br><small>${timeStr}</small></td>
                            <td>${tx.description || tx.type || "N/A"}</td>
                            <td>${tx.type || "N/A"}</td>
                            <td><span class="status-badge ${statusClass}">${
                          tx.status || "N/A"
                        }</span></td>
                            <td><small>${tx.reference || "N/A"}</small></td>
                            <td class="amount-cell ${
                              isOutflow ? "outflow-amount" : "inflow-amount"
                            }">
                                ${
                                  isOutflow ? "-" : "+"
                                }₦${amount.toLocaleString("en-NG", {
                          minimumFractionDigits: 2,
                        })}
                                ${
                                  fee > 0
                                    ? `<br><small style="color: #6b7280;">Fee: ₦${fee.toLocaleString(
                                        "en-NG",
                                        { minimumFractionDigits: 2 }
                                      )}</small>`
                                    : ""
                                }
                            </td>
                        </tr>
                        `;
                      })
                      .join("")}
                </tbody>
            </table>
            `
                : `
            <div style="text-align: center; padding: 40px; background: #f9fafb; border-radius: 8px;">
                <p style="color: #6b7280; font-size: 16px;">No transactions found in the selected period</p>
            </div>
            `
            }
        </div>
        
        <!-- Footer Image -->
        <img src="${footerImageUrl}" alt="Zidwell Footer" class="footer-image" />
        
        <!-- Footer -->
        <div class="footer">
            <p>This is an official bank statement from ZIDWELL FINANCE</p>
            <p>Generated on ${new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}</p>
            <p>For any questions, please contact our customer support</p>
            <p style="margin-top: 20px; font-size: 10px; color: #9ca3af;">
                This document is computer-generated and does not require a signature.
            </p>
        </div>
    </div>
</body>
</html>
`;

    // Generate PDF using Puppeteer
    let executablePath: string;
    let browserArgs: string[];

    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      console.log("Using @sparticuz/chromium for production PDF generation");
      executablePath = await chromium.executablePath();
      browserArgs = [
        ...chromium.args,
        "--hide-scrollbars",
        "--disable-web-security",
      ];
    } else {
      console.log("Using local Chrome for development PDF generation");
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

    console.log("Launching browser for PDF generation");

    browser = await puppeteer.launch({
      executablePath,
      args: browserArgs,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "load" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    });

    console.log(
      "Bank statement PDF generated successfully, size:",
      pdfBuffer.length,
      "bytes"
    );

    // Generate filename
    const fromDate = new Date(from).toISOString().split("T")[0];
    const toDate = new Date(to).toISOString().split("T")[0];
    const filename = `bank-statement-${fromDate}-to-${toDate}.pdf`;

    // Convert Buffer to Uint8Array for proper response
    const pdfArray = new Uint8Array(pdfBuffer);

    // Return PDF as response
    return new NextResponse(pdfArray, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Statement PDF generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate statement: " + error.message },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
