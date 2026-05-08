// app/components/sign-contract-form-component/ContractLIst.tsx
"use client";

import {
  Download,
  Edit,
  Eye,
  FileText,
  Loader2,
  Crown,
  Zap,
  Sparkles,
  Star,
  Play,
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
  userTier?: 'free' | 'zidlite' | 'growth' | 'premium' | 'elite';
  isPremium?: boolean;
  hasReachedLimit?: boolean;
  onRefresh?: () => void;
};

type ContractStatus = 'signed' | 'pending' | 'draft';

const ContractList: React.FC<Props> = ({ 
  contracts, 
  loading, 
  userTier = 'free',
  isPremium = false,
  hasReachedLimit = false,
}) => {
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const router = useRouter();

  // Get tier icon
  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'elite': return <Sparkles className="w-3 h-3" />;
      case 'premium': return <Crown className="w-3 h-3" />;
      case 'growth': return <Zap className="w-3 h-3" />;
      case 'zidlite': return <Zap className="w-3 h-3" />;
      default: return <Star className="w-3 h-3" />;
    }
  };

  const statusColors: Record<ContractStatus, string> = useMemo(() => ({
    signed: "bg-[var(--color-lemon-green)]/20 text-[var(--color-lemon-green)]",
    pending: "bg-[var(--color-accent-yellow)]/20 text-[var(--color-accent-yellow)]",
    draft: "bg-[var(--bg-secondary)] text-[var(--text-secondary)]",
  }), []);

  const handleContinueDraft = useCallback((contract: any) => {
    // Store contract data in sessionStorage to load it in the form
    sessionStorage.setItem('draftToLoad', JSON.stringify({
      id: contract.id,
      contract_title: contract.contract_title,
      contract_text: contract.contract_text,
      signee_name: contract.signee_name,
      signee_email: contract.signee_email,
      phone_number: contract.phone_number,
      age_consent: contract.age_consent,
      terms_consent: contract.terms_consent,
      creator_name: contract.creator_name,
      creator_signature: contract.creator_signature,
      include_lawyer_signature: contract.include_lawyer_signature,
      metadata: contract.metadata
    }));
    
    // Navigate to the create contract page with draft ID
    router.push(`/dashboard/services/contract/create-contract-form?draftId=${contract.id}`);
  }, [router]);

  const handleDownload = useCallback(async (contract: any) => {
    // Don't allow download for draft contracts
    if (contract.status === "draft") {
      Swal.fire(
        "Cannot Download Draft",
        "Please complete and send the contract before downloading.",
        "warning"
      );
      return;
    }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader />
      </div>
    );
  }
  
  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="w-16 h-16 text-[var(--text-secondary)] mb-4" />
        <p className="text-[var(--text-secondary)] text-lg mb-2">No contracts found</p>
        <p className="text-[var(--text-secondary)] text-sm mb-6">Create your first contract to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
          <Card key={contract.id} className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-[var(--color-accent-yellow)]" />
                    <h3 className="font-semibold text-lg text-[var(--text-primary)]">{title}</h3>
                    <Badge className={statusColors[validStatus]}>{status}</Badge>
                    
                    {/* Show lawyer signature badge if present */}
                    {contract.has_lawyer_signature && (
                      <Badge className="bg-purple-100 text-purple-800">
                        👨‍⚖️ Lawyer Signed
                      </Badge>
                    )}

                    {/* Show tier badge on contract */}
                    <Badge variant="outline" className="bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)]">
                      {getTierIcon(userTier)}
                      <span className="ml-1 text-xs capitalize">{userTier}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                    <span>Issue Date: {createdAt.toLocaleDateString()}</span>
                    {status === "signed" && (
                      <span>Signed Date: {sentAt.toLocaleDateString()}</span>
                    )}
                  </div>
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
                  
                  {/* Continue Draft Button - Only for draft status */}
                  {status === "draft" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContinueDraft(contract)}
                      className="border-[var(--color-accent-yellow)] text-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/10"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Continue Draft
                    </Button>
                  )}
                  
                  {/* Edit Button - Only for draft or pending */}
                  {(status === "draft" || status === "pending") && status !== "draft" && (
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
                  
                  {/* Download Button - Only for signed or completed contracts */}
                  {status !== "draft" && (
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
                  )}
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