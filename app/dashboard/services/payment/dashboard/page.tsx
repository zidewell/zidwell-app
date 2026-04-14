// app/payment/dashboard/page.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Eye, CreditCard, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useStore } from "@/app/hooks/useStore";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";

const Dashboard = () => {
  const router = useRouter();
  const { pages, user } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const totalBalance = pages.reduce((sum, page) => sum + (page.pageBalance || 0), 0);
  const totalRevenue = pages.reduce((sum, page) => sum + (page.totalRevenue || 0), 0);
  const totalPayments = pages.reduce((sum, page) => sum + (page.totalPayments || 0), 0);
  const totalViews = pages.reduce((sum, page) => sum + (page.pageViews || 0), 0);

  return (
    <div className="min-h-screen dark:bg-[#0e0e0e]">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:pl-72 min-h-screen flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Payment Pages</h1>
                <p className="text-gray-500 text-sm mt-1">
                  {pages.length === 0
                    ? "Create your first payment page to start collecting money"
                    : `${pages.length} page${pages.length > 1 ? "s" : ""} created`}
                </p>
              </div>
              <Button variant="default" onClick={() => router.push("/dashboard/services/payment/create")}>
                <Plus className="h-4 w-4 mr-1" /> New Page
              </Button>
            </div>

            {/* Overview Stats */}
            {pages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-white dark:bg-[#121212] border">
                  <Wallet className="h-5 w-5 text-[#e1bf46] mb-2" />
                  <div className="text-2xl font-bold">₦{totalBalance.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Total Balance</div>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-[#121212] border">
                  <TrendingUp className="h-5 w-5 text-[#28a36a] mb-2" />
                  <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Total Revenue</div>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-[#121212] border">
                  <CreditCard className="h-5 w-5 text-[#e1bf46] mb-2" />
                  <div className="text-2xl font-bold">{totalPayments}</div>
                  <div className="text-xs text-gray-500">Total Payments</div>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-[#121212] border">
                  <Eye className="h-5 w-5 text-[#e1bf46] mb-2" />
                  <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Total Views</div>
                </div>
              </div>
            )}

            {/* Page Grid or Empty State */}
            {pages.length === 0 ? (
              <EmptyState onCreateClick={() => router.push("/dashboard/services/payment/create")} />
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
    className="flex flex-col items-center justify-center py-24"
  >
    <button
      onClick={onCreateClick}
      className="group relative h-32 w-32 rounded-full bg-[#e9e2d7] dark:bg-[#242424] border-2 border-dashed border-[#ded4c3] dark:border-[#474747] hover:border-[#e1bf46] flex items-center justify-center transition-all duration-300 mb-6"
    >
      <Plus className="h-10 w-10 text-[#3e7465] dark:text-[#a6a6a6] group-hover:text-[#e1bf46] transition-colors" />
    </button>
    <h2 className="text-xl font-bold mb-2">No pages yet</h2>
    <p className="text-gray-500 text-sm mb-6 text-center max-w-xs">
      Create a payment page to start collecting money from your customers
    </p>
    <Button variant="default" size="lg" onClick={onCreateClick}>
      <Plus className="h-4 w-4 mr-1" />
      Create Payment Page
    </Button>
  </motion.div>
);

const PageGrid = ({ pages }: { pages: any[] }) => {
  const router = useRouter();

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {pages.map((page, i) => (
        <motion.div
          key={page.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => router.push(`/page/${page.id}`)}
          className="cursor-pointer group p-5 rounded-2xl bg-white dark:bg-[#121212] border hover:border-[#e1bf46] hover:shadow-lg transition-all duration-300"
        >
          {page.coverImage ? (
            <div className="h-32 rounded-xl bg-gray-100 mb-4 overflow-hidden">
              <img
                src={page.coverImage}
                alt={page.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          ) : (
            <div className="h-32 rounded-xl bg-gray-100 mb-4 flex items-center justify-center">
              <CreditCard className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <h3 className="font-bold text-lg mb-1 group-hover:text-[#e1bf46] transition-colors line-clamp-1">
            {page.title}
          </h3>
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">
            {page.description || "No description"}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Wallet className="h-3 w-3" />₦{(page.pageBalance || 0).toLocaleString()}
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