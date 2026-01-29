"use client";

import { useState } from "react";
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

const ContractSigningPage = ({ contract }: ContractSigningPageProps) => {
  const router = useRouter();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showSignaturePanel, setShowSignaturePanel] = useState(false);
  const [showEditsModal, setShowEditsModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Header - matches image design */}
        <div className="text-center mb-6 md:mb-10">
          <h1 className="text-lg md:text-2xl lg:text-3xl  font-bold text-[#C29307] bg-[#073b2a] uppercase mb-2 py-2 px-2 md:px-0 overflow-hidden">
            {contract.title || "SERVICE CONTRACT"}
          </h1>
          <p className="text-sm md:text-base text-gray-700 mb-6 md:mb-8">
            This is a service agreement entered into between:
          </p>

          {/* Party Information */}
          <div className="space-y-3 md:space-y-4 mb-6 md:mb-8 text-left px-2 md:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <span className="font-bold text-sm md:text-base">PARTY A:</span>
              <span className="sm:ml-4 relative pl-4 before:absolute before:left-0 before:top-3 before:w-2 before:h-0.5 before:bg-black mt-1 sm:mt-0">
                {contract.initiatorName}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center">
              <span className="font-bold text-sm md:text-base">PARTY B:</span>
              <span className="sm:ml-4 relative pl-4 before:absolute before:left-0 before:top-3 before:w-2 before:h-0.5 before:bg-black mt-1 sm:mt-0">
                {contract.signeeName || "Signee Name"}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center">
              <span className="font-bold text-sm md:text-base">DATE:</span>
              <span className="sm:ml-4 relative pl-4 before:absolute before:left-0 before:top-3 before:w-2 before:h-0.5 before:bg-black mt-1 sm:mt-0">
                {formatDate(contract.contractDate || contract.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms Section */}
        <div className="mb-6 md:mb-10">
          <div className="flex items-center gap-3 md:gap-4 my-4 md:my-6">
            <div className="flex-1 h-0.5 md:h-1 bg-[#C29307] rounded-2xl" />
            <h2 className="text-base md:text-lg lg:text-xl font-bold text-center px-2">
              THE TERMS OF AGREEMENT ARE AS FOLLOWS
            </h2>
            <div className="flex-1 h-0.5 md:h-1 bg-[#C29307] rounded-2xl" />
          </div>

          {contract.content ? (
            <div
              className="contract-content text-xs md:text-sm leading-relaxed px-2 md:px-0"
              style={{
                fontFamily: "Arial, sans-serif",
                lineHeight: "1.6",
              }}
              dangerouslySetInnerHTML={{
                __html: `
                  <style>
                    .contract-content ol, .contract-content ul {
                      margin-left: 20px;
                      margin-bottom: 12px;
                      padding-left: 0;
                    }
                    
                    @media (min-width: 768px) {
                      .contract-content ol, .contract-content ul {
                        margin-left: 24px;
                        margin-bottom: 16px;
                      }
                    }
                    
                    /* Ordered lists (numbered) */
                    .contract-content ol {
                      list-style-type: decimal;
                      counter-reset: item;
                    }
                    
                    .contract-content ol li {
                      display: list-item;
                      margin-bottom: 6px;
                      padding-left: 6px;
                      position: relative;
                    }
                    
                    @media (min-width: 768px) {
                      .contract-content ol li {
                        margin-bottom: 8px;
                        padding-left: 8px;
                      }
                    }
                    
                    /* Unordered lists (bulleted) */
                    .contract-content ul {
                      list-style-type: disc;
                    }
                    
                    .contract-content ul li {
                      display: list-item;
                      margin-bottom: 6px;
                      padding-left: 6px;
                      position: relative;
                    }
                    
                    @media (min-width: 768px) {
                      .contract-content ul li {
                        margin-bottom: 8px;
                        padding-left: 8px;
                      }
                    }
                    
                    /* Nested lists */
                    .contract-content ul ul,
                    .contract-content ol ol {
                      margin-left: 16px;
                      margin-top: 6px;
                      margin-bottom: 6px;
                    }
                    
                    @media (min-width: 768px) {
                      .contract-content ul ul,
                      .contract-content ol ol {
                        margin-left: 20px;
                        margin-top: 8px;
                        margin-bottom: 8px;
                      }
                    }
                    
                    .contract-content ul ul {
                      list-style-type: circle;
                    }
                    
                    .contract-content ul ul ul {
                      list-style-type: square;
                    }
                    
                    .contract-content ol ol {
                      list-style-type: lower-alpha;
                    }
                    
                    .contract-content ol ol ol {
                      list-style-type: lower-roman;
                    }
                    
                    /* Paragraph spacing */
                    .contract-content p {
                      margin-bottom: 12px;
                    }
                    
                    @media (min-width: 768px) {
                      .contract-content p {
                        margin-bottom: 16px;
                      }
                    }
                    
                    /* Bold text */
                    .contract-content strong,
                    .contract-content b {
                      font-weight: bold;
                      color: #111827;
                    }
                    
                    /* Italic text */
                    .contract-content em,
                    .contract-content i {
                      font-style: italic;
                    }
                    
                    /* Underline */
                    .contract-content u {
                      text-decoration: underline;
                    }
                  </style>
                  ${contract.content}
                `,
              }}
            />
          ) : (
            <div className="text-gray-400 italic text-sm text-center py-6 md:py-8">
              No contract content provided
            </div>
          )}
        </div>

        {/* PAYMENT TERMS Section - Only show if payment terms exist */}
        {paymentTerms && (
          <div className="mb-6 md:mb-10">
            <div className="flex items-center gap-3 md:gap-4 my-4 md:my-6">
              <div className="flex-1 h-0.5 md:h-1 bg-[#C29307] rounded-2xl" />
              <h2 className="text-base md:text-lg lg:text-xl font-bold text-center whitespace-nowrap px-2">
                PAYMENT TERMS
              </h2>
              <div className="flex-1 h-0.5 md:h-1 bg-[#C29307] rounded-2xl" />
            </div>

            <div className="space-y-3 md:space-y-4 px-2 md:px-0">
              {paymentTerms.includes("<") ? (
                <div
                  className="rich-text-content prose prose-sm max-w-none text-xs md:text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: paymentTerms }}
                />
              ) : (
                <div className="whitespace-pre-wrap text-xs md:text-sm leading-relaxed">
                  {paymentTerms}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Signature Section */}
        <div className="mb-6 md:mb-10 pt-4 md:pt-6 border-t border-gray-200">
          <div className="flex items-center gap-3 md:gap-4 my-4 md:my-6">
            <div className="flex-1 h-0.5 md:h-1 bg-[#C29307] rounded-2xl" />
            <h2 className="text-base md:text-lg lg:text-xl font-bold text-center whitespace-nowrap px-2">
              SIGNATURES
            </h2>
            <div className="flex-1 h-0.5 md:h-1 bg-[#C29307] rounded-2xl" />
          </div>

          <div className="overflow-x-auto px-2 md:px-0 -mx-2 md:mx-0">
            <div className="min-w-full inline-block md:block">
              <div className="flex flex-col md:table md:w-full border-collapse">
                {/* Table Headers - Hidden on mobile, shown on desktop */}
                <div className="hidden md:table-row-group">
                  <div className="table-row">
                    <div className="table-cell py-3 px-4 text-center font-bold">
                      PARTY A
                    </div>
                    {contract.hasLawyerSignature && (
                      <div className="table-cell py-3 px-4 text-center font-bold">
                        LEGAL WITNESS
                      </div>
                    )}
                    <div className="table-cell py-3 px-4 text-center font-bold">
                      PARTY B
                    </div>
                  </div>
                </div>

                {/* Mobile Signature Cards */}
                <div className="md:hidden space-y-6">
                  {/* Party A Mobile Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="font-bold text-center text-sm mb-3 text-gray-700">
                      PARTY A
                    </div>
                    <div className="flex flex-col items-center justify-start">
                      <div className="font-bold text-sm">
                        {contract.initiatorName}
                      </div>
                      <div className="h-10 w-32 border-b-2 border-dotted border-black my-3 flex items-center justify-center">
                        {contract.creatorSignature ? (
                          <img
                            src={contract.creatorSignature}
                            alt="Creator signature"
                            className="h-8 object-contain"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">
                            Signature
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lawyer Witness Mobile Card */}
                  {contract.hasLawyerSignature && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="font-bold text-center text-sm mb-3 text-gray-700">
                        LEGAL WITNESS
                      </div>
                      <div className="flex flex-col items-center justify-start">
                        <div className="font-bold text-sm">
                          Barr. Adewale Johnson
                        </div>
                        <div className="h-10 w-32 border-b-2 border-dotted border-black my-3 flex items-center justify-center">
                          <span className="text-gray-600 italic font-serif text-sm">
                            Barr. Adewale Johnson
                          </span>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mt-1">
                            Legal Counsel
                          </p>
                          <p className="text-xs bg-[#C29307]/10 text-[#C29307] px-2 py-1 rounded-full inline-block mt-2">
                            Verified Lawyer
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Party B Mobile Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="font-bold text-center text-sm mb-3 text-gray-700">
                      PARTY B
                    </div>
                    <div className="flex flex-col items-center justify-start">
                      <div className="font-bold text-sm">
                        {contract.signeeName || "Signee Name"}
                      </div>
                      <div className="h-10 w-32 border-b-2 border-dotted border-black my-3 flex items-center justify-center">
                        {contract.signeeSignature ? (
                          <img
                            src={contract.signeeSignature}
                            alt="Signee signature"
                            className="h-8 object-contain"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">
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
                    <div className="table-cell py-4 md:py-6 px-2 md:px-4 text-center align-top border-t">
                      <div className="min-h-[100px] md:min-h-[120px] flex flex-col items-center justify-start">
                        <div className="font-bold text-sm md:text-base">
                          {contract.initiatorName}
                        </div>
                        <div className="h-10 md:h-[50px] w-32 md:w-48 border-b-2 border-dotted border-black my-3 md:mb-4 flex items-center justify-center">
                          {contract.creatorSignature ? (
                            <img
                              src={contract.creatorSignature}
                              alt="Creator signature"
                              className="h-8 md:h-10 object-contain"
                            />
                          ) : (
                            <span className="text-gray-400 text-xs md:text-sm">
                              Signature
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Lawyer Witness Signature Cell */}
                    {contract.hasLawyerSignature && (
                      <div className="table-cell py-4 md:py-6 px-2 md:px-4 text-center align-top border-t">
                        <div className="min-h-[100px] md:min-h-[120px] flex flex-col items-center justify-start">
                          <div className="font-bold text-sm md:text-base">
                            Barr. Adewale Johnson
                          </div>
                          <div className="h-10 md:h-[50px] w-32 md:w-48 border-b-2 border-dotted border-black my-3 md:mb-4 flex items-center justify-center">
                            <span className="text-gray-600 italic font-serif text-sm md:text-lg">
                              Barr. Adewale Johnson
                            </span>
                          </div>
                          <div className="text-center">
                            <p className="text-xs md:text-sm text-gray-600 mt-1">
                              Legal Counsel
                            </p>
                            <p className="text-xs bg-[#C29307]/10 text-[#C29307] px-2 py-1 rounded-full inline-block mt-2">
                              Verified Lawyer
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Party B Signature Cell */}
                    <div className="table-cell py-4 md:py-6 px-2 md:px-4 text-center align-top border-t">
                      <div className="min-h-[100px] md:min-h-[120px] flex flex-col items-center justify-start">
                        <div className="font-bold text-sm md:text-base">
                          {contract.signeeName || "Signee Name"}
                        </div>
                        <div className="h-10 md:h-[50px] w-32 md:w-48 border-b-2 border-dotted border-black my-3 md:mb-4 flex items-center justify-center">
                          {contract.signeeSignature ? (
                            <img
                              src={contract.signeeSignature}
                              alt="Signee signature"
                              className="h-8 md:h-10 object-contain"
                            />
                          ) : (
                            <span className="text-gray-400 text-xs md:text-sm">
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
          <div className="mt-8 md:mt-12 p-4 md:p-8 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-base md:text-lg font-semibold text-center mb-4 md:mb-6">
              Review & Sign Contract
            </h3>

            <div className="space-y-4 max-w-2xl mx-auto">
              <Button
                onClick={handleSign}
                className="w-full h-auto py-3 md:py-4 flex items-center justify-center gap-2 md:gap-3 bg-[#C29307] hover:bg-[#b38606] text-white"
              >
                <PenTool className="h-4 w-4 md:h-5 md:w-5" />
                <div className="text-left">
                  <div className="font-semibold text-sm md:text-base">
                    Sign Contract
                  </div>
                  <div className="text-xs opacity-90">I agree to all terms</div>
                </div>
              </Button>

              {/* <div className="md:hidden">
                <Button
                  onClick={handleReject}
                  variant="outline"
                  className="w-full h-auto py-3 flex items-center justify-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">Suggest Edits</div>
                    <div className="text-xs opacity-90">Request changes</div>
                  </div>
                </Button>
              </div> */}
            </div>

            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-300">
              <div className="flex items-start gap-2 md:gap-3 text-xs md:text-sm text-gray-600">
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
          <div className="mt-6 md:mt-8 p-4 md:p-6 border border-green-200 bg-green-50 rounded-lg">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 md:h-12 md:w-12 text-green-500 mx-auto mb-2 md:mb-4" />
              <h3 className="text-lg md:text-xl font-semibold text-green-700 mb-1 md:mb-2">
                Contract Already Signed
              </h3>
              <p className="text-green-600 text-sm md:text-base">
                This contract has been signed and is legally binding. Check your
                email for the signed document.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-[10px] md:text-xs text-gray-500 pt-4 md:pt-6 border-t border-gray-200 px-2 md:px-0">
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

      {/* <SuggestEditsModal
        open={showEditsModal}
        onOpenChange={setShowEditsModal}
        contractId={contract.id}
        contractTitle={contract.title}
        contractToken={contract.token}
        signeeEmail={contract.signeeEmail}
        onSuccess={handleEditsSubmitted}
      /> */}

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
