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

// Helper function to check email configuration
function checkEmailConfiguration() {
  console.log("📧 [EMAIL-CONFIG] Checking email configuration...");
  console.log("📧 [EMAIL-CONFIG] EMAIL_USER configured:", !!process.env.EMAIL_USER);
  console.log("📧 [EMAIL-CONFIG] EMAIL_PASS configured:", !!process.env.EMAIL_PASS);
  console.log("📧 [EMAIL-CONFIG] EMAIL_HOST:", process.env.EMAIL_HOST || "default (smtp.gmail.com)");
  console.log("📧 [EMAIL-CONFIG] EMAIL_PORT:", process.env.EMAIL_PORT || "default (587)");
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ [EMAIL-CONFIG] Email credentials missing! Check environment variables.");
  } else {
    console.log("✅ [EMAIL-CONFIG] Email configuration looks good");
  }
}

// Call configuration check
checkEmailConfiguration();

// ─────────────────────────────────────────────────────────────────────────────
// SHARED CSS — injected into both PDF templates
// Uses the real header/footer images (full-bleed) like the emails.
// Tuned for A4 single page.
// ─────────────────────────────────────────────────────────────────────────────
const SHARED_PDF_CSS = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  @page {
    size: A4;
    margin: 0;
  }

  html, body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    background: #ffffff;
    color: #0f172a;
    font-size: 12px;
    line-height: 1.45;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .pdf-page {
    width: 210mm;
    min-height: 297mm;
    padding: 0 0 8mm 0;
    background: #ffffff;
    display: flex;
    flex-direction: column;
  }

  /* ─── FULL-BLEED HEADER (matches emails) ─── */
  .email-header {
    width: 100%;
    display: block;
  }

  /* ─── CONTENT WRAPPER ─── */
  .content-wrapper {
    padding: 6mm 14mm 0 14mm;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  /* ─── DOC TITLE BLOCK ─── */
  .doc-title-block {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding-bottom: 10px;
    border-bottom: 3px solid #FDC020;
    margin-bottom: 14px;
    gap: 12px;
  }

  .doc-title-left {
    min-width: 0;
    flex: 1;
  }

  .doc-title {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.3px;
    color: #0f172a;
  }

  .doc-subtitle {
    font-size: 10px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1.3px;
    margin-top: 3px;
  }

  .doc-title-right {
    text-align: right;
    flex-shrink: 0;
  }

  .doc-number {
    font-size: 12px;
    font-weight: 700;
    color: #0f172a;
    margin-top: 6px;
  }

  .doc-date {
    font-size: 10px;
    color: #64748b;
    margin-top: 2px;
  }

  /* ─── STATUS BADGE ─── */
  .pdf-status {
    display: inline-block;
    padding: 4px 11px;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .pdf-status-paid {
    background: #dcfce7;
    color: #166534;
  }

  .pdf-status-partial {
    background: #fef3c7;
    color: #92400e;
  }

  .pdf-status-pending {
    background: #fee2e2;
    color: #991b1b;
  }

  /* ─── AMOUNT HERO ─── */
  .pdf-amount-hero {
    background: #0f172a;
    color: #ffffff;
    border-radius: 10px;
    padding: 14px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    position: relative;
    overflow: hidden;
  }

  .pdf-amount-hero::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: #FDC020;
  }

  .pdf-amount-hero-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #94a3b8;
    margin-bottom: 4px;
  }

  .pdf-amount-hero-value {
    font-size: 24px;
    font-weight: 700;
    color: #ffffff;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .pdf-amount-hero-meta {
    text-align: right;
    font-size: 10px;
    color: #94a3b8;
    line-height: 1.6;
  }

  .pdf-amount-hero-meta strong {
    color: #ffffff;
    font-weight: 600;
  }

  /* ─── GRID SECTIONS ─── */
  .pdf-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 10px;
  }

  .pdf-grid-full {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    margin-bottom: 10px;
  }

  .pdf-section {
    background: #f8fafc;
    border-radius: 8px;
    padding: 10px 12px;
    border-left: 3px solid #FDC020;
  }

  .pdf-section-title {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: #475569;
    margin-bottom: 6px;
  }

  .pdf-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    padding: 3px 0;
    font-size: 11px;
  }

  .pdf-row:not(:last-child) {
    border-bottom: 1px solid #e2e8f0;
  }

  .pdf-row-label {
    color: #64748b;
    flex-shrink: 0;
  }

  .pdf-row-value {
    color: #0f172a;
    font-weight: 600;
    text-align: right;
    word-break: break-word;
    max-width: 60%;
  }

  /* ─── ITEMS TABLE ─── */
  .pdf-items-title {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: #475569;
    margin: 10px 0 6px 0;
  }

  .pdf-items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
    font-size: 11px;
  }

  .pdf-items-table thead th {
    background: #0f172a;
    color: #ffffff;
    padding: 6px 10px;
    text-align: left;
    font-weight: 600;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }

  .pdf-items-table thead th:last-child,
  .pdf-items-table thead th:nth-child(2),
  .pdf-items-table thead th:nth-child(3) {
    text-align: right;
  }

  .pdf-items-table tbody td {
    padding: 6px 10px;
    border-bottom: 1px solid #e2e8f0;
    color: #334155;
  }

  .pdf-items-table tbody td:last-child,
  .pdf-items-table tbody td:nth-child(2),
  .pdf-items-table tbody td:nth-child(3) {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .pdf-items-table tbody tr:nth-child(even) {
    background: #f8fafc;
  }

  /* ─── TOTALS ─── */
  .pdf-totals {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 10px;
  }

  .pdf-totals-box {
    width: 55%;
    background: #f8fafc;
    border-radius: 8px;
    padding: 10px 12px;
  }

  .pdf-totals-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    font-size: 11px;
  }

  .pdf-totals-row-grand {
    border-top: 2px solid #FDC020;
    margin-top: 5px;
    padding-top: 7px;
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
  }

  .pdf-totals-label {
    color: #64748b;
  }

  .pdf-totals-label-grand {
    color: #0f172a;
    font-weight: 700;
  }

  .pdf-totals-value {
    font-weight: 600;
    color: #0f172a;
    font-variant-numeric: tabular-nums;
  }

  .pdf-totals-value-paid {
    color: #16a34a;
  }

  .pdf-totals-value-due {
    color: #d97706;
  }

  /* ─── NOTES ─── */
  .pdf-note {
    background: #fef3c7;
    border-left: 3px solid #f59e0b;
    border-radius: 6px;
    padding: 9px 12px;
    font-size: 11px;
    color: #78350f;
    margin-bottom: 10px;
  }

  .pdf-note-success {
    background: #dcfce7;
    border-left-color: #16a34a;
    color: #14532d;
  }

  .pdf-note-info {
    background: #dbeafe;
    border-left-color: #3b82f6;
    color: #1e3a8a;
  }

  /* ─── FULL-BLEED FOOTER (matches emails) ─── */
  .email-footer {
    width: 100%;
    display: block;
    margin-top: auto;
    padding-top: 8mm;
  }

  /* ─── UTILITIES ─── */
  .pdf-text-right { text-align: right; }
  .pdf-text-center { text-align: center; }
  .pdf-mb-0 { margin-bottom: 0; }
  .pdf-mb-8 { margin-bottom: 8px; }
  .pdf-mb-12 { margin-bottom: 12px; }
  .pdf-mt-8 { margin-top: 8px; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// INVOICE / RECEIPT TEMPLATE (used for invoices)
// ─────────────────────────────────────────────────────────────────────────────
function generateInvoicePDFHTML(
  invoice: any,
  paymentDetails: any,
  payerName: string,
  payerEmail: string,
  isReceipt: boolean = true,
): string {
  const invoiceItems = Array.isArray(invoice.invoice_items)
    ? invoice.invoice_items
    : [];

  const subtotal =
    invoice.subtotal ||
    invoiceItems.reduce(
      (sum: number, item: any) =>
        sum + (item.quantity || 0) * (item.unit_price || item.unitPrice || 0),
      0,
    );

  const totalAmount =
    invoice.total_amount || subtotal + (invoice.fee_amount || 0);
  const paidAmount = paymentDetails?.amount || invoice.paid_amount || 0;
  const remainingBalance = totalAmount - paidAmount;
  const isFullyPaid = remainingBalance <= 0;

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

  const statusClass = isFullyPaid
    ? "pdf-status-paid"
    : remainingBalance > 0 && paidAmount > 0
      ? "pdf-status-partial"
      : "pdf-status-pending";

  const statusText = isFullyPaid
    ? "Paid in Full"
    : remainingBalance > 0 && paidAmount > 0
      ? "Partially Paid"
      : "Pending";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${isReceipt ? "Payment Receipt" : "Invoice"} - ${invoice.invoice_id}</title>
  <style>${SHARED_PDF_CSS}</style>
</head>
<body>
  <div class="pdf-page">

    <!-- FULL-BLEED HEADER IMAGE (matches emails) -->
    <img class="email-header" src="${headerImageUrl}" alt="Zidwell" />

    <div class="content-wrapper">

      <!-- DOC TITLE -->
      <div class="doc-title-block">
        <div class="doc-title-left">
          <div class="doc-title">${isReceipt ? "Payment Receipt" : "Invoice"}</div>
          <div class="doc-subtitle">Zidwell • Official Document</div>
        </div>
        <div class="doc-title-right">
          <span class="pdf-status ${statusClass}">${statusText}</span>
          <div class="doc-number">#${invoice.invoice_id}</div>
          <div class="doc-date">Issued ${formatDate(invoice.issue_date)}</div>
        </div>
      </div>

      <!-- AMOUNT HERO -->
      <div class="pdf-amount-hero">
        <div>
          <div class="pdf-amount-hero-label">Amount Paid</div>
          <div class="pdf-amount-hero-value">${formatCurrency(paidAmount)}</div>
        </div>
        <div class="pdf-amount-hero-meta">
          ${remainingBalance > 0
            ? `Balance Due<br><strong>${formatCurrency(remainingBalance)}</strong>`
            : `Total Paid<br><strong>${formatCurrency(totalAmount)}</strong>`}
        </div>
      </div>

      <!-- DOC + BUSINESS -->
      <div class="pdf-grid">
        <div class="pdf-section">
          <div class="pdf-section-title">Document Information</div>
          <div class="pdf-row">
            <span class="pdf-row-label">${isReceipt ? "Receipt No." : "Invoice No."}</span>
            <span class="pdf-row-value">${invoice.invoice_id}</span>
          </div>
          <div class="pdf-row">
            <span class="pdf-row-label">Issue Date</span>
            <span class="pdf-row-value">${formatDate(invoice.issue_date)}</span>
          </div>
          <div class="pdf-row">
            <span class="pdf-row-label">Due Date</span>
            <span class="pdf-row-value">${formatDate(invoice.due_date)}</span>
          </div>
          ${paymentDetails?.transactionId
            ? `
          <div class="pdf-row">
            <span class="pdf-row-label">Transaction ID</span>
            <span class="pdf-row-value">${paymentDetails.transactionId}</span>
          </div>
          <div class="pdf-row">
            <span class="pdf-row-label">Payment Date</span>
            <span class="pdf-row-value">${formatDate(paymentDetails.paidAt)}</span>
          </div>
          `
            : ""}
        </div>

        <div class="pdf-section">
          <div class="pdf-section-title">Business Information</div>
          <div class="pdf-row">
            <span class="pdf-row-label">Business</span>
            <span class="pdf-row-value">${invoice.business_name || invoice.from_name || "N/A"}</span>
          </div>
          <div class="pdf-row">
            <span class="pdf-row-label">Email</span>
            <span class="pdf-row-value">${invoice.from_email || invoice.business_email || "N/A"}</span>
          </div>
          ${invoice.from_address
            ? `
          <div class="pdf-row">
            <span class="pdf-row-label">Address</span>
            <span class="pdf-row-value">${invoice.from_address}</span>
          </div>
          `
            : ""}
        </div>
      </div>

      <!-- CUSTOMER + PAYMENT -->
      <div class="pdf-grid">
        <div class="pdf-section">
          <div class="pdf-section-title">Customer Information</div>
          <div class="pdf-row">
            <span class="pdf-row-label">Name</span>
            <span class="pdf-row-value">${payerName || invoice.client_name || "N/A"}</span>
          </div>
          <div class="pdf-row">
            <span class="pdf-row-label">Email</span>
            <span class="pdf-row-value">${payerEmail || invoice.client_email || "N/A"}</span>
          </div>
          ${invoice.client_phone
            ? `
          <div class="pdf-row">
            <span class="pdf-row-label">Phone</span>
            <span class="pdf-row-value">${invoice.client_phone}</span>
          </div>
          `
            : ""}
        </div>

        ${paymentDetails?.paymentMethod
          ? `
        <div class="pdf-section">
          <div class="pdf-section-title">Payment Details</div>
          <div class="pdf-row">
            <span class="pdf-row-label">Method</span>
            <span class="pdf-row-value">${
              paymentDetails.paymentMethod === "card_payment"
                ? "Card Payment"
                : paymentDetails.paymentMethod === "virtual_account" ||
                  paymentDetails.paymentMethod === "bank_transfer"
                  ? "Bank Transfer"
                  : paymentDetails.paymentMethod || "N/A"
            }</span>
          </div>
          ${paymentDetails.narration
            ? `
          <div class="pdf-row">
            <span class="pdf-row-label">Narration</span>
            <span class="pdf-row-value">${paymentDetails.narration}</span>
          </div>
          `
            : ""}
        </div>
        `
          : ""}
      </div>

      <!-- ITEMS -->
      ${
        invoiceItems.length > 0
          ? `
      <div class="pdf-items-title">Items / Services</div>
      <table class="pdf-items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoiceItems
            .map(
              (item: any) => `
          <tr>
            <td>${item.item_description || item.description || ""}</td>
            <td>${item.quantity || 0}</td>
            <td>${formatCurrency(item.unit_price || item.unitPrice || 0)}</td>
            <td>${formatCurrency(item.total_amount || item.total || (item.quantity || 0) * (item.unit_price || item.unitPrice || 0))}</td>
          </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
      `
          : ""
      }

      <!-- TOTALS -->
      <div class="pdf-totals">
        <div class="pdf-totals-box">
          <div class="pdf-totals-row">
            <span class="pdf-totals-label">Subtotal</span>
            <span class="pdf-totals-value">${formatCurrency(subtotal)}</span>
          </div>
          ${
            invoice.fee_amount > 0
              ? `
          <div class="pdf-totals-row">
            <span class="pdf-totals-label">Processing Fee</span>
            <span class="pdf-totals-value">${formatCurrency(invoice.fee_amount)}</span>
          </div>
          `
              : ""
          }
          ${
            invoice.discount_amount > 0
              ? `
          <div class="pdf-totals-row">
            <span class="pdf-totals-label">Discount</span>
            <span class="pdf-totals-value">-${formatCurrency(invoice.discount_amount)}</span>
          </div>
          `
              : ""
          }
          <div class="pdf-totals-row">
            <span class="pdf-totals-label">Total</span>
            <span class="pdf-totals-value">${formatCurrency(totalAmount)}</span>
          </div>
          ${
            paidAmount > 0
              ? `
          <div class="pdf-totals-row">
            <span class="pdf-totals-label">Amount Paid</span>
            <span class="pdf-totals-value pdf-totals-value-paid">${formatCurrency(paidAmount)}</span>
          </div>
          `
              : ""
          }
          ${
            remainingBalance > 0
              ? `
          <div class="pdf-totals-row">
            <span class="pdf-totals-label">Remaining</span>
            <span class="pdf-totals-value pdf-totals-value-due">${formatCurrency(remainingBalance)}</span>
          </div>
          `
              : ""
          }
          <div class="pdf-totals-row pdf-totals-row-grand">
            <span class="pdf-totals-label-grand">${isReceipt ? "Received" : isFullyPaid ? "Amount Due" : "Amount Due"}</span>
            <span class="pdf-totals-value">${isReceipt ? formatCurrency(paidAmount) : isFullyPaid ? formatCurrency(0) : formatCurrency(remainingBalance)}</span>
          </div>
        </div>
      </div>

      <!-- NOTES -->
      ${
        remainingBalance > 0 && !isFullyPaid
          ? `
      <div class="pdf-note">
        <strong>Note:</strong> This is a partial payment. A remaining balance of ${formatCurrency(remainingBalance)} is still due. Please settle before the due date.
      </div>
      `
          : isFullyPaid && !isReceipt
            ? `
      <div class="pdf-note pdf-note-success">
        <strong>Invoice Fully Paid:</strong> Thank you for your payment. This invoice has been fully settled.
      </div>
      `
            : ""
      }

      ${
        invoice.terms_and_conditions
          ? `
      <div class="pdf-section pdf-mb-12">
        <div class="pdf-section-title">Terms & Conditions</div>
        <div style="font-size:10px;color:#475569;line-height:1.5;">${invoice.terms_and_conditions}</div>
      </div>
      `
          : ""
      }

      ${
        invoice.customer_note
          ? `
      <div class="pdf-section pdf-mb-12">
        <div class="pdf-section-title">Note from Merchant</div>
        <div style="font-size:10px;color:#475569;line-height:1.5;">${invoice.customer_note}</div>
      </div>
      `
          : ""
      }

    </div>

    <!-- FULL-BLEED FOOTER IMAGE (matches emails) -->
    <img class="email-footer" src="${footerImageUrl}" alt="Zidwell" />

  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT PAGE RECEIPT TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────
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

  const pageTitle =
    metadata?.pageTitle ||
    paymentPage?.title ||
    paymentPage?.page_title ||
    "Payment Page";

  let paymentMethodText = "Card Payment";
  if (
    paymentMethod === "bank_transfer" ||
    paymentMethod === "virtual_account"
  ) {
    paymentMethodText = "Bank Transfer";
  } else if (
    metadata?.payment_method === "bank_transfer" ||
    metadata?.bank_transfer === true ||
    metadata?.payment_type === "backtransfer"
  ) {
    paymentMethodText = "Bank Transfer";
  } else if (paymentRecord?.payment_method === "bank_transfer") {
    paymentMethodText = "Bank Transfer";
  } else if (paymentMethod === "card" || paymentMethod === "card_payment") {
    paymentMethodText = "Card Payment";
  }

  let additionalInfo = "";

  if (metadata?.pageType === "school") {
    additionalInfo = `
      <div class="pdf-section">
        <div class="pdf-section-title">Student Information</div>
        <div class="pdf-row">
          <span class="pdf-row-label">Student</span>
          <span class="pdf-row-value">${metadata.childName || metadata.studentName || "N/A"}</span>
        </div>
        <div class="pdf-row">
          <span class="pdf-row-label">Reg. Number</span>
          <span class="pdf-row-value">${metadata.regNumber || "N/A"}</span>
        </div>
        <div class="pdf-row">
          <span class="pdf-row-label">Parent</span>
          <span class="pdf-row-value">${metadata.parentName || "N/A"}</span>
        </div>
      </div>
    `;
  } else if (
    metadata?.pageType === "physical" &&
    (metadata.shippingAddress || metadata.address)
  ) {
    const addr = metadata.shippingAddress || {};
    const formatted = metadata.address
      ? metadata.address
      : [addr.street, addr.city, addr.state, addr.country]
          .filter(Boolean)
          .join(", ");
    additionalInfo = `
      <div class="pdf-section">
        <div class="pdf-section-title">Shipping Information</div>
        <div class="pdf-row">
          <span class="pdf-row-label">Quantity</span>
          <span class="pdf-row-value">${metadata.quantity || 1}</span>
        </div>
        <div class="pdf-row">
          <span class="pdf-row-label">Address</span>
          <span class="pdf-row-value">${formatted || "N/A"}</span>
        </div>
      </div>
    `;
  } else if (metadata?.pageType === "services" && metadata.bookingDate) {
    additionalInfo = `
      <div class="pdf-section">
        <div class="pdf-section-title">Booking Details</div>
        <div class="pdf-row">
          <span class="pdf-row-label">Date</span>
          <span class="pdf-row-value">${metadata.bookingDate}</span>
        </div>
        <div class="pdf-row">
          <span class="pdf-row-label">Time</span>
          <span class="pdf-row-value">${metadata.bookingTime || "N/A"}</span>
        </div>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt - ${pageTitle}</title>
  <style>${SHARED_PDF_CSS}</style>
</head>
<body>
  <div class="pdf-page">

    <!-- FULL-BLEED HEADER IMAGE (matches emails) -->
    <img class="email-header" src="${headerImageUrl}" alt="Zidwell" />

    <div class="content-wrapper">

      <!-- DOC TITLE -->
      <div class="doc-title-block">
        <div class="doc-title-left">
          <div class="doc-title">Payment Receipt</div>
          <div class="doc-subtitle">Zidwell • Verified Transaction</div>
        </div>
        <div class="doc-title-right">
          <span class="pdf-status pdf-status-paid">Payment Successful</span>
          <div class="doc-number">#${transactionId.slice(-12)}</div>
          <div class="doc-date">${formatDate(paidAt)}</div>
        </div>
      </div>

      <!-- AMOUNT HERO -->
      <div class="pdf-amount-hero">
        <div>
          <div class="pdf-amount-hero-label">Amount Paid</div>
          <div class="pdf-amount-hero-value">${formatCurrency(amount)}</div>
        </div>
        <div class="pdf-amount-hero-meta">
          Paid via<br><strong>${paymentMethodText}</strong>
        </div>
      </div>

      <!-- PAGE + CUSTOMER -->
      <div class="pdf-grid">
        <div class="pdf-section">
          <div class="pdf-section-title">Payment Page</div>
          <div class="pdf-row">
            <span class="pdf-row-label">Title</span>
            <span class="pdf-row-value">${pageTitle}</span>
          </div>
          ${
            paymentRecord?.order_reference
              ? `
          <div class="pdf-row">
            <span class="pdf-row-label">Reference</span>
            <span class="pdf-row-value">${paymentRecord.order_reference}</span>
          </div>
          `
              : ""
          }
          ${
            metadata?.referenceCode
              ? `
          <div class="pdf-row">
            <span class="pdf-row-label">Code</span>
            <span class="pdf-row-value">${metadata.referenceCode}</span>
          </div>
          `
              : ""
          }
        </div>

        <div class="pdf-section">
          <div class="pdf-section-title">Customer Information</div>
          <div class="pdf-row">
            <span class="pdf-row-label">Name</span>
            <span class="pdf-row-value">${customerName}</span>
          </div>
          <div class="pdf-row">
            <span class="pdf-row-label">Email</span>
            <span class="pdf-row-value">${customerEmail}</span>
          </div>
          ${
            paymentRecord?.customer_phone
              ? `
          <div class="pdf-row">
            <span class="pdf-row-label">Phone</span>
            <span class="pdf-row-value">${paymentRecord.customer_phone}</span>
          </div>
          `
              : ""
          }
        </div>
      </div>

      <!-- TRANSACTION -->
      <div class="pdf-grid-full">
        <div class="pdf-section">
          <div class="pdf-section-title">Transaction Details</div>
          <div class="pdf-row">
            <span class="pdf-row-label">Transaction ID</span>
            <span class="pdf-row-value">${transactionId}</span>
          </div>
          <div class="pdf-row">
            <span class="pdf-row-label">Payment Date</span>
            <span class="pdf-row-value">${formatDate(paidAt)}</span>
          </div>
          <div class="pdf-row">
            <span class="pdf-row-label">Payment Method</span>
            <span class="pdf-row-value">${paymentMethodText}</span>
          </div>
        </div>
      </div>

      ${additionalInfo}

      <!-- NOTE -->
      <div class="pdf-note pdf-note-success">
        <strong>Thank you for your payment!</strong> This is an official receipt for your transaction. Please keep this for your records.
      </div>

    </div>

    <!-- FULL-BLEED FOOTER IMAGE (matches emails) -->
    <img class="email-footer" src="${footerImageUrl}" alt="Zidwell" />

  </div>
</body>
</html>`;
}

// Function to call your PDF generation API
async function generatePDFFromAPI(html: string): Promise<Buffer> {
  console.log(`📄 [PDF-API] Calling PDF generation API at ${baseUrl}/api/generate-pdf`);
  console.log(`📄 [PDF-API] HTML length: ${html.length} characters`);
  
  try {
    const response = await fetch(`${baseUrl}/api/generate-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ html }),
    });

    if (!response.ok) {
      console.error(`❌ [PDF-API] PDF generation failed with status: ${response.status} ${response.statusText}`);
      throw new Error(`PDF generation failed: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`✅ [PDF-API] PDF generated successfully, size: ${buffer.length} bytes`);
    return buffer;
  } catch (error) {
    console.error("❌ [PDF-API] Error calling PDF generation API:", error);
    throw error;
  }
}

// Send transaction receipt with PDF attachment
export async function sendTransactionReceiptWithPDF(
  payerEmail: string,
  payerName: string,
  invoice: any,
  paymentDetails: {
    amount: number;
    nombaFee: number;
    netAmount: number;
    transactionId: string;
    paymentMethod: string;
    paidAt: string;
    narration?: string;
  },
): Promise<{ success: boolean; messageId?: string; error?: string; fallback?: boolean }> {
  console.log(`📧 [EMAIL] ========== START sendTransactionReceiptWithPDF ==========`);
  console.log(`📧 [EMAIL] Recipient: ${payerEmail}`);
  console.log(`📧 [EMAIL] Payer Name: ${payerName}`);
  console.log(`📧 [EMAIL] Invoice ID: ${invoice.invoice_id}`);
  console.log(`📧 [EMAIL] Amount: ${paymentDetails.amount}`);
  console.log(`📧 [EMAIL] Transaction ID: ${paymentDetails.transactionId}`);
  console.log(`📧 [EMAIL] Payment Method: ${paymentDetails.paymentMethod}`);
  
  if (!payerEmail || !payerEmail.includes('@')) {
    console.error(`❌ [EMAIL] Invalid email address: ${payerEmail}`);
    return { success: false, error: "Invalid email address" };
  }
  
  try {
    console.log(`📧 [EMAIL] Generating PDF HTML...`);
    const pdfHTML = generateInvoicePDFHTML(
      invoice,
      paymentDetails,
      payerName,
      payerEmail,
      true,
    );
    console.log(`📧 [EMAIL] PDF HTML generated, length: ${pdfHTML.length} characters`);

    console.log(`📧 [EMAIL] Calling PDF generation API...`);
    const pdfBuffer = await generatePDFFromAPI(pdfHTML);
    console.log(`📧 [EMAIL] PDF generated successfully, size: ${pdfBuffer.length} bytes`);

    const formatCurrency = (value: number): string => {
      return `₦${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    console.log(`📧 [EMAIL] Preparing email with PDF attachment...`);
    console.log(`📧 [EMAIL] From: Zidwell <${process.env.EMAIL_USER}>`);
    console.log(`📧 [EMAIL] To: ${payerEmail}`);
    console.log(`📧 [EMAIL] Subject: 🧾 Transaction Receipt - ${invoice.invoice_id} - ${formatCurrency(paymentDetails.amount)}`);
    
    const emailResult = await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: payerEmail,
      subject: `🧾 Transaction Receipt - ${invoice.invoice_id} - ${formatCurrency(paymentDetails.amount)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
          
          <h3 style="color: #22c55e;">✅ Payment Successful!</h3>
          
          <p>Dear ${payerName},</p>
          
          <p>Thank you for your payment. Your transaction has been completed successfully.</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h4 style="margin: 0 0 15px 0; color: #FDC020;">Transaction Summary</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;"><strong>Invoice Number:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${invoice.invoice_id}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Amount Paid:</strong></td>
                <td style="padding: 8px 0; text-align: right; color: #22c55e; font-size: 18px; font-weight: bold;">${formatCurrency(paymentDetails.amount)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Payment Method:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${paymentDetails.paymentMethod === "card_payment" ? "Card Payment" : paymentDetails.paymentMethod === "virtual_account" ? "Bank Transfer" : paymentDetails.paymentMethod === "bank_transfer" ? "Bank Transfer" : paymentDetails.paymentMethod}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Transaction ID:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${paymentDetails.transactionId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Payment Date:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${new Date(paymentDetails.paidAt).toLocaleString()}</td>
              </tr>
            </table>
          </div>
          
          <p>Please find attached your official receipt in PDF format.</p>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px;">
            <strong>📌 Important:</strong> Please keep this receipt for your records. You may need it for future reference or warranty claims.
          </div>
          
          <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
          
          <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 20px;">
            This is an automated message from Zidwell. Please do not reply to this email.<br>
            For any questions, please contact support at ${process.env.SUPPORT_EMAIL || "support@zidwell.com"}
          </p>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `receipt_${invoice.invoice_id}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    console.log(`✅ [EMAIL] Receipt PDF sent SUCCESSFULLY to ${payerEmail}`);
    console.log(`📧 [EMAIL] Message ID: ${emailResult.messageId}`);
    console.log(`📧 [EMAIL] ========== END sendTransactionReceiptWithPDF ==========`);
    
    return { success: true, messageId: emailResult.messageId };
  } catch (error) {
    console.error(`❌ [EMAIL] Failed to send transaction receipt with PDF to ${payerEmail}:`, error);
    
    console.log(`📧 [EMAIL] Attempting fallback email without PDF for ${payerEmail}...`);
    try {
      await sendTransactionReceiptFallback(
        payerEmail,
        payerName,
        invoice,
        paymentDetails,
      );
      console.log(`✅ [EMAIL] Fallback email sent successfully to ${payerEmail}`);
      return { success: true, fallback: true };
    } catch (fallbackError) {
      console.error(`❌ [EMAIL] Fallback email also failed for ${payerEmail}:`, fallbackError);
      return { success: false, error: fallbackError instanceof Error ? fallbackError.message : "Unknown error" };
    }
  }
}

// Fallback email without PDF attachment
async function sendTransactionReceiptFallback(
  payerEmail: string,
  payerName: string,
  invoice: any,
  paymentDetails: any,
): Promise<any> {
  console.log(`📧 [EMAIL-FALLBACK] Sending fallback email to ${payerEmail}`);
  
  const formatCurrency = (value: number): string => {
    return `₦${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const emailResult = await transporter.sendMail({
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
  
  console.log(`📧 [EMAIL-FALLBACK] Email sent, messageId: ${emailResult.messageId}`);
  return emailResult;
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
): Promise<{ success: boolean; messageId?: string; error?: string; fallback?: boolean }> {
  console.log(`📧 [EMAIL-PAGE] ========== START sendPaymentPageReceiptWithPDF ==========`);
  console.log(`📧 [EMAIL-PAGE] Recipient: ${customerEmail}`);
  console.log(`📧 [EMAIL-PAGE] Payment Record ID: ${paymentRecord?.id}`);
  console.log(`📧 [EMAIL-PAGE] Amount: ${amount}`);
  console.log(`📧 [EMAIL-PAGE] Transaction ID: ${transactionId}`);
  console.log(`📧 [EMAIL-PAGE] Page Title: ${paymentPage?.title || "N/A"}`);
  
  if (!customerEmail || !customerEmail.includes('@')) {
    console.error(`❌ [EMAIL-PAGE] Invalid email address: ${customerEmail}`);
    return { success: false, error: "Invalid email address" };
  }
  
  try {
    console.log(`📧 [EMAIL-PAGE] Generating PDF HTML...`);
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
    console.log(`📧 [EMAIL-PAGE] PDF HTML generated, length: ${pdfHTML.length} characters`);

    console.log(`📧 [EMAIL-PAGE] Calling PDF generation API...`);
    const pdfBuffer = await generatePDFFromAPI(pdfHTML);
    console.log(`📧 [EMAIL-PAGE] PDF generated successfully, size: ${pdfBuffer.length} bytes`);

    const formatCurrency = (value: number): string => {
      return `₦${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const pageTitle =
      metadata?.pageTitle ||
      paymentPage?.title ||
      paymentPage?.page_title ||
      "Payment Page";

    let paymentMethodText = "Card Payment";
    if (
      paymentMethod === "bank_transfer" ||
      paymentMethod === "virtual_account" ||
      metadata?.bank_transfer === true
    ) {
      paymentMethodText = "Bank Transfer";
    } else if (paymentMethod === "card" || paymentMethod === "card_payment") {
      paymentMethodText = "Card Payment";
    }

    console.log(`📧 [EMAIL-PAGE] Preparing email with PDF attachment for ${customerEmail}`);
    
    const emailResult = await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `✅ Payment Receipt - ${pageTitle} - ${formatCurrency(amount)}`,
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
              <tr>
                <td style="padding: 8px 0;"><strong>Amount Paid:</strong></td>
                <td style="padding: 8px 0; text-align: right; color: #22c55e; font-size: 18px; font-weight: bold;">${formatCurrency(amount)}</td>
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
          
          ${
            metadata?.pageType === "digital" && metadata.downloadUrl
              ? `
            <div style="background: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <strong>📥 Download Your Product:</strong><br>
              <a href="${metadata.downloadUrl}" style="color: #FDC020; font-weight: bold;">Click here to download</a>
              <p style="font-size: 12px; margin-top: 10px;">This download link will expire in 7 days.</p>
            </div>
          `
              : ""
          }
          
          <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
          
          <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 20px;">
            This is an automated message from Zidwell. Please do not reply to this email.<br>
            For any questions, please contact the merchant directly or Zidwell support.
          </p>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `payment_receipt_${transactionId.slice(-8)}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    console.log(`✅ [EMAIL-PAGE] Payment page receipt PDF sent SUCCESSFULLY to ${customerEmail}`);
    console.log(`📧 [EMAIL-PAGE] Message ID: ${emailResult.messageId}`);
    console.log(`📧 [EMAIL-PAGE] ========== END sendPaymentPageReceiptWithPDF ==========`);
    
    return { success: true, messageId: emailResult.messageId };
  } catch (error) {
    console.error(`❌ [EMAIL-PAGE] Failed to send payment page receipt PDF to ${customerEmail}:`, error);
    
    console.log(`📧 [EMAIL-PAGE] Attempting fallback email without PDF for ${customerEmail}...`);
    try {
      await sendPaymentPageReceiptFallback(
        customerEmail,
        paymentPage?.title || "Payment Page",
        amount,
        transactionId,
        metadata,
        paymentMethod,
      );
      console.log(`✅ [EMAIL-PAGE] Fallback email sent successfully to ${customerEmail}`);
      return { success: true, fallback: true };
    } catch (fallbackError) {
      console.error(`❌ [EMAIL-PAGE] Fallback email also failed for ${customerEmail}:`, fallbackError);
      return { success: false, error: fallbackError instanceof Error ? fallbackError.message : "Unknown error" };
    }
  }
}

// Fallback payment page receipt without PDF
async function sendPaymentPageReceiptFallback(
  customerEmail: string,
  pageTitle: string,
  amount: number,
  reference: string,
  metadata?: any,
  paymentMethod: string = "card",
): Promise<void> {
  console.log(`📧 [EMAIL-PAGE-FALLBACK] Sending fallback email to ${customerEmail}`);
  
  const formatCurrency = (value: number): string => {
    return `₦${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const emailResult = await transporter.sendMail({
    from: `Zidwell <${process.env.EMAIL_USER}>`,
    to: customerEmail,
    subject: `Payment Receipt - ${pageTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
        <h3 style="color: #22c55e;">✅ Payment Successful!</h3>
        <p>Thank you for your payment of ${formatCurrency(amount)}.</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
          <p><strong>Page:</strong> ${pageTitle}</p>
          <p><strong>Amount:</strong> ${formatCurrency(amount)}</p>
          <p><strong>Reference:</strong> ${reference}</p>
        </div>
        <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
      </div>
    `,
  });
  
  console.log(`📧 [EMAIL-PAGE-FALLBACK] Email sent, messageId: ${emailResult.messageId}`);
}