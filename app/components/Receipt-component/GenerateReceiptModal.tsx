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
      padding: 20px;
    }
    @media print { body { padding: 0; } @page { margin: 20mm; } }
    @media (min-width: 640px) { body { padding: 40px; } }
    .container { 
      max-width: 100%;
      margin: 0 auto; 
      background: #FFFFFF; 
      overflow: hidden; 
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
    .receipt-id { font-size: 10px; word-break: break-all; }
    @media (min-width: 640px) { .receipt-id { font-size: 12px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${receipt.business_logo ? `<img src="${receipt.business_logo}" style="max-height: 40px; margin-bottom: 12px;" />` : ""}
      <h2 style="font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 18px;">${receipt.business_name || receipt.initiator_name}</h2>
      <p class="receipt-id">Receipt #: ${receipt.receipt_id}</p>
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
      </table>
      
      <div class="total">Total: ${formatCurrency(receipt.total)}</div>
      
      <div class="section" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #E5E5E5;">
        <p style="font-size: 10px; color: #666666; text-align: center;">
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-primary)] rounded-xl p-4 sm:p-6 sm:max-w-lg md:max-w-4xl w-full mx-auto shadow-pop max-h-[90vh] overflow-y-auto border border-[var(--border-color)] squircle-lg">
        {/* Header Section */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[var(--color-lemon-green)]/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--color-lemon-green)]"
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

          <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-1 sm:mb-2">
            Receipt Created Successfully! 🎉
          </h3>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            Your receipt has been generated and is ready to share.
          </p>
        </div>

        {/* Content Section */}
        <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
          {/* Download Option */}
          <div className="rounded-lg border-2 border-[var(--border-color)] p-3 sm:p-4 hover:border-[var(--color-accent-yellow)] transition-colors squircle-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--text-secondary)]" />
              </div>
              <div className="flex-1 w-full">
                <h3 className="font-medium text-[var(--text-primary)] text-sm sm:text-base">
                  Download PDF
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 sm:mt-1">
                  Download receipt as PDF with your signature.
                </p>
                <Button
                  onClick={downloadPdf}
                  disabled={isDownloading}
                  className="mt-2 sm:mt-3 w-full sm:w-auto bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 min-w-[120px] sm:min-w-[140px] squircle-md text-sm sm:text-base py-1.5 sm:py-2"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                      <span className="text-xs sm:text-sm">Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm">Download PDF</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Share Link Option */}
          {signingLink && (
            <div className="rounded-lg border-2 border-[var(--border-color)] p-3 sm:p-4 hover:border-[var(--color-accent-yellow)] transition-colors squircle-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center shrink-0">
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--text-secondary)]"
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
                <div className="flex-1 w-full">
                  <h3 className="font-medium text-[var(--text-primary)] text-sm sm:text-base">
                    Share Receipt Link
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 sm:mt-1">
                    Send this link to the receiver. They can view and acknowledge the receipt.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-3">
                    <div className="flex-1 rounded-lg bg-[var(--bg-secondary)] px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-mono text-[var(--text-secondary)] truncate">
                      {signingLink}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(signingLink)}
                      className="w-full sm:w-auto border-[var(--color-accent-yellow)] text-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/10 squircle-sm"
                      disabled={isDownloading}
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="text-xs sm:text-sm">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="text-xs sm:text-sm">Copy Link</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-[var(--border-color)]">
          <div className="mb-3 p-2 sm:p-3 bg-[var(--bg-secondary)] rounded-lg squircle-md">
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] text-center">
              <span className="font-medium">Receipt ID:</span> {receiptId}
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-md text-sm sm:text-base py-2 sm:py-2.5"
            disabled={isDownloading}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};