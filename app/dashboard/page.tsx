"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import DashboardSidebar from "../components/dashboard-component/DashboardSidebar";
import DashboardHeader from "../components/dashboard-component/DashboardHeader";
import AnnouncementSlider from "../components/dashboard-component/AnnouncementSlider";
import FeatureCards from "../components/dashboard-component/FeatureCards";
import DataOverviewCards from "../components/dashboard-component/DataOverviewCards";
import DashboardCharts from "../components/dashboard-component/DashboardCharts";
import RecentArticles from "../components/dashboard-component/RecentArticles";
import MobileBottomNav from "../components/dashboard-component/MobileBottomNav";
import BVNVerificationBadge from "../components/BVNVerificationBadge";
import BalanceCard from "../components/Balance-card";
import TransactionHistory from "../components/transaction-history";
import UsageSummary from "../components/UsageSummary";
import { useSubscription } from "../hooks/useSubscripion";
import { UpgradeBanner } from "../components/subscription-components/UpgradeBanner";
import { SubscriptionModal } from "../components/dashboard-component/SubscriptionModal"; 
import { CheckCircle, X } from "lucide-react";

// Define the Usage interface
interface UsageData {
  invoices_used: number;
  invoices_limit: number;
  receipts_used: number;
  receipts_limit: number;
  contracts_used: number;
  contracts_limit: number;
  // Add other usage fields as needed
}

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPlan, setSuccessPlan] = useState("");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const { userTier, userId, loading: subscriptionLoading } = useSubscription();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const searchParams = useSearchParams();

  // Check for subscription success on mount
  useEffect(() => {
    const subscriptionSuccess = searchParams?.get('subscription');
    const plan = searchParams?.get('plan');
    
    if (subscriptionSuccess === 'success') {
      setSuccessPlan(plan || userTier || '');
      setShowSuccess(true);
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
      
      // Clean up URL without refreshing
      const url = new URL(window.location.href);
      url.searchParams.delete('subscription');
      url.searchParams.delete('plan');
      window.history.replaceState({}, '', url.toString());
      
      return () => clearTimeout(timer);
    }
  }, [searchParams, userTier]);

  // Check if we should show subscription modal (when user hits limits)
  useEffect(() => {
    if (userTier === 'free' && usage) {
      const invoiceUsage = (usage.invoices_used / 5) * 100; // 5 is free tier limit
      if (invoiceUsage >= 80) {
        setShowSubscriptionModal(true);
      }
    }
  }, [userTier, usage]);

  // Fetch usage data
  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/user/usage');
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh usage after actions
  const refreshUsage = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Fetch usage on mount and when refreshKey changes
  useEffect(() => {
    if (userTier === 'free') {
      fetchUsage();
    }
  }, [userTier, refreshKey]);

  // Listen for focus events to refresh data when returning to dashboard
  useEffect(() => {
    const handleFocus = () => {
      if (userTier === 'free') {
        fetchUsage();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [userTier]);

  // Format plan name for display
  const formatPlanName = (plan: string) => {
    if (!plan) return '';
    const planMap: Record<string, string> = {
      'zidlite': 'ZidLite',
      'growth': 'Growth',
      'premium': 'Premium',
      'elite': 'Elite'
    };
    return planMap[plan] || plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  // Get free tier limits
  const getFreeTierLimits = () => {
    return {
      invoices: 5,
      receipts: 5,
      contracts: 1
    };
  };

  // Check if user is near limits
  const isNearLimit = () => {
    if (!usage || userTier !== 'free') return false;
    const limits = getFreeTierLimits();
    return (
      usage.invoices_used / limits.invoices >= 0.8 ||
      usage.receipts_used / limits.receipts >= 0.8 ||
      usage.contracts_used / limits.contracts >= 0.8
    );
  };

  return (
    <div className="flex min-h-screen w-full bg-[#f7f7f7] dark:bg-[#0e0e0e]">
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
              <div className="flex-shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-lg">🎉 Subscription Activated!</p>
                  <button 
                    onClick={() => setShowSuccess(false)}
                    className="text-white/80 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-green-100 mt-1">
                  {successPlan ? (
                    <>Your <span className="font-bold">{formatPlanName(successPlan)}</span> plan is now active. Welcome to the new features!</>
                  ) : (
                    <>Your account has been upgraded. Welcome to the new features!</>
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

            {/* Balance Card */}
            {/* <section>
              <BalanceCard />
            </section> */}

            {/* Usage Summary for Free Tier
            {userTier === 'free' && !loading && usage && (
              <section>
                <h3 className="text-sm font-bold text-[#6b6b6b] dark:text-[#a6a6a6] uppercase tracking-widest mb-4">
                  Your Usage {isNearLimit() && <span className="ml-2 text-yellow-600">⚠️ Near limit</span>}
                </h3>
                <UsageSummary usage={usage} onRefresh={refreshUsage} />
                
          
                {isNearLimit() && (
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      You're approaching your free tier limits. 
                      <button 
                        onClick={() => setShowSubscriptionModal(true)}
                        className="ml-2 font-semibold text-[#2b825b] hover:underline"
                      >
                        Upgrade now →
                      </button>
                    </p>
                  </div>
                )}
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
              <FeatureCards onActionComplete={refreshUsage} usage={usage} />
            </section>

            {/* Analytics Charts */}
            {/* <section>
              <h3 className="text-sm font-bold text-[#6b6b6b] dark:text-[#a6a6a6] uppercase tracking-widest mb-4">
                Analytics
              </h3>
              <DashboardCharts />
            </section> */}

            {/* Transaction History */}
            {/* <section>
              <h3 className="text-sm font-bold text-[#6b6b6b] dark:text-[#a6a6a6] uppercase tracking-widest mb-4">
                Recent Transactions
              </h3>
              <TransactionHistory />
            </section> */}

            {/* Articles */}
            <section className="mt-5">
              <RecentArticles />
            </section>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Manual trigger button for testing - remove in production */}
      {process.env.NODE_ENV === 'development' && (
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