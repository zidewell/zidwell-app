// app/components/sign-contract-form-component/PreviewTab.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { FileText, Trash2, Edit, FileText as FileIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Switch } from "@/app/components/ui/switch";
import { SignaturePad } from "../SignaturePad";

interface AttachmentFile {
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
}

interface PreviewTabProps {
  contractTitle: string;
  contractDate?: string;
  contractContent: string;
  receiverName: string;
  receiverEmail: string;
  receiverPhone?: string;
  attachments: AttachmentFile[];
  setActiveTab: (tab: string) => void;
  includeLawyerSignature?: boolean;
  onIncludeLawyerChange?: (include: boolean) => void;
  creatorName?: string;
  onCreatorNameChange?: (name: string) => void;
  localCreatorName: string;
  setLocalCreatorName: (name: string) => void;
  creatorSignature?: string | null;
  disabled?: boolean; // Add disabled prop
}

const PreviewTab: React.FC<PreviewTabProps> = ({
  contractTitle,
  contractDate,
  contractContent,
  receiverName,
  receiverEmail,
  receiverPhone,
  attachments,
  setActiveTab,
  includeLawyerSignature = false,
  onIncludeLawyerChange,
  creatorName = "",
  onCreatorNameChange,
  creatorSignature = null,
  localCreatorName,
  setLocalCreatorName,
  disabled = false, // Default to false
}) => {
  const [localSignature, setLocalSignature] = useState(creatorSignature);

  // Update local signature when creatorSignature changes
  useEffect(() => {
    setLocalSignature(creatorSignature);
  }, [creatorSignature]);

  return (
    <div className="">
      <div className="flex items-center justify-between">
        <div className="mb-5">
          <CardTitle className="text-[var(--color-accent-yellow)]">Contract Preview</CardTitle>
          <CardDescription>
            Review your contract document before sending
          </CardDescription>
        </div>
      </div>

      <div>
        {contractContent ? (
          <div className="space-y-8">
            {/* Document/PDF View */}
            <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg shadow-lg overflow-hidden print:shadow-none print:border-none">
              {/* Document Header */}
              <div id="contract-document" className="p-6 min-h-[80vh] bg-[var(--bg-primary)]">
                {/* Contract Title */}
                <div className="mb-12 text-center">
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                    {contractTitle || "Untitled Contract"}
                  </h2>
                  <p className="text-[var(--text-secondary)]">
                    Document ID: ZW-{Date.now().toString(36).toUpperCase()}
                  </p>
                  <p className="text-[var(--text-secondary)] mt-1">
                    Date:{" "}
                    {contractDate
                      ? new Date(contractDate).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : new Date().toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                  </p>
                </div>

                {/* Parties Section */}
                <div className="mb-12">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6 pb-2 border-b border-[var(--border-color)]">
                    PARTIES TO THIS AGREEMENT
                  </h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-[var(--text-secondary)] mb-2">
                          CONTRACT CREATOR (First Party)
                        </h4>
                        <div className="bg-[var(--bg-secondary)] p-4 rounded border border-[var(--border-color)]">
                          <p className="font-semibold text-[var(--text-primary)]">
                            {localCreatorName || "[Your Name]"}
                          </p>
                          <p className="text-sm text-[var(--text-secondary)] mt-1">
                            Contract Initiator
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-[var(--text-secondary)] mb-2">
                          SIGNEE (Second Party)
                        </h4>
                        <div className="bg-[var(--bg-secondary)] p-4 rounded border border-[var(--border-color)]">
                          <p className="font-semibold text-[var(--text-primary)]">
                            {receiverName || "[Signee Name]"}
                          </p>
                          {receiverEmail && (
                            <p className="text-sm text-[var(--text-secondary)] mt-1">
                              {receiverEmail}
                            </p>
                          )}
                          {receiverPhone && (
                            <p className="text-sm text-[var(--text-secondary)]">
                              {receiverPhone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contract Content */}
                <div className="mb-12">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6 pb-2 border-b border-[var(--border-color)]">
                    TERMS AND CONDITIONS
                  </h3>
                  <div className="max-w-none text-[var(--text-primary)] leading-relaxed font-serif bg-[var(--bg-secondary)] p-6 rounded border border-[var(--border-color)]">
                    {contractContent ? (
                      <div
                        className="rich-text-content"
                        dangerouslySetInnerHTML={{
                          __html: contractContent.includes("<")
                            ? contractContent
                            : contractContent
                                .split("\n")
                                .map((para) => `<p>${para}</p>`)
                                .join(""),
                        }}
                      />
                    ) : (
                      <p className="text-[var(--text-secondary)] italic">
                        No contract content provided
                      </p>
                    )}
                  </div>
                </div>

                {/* Signatures Section */}
                <div className="mt-16">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-8 pb-2 border-b border-[var(--border-color)]">
                    SIGNATURES
                  </h3>
                  <div
                    className={`grid gap-8 ${
                      includeLawyerSignature
                        ? "md:grid-cols-3"
                        : "md:grid-cols-2"
                    }`}
                  >
                    {/* Contract Creator Signature */}
                    <div className="space-y-4">
                      <div className="border-t border-[var(--border-color)] pt-4">
                        <p className="text-sm font-medium text-[var(--text-secondary)] mb-4 text-center">
                          PARTY A
                        </p>
                        <div className="h-32 border-b border-[var(--border-color)] flex items-end justify-center mb-4">
                          {localSignature ? (
                            <div className="text-center">
                              <img
                                src={localSignature}
                                alt="Creator signature"
                                className="h-20 object-contain mx-auto"
                              />
                            </div>
                          ) : (
                            <div className="h-20 w-40 border border-dashed border-[var(--border-color)] rounded flex items-center justify-center">
                              <p className="text-[var(--text-secondary)] text-sm">
                                Signature Required
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-[var(--text-primary)]">
                            {localCreatorName || "[Your Name]"}
                          </p>
                          <p className="text-sm text-[var(--text-secondary)] mt-1">
                            First Party - Contract Creator
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Lawyer Signature (Conditional) */}
                    {includeLawyerSignature && (
                      <div className="space-y-4">
                        <div className="border-t border-[var(--border-color)] pt-4">
                          <div className="flex items-center mb-4">
                            <div className="h-6 w-6 bg-[var(--color-accent-yellow)] rounded-full flex items-center justify-center mr-2">
                              <span className="text-[var(--color-ink)] text-xs">✓</span>
                            </div>
                            <p className="text-sm font-medium text-[var(--color-accent-yellow)]">
                              LEGAL WITNESS SIGNATURE
                            </p>
                          </div>
                          <div className="h-32 border-b border-[var(--border-color)] flex items-end justify-center mb-4">
                            <div className="text-center">
                              <p className="text-[var(--text-secondary)] italic font-serif text-lg">
                                Barr. Adewale Johnson
                              </p>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-[var(--text-primary)]">
                              Barr. Adewale Johnson
                            </p>
                            <p className="text-sm text-[var(--text-secondary)] mt-1">
                              Legal Counsel
                            </p>
                            <p className="text-xs bg-[var(--color-accent-yellow)]/10 text-[var(--color-accent-yellow)] px-2 py-1 rounded-full inline-block mt-2">
                              Verified Lawyer
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Signee Signature */}
                    <div className="space-y-4">
                      <div className="border-t border-[var(--border-color)] pt-4">
                        <p className="text-sm font-medium text-[var(--text-secondary)] mb-4 text-center">
                          PARTY B
                        </p>
                        <div className="h-32 border-b border-[var(--border-color)] flex items-end justify-center mb-4">
                          <div className="text-center">
                            <p className="text-[var(--text-secondary)] italic font-serif text-lg">
                              {receiverName || "[Signee Name]"}
                            </p>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-[var(--text-primary)]">
                            {receiverName || "[Signee Name]"}
                          </p>
                          <p className="text-sm text-[var(--text-secondary)] mt-1">
                            Second Party - Signee
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] italic mt-2">
                            (Awaiting signature)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Footer */}
                <div className="mt-16 pt-8 border-t border-[var(--border-color)]">
                  <div className="flex flex-col md:flex-row justify-between items-center text-xs text-[var(--text-secondary)]">
                    <div className="mb-4 md:mb-0">
                      <p>Page 1 of 1</p>
                      <p className="mt-1">
                        This document is electronically generated and legally
                        binding
                      </p>
                    </div>
                    <div className="text-center md:text-right">
                      <p>Zidwell Legal Contract System</p>
                      <p className="mt-1">www.zidwell.com • info@zidwell.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            {attachments.length > 0 && (
              <div className="border border-[var(--border-color)] rounded-lg p-6 bg-[var(--bg-secondary)]">
                <h4 className="text-lg font-medium mb-4 text-[var(--text-primary)] flex items-center">
                  <FileIcon className="h-5 w-5 mr-2 text-[var(--text-secondary)]" />
                  Attached Documents ({attachments.length})
                </h4>
                <div className="space-y-3">
                  {attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)]"
                    >
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-[var(--text-secondary)] mr-3" />
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {attachment.name}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {(attachment.size / 1024).toFixed(0)} KB •{" "}
                            {attachment.type.split("/").pop()?.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        Attached
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-[var(--border-color)] print:hidden">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("create")}
                  className="flex-1"
                  disabled={disabled} // Apply disabled prop
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Back To Edit Contract
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="h-16 w-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-[var(--text-secondary)]" />
              </div>
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                No contract content to preview
              </h3>
              <p className="text-[var(--text-secondary)] mb-6">
                Switch to the "Write Contract" tab to create your contract
                document
              </p>
              <Button
                variant="default"
                onClick={() => setActiveTab("create")}
                className="bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90 text-[var(--color-ink)]"
                disabled={disabled} // Apply disabled prop
              >
                <Edit className="h-4 w-4 mr-2" />
                Write Contract
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add this style tag at the end of the component */}
      <style jsx global>{`
        /* Rich text content styling for PreviewTab */
        .rich-text-content {
          font-family: var(--font-be-vietnam), inherit;
          line-height: 1.6;
          color: var(--text-primary);
        }

        .rich-text-content h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin: 1.5rem 0 1rem 0;
          color: var(--text-primary);
        }

        .rich-text-content h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.25rem 0 0.75rem 0;
          color: var(--text-primary);
        }

        .rich-text-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
          color: var(--text-primary);
        }

        .rich-text-content p {
          margin: 0.75rem 0;
          line-height: 1.6;
        }

        /* List styles - these are the most important */
        .rich-text-content ul,
        .rich-text-content ol {
          margin: 0.75rem 0 !important;
          padding-left: 1.5rem !important;
        }

        .rich-text-content ul {
          list-style-type: disc !important;
        }

        .rich-text-content ol {
          list-style-type: decimal !important;
        }

        .rich-text-content li {
          margin: 0.25rem 0 !important;
          display: list-item !important;
        }

        /* Text formatting */
        .rich-text-content strong,
        .rich-text-content b {
          font-weight: bold !important;
        }

        .rich-text-content em,
        .rich-text-content i {
          font-style: italic !important;
        }

        .rich-text-content u {
          text-decoration: underline !important;
        }

        .rich-text-content a {
          color: var(--color-accent-yellow);
          text-decoration: underline;
        }

        /* Selection */
        .rich-text-content ::selection {
          background-color: rgba(var(--color-accent-yellow), 0.2);
        }
      `}</style>
    </div>
  );
};

export default PreviewTab;