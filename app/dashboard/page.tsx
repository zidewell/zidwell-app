"use client";

import { useEffect, useState } from "react";
import DashboardSidebar from "../components/dashboard-component/DashboardSidebar"; 
import DashboardHeader from "../components/dashboard-component/DashboardHeader";
import AmbientBackground from "../components/dashboard-component/AmbientBackground";
import TodaysMoney from "../components/dashboard-component/TodaysMoney";
import FutureMoney from "../components/dashboard-component/FutureMoney";
import MobileBottomNav from "../components/dashboard-component/MobileBottomNav";
import BVNVerificationBadge from "../components/BVNVerificationBadge";
import BalanceCard from "../components/Balance-card";
import TransactionHistory from "../components/transaction-history";
import { useSubscription } from "../hooks/useSubscripion";
import { UpgradeBanner } from "../components/subscription-components/UpgradeBanner";
import { SubscriptionModal } from "../components/dashboard-component/SubscriptionModal";
import { CheckCircle, Loader2, X } from "lucide-react";
import Loader from "../components/Loader";

type Tab = "today" | "future";

const DashboardPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("today");
  const [isLoading, setIsLoading] = useState(true);

  const tabs: { id: Tab; label: string }[] = [
    { id: "today", label: "Today's Money" },
    { id: "future", label: "Future Money" },
  ];

  useEffect(() => {
    // Simulate loading delay or wait for data to load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Show loader while loading
  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="flex min-h-screen w-full">
      <AmbientBackground tone={tab === "today" ? "gold" : "green"} />

      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 px-4 sm:px-6 pb-32 pt-6 md:px-8 lg:px-10 lg:pb-16">
          <h1 className="sr-only">Zidwell financial dashboard</h1>

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
                {t.label}
                <span
                  className={`absolute bottom-0 left-0 h-1.5 rounded-full transition-all duration-300 ${
                    tab === t.id ? "w-full" : "w-0"
                  } ${t.id === "today" ? "bg-(--color-accent-yellow)" : "bg-[#00B64F]"}`}
                />
              </button>
            ))}
          </div>

          {tab === "today" ? <TodaysMoney /> : <FutureMoney />}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default DashboardPage;