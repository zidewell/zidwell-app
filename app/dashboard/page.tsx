"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DashboardSidebar from "../components/dashboard-component/DashboardSidebar";
import DashboardHeader from "../components/dashboard-component/DashboardHeader";
import AmbientBackground from "../components/dashboard-component/AmbientBackground";
import TodaysMoney from "../components/dashboard-component/TodaysMoney";
import FutureMoney from "../components/dashboard-component/FutureMoney";
import MobileBottomNav from "../components/dashboard-component/MobileBottomNav";
import BVNVerificationBadge from "../components/BVNVerificationBadge";
import { UpgradeBanner } from "../components/subscription-components/UpgradeBanner";
import { SubscriptionModal } from "../components/dashboard-component/SubscriptionModal";
import { CheckCircle, Loader2, X } from "lucide-react";
import { useSubscription } from "../hooks/useSubscripion";
import Loader from "../components/Loader";

type Tab = "today" | "future";

// Define the Usage interface
interface UsageData {
  invoices_used: number;
  invoices_limit: number;
  receipts_used: number;
  receipts_limit: number;
  contracts_used: number;
  contracts_limit: number;
  bookkeepingTrial?: {
    isActive: boolean;
    daysRemaining: number;
  };
}

function DashboardPageContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("today");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPlan, setSuccessPlan] = useState("");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { userTier, userId, loading: subscriptionLoading } = useSubscription();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const searchParams = useSearchParams();

  const tabs: { id: Tab; label: string }[] = [
    { id: "today", label: "Today's Money" },
    { id: "future", label: "Future Money" },
  ];

  // Initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
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

  // Check if we should show subscription modal (when user hits limits)
  useEffect(() => {
    if (userTier === "free" && usage) {
      const invoiceUsage = (usage.invoices_used / usage.invoices_limit) * 100;
      const receiptUsage = (usage.receipts_used / usage.receipts_limit) * 100;
      const contractUsage = (usage.contracts_used / usage.contracts_limit) * 100;
      
      if (invoiceUsage >= 80 || receiptUsage >= 80 || contractUsage >= 80) {
        setShowSubscriptionModal(true);
      }
    }
  }, [userTier, usage]);

  // Fetch usage data
  const fetchUsage = async () => {
    try {
      const res = await fetch("/api/user/usage");
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh usage after actions
  const refreshUsage = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Fetch usage on mount and when refreshKey changes
  useEffect(() => {
    if (userTier === "free") {
      fetchUsage();
    } else {
      setLoading(false);
    }
  }, [userTier, refreshKey]);

  // Listen for focus events to refresh data when returning to dashboard
  useEffect(() => {
    const handleFocus = () => {
      if (userTier === "free") {
        fetchUsage();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [userTier]);

  // Format plan name for display
  const formatPlanName = (plan: string) => {
    if (!plan) return "";
    const planMap: Record<string, string> = {
      free: "Free",
      sme: "SME",
      enterprise: "Enterprise",
      console: "console",
      growth: "Growth",
      premium: "Premium",
      elite: "Elite",
    };
    return planMap[plan] || plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  // Get free tier limits
  const getFreeTierLimits = () => {
    return {
      invoices: 5,
      receipts: 5,
      contracts: 1,
    };
  };

  // Check if user is near limits
  const isNearLimit = () => {
    if (!usage || userTier !== "free") return false;
    const limits = getFreeTierLimits();
    return (
      usage.invoices_used / limits.invoices >= 0.8 ||
      usage.receipts_used / limits.receipts >= 0.8 ||
      usage.contracts_used / limits.contracts >= 0.8
    );
  };

  // Show loader while loading
  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-(--bg-primary) fade-in relative">
      <AmbientBackground tone={tab === "today" ? "gold" : "green"} />

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />

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

      {/* Sidebar - fixed positioning */}
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content - with left padding for desktop sidebar */}
      <div className="lg:pl-72 min-h-screen flex flex-col">
        {/* Header */}
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        {/* Upgrade Banner - Sticky below header */}
        <UpgradeBanner />

        {/* Main content area */}
        <main className="flex-1 px-4 sm:px-6 pb-32 pt-4 md:px-8 lg:px-10 lg:pb-16">
          <h1 className="sr-only">Zidwell financial dashboard</h1>

          {/* BVN Verification Badge */}
          <BVNVerificationBadge />

          {/* Tab Navigation */}
          <div className="mb-10 flex flex-wrap items-center gap-6 sm:gap-8">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative pb-3 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight transition-colors duration-300 ${
                  tab === t.id
                    ? "text-(--text-primary)"
                    : "text-(--text-secondary)/50 hover:text-(--text-secondary)"
                }`}
              >
                {t.id === "future" ? (
                  <span className="flex items-center gap-3">
                    {t.label}
                    <span className="text-[0.5rem] sm:text-xs md:text-sm font-bold uppercase tracking-wider text-(--color-accent-yellow) bg-(--color-accent-yellow)/10 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-(--color-accent-yellow)/30 animate-pulse whitespace-nowrap">
                      Coming Soon
                    </span>
                  </span>
                ) : (
                  t.label
                )}
                <span
                  className={`absolute bottom-0 left-0 h-1.5 rounded-full transition-all duration-300 ${
                    tab === t.id ? "w-full" : "w-0"
                  } ${t.id === "today" ? "bg-(--color-accent-yellow)" : "bg-[#00B64F]"}`}
                />
              </button>
            ))}
          </div>

          {/* Usage Summary for Free Tier - Like old design
          {userTier === 'free' && !loading && usage && (
            <div className="mb-6 p-4 bg-(--bg-secondary) rounded-lg border border-(--border-color)">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-(--text-secondary) uppercase tracking-widest">
                  Your Usage {isNearLimit() && <span className="ml-2 text-yellow-600">⚠️ Near limit</span>}
                </h3>
                {isNearLimit() && (
                  <button 
                    onClick={() => setShowSubscriptionModal(true)}
                    className="text-xs font-semibold text-(--color-accent-yellow) hover:underline"
                  >
                    Upgrade now →
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-(--text-secondary)">Invoices</span>
                    <span className="font-medium text-(--text-primary)">
                      {usage.invoices_used} / {usage.invoices_limit}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-(--bg-primary) rounded-full mt-1 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        (usage.invoices_used / usage.invoices_limit) >= 0.8 
                          ? 'bg-yellow-500' 
                          : (usage.invoices_used / usage.invoices_limit) >= 0.9 
                            ? 'bg-red-500' 
                            : 'bg-(--color-accent-yellow)'
                      }`}
                      style={{ width: `${Math.min((usage.invoices_used / usage.invoices_limit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-(--text-secondary)">Receipts</span>
                    <span className="font-medium text-(--text-primary)">
                      {usage.receipts_used} / {usage.receipts_limit}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-(--bg-primary) rounded-full mt-1 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        (usage.receipts_used / usage.receipts_limit) >= 0.8 
                          ? 'bg-yellow-500' 
                          : (usage.receipts_used / usage.receipts_limit) >= 0.9 
                            ? 'bg-red-500' 
                            : 'bg-(--color-accent-yellow)'
                      }`}
                      style={{ width: `${Math.min((usage.receipts_used / usage.receipts_limit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-(--text-secondary)">Contracts</span>
                    <span className="font-medium text-(--text-primary)">
                      {usage.contracts_used} / {usage.contracts_limit}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-(--bg-primary) rounded-full mt-1 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        (usage.contracts_used / usage.contracts_limit) >= 0.8 
                          ? 'bg-yellow-500' 
                          : (usage.contracts_used / usage.contracts_limit) >= 0.9 
                            ? 'bg-red-500' 
                            : 'bg-(--color-accent-yellow)'
                      }`}
                      style={{ width: `${Math.min((usage.contracts_used / usage.contracts_limit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              {isNearLimit() && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    You're approaching your free tier limits. 
                    <button 
                      onClick={() => setShowSubscriptionModal(true)}
                      className="ml-2 font-semibold text-(--color-accent-yellow) hover:underline"
                    >
                      Upgrade now →
                    </button>
                  </p>
                </div>
              )}
            </div>
          )} */}

          {tab === "today" ? (
            <TodaysMoney />
          ) : (
            <FutureMoney />
          )}
        </main>
      </div>

      <MobileBottomNav />

      {/* Manual trigger button for testing - remove in production */}
      {process.env.NODE_ENV === "development" && (
        <button
          onClick={() => setShowSubscriptionModal(true)}
          className="fixed bottom-4 left-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg"
        >
          Test Modal
        </button>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-(--bg-primary)">
          <Loader2 className="w-8 h-8 animate-spin text-(--color-accent-yellow)" />
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}
