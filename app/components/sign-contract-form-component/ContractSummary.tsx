"use client";

import { Button } from "../ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Shield,
  Lock,
  AlertCircle,
  Scale,
  Gavel,
  SpellCheck,
  Star,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";

interface AttachmentFile {
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
}

interface ContractSummaryProps {
  contractTitle: string;
  contractContent: string;
  initiatorName: string;
  initiatorEmail: string;
  receiverName: string;
  receiverEmail: string;
  receiverPhone?: string;
  amount: number;
  confirmContract: boolean;
  onBack: () => void;
  onConfirm: (options?: { includeLawyerSignature: boolean }) => void;
  onClose?: () => void; // Add this line
  contractType?: string;
  dateCreated?: string;
  status?: string;
  attachments?: AttachmentFile[];
  currentLawyerSignature?: boolean;
  contractDate?: string;
}

export default function ContractSummary({
  contractTitle,
  contractContent,
  initiatorName,
  initiatorEmail,
  receiverName,
  receiverEmail,
  receiverPhone,
  amount,
  confirmContract,
  contractDate,
  onBack,
  onConfirm,
  onClose, // Add this line
  contractType = "Service Agreement",
  dateCreated = new Date().toLocaleDateString(),
  status = "pending",
  attachments = [],
  currentLawyerSignature = false,
}: ContractSummaryProps) {
  const [includeLawyerSignature, setIncludeLawyerSignature] = useState(
    currentLawyerSignature
  );
  const [totalAmount, setTotalAmount] = useState(amount);
  const LAWYER_FEE = 10000;

  // Sync with parent component state
  useEffect(() => {
    setIncludeLawyerSignature(currentLawyerSignature);
  }, [currentLawyerSignature]);

  // Truncate contract content for preview
  const truncatedContent =
    contractContent.length > 200
      ? contractContent.substring(0, 200) + "..."
      : contractContent;

  // Calculate total amount when lawyer signature is selected
  useEffect(() => {
    if (includeLawyerSignature) {
      setTotalAmount(amount + LAWYER_FEE);
    } else {
      setTotalAmount(amount);
    }
  }, [includeLawyerSignature, amount, LAWYER_FEE]);

  const handleToggleLawyerSignature = (checked: boolean) => {
    setIncludeLawyerSignature(checked);
  };

  const handleConfirm = () => {
    onConfirm({
      includeLawyerSignature,
    });
  };

  const handleBack = () => {
    onBack();
  };

  // Handle clicking on backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleBack();
      // Also call onClose if provided
      if (onClose) {
        onClose();
      }
    }
  };

  return (
    <AnimatePresence>
      {confirmContract && (
        <>
          {/* 🔲 Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick} // Updated to use new handler
          />

          {/* 📄 Modal Container */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <div className="max-w-lg w-full mx-auto bg-white rounded-xl shadow-lg p-6 space-y-6 max-h-[90vh] overflow-y-auto">
              {/* Header with Amount */}
              <div className="text-center border-b pb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Contract Summary
                </h2>
                <div className="mt-2">
                  <div className="text-3xl font-bold text-gray-900">
                    ₦{totalAmount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {contractType}
                  </div>
                </div>
              </div>

              {/* Contract Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Contract Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <div className="text-gray-500">Title</div>
                        <div className="font-medium truncate">
                          {contractTitle || "Untitled"}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Date</div>
                        <div>
                          {contractDate
                            ? new Date(contractDate).toLocaleDateString()
                            : dateCreated}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Parties
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <div className="text-gray-500">Initiator</div>
                        <div className="font-medium truncate">
                          {initiatorName || "Not specified"}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Signee</div>
                        <div className="font-medium truncate">
                          {receiverName || "Not specified"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attachments */}
                {attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Attachments ({attachments.length})
                    </h4>
                    <div className="bg-gray-50 rounded p-3">
                      <div className="space-y-1">
                        {attachments.slice(0, 3).map((attachment, index) => (
                          <div
                            key={index}
                            className="flex items-center text-sm"
                          >
                            <FileText className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="truncate flex-1">
                              {attachment.name}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              {(attachment.size / 1024).toFixed(0)}KB
                            </span>
                          </div>
                        ))}
                        {attachments.length > 3 && (
                          <div className="text-xs text-gray-500 text-center pt-1">
                            +{attachments.length - 3} more files
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Payment Summary
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Contract Fee</span>
                    <span className="text-gray-900">
                      ₦{amount.toLocaleString()}
                    </span>
                  </div>
                  {includeLawyerSignature && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Lawyer Signature</span>
                      <span className="text-gray-900">
                        ₦{LAWYER_FEE.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-base">
                    <span className="text-gray-900">Total Amount</span>
                    <span className="text-gray-900">
                      ₦{totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 text-center pt-2">
                    {includeLawyerSignature
                      ? "Includes lawyer signature fee"
                      : "Base contract fee only"}
                  </div>
                </div>
              </div>

              {/* Important Note */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <p className="font-medium text-amber-800 mb-1">
                      Important Note
                    </p>
                    <ul className="text-amber-700 space-y-1">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Contract cannot be edited after sending</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          You'll receive signing notifications via email
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          All contracts are securely stored with audit trail
                        </span>
                      </li>
                      {includeLawyerSignature && (
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>
                            Lawyer signature adds legal validity and
                            professional verification
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleBack();
                    if (onClose) onClose(); // Call onClose when back button is clicked
                  }}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  Back to Edit
                </Button>
                <Button
                  onClick={handleConfirm}
                  className={`flex-1 ${
                    includeLawyerSignature
                      ? "bg-[#C29307] hover:bg-[#b38606]"
                      : "bg-[#C29307] hover:bg-[#b38606]"
                  } text-white`}
                >
                  {includeLawyerSignature ? (
                    <div className="flex items-center justify-center">
                      <Scale className="h-4 w-4 mr-2" />
                      Send with Lawyer Signature
                    </div>
                  ) : (
                    "Send for Signature"
                  )}
                </Button>
              </div>

              {/* Status Indicator */}
              <div className="text-center text-xs text-gray-500 pt-2">
                <div className="flex items-center justify-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      includeLawyerSignature ? "bg-[#C29307]" : "bg-gray-300"
                    }`}
                  ></div>
                  <span>
                    {includeLawyerSignature
                      ? "Lawyer signature included"
                      : "Standard contract (no lawyer signature)"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
