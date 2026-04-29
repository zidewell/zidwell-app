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

// Helper function to generate PDF HTML content for Invoice
function generateInvoicePDFHTML(invoice: any, paymentDetails: any, payerName: string, payerEmail: string, isReceipt: boolean = true): string {
  const invoiceItems = Array.isArray(invoice.invoice_items) ? invoice.invoice_items : [];
  
  const subtotal = invoice.subtotal || invoiceItems.reduce(
    (sum: number, item: any) =>
      sum + (item.quantity || 0) * (item.unit_price || item.unitPrice || 0),
    0
  );

  const totalAmount = invoice.total_amount || subtotal + (invoice.fee_amount || 0);
  const paidAmount = paymentDetails?.amount || invoice.paid_amount || 0;
  const remainingBalance = totalAmount - paidAmount;
  const isFullyPaid = remainingBalance <= 0;

  const formatCurrency = (value: number): string => {
    return `₦${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${isReceipt ? 'Payment Receipt' : 'Invoice'} - ${invoice.invoice_id}</title>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background: #f5f5f5;
          padding: 40px 20px;
        }
        
        .document-container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #2b825b 0%, #1a5c40 100%);
          color: white;
          padding: 40px;
          text-align: center;
        }
        
        .header img {
          max-height: 60px;
          margin-bottom: 20px;
        }
        
        .header h1 {
          font-size: 32px;
          margin-bottom: 10px;
          letter-spacing: 1px;
        }
        
        .header .badge {
          display: inline-block;
          padding: 8px 20px;
          background: rgba(255,255,255,0.2);
          border-radius: 30px;
          font-size: 14px;
          margin-top: 15px;
        }
        
        .content {
          padding: 40px;
        }
        
        .status-badge {
          display: inline-block;
          padding: 8px 20px;
          border-radius: 30px;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 30px;
        }
        
        .status-paid {
          background: #22c55e;
          color: white;
        }
        
        .status-partial {
          background: #f59e0b;
          color: white;
        }
        
        .status-pending {
          background: #ef4444;
          color: white;
        }
        
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }
        
        .info-section {
          background: #f8fafc;
          padding: 20px;
          border-radius: 12px;
          border-left: 4px solid #2b825b;
          margin-bottom: 25px;
        }
        
        .info-section h3 {
          color: #2b825b;
          font-size: 16px;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 1px;
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
          text-align: right;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 25px 0;
        }
        
        .items-table th {
          background: #f1f5f9;
          padding: 15px;
          text-align: left;
          font-weight: 600;
          color: #475569;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .items-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #e2e8f0;
          color: #334155;
        }
        
        .items-table tr:last-child td {
          border-bottom: none;
        }
        
        .totals {
          margin-top: 30px;
          text-align: right;
          padding-top: 20px;
          border-top: 2px solid #e2e8f0;
        }
        
        .total-line {
          padding: 8px 0;
          display: flex;
          justify-content: flex-end;
          gap: 30px;
        }
        
        .total-line strong {
          min-width: 150px;
          text-align: left;
        }
        
        .grand-total {
          font-size: 24px;
          font-weight: bold;
          color: #2b825b;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 2px solid #2b825b;
        }
        
        .payment-summary {
          background: #f0fdf4;
          padding: 20px;
          border-radius: 12px;
          margin: 25px 0;
          border: 1px solid #bbf7d0;
        }
        
        .payment-summary h3 {
          color: #166534;
          margin-bottom: 15px;
        }
        
        .note {
          background: #fef3c7;
          padding: 15px 20px;
          border-radius: 10px;
          margin: 25px 0;
          border-left: 4px solid #f59e0b;
          font-size: 14px;
          color: #92400e;
        }
        
        .success-note {
          background: #dcfce7;
          border-left-color: #22c55e;
          color: #166534;
        }
        
        .footer {
          background: #f8fafc;
          padding: 30px 40px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        
        .footer img {
          max-height: 40px;
          margin-bottom: 15px;
        }
        
        .footer p {
          color: #64748b;
          font-size: 12px;
          margin: 5px 0;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          .document-container {
            box-shadow: none;
            border-radius: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="document-container">
        <div class="header">
          <img src="${headerImageUrl}" alt="Zidwell Logo" />
          <h1>${isReceipt ? 'PAYMENT RECEIPT' : 'INVOICE'}</h1>
          <div class="badge">${isReceipt ? 'Official Payment Receipt' : 'Tax Invoice'}</div>
        </div>
        
        <div class="content">
          <div style="text-align: center; margin-bottom: 20px;">
            <span class="status-badge ${isFullyPaid ? 'status-paid' : remainingBalance > 0 && paidAmount > 0 ? 'status-partial' : 'status-pending'}">
              ${isFullyPaid ? '✓ PAID IN FULL' : remainingBalance > 0 && paidAmount > 0 ? '⚠ PARTIALLY PAID' : '○ PENDING PAYMENT'}
            </span>
          </div>
          
          <div class="grid-2">
            <div class="info-section">
              <h3>📄 DOCUMENT INFORMATION</h3>
              <div class="info-row">
                <span class="info-label">${isReceipt ? 'Receipt Number:' : 'Invoice Number:'}</span>
                <span class="info-value">${invoice.invoice_id}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date Issued:</span>
                <span class="info-value">${formatDate(invoice.issue_date)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Due Date:</span>
                <span class="info-value">${formatDate(invoice.due_date)}</span>
              </div>
              ${paymentDetails?.transactionId ? `
              <div class="info-row">
                <span class="info-label">Transaction ID:</span>
                <span class="info-value">${paymentDetails.transactionId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Date:</span>
                <span class="info-value">${formatDate(paymentDetails.paidAt)}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="info-section">
              <h3>🏢 BUSINESS INFORMATION</h3>
              <div class="info-row">
                <span class="info-label">Business Name:</span>
                <span class="info-value">${invoice.business_name || invoice.from_name || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${invoice.from_email || invoice.business_email || 'N/A'}</span>
              </div>
              ${invoice.from_address ? `
              <div class="info-row">
                <span class="info-label">Address:</span>
                <span class="info-value">${invoice.from_address}</span>
              </div>
              ` : ''}
            </div>
          </div>
          
          <div class="grid-2">
            <div class="info-section">
              <h3>👤 CUSTOMER INFORMATION</h3>
              <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value">${payerName || invoice.client_name || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${payerEmail || invoice.client_email || 'N/A'}</span>
              </div>
              ${invoice.client_phone ? `
              <div class="info-row">
                <span class="info-label">Phone:</span>
                <span class="info-value">${invoice.client_phone}</span>
              </div>
              ` : ''}
            </div>
            
            ${paymentDetails?.paymentMethod ? `
            <div class="info-section">
              <h3>💳 PAYMENT DETAILS</h3>
              <div class="info-row">
                <span class="info-label">Payment Method:</span>
                <span class="info-value">${paymentDetails.paymentMethod === 'card_payment' ? 'Card Payment' : 
                  paymentDetails.paymentMethod === 'virtual_account' ? 'Bank Transfer' : 
                  paymentDetails.paymentMethod === 'bank_transfer' ? 'Bank Transfer' :
                  paymentDetails.paymentMethod || 'N/A'}</span>
              </div>
              ${paymentDetails.narration ? `
              <div class="info-row">
                <span class="info-label">Narration:</span>
                <span class="info-value">${paymentDetails.narration}</span>
              </div>
              ` : ''}
            </div>
            ` : ''}
          </div>
          
          ${invoiceItems.length > 0 ? `
            <h3 style="margin: 25px 0 15px; color: #2b825b;">📦 ITEMS / SERVICES</h3>
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
                ${invoiceItems.map((item: any) => `
                  <tr>
                    <td>${item.item_description || item.description || ''}</td>
                    <td style="text-align: center;">${item.quantity || 0}</td>
                    <td style="text-align: right;">${formatCurrency(item.unit_price || item.unitPrice || 0)}</td>
                    <td style="text-align: right;">${formatCurrency(item.total_amount || item.total || (item.quantity || 0) * (item.unit_price || item.unitPrice || 0))}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}
          
          <div class="totals">
            <div class="total-line">
              <strong>Subtotal:</strong>
              <span>${formatCurrency(subtotal)}</span>
            </div>
            ${invoice.fee_amount > 0 ? `
            <div class="total-line">
              <strong>Processing Fee:</strong>
              <span>${formatCurrency(invoice.fee_amount)}</span>
            </div>
            ` : ''}
            ${invoice.discount_amount > 0 ? `
            <div class="total-line">
              <strong>Discount:</strong>
              <span>-${formatCurrency(invoice.discount_amount)}</span>
            </div>
            ` : ''}
            <div class="total-line">
              <strong>Total Invoice Amount:</strong>
              <span>${formatCurrency(totalAmount)}</span>
            </div>
            ${paidAmount > 0 ? `
            <div class="total-line">
              <strong>Amount Paid:</strong>
              <span style="color: #22c55e;">${formatCurrency(paidAmount)}</span>
            </div>
            ` : ''}
            ${remainingBalance > 0 ? `
            <div class="total-line">
              <strong>Remaining Balance:</strong>
              <span style="color: #f59e0b;">${formatCurrency(remainingBalance)}</span>
            </div>
            ` : ''}
            <div class="grand-total">
              ${isReceipt ? 'PAYMENT RECEIVED:' : isFullyPaid ? 'AMOUNT DUE: ₦0.00' : 'AMOUNT DUE:'}
              ${isReceipt ? formatCurrency(paidAmount) : isFullyPaid ? '' : formatCurrency(remainingBalance)}
            </div>
          </div>
          
          ${paymentDetails && !isReceipt ? `
          <div class="payment-summary">
            <h3>💰 Payment Summary</h3>
            <div class="info-row">
              <span class="info-label">Amount Paid:</span>
              <span class="info-value" style="color: #16a34a; font-weight: bold;">${formatCurrency(paymentDetails.amount)}</span>
            </div>
            ${paymentDetails.nombaFee > 0 ? `
            <div class="info-row">
              <span class="info-label">Processing Fee:</span>
              <span class="info-value">${formatCurrency(paymentDetails.nombaFee)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Net Amount Credited:</span>
              <span class="info-value">${formatCurrency(paymentDetails.netAmount)}</span>
            </div>
            ` : ''}
          </div>
          ` : ''}
          
          ${remainingBalance > 0 && !isFullyPaid ? `
            <div class="note">
              <strong>⚠️ Note:</strong> This is a partial payment. The remaining balance of ${formatCurrency(remainingBalance)} is still due. 
              Please settle the outstanding amount before the due date.
            </div>
          ` : isFullyPaid && !isReceipt ? `
            <div class="note success-note">
              <strong>✅ Invoice Fully Paid:</strong> Thank you for your payment. This invoice has been fully settled.
            </div>
          ` : ''}
          
          ${invoice.terms_and_conditions ? `
            <div class="info-section">
              <h3>📋 Terms & Conditions</h3>
              <p style="margin: 0; color: #475569; line-height: 1.5;">${invoice.terms_and_conditions}</p>
            </div>
          ` : ''}
          
          ${invoice.customer_note ? `
            <div class="info-section">
              <h3>📝 Note from Merchant</h3>
              <p style="margin: 0; color: #475569; line-height: 1.5;">${invoice.customer_note}</p>
            </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <img src="${footerImageUrl}" alt="Zidwell Footer" />
          <p>This is an official ${isReceipt ? 'payment receipt' : 'tax invoice'}. Please retain for your records.</p>
          <p>For any questions regarding this ${isReceipt ? 'receipt' : 'invoice'}, please contact ${invoice.from_email || invoice.business_email}</p>
          <p>Generated on ${new Date().toLocaleString('en-NG')}</p>
          <p style="margin-top: 10px;">© ${new Date().getFullYear()} Zidwell. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper function to generate Payment Page PDF HTML
function generatePaymentPagePDFHTML(
  paymentPage: any,
  paymentRecord: any,
  customerName: string,
  customerEmail: string,
  amount: number,
  transactionId: string,
  paymentMethod: string,
  paidAt: string,
  metadata?: any
): string {
  const formatCurrency = (value: number): string => {
    return `₦${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Get page title from metadata or paymentPage object
  const pageTitle = metadata?.pageTitle || paymentPage?.title || paymentPage?.page_title || 'Payment Page';
  
  // FIXED: Properly determine payment method text
  let paymentMethodText = 'Card Payment';
  
  // Check paymentMethod parameter first
  if (paymentMethod === 'bank_transfer' || paymentMethod === 'virtual_account') {
    paymentMethodText = 'Bank Transfer';
  } 
  // Then check metadata
  else if (metadata?.payment_method === 'bank_transfer' || 
           metadata?.bank_transfer === true || 
           metadata?.payment_type === 'backtransfer') {
    paymentMethodText = 'Bank Transfer';
  }
  // Check payment record payment_method
  else if (paymentRecord?.payment_method === 'bank_transfer') {
    paymentMethodText = 'Bank Transfer';
  }
  // Default to card payment
  else if (paymentMethod === 'card' || paymentMethod === 'card_payment') {
    paymentMethodText = 'Card Payment';
  }
  
  let additionalInfo = '';
  
  if (metadata?.pageType === 'school') {
    additionalInfo = `
      <div class="info-section">
        <h3>🎓 Student Information</h3>
        <div class="info-row">
          <span class="info-label">Student Name:</span>
          <span class="info-value">${metadata.childName || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Registration Number:</span>
          <span class="info-value">${metadata.regNumber || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Parent Name:</span>
          <span class="info-value">${metadata.parentName || 'N/A'}</span>
        </div>
      </div>
    `;
  } else if (metadata?.pageType === 'physical' && metadata.address) {
    additionalInfo = `
      <div class="info-section">
        <h3>📦 Shipping Information</h3>
        <div class="info-row">
          <span class="info-label">Quantity:</span>
          <span class="info-value">${metadata.quantity || 1}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Shipping Address:</span>
          <span class="info-value">${metadata.address}</span>
        </div>
      </div>
    `;
  } else if (metadata?.pageType === 'services' && metadata.bookingDate) {
    additionalInfo = `
      <div class="info-section">
        <h3>📅 Booking Details</h3>
        <div class="info-row">
          <span class="info-label">Date:</span>
          <span class="info-value">${metadata.bookingDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Time:</span>
          <span class="info-value">${metadata.bookingTime || 'N/A'}</span>
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
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background: #f5f5f5;
          padding: 40px 20px;
        }
        
        .receipt-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #2b825b 0%, #1a5c40 100%);
          color: white;
          padding: 40px;
          text-align: center;
        }
        
        .header img {
          max-height: 60px;
          margin-bottom: 20px;
        }
        
        .header h1 {
          font-size: 32px;
          margin-bottom: 10px;
        }
        
        .success-badge {
          display: inline-block;
          padding: 8px 20px;
          background: #22c55e;
          border-radius: 30px;
          font-size: 14px;
          font-weight: bold;
          margin-top: 15px;
        }
        
        .content {
          padding: 40px;
        }
        
        .info-section {
          background: #f8fafc;
          padding: 20px;
          border-radius: 12px;
          border-left: 4px solid #2b825b;
          margin-bottom: 25px;
        }
        
        .info-section h3 {
          color: #2b825b;
          font-size: 16px;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 1px;
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
          text-align: right;
        }
        
        .amount-box {
          background: linear-gradient(135deg, #2b825b 0%, #1a5c40 100%);
          color: white;
          padding: 30px;
          border-radius: 12px;
          text-align: center;
          margin: 25px 0;
        }
        
        .amount-box .label {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 10px;
        }
        
        .amount-box .amount {
          font-size: 48px;
          font-weight: bold;
        }
        
        .note {
          background: #fef3c7;
          padding: 15px 20px;
          border-radius: 10px;
          margin: 25px 0;
          border-left: 4px solid #f59e0b;
          font-size: 14px;
          color: #92400e;
        }
        
        .footer {
          background: #f8fafc;
          padding: 30px 40px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        
        .footer img {
          max-height: 40px;
          margin-bottom: 15px;
        }
        
        .footer p {
          color: #64748b;
          font-size: 12px;
          margin: 5px 0;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          .receipt-container {
            box-shadow: none;
            border-radius: 0;
          }
          .success-badge, .amount-box {
            print-color-adjust: exact;
          }
        }
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
          
          <div class="info-section">
            <h3>💰 TRANSACTION DETAILS</h3>
            <div class="info-row">
              <span class="info-label">Transaction ID:</span>
              <span class="info-value">${transactionId}</span>
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
              <span class="info-value">${paymentRecord.order_reference || 'N/A'}</span>
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
          <p>For any questions regarding this transaction, please contact the merchant directly.</p>
          <p>Generated on ${new Date().toLocaleString('en-NG')}</p>
          <p style="margin-top: 10px;">© ${new Date().getFullYear()} Zidwell. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Function to call your PDF generation API
async function generatePDFFromAPI(html: string): Promise<Buffer> {
  try {
    const response = await fetch(`${baseUrl}/api/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
  }
) {
  try {
    // Generate PDF HTML
    const pdfHTML = generateInvoicePDFHTML(invoice, paymentDetails, payerName, payerEmail, true);
    
    // Generate PDF using your API
    const pdfBuffer = await generatePDFFromAPI(pdfHTML);

    const formatCurrency = (value: number): string => {
      return `₦${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    await transporter.sendMail({
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
            <h4 style="margin: 0 0 15px 0; color: #2b825b;">Transaction Summary</h4>
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
                <td style="padding: 8px 0; text-align: right;">${paymentDetails.paymentMethod === 'card_payment' ? 'Card Payment' : paymentDetails.paymentMethod === 'virtual_account' ? 'Bank Transfer' : paymentDetails.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : paymentDetails.paymentMethod}</td>
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
            For any questions, please contact support at ${process.env.SUPPORT_EMAIL || 'support@zidwell.com'}
          </p>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `receipt_${invoice.invoice_id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log(`✅ Receipt PDF sent to ${payerEmail} for invoice ${invoice.invoice_id}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send transaction receipt with PDF:", error);
    // Fallback to original email without PDF
    try {
      await sendTransactionReceiptFallback(payerEmail, payerName, invoice, paymentDetails);
    } catch (fallbackError) {
      console.error("Fallback email also failed:", fallbackError);
    }
    throw error;
  }
}

// Fallback email without PDF attachment
async function sendTransactionReceiptFallback(
  payerEmail: string,
  payerName: string,
  invoice: any,
  paymentDetails: any
) {
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
      metadata
    );
    
    // Generate PDF using your API
    const pdfBuffer = await generatePDFFromAPI(pdfHTML);

    const formatCurrency = (value: number): string => {
      return `₦${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Get page title from metadata or paymentPage
    const pageTitle = metadata?.pageTitle || paymentPage?.title || paymentPage?.page_title || 'Payment Page';
    
    // FIXED: Determine payment method text for email
    let paymentMethodText = 'Card Payment';
    if (paymentMethod === 'bank_transfer' || paymentMethod === 'virtual_account' || metadata?.bank_transfer === true) {
      paymentMethodText = 'Bank Transfer';
    } else if (paymentMethod === 'card' || paymentMethod === 'card_payment') {
      paymentMethodText = 'Card Payment';
    }

    await transporter.sendMail({
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
            <h4 style="margin: 0 0 15px 0; color: #2b825b;">Payment Details</h4>
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
          
          ${metadata?.pageType === 'digital' && metadata.downloadUrl ? `
            <div style="background: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <strong>📥 Download Your Product:</strong><br>
              <a href="${metadata.downloadUrl}" style="color: #2b825b; font-weight: bold;">Click here to download</a>
              <p style="font-size: 12px; margin-top: 10px;">This download link will expire in 7 days.</p>
            </div>
          ` : ''}
          
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
          contentType: 'application/pdf',
        },
      ],
    });

    console.log(`✅ Payment page receipt PDF sent to ${customerEmail}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send payment page receipt PDF:", error);
    // Fallback to original email without PDF
    try {
      await sendPaymentPageReceiptFallback(
        customerEmail,
        paymentPage?.title || 'Payment Page',
        amount,
        transactionId,
        metadata,
        paymentMethod
      );
    } catch (fallbackError) {
      console.error("Fallback email also failed:", fallbackError);
    }
    throw error;
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
  const formatCurrency = (value: number): string => {
    return `₦${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  await transporter.sendMail({
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
}