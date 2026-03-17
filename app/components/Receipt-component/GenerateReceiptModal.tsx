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
  receiptData
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

      const receiptResponse = await fetch(`/api/receipt/get-receipt/${receiptId}`);
      if (!receiptResponse.ok) throw new Error("Failed to fetch receipt data");
      
      const receipt = await receiptResponse.json();
      await generatePdfFromData(receipt);
      
    } catch (err) {
      console.error("PDF download failed:", err);
      toast.error("Failed to download PDF. Please try again.", { id: "pdf-download" });
      setIsDownloading(false);
    }
  };

  const generatePdfFromData = async (receipt: any) => {
    try {
      const receiptItems = parseReceiptItems(receipt.receipt_items);
      const formattedCreatedAt = receipt.created_at
        ? formatDate(receipt.created_at)
        : "N/A";

      const formattedSignedAt = receipt.signed_at
        ? formatDate(receipt.signed_at)
        : "N/A";

      const hasSellerSignature =
        receipt.seller_signature &&
        receipt.seller_signature !== "null" &&
        receipt.seller_signature !== "";
      
      const hasClientSignature =
        receipt.client_signature &&
        receipt.client_signature !== "null" &&
        receipt.client_signature !== "";

      const formattedItems = receiptItems.map((item: any, index: number) => ({
        description: item.description || item.item || "N/A",
        quantity: item.quantity,
        unit_price: item.unit_price || item.price || 0,
        amount: item.total || item.quantity * (item.unit_price || item.price || 0),
        index: index + 1
      }));

      const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Receipt - ${receipt.receipt_id}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #ffffff;
      color: #374151;
      line-height: 1.5;
      padding: 20px;
    }
    
    @media print {
      body {
        padding: 0;
      }
      @page {
        margin: 20mm;
      }
    }
    
    .primary-gradient {
      background: linear-gradient(135deg, #2b825b 0%, #1e5f43 100%);
    }
    
    .primary-light-bg {
      background-color: rgba(43, 130, 91, 0.1);
    }
    
    .primary-border {
      border-color: #2b825b;
    }
    
    .primary-text {
      color: #2b825b;
    }
    
    .watermark {
      opacity: 0.1;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 120px;
      color: #2b825b;
      pointer-events: none;
      z-index: -1;
    }
  </style>
</head>
<body>
  <div class="watermark">ZIDWELL</div>
  
  <div class="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden max-w-4xl mx-auto mb-8">
    <!-- Header with your primary color -->
    <div class="primary-gradient p-8 text-white">
      <div class="flex items-center justify-between gap-6">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
            <img src="${base64Logo}" alt="Zidwell Logo" class="h-7 w-7" />
          </div>
          <div>
            <p class="text-sm opacity-90 uppercase tracking-wide">
              Receipt #${receipt.receipt_id}
            </p>
            <h1 class="text-2xl font-bold mt-1">
              ${receipt.business_name || receipt.initiator_name}
            </h1>
            <p class="text-sm opacity-90 mt-1">
              Issued on ${formatDate(receipt.issue_date)}
            </p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-sm opacity-90">Total Amount</p>
          <p class="text-3xl font-bold">
            ${formatCurrency(receipt.total)}
          </p>
          <div class="mt-2 inline-block bg-white/20 px-3 py-1 rounded-full text-sm">
            Status: <span class="font-semibold">${receipt.status.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="p-8 space-y-8">
      <!-- Business Details -->
      <div class="grid md:grid-cols-2 gap-8">
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 primary-light-bg rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="primary-text"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">From</h3>
              <p class="text-gray-600">${receipt.business_name || receipt.initiator_name}</p>
              ${receipt.initiator_email ? `
              <p class="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                ${receipt.initiator_email}
              </p>
              ` : ''}
              ${receipt.initiator_phone ? `
              <p class="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                ${receipt.initiator_phone}
              </p>
              ` : ''}
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 primary-light-bg rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="primary-text"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">To</h3>
              <p class="text-gray-600">${receipt.client_name}</p>
              <div class="space-y-1 mt-1">
                ${receipt.client_email ? `
                <p class="text-sm text-gray-500 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  ${receipt.client_email}
                </p>
                ` : ''}
                ${receipt.client_phone ? `
                <p class="text-sm text-gray-500 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  ${receipt.client_phone}
                </p>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      ${formattedItems.length > 0 ? `
      <div class="border rounded-xl overflow-hidden">
        <div class="bg-gray-50 px-6 py-4 border-b">
          <h3 class="font-semibold text-gray-900">Items Details</h3>
        </div>
        <div class="divide-y">
          <!-- Header -->
          <div class="grid grid-cols-12 px-6 py-4 bg-gray-50/50 text-sm font-medium text-gray-600 border-b">
            <div class="col-span-6">Description</div>
            <div class="col-span-2 text-center">Quantity</div>
            <div class="col-span-2 text-right">Unit Price</div>
            <div class="col-span-2 text-right">Amount</div>
          </div>
          
          <!-- Items -->
          ${formattedItems.map((item: any) => `
          <div class="grid grid-cols-12 px-6 py-4 hover:bg-gray-50/50 transition-colors">
            <div class="col-span-6">
              <p class="font-medium text-gray-900">${item.description}</p>
              <p class="text-sm text-gray-500 mt-1">Item #${item.index}</p>
            </div>
            <div class="col-span-2 text-center">
              <p class="text-gray-700">${item.quantity}</p>
            </div>
            <div class="col-span-2 text-right">
              <p class="text-gray-700">${formatCurrency(item.unit_price)}</p>
            </div>
            <div class="col-span-2 text-right">
              <p class="font-semibold text-gray-900">${formatCurrency(item.amount)}</p>
            </div>
          </div>
          `).join('')}
          
          <!-- Totals -->
          <div class="bg-gray-50 px-6 py-4">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-sm text-gray-600">Subtotal</p>
                <p class="text-2xl font-bold primary-text">${formatCurrency(receipt.total)}</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-600">Total Amount</p>
                <p class="text-2xl font-bold primary-text">${formatCurrency(receipt.total)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      ` : '<p class="text-gray-500 italic">No items listed</p>'}

      <!-- Payment & Notes -->
      <div class="grid md:grid-cols-2 gap-8">
        <div class="bg-gray-50 rounded-xl p-6">
          <div class="flex items-center gap-3 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="primary-text"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            <h3 class="font-semibold text-gray-900">Payment Details</h3>
          </div>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-600">Payment Method:</span>
              <span class="font-medium capitalize">
                ${receipt.payment_method === "transfer" ? "Bank Transfer" : receipt.payment_method || "Not specified"}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Payment For:</span>
              <span class="font-medium capitalize">${receipt.payment_for}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Issue Date:</span>
              <span class="font-medium">${formatDate(receipt.issue_date)}</span>
            </div>
            ${receipt.verification_code ? `
            <div class="flex justify-between">
              <span class="text-gray-600">Verification Code:</span>
              <span class="font-medium font-mono">${receipt.verification_code}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="bg-gray-50 rounded-xl p-6">
          <div class="flex items-center gap-3 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="primary-text"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <h3 class="font-semibold text-gray-900">Notes</h3>
          </div>
          <p class="text-gray-700">
            ${receipt.customer_note || "No additional notes provided."}
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t pt-8 text-center text-gray-500 text-sm">
        <p>This receipt was generated electronically by Zidwell Receipts</p>
        <div class="mt-4 text-xs text-gray-400">
          <p>Receipt ID: ${receipt.receipt_id} | Generated on: ${new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

      // Send to PDF generation API
      const pdfResponse = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: fullHtml }),
      });

      if (!pdfResponse.ok) {
        const errorText = await pdfResponse.text();
        throw new Error(errorText || "Failed to generate PDF");
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
      toast.error("Failed to generate PDF. Please try again.", { id: "pdf-download" });
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-2xl w-full mx-4 shadow-xl dark:shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
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

          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Receipt Created Successfully! 🎉
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your receipt has been generated and is ready to share.
          </p>
        </div>

        <div className="space-y-4 py-4">
          {/* Download Option */}
          <div className="rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4 hover:border-primary dark:hover:border-primary transition-colors">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">Download PDF</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Download receipt as PDF with your signature. Receiver's signature space will be empty.
                </p>
                <Button
                  onClick={downloadPdf}
                  disabled={isDownloading}
                  className="mt-3 bg-primary hover:bg-primary-dark text-white min-w-[140px]"
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
            <div className="rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4 hover:border-primary dark:hover:border-primary transition-colors">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                  <svg
                    className="h-5 w-5 text-gray-700 dark:text-gray-300"
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
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Share Receipt Link
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Send this link to the receiver. They can view, acknowledge, and sign the receipt.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <div className="flex-1 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm font-mono text-gray-600 dark:text-gray-300 truncate">
                      {signingLink}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(signingLink)}
                      className="shrink-0 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                      disabled={isDownloading}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
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

        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
            <span className="font-medium">Receipt ID:</span> {receiptId}
          </p>
        </div>

        <div className="mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            disabled={isDownloading}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};