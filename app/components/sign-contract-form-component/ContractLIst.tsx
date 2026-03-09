"use client";

import {
  Download,
  Edit,
  Eye,
  FileText,
  Loader2,
  AlertCircle,
  Wallet,
} from "lucide-react";
import React, { useState, useMemo, useCallback } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import Loader from "../Loader";
import ContractsPreview from "../previews/ContractsPreview";
import Link from "next/link";

type Props = {
  contracts: any[];
  loading: boolean;
  userTier?: 'free' | 'growth' | 'premium' | 'elite';
  isPremium?: boolean;
  hasReachedLimit?: boolean;
  requiresPayment?: boolean;
  contractFee?: number;
  onRefresh?: () => void;
};

type ContractStatus = 'signed' | 'pending' | 'draft';

const ContractList: React.FC<Props> = ({ 
  contracts, 
  loading, 
  userTier = 'free',
  isPremium = false,
  hasReachedLimit = false,
  requiresPayment = false,
  contractFee = 10,
}) => {
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const router = useRouter();

  const statusColors: Record<ContractStatus, string> = useMemo(() => ({
    signed: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    draft: "bg-gray-100 text-gray-800",
  }), []);

  const handleDownload = useCallback(async (contract: any) => {
    if (!contract.contract_text?.trim()) {
      Swal.fire(
        "Empty Contract",
        "This contract has no text to download.",
        "warning"
      );
      return;
    }

    setLoadingMap((prev) => ({ ...prev, [contract.id]: true }));
    try {
      const res = await fetch("/api/contract/download-signed-contract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contract_token: contract.token,
          contract: {
            ...contract,
            contract_title: contract.contract_title,
            contract_text: contract.contract_text,
            initiator_name: contract.initiator_name,
            signee_name: contract.signee_name,
            signee_email: contract.signee_email,
            token: contract.token,
            created_at: contract.created_at,
            signed_at: contract.signed_at,
            signature_date: contract.signature_date,
            status: contract.status,
            verification_status: contract.verification_status,
            has_lawyer_signature: contract.has_lawyer_signature,
            creator_signature: contract.creator_signature,
            signee_signature_image: contract.signee_signature_image,
          },
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate PDF");
      }

      const blob = await res.blob();
      const contractTitle =
        contract.contract_title?.replace(/[^a-z0-9]/gi, "-").toLowerCase() ||
        "contract";
      const fileName = `${contractTitle}-${
        contract.token
      }-${new Date().getTime()}.pdf`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      Swal.fire(
        "Download Successful",
        "The signed contract has been downloaded.",
        "success"
      );
    } catch (err) {
      console.error(err);
      Swal.fire(
        "Error",
        err instanceof Error
          ? err.message
          : "An error occurred while generating the PDF.",
        "error"
      );
    } finally {
      setLoadingMap((prev) => ({ ...prev, [contract.id]: false }));
    }
  }, []);

  const handleAddLawyerSignature = useCallback(async (contract: any) => {
    if (!isPremium) {
      setShowUpgradePrompt(true);
      return;
    }
    router.push(`/dashboard/services/contract/${contract.id}/lawyer-signature`);
  }, [isPremium, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }
  
  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg mb-2">No contracts found</p>
        <p className="text-gray-400 text-sm mb-6">Create your first contract to get started</p>
        
        {/* Pay-per-use info in empty state */}
        {hasReachedLimit && !isPremium && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md">
            <div className="flex items-start gap-3">
              <Wallet className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-medium text-blue-800">Pay-per-use Available</h3>
                <p className="text-sm text-blue-700 mt-1">
                  You've reached your free limit. Create contracts for ₦{contractFee} each.
                </p>
                <Link href="/dashboard/services/contract/create-contract-form?payPerUse=true">
                  <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700 text-white">
                    <Wallet className="w-4 h-4 mr-2" />
                    Pay ₦{contractFee} & Create
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Feature Requires Upgrade</h3>
            <p className="text-gray-600 text-center mb-6">
              Lawyer signatures are available on Premium and Elite plans only.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowUpgradePrompt(false)}
              >
                Cancel
              </Button>
              <Link href="/pricing?upgrade=premium" className="flex-1">
                <Button className="w-full bg-[#C29307] hover:bg-[#b38606] text-white">
                  Upgrade to Premium
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {contracts?.map((contract) => {
        const title = contract.contract_title || "Untitled Contract";
        const status = contract.status || "draft";
        const createdAt = contract.created_at?.toDate?.() || new Date(contract.created_at);
        const sentAt = contract.sent_at?.toDate?.() || new Date(contract.sent_at);
        const isDownloading = loadingMap[contract.id];

        // Ensure status is a valid key for statusColors
        const validStatus = (status === 'signed' || status === 'pending' || status === 'draft') 
          ? status as ContractStatus 
          : 'draft';

        return (
          <Card key={contract.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-lg">{title}</h3>
                    <Badge className={statusColors[validStatus]}>{status}</Badge>
                    
                    {/* Show lawyer signature badge if present */}
                    {contract.has_lawyer_signature && (
                      <Badge className="bg-purple-100 text-purple-800">
                        👨‍⚖️ Lawyer Signed
                      </Badge>
                    )}
                    
                    {/* Show pay-per-use badge if applicable */}
                    {hasReachedLimit && !isPremium && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Wallet className="w-3 h-3 mr-1" />
                        Pay-per-use
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Issue Date: {createdAt.toLocaleDateString()}</span>
                    {status === "signed" && (
                      <span>Signed Date: {sentAt.toLocaleDateString()}</span>
                    )}
                  </div>

                  {/* Show lawyer signature availability */}
                  {status === "pending" && !contract.has_lawyer_signature && (
                    <div className="mt-2">
                      {isPremium ? (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => handleAddLawyerSignature(contract)}
                          className="text-purple-600 hover:text-purple-700 p-0 h-auto text-xs"
                        >
                          Add Lawyer Signature (₦10,000)
                        </Button>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Lawyer signatures available on Premium plans •{" "}
                          <button
                            onClick={() => setShowUpgradePrompt(true)}
                            className="text-[#C29307] hover:underline"
                          >
                            Upgrade
                          </button>
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedContract(contract);
                      setIsPreviewOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  {(status === "draft" || status === "pending") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/dashboard/services/contract/edit/${contract.id}`
                        )
                      }
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDownload(contract)}
                    variant="outline"
                    size="sm"
                    disabled={status === "pending" || isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-1" />
                    )}
                    {isDownloading ? "Downloading..." : "Download"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Preview Modal */}
      <ContractsPreview
        isOpen={isPreviewOpen}
        contract={selectedContract}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
};

export default ContractList;