// app/components/sign-contract-form-component/ContractGen.tsx
"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  AlertCircle,
  Crown,
  Zap,
  Sparkles,
  Star,
  ArrowUpCircle,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { useRouter } from "next/navigation";
import ContractList from "@/app/components/sign-contract-form-component/ContractLIst";
import Link from "next/link";
import { Badge } from "@/app/components/ui/badge";

interface ContractGenProps {
  loading: boolean;
  contracts: any[];
  userTier?: "free" | "solopreneur" | "sme" | "enterprise" | "corporation";
  isPremium?: boolean;
  hasReachedLimit?: boolean;
  remainingContracts?: number | string;
  onRefresh?: () => void;
}

export default function ContractGen({
  loading,
  contracts,
  userTier = "free",
  isPremium = false,
  hasReachedLimit = false,
  remainingContracts = 1,
  onRefresh,
}: ContractGenProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const router = useRouter();

  // Define tier variables based on userTier prop
  const isFree = userTier === "free";
  const isSolopreneurUser = userTier === "solopreneur";
  const isSMEUser = userTier === "sme";
  const isEnterpriseUser = userTier === "enterprise";
  const isCorporationUser = userTier === "corporation";
  const hasUnlimitedContracts = isEnterpriseUser || isCorporationUser || isSMEUser;

  const contractCount = contracts.length;
  
  // Contract limits by tier
  const freeTierLimit = 0;
  const solopreneurLimit = 0;
  const smeLimit = 1;
  const enterpriseLimit = 10;
  // Corporation has unlimited

  const reachedLimit = !hasUnlimitedContracts && contractCount >= 
    (isSMEUser ? smeLimit : isEnterpriseUser ? enterpriseLimit : 0);

  // Get tier icon and color
  const getTierInfo = () => {
    if (isCorporationUser)
      return {
        icon: Sparkles,
        color: "text-purple-600",
        bg: "bg-purple-100",
        label: "Corporation",
      };
    if (isEnterpriseUser)
      return {
        icon: Crown,
        color: "text-amber-600",
        bg: "bg-amber-100",
        label: "Enterprise",
      };
    if (isSMEUser)
      return {
        icon: Star,
        color: "text-(--color-accent-yellow)",
        bg: "bg-(--color-accent-yellow)/10",
        label: "SME",
      };
    if (isSolopreneurUser)
      return {
        icon: Zap,
        color: "text-blue-600",
        bg: "bg-blue-100",
        label: "Solopreneur",
      };
    return {
      icon: Star,
      color: "text-gray-600",
      bg: "bg-gray-100",
      label: "Free Trial",
    };
  };

  const tierInfo = getTierInfo();
  const TierIcon = tierInfo.icon;

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
    if (reachedLimit && !hasUnlimitedContracts) {
      setShowUpgradePrompt(true);
    } else {
      router.push(`/dashboard/services/contract/create-contract-form`);
    }
  };

  // Get remaining count display
  const getRemainingDisplay = () => {
    if (hasUnlimitedContracts) return "unlimited";
    if (isSMEUser) return Math.max(0, smeLimit - contractCount);
    if (isEnterpriseUser) return Math.max(0, enterpriseLimit - contractCount);
    return 0;
  };

  // Get tier message
  const getTierMessage = () => {
    if (isCorporationUser) {
      return "You have unlimited contracts! Create as many as you need.";
    }
    if (isEnterpriseUser) {
      return `You have ${getRemainingDisplay()} contract${getRemainingDisplay() !== 1 ? "s" : ""} remaining.`;
    }
    if (isSMEUser) {
      return `You have ${getRemainingDisplay()} contract${getRemainingDisplay() !== 1 ? "s" : ""} remaining.`;
    }
    if (isSolopreneurUser) {
      return "Solopreneur plan does not include contracts. Upgrade to SME or higher.";
    }
    return "Free plan does not include contracts. Upgrade to SME or higher.";
  };

  return (
    <div className="space-y-6">
      {/* Upgrade Prompt Modal */}
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
              {isSMEUser
                ? "You've used all your SME contracts. Upgrade to continue creating more contracts!"
                : isEnterpriseUser
                ? "You've used all your Enterprise contracts. Upgrade to Corporation for unlimited!"
                : "You don't have contracts in your current plan. Upgrade to SME or higher to create contracts!"}
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

    
      {/* Stats Cards */}
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

      {/* Free and Solopreneur - No contracts available */}
      {(isFree || isSolopreneurUser) && (
        <Card className="border-2 border-gray-200 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-gray-100">
                  <AlertCircle className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    No Contracts Available
                  </h3>
                  <p className="text-sm text-gray-600">
                    {isFree
                      ? "Free plan does not include contracts. Upgrade to SME or higher to create contracts."
                      : "Solopreneur plan does not include contracts. Upgrade to SME or higher to create contracts."}
                  </p>
                </div>
              </div>

              <Link href="/pricing?upgrade=sme" className="w-full md:w-auto">
                <Button className="w-full md:w-auto bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink)">
                  <ArrowUpCircle className="w-4 h-4 mr-1" />
                  Upgrade to SME
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SME Upgrade Banner - Show when close to limit */}
      {isSMEUser && !reachedLimit && contractCount >= 1 && (
        <Card className="border-2 border-(--color-accent-yellow)/30 bg-(--color-accent-yellow)/5">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-(--color-accent-yellow)/20">
                  <Star className="w-5 h-5 text-(--color-accent-yellow)" />
                </div>
                <div>
                  <h3 className="font-semibold text-(--color-accent-yellow)">
                    {contractCount === 1
                      ? "Last Contract"
                      : "Limited Contracts Remaining"}
                  </h3>
                  <p className="text-sm text-(--color-accent-yellow)/80">
                    You have {getRemainingDisplay()} SME contract
                    {getRemainingDisplay() !== 1 ? "s" : ""} left. Upgrade to
                    Enterprise for 10 contracts or Corporation for unlimited!
                  </p>
                </div>
              </div>

              <Link href="/pricing?upgrade=enterprise" className="w-full md:w-auto">
                <Button className="w-full md:w-auto bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink)">
                  <ArrowUpCircle className="w-4 h-4 mr-1" />
                  Upgrade to Enterprise
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enterprise Upgrade Banner - Show when close to limit */}
      {isEnterpriseUser && !reachedLimit && contractCount >= 8 && (
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-amber-100">
                  <Crown className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-800">
                    {contractCount === 9
                      ? "Last Contract"
                      : "Limited Contracts Remaining"}
                  </h3>
                  <p className="text-sm text-amber-600">
                    You have {getRemainingDisplay()} Enterprise contract
                    {getRemainingDisplay() !== 1 ? "s" : ""} left. Upgrade to
                    Corporation for unlimited contracts!
                  </p>
                </div>
              </div>

              <Link href="/pricing?upgrade=corporation" className="w-full md:w-auto">
                <Button className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white">
                  <ArrowUpCircle className="w-4 h-4 mr-1" />
                  Upgrade to Corporation
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Corporation - Show unlimited banner */}
      {isCorporationUser && (
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-800">
                  Corporation Unlimited
                </h3>
                <p className="text-sm text-purple-600">
                  You have unlimited contracts! Create as many as you need.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter Section */}
      <Card className="bg-(--bg-primary) border border-(--border-color) shadow-soft squircle-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
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

            {/* Status Filter Buttons */}
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

            {/* New Contract Button */}
            <div className="w-full sm:w-auto">
              <Button
                className={`w-full sm:w-auto hover:shadow-xl transition-all duration-300 ${
                  reachedLimit && !hasUnlimitedContracts
                    ? "bg-(--text-secondary) cursor-not-allowed"
                    : "bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink)"
                }`}
                onClick={handleCreateClick}
                disabled={reachedLimit && !hasUnlimitedContracts}
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
        userTier={userTier}
        isPremium={isEnterpriseUser || isCorporationUser}
        hasReachedLimit={reachedLimit}
        onRefresh={onRefresh}
      />
    </div>
  );
}