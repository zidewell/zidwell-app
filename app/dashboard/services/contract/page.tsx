"use client";
import DashboardHeader from '@/app/components/dashboard-hearder'
import DashboardSidebar from '@/app/components/dashboard-sidebar'
import ContractGen from '@/app/components/sign-contract-form-component/ContractGen'
import Features from '@/app/components/smart-contract-components/Features'
import Pricing from '@/app/components/smart-contract-components/Pricing'
import SmartContractHero from '@/app/components/smart-contract-components/SmartContractHero'
import SmartContractStep from '@/app/components/smart-contract-components/SmartContractStep'
import { useUserContextData } from '@/app/context/userData'
import { SubscriptionPageGuard } from '@/app/components/subscription-components/SubscriptionGuard'; 
import { useSubscription } from '@/app/hooks/useSubscripion'; 
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import Swal from 'sweetalert2'
import Link from "next/link";
import { Button } from '@/app/components/ui/button';

const CONTRACT_FEE = 10; // ₦10 per contract after limit

const Page = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const { userData, balance } = useUserContextData();
  const { subscription, userTier, isPremium } = useSubscription();
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
  
  // Calculate contract usage and limits
  const contractCount = contracts.length;
  const contractLimit = useMemo(() => {
    if (isPremium) return 'unlimited';
    if (userTier === 'growth') return 5;
    return 1; 
  }, [userTier, isPremium]);

  const hasReachedLimit = useMemo(() => {
    if (isPremium) return false;
    if (userTier === 'growth') return contractCount >= 5;
    return contractCount >= 1; 
  }, [userTier, isPremium, contractCount]);

  const remainingContracts = useMemo(() => {
    if (isPremium) return 'unlimited';
    if (userTier === 'growth') return Math.max(0, 5 - contractCount);
    return Math.max(0, 1 - contractCount);
  }, [userTier, isPremium, contractCount]);

  const requiresPayment = hasReachedLimit && !isPremium;
  const hasSufficientBalance = (balance || 0) >= CONTRACT_FEE;

  if (!initialLoadDone && loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardSidebar />
        <div className="lg:ml-64">
          <DashboardHeader />
          <main className="p-6">
            <div className="max-w-6xl mx-auto flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C29307]"></div>
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
      <div className="min-h-screen bg-gray-50">
        <DashboardSidebar />
        
        <div className="lg:ml-64">
          <DashboardHeader />
          
          <main className="p-6">
            <div className="md:max-w-5xl md:mx-auto">
              {/* Single Back button and header */}
              <div className="flex items-start space-x-4 mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="text-[#C29307] hover:bg-white/10 text-sm md:text-base"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="hidden md:block">Back</span>
                </Button>

                <div>
                  <h1 className="md:text-3xl text-xl font-bold mb-2 flex items-center gap-3">
                    Contract Management{" "}
                    <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-md">
                      {isPremium ? 'Lawyer signature ₦10,000' : 
                       hasReachedLimit ? `Pay ₦${CONTRACT_FEE}/contract after limit` :
                       userTier === 'free' ? '1 free contract/month' : 
                       userTier === 'growth' ? '5 free contracts/month' : ''}
                    </span>
                  </h1>
                  <p className="text-muted-foreground">
                    Create legally binding agreements, contracts, and NDAs
                  </p>
                </div>
              </div>

              {/* Show either the marketing components OR the contract list - never both */}
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
                  isPremium={isPremium}
                  hasReachedLimit={hasReachedLimit}
                  remainingContracts={remainingContracts}
                  requiresPayment={requiresPayment}
                  hasSufficientBalance={hasSufficientBalance}
                  contractFee={CONTRACT_FEE}
                  onRefresh={() => userData?.email && fetchContracts(userData.email)}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </SubscriptionPageGuard>
  )
}

export default Page