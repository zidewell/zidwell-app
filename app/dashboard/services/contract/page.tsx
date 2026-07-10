"use client";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import ContractGen from "@/app/components/sign-contract-form-component/ContractGen";
import { useUserContextData } from "@/app/context/userData";
import { SubscriptionPageGuard } from "@/app/components/subscription-components/SubscriptionGuard";
import { useSubscription } from "@/app/hooks/useSubscripion";
import { ArrowLeft, Crown, Zap, Sparkles, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Swal from "sweetalert2";
import { Button } from "@/app/components/ui/button";
import Loader from "@/app/components/Loader";

const Page = () => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const { userData } = useUserContextData();
  const { 
    userTier, 
    isSME, 
    isEnterprise, 
    isCorporation, 
    isSolopreneur 
  } = useSubscription();
  const fetchStartedRef = useRef(false);

  const fetchContracts = useCallback(
    async (email: string) => {
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
    },
    [loading],
  );

  useEffect(() => {
    if (
      userData?.email &&
      !initialLoadDone &&
      !loading &&
      !fetchStartedRef.current
    ) {
      fetchContracts(userData.email);
    }
  }, [userData?.email, initialLoadDone, loading, fetchContracts]);

  const hasContracts = useMemo(() => contracts.length > 0, [contracts]);

  const contractCount = contracts.length;

  const isFree = userTier === "free";
  const isSolopreneurUser = userTier === "solopreneur";
  const isSMEUser = userTier === "sme";
  const isEnterpriseUser = userTier === "enterprise";
  const isCorporationUser = userTier === "corporation";

  const hasUnlimitedContracts = isEnterpriseUser || isCorporationUser || isSMEUser;

  const contractLimit = useMemo(() => {
    if (hasUnlimitedContracts) return "unlimited";
    if (isSMEUser) return 1;
    return 0; // free and solopreneur have 0 contracts
  }, [userTier, hasUnlimitedContracts, isSMEUser]);

  const hasReachedLimit = useMemo(() => {
    if (hasUnlimitedContracts) return false;
    if (isSMEUser) return contractCount >= 1;
    return contractCount >= 0; // free and solopreneur can't create contracts
  }, [userTier, hasUnlimitedContracts, isSMEUser, contractCount]);

  const remainingContracts = useMemo(() => {
    if (hasUnlimitedContracts) return "unlimited";
    if (isSMEUser) return Math.max(0, 1 - contractCount);
    return 0;
  }, [userTier, hasUnlimitedContracts, isSMEUser, contractCount]);

  const getTierInfo = () => {
    if (isCorporationUser) return { icon: Sparkles, label: "Corporation" };
    if (isEnterpriseUser) return { icon: Crown, label: "Enterprise" };
    if (isSMEUser) return { icon: Star, label: "SME" };
    if (isSolopreneurUser) return { icon: Zap, label: "Solopreneur" };
    return { icon: Star, label: "Free Trial" };
  };

  const tierInfo = getTierInfo();
  const TierIcon = tierInfo.icon;

  const getTierMessage = () => {
    if (isCorporationUser) {
      return "You have unlimited contracts with priority support!";
    }
    if (isEnterpriseUser) {
      return "You have 10 contracts included in your subscription.";
    }
    if (isSMEUser) {
      return "You have 1 contract included in your subscription.";
    }
    if (isSolopreneurUser) {
      return "Solopreneur plan does not include contracts. Upgrade to SME or higher.";
    }
    return "Free plan does not include contracts. Upgrade to SME or higher.";
  };

  const tierMessage = getTierMessage();

  if (!initialLoadDone && loading) {
    return (
      <div className="min-h-screen bg-(--bg-secondary) dark:bg-[#0e0e0e]">
        <DashboardSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="lg:pl-72 min-h-screen flex flex-col">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto flex justify-center items-center h-64">
              <Loader />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <SubscriptionPageGuard
      requiredTier="sme"
      featureKey="contracts_per_month"
      title="Smart Contract Generator"
      description="Create legally binding agreements, contracts, and NDAs with our easy-to-use contract generator"
    >
      <div className="min-h-screen bg-(--bg-secondary) dark:bg-[#0e0e0e] fade-in relative">
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
                  className="text-(--color-accent-yellow) hover:text-(--color-accent-yellow)/80 hover:bg-(--bg-secondary) p-2 md:p-2.5 rounded-md border-2 border-transparent hover:border-(--border-color) transition-all"
                >
                  <ArrowLeft className="w-5 h-5 md:mr-2" />
                  <span className="hidden md:inline text-sm font-medium">
                    Back
                  </span>
                </Button>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-(--text-primary)">
                      Contract Management
                    </h1>
                  </div>
                  <p className="text-sm md:text-base text-(--text-secondary)">
                    Create legally binding agreements, contracts, and NDAs
                  </p>
                </div>
              </div>

              {/* Tier Message */}
              {tierMessage && (
                <div className="mb-6 p-4 rounded-md border-2 bg-(--bg-secondary) border-(--border-color) shadow-soft squircle-lg">
                  <p className="font-medium flex items-center gap-2 text-(--text-primary)">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-(--color-accent-yellow) text-(--color-ink)">
                      {tierInfo.label.toUpperCase()}
                    </span>
                    {tierMessage}
                  </p>
                </div>
              )}

              <ContractGen
                contracts={contracts}
                loading={loading}
                userTier={userTier}
                isPremium={isEnterpriseUser || isCorporationUser}
                hasReachedLimit={hasReachedLimit}
                remainingContracts={remainingContracts}
                onRefresh={() =>
                  userData?.email && fetchContracts(userData.email)
                }
              />
            </div>
          </main>
        </div>
      </div>
    </SubscriptionPageGuard>
  );
};

export default Page;