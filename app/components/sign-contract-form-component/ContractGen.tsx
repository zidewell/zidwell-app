// app/components/sign-contract-form-component/ContractGen.tsx
"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Crown } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { useRouter } from "next/navigation";
import ContractList from "@/app/components/sign-contract-form-component/ContractLIst";
import Link from "next/link";
import { useSubscription } from "@/app/hooks/useSubscripion";

interface ContractGenProps {
  loading: boolean;
  contracts: any[];
  onRefresh?: () => void;
}

const CONTRACT_LIMITS: Record<string, number> = {
  free: 0,
  starter: 0,
  sme: 1,
  enterprise: 10,
};

const resolveContractLimit = (tier: string): number =>
  CONTRACT_LIMITS[tier] ?? 0;

export default function ContractGen({
  loading,
  contracts,
  onRefresh,
}: ContractGenProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const router = useRouter();

  const { userTier } = useSubscription();

  const contractCount = contracts.length;
  const contractLimit = resolveContractLimit(userTier);
  const hasNoContracts = contractLimit === 0;
  const hasReachedLimit =
    hasNoContracts || contractCount >= contractLimit;

  const filteredContracts = useMemo(() => {
    return contracts?.filter((contract) => {
      const title = contract.contract_title || "";
      const status = contract.status || "";
      const matchesSearch = title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        selectedStatus === "All" ||
        (selectedStatus === "Signed" && status === "signed") ||
        (selectedStatus === "Pending" && status === "pending") ||
        (selectedStatus === "Draft" && status === "draft");
      return matchesSearch && matchesStatus;
    });
  }, [contracts, searchTerm, selectedStatus]);

  const stats = useMemo(() => {
    const signed = contracts.filter(
      (con) => con.status?.toLowerCase() === "signed",
    ).length;
    const pending = contracts.filter(
      (con) => con.status?.toLowerCase() === "pending",
    ).length;
    const draft = contracts.filter(
      (con) => con.status?.toLowerCase() === "draft",
    ).length;

    return { signed, pending, draft };
  }, [contracts]);

  const handleCreateClick = () => {
    if (hasReachedLimit) {
      setShowUpgradePrompt(true);
    } else {
      router.push(`/dashboard/services/contract/create-contract-form`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upgrade prompt modal — only fires from the New Contract button */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-(--bg-primary) rounded-xl max-w-md w-full p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2 text-(--text-primary)">
              Contract Limit Reached
            </h3>
            <p className="text-(--text-secondary) text-center mb-6">
              {hasNoContracts
                ? "Your plan doesn't include contracts. Upgrade to SME or Enterprise to start creating."
                : `You've used all ${contractCount}/${contractLimit} contracts on your current plan.`}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowUpgradePrompt(false)}
              >
                Cancel
              </Button>
              <Link href="/pricing?upgrade=sme" className="flex-1">
                <Button className="w-full bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink)">
                  View Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="bg-(--bg-primary) border border-(--border-color) shadow-soft squircle-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-(--text-secondary) mb-1">
                Total Contracts
              </p>
              <p className="text-2xl font-bold text-(--text-primary)">
                {contracts.length.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-(--bg-primary) border border-(--border-color) shadow-soft squircle-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-(--text-secondary) mb-1">
                Signed Contracts
              </p>
              <p className="text-2xl font-bold text-(--color-lemon-green)">
                {stats.signed}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-(--bg-primary) border border-(--border-color) shadow-soft squircle-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-(--text-secondary) mb-1">
                Pending Contracts
              </p>
              <p className="text-2xl font-bold text-(--color-accent-yellow)">
                {stats.pending}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-(--bg-primary) border border-(--border-color) shadow-soft squircle-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-(--text-secondary) mb-1">
                Draft Contracts
              </p>
              <p className="text-2xl font-bold text-blue-600">{stats.draft}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search / filter / new */}
      <Card className="bg-(--bg-primary) border border-(--border-color) shadow-soft squircle-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-(--text-secondary) w-4 h-4" />
              <Input
                placeholder="Search by contract title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
                style={{ outline: "none", boxShadow: "none" }}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {["All", "Signed", "Pending", "Draft"].map((status) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? "default" : "outline"}
                  size="sm"
                  className={`hover:bg-(--color-accent-yellow) hover:text-(--color-ink) border hover:shadow-xl transition-all duration-300 ${
                    selectedStatus === status
                      ? "bg-(--color-accent-yellow) text-(--color-ink)"
                      : ""
                  }`}
                  onClick={() => setSelectedStatus(status)}
                >
                  {status}
                </Button>
              ))}
            </div>

            <div className="w-full sm:w-auto">
              <Button
                className={`w-full sm:w-auto hover:shadow-xl transition-all duration-300 ${
                  hasReachedLimit
                    ? "bg-(--text-secondary) cursor-not-allowed"
                    : "bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink)"
                }`}
                onClick={handleCreateClick}
                disabled={hasReachedLimit}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Contract
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ContractList
        contracts={filteredContracts}
        loading={loading}
        isPremium={userTier === "enterprise"}
        hasReachedLimit={hasReachedLimit}
        onRefresh={onRefresh}
      />
    </div>
  );
}