"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import Swal from "sweetalert2";

export interface ReceiptData {
  receipt_id: string;
  business_name: string;
  business_logo?: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  initiator_email: string;
  initiator_name: string;
  initiator_phone?: string;
  issue_date: string;
  payment_for: string;
  payment_method: string;
  subtotal: number;
  total: number;
  status: "draft" | "pending" | "signed";
  verification_code?: string;
  customer_note?: string;
  receipt_items: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  seller_signature?: string;
  client_signature?: string;
  signed_at?: string | null;
}

interface ReceiptPDFGeneratorProps {
  receipt: ReceiptData;
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "ghost";
  buttonSize?: "sm" | "default" | "lg";
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const ReceiptPDFGenerator: React.FC<ReceiptPDFGeneratorProps> = ({
  receipt,
  buttonText = "Download PDF",
  buttonVariant = "outline",
  buttonSize = "sm",
  className = "",
  onSuccess,
  onError,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [base64Logo, setBase64Logo] = useState<string>("");

  const getLogoBase64 = async (): Promise<string> => {
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

  const generateReceiptHTML = (logoBase64: string): string => {
    const hasSellerSignature =
      receipt.seller_signature &&
      receipt.seller_signature !== "null" &&
      receipt.seller_signature !== "";
    const hasClientSignature =
      receipt.client_signature &&
      receipt.client_signature !== "null" &&
      receipt.client_signature !== "";
    const signedDate = receipt.signed_at
      ? formatDate(receipt.signed_at)
      : formatDate(receipt.issue_date);
    const formattedItems = receipt.receipt_items.map((item, index) => ({
      description: item.description || "N/A",
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.total,
      index: index + 1,
    }));

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Receipt - ${receipt.receipt_id}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', sans-serif; 
      background-color: #F5F5F5; 
      color: #191919; 
      line-height: 1.5; 
      padding: 10px;
    }
    @media print { body { padding: 0; } @page { margin: 20mm; } }
    @media (min-width: 640px) { body { padding: 40px; } }
    .container { 
      max-width: 100%;
     
    }
    @media (min-width: 768px) { .container { max-width: 800px; } }
    .header { 
      background: #FDC020; 
      padding: 20px; 
      color: #191919; 
    }
    @media (min-width: 640px) { .header { padding: 32px; } }
    .content { padding: 20px; }
    @media (min-width: 640px) { .content { padding: 32px; } }
    .items-table { width: 100%; border-collapse: collapse; margin: 16px 0; overflow-x: auto; display: block; }
    @media (min-width: 640px) { .items-table { display: table; } }
    .items-table th, .items-table td { padding: 8px; border: 1px solid #E5E5E5; text-align: left; font-size: 12px; }
    @media (min-width: 640px) { .items-table th, .items-table td { padding: 12px; font-size: 14px; } }
    .items-table th { background: #F5F5F5; font-weight: 600; }
    .total { 
      text-align: right; 
      font-size: 16px; 
      font-weight: bold; 
      margin-top: 16px; 
      padding-top: 12px; 
      border-top: 2px solid #E5E5E5; 
      color: #FDC020;
    }
    @media (min-width: 640px) { .total { font-size: 20px; margin-top: 24px; padding-top: 16px; } }
    .section { margin-bottom: 16px; }
    @media (min-width: 640px) { .section { margin-bottom: 24px; } }
    .section-title { 
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 600; 
      margin-bottom: 8px; 
      color: #191919; 
      font-size: 16px;
    }
    @media (min-width: 640px) { .section-title { font-size: 18px; margin-bottom: 12px; } }
    .signature-box {
      background: #F5F5F5;
      border-radius: 12px;
      padding: 16px;
      margin-top: 16px;
    }
    .signature-image {
      max-height: 60px;
      max-width: 180px;
      object-fit: contain;
    }
    .footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #E5E5E5;
      font-size: 12px;
      color: #666666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logoBase64 ? `<img src="${logoBase64}" alt="Zidwell Logo" style="max-height: 50px; margin-bottom: 16px;" />` : ""}
      ${receipt.business_logo && !logoBase64 ? `<img src="${receipt.business_logo}" alt="Logo" style="max-height: 50px; margin-bottom: 16px;" />` : ""}
      <h2 style="font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 20px;">${receipt.business_name || receipt.initiator_name}</h2>
      <p>Receipt #: ${receipt.receipt_id}</p>
      <p>Issued on: ${formatDate(receipt.issue_date)}</p>
    </div>
    <div class="content">
      <div class="section">
        <p><strong>Issued to:</strong> ${receipt.client_name}</p>
        <p><strong>Email:</strong> ${receipt.client_email || "Not provided"}</p>
        ${receipt.client_phone ? `<p><strong>Phone:</strong> ${receipt.client_phone}</p>` : ""}
      </div>
      
      <h3 class="section-title">Items</h3>
      <table class="items-table">
        <thead>
          <tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
        </thead>
        <tbody>
          ${formattedItems
            .map(
              (item) => `
            <tr>
              <td>${item.description}</td>
              <td>${item.quantity}</td>
              <td>${formatCurrency(item.unit_price)}</td>
              <td>${formatCurrency(item.amount)}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
      
      <div class="total">Total: ${formatCurrency(receipt.total)}</div>
      
      <div class="section" style="margin-top: 16px;">
        <p><strong>Payment Method:</strong> ${receipt.payment_method === "transfer" ? "Bank Transfer" : receipt.payment_method || "Not specified"}</p>
        <p><strong>Payment For:</strong> ${receipt.payment_for || "General"}</p>
      </div>
      
      ${
        receipt.customer_note
          ? `
      <div class="section">
        <p><strong>Note:</strong> ${receipt.customer_note}</p>
      </div>
      `
          : ""
      }
      
      <div class="signature-box">
        <h3 class="section-title" style="margin-bottom: 12px;">Signatures</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div>
            <p style="font-weight: 600;">Seller's Signature</p>
            <p style="font-size: 12px;">${receipt.business_name || receipt.initiator_name}</p>
            <div style="margin-top: 8px; min-height: 60px;">
              ${
                hasSellerSignature
                  ? `<img src="${receipt.seller_signature}" alt="Seller signature" class="signature-image" />`
                  : '<p style="color: #999; font-size: 12px;">No signature provided</p>'
              }
            </div>
          </div>
          <div>
            <p style="font-weight: 600;">Client's Signature</p>
            <p style="font-size: 12px;">${receipt.client_name}</p>
            <div style="margin-top: 8px; min-height: 60px;">
              ${
                hasClientSignature
                  ? `<img src="${receipt.client_signature}" alt="Client signature" class="signature-image" />`
                  : '<p style="color: #999; font-size: 12px;">Awaiting signature</p>'
              }
            </div>
          </div>
        </div>
        ${hasClientSignature ? `<p style="margin-top: 12px; font-size: 11px; color: #666;">Signed on: ${signedDate}</p>` : ""}
      </div>
      
    
      
      <div class="footer">
        <p>This receipt was generated electronically by Zidwell Receipts</p>
        <p style="margin-top: 8px; font-size: 10px;">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  const downloadPDF = async () => {
    setIsGenerating(true);

    try {
      const logo = await getLogoBase64();
      const fullHtml = generateReceiptHTML(logo);

      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: fullHtml,
          filename: `receipt-${receipt.receipt_id}.pdf`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${receipt.receipt_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      Swal.fire({
        icon: "success",
        title: "PDF Downloaded!",
        text: "Your receipt has been downloaded as PDF",
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
        text:
          error instanceof Error
            ? error.message
            : "Failed to download PDF. Please try again.",
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

export default ReceiptPDFGenerator;
