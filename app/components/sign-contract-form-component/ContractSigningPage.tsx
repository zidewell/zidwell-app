// app/components/sign-contract-form-component/ContractSigningPage.tsx
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { SuggestEditsModal } from "./SuggestEditsModal";
import {
  FileText,
  CheckCircle,
  XCircle,
  Edit,
  PenTool,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/hooks/use-toast";
import { IdentityVerificationModal } from "./IdentityVerificationModal";
import { SignaturePanel } from "./SignaturePanel";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/app/components/ui/sheet";

interface Contract {
  id: string;
  token: string;
  title: string;
  content: string;
  status: string;
  initiatorName: string;
  initiatorEmail: string;
  signeeName: string;
  signeeEmail: string;
  signeePhone: string;
  hasLawyerSignature: boolean;
  creatorName: string;
  creatorSignature: string | null;
  signeeSignature?: string | null;
  createdAt: string;
  verificationCode: string | null;
  metadata: any;
  contractDate: string;
}

interface ContractSigningPageProps {
  contract: Contract;
}

// Function to clean Quill HTML artifacts
const cleanQuillHTML = (html: string): string => {
  if (!html) return "";

  // Remove Quill UI spans
  let cleaned = html
    .replace(/<span class="ql-ui"[^>]*><\/span>/g, "")
    .replace(/<span[^>]*data-list="[^"]*"[^>]*>/g, "")
    .replace(/<\/span>/g, "");

  // Remove empty list items
  cleaned = cleaned
    .replace(/<li>\s*<br>\s*<\/li>/g, "")
    .replace(/<li><br><\/li>/g, "")
    .replace(/<li>\s*<\/li>/g, "");

  // Remove data-list attributes
  cleaned = cleaned.replace(/\s+data-list="[^"]*"/g, "");

  // Clean up empty paragraphs
  cleaned = cleaned
    .replace(/<p>\s*<br>\s*<\/p>/g, "")
    .replace(/<p><br><\/p>/g, "")
    .replace(/<p>\s*<\/p>/g, "");

  // Remove empty headers
  cleaned = cleaned
    .replace(/<h[1-6]>\s*<br>\s*<\/h[1-6]>/g, "")
    .replace(/<h[1-6]><br><\/h[1-6]>/g, "");

  return cleaned.trim();
};

// Function to ensure proper list structure
const ensureProperLists = (html: string): string => {
  if (!html) return "";

  // Fix unordered lists that might be rendered as ordered
  let fixed = html
    // Ensure bullet lists start with <ul>
    .replace(/<ol>\s*<li[^>]*>•/g, "<ul><li")
    .replace(/<ol>\s*<li[^>]*>○/g, "<ul><li")
    .replace(/<ol>\s*<li[^>]*>▪/g, "<ul><li");

  // Close <ul> tags properly
  const ulMatches = fixed.match(/<ul[^>]*>/g) || [];
  const olMatches = fixed.match(/<\/ol>/g) || [];

  // Simple fix: if we see <ul> but no closing </ul>, add it
  if (ulMatches.length > 0) {
    const ulCount = ulMatches.length;
    const ulCloseCount = (fixed.match(/<\/ul>/g) || []).length;

    if (ulCount > ulCloseCount) {
      // Find the last </ol> and replace with </ul>
      const lastOlIndex = fixed.lastIndexOf("</ol>");
      if (lastOlIndex !== -1) {
        fixed =
          fixed.substring(0, lastOlIndex) +
          "</ul>" +
          fixed.substring(lastOlIndex + 5);
      }
    }
  }

  return fixed;
};

const ContractSigningPage = ({ contract }: ContractSigningPageProps) => {
  const router = useRouter();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showSignaturePanel, setShowSignaturePanel] = useState(false);
  const [showEditsModal, setShowEditsModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  // Clean and prepare the HTML content
  const cleanContent = useMemo(() => {
    if (!contract.content) return "";

    const cleaned = cleanQuillHTML(contract.content);
    return ensureProperLists(cleaned);
  }, [contract.content]);

  const handleSign = () => {
    setShowSignaturePanel(true);
  };

  const handleReject = () => {
    setShowEditsModal(true);
  };

  const handleVerificationSuccess = () => {
    toast({
      title: "Contract signed successfully!",
      description: "Check your email for the signed document.",
    });
  };

  const handleEditsSubmitted = () => {
    toast({
      title: "Edits submitted successfully!",
      description: "The contract creator will be notified.",
    });
  };

  // Format date like "31st December 2025"
  const formatDate = (dateString: string) => {
    if (!dateString) return "Date not specified";

    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const year = date.getFullYear();

    // Add ordinal suffix
    const getOrdinalSuffix = (n: number) => {
      if (n > 3 && n < 21) return "th";
      switch (n % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };

    return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
  };

  // Get payment terms from metadata
  const getPaymentTerms = () => {
    if (!contract.metadata) return null;

    // Try to parse metadata if it's a string
    let metadataObj = contract.metadata;
    if (typeof contract.metadata === "string") {
      try {
        metadataObj = JSON.parse(contract.metadata);
      } catch (e) {
        console.error("Failed to parse metadata:", e);
        return null;
      }
    }

    return metadataObj?.payment_terms || null;
  };

  const paymentTerms = getPaymentTerms();

  // CSS styles for proper list rendering
  const contractStyles = `
    .contract-content-container {
      font-family: var(--font-be-vietnam), Arial, sans-serif;
      line-height: 1.6;
    }
    
    /* Headers */
    .contract-content-container h1 {
      font-size: 1.5rem;
      font-weight: bold;
      margin: 1.5rem 0 1rem 0;
      color: var(--text-primary);
    }
    
    .contract-content-container h2 {
      font-size: 1.25rem;
      font-weight: bold;
      margin: 1.25rem 0 0.75rem 0;
      color: var(--text-primary);
    }
    
    .contract-content-container h3 {
      font-size: 1.125rem;
      font-weight: bold;
      margin: 1rem 0 0.5rem 0;
      color: var(--text-primary);
    }
    
    /* Paragraphs */
    .contract-content-container p {
      margin-bottom: 1rem;
      color: var(--text-primary);
    }
    
    /* Lists - General */
    .contract-content-container ol,
    .contract-content-container ul {
      margin: 0.75rem 0;
      padding-left: 1.5rem;
    }
    
    .contract-content-container li {
      margin-bottom: 0.5rem;
      display: list-item;
    }
    
    /* Ordered Lists */
    .contract-content-container ol {
      list-style-type: decimal;
    }
    
    .contract-content-container ol ol {
      list-style-type: lower-alpha;
    }
    
    .contract-content-container ol ol ol {
      list-style-type: lower-roman;
    }
    
    /* Unordered Lists */
    .contract-content-container ul {
      list-style-type: disc;
    }
    
    .contract-content-container ul ul {
      list-style-type: circle;
    }
    
    .contract-content-container ul ul ul {
      list-style-type: square;
    }
    
    /* Text formatting */
    .contract-content-container strong,
    .contract-content-container b {
      font-weight: bold;
    }
    
    .contract-content-container em,
    .contract-content-container i {
      font-style: italic;
    }
    
    .contract-content-container u {
      text-decoration: underline;
    }
    
    /* Alignment */
    .contract-content-container .ql-align-center {
      text-align: center;
    }
    
    .contract-content-container .ql-align-right {
      text-align: right;
    }
    
    .contract-content-container .ql-align-justify {
      text-align: justify;
    }
    
    /* Links */
    .contract-content-container a {
      color: var(--color-accent-yellow);
      text-decoration: underline;
    }
    
    .contract-content-container a:hover {
      color: var(--color-accent-yellow);
      opacity: 0.8;
    }
    
    /* Responsive adjustments */
    @media (max-width: 640px) {
      .contract-content-container {
        font-size: 0.875rem;
      }
      
      .contract-content-container h1 {
        font-size: 1.25rem;
      }
      
      .contract-content-container h2 {
        font-size: 1.125rem;
      }
      
      .contract-content-container h3 {
        font-size: 1rem;
      }
      
      .contract-content-container ol,
      .contract-content-container ul {
        padding-left: 1.25rem;
      }
    }
  `;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <style>{contractStyles}</style>
      <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Header - matches image design */}
        <div className="text-center mb-6 md:mb-10">
          <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-[var(--color-accent-yellow)] bg-[var(--color-ink)] uppercase mb-2 py-2 px-2 md:px-0 overflow-hidden">
            {contract.title || "SERVICE CONTRACT"}
          </h1>
          <p className="text-sm md:text-base text-[var(--text-secondary)] mb-6 md:mb-8">
            This is a service agreement entered into between:
          </p>

          {/* Party Information */}
          <div className="space-y-3 md:space-y-4 mb-6 md:mb-8 text-left px-2 md:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <span className="font-bold text-sm md:text-base text-[var(--text-primary)]">PARTY A:</span>
              <span className="sm:ml-4 relative pl-4 before:absolute before:left-0 before:top-3 before:w-2 before:h-0.5 before:bg-[var(--text-primary)] mt-1 sm:mt-0 text-[var(--text-primary)]">
                {contract.initiatorName}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center">
              <span className="font-bold text-sm md:text-base text-[var(--text-primary)]">PARTY B:</span>
              <span className="sm:ml-4 relative pl-4 before:absolute before:left-0 before:top-3 before:w-2 before:h-0.5 before:bg-[var(--text-primary)] mt-1 sm:mt-0 text-[var(--text-primary)]">
                {contract.signeeName || "Signee Name"}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center">
              <span className="font-bold text-sm md:text-base text-[var(--text-primary)]">DATE:</span>
              <span className="sm:ml-4 relative pl-4 before:absolute before:left-0 before:top-3 before:w-2 before:h-0.5 before:bg-[var(--text-primary)] mt-1 sm:mt-0 text-[var(--text-primary)]">
                {formatDate(contract.contractDate || contract.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms Section */}
        <div className="mb-6 md:mb-10">
          <div className="flex items-center gap-3 md:gap-4 my-4 md:my-6">
            <div className="flex-1 h-0.5 md:h-1 bg-[var(--color-accent-yellow)] rounded-2xl" />
            <h2 className="text-base md:text-lg lg:text-xl font-bold text-center px-2 text-[var(--text-primary)]">
              THE TERMS OF AGREEMENT ARE AS FOLLOWS
            </h2>
            <div className="flex-1 h-0.5 md:h-1 bg-[var(--color-accent-yellow)] rounded-2xl" />
          </div>

          {cleanContent ? (
            <div className="px-2 md:px-0">
              <div
                className="contract-content-container text-xs md:text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: cleanContent }}
              />
            </div>
          ) : (
            <div className="text-[var(--text-secondary)] italic text-sm text-center py-6 md:py-8">
              No contract content provided
            </div>
          )}
        </div>

        {/* PAYMENT TERMS Section - Only show if payment terms exist */}
        {paymentTerms && (
          <div className="mb-6 md:mb-10">
            <div className="flex items-center gap-3 md:gap-4 my-4 md:my-6">
              <div className="flex-1 h-0.5 md:h-1 bg-[var(--color-accent-yellow)] rounded-2xl" />
              <h2 className="text-base md:text-lg lg:text-xl font-bold text-center whitespace-nowrap px-2 text-[var(--text-primary)]">
                PAYMENT TERMS
              </h2>
              <div className="flex-1 h-0.5 md:h-1 bg-[var(--color-accent-yellow)] rounded-2xl" />
            </div>

            <div className="space-y-3 md:space-y-4 px-2 md:px-0">
              {typeof paymentTerms === "string" &&
              paymentTerms.includes("<") ? (
                <div
                  className="contract-content-container text-xs md:text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: cleanQuillHTML(paymentTerms),
                  }}
                />
              ) : (
                <div className="whitespace-pre-wrap text-xs md:text-sm leading-relaxed contract-content-container">
                  {paymentTerms}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Signature Section */}
        <div className="mb-6 md:mb-10 pt-4 md:pt-6 border-t border-[var(--border-color)]">
          <div className="flex items-center gap-3 md:gap-4 my-4 md:my-6">
            <div className="flex-1 h-0.5 md:h-1 bg-[var(--color-accent-yellow)] rounded-2xl" />
            <h2 className="text-base md:text-lg lg:text-xl font-bold text-center whitespace-nowrap px-2 text-[var(--text-primary)]">
              SIGNATURES
            </h2>
            <div className="flex-1 h-0.5 md:h-1 bg-[var(--color-accent-yellow)] rounded-2xl" />
          </div>

          <div className="overflow-x-auto px-2 md:px-0 -mx-2 md:mx-0">
            <div className="min-w-full inline-block md:block">
              <div className="flex flex-col md:table md:w-full border-collapse">
                {/* Table Headers - Hidden on mobile, shown on desktop */}
                <div className="hidden md:table-row-group">
                  <div className="table-row">
                    <div className="table-cell py-3 px-4 text-center font-bold text-[var(--text-primary)]">
                      PARTY A
                    </div>
                    {contract.hasLawyerSignature && (
                      <div className="table-cell py-3 px-4 text-center font-bold text-[var(--text-primary)]">
                        LEGAL WITNESS
                      </div>
                    )}
                    <div className="table-cell py-3 px-4 text-center font-bold text-[var(--text-primary)]">
                      PARTY B
                    </div>
                  </div>
                </div>

                {/* Mobile Signature Cards */}
                <div className="md:hidden space-y-6">
                  {/* Party A Mobile Card */}
                  <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-4">
                    <div className="font-bold text-center text-sm mb-3 text-[var(--text-secondary)]">
                      PARTY A
                    </div>
                    <div className="flex flex-col items-center justify-start">
                      <div className="font-bold text-sm text-[var(--text-primary)]">
                        {contract.initiatorName}
                      </div>
                      <div className="h-10 w-32 border-b-2 border-dotted border-[var(--border-color)] my-3 flex items-center justify-center">
                        {contract.creatorSignature ? (
                          <img
                            src={contract.creatorSignature}
                            alt="Creator signature"
                            className="h-8 object-contain"
                          />
                        ) : (
                          <span className="text-[var(--text-secondary)] text-xs">
                            Signature
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lawyer Witness Mobile Card */}
                  {contract.hasLawyerSignature && (
                    <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-4">
                      <div className="font-bold text-center text-sm mb-3 text-[var(--text-secondary)]">
                        LEGAL WITNESS
                      </div>
                      <div className="flex flex-col items-center justify-start">
                        <div className="font-bold text-sm text-[var(--text-primary)]">
                          Barr. Adewale Johnson
                        </div>
                        <div className="h-10 w-32 border-b-2 border-dotted border-[var(--border-color)] my-3 flex items-center justify-center">
                          <span className="text-[var(--text-secondary)] italic font-serif text-sm">
                            Barr. Adewale Johnson
                          </span>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            Legal Counsel
                          </p>
                          <p className="text-xs bg-[var(--color-accent-yellow)]/10 text-[var(--color-accent-yellow)] px-2 py-1 rounded-full inline-block mt-2">
                            Verified Lawyer
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Party B Mobile Card */}
                  <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-4">
                    <div className="font-bold text-center text-sm mb-3 text-[var(--text-secondary)]">
                      PARTY B
                    </div>
                    <div className="flex flex-col items-center justify-start">
                      <div className="font-bold text-sm text-[var(--text-primary)]">
                        {contract.signeeName || "Signee Name"}
                      </div>
                      <div className="h-10 w-32 border-b-2 border-dotted border-[var(--border-color)] my-3 flex items-center justify-center">
                        {contract.signeeSignature ? (
                          <img
                            src={contract.signeeSignature}
                            alt="Signee signature"
                            className="h-8 object-contain"
                          />
                        ) : (
                          <span className="text-[var(--text-secondary)] text-xs">
                            Signature
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden md:table-row-group">
                  <div className="table-row">
                    {/* Party A Signature Cell */}
                    <div className="table-cell py-4 md:py-6 px-2 md:px-4 text-center align-top border-t border-[var(--border-color)]">
                      <div className="min-h-[100px] md:min-h-[120px] flex flex-col items-center justify-start">
                        <div className="font-bold text-sm md:text-base text-[var(--text-primary)]">
                          {contract.initiatorName}
                        </div>
                        <div className="h-10 md:h-[50px] w-32 md:w-48 border-b-2 border-dotted border-[var(--border-color)] my-3 md:mb-4 flex items-center justify-center">
                          {contract.creatorSignature ? (
                            <img
                              src={contract.creatorSignature}
                              alt="Creator signature"
                              className="h-8 md:h-10 object-contain"
                            />
                          ) : (
                            <span className="text-[var(--text-secondary)] text-xs md:text-sm">
                              Signature
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Lawyer Witness Signature Cell */}
                    {contract.hasLawyerSignature && (
                      <div className="table-cell py-4 md:py-6 px-2 md:px-4 text-center align-top border-t border-[var(--border-color)]">
                        <div className="min-h-[100px] md:min-h-[120px] flex flex-col items-center justify-start">
                          <div className="font-bold text-sm md:text-base text-[var(--text-primary)]">
                            Barr. Adewale Johnson
                          </div>
                          <div className="h-10 md:h-[50px] w-32 md:w-48 border-b-2 border-dotted border-[var(--border-color)] my-3 md:mb-4 flex items-center justify-center">
                            <span className="text-[var(--text-secondary)] italic font-serif text-sm md:text-lg">
                              Barr. Adewale Johnson
                            </span>
                          </div>
                          <div className="text-center">
                            <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-1">
                              Legal Counsel
                            </p>
                            <p className="text-xs bg-[var(--color-accent-yellow)]/10 text-[var(--color-accent-yellow)] px-2 py-1 rounded-full inline-block mt-2">
                              Verified Lawyer
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Party B Signature Cell */}
                    <div className="table-cell py-4 md:py-6 px-2 md:px-4 text-center align-top border-t border-[var(--border-color)]">
                      <div className="min-h-[100px] md:min-h-[120px] flex flex-col items-center justify-start">
                        <div className="font-bold text-sm md:text-base text-[var(--text-primary)]">
                          {contract.signeeName || "Signee Name"}
                        </div>
                        <div className="h-10 md:h-[50px] w-32 md:w-48 border-b-2 border-dotted border-[var(--border-color)] my-3 md:mb-4 flex items-center justify-center">
                          {contract.signeeSignature ? (
                            <img
                              src={contract.signeeSignature}
                              alt="Signee signature"
                              className="h-8 md:h-10 object-contain"
                            />
                          ) : (
                            <span className="text-[var(--text-secondary)] text-xs md:text-sm">
                              Signature
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Only show if not signed */}
        {contract.status !== "signed" && (
          <div className="mt-8 md:mt-12 p-4 md:p-8 border border-[var(--border-color)] rounded-lg bg-[var(--bg-secondary)]">
            <h3 className="text-base md:text-lg font-semibold text-center mb-4 md:mb-6 text-[var(--text-primary)]">
              Review & Sign Contract
            </h3>

            <div className="space-y-4 max-w-2xl mx-auto">
              <Button
                onClick={handleSign}
                className="w-full h-auto py-3 md:py-4 flex items-center justify-center gap-2 md:gap-3 bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90 text-[var(--color-ink)]"
              >
                <PenTool className="h-4 w-4 md:h-5 md:w-5" />
                <div className="text-left">
                  <div className="font-semibold text-sm md:text-base">
                    Sign Contract
                  </div>
                  <div className="text-xs opacity-90">I agree to all terms</div>
                </div>
              </Button>
            </div>

            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-[var(--border-color)]">
              <div className="flex items-start gap-2 md:gap-3 text-xs md:text-sm text-[var(--text-secondary)]">
                <XCircle className="h-4 w-4 md:h-5 md:w-5 shrink-0 mt-0.5" />
                <p>
                  By signing this contract, you agree to be legally bound by its
                  terms. If you need changes, use the "Suggest Edits" option.
                  Note that suggested edits will cost the contract creator ₦500
                  to review and update.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Already Signed Message */}
        {contract.status === "signed" && (
          <div className="mt-6 md:mt-8 p-4 md:p-6 border border-[var(--color-lemon-green)]/30 bg-[var(--color-lemon-green)]/10 rounded-lg">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 md:h-12 md:w-12 text-[var(--color-lemon-green)] mx-auto mb-2 md:mb-4" />
              <h3 className="text-lg md:text-xl font-semibold text-[var(--color-lemon-green)] mb-1 md:mb-2">
                Contract Already Signed
              </h3>
              <p className="text-[var(--text-secondary)] text-sm md:text-base">
                This contract has been signed and is legally binding. Check your
                email for the signed document.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-[10px] md:text-xs text-[var(--text-secondary)] pt-4 md:pt-6 border-t border-[var(--border-color)] px-2 md:px-0">
          THIS CONTRACT WAS CREATED AND SIGNED ON zidwell.com
          <br />
          Contract ID: {contract.token.substring(0, 8).toUpperCase()}
        </div>
      </div>

      {/* Modals */}
      <IdentityVerificationModal
        open={showVerificationModal}
        onOpenChange={setShowVerificationModal}
        contractId={contract.id}
        contractToken={contract.token}
        signeeName={contract.signeeName}
        signeeEmail={contract.signeeEmail}
        onSuccess={handleVerificationSuccess}
      />

      {showSignaturePanel && (
        <SignaturePanel
          contractId={contract.id}
          contractToken={contract.token}
          signeeName={contract.signeeName}
          signeeEmail={contract.signeeEmail}
          onSignatureComplete={(signatureData) => {
            setShowSignaturePanel(false);
          }}
          onCancel={() => setShowSignaturePanel(false)}
        />
      )}
    </div>
  );
};

export default ContractSigningPage;