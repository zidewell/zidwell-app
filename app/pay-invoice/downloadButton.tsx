"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "../hooks/use-toast";

// Types - Make sure these match your other components
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  item_description?: string;
  unit_price?: number;
  total_amount?: number;
}

// Fixed InvoiceData interface - matching the one from the main page
interface InvoiceData {
  id: string;
  business_name: string;
  business_logo?: string;
  invoice_id: string;
  issue_date: string;
  due_date: string;
  from_name: string;
  from_email: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  bill_to?: string;
  message?: string;
  customer_note?: string;
  invoice_items: InvoiceItem[];
  subtotal: number;
  fee_amount: number;
  total_amount: number;
  paid_amount?: number;
  fee_option: string;
  status: string;
  allow_multiple_payments?: boolean;
  unit?: string;
  initiator_account_name?: string;
  initiator_account_number?: string;
  initiator_bank_name?: string;
  created_at?: string;
  paid_quantity?: number;
  target_quantity?: number;
  initiator_phone?: string;
}

interface DownloadInvoiceButtonProps {
  invoiceData: InvoiceData;
}

// Helper functions
const getPaymentProgress = (invoice: InvoiceData): number => {
  if (!invoice.paid_amount || !invoice.total_amount) return 0;
  return (invoice.paid_amount / invoice.total_amount) * 100;
};

const getPaymentCountText = (invoice: any): string => {
  if (!invoice.payment_count) return "";
  return invoice.payment_count === 1
    ? "1 payment"
    : `${invoice.payment_count} payments`;
};

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

