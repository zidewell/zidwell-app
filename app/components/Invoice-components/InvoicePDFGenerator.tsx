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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f5f5f5;
      padding: 40px 20px;
      color: #1a1a1a;
      line-height: 1.6;
    }
    
    .invoice-container {
      max-width: 880px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 6px 16px rgba(0, 0, 0, 0.06);
      padding: 48px 56px;
    }
    
    /* Header */
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
    }
    
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .brand-logo {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }
    
    .brand-name {
      font-size: 20px;
      font-weight: 600;
      letter-spacing: -0.5px;
      color: #1a1a1a;
    }
    
    .invoice-title-wrapper {
      text-align: right;
    }
    
    .invoice-title {
      font-size: 40px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #1a1a1a;
      margin: 0;
      line-height: 1;
    }
    
    .title-underline {
      width: 64px;
      height: 4px;
      background: #FDC020;
      border-radius: 4px;
      margin-top: 8px;
      margin-left: auto;
    }
    
    /* Meta Section */
    .meta-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-top: 40px;
    }
    
    .from-block {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding-right: 32px;
      border-right: 1px solid #e5e7eb;
    }
    
    .icon-circle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #FEF3C7;
      color: #FDC020;
      flex-shrink: 0;
    }
    
    .label-small {
      font-size: 13px;
      font-weight: 600;
      color: #FDC020;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .name-large {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a1a;
      margin-top: 4px;
    }
    
    .email-text {
      font-size: 14px;
      color: #6b7280;
    }
    
    .meta-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-left: 4px;
    }
    
    .meta-row {
      display: grid;
      grid-template-columns: 110px 1fr;
      align-items: center;
      gap: 8px;
    }
    
    .meta-label {
      font-size: 14px;
      color: #6b7280;
    }
    
    .meta-value {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
    }
    
    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      background: ${statusColor}20;
      color: ${statusColor};
    }
    
    /* Info Banner */
    .info-banner {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-top: 32px;
      padding: 16px 20px;
      background: #FEF3C7;
      border-radius: 8px;
    }
    
    .info-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid #FDC020;
      color: #FDC020;
      flex-shrink: 0;
    }
    
    .info-text {
      font-size: 14px;
      color: #1a1a1a;
      line-height: 1.6;
    }
    
    .info-text strong {
      color: #FDC020;
      font-weight: 700;
    }
    
    /* Parties */
    .parties-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-top: 32px;
    }
    
    .party-block {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }
    
    .party-label-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 4px;
      background: #FEF3C7;
      font-size: 13px;
      font-weight: 600;
      color: #FDC020;
    }
    
    .party-name {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a1a;
      margin-top: 6px;
    }
    
    .party-detail {
      font-size: 14px;
      color: #6b7280;
    }
    
    .account-number {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a1a;
      margin-top: 2px;
    }
    
    /* Items Table */
    .items-section {
      position: relative;
      margin-top: 48px;
    }
    
    .items-title {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 16px;
    }
    
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 18rem;
      font-weight: 900;
      color: #f3f4f6;
      opacity: 0.5;
      pointer-events: none;
      user-select: none;
      line-height: 1;
      z-index: 0;
    }
    
    .table-wrapper {
      position: relative;
      overflow-x: auto;
      z-index: 1;
    }
    
    .items-table {
      width: 100%;
      min-width: 520px;
      border-collapse: collapse;
    }
    
    .items-table thead th {
      text-align: left;
      padding: 0 16px 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .items-table thead th:last-child {
      padding-right: 0;
    }
    
    .table-divider {
      height: 2px;
      background: #FDC020;
      border: none;
      margin: 0 0 4px 0;
    }
    
    .items-table tbody td {
      padding: 20px 16px 20px 0;
      font-size: 14px;
      color: #1a1a1a;
      border-bottom: 1px solid #f3f4f6;
    }
    
    .items-table tbody td:last-child {
      padding-right: 0;
    }
    
    .items-table tbody tr:last-child td {
      border-bottom: none;
    }
    
    .subtotal-row td {
      padding: 16px 16px 4px 0 !important;
      border-bottom: none !important;
    }
    
    .subtotal-label {
      text-align: right;
      font-size: 14px;
      color: #6b7280;
    }
    
    .subtotal-value {
      font-size: 16px;
      font-weight: 700;
      color: #1a1a1a;
    }
    
    .total-row td {
      padding: 4px 16px 20px 0 !important;
      border-bottom: none !important;
    }
    
    .total-label {
      text-align: right;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #1a1a1a;
    }
    
    .total-value {
      font-size: 28px;
      font-weight: 800;
      color: #FDC020;
    }
    
    /* Footer Divider */
    .footer-divider {
      height: 2px;
      background: #FDC020;
      margin-top: 40px;
      border: none;
    }
    
    /* Footer */
    .footer {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-top: 32px;
    }
    
    .footer-text {
      font-size: 14px;
    }
    
    .footer-text strong {
      font-weight: 700;
      color: #1a1a1a;
    }
    
    .footer-text .contact-email {
      font-weight: 500;
      color: #FDC020;
    }
    
    .footer-muted {
      color: #6b7280;
      margin-top: 4px;
    }
    
    .generated-at {
      margin-top: 40px;
      font-size: 12px;
      color: #6b7280;
    }
    
    @media print {
      body {
        background: white;
        padding: 20px;
      }
      .invoice-container {
        box-shadow: none;
        border-radius: 0;
        padding: 40px;
      }
    }
    
    @media (max-width: 640px) {
      .invoice-container {
        padding: 24px;
      }
      .header {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
      }
      .invoice-title-wrapper {
        text-align: left;
      }
      .title-underline {
        margin-left: 0;
      }
      .meta-section {
        grid-template-columns: 1fr;
        gap: 24px;
      }
      .from-block {
        border-right: none;
        padding-right: 0;
      }
      .parties-section {
        grid-template-columns: 1fr;
        gap: 24px;
      }
      .meta-row {
        grid-template-columns: 100px 1fr;
      }
      .meta-value {
        font-size: 16px;
      }
      .watermark {
        font-size: 10rem;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <header class="header">
      <div class="brand">
        ${logoBase64 ? `
          <img src="${logoBase64}" alt="Zidwell Logo" class="brand-logo">
        ` : `
          <div style="width: 44px; height: 44px; border-radius: 50%; background: #1a1a1a; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 20px; flex-shrink: 0;">Z</div>
        `}
        <span class="brand-name">${invoice.business_name || "Zidwell"}</span>
      </div>
      <div class="invoice-title-wrapper">
        <h1 class="invoice-title">INVOICE</h1>
        <div class="title-underline"></div>
      </div>
    </header>

    <!-- Meta + From -->
    <section class="meta-section">
      <div class="from-block">
        <div class="icon-circle">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div>
          <div class="label-small">From:</div>
          <div class="name-large">${invoice.from_name}</div>
          <div class="email-text">${invoice.from_email}</div>
        </div>
      </div>

      <div class="meta-list">
        <div class="meta-row">
          <span class="meta-label">Invoice #:</span>
          <span class="meta-value">${invoice.invoice_id}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Issue Date:</span>
          <span class="meta-value">${formatDate(invoice.issue_date)}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Status:</span>
          <span class="status-badge">${invoice.status}</span>
        </div>
      </div>
    </section>

    <!-- Info Banner -->
    <div class="info-banner">
      <div class="info-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="12" x2="12" y2="16"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      </div>
      <p class="info-text">
        Ensure this invoice number <strong>${invoice.invoice_id}</strong> is used as the narration when you transfer to make payment valid.
      </p>
    </div>

    <!-- Bill To + Account Details -->
    <section class="parties-section">
      <div class="party-block">
        <div class="icon-circle">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
        </div>
        <div>
          <span class="party-label-badge">Bill To:</span>
          <div class="party-name">${invoice.client_name || "Client"}</div>
          <div class="party-detail">${invoice.client_email}</div>
        </div>
      </div>
      ${invoice.initiator_account_name && invoice.initiator_account_number ? `
        <div class="party-block">
          <div class="icon-circle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <span class="party-label-badge">Account Details</span>
            <div class="party-name" style="font-size: 18px;">${invoice.initiator_account_name}</div>
            <div class="account-number">${invoice.initiator_account_number}</div>
            ${invoice.initiator_bank_name ? `<div class="party-detail">${invoice.initiator_bank_name}</div>` : ""}
          </div>
        </div>
      ` : ""}
    </section>

    <!-- Items -->
    <section class="items-section">
      <h2 class="items-title">Invoice Items</h2>
      
      <div class="watermark">${invoice.business_name ? invoice.business_name.charAt(0).toUpperCase() : 'Z'}</div>
      
      <div class="table-wrapper">
        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
            <tr>
              <td colspan="4"><div class="table-divider"></div></td>
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
            <tr class="subtotal-row">
              <td colspan="2"></td>
              <td class="subtotal-label">Subtotal</td>
              <td class="subtotal-value">${formatCurrency(invoice.subtotal)}</td>
            </tr>
            ${invoice.fee_amount > 0 ? `
              <tr class="subtotal-row">
                <td colspan="2"></td>
                <td class="subtotal-label">Fee</td>
                <td class="subtotal-value">${formatCurrency(invoice.fee_amount)}</td>
              </tr>
            ` : ""}
            <tr class="total-row">
              <td colspan="2"></td>
              <td class="total-label">TOTAL AMOUNT:</td>
              <td class="total-value">${formatCurrency(invoice.total_amount)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Footer Divider -->
    <hr class="footer-divider">

    <!-- Thank you -->
    <footer class="footer">
      <div class="icon-circle" style="background: #FEF3C7; color: #FDC020;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </div>
      <div class="footer-text">
        <strong>Thank you for your business!</strong>
        <p class="footer-muted">
          If you have any questions about this invoice,<br>
          please contact <span class="contact-email">${invoice.from_email}</span>
        </p>
      </div>
    </footer>

    <div class="generated-at">
      Generated on ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })} at ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </div>
  </div>
</body>
</html>`;
  };

  const downloadPDF = async () => {
    setIsGenerating(true);
    
    try {
      const logoBase64 = await getBase64Logo();
      const fullHtml = generateInvoiceHTML(logoBase64);
      
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