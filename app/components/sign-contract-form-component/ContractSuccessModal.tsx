// app/components/sign-contract-form-component/ContractSuccessModal.tsx
"use client";

import { useState } from "react";
import { Copy, Check, X, FileText } from "lucide-react";
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
            Contract Created Successfully! 🎉
          </h3>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            Your contract has been generated and is ready to share.
          </p>
        </div>

        {/* Content Section */}
        <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
          {/* Share Contract Link */}
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
                    Share Contract Link
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 sm:mt-1">
                    Send this link to the recipient. They can view, acknowledge, and sign the contract.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-3">
                    <div className="flex-1 rounded-lg bg-[var(--bg-secondary)] px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-mono text-[var(--text-secondary)] truncate">
                      {signingLink}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopySigningLink}
                      className="w-full sm:w-auto border-[var(--color-accent-yellow)] text-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/10 squircle-sm"
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

          {/* Create New Contract Button */}
          <div className="rounded-lg border-2 border-[var(--border-color)] p-3 sm:p-4 hover:border-[var(--color-accent-yellow)] transition-colors squircle-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--text-secondary)]" />
              </div>
              <div className="flex-1 w-full">
                <h3 className="font-medium text-[var(--text-primary)] text-sm sm:text-base">
                  Create New Contract
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 sm:mt-1">
                  Start a new contract from scratch.
                </p>
                <Button
                  onClick={onNewContract}
                  variant="default"
                  className="mt-2 sm:mt-3 w-full sm:w-auto bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 min-w-[120px] sm:min-w-[140px] squircle-md text-sm sm:text-base py-1.5 sm:py-2"
                >
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Create New Contract</span>
                </Button>
              </div>
            </div>
          </div>

         
        </div>

        {/* Footer Section */}
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