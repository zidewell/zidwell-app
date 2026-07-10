// app/components/sign-contract-form-component/ContractSummary.tsx
"use client";

import { Button } from "../ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  AlertCircle,
  Scale,
  Crown,
  Zap,
  Sparkles,
  Star,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
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
  onClose?: () => void;
  contractType?: string;
  dateCreated?: string;
  attachments?: AttachmentFile[];
  currentLawyerSignature?: boolean;
  contractDate?: string;
  userTier?: "free" | "solopreneur" | "sme" | "enterprise" | "corporation";
  contractCount?: number;
  hasUnlimitedContracts?: boolean;
}

export default function ContractSummary({
  contractTitle,
  contractContent,
  initiatorName,
  initiatorEmail,
  receiverName,
  receiverEmail,
  receiverPhone,
  confirmContract,
  contractDate,
  onBack,
  onConfirm,
  onClose,
  contractType = "Service Agreement",
  dateCreated = new Date().toLocaleDateString(),
  attachments = [],
  currentLawyerSignature = false,
  userTier = "free",
  contractCount = 0,
  hasUnlimitedContracts = false,
}: ContractSummaryProps) {
  const [includeLawyerSignature, setIncludeLawyerSignature] = useState(
    currentLawyerSignature,
  );
  const LAWYER_FEE = 10000;

  // Determine user's contract limits with all 5 tiers
  const isFree = userTier === "free";
  const isSolopreneurUser = userTier === "solopreneur";
  const isSMEUser = userTier === "sme";
  const isEnterpriseUser = userTier === "enterprise";
  const isCorporationUser = userTier === "corporation";
  const unlimited = hasUnlimitedContracts || isCorporationUser || isEnterpriseUser || isSMEUser;

  // Check if lawyer signature is available for this tier
  // Only Enterprise and Corporation have lawyer signature
  const canAddLawyerSignature = isEnterpriseUser || isCorporationUser;

  // Contract limits by tier
  const freeTierLimit = 0;
  const solopreneurLimit = 0;
  const smeLimit = 1;
  const enterpriseLimit = 10;
  // Corporation has unlimited

  // Get tier icon
  const getTierIcon = () => {
    if (isCorporationUser) return <Sparkles className="w-4 h-4 text-purple-600" />;
    if (isEnterpriseUser) return <Crown className="w-4 h-4 text-amber-600" />;
    if (isSMEUser) return <Star className="w-4 h-4 text-(--color-accent-yellow)" />;
    if (isSolopreneurUser) return <Zap className="w-4 h-4 text-blue-600" />;
    return <Star className="w-4 h-4 text-(--text-secondary)" />;
  };

  // Get tier display name
  const getTierDisplayName = () => {
    if (isCorporationUser) return "Corporation";
    if (isEnterpriseUser) return "Enterprise";
    if (isSMEUser) return "SME";
    if (isSolopreneurUser) return "Solopreneur";
    return "Free Trial";
  };

  // Get tier colors
  const getTierColors = () => {
    if (isCorporationUser)
      return {
        bg: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-700",
        icon: "text-purple-600",
        badge: "bg-purple-100",
      };
    if (isEnterpriseUser)
      return {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        icon: "text-amber-600",
        badge: "bg-amber-100",
      };
    if (isSMEUser)
      return {
        bg: "bg-(--color-accent-yellow)/10",
        border: "border-(--color-accent-yellow)",
        text: "text-(--color-accent-yellow)",
        icon: "text-(--color-accent-yellow)",
        badge: "bg-(--color-accent-yellow)/10",
      };
    if (isSolopreneurUser)
      return {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-700",
        icon: "text-blue-600",
        badge: "bg-blue-100",
      };
    return {
      bg: "bg-(--bg-secondary)",
      border: "border-(--border-color)",
      text: "text-(--text-secondary)",
      icon: "text-(--text-secondary)",
      badge: "bg-(--bg-secondary)",
    };
  };

  // Calculate remaining contracts with proper type handling
  const getRemainingDisplay = (): string | number => {
    if (unlimited) return "unlimited";

    // Properly handle all tier cases
    if (isFree || isSolopreneurUser) {
      return 0;
    }
    if (isSMEUser) {
      return Math.max(0, smeLimit - contractCount);
    }
    if (isEnterpriseUser) {
      return Math.max(0, enterpriseLimit - contractCount);
    }

    return 0;
  };

  const remaining = getRemainingDisplay();

  // Check if user has free contract available (with proper type checking)
  const hasFreeContract = (): boolean => {
    if (unlimited) return true;

    if (typeof remaining === "number") {
      return remaining > 0;
    }

    return false;
  };

  // Get limit display text
  const getLimitText = (): string => {
    if (unlimited) return "Unlimited";
    if (isFree || isSolopreneurUser) return `${contractCount}/0`;
    if (isSMEUser) return `${contractCount}/${smeLimit}`;
    if (isEnterpriseUser) return `${contractCount}/${enterpriseLimit}`;
    return `${contractCount}/0`;
  };

  // Sync with parent component state
  useEffect(() => {
    setIncludeLawyerSignature(currentLawyerSignature);
  }, [currentLawyerSignature]);

  // Reset lawyer signature if user can't add it
  useEffect(() => {
    if (!canAddLawyerSignature && includeLawyerSignature) {
      setIncludeLawyerSignature(false);
    }
  }, [canAddLawyerSignature, includeLawyerSignature]);

  // Truncate contract content for preview
  const truncatedContent =
    contractContent.length > 200
      ? contractContent.substring(0, 200) + "..."
      : contractContent;

  const handleToggleLawyerSignature = (checked: boolean) => {
    if (canAddLawyerSignature) {
      setIncludeLawyerSignature(checked);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      includeLawyerSignature: canAddLawyerSignature
        ? includeLawyerSignature
        : false,
    });
  };

  const handleBack = () => {
    onBack();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleBack();
      if (onClose) onClose();
    }
  };

  // Get status banner
  const getStatusBanner = () => {
    const colors = getTierColors();

    if (unlimited) {
      return {
        bg: colors.bg,
        border: colors.border,
        text: colors.text,
        icon: getTierIcon(),
        title: `${getTierDisplayName()} Plan`,
        message: "Unlimited contracts included",
        badge: colors.badge,
      };
    }

    if (hasFreeContract()) {
      return {
        bg: "bg-(--color-lemon-green)/10",
        border: "border-(--color-lemon-green)/20",
        text: "text-(--color-lemon-green)",
        icon: <span className="text-2xl">🎉</span>,
        title: isSMEUser
          ? "SME Contract Available"
          : isEnterpriseUser
          ? "Enterprise Contract Available"
          : "Contract Available",
        message: `You have ${remaining} contract${remaining !== 1 ? "s" : ""} remaining`,
        badge: "bg-(--color-lemon-green)/20",
      };
    }

    return {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      icon: <span className="text-2xl">⚠️</span>,
      title: isFree || isSolopreneurUser
        ? "No Contracts Available"
        : isSMEUser
        ? "SME Limit Reached"
        : "Enterprise Limit Reached",
      message: isFree || isSolopreneurUser
        ? "Upgrade to SME or higher for contracts"
        : isSMEUser
        ? "Upgrade to Enterprise for more contracts"
        : "Upgrade to Corporation for unlimited contracts",
      badge: "bg-red-100",
    };
  };

  const banner = getStatusBanner();

  return (
    <AnimatePresence>
      {confirmContract && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
          />

          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <div className="max-w-lg w-full mx-auto bg-(--bg-primary) rounded-xl shadow-lg p-6 space-y-6 max-h-[90vh] overflow-y-auto">
              {/* Status Banner */}
              <div
                className={`${banner.bg} ${banner.border} border rounded-lg p-4`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{banner.icon}</span>
                  <div className="flex-1">
                    <p className={`font-semibold ${banner.text}`}>
                      {banner.title}
                    </p>
                    <p className="text-sm text-(--text-secondary)">
                      {banner.message}
                    </p>
                  </div>
                  {!unlimited && (
                    <Badge variant="outline" className={banner.badge}>
                      {getLimitText()} used
                    </Badge>
                  )}
                  {canAddLawyerSignature && includeLawyerSignature && (
                    <Badge
                      variant="outline"
                      className="bg-blue-100 text-blue-800 border-blue-300"
                    >
                      +₦{LAWYER_FEE.toLocaleString()}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Header */}
              <div className="text-center border-b border-(--border-color) pb-4">
                <h2 className="text-lg font-semibold text-(--text-primary)">
                  Contract Summary
                </h2>
                <div className="mt-2">
                  <div className="text-sm text-(--text-secondary) mt-1">
                    {contractType}
                  </div>
                </div>
              </div>

              {/* Contract Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-(--text-primary) mb-2">
                      Contract Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <div className="text-(--text-secondary)">Title</div>
                        <div className="font-medium truncate text-(--text-primary)">
                          {contractTitle || "Untitled"}
                        </div>
                      </div>
                      <div>
                        <div className="text-(--text-secondary)">Date</div>
                        <div className="text-(--text-primary)">
                          {contractDate
                            ? new Date(contractDate).toLocaleDateString()
                            : dateCreated}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-(--text-primary) mb-2">
                      Parties
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <div className="text-(--text-secondary)">Initiator</div>
                        <div className="font-medium truncate text-(--text-primary)">
                          {initiatorName || "Not specified"}
                        </div>
                      </div>
                      <div>
                        <div className="text-(--text-secondary)">Signee</div>
                        <div className="font-medium truncate text-(--text-primary)">
                          {receiverName || "Not specified"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Preview */}
                {contractContent && (
                  <div>
                    <h4 className="text-sm font-medium text-(--text-primary) mb-2">
                      Contract Content
                    </h4>
                    <div className="bg-(--bg-secondary) rounded p-3 text-sm text-(--text-primary)">
                      <div
                        dangerouslySetInnerHTML={{ __html: truncatedContent }}
                      />
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-(--text-primary) mb-2">
                      Attachments ({attachments.length})
                    </h4>
                    <div className="bg-(--bg-secondary) rounded p-3">
                      <div className="space-y-1">
                        {attachments.slice(0, 3).map((attachment, index) => (
                          <div
                            key={index}
                            className="flex items-center text-sm text-(--text-primary)"
                          >
                            <FileText className="h-4 w-4 text-(--text-secondary) mr-2" />
                            <span className="truncate flex-1">
                              {attachment.name}
                            </span>
                          </div>
                        ))}
                        {attachments.length > 3 && (
                          <div className="text-xs text-(--text-secondary) text-center pt-1">
                            +{attachments.length - 3} more files
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Lawyer Signature Option - Only show for Enterprise and Corporation */}
              {canAddLawyerSignature && (
                <div className="bg-(--bg-secondary) rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-purple-600" />
                      <h4 className="text-sm font-medium text-(--text-primary)">
                        Add Lawyer Signature
                      </h4>
                    </div>
                    <Switch
                      checked={includeLawyerSignature}
                      onCheckedChange={handleToggleLawyerSignature}
                      className="data-[state=checked]:bg-(--color-accent-yellow)"
                    />
                  </div>
                  {includeLawyerSignature && (
                    <div className="mt-2 text-sm text-(--text-secondary)">
                      <p>
                        Lawyer signature adds legal validity and professional
                        verification
                      </p>
                      <p className="font-semibold text-purple-600 mt-1">
                        Fee: ₦{LAWYER_FEE.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Upgrade Message for Free, Solopreneur, and SME Users */}
              {!canAddLawyerSignature && (
                <div className={`${isSMEUser ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4`}>
                  <div className="flex items-start gap-2">
                    <Sparkles className={`h-4 w-4 ${isSMEUser ? 'text-amber-600' : 'text-blue-600'} mt-0.5 shrink-0`} />
                    <div className="text-sm">
                      <p className={`font-medium ${isSMEUser ? 'text-amber-800' : 'text-blue-800'} mb-1`}>
                        {isFree || isSolopreneurUser
                          ? "Upgrade to Access Lawyer Signatures"
                          : "Upgrade to Enterprise for Lawyer Signatures"}
                      </p>
                      <p className={isSMEUser ? 'text-amber-600' : 'text-blue-600'}>
                        {isFree
                          ? "Upgrade to Enterprise or Corporation plans to add lawyer signatures to your contracts."
                          : isSolopreneurUser
                          ? "Upgrade to Enterprise or Corporation plans to add lawyer signatures to your contracts."
                          : "Upgrade to Enterprise or higher plans to add lawyer signatures to your contracts."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <Separator className="bg-(--border-color)" />
              <div className="flex justify-between font-bold text-base">
                <span className="text-(--text-primary)">Total Amount</span>
                <span className="text-(--text-primary)">
                  {canAddLawyerSignature && includeLawyerSignature
                    ? `₦${LAWYER_FEE.toLocaleString()}`
                    : "₦0"}
                </span>
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
                      {canAddLawyerSignature && includeLawyerSignature && (
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>
                            Lawyer signature adds legal validity (₦
                            {LAWYER_FEE.toLocaleString()})
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-(--border-color)">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleBack();
                    if (onClose) onClose();
                  }}
                  className="flex-1 border-(--border-color) text-(--text-primary) hover:bg-(--bg-secondary)"
                >
                  Back to Edit
                </Button>
                <Button
                  onClick={handleConfirm}
                  className={`flex-1 bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink)`}
                  disabled={!hasFreeContract() && !unlimited}
                >
                  {canAddLawyerSignature && includeLawyerSignature ? (
                    <div className="flex items-center justify-center">
                      <Scale className="h-4 w-4 mr-2" />
                      Pay ₦{LAWYER_FEE.toLocaleString()} & Send
                    </div>
                  ) : (
                    "Send for Signature"
                  )}
                </Button>
              </div>

              {/* Status Indicator */}
              <div className="text-center text-xs text-(--text-secondary) pt-2">
                <div className="flex items-center justify-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      canAddLawyerSignature && includeLawyerSignature
                        ? "bg-(--color-accent-yellow)"
                        : unlimited
                        ? "bg-purple-600"
                        : hasFreeContract()
                        ? "bg-(--color-lemon-green)"
                        : "bg-red-600"
                    }`}
                  ></div>
                  <span>
                    {canAddLawyerSignature && includeLawyerSignature
                      ? "Lawyer signature included"
                      : unlimited
                      ? "Unlimited contracts"
                      : hasFreeContract()
                      ? `Free contract (${remaining} remaining)`
                      : isFree || isSolopreneurUser
                      ? "No contracts available - upgrade required"
                      : "Limit reached - upgrade required"}
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