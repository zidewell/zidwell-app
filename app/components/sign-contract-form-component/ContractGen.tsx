"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Plus, AlertCircle, Wallet } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { useRouter } from "next/navigation";
import ContractList from "@/app/components/sign-contract-form-component/ContractLIst";
import Link from "next/link";
import { Badge } from "@/app/components/ui/badge";

interface ContractGenProps {
  loading: boolean;
  contracts: any[];
  userTier?: 'free' | 'growth' | 'premium' | 'elite';
  isPremium?: boolean;
  hasReachedLimit?: boolean;
  remainingContracts?: number | 'unlimited';
  requiresPayment?: boolean;
  hasSufficientBalance?: boolean;
  contractFee?: number;
  onRefresh?: () => void;
}

const CONTRACT_FEE = 10; // ₦10 per contract after limit

export default function ContractGen({ 
  loading, 
  contracts, 
  userTier = 'free',
  isPremium = false,
  hasReachedLimit = false,
  remainingContracts = 1,
  requiresPayment = false,
  hasSufficientBalance = false,
  contractFee = CONTRACT_FEE,
  onRefresh 
}: ContractGenProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const router = useRouter();

  const contractCount = contracts.length;

  const filteredContracts = useMemo(() => {
    return contracts?.filter((contract) => {
      const title = contract.contract_title || "";
      const status = contract.status || "";
      const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === "All" || status.toLowerCase() === selectedStatus.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [contracts, searchTerm, selectedStatus]);

  const stats = useMemo(() => {
    const signed = contracts.filter((con) => con.status?.toLowerCase() === "signed").length;
    const pending = contracts.filter((con) => con.status?.toLowerCase() === "pending").length;
    const draft = contracts.filter((con) => con.status?.toLowerCase() === "draft").length;
    
    return { signed, pending, draft };
  }, [contracts]);

  const handleCreateClick = useCallback(() => {
    if (hasReachedLimit && !isPremium) {
      setShowUpgradePrompt(true);
    } else {
      router.push(`/dashboard/services/contract/create-contract-form`);
    }
  }, [hasReachedLimit, isPremium, router]);

  const handlePayPerUseClick = useCallback(() => {
    // Navigate to contract creation with pay-per-use flag
    router.push(`/dashboard/services/contract/create-contract-form?payPerUse=true&fee=${contractFee}`);
  }, [router, contractFee]);

  return (
    <div className="space-y-6">
      {/* Upgrade/Pay-per-use Prompt Modal */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Contract Limit Reached</h3>
            <p className="text-gray-600 text-center mb-6">
              {userTier === 'free' 
                ? `You've used your free contract. You can pay ₦${contractFee} per contract or upgrade for more.`
                : `You've reached your limit of 5 contracts. You can pay ₦${contractFee} per contract or upgrade to Premium for unlimited.`}
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handlePayPerUseClick}
                className={`w-full ${hasSufficientBalance ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
                disabled={!hasSufficientBalance}
              >
                <Wallet className="w-4 h-4 mr-2" />
                Pay ₦{contractFee} & Create Contract
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowUpgradePrompt(false)}
                >
                  Cancel
                </Button>
                <Link 
                  href={`/pricing?upgrade=${userTier === 'free' ? 'growth' : 'premium'}`} 
                  className="flex-1"
                >
                  <Button className="w-full bg-[#C29307] hover:bg-[#b38606] text-white">
                    Upgrade Plan
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Badge - Only show if premium */}
      {isPremium && (
        <div className="bg-[#C29307]/10 px-3 py-1 rounded-full border border-[#C29307] inline-block">
          <span className="text-[#C29307] font-medium text-sm flex items-center gap-1">
            <span className="w-2 h-2 bg-[#C29307] rounded-full"></span>
            PREMIUM • Unlimited Contracts
          </span>
        </div>
      )}

      {/* Usage Stats Banner */}
      {!isPremium && (
        <div className={`p-3 rounded-lg border ${
          hasReachedLimit 
            ? 'bg-blue-50 border-blue-200' 
            : contractCount >= (userTier === 'free' ? 1 : 4)
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                Monthly Contract Usage:
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                hasReachedLimit 
                  ? 'bg-blue-100 text-blue-600' 
                  : contractCount >= (userTier === 'free' ? 1 : 4)
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-green-100 text-green-600'
              }`}>
                {contractCount}/{userTier === 'free' ? '1' : '5'} used
              </span>
              {hasReachedLimit && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 ml-2">
                  <Wallet className="w-3 h-3 mr-1" />
                  Pay-per-use active
                </Badge>
              )}
            </div>
            
            {hasReachedLimit ? (
              <div className="flex items-center gap-2">
                {!hasSufficientBalance && (
                  <Link href="/dashboard/fund-account">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs">
                      Fund Wallet
                    </Button>
                  </Link>
                )}
                <Button
                  size="sm"
                  onClick={handlePayPerUseClick}
                  className={`${hasSufficientBalance ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'} text-white h-8 text-xs`}
                  disabled={!hasSufficientBalance}
                >
                  Pay ₦{contractFee} & Create
                </Button>
              </div>
            ) : (
              <>
                {userTier === 'free' && contractCount >= 1 && (
                  <Link href="/pricing?upgrade=growth">
                    <Button size="sm" className="bg-[#C29307] hover:bg-[#b38606] text-white h-8 text-xs">
                      Upgrade for 5 contracts/month
                    </Button>
                  </Link>
                )}
                
                {userTier === 'growth' && contractCount >= 5 && (
                  <Link href="/pricing?upgrade=premium">
                    <Button size="sm" className="bg-[#C29307] hover:bg-[#b38606] text-white h-8 text-xs">
                      Upgrade to Unlimited
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>
          
          {/* Insufficient balance warning */}
          {hasReachedLimit && !hasSufficientBalance && (
            <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Insufficient balance. Please fund your wallet to create contracts.
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Contracts</p>
              <p className="text-2xl font-bold text-gray-900">{contracts.length.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Signed Contracts</p>
              <p className="text-2xl font-bold text-green-600">{stats.signed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Pending Contracts</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Draft Contracts</p>
              <p className="text-2xl font-bold text-blue-600">{stats.draft}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search contracts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {["All", "Signed", "Pending", "Draft"].map((status) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStatus(status)}
                  className={
                    selectedStatus === status
                      ? "bg-[#C29307] hover:bg-[#b28a06] text-white border hover:shadow-xl transition-all duration-300 whitespace-nowrap"
                      : "border hover:shadow-md transition-all duration-300 whitespace-nowrap"
                  }
                >
                  {status}
                </Button>
              ))}
              <Button
                onClick={handleCreateClick}
                className={`bg-[#C29307] hover:bg-[#b28a06] cursor-pointer whitespace-nowrap ${
                  hasReachedLimit && !isPremium ? 'opacity-75' : ''
                }`}
                disabled={hasReachedLimit && !isPremium}
              >
                <Plus className="w-4 h-4 mr-1" />
                {hasReachedLimit && !isPremium
                  ? 'Limit Reached' 
                  : 'Create New Contract'}
              </Button>
            </div>
          </div>

          {/* Pay-per-use info message */}
          {!isPremium && hasReachedLimit && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Wallet className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700">
                  You've reached your monthly limit. You can continue with pay-per-use (₦{contractFee} per contract) or upgrade your plan for more free contracts.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ContractList 
        contracts={filteredContracts} 
        loading={loading} 
        userTier={userTier}
        isPremium={isPremium}
        hasReachedLimit={hasReachedLimit}
        requiresPayment={requiresPayment}
        contractFee={contractFee}
        onRefresh={onRefresh}
      />
    </div>
  );
}