export default function DownloadInvoiceButton({
  invoiceData,
}: DownloadInvoiceButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    try {
      setLoading(true);

      // Get the logo
      const logoBase64 = await getBase64Logo();

      // Calculate values with proper type safety
      const invoiceItems = Array.isArray(invoiceData.invoice_items)
        ? invoiceData.invoice_items
        : [];

      const subtotal =
        invoiceData.subtotal ||
        invoiceItems.reduce((sum: number, item: InvoiceItem) => {
          const unitPrice = item.unitPrice || item.unit_price || 0;
          const quantity = item.quantity || 0;
          return sum + quantity * unitPrice;
        }, 0);

      const feeAmount = invoiceData.fee_amount || 0;
      const totalAmount = invoiceData.total_amount || subtotal + feeAmount;
      const paidAmount = invoiceData.paid_amount || 0;

      const paymentProgress = getPaymentProgress(invoiceData);
      const paymentCountText = getPaymentCountText(invoiceData);

      // Get status color
      const getStatusColor = (status: string): string => {
        switch (status?.toLowerCase()) {
          case "paid": return "#00B64F";
          case "unpaid": return "#FDC020";
          case "partially_paid": return "#3b82f6";
          case "overdue": return "#ef4444";
          case "cancelled": return "#6b7280";
          default: return "#6b7280";
        }
      };

      const statusColor = getStatusColor(invoiceData.status);

      // Format dates safely
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

      // Generate HTML content for PDF with Zidwell design
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice ${invoiceData.invoice_id}</title>
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
              width: 44px;
              height: 44px;
              border-radius: 50%;
              object-fit: cover;
              flex-shrink: 0;
            }
            
            .brand-icon {
              width: 44px;
              height: 44px;
              border-radius: 50%;
              background: #1a1a1a;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 700;
              font-size: 20px;
              flex-shrink: 0;
            }
            
            .brand-name {
              font-size: 28px;
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
            
            /* Payment Info */
            .payment-info {
              background: #f0f9ff;
              padding: 16px 20px;
              border-radius: 8px;
              border-left: 4px solid #3b82f6;
              margin: 20px 0;
            }
            
            .payment-info h3 {
              font-size: 16px;
              font-weight: 700;
              color: #1a1a1a;
              margin-bottom: 8px;
            }
            
            .payment-info p {
              font-size: 14px;
              color: #4b5563;
              margin: 4px 0;
            }
            
            .progress-bar {
              background-color: #e5e7eb;
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
            
            .multiple-payment-info {
              background: #fef3c7;
              padding: 16px 20px;
              border-radius: 8px;
              border-left: 4px solid #f59e0b;
              margin: 20px 0;
            }
            
            .multiple-payment-info h3 {
              font-size: 16px;
              font-weight: 700;
              color: #1a1a1a;
              margin-bottom: 8px;
            }
            
            .multiple-payment-info p {
              font-size: 14px;
              color: #4b5563;
              margin: 4px 0;
            }
            
            .message-box {
              background: #f8fafc;
              padding: 16px 20px;
              border-radius: 8px;
              border-left: 4px solid #FDC020;
              margin: 20px 0;
            }
            
            .message-box h3 {
              font-size: 16px;
              font-weight: 700;
              color: #1a1a1a;
              margin-bottom: 4px;
            }
            
            .message-box p {
              font-size: 14px;
              color: #4b5563;
            }
            
            .note-box {
              background: #f0f9ff;
              padding: 16px 20px;
              border-radius: 8px;
              border-left: 4px solid #0ea5e9;
              margin: 20px 0;
            }
            
            .note-box h3 {
              font-size: 16px;
              font-weight: 700;
              color: #1a1a1a;
              margin-bottom: 4px;
            }
            
            .note-box p {
              font-size: 14px;
              color: #4b5563;
            }
            
            .fee-note {
              text-align: right;
              font-size: 12px;
              color: #9ca3af;
              margin-top: 4px;
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
                  <img src="${logoBase64}" alt="${invoiceData.business_name}" class="brand-logo">
                ` : `
                  <div class="brand-icon">${invoiceData.business_name ? invoiceData.business_name.charAt(0).toUpperCase() : 'Z'}</div>
                `}
                <span class="brand-name">${invoiceData.business_name || "Zidwell"}</span>
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
                  <div class="name-large">${invoiceData.from_name}</div>
                  <div class="email-text">${invoiceData.from_email}</div>
                </div>
              </div>

              <div class="meta-list">
                <div class="meta-row">
                  <span class="meta-label">Invoice #:</span>
                  <span class="meta-value">${invoiceData.invoice_id}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Issue Date:</span>
                  <span class="meta-value">${formatDate(invoiceData.issue_date)}</span>
                </div>
                ${invoiceData.due_date ? `
                  <div class="meta-row">
                    <span class="meta-label">Due Date:</span>
                    <span class="meta-value">${formatDate(invoiceData.due_date)}</span>
                  </div>
                ` : ""}
                <div class="meta-row">
                  <span class="meta-label">Status:</span>
                  <span class="status-badge">${invoiceData.status}</span>
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
                Ensure this invoice number <strong>${invoiceData.invoice_id}</strong> is used as the narration when you transfer to make payment valid.
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
                  <div class="party-name">${invoiceData.client_name || "Client"}</div>
                  ${invoiceData.client_email ? `<div class="party-detail">${invoiceData.client_email}</div>` : ""}
                  ${invoiceData.client_phone ? `<div class="party-detail">${invoiceData.client_phone}</div>` : ""}
                </div>
              </div>
              ${invoiceData.initiator_account_name && invoiceData.initiator_account_number ? `
                <div class="party-block">
                  <div class="icon-circle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div>
                    <span class="party-label-badge">Account Details</span>
                    <div class="party-name" style="font-size: 18px;">${invoiceData.initiator_account_name}</div>
                    <div class="account-number">${invoiceData.initiator_account_number}</div>
                    ${invoiceData.initiator_bank_name ? `<div class="party-detail">${invoiceData.initiator_bank_name}</div>` : ""}
                  </div>
                </div>
              ` : ""}
            </section>

            ${invoiceData.message ? `
              <div class="message-box">
                <h3>Message from ${invoiceData.from_name}:</h3>
                <p>${invoiceData.message}</p>
              </div>
            ` : ""}

            ${invoiceData.allow_multiple_payments && invoiceData.target_quantity ? `
              <div class="multiple-payment-info">
                <h3>Multiple Payments Plan</h3>
                <p><strong>Payment Progress:</strong> ${invoiceData.paid_quantity || 0} of ${invoiceData.target_quantity} payments completed</p>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${((invoiceData.paid_quantity || 0) / (invoiceData.target_quantity || 1)) * 100}%"></div>
                </div>
              </div>
            ` : paidAmount > 0 ? `
              <div class="payment-info">
                <h3>Payment Information</h3>
                <p><strong>Amount Paid:</strong> ₦${Number(paidAmount).toLocaleString()}</p>
                <p><strong>Balance Due:</strong> ₦${Number(totalAmount - paidAmount).toLocaleString()}</p>
                ${paymentCountText ? `<p><strong>Payments:</strong> ${paymentCountText}</p>` : ""}
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${paymentProgress}%"></div>
                </div>
                <p>Payment Progress: ${Math.round(paymentProgress)}%</p>
              </div>
            ` : ""}

            <!-- Items -->
            <section class="items-section">
              <h2 class="items-title">Invoice Items</h2>
              
              <div class="watermark">${invoiceData.business_name ? invoiceData.business_name.charAt(0).toUpperCase() : 'Z'}</div>
              
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
                        <td>₦${Number(item.unit_price || item.unitPrice || 0).toLocaleString()}</td>
                        <td>₦${Number(item.total_amount || item.total || 0).toLocaleString()}</td>
                      </tr>
                    `).join("")}
                    <tr class="subtotal-row">
                      <td colspan="2"></td>
                      <td class="subtotal-label">Subtotal</td>
                      <td class="subtotal-value">₦${Number(subtotal).toLocaleString()}</td>
                    </tr>
                    ${feeAmount > 0 ? `
                      <tr class="subtotal-row">
                        <td colspan="2"></td>
                        <td class="subtotal-label">Fee</td>
                        <td class="subtotal-value">₦${Number(feeAmount).toLocaleString()}</td>
                      </tr>
                    ` : ""}
                    <tr class="total-row">
                      <td colspan="2"></td>
                      <td class="total-label">TOTAL AMOUNT:</td>
                      <td class="total-value">₦${Number(totalAmount).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              ${invoiceData.fee_option === "absorbed" ? `
                <div class="fee-note">*Processing fees absorbed by merchant</div>
              ` : invoiceData.fee_option === "customer" && feeAmount > 0 ? `
                <div class="fee-note">*2% processing fee added</div>
              ` : ""}
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
                  please contact <span class="contact-email">${invoiceData.from_email}</span>
                </p>
              </div>
            </footer>

            ${invoiceData.customer_note ? `
              <div class="note-box">
                <h3>Note to Customer:</h3>
                <p>${invoiceData.customer_note}</p>
              </div>
            ` : ""}

            <div class="generated-at">
              Generated on ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })} at ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
          </div>
        </body>
        </html>
      `;

      // Call the PDF generation API
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html: htmlContent,
          filename: `invoice-${invoiceData.invoice_id}.pdf`,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to generate PDF: ${response.status} - ${errorText}`,
        );
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `invoice-${invoiceData.invoice_id}-${Date.now()}.pdf`;

      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "PDF Downloaded Successfully",
        description: `Invoice ${invoiceData.invoice_id} has been downloaded.`,
      });
    } catch (error) {
      console.error("PDF download error:", error);
      toast({
        title: "Download Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full border-[var(--color-accent-yellow)] text-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/10 rounded-xl"
      onClick={handleDownloadPDF}
      disabled={loading}
    >
      <Download className="mr-2 h-4 w-4" />
      {loading ? "Generating PDF..." : "Download Invoice"}
    </Button>
  );
}