// components/InvoicePDFGenerator.tsx
"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import Swal from "sweetalert2";

export interface InvoiceData {
  invoice_id: string;
  business_name: string;
  business_logo?: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  from_email: string;
  from_name: string;
  initiator_phone?: string;
  issue_date: string;
  due_date?: string;
  status: "draft" | "unpaid" | "paid" | "overdue" | "cancelled" | "partially_paid";
  payment_type: "single" | "multiple" | string;
  fee_option: "absorbed" | "customer" | string;
  subtotal: number;
  fee_amount: number;
  total_amount: number;
  paid_amount?: number;
  paid_quantity?: number;
  target_quantity?: number;
  allow_multiple_payments?: boolean;
  message?: string;
  customer_note?: string;
  invoice_items: Array<{
    id: string;
    item_description: string;
    description?: string;
    quantity: number;
    unit_price: number;
    unitPrice?: number;
    total_amount: number;
    total?: number;
  }>;
  initiator_account_name?: string;
  initiator_account_number?: string;
  initiator_bank_name?: string;
  verification_code?: string;
  bill_to?: string;
}

interface InvoicePDFGeneratorProps {
  invoice: InvoiceData;
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "ghost";
  buttonSize?: "sm" | "default" | "lg";
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const InvoicePDFGenerator: React.FC<InvoicePDFGeneratorProps> = ({
  invoice,
  buttonText = "Download PDF",
  buttonVariant = "outline",
  buttonSize = "sm",
  className = "",
  onSuccess,
  onError,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [base64Logo, setBase64Logo] = useState<string>("");

  const getBase64Logo = async (): Promise<string> => {
    try {
      const response = await fetch("/logo.png");
      if (!response.ok) throw new Error("Logo not found");
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error loading logo:", error);
      return "";
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) 
        ? dateString 
        : date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
    } catch {
      return dateString;
    }
  };

  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case "paid": return "#00B64F";
      case "unpaid": return "#FDC020";
      case "partially_paid": return "#3b82f6";
      case "overdue": return "#ef4444";
      case "cancelled": return "#6b7280";
      default: return "#6b7280";
    }
  };

  const getPaymentProgress = () => {
    if (invoice.allow_multiple_payments && invoice.target_quantity && invoice.target_quantity > 0) {
      const paidCount = invoice.paid_quantity || 0;
      const progress = (paidCount / invoice.target_quantity) * 100;
      return { paidCount, targetQuantity: invoice.target_quantity, progress, isComplete: paidCount >= invoice.target_quantity };
    }
    if (invoice.paid_amount && invoice.total_amount) {
      return { progress: (invoice.paid_amount / invoice.total_amount) * 100 };
    }
    return null;
  };

  const generateInvoiceHTML = (logoBase64: string): string => {
    const paymentProgress = getPaymentProgress();
    const statusColor = getStatusBadgeColor(invoice.status);
    const paidAmount = invoice.paid_amount || 0;
    const remainingAmount = invoice.total_amount - paidAmount;
    
    const invoiceItems = Array.isArray(invoice.invoice_items) ? invoice.invoice_items : [];

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoice_id}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      background: #f7f3ee;
      padding: 40px 20px;
      color: #191919;
      line-height: 1.5;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 1px solid #E5E5E5;
      border-radius: 28px;
      overflow: hidden;
      box-shadow: 0 20px 35px -8px rgba(0, 0, 0, 0.15), 0 5px 12px -4px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: #FDC020;
      padding: 32px;
      color: #191919;
      border-bottom: 2px solid #E5E5E5;
    }
    
    .business-info {
      flex: 1;
    }
    
    .invoice-info {
      text-align: right;
    }
    
    .logo {
      max-height: 80px;
      max-width: 200px;
      margin-bottom: 15px;
    }
    
    .account-details {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 20px;
    }
    
    .account-details h2 {
      color: #191919;
      font-size: 18px;
      margin: 0 0 5px 0;
    }
    
    .account-details h3 {
      margin: 0;
      font-size: 14px;
      font-weight: normal;
      color: #191919;
    }
    
    h1 {
      color: #191919;
      margin: 0 0 10px 0;
      font-size: 32px;
      font-weight: bold;
    }
    
    h2 {
      margin: 0 0 10px 0;
      font-size: 24px;
      color: #191919;
    }
    
    h3 {
      margin: 0 0 15px 0;
      font-size: 18px;
      color: #191919;
    }
    
    .section {
      margin: 30px 0;
    }
    
    .billing-info {
      display: flex;
      justify-content: space-between;
      gap: 40px;
    }
    
    .billing-section {
      flex: 1;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
      font-size: 14px;
    }
    
    .items-table th {
      background-color: #F5F5F5;
      border: 1px solid #E5E5E5;
      padding: 12px 15px;
      text-align: left;
      font-weight: bold;
      color: #191919;
    }
    
    .items-table td {
      border: 1px solid #E5E5E5;
      padding: 12px 15px;
      text-align: left;
    }
    
    .items-table tr:nth-child(even) {
      background-color: #F5F5F5;
    }
    
    .totals {
      margin-top: 30px;
      text-align: right;
      font-size: 16px;
    }
    
    .total-row {
      margin: 8px 0;
    }
    
    .grand-total {
      font-size: 20px;
      font-weight: bold;
      color: #FDC020;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 2px solid #E5E5E5;
    }
    
    .message-box {
      background-color: #F5F5F5;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #FDC020;
      margin: 20px 0;
    }
    
    .payment-info {
      background-color: #e8f4fd;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #2196F3;
      margin: 20px 0;
    }
    
    .invoice-narration {
      display: block;
      margin-top: 10px;
      font-size: 12px;
      color: #666666;
    }
    
    .footer {
      margin-top: 50px;
      text-align: center;
      color: #666666;
      font-size: 14px;
      padding-top: 20px;
      border-top: 1px solid #E5E5E5;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      background-color: #FDC020;
      color: #191919;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      margin-left: 10px;
    }
    
    .progress-bar {
      background-color: #E5E5E5;
      border-radius: 10px;
      height: 10px;
      margin: 10px 0;
      overflow: hidden;
    }
    
    .progress-fill {
      background-color: #FDC020;
      height: 100%;
      transition: width 0.3s ease;
    }
    
    .note-box {
      background-color: #f0f9ff;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #0ea5e9;
    }
    
    .payment-progress-info {
      margin-top: 15px;
    }
    
    .multiple-payment-info {
      background-color: #fef3c7;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
      margin: 20px 0;
    }
    
    .content {
      padding: 32px;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="business-info">
        ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" class="logo">` : ""}
        ${invoice.business_logo && !logoBase64 ? `<img src="${invoice.business_logo}" alt="Logo" class="logo">` : ""}
        <h2>${invoice.business_name}</h2>
        <p>${invoice.from_email}</p>
        ${invoice.bill_to ? `<p>${invoice.bill_to}</p>` : ""}

        ${invoice.initiator_account_name && invoice.initiator_account_number ? `
          <div class="account-details">
            <h2>Account Details</h2>
            <h3>${invoice.initiator_account_name}</h3>
            <h3>${invoice.initiator_account_number}</h3>
            <h3>${invoice.initiator_bank_name || ""}</h3>
          </div>
        ` : ""}
      </div>
      <div class="invoice-info">
        <h1>INVOICE</h1>
        <p><strong>Invoice #:</strong> ${invoice.invoice_id}</p>
        <p><strong>Issue Date:</strong> ${formatDate(invoice.issue_date)}</p>
        ${invoice.due_date ? `<p><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</p>` : ""}
        <p><strong>Status:</strong> ${invoice.status} <span class="status-badge">${invoice.status.toUpperCase()}</span></p>

        <small class="invoice-narration">
          Ensure this invoice number <strong>${invoice.invoice_id}</strong> is used as the narration when you transfer to make payment valid.
        </small>
      </div>
    </div>

    <div class="content">
      <div class="section">
        <div class="billing-info">
          <div class="billing-section">
            <h3>Bill To:</h3>
            <p><strong>${invoice.client_name || "Client Information"}</strong></p>
            ${invoice.client_email ? `<p>📧 ${invoice.client_email}</p>` : ""}
            ${invoice.client_phone ? `<p>📞 ${invoice.client_phone}</p>` : ""}
          </div>
          <div class="billing-section">
            <h3>From:</h3>
            <p><strong>${invoice.from_name}</strong></p>
            <p>📧 ${invoice.from_email}</p>
            ${invoice.initiator_phone ? `<p>📞 ${invoice.initiator_phone}</p>` : ""}
          </div>
        </div>
      </div>

      ${invoice.message ? `
        <div class="section">
          <div class="message-box">
            <h3>Message from ${invoice.from_name}:</h3>
            <p>${invoice.message}</p>
          </div>
        </div>
      ` : ""}

      ${invoice.allow_multiple_payments && paymentProgress ? `
        <div class="section">
          <div class="multiple-payment-info">
            <h3>Multiple Payments Plan</h3>
            <p><strong>Payment Progress:</strong> ${paymentProgress.paidCount} of ${paymentProgress.targetQuantity} payments completed</p>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${paymentProgress.progress}%"></div>
            </div>
            <p>${paymentProgress.isComplete ? "✅ All payments completed!" : `⏳ ${Math.round(paymentProgress.progress)}% complete`}</p>
          </div>
        </div>
      ` : paidAmount > 0 ? `
        <div class="section">
          <div class="payment-info">
            <h3>Payment Information</h3>
            <p><strong>Amount Paid:</strong> ${formatCurrency(paidAmount)}</p>
            <p><strong>Balance Due:</strong> ${formatCurrency(remainingAmount)}</p>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${(paidAmount / invoice.total_amount) * 100}%"></div>
            </div>
            <p>Payment Progress: ${Math.round((paidAmount / invoice.total_amount) * 100)}%</p>
          </div>
        </div>
      ` : ""}

      <div class="section">
        <h3>Invoice Items</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th width="100">Qty</th>
              <th width="120">Unit Price</th>
              <th width="120">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceItems.map((item) => `
              <tr>
                <td>${item.item_description || item.description || ""}</td>
                <td>${item.quantity || 0}</td>
                <td>${formatCurrency(item.unit_price || item.unitPrice || 0)}</td>
                <td>${formatCurrency(item.total_amount || item.total || 0)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="totals">
        <div class="total-row">
          <strong>Subtotal:</strong> ${formatCurrency(invoice.subtotal)}
        </div>
        ${invoice.fee_amount > 0 ? `
          <div class="total-row">
            <strong>Processing Fee:</strong> ${formatCurrency(invoice.fee_amount)}
          </div>
        ` : ""}
        ${paidAmount > 0 ? `
          <div class="total-row">
            <strong>Amount Paid:</strong> ${formatCurrency(paidAmount)}
          </div>
          <div class="total-row">
            <strong>Balance Due:</strong> ${formatCurrency(remainingAmount)}
          </div>
        ` : ""}
        <div class="total-row grand-total">
          <strong>TOTAL AMOUNT:</strong> ${formatCurrency(invoice.total_amount)}
        </div>
        ${invoice.fee_option === "absorbed" ? `
          <div class="total-row" style="font-size: 12px; color: #666666;">
            *Processing fees absorbed by merchant
          </div>
        ` : invoice.fee_option === "customer" && invoice.fee_amount > 0 ? `
          <div class="total-row" style="font-size: 12px; color: #666666;">
            *2% processing fee added
          </div>
        ` : ""}
      </div>

      ${invoice.customer_note ? `
        <div class="section">
          <div class="note-box">
            <h3>Note to Customer:</h3>
            <p>${invoice.customer_note}</p>
          </div>
        </div>
      ` : ""}
    </div>

    <div class="footer">
      <p><strong>Thank you for your business!</strong></p>
      <p>If you have any questions about this invoice, please contact ${invoice.from_email}</p>
      <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    </div>
  </div>
</body>
</html>`;
  };

  const downloadPDF = async () => {
    setIsGenerating(true);
    
    try {
      const logo = await getBase64Logo();
      const fullHtml = generateInvoiceHTML(logo);
      
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: fullHtml, filename: `invoice-${invoice.invoice_id}.pdf` }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoice_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      Swal.fire({
        icon: "success",
        title: "PDF Downloaded!",
        text: "Your invoice has been downloaded as PDF",
        confirmButtonColor: "var(--color-accent-yellow)",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        customClass: { popup: "squircle-lg" },
      });
      
      onSuccess?.();
    } catch (error) {
      console.error("PDF download error:", error);
      Swal.fire({
        icon: "error",
        title: "Download Failed",
        text: error instanceof Error ? error.message : "Failed to download PDF. Please try again.",
        confirmButtonColor: "var(--color-accent-yellow)",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        customClass: { popup: "squircle-lg" },
      });
      onError?.(error as Error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant={buttonVariant}
      size={buttonSize}
      onClick={downloadPDF}
      disabled={isGenerating}
      className={className}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          {buttonText}
        </>
      )}
    </Button>
  );
};

export default InvoicePDFGenerator;