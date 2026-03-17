"use client";

import { useState, useEffect } from "react";
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

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userTier, userId, loading: subscriptionLoading } = useSubscription();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

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

  return (
    <div className="flex min-h-screen w-full bg-[#f7f7f7] dark:bg-[#0e0e0e]">
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

            {/* Usage Summary for Free Tier */}
            {/* {userTier === 'free' && !loading && usage && (
              <section>
                <h3 className="text-sm font-bold text-[#6b6b6b] dark:text-[#a6a6a6] uppercase tracking-widest mb-4">
                  Your Usage
                </h3>
                <UsageSummary usage={usage} onRefresh={refreshUsage} />
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