// app/components/sign-contract-form-component/ContractSuccessModal.tsx
"use client";

import { useState } from "react";
import { Copy, Check, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { toast } from "sonner";

interface ContractSuccessModalProps {
  open: boolean;
  onClose: () => void;
  onNewContract: () => void;
  contractId: string;
  contractDate: string;
  attachmentsCount: number;
  includeLawyerSignature: boolean;
  creatorSignature: boolean;
  signingLink?: string;
  onCopyLink?: (link: string) => void;
}

export const ContractSuccessModal: React.FC<ContractSuccessModalProps> = ({
  open,
  onClose,
  onNewContract,
  contractId,
  contractDate,
  attachmentsCount,
  includeLawyerSignature,
  creatorSignature,
  signingLink,
  onCopyLink,
}) => {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopySigningLink = async () => {
    if (!signingLink) return;

    try {
      await navigator.clipboard.writeText(signingLink);
      setCopied(true);

      toast.success("Contract link copied to clipboard");

      setTimeout(() => setCopied(false), 2000);

      if (onCopyLink) {
        onCopyLink(signingLink);
      }
    } catch (error) {
      toast.error("Failed to copy contract link");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-primary)] rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5 text-[var(--text-secondary)]" />
        </button>

        {/* Success animation */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-linear-to-br from-[#F9F4E5] to-[#ffed4e] rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <svg
              className="w-8 h-8 text-[var(--color-accent-yellow)]"
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
            Contract Created Successfully! 🎉
          </h3>
          <p className="text-[var(--text-secondary)]">
            Your contract has been generated and is ready to share.
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-4 mb-6">
          {/* Share Contract Link */}
          {signingLink && (
            <div className="rounded-lg border border-[var(--border-color)] p-4 hover:border-[var(--color-accent-yellow)] transition-colors bg-[var(--bg-secondary)]">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-center shrink-0">
                  <svg
                    className="h-5 w-5 text-[var(--text-primary)]"
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
                  <h3 className="font-medium text-[var(--text-primary)]">
                    Share Contract Link
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Send this link to the recipient. They can view, acknowledge,
                    and sign the contract.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <div className="flex-1 rounded-lg bg-[var(--bg-primary)] px-3 py-2 text-xs font-mono text-[var(--text-secondary)] truncate border border-[var(--border-color)]">
                      {signingLink}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopySigningLink}
                      className="shrink-0 border-[var(--color-accent-yellow)] text-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)] hover:text-[var(--color-ink)]"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create New Contract Button */}
          <Button
            onClick={onNewContract}
            variant="outline"
            className="w-full border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-colors duration-200 text-[var(--text-primary)]"
          >
            Create New Contract
          </Button>
        </div>

        {/* Contract Details */}
        <div className="p-4 bg-linear-to-r from-[var(--bg-secondary)] to-[var(--color-accent-yellow)]/10 rounded-lg border border-[var(--border-color)]">
          <p className="text-sm text-[var(--text-primary)] text-center mb-2">
            <strong>Contract ID:</strong> {contractId}
          </p>
          <p className="text-sm text-[var(--text-primary)] text-center mb-2">
            <strong>Contract Date:</strong>{" "}
            {new Date(contractDate).toLocaleDateString()}
          </p>
          {attachmentsCount > 0 && (
            <p className="text-sm text-[var(--text-primary)] text-center mb-2">
              <strong>Attachments:</strong> {attachmentsCount} file(s) included
            </p>
          )}
          {includeLawyerSignature && (
            <p className="text-sm text-[var(--text-primary)] text-center mb-2">
              <strong>Lawyer Signature:</strong> Included ✓
            </p>
          )}
          {creatorSignature && (
            <p className="text-sm text-[var(--text-primary)] text-center mb-2">
              <strong>Your Signature:</strong> Applied ✓
            </p>
          )}
          <p className="text-xs text-[var(--text-secondary)] text-center mt-1">
            You can find this contract in your dashboard
          </p>
        </div>

        {/* Close button */}
        <div className="mt-6">
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};