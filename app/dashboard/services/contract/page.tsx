"use client";

import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import ContractGen from "@/app/components/sign-contract-form-component/ContractGen";

import { Button } from "@/app/components/ui/button";
import { useUserContextData } from "@/app/context/userData";
import { SubscriptionPageGuard } from "@/app/components/subscription-components/SubscriptionGuard";
import { useSubscription } from "@/app/hooks/useSubscripion";
import { ArrowLeft, Crown, Zap, Star, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import Link from "next/link";

// Numeric limit per tier — Infinity means unlimited.
const CONTRACT_LIMITS: Record<string, number> = {
  free: 0,
  starter: 0,
  sme: 1,
  enterprise: 10,
  // booster is normalized to starter by useSubscription
};

const resolveContractLimit = (tier: string): number =>
  CONTRACT_LIMITS[tier] ?? 0;

export default function ContractPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const { userData } = useUserContextData();
  const { userTier } = useSubscription();

  const isEnterpriseUser = userTier === "enterprise";
  const isSmeUser = userTier === "sme";
  const isStarterUser = userTier === "starter" || userTier === "free";

  const contractLimit = resolveContractLimit(userTier);
  const hasNoContracts = contractLimit === 0;

  const fetchContracts = async (email: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/contract/get-contract", {
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
        confirmButtonColor: "var(--color-accent-yellow)",
        background: "var(--bg-primary)",
        customClass: { popup: "squircle-lg" },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.email) {
      fetchContracts(userData.email);
    }
  }, [userData]);

  const contractCount = contracts.length;

  const hasReachedLimit = useMemo(() => {
    if (hasNoContracts) return true;
    return contractCount >= contractLimit;
  }, [hasNoContracts, contractCount, contractLimit]);

  const remainingContracts = useMemo(
    () => Math.max(0, contractLimit - contractCount),
    [contractCount, contractLimit],
  );

  const getTierInfo = () => {
    if (isEnterpriseUser)
      return {
        icon: Crown,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-100 dark:bg-amber-900/20",
        label: "Enterprise",
      };
    if (isSmeUser)
      return {
        icon: Star,
        color: "text-(--color-accent-yellow)",
        bg: "bg-(--color-accent-yellow)/10",
        label: "SME",
      };
    return {
      icon: Zap,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/20",
      label: "Free",
    };
  };

  const tierInfo = getTierInfo();
  const TierIcon = tierInfo.icon;

  // Single banner — four possible states but only one renders at a time
  const getBanner = () => {
    // Free plan: no contracts at all
    if (hasNoContracts) {
      return {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-800",
        icon: <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
        title: "Contracts Not Available on Free",
        message:
          "Upgrade to SME for 1 contract or Enterprise for 10 contracts.",
        showUpgrade: true,
        upgradeText: "Upgrade to SME",
        upgradeHref: "/pricing?upgrade=sme",
      };
    }

    // Limit hit
    if (hasReachedLimit) {
      return {
        bg: "bg-red-50 dark:bg-red-900/20",
        border: "border-red-200 dark:border-red-800",
        icon: (
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
        ),
        title: "Contract Limit Reached",
        message: `You've used all ${contractCount}/${contractLimit} contracts on your ${tierInfo.label} plan.`,
        showUpgrade: true,
        upgradeText: isSmeUser
          ? "Upgrade to Enterprise"
          : "Upgrade for More",
        upgradeHref: isSmeUser
          ? "/pricing?upgrade=enterprise"
          : "/pricing?upgrade=sme",
      };
    }

    // Has room
    return {
      bg: isEnterpriseUser
        ? "bg-amber-50 dark:bg-amber-900/20"
        : "bg-(--color-accent-yellow)/10",
      border: isEnterpriseUser
        ? "border-amber-200 dark:border-amber-800"
        : "border-(--color-accent-yellow)",
      icon: <TierIcon className={`w-5 h-5 ${tierInfo.color}`} />,
      title: `${tierInfo.label} Plan`,
      message: `You have ${remainingContracts} of ${contractLimit} contract${contractLimit !== 1 ? "s" : ""} remaining.`,
      showUpgrade: isSmeUser, // nudge SME → Enterprise
      upgradeText: "Upgrade to Enterprise",
      upgradeHref: "/pricing?upgrade=enterprise",
    };
  };

  const banner = getBanner();

  return (
    <SubscriptionPageGuard
      requiredTier="free"
      featureKey="contracts_per_month"
      title="Contract & Agreement System"
      description="Create, send, and get contracts signed electronically with full legal validity."
    >
      <div className="min-h-screen bg-[#f7f7f7] dark:bg-[#0e0e0e] fade-in relative">
        <DashboardSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="min-h-screen flex flex-col lg:pl-[var(--sidebar-width,288px)] transition-[padding] duration-300 ease-in-out">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
              {/* Header */}
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
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${tierInfo.bg}`}
                    >
                      <TierIcon className={`w-4 h-4 ${tierInfo.color}`} />
                      <span
                        className={`text-xs font-semibold ${tierInfo.color}`}
                      >
                        {tierInfo.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm md:text-base text-(--text-secondary)">
                    Create, manage, and track your contracts
                  </p>
                </div>
              </div>

              {/* Single banner */}
              <div
                className={`mb-6 p-4 rounded-lg border-2 ${banner.bg} ${banner.border} shadow-soft squircle-lg`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{banner.icon}</div>
                    <div>
                      <h3 className="font-semibold text-(--text-primary)">
                        {banner.title}
                      </h3>
                      <p className="text-sm text-(--text-secondary) mt-1">
                        {banner.message}
                      </p>
                    </div>
                  </div>

                  {banner.showUpgrade && (
                    <Link href={banner.upgradeHref}>
                      <Button
                        size="sm"
                        className="bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 whitespace-nowrap squircle-md"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        {banner.upgradeText}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              <ContractGen
                contracts={contracts}
                loading={loading}
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
}