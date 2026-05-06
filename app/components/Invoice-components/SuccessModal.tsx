"use client";

import React from "react";
import { Button } from "../ui/button";
import { Download, Link, Copy } from "lucide-react";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  generatedSigningLink?: string;
  onDownloadPDF: () => void;
  onCopyLink: () => void;
  allowMultiplePayments?: boolean;
  pdfLoading?: boolean;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  generatedSigningLink,
  onDownloadPDF,
  onCopyLink,
  allowMultiplePayments = false,
  pdfLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[var(--bg-primary)] rounded-lg p-6 max-w-2xl w-full mx-4 shadow-pop max-h-[90vh] overflow-y-auto border border-[var(--border-color)] squircle-lg">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[var(--color-lemon-green)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-[var(--color-lemon-green)]"
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

          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            Invoice Created Successfully! 🎉
          </h3>
          <p className="text-[var(--text-secondary)]">
            Your invoice has been generated and is ready to share.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={onDownloadPDF}
            disabled={pdfLoading}
            className="w-full bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 squircle-md"
          >
            <Download className="w-4 h-4 mr-2" />
            {pdfLoading ? "Generating PDF..." : "Download PDF"}
          </Button>

          {generatedSigningLink && (
            <div className="space-y-2">
              <Button
                onClick={onCopyLink}
                variant="outline"
                className="w-full border-[var(--color-accent-yellow)] text-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/10 squircle-md"
              >
                <Link className="w-4 h-4 mr-2" />
                Copy Invoice Link
              </Button>
              <div className="text-xs text-[var(--text-secondary)] text-center">
                {allowMultiplePayments
                  ? "Share this link with multiple people - each provides their info and pays"
                  : "Share this invoice link with your client to view details and pay"}
              </div>
            </div>
          )}

          <Button
            onClick={onClose}
            variant="outline"
            className="w-full border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] squircle-md"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;