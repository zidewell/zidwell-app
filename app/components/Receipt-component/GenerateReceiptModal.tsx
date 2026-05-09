"use client";

import { useEffect, useState } from "react";
import { Copy, Download, Check, FileText, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";

interface GenerateReceiptModalProps {
  open: boolean;
  onClose: () => void;
  receiptId: string;
  signingLink?: string;
  onCopyLink?: (link: string) => void;
  receiptData?: any;
}

export const GenerateReceiptModal: React.FC<GenerateReceiptModalProps> = ({
  open,
  onClose,
  receiptId,
  signingLink,
  onCopyLink,
  receiptData,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [base64Logo, setBase64Logo] = useState<string>("");

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch("/logo.png");
        if (response.ok) {
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => setBase64Logo(reader.result as string);
          reader.readAsDataURL(blob);
        }
      } catch (error) {
        console.error("Error loading logo:", error);
      }
    };
    loadLogo();
  }, []);

  if (!open) return null;

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Receipt link copied to clipboard");

      setTimeout(() => setCopied(false), 2000);

      if (onCopyLink) {
        onCopyLink(link);
      }
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const parseReceiptItems = (items: any) => {
    try {
      if (Array.isArray(items)) return items;
      if (typeof items === "string") return JSON.parse(items);
      return [];
    } catch (error) {
      console.error("Error parsing receipt items:", error);
      return [];
    }
  };

  const downloadPdf = async () => {
    if (!base64Logo) {
      toast.error("Logo is still loading. Please try again.");
      return;
    }

    setIsDownloading(true);
    toast.loading("Generating PDF...", { id: "pdf-download" });

    try {
      if (receiptData) {
        await generatePdfFromData(receiptData);
        return;
      }

      const receiptResponse = await fetch(
        `/api/receipt/get-receipt/${receiptId}`,
      );
      if (!receiptResponse.ok) throw new Error("Failed to fetch receipt data");

      const receipt = await receiptResponse.json();
      await generatePdfFromData(receipt);
    } catch (err) {
      console.error("PDF download failed:", err);
      toast.error("Failed to download PDF. Please try again.", {
        id: "pdf-download",
      });
      setIsDownloading(false);
    }
  };

  const generatePdfFromData = async (receipt: any) => {
    try {
      const receiptItems = parseReceiptItems(receipt.receipt_items);
      const formattedItems = receiptItems.map((item: any, index: number) => ({
        description: item.description || item.item || "N/A",
        quantity: item.quantity,
        unit_price: item.unit_price || item.price || 0,
        amount:
          item.total || item.quantity * (item.unit_price || item.price || 0),
        index: index + 1,
      }));

      const fullHtml = `<!DOCTYPE html>
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
      padding: 40px; 
    }
    @media print { body { padding: 0; } @page { margin: 20mm; } }
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
      background: #FDC020; 
      padding: 32px; 
      color: #191919; 
    }
    .content { padding: 32px; }
    .items-table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    .items-table th, .items-table td { padding: 12px; border: 1px solid #E5E5E5; text-align: left; }
    .items-table th { background: #F5F5F5; font-weight: 600; }
    .total { 
      text-align: right; 
      font-size: 20px; 
      font-weight: bold; 
      margin-top: 24px; 
      padding-top: 16px; 
      border-top: 2px solid #E5E5E5; 
      color: #FDC020;
    }
    .section { margin-bottom: 24px; }
    .section-title { 
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 600; 
      margin-bottom: 12px; 
      color: #191919; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${receipt.business_logo ? `<img src="${receipt.business_logo}" style="max-height: 60px; margin-bottom: 16px;" />` : ""}
      <h2 style="font-family: 'Space Grotesk', sans-serif; font-weight: 600;">${receipt.business_name || receipt.initiator_name}</h2>
      <p>Receipt #: ${receipt.receipt_id}</p>
    </div>
    <div class="content">
      <div class="section">
        <p><strong>Issued to:</strong> ${receipt.client_name}</p>
        <p><strong>Date:</strong> ${formatDate(receipt.issue_date)}</p>
        <p><strong>Email:</strong> ${receipt.client_email || "Not provided"}</p>
      </div>
      
      <h3 class="section-title">Items</h3>
      <table class="items-table">
        <thead>
          <tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
        </thead>
        <tbody>
          ${formattedItems
            .map(
              (item: any) => `
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
      追逐
      
      <div class="total">Total: ${formatCurrency(receipt.total)}</div>
      
      <div class="section" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E5E5E5;">
        <p style="font-size: 12px; color: #666666; text-align: center;">
          This receipt was generated electronically by Zidwell Receipts.
          Verification code: ${receipt.verification_code || "N/A"}
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

      const pdfResponse = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: fullHtml }),
      });

      if (!pdfResponse.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await pdfResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${receipt.receipt_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("PDF downloaded successfully!", { id: "pdf-download" });
      setIsDownloading(false);
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF. Please try again.", {
        id: "pdf-download",
      });
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-(--bg-primary) rounded-xl p-6 max-w-2xl w-full mx-4 shadow-pop max-h-[90vh] overflow-y-auto border border-(--border-color) squircle-lg">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-(--color-lemon-green)/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-(--color-lemon-green)"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-(--text-primary) mb-2">
            Receipt Created Successfully! 🎉
          </h3>
          <p className="text-(--text-secondary)">
            Your receipt has been generated and is ready to share.
          </p>
        </div>

        <div className="space-y-4 py-4">
          {/* Download Option */}
          <div className="rounded-lg border-2 border-(--border-color) p-4 hover:border-(--color-accent-yellow) transition-colors squircle-md">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-(--bg-secondary) flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-(--text-secondary)" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-(--text-primary)">
                  Download PDF
                </h3>
                <p className="text-sm text-(--text-secondary) mt-1">
                  Download receipt as PDF with your signature.
                </p>
                <Button
                  onClick={downloadPdf}
                  disabled={isDownloading}
                  className="mt-3 bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 min-w-[140px] squircle-md"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Share Link Option */}
          {signingLink && (
            <div className="rounded-lg border-2 border-(--border-color) p-4 hover:border-(--color-accent-yellow) transition-colors squircle-md">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-(--bg-secondary) flex items-center justify-center shrink-0">
                  <svg
                    className="h-5 w-5 text-(--text-secondary)"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-(--text-primary)">
                    Share Receipt Link
                  </h3>
                  <p className="text-sm text-(--text-secondary) mt-1">
                    Send this link to the receiver. They can view and
                    acknowledge the receipt.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <div className="flex-1 rounded-lg bg-(--bg-secondary) px-3 py-2 text-sm font-mono text-(--text-secondary) truncate">
                      {signingLink}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(signingLink)}
                      className="shrink-0 border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary) squircle-sm"
                      disabled={isDownloading}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-(--color-lemon-green)" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-(--bg-secondary) rounded-lg squircle-md">
          <p className="text-sm text-(--text-secondary) text-center">
            <span className="font-medium">Receipt ID:</span> {receiptId}
          </p>
        </div>

        <div className="mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary) squircle-md"
            disabled={isDownloading}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
