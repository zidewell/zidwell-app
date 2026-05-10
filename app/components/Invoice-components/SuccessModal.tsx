"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Link, Copy, Check, Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import InvoicePDFGenerator from "./InvoicePDFGenerator";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  generatedSigningLink?: string;
  onCopyLink: () => void;
  allowMultiplePayments?: boolean;
  pdfLoading?: boolean;
  invoiceData?: {
    invoice_id: string;
    business_name: string;
    business_logo?: string;
    client_name: string;
    client_email: string;
    client_phone?: string;
    from_email: string;
    from_name: string;
    issue_date: string;
    payment_type: "single" | "multiple";
    fee_option: "absorbed" | "customer";
    subtotal: number;
    fee_amount: number;
    total_amount: number;
    message?: string;
    customer_note?: string;
    invoice_items: Array<{
      id: string;
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
  };
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  generatedSigningLink,
  onCopyLink,
  allowMultiplePayments = false,
  pdfLoading = false,
  invoiceData,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Invoice link copied to clipboard");

      setTimeout(() => setCopied(false), 2000);

      if (onCopyLink) {
        onCopyLink();
      }
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-primary)] rounded-xl p-4 sm:p-6 max-w-[95%] sm:max-w-lg md:max-w-4xl w-full mx-auto shadow-pop max-h-[90vh] overflow-y-auto border border-[var(--border-color)] squircle-lg">
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
            Invoice Created Successfully! 🎉
          </h3>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            Your invoice has been generated and is ready to share.
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
                  Download invoice as PDF with your signature.
                </p>
                {invoiceData && (
                  <div className="mt-2 sm:mt-3">
                    <InvoicePDFGenerator
                      invoice={{
                        invoice_id: invoiceData.invoice_id,
                        business_name: invoiceData.business_name,
                        business_logo: invoiceData.business_logo,
                        client_name: invoiceData.client_name,
                        client_email: invoiceData.client_email,
                        client_phone: invoiceData.client_phone,
                        from_email: invoiceData.from_email,
                        from_name: invoiceData.from_name,
                        issue_date: invoiceData.issue_date,
                        status: "unpaid",
                        payment_type: invoiceData.payment_type,
                        fee_option: invoiceData.fee_option,
                        subtotal: invoiceData.subtotal,
                        fee_amount: invoiceData.fee_amount,
                        total_amount: invoiceData.total_amount,
                        message: invoiceData.message,
                        customer_note: invoiceData.customer_note,
                        invoice_items: invoiceData.invoice_items.map((item) => ({
                          id: item.id,
                          item_description: item.description,
                          quantity: item.quantity,
                          unit_price: item.unitPrice,
                          total_amount: item.quantity * item.unitPrice,
                        })),
                      }}
                      buttonText="Download PDF"
                      buttonVariant="default"
                      buttonSize="sm"
                      className="w-full sm:w-auto text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Share Link Option */}
          {generatedSigningLink && (
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
                    Share Invoice Link
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 sm:mt-1">
                    Send this link to your client to view and pay.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-3">
                    <div className="flex-1 rounded-lg bg-[var(--bg-secondary)] px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-mono text-[var(--text-secondary)] truncate">
                      {generatedSigningLink}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(generatedSigningLink)}
                      className="w-full sm:w-auto border-[var(--color-accent-yellow)] text-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/10 squircle-sm"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-[var(--text-secondary)] text-center sm:text-left">
                    {allowMultiplePayments
                      ? "Share this link with multiple people - each provides their info and pays"
                      : "Share this invoice link with your client to view details and pay"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-[var(--border-color)]">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-md text-sm sm:text-base py-2 sm:py-2.5"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;