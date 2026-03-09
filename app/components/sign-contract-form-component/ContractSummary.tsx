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
  Wallet,
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

interface ContractUsageInfo {
  used: number;
  limit: number | "unlimited";
  remaining: number | "unlimited";
  hasAccess: boolean;
  isChecking: boolean;
  isPayPerUse?: boolean;
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
  onClose?: () => void;
  contractType?: string;
  dateCreated?: string;
  status?: string;
  attachments?: AttachmentFile[];
  currentLawyerSignature?: boolean;
  contractDate?: string;
  // New props for usage tracking
  usageInfo?: ContractUsageInfo;
  userTier?: 'free' | 'growth' | 'premium' | 'elite';
  walletBalance?: number;
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
  onClose,
  contractType = "Service Agreement",
  dateCreated = new Date().toLocaleDateString(),
  status = "pending",
  attachments = [],
  currentLawyerSignature = false,
  usageInfo,
  userTier = 'free',
  walletBalance = 0,
}: ContractSummaryProps) {
  const [includeLawyerSignature, setIncludeLawyerSignature] = useState(
    currentLawyerSignature
  );
  const [totalAmount, setTotalAmount] = useState(amount);
  const LAWYER_FEE = 10000;
  const CONTRACT_FEE = 10;

  // Determine user's contract limits
  const isPremium = userTier === 'premium' || userTier === 'elite';
  const isGrowth = userTier === 'growth';
  const hasUnlimitedContracts = isPremium || isGrowth;

  // Safe function to get remaining contracts
  const getRemainingContracts = (): number => {
    if (hasUnlimitedContracts) return 999;
    if (usageInfo && typeof usageInfo.remaining === 'number') {
      return usageInfo.remaining;
    }
    return 1; // Default free tier limit
  };

  const remainingContracts = getRemainingContracts();
  const hasFreeContract = hasUnlimitedContracts || remainingContracts > 0;
  
  // Calculate if this contract requires payment
  const requiresPayment = !hasFreeContract || includeLawyerSignature;
  
  // Calculate the actual fee based on user's tier and selections
  const getActualFee = (): number => {
    if (includeLawyerSignature) {
      return CONTRACT_FEE + LAWYER_FEE; // Always pay lawyer fee
    }
    if (hasFreeContract && !hasUnlimitedContracts) {
      return 0; // Free contract within limit
    }
    return CONTRACT_FEE; // Pay-per-use or growth/premium (but premium already handled)
  };

  const actualFee = getActualFee();
  const hasSufficientBalance = walletBalance >= actualFee;

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
      if (onClose) {
        onClose();
      }
    }
  };

  // Get status banner color and text
  const getStatusBanner = () => {
    if (hasUnlimitedContracts) {
      return {
        bg: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-700",
        icon: "👑",
        title: `${userTier === 'growth' ? 'Growth' : 'Premium'} Plan`,
        message: "Unlimited contracts included",
      };
    }
    if (hasFreeContract) {
      return {
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-700",
        icon: "🎉",
        title: "Free Contract Available",
        message: `You have ${remainingContracts} free contract${remainingContracts !== 1 ? 's' : ''} remaining this month`,
      };
    }
    if (includeLawyerSignature) {
      return {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-700",
        icon: "⚖️",
        title: "Lawyer Signature Selected",
        message: "Additional fee applies",
      };
    }
    return {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-700",
      icon: "💰",
      title: "Pay-Per-Use",
      message: `₦${CONTRACT_FEE} will be charged (monthly limit reached)`,
    };
  };

  const banner = getStatusBanner();

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
            onClick={handleBackdropClick}
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
              {/* Status Banner */}
              <div className={`${banner.bg} ${banner.border} border rounded-lg p-4`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{banner.icon}</span>
                  <div className="flex-1">
                    <p className={`font-semibold ${banner.text}`}>{banner.title}</p>
                    <p className="text-sm text-gray-600">{banner.message}</p>
                  </div>
                  {!hasFreeContract && !hasUnlimitedContracts && !includeLawyerSignature && (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      Pay ₦{CONTRACT_FEE}
                    </Badge>
                  )}
                  {includeLawyerSignature && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                      +₦{LAWYER_FEE.toLocaleString()}
                    </Badge>
                  )}
                </div>
              </div>

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

              {/* Wallet Balance (if needed) */}
              {requiresPayment && (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Wallet Balance</span>
                  </div>
                  <span className={`font-semibold ${hasSufficientBalance ? 'text-green-600' : 'text-red-600'}`}>
                    ₦{walletBalance.toLocaleString()}
                  </span>
                </div>
              )}

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
                  
                  {/* Payment Status */}
                  {requiresPayment && (
                    <div className={`text-xs ${hasSufficientBalance ? 'text-green-600' : 'text-red-600'} text-center pt-2`}>
                      {hasSufficientBalance 
                        ? `✓ Sufficient balance (₦${walletBalance.toLocaleString()} available)`
                        : `✗ Insufficient balance - Please fund your wallet`}
                    </div>
                  )}
                  
                  {/* Usage Info */}
                  {!hasUnlimitedContracts && !includeLawyerSignature && (
                    <div className="text-xs text-gray-500 text-center pt-2">
                      {hasFreeContract 
                        ? `Free contract (${remainingContracts - 1} free ${remainingContracts - 1 === 1 ? 'contract' : 'contracts'} remaining this month)`
                        : `Pay-per-use contract (₦${CONTRACT_FEE}) - Monthly limit reached`}
                    </div>
                  )}
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
                            professional verification (₦{LAWYER_FEE.toLocaleString()})
                          </span>
                        </li>
                      )}
                      {!hasFreeContract && !includeLawyerSignature && (
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>
                            You've reached your monthly limit. ₦{CONTRACT_FEE} will be charged.
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
                    if (onClose) onClose();
                  }}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  Back to Edit
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={requiresPayment && !hasSufficientBalance}
                  className={`flex-1 ${
                    includeLawyerSignature
                      ? "bg-[#C29307] hover:bg-[#b38606]"
                      : !hasFreeContract && !hasUnlimitedContracts
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-[#C29307] hover:bg-[#b38606]"
                  } text-white disabled:bg-gray-400 disabled:cursor-not-allowed`}
                >
                  {includeLawyerSignature ? (
                    <div className="flex items-center justify-center">
                      <Scale className="h-4 w-4 mr-2" />
                      Pay ₦{totalAmount.toLocaleString()} & Send
                    </div>
                  ) : !hasFreeContract && !hasUnlimitedContracts ? (
                    <div className="flex items-center justify-center">
                      <Wallet className="h-4 w-4 mr-2" />
                      Pay ₦{CONTRACT_FEE} & Send
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
                      includeLawyerSignature 
                        ? "bg-[#C29307]" 
                        : !hasFreeContract && !hasUnlimitedContracts
                        ? "bg-blue-600"
                        : "bg-green-600"
                    }`}
                  ></div>
                  <span>
                    {includeLawyerSignature
                      ? "Lawyer signature included"
                      : !hasFreeContract && !hasUnlimitedContracts
                      ? "Pay-per-use mode active"
                      : "Free contract (within limit)"}
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