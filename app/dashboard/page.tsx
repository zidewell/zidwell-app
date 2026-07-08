"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import DashboardSidebar from "../components/dashboard-component/DashboardSidebar";
import DashboardHeader from "../components/dashboard-component/DashboardHeader";
import AnnouncementSlider from "../components/dashboard-component/AnnouncementSlider";
import FeatureCards from "../components/dashboard-component/FeatureCards";
import RecentArticles from "../components/dashboard-component/RecentArticles";
import MobileBottomNav from "../components/dashboard-component/MobileBottomNav";
import BVNVerificationBadge from "../components/BVNVerificationBadge";
import UsageSummary from "../components/UsageSummary";
import { useSubscription } from "../hooks/useSubscripion";
import { UpgradeBanner } from "../components/subscription-components/UpgradeBanner";
import { CheckCircle, Loader2, X } from "lucide-react";

// Define the raw API response interface
interface ApiUsageData {
  invoices_used: number;
  invoices_limit: number | string;
  receipts_used: number;
  receipts_limit: number | string;
  contracts_used: number;
  contracts_limit: number | string;
  tier?: string;
  limits?: {
    invoices: number | string;
    receipts: number | string;
    contracts: number | string;
    teamMembers: number | string;
    bankAccounts: number | string;
  };
}

// Define the transformed data structure that UsageSummary expects
interface TransformedUsageData {
  invoices: {
    used: number;
    limit: number | string;
    remaining: number | string;
    type: string;
    requiresUpgrade: boolean;
    canCreate: boolean;
  };
  receipts: {
    used: number;
    limit: number | string;
    remaining: number | string;
    type: string;
    requiresUpgrade: boolean;
    canCreate: boolean;
  };
  contracts: {
    used: number;
    limit: number | string;
    remaining: number | string;
    type: string;
    requiresUpgrade: boolean;
    canCreate: boolean;
  };
  tier: string;
  limits: {
    invoices: number | string;
    receipts: number | string;
    contracts: number | string;
    teamMembers: number | string;
    bankAccounts: number | string;
  };
}

