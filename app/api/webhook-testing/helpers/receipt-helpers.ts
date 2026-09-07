import { transporter } from "@/lib/node-mailer";

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL
    : process.env.NEXT_PUBLIC_BASE_URL;

const headerImageUrl = `${baseUrl}/zidwell-header.png`;
const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

export async function sendTransactionReceipt(
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
) {
  try {
    const {
      amount,
      nombaFee,
      netAmount,
      transactionId,
      paymentMethod,
      paidAt,
      narration,
    } = paymentDetails;

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
    const remainingBalance = totalAmount - (invoice.paid_amount || 0) + amount;

    const formatDate = (dateString: string): string => {
      try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? dateString : date.toLocaleDateString();
      } catch {
        return dateString;
      }
    };

    const formatCurrency = (value: number): string => {
      return `₦${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transaction Receipt - ${invoice.invoice_id}</title>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
          }
          .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .receipt-header {
            background: linear-gradient(135deg, #FDC020 0%, #1a5c40 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .receipt-header h1 {
            margin: 0;
            font-size: 28px;
          }
          .receipt-header p {
            margin: 10px 0 0;
            opacity: 0.9;
          }
          .receipt-content {
            padding: 30px;
          }
          .transaction-status {
            background: #22c55e;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .info-section {
            margin-bottom: 25px;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid #FDC020;
          }
          .info-section h3 {
            margin: 0 0 10px 0;
            color: #FDC020;
            font-size: 16px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            font-weight: 600;
            color: #475569;
          }
          .info-value {
            color: #1e293b;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .items-table th {
            background: #f1f5f9;
            padding: 12px;
            text-align: left;
            font-size: 14px;
            font-weight: 600;
            color: #475569;
          }
          .items-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          .totals {
            margin-top: 20px;
            text-align: right;
            padding-top: 15px;
            border-top: 2px solid #e2e8f0;
          }
          .total-row {
            padding: 5px 0;
          }
          .grand-total {
            font-size: 20px;
            font-weight: bold;
            color: #FDC020;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #FDC020;
          }
          .payment-summary {
            background: #f0fdf4;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #bbf7d0;
          }
          .footer {
            text-align: center;
            padding: 20px 30px;
            background: #f8fafc;
            color: #64748b;
            font-size: 12px;
            border-top: 1px solid #e2e8f0;
          }
          .note {
            background: #fef3c7;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="receipt-header">
            <img src="${headerImageUrl}" style="max-height: 60px; margin-bottom: 15px;" />
            <h1>TRANSACTION RECEIPT</h1>
            <p>Payment Confirmation</p>
          </div>
          
          <div class="receipt-content">
            <div style="text-align: center;">
              <span class="transaction-status">✓ PAYMENT SUCCESSFUL</span>
            </div>

            <div class="info-section">
              <h3>Receipt Information</h3>
              <div class="info-row">
                <span class="info-label">Receipt Number:</span>
                <span class="info-value">RCP-${invoice.invoice_id}-${transactionId.slice(-8)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Transaction ID:</span>
                <span class="info-value">${transactionId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Date:</span>
                <span class="info-value">${new Date(paidAt).toLocaleString()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Method:</span>
                <span class="info-value">${paymentMethod}</span>
              </div>
              ${
                narration
                  ? `
              <div class="info-row">
                <span class="info-label">Narration:</span>
                <span class="info-value">${narration}</span>
              </div>
              `
                  : ""
              }
            </div>

            <div class="info-section">
              <h3>Invoice Details</h3>
              <div class="info-row">
                <span class="info-label">Invoice Number:</span>
                <span class="info-value">${invoice.invoice_id}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Issue Date:</span>
                <span class="info-value">${formatDate(invoice.issue_date)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Due Date:</span>
                <span class="info-value">${formatDate(invoice.due_date)}</span>
              </div>
            </div>

            <div class="info-section">
              <h3>Payer Information</h3>
              <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value">${payerName || invoice.client_name || "N/A"}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${payerEmail || invoice.client_email || "N/A"}</span>
              </div>
            </div>

            <div class="info-section">
              <h3>Merchant Information</h3>
              <div class="info-row">
                <span class="info-label">Business Name:</span>
                <span class="info-value">${invoice.business_name || invoice.from_name || "N/A"}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${invoice.from_email || invoice.business_email || "N/A"}</span>
              </div>
            </div>

            ${
              invoiceItems.length > 0
                ? `
              <h3 style="margin: 20px 0 10px; color: #FDC020;">Items Purchased</h3>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th width="80">Qty</th>
                    <th width="120">Unit Price</th>
                    <th width="120">Total</th>
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

            <div class="payment-summary">
              <h3 style="margin: 0 0 15px 0; color: #166534;">Payment Summary</h3>
              <div class="info-row">
                <span class="info-label">Amount Paid:</span>
                <span class="info-value" style="color: #16a34a; font-weight: bold;">${formatCurrency(amount)}</span>
              </div>
              ${
                nombaFee > 0
                  ? `
              <div class="info-row">
                <span class="info-label">Processing Fee:</span>
                <span class="info-value">${formatCurrency(nombaFee)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Net Amount Credited:</span>
                <span class="info-value">${formatCurrency(netAmount)}</span>
              </div>
              `
                  : ""
              }
            </div>

            <div class="totals">
              <div class="total-row"><strong>Subtotal:</strong> ${formatCurrency(subtotal)}</div>
              ${invoice.fee_amount > 0 ? `<div class="total-row"><strong>Processing Fee:</strong> ${formatCurrency(invoice.fee_amount)}</div>` : ""}
              <div class="total-row"><strong>Total Invoice Amount:</strong> ${formatCurrency(totalAmount)}</div>
              ${
                remainingBalance > 0
                  ? `
                <div class="total-row"><strong>Remaining Balance:</strong> ${formatCurrency(remainingBalance)}</div>
              `
                  : ""
              }
              <div class="grand-total">
                <strong>PAYMENT RECEIVED:</strong> ${formatCurrency(amount)}
              </div>
            </div>

            ${
              remainingBalance > 0
                ? `
              <div class="note">
                <strong>⚠️ Note:</strong> This is a partial payment. Remaining balance of ${formatCurrency(remainingBalance)} is still due.
              </div>
            `
                : `
              <div class="note" style="background: #dcfce7; color: #166534;">
                <strong>✅ Invoice Fully Paid:</strong> Thank you for your payment. This invoice has been fully settled.
              </div>
            `
            }

            ${
              invoice.customer_note
                ? `
              <div class="info-section">
                <h3>Note from Merchant</h3>
                <p style="margin: 0; color: #475569;">${invoice.customer_note}</p>
              </div>
            `
                : ""
            }
          </div>

          <div class="footer">
            <img src="${footerImageUrl}" style="max-height: 40px; margin-bottom: 10px;" />
            <p>This is an official transaction receipt. Please retain for your records.</p>
            <p>For any questions regarding this transaction, please contact ${invoice.from_email || invoice.business_email}</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: payerEmail,
      subject: `🧾 Transaction Receipt - ${invoice.invoice_id} - ${formatCurrency(amount)}`,
      html: receiptHTML,
    });

    console.log(
      `✅ Receipt sent to ${payerEmail} for invoice ${invoice.invoice_id}`,
    );
  } catch (error) {
    console.error("Failed to send transaction receipt:", error);
  }
}
