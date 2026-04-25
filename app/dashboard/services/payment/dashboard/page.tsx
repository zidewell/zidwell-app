"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Eye,
  CreditCard,
  TrendingUp,
  Wallet,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useStore } from "@/app/hooks/useStore";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";

const Dashboard = () => {
  const router = useRouter();
  const { pages, loading, fetchPages, refreshPages } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    console.log("Dashboard mounted, fetching pages...");
    fetchPages();
  }, [fetchPages]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshPages();
    setIsRefreshing(false);
  };

  const totalBalance = pages.reduce(
    (sum, page) => sum + (page.pageBalance || 0),
    0,
  );
  const totalRevenue = pages.reduce(
    (sum, page) => sum + (page.totalRevenue || 0),
    0,
  );
  const totalPayments = pages.reduce(
    (sum, page) => sum + (page.totalPayments || 0),
    0,
  );
  const totalViews = pages.reduce(
    (sum, page) => sum + (page.pageViews || 0),
    0,
  );

  if (loading && pages.length === 0) {
    return (
      <div className="min-h-screen dark:bg-[#0e0e0e]">
        <DashboardSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="lg:pl-72 min-h-screen flex flex-col">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                  <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse"></div>
                </div>
                <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#121212] border">
                    <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
                    <div className="h-7 sm:h-8 w-20 sm:w-24 bg-gray-200 dark:bg-gray-700 rounded mb-1 animate-pulse"></div>
                    <div className="h-3 w-14 sm:w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121212] border">
                    <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700 mb-4 animate-pulse"></div>
                    <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
                    <div className="flex flex-wrap gap-3 sm:gap-4">
                      <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-[#0e0e0e]">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72 min-h-screen flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-[#6b6b6b] dark:text-[#a6a6a6] hover:text-[#023528] dark:hover:text-[#f5f5f5] transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                  Payment Pages
                </h1>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">
                  {pages.length === 0
                    ? "Create your first payment page to start collecting money"
                    : `${pages.length} page${pages.length > 1 ? "s" : ""} created`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex-1 sm:flex-none"
                >
                  <RefreshCw className={`h-4 w-4 sm:mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isRefreshing ? "Refreshing..." : "Refresh"}</span>
                </Button>
                <Button
                  variant="default"
                  onClick={() =>
                    router.push("/dashboard/services/payment/create")
                  }
                  className="flex-1 sm:flex-none"
                >
                  <Plus className="h-4 w-4 sm:mr-1" /> 
                  <span className="hidden sm:inline">New Page</span>
                </Button>
              </div>
            </div>

            {/* Overview Stats */}
            {pages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
                <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#121212] border">
                  <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-[#e1bf46] mb-2" />
                  <div className="text-lg sm:text-2xl font-bold">
                    ₦{totalBalance.toLocaleString()}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Total Balance</div>
                </div>
                <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#121212] border">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-[#28a36a] mb-2" />
                  <div className="text-lg sm:text-2xl font-bold">
                    ₦{totalRevenue.toLocaleString()}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Total Revenue</div>
                </div>
                <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#121212] border">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-[#e1bf46] mb-2" />
                  <div className="text-lg sm:text-2xl font-bold">{totalPayments}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Total Payments</div>
                </div>
                <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#121212] border">
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-[#e1bf46] mb-2" />
                  <div className="text-lg sm:text-2xl font-bold">
                    {totalViews.toLocaleString()}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Total Views</div>
                </div>
              </div>
            )}

            {/* Page Grid or Empty State */}
            {pages.length === 0 && !loading ? (
              <EmptyState
                onCreateClick={() =>
                  router.push("/dashboard/services/payment/create")
                }
              />
            ) : (
              <PageGrid pages={pages} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const EmptyState = ({ onCreateClick }: { onCreateClick: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 sm:py-24 px-4"
  >
    <button
      onClick={onCreateClick}
      className="group relative h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-[#e9e2d7] dark:bg-[#242424] border-2 border-dashed border-[#ded4c3] dark:border-[#474747] hover:border-[#e1bf46] flex items-center justify-center transition-all duration-300 mb-6"
    >
      <Plus className="h-8 w-8 sm:h-10 sm:w-10 text-[#3e7465] dark:text-[#a6a6a6] group-hover:text-[#e1bf46] transition-colors" />
    </button>
    <h2 className="text-lg sm:text-xl font-bold mb-2">No pages yet</h2>
    <p className="text-gray-500 text-xs sm:text-sm mb-6 text-center max-w-xs">
      Create a payment page to start collecting money from your customers
    </p>
    <Button variant="default" size="default" onClick={onCreateClick} className="sm:text-base">
      <Plus className="h-4 w-4 mr-1" />
      Create Payment Page
    </Button>
  </motion.div>
);

const PageGrid = ({ pages }: { pages: any[] }) => {
  const router = useRouter();

  if (!pages || pages.length === 0) {
    return null;
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {pages.map((page, i) => (
        <motion.div
          key={page.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() =>
            router.push(`/dashboard/services/payment/page/${page.id}`)
          }
          className="cursor-pointer group p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121212] border hover:border-[#e1bf46] hover:shadow-lg transition-all duration-300"
        >
          {page.coverImage ? (
            <div className="h-28 sm:h-32 rounded-xl bg-gray-100 mb-4 overflow-hidden">
              <img
                src={page.coverImage}
                alt={page.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="h-28 sm:h-32 rounded-xl bg-gray-100 mb-4 flex items-center justify-center">
              <CreditCard className="h-7 w-7 sm:h-8 sm:w-8 text-gray-400" />
            </div>
          )}
          <h3 className="font-bold text-base sm:text-lg mb-1 group-hover:text-[#e1bf46] transition-colors line-clamp-1">
            {page.title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-4 line-clamp-2">
            {page.description || "No description"}
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Wallet className="h-3 w-3" />₦
              {(page.pageBalance || 0).toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              {page.totalPayments || 0} payments
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {page.pageViews || 0} views
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default Dashboard;