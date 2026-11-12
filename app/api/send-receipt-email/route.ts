// app/api/send-receipt-email/route.ts
import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

import { transporter } from "@/lib/node-mailer";
import {
  emailShell,
  ui,
  esc,
  naira,
  EMAIL_BRAND,
} from "@/lib/email/ui";

const logoPath = path.join(process.cwd(), "public", "logo.png");
const logoBuffer = fs.readFileSync(logoPath);
const base64Logo = `data:image/png;base64,${logoBuffer.toString("base64")}`;

export async function POST(request: Request) {
  try {
    const { email, receipt } = await request.json();

    if (!email || !receipt) {
      return NextResponse.json(
        { message: "Email or receipt data missing" },
        { status: 400 },
      );
    }

    const totalAmount =
      receipt.receipt_items?.reduce((sum: number, item: any) => {
        const quantity = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        return sum + quantity * price;
      }, 0) || 0;

    // ── PDF HTML — invoice-style, print-safe, uses Zidwell tokens ──
    const pdfHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Receipt</title>
  <style>
    body {
      font-family: 'Arial', 'Helvetica Neue', Helvetica, sans-serif;
      background-color: #F8F8F7;
      padding: 24px;
      margin: 0;
      color: #171717;
      font-size: 12px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .container {
      max-width: 760px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 1px solid #E5E5E3;
      border-radius: 12px;
      overflow: hidden;
    }
    .header {
      background: #F5B800;
      padding: 24px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 {
      font-size: 22px;
      margin: 0;
      color: #171717;
      font-weight: 700;
      letter-spacing: 0.4px;
    }
    .header .meta {
      text-align: right;
      font-size: 12px;
      color: #171717;
    }
    .header .meta strong { font-size: 14px; }
    .section { padding: 24px 28px; }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .card {
      border: 1px solid #E5E5E3;
      border-radius: 8px;
      padding: 14px 16px;
      background: #F8F8F7;
    }
    .card h3 {
      margin: 0 0 8px 0;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #666663;
      font-weight: 700;
    }
    .card p {
      margin: 4px 0;
      font-size: 12px;
      color: #171717;
      white-space: pre-wrap;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      border: 1px solid #E5E5E3;
      border-radius: 8px;
      overflow: hidden;
    }
    thead th {
      background: #171717;
      color: #FFFFFF;
      text-align: left;
      padding: 10px 12px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      font-weight: 700;
    }
    thead th:nth-child(2),
    thead th:nth-child(3),
    thead th:nth-child(4) {
      text-align: right;
    }
    tbody td {
      padding: 10px 12px;
      border-bottom: 1px solid #E5E5E3;
      color: #262624;
    }
    tbody td:nth-child(2),
    tbody td:nth-child(3),
    tbody td:nth-child(4) {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    tbody tr:nth-child(even) td {
      background: #F8F8F7;
    }
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
    .totals-box {
      min-width: 260px;
      background: #F8F8F7;
      border: 1px solid #E5E5E3;
      border-radius: 8px;
      padding: 12px 16px;
    }
    .totals-box .row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 12px;
      color: #666663;
    }
    .totals-box .row.grand {
      border-top: 2px solid #F5B800;
      margin-top: 6px;
      padding-top: 8px;
      font-size: 14px;
      font-weight: 700;
      color: #171717;
    }
    .totals-box .row.grand span:last-child { color: #F5B800; }
    .notes {
      background: #F8F8F7;
      border: 1px solid #E5E5E3;
      border-radius: 8px;
      padding: 14px 16px;
      margin-top: 20px;
      font-size: 12px;
      color: #262624;
    }
    .footer {
      text-align: center;
      font-size: 10px;
      color: #666663;
      border-top: 1px solid #E5E5E3;
      padding: 14px 28px 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="display:flex; align-items:center; gap:10px;">
        <h1>RECEIPT</h1>
        <img src="${base64Logo}" alt="Zidwell" style="height:36px; width:auto; display:block;" />
      </div>
      <div class="meta">
        <div><strong>#${esc(receipt.receipt_id || "")}</strong></div>
        <div>${esc(receipt.issue_date || "")}</div>
      </div>
    </div>

    <div class="section">
      <div class="grid">
        <div class="card">
          <h3>From</h3>
          <p>${esc(receipt.initiator_name || "—")}</p>
        </div>
        <div class="card">
          <h3>Bill to</h3>
          <p>${esc(receipt.bill_to || "—")}</p>
        </div>
      </div>

      <div class="grid">
        <div class="card">
          <h3>Receipt details</h3>
          <p><strong>Receipt #:</strong> ${esc(receipt.receipt_id || "—")}</p>
          <p><strong>Issue date:</strong> ${esc(receipt.issue_date || "—")}</p>
          <p><strong>Payment for:</strong> ${esc(receipt.payment_for || "—")}</p>
        </div>
        <div class="card">
          <h3>Amount</h3>
          <p><strong>Total:</strong> ${naira(totalAmount)}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th style="width:60px;">Qty</th>
            <th style="width:110px;">Rate</th>
            <th style="width:110px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${
            (receipt.receipt_items || [])
              .map(
                (item: any) => `
            <tr>
              <td>${esc(item.item || "—")}</td>
              <td>${esc(item.quantity)}</td>
              <td>${naira(item.price)}</td>
              <td>${naira(Number(item.quantity) * Number(item.price))}</td>
            </tr>
          `,
              )
              .join("") ||
            `<tr><td colspan="4" style="text-align:center; color:#666663;">No items</td></tr>`
          }
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-box">
          <div class="row grand"><span>Total</span><span>${naira(totalAmount)}</span></div>
        </div>
      </div>

      ${
        receipt.customer_note
          ? `<div class="notes"><strong>Notes:</strong> ${esc(receipt.customer_note)}</div>`
          : ""
      }

      <div class="footer">
        This receipt is a record of your transaction. Please keep it for your records.
      </div>
    </div>
  </div>
</body>
</html>
`;

    // Render PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(pdfHtml, { waitUntil: "load" });
    const pdfBytes = await page.pdf({ format: "A4", printBackground: true });
    const pdfBuffer = Buffer.from(pdfBytes);
    await browser.close();

    // ── Email body (Zidwell design system) ──
    const emailHtml = emailShell({
      title: `Receipt #${receipt.receipt_id || ""}`,
      preheader: `Receipt from Zidwell — ${naira(totalAmount)}.`,
      content: `
        ${ui.h1("🧾 Receipt")}
        ${ui.muted(
          `Receipt <strong style="color:${EMAIL_BRAND.ink};">#${esc(
            receipt.receipt_id || "—"
          )}</strong>${
            receipt.issue_date ? ` · Issued ${esc(receipt.issue_date)}` : ""
          }`
        )}
        ${ui.divider()}
        ${ui.h3("From")}
        ${ui.p(esc(receipt.initiator_name || "—"))}
        ${ui.h3("Bill to")}
        ${ui.p(esc(receipt.bill_to || "—"))}
        ${ui.itemsTable(
          (receipt.receipt_items || []).map((it: any) => ({
            description: it.item || "Item",
            quantity: Number(it.quantity) || 0,
            unitPrice: Number(it.price) || 0,
          }))
        )}
        ${ui.totals([
          { label: "Total", value: naira(totalAmount), emphasis: true },
        ])}
        ${receipt.customer_note ? ui.alert(esc(receipt.customer_note), "neutral") : ""}
        ${ui.muted("A PDF copy of the receipt is attached to this email.")}
        ${ui.signature()}
      `,
    });

    // Send to both owner + client
    const recipients = [
      {
        email: email,
        subject: "Receipt sent to client",
      },
      {
        email: receipt.signee_email,
        subject: "Your receipt from Zidwell",
      },
    ];

    for (const recipient of recipients) {
      if (!recipient.email) continue;
      await transporter.sendMail({
        from: `"Zidwell" <${process.env.EMAIL_USER}>`,
        to: recipient.email,
        subject: recipient.subject,
        html: emailHtml,
        attachments: [
          {
            filename: "receipt.pdf",
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });
    }

    return NextResponse.json({ message: "Emails sent successfully." });
  } catch (error: any) {
    console.error("Email sending failed:", error);
    return NextResponse.json(
      { message: "Failed to send receipt email", error: error.message },
      { status: 500 },
    );
  }
}