function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPlan, setSuccessPlan] = useState("");
  const { userTier, userId, loading: subscriptionLoading } = useSubscription();
  const [rawUsage, setRawUsage] = useState<ApiUsageData | null>(null);
  const [transformedUsage, setTransformedUsage] = useState<TransformedUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Refs to prevent duplicate calls
  const isFetching = useRef<boolean>(false);
  const initialFetchDone = useRef<boolean>(false);
  const focusTimeout = useRef<NodeJS.Timeout | null>(null);

  const searchParams = useSearchParams();

  // Transform API data to the format UsageSummary expects
  const transformUsageData = (data: ApiUsageData): TransformedUsageData => {
    const invoicesLimit = typeof data.invoices_limit === 'string' ? data.invoices_limit : data.invoices_limit || 0;
    const receiptsLimit = typeof data.receipts_limit === 'string' ? data.receipts_limit : data.receipts_limit || 0;
    const contractsLimit = typeof data.contracts_limit === 'string' ? data.contracts_limit : data.contracts_limit || 0;

    const invoicesUsed = data.invoices_used || 0;
    const receiptsUsed = data.receipts_used || 0;
    const contractsUsed = data.contracts_used || 0;

    const isUnlimited = (limit: string | number) => limit === "unlimited";
    
    const getRemaining = (used: number, limit: string | number) => {
      if (isUnlimited(limit)) return "unlimited";
      const numLimit = typeof limit === 'string' ? parseInt(limit) : limit;
      return Math.max(0, numLimit - used);
    };

    const requiresUpgrade = (used: number, limit: string | number) => {
      if (isUnlimited(limit)) return false;
      const numLimit = typeof limit === 'string' ? parseInt(limit) : limit;
      return used >= numLimit;
    };

    const canCreate = (used: number, limit: string | number) => {
      if (isUnlimited(limit)) return true;
      const numLimit = typeof limit === 'string' ? parseInt(limit) : limit;
      return used < numLimit;
    };

    return {
      invoices: {
        used: invoicesUsed,
        limit: invoicesLimit,
        remaining: getRemaining(invoicesUsed, invoicesLimit),
        type: "invoice",
        requiresUpgrade: requiresUpgrade(invoicesUsed, invoicesLimit),
        canCreate: canCreate(invoicesUsed, invoicesLimit),
      },
      receipts: {
        used: receiptsUsed,
        limit: receiptsLimit,
        remaining: getRemaining(receiptsUsed, receiptsLimit),
        type: "receipt",
        requiresUpgrade: requiresUpgrade(receiptsUsed, receiptsLimit),
        canCreate: canCreate(receiptsUsed, receiptsLimit),
      },
      contracts: {
        used: contractsUsed,
        limit: contractsLimit,
        remaining: getRemaining(contractsUsed, contractsLimit),
        type: "contract",
        requiresUpgrade: requiresUpgrade(contractsUsed, contractsLimit),
        canCreate: canCreate(contractsUsed, contractsLimit),
      },
      tier: data.tier || "free",
      limits: data.limits || {
        invoices: invoicesLimit,
        receipts: receiptsLimit,
        contracts: contractsLimit,
        teamMembers: 0,
        bankAccounts: 0,
      },
    };
  };

  // Memoize fetchUsage to prevent recreation
  const fetchUsage = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetching.current) return;
    
    isFetching.current = true;
    setLoading(true);
    
    try {
      const res = await fetch("/api/user/usage");
      if (res.ok) {
        const data = await res.json();
        setRawUsage(data);
        // Transform the data for UsageSummary
        const transformed = transformUsageData(data);
        setTransformedUsage(transformed);
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  // Check for subscription success on mount
  useEffect(() => {
    const subscriptionSuccess = searchParams?.get("subscription");
    const plan = searchParams?.get("plan");

    if (subscriptionSuccess === "success") {
      setSuccessPlan(plan || userTier || "");
      setShowSuccess(true);

      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 5000);

      const url = new URL(window.location.href);
      url.searchParams.delete("subscription");
      url.searchParams.delete("plan");
      window.history.replaceState({}, "", url.toString());

      return () => clearTimeout(timer);
    }
  }, [searchParams, userTier]);

  // Fetch usage on mount - ONLY ONCE
  useEffect(() => {
    if (userTier === "free" && !initialFetchDone.current) {
      fetchUsage();
      initialFetchDone.current = true;
    } else if (userTier !== "free") {
      setLoading(false);
    }
  }, [userTier, fetchUsage]);

  // Handle refresh key changes (manual refresh)
  useEffect(() => {
    if (refreshKey > 0 && userTier === "free") {
      fetchUsage();
    }
  }, [refreshKey, userTier, fetchUsage]);

  // Listen for focus events - with debounce
  useEffect(() => {
    const handleFocus = () => {
      if (userTier === "free") {
        // Clear existing timeout
        if (focusTimeout.current) {
          clearTimeout(focusTimeout.current);
        }
        // Debounce focus events
        focusTimeout.current = setTimeout(() => {
          fetchUsage();
        }, 1000);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      if (focusTimeout.current) {
        clearTimeout(focusTimeout.current);
        focusTimeout.current = null;
      }
    };
  }, [userTier, fetchUsage]);

  // Format plan name for display
  const formatPlanName = (plan: string) => {
    if (!plan) return "";
    const planMap: Record<string, string> = {
      free: "Free",
      solopreneur: "Solopreneur",
      sme: "SME",
      enterprise: "Enterprise",
      corporation: "Corporation",
      zidlite: "Solopreneur",
      growth: "SME",
      premium: "Enterprise",
      elite: "Corporation",
    };
    return planMap[plan] || plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  // Refresh usage function
  const refreshUsage = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex min-h-screen w-full bg-[#f7f7f7] dark:bg-[#0e0e0e]">
      {/* Success Toast/Notification */}
      {showSuccess && (
        <div className="fixed top-20 right-4 z-50 animate-slideIn">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg border-l-4 border-green-700 max-w-md">
            <div className="flex items-start gap-3">
              <div className="shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-lg">
                    🎉 Subscription Activated!
                  </p>
                  <button
                    onClick={() => setShowSuccess(false)}
                    className="text-white/80 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-green-100 mt-1">
                  {successPlan ? (
                    <>
                      Your{" "}
                      <span className="font-bold">
                        {formatPlanName(successPlan)}
                      </span>{" "}
                      plan is now active. Welcome to the new features!
                    </>
                  ) : (
                    <>
                      Your account has been upgraded. Welcome to the new
                      features!
                    </>
                  )}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setShowSuccess(false)}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full transition-colors"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar with mobile support */}
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content - Using lg:pl-72 for desktop spacing */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Header with menu button */}
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        {/* Upgrade Banner - Shows only for free users */}
        <UpgradeBanner />

        {/* Main Content Area */}
        <main className="flex-1 px-4 md:px-6 py-6 md:py-8 pb-28 lg:pb-10 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
            {/* BVN Verification Badge */}
            <BVNVerificationBadge />

            {/* Hero Section */}
            <div className="text-left">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#141414] dark:text-[#f5f5f5] tracking-tight uppercase">
                OneApp to Rule Your Money
              </h1>
              <p className="text-sm md:text-base text-[#6b6b6b] dark:text-[#a6a6a6] mt-2">
                Everything you need to control your finances is here.
              </p>
            </div>

            {/* Usage Summary for Free Tier */}
            {/* {userTier === 'free' && !loading && transformedUsage && (
              <section>
                <UsageSummary usage={transformedUsage} onRefresh={refreshUsage} />
              </section>
            )} */}

           
            {/* Announcement Slider */}
            <section>
              <AnnouncementSlider />
            </section>

            {/* Quick Actions / Service Cards */}
            <section>
              <h3 className="text-sm font-bold text-[#6b6b6b] dark:text-[#a6a6a6] uppercase tracking-widest mb-4">
                Quick Actions
              </h3>
              <FeatureCards onActionComplete={refreshUsage} usage={rawUsage} />
            </section>

            {/* Articles */}
            <section>
              <RecentArticles />
            </section>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f7f7f5] dark:bg-[#0e0e0e]">
          <Loader2 className="w-8 h-8 animate-spin text-(--color-accent-yellow)" />
        </div>
      }
    >
      <DashboardPage />
    </Suspense>
  );
}