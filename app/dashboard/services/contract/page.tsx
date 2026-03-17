// app/dashboard/services/contract/page.tsx
"use client";
import DashboardHeader from '@/app/components/dashboard-component/DashboardHeader';
import DashboardSidebar from '@/app/components/dashboard-component/DashboardSidebar';
import ContractGen from '@/app/components/sign-contract-form-component/ContractGen';
import Features from '@/app/components/smart-contract-components/Features';
import Pricing from '@/app/components/smart-contract-components/Pricing';
import SmartContractHero from '@/app/components/smart-contract-components/SmartContractHero';
import SmartContractStep from '@/app/components/smart-contract-components/SmartContractStep';
import { useUserContextData } from '@/app/context/userData';
import { SubscriptionPageGuard } from '@/app/components/subscription-components/SubscriptionGuard'; 
import { useSubscription } from '@/app/hooks/useSubscripion'; 
import { ArrowLeft, Crown, Zap, Sparkles, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import Swal from 'sweetalert2'
import Link from "next/link";
import { Button } from '@/app/components/ui/button';
import Loader from '@/app/components/Loader';

const Page = () => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const { userData } = useUserContextData();
  const { 
    userTier, 
    isPremium, 
    isGrowth, 
    isElite,
    isZidLite 
  } = useSubscription();
  const fetchStartedRef = useRef(false);

  const fetchContracts = useCallback(async (email: string) => {
    if (loading || fetchStartedRef.current) return;
    
    try {
      fetchStartedRef.current = true;
      setLoading(true);
      const res = await fetch("/api/contract/get-contracts-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: email }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch contracts");
      }

      const data = await res.json();
      setContracts(data.contracts || []);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load contracts. Please try again.",
      });
    } finally {
      setLoading(false);
      setInitialLoadDone(true);
      fetchStartedRef.current = false;
    }
  }, [loading]);

  useEffect(() => {
    if (userData?.email && !initialLoadDone && !loading && !fetchStartedRef.current) {
      fetchContracts(userData.email);
    }
  }, [userData?.email, initialLoadDone, loading, fetchContracts]);

  const hasContracts = useMemo(() => contracts.length > 0, [contracts]);
  
  const contractCount = contracts.length;
  
  const isFree = userTier === 'free';
  const isZidLiteUser = userTier === 'zidlite';
  const isGrowthUser = userTier === 'growth';
  const isPremiumUser = userTier === 'premium';
  const isEliteUser = userTier === 'elite';
  
  const hasUnlimitedContracts = isPremiumUser || isEliteUser || isGrowthUser;
  
  const contractLimit = useMemo(() => {
    if (hasUnlimitedContracts) return 'unlimited';
    if (isZidLiteUser) return 2;
    return 1;
  }, [userTier, hasUnlimitedContracts, isZidLiteUser]);

  const hasReachedLimit = useMemo(() => {
    if (hasUnlimitedContracts) return false;
    if (isZidLiteUser) return contractCount >= 2;
    return contractCount >= 1;
  }, [userTier, hasUnlimitedContracts, isZidLiteUser, contractCount]);

  const remainingContracts = useMemo(() => {
    if (hasUnlimitedContracts) return 'unlimited';
    if (isZidLiteUser) return Math.max(0, 2 - contractCount);
    return Math.max(0, 1 - contractCount);
  }, [userTier, hasUnlimitedContracts, isZidLiteUser, contractCount]);

  const getTierInfo = () => {
    if (isEliteUser) return { icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20', label: 'Elite' };
    if (isPremiumUser) return { icon: Crown, color: 'text-[#2b825b]', bg: 'bg-[#2b825b]/10', label: 'Premium' };
    if (isGrowthUser) return { icon: Zap, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20', label: 'Growth' };
    if (isZidLiteUser) return { icon: Zap, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20', label: 'ZidLite' };
    return { icon: Star, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800', label: 'Free Trial' };
  };

  const tierInfo = getTierInfo();
  const TierIcon = tierInfo.icon;

  const getTierMessage = () => {
    if (isEliteUser) {
      return "You have unlimited contracts with priority support!";
    }
    if (isPremiumUser) {
      return "You have unlimited contracts!";
    }
    if (isGrowthUser) {
      return "You have 5 contracts included in your subscription.";
    }
    if (isZidLiteUser) {
      return `You have ${remainingContracts} contract${remainingContracts !== 1 ? 's' : ''} remaining in your ZidLite plan.`;
    }
    return null;
  };

  const tierMessage = getTierMessage();

  if (!initialLoadDone && loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] dark:bg-[#0e0e0e]">
        <DashboardSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="lg:pl-72 min-h-screen flex flex-col">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto flex justify-center items-center h-64">
              <Loader/>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <SubscriptionPageGuard
      requiredTier="free"
      featureKey="contracts_per_month"
      title="Smart Contract Generator"
      description="Create legally binding agreements, contracts, and NDAs with our easy-to-use contract generator"
    >
      <div className="min-h-screen bg-[#f7f7f7] dark:bg-[#0e0e0e] fade-in relative">
        <DashboardSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <div className="lg:pl-72 min-h-screen flex flex-col">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
              {/* Back button and header */}
              <div className="flex items-start gap-4 mb-6 md:mb-8">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="text-[#2b825b] hover:text-[#1e5d42] hover:bg-[#f0efe7] dark:hover:bg-[#242424] p-2 md:p-2.5 rounded-md border-2 border-transparent hover:border-[#242424] dark:hover:border-[#474747] transition-all"
                >
                  <ArrowLeft className="w-5 h-5 md:mr-2" />
                  <span className="hidden md:inline text-sm font-medium">Back</span>
                </Button>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#141414] dark:text-[#f5f5f5]">
                      Contract Management
                    </h1>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${tierInfo.bg}`}>
                      <TierIcon className={`w-4 h-4 ${tierInfo.color}`} />
                      <span className={`text-xs font-semibold ${tierInfo.color}`}>
                        {tierInfo.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm md:text-base text-[#6b6b6b] dark:text-[#a6a6a6]">
                    Create legally binding agreements, contracts, and NDAs
                  </p>
                </div>
              </div>

              {/* Tier Message - For paid tiers only */}
              {tierMessage && !isFree && (
                <div className={`mb-6 p-4 rounded-md border-2 ${
                  isEliteUser
                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                    : isPremiumUser
                    ? 'bg-[#2b825b]/10 border-[#2b825b]'
                    : isGrowthUser
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : isZidLiteUser
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : ''
                } shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000]`}>
                  <p className={`font-medium flex items-center gap-2 ${
                    isEliteUser
                      ? 'text-purple-600 dark:text-purple-400'
                      : isPremiumUser
                      ? 'text-[#2b825b]'
                      : isGrowthUser
                      ? 'text-green-600 dark:text-green-400'
                      : isZidLiteUser
                      ? 'text-blue-600 dark:text-blue-400'
                      : ''
                  }`}>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      isEliteUser
                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                        : isPremiumUser
                        ? 'bg-[#2b825b] text-white'
                        : isGrowthUser
                        ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
                        : isZidLiteUser
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                        : ''
                    }`}>
                      {tierInfo.label.toUpperCase()}
                    </span>
                    {tierMessage}
                  </p>
                </div>
              )}

              {/* Show either the marketing components OR the contract list */}
              {!hasContracts && !loading ? (
                <>
                  <SmartContractHero />
                  <Features />
                  <SmartContractStep />
                  <Pricing />
                </>
              ) : (
                <ContractGen 
                  contracts={contracts} 
                  loading={loading} 
                  userTier={userTier}
                  isPremium={isPremiumUser || isGrowthUser} 
                  hasReachedLimit={hasReachedLimit}
                  remainingContracts={remainingContracts}
                  onRefresh={() => userData?.email && fetchContracts(userData.email)}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </SubscriptionPageGuard>
  );
}

export default Page;