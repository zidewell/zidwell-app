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
  userTier?: "free" | "zidlite" | "growth" | "premium" | "elite";
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
  const isZidLite = userTier === "zidlite";
  const isGrowth = userTier === "growth";
  const isPremiumUser = userTier === "premium";
  const isElite = userTier === "elite";
  const hasUnlimitedContracts = isPremiumUser || isElite || isGrowth;

  const contractCount = contracts.length;
  const contractLimit = isFree ? 1 : isZidLite ? 2 : isGrowth ? 5 : Infinity;
  const reachedLimit = !hasUnlimitedContracts && contractCount >= contractLimit;

  // Get tier icon and color
  const getTierInfo = () => {
    if (isElite)
      return {
        icon: Sparkles,
        color: "text-purple-600",
        bg: "bg-purple-100",
        label: "Elite",
      };
    if (isPremiumUser)
      return {
        icon: Crown,
        color: "text-[var(--color-accent-yellow)]",
        bg: "bg-[var(--color-accent-yellow)]/10",
        label: "Premium",
      };
    if (isGrowth)
      return {
        icon: Zap,
        color: "text-[var(--color-accent-yellow)]",
        bg: "bg-[var(--color-accent-yellow)]/10",
        label: "Growth",
      };
    if (isZidLite)
      return {
        icon: Zap,
        color: "text-blue-600",
        bg: "bg-blue-100",
        label: "ZidLite",
      };
    return {
      icon: Star,
    
     
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
    return Math.max(0, contractLimit - contractCount);
  };

  // Get tier message
  const getTierMessage = () => {
    if (isPremiumUser || isElite) {
      return "You have unlimited contracts! Create as many as you need.";
    }
    if (isGrowth) {
      return `You have ${getRemainingDisplay()} contract${getRemainingDisplay() !== 1 ? "s" : ""} remaining.`;
    }
    if (isZidLite) {
      return `You have ${getRemainingDisplay()} contract${getRemainingDisplay() !== 1 ? "s" : ""} remaining.`;
    }
    return `You have ${getRemainingDisplay()} contract${getRemainingDisplay() !== 1 ? "s" : ""} remaining.`;
  };

  return (
    <div className="space-y-6">
      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-primary)] rounded-xl max-w-md w-full p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2 text-[var(--text-primary)]">
              Contract Limit Reached
            </h3>
            <p className="text-[var(--text-secondary)] text-center mb-6">
              {isZidLite
                ? "You've used all your ZidLite contracts. Upgrade to continue creating more contracts!"
                : "You've used all your free contracts. Upgrade to continue creating unlimited contracts!"}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowUpgradePrompt(false)}
              >
                Cancel
              </Button>
              <Link href="/pricing?upgrade=growth" className="flex-1">
                <Button className="w-full bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90 text-[var(--color-ink)]">
                  View Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Single Tier Badge and Message */}
      <div className="mb-4 space-y-3">
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${tierInfo.bg}`}
        >
          <TierIcon className={`w-4 h-4 ${tierInfo.color}`} />
          <span className={`text-xs font-semibold ${tierInfo.color}`}>
            {tierInfo.label}
          </span>
        </div>

        {/* Tier Message - Only shown for non-free tiers */}
        {!isFree && (
          <div
            className={`p-4 rounded-lg border-2 ${
              isPremiumUser || isElite
                ? "bg-purple-50 border-purple-200"
                : isGrowth
                  ? "bg-[var(--color-accent-yellow)]/5 border-[var(--color-accent-yellow)]/20"
                  : isZidLite
                    ? "bg-blue-50 border-blue-200"
                    : ""
            }`}
          >
            <p
              className={`font-medium flex items-center gap-2 ${
                isPremiumUser || isElite
                  ? "text-purple-600"
                  : isGrowth
                    ? "text-[var(--color-accent-yellow)]"
                    : isZidLite
                      ? "text-blue-600"
                      : ""
              }`}
            >
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  isPremiumUser || isElite
                    ? "bg-purple-100 text-purple-600 border border-purple-200"
                    : isGrowth
                      ? "bg-[var(--color-accent-yellow)]/10 text-[var(--color-accent-yellow)] border border-[var(--color-accent-yellow)]/20"
                      : isZidLite
                        ? "bg-blue-100 text-blue-600 border border-blue-200"
                        : ""
                }`}
              >
                {tierInfo.label.toUpperCase()}
              </span>
              {getTierMessage()}
            </p>
            
            {/* Upgrade Button for non-unlimited tiers */}
            {!hasUnlimitedContracts && (
              <div className="mt-3 flex justify-end">
                <Link href="/pricing?upgrade=growth">
                  <Button size="sm" className="bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90 text-[var(--color-ink)]">
                    <ArrowUpCircle className="w-4 h-4 mr-1" />
                    Upgrade Plan
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-[var(--text-secondary)] mb-1">Total Contracts</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {contracts.length.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-[var(--text-secondary)] mb-1">Signed Contracts</p>
              <p className="text-2xl font-bold text-[var(--color-lemon-green)]">
                {stats.signed}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-[var(--text-secondary)] mb-1">Pending Contracts</p>
              <p className="text-2xl font-bold text-[var(--color-accent-yellow)]">
                {stats.pending}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-[var(--text-secondary)] mb-1">Draft Contracts</p>
              <p className="text-2xl font-bold text-blue-600">{stats.draft}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Free Tier Usage and Upgrade Banner */}
      {isFree && (
        <Card className={`border-2 ${
          reachedLimit ? 'border-red-200 bg-red-50' : ''
        }`}>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  reachedLimit ? 'bg-red-100' : ''
                }`}>
                  {reachedLimit ? (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Crown className="w-5 h-5 " />
                  )}
                </div>
                <div>
                  <h3 className={`font-semibold ${
                    reachedLimit ? 'text-red-800' : ''
                  }`}>
                    {reachedLimit ? 'Free Contract Limit Reached' : 'Free Trial'}
                  </h3>
                  <p className={`text-sm ${
                    reachedLimit ? 'text-red-600' : ''
                  }`}>
                    {reachedLimit 
                      ? `You've used all ${contractCount}/${contractLimit} free contracts.`
                      : `You have ${getRemainingDisplay()} free contract${getRemainingDisplay() !== 1 ? 's' : ''} remaining.`
                    }
                  </p>
                </div>
              </div>
              
              {/* Upgrade Button for Free Tier */}
              <Link href="/pricing?upgrade=growth" className="w-full md:w-auto">
                <Button 
                  className={`w-full md:w-auto ${
                    reachedLimit 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90'
                  } text-[var(--color-ink)]`}
                >
                  <ArrowUpCircle className="w-4 h-4 mr-1" />
                  {reachedLimit ? 'Upgrade Now' : 'Upgrade for More'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ZidLite Upgrade Banner - Show when close to limit */}
      {isZidLite && !reachedLimit && contractCount >= 1 && (
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-yellow-100">
                  <Zap className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-800">
                    {contractCount === 1 ? 'One Contract Left' : 'Limited Contracts Remaining'}
                  </h3>
                  <p className="text-sm text-yellow-600">
                    You have {getRemainingDisplay()} ZidLite contract{getRemainingDisplay() !== 1 ? 's' : ''} left. 
                    Upgrade to Growth for 5 contracts or Premium for unlimited!
                  </p>
                </div>
              </div>
              
              {/* Upgrade Button for ZidLite */}
              <Link href="/pricing?upgrade=growth" className="w-full md:w-auto">
                <Button className="w-full md:w-auto bg-yellow-600 hover:bg-yellow-700 text-white">
                  <ArrowUpCircle className="w-4 h-4 mr-1" />
                  Upgrade Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Growth Upgrade Banner - Show when close to limit */}
      {isGrowth && !reachedLimit && contractCount >= 3 && (
        <Card className="border-2 border-[var(--color-accent-yellow)]/30 bg-[var(--color-accent-yellow)]/5">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-[var(--color-accent-yellow)]/20">
                  <Zap className="w-5 h-5 text-[var(--color-accent-yellow)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-accent-yellow)]">
                    {contractCount === 4 ? 'Last Contract' : 'Limited Contracts Remaining'}
                  </h3>
                  <p className="text-sm text-[var(--color-accent-yellow)]/80">
                    You have {getRemainingDisplay()} Growth contract{getRemainingDisplay() !== 1 ? 's' : ''} left. 
                    Upgrade to Premium for unlimited contracts!
                  </p>
                </div>
              </div>
              
              {/* Upgrade Button for Growth */}
              <Link href="/pricing?upgrade=premium" className="w-full md:w-auto">
                <Button className="w-full md:w-auto bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90 text-[var(--color-ink)]">
                  <ArrowUpCircle className="w-4 h-4 mr-1" />
                  Upgrade to Premium
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Premium/Elite - Show unlimited banner */}
      {(isPremiumUser || isElite) && (
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100">
                <Crown className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-800">
                  {isElite ? 'Elite Unlimited' : 'Premium Unlimited'}
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
      <Card className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-4 h-4" />
              <Input
                placeholder="Search by contract title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-[var(--color-accent-yellow)] focus:border-[var(--color-accent-yellow)]"
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
                  className={`hover:bg-[var(--color-accent-yellow)] hover:text-[var(--color-ink)] border hover:shadow-xl transition-all duration-300 ${
                    selectedStatus === status ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)]" : ""
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
                    ? "bg-[var(--text-secondary)] cursor-not-allowed"
                    : "bg-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/90 text-[var(--color-ink)]"
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
        isPremium={isPremiumUser || isGrowth || isElite}
        hasReachedLimit={reachedLimit}
        onRefresh={onRefresh}
      />
    </div>
  );
}