// app/profile/page.tsx
"use client";

import React, { Suspense, useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";
import ProfileHeader from "@/app/components/profile-operations/ProfileHeader";
import PersonalKYCTab from "@/app/components/profile-operations/PersonalKYCTab";
import BusinessKYCTab from "@/app/components/profile-operations/BusinessKYCTab";
import SecurityTab from "@/app/components/profile-operations/SecurityTab";
import SubscriptionSection from "@/app/components/profile-operations/SubscriptionSection";
import WalletCard from "@/app/components/profile-operations/WalletCard";
import { useUserContextData } from "@/app/context/userData";
import { useSubscription } from "@/app/hooks/useSubscripion";

function NewProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "personal" | "business" | "security"
  >("personal");
  const { userData, balance, lifetimeBalance, totalTransactions, loading: userLoading } = useUserContextData();
  const { userTier, loading: subscriptionLoading } = useSubscription();

  // Handle URL parameters on mount
  useEffect(() => {
    const tab = searchParams?.get("tab");
    const verify = searchParams?.get("verify");

    if (tab === "personal") {
      setActiveTab("personal");

      if (verify === "bvn") {
        setTimeout(() => {
          const bvnSection = document.getElementById(
            "bvn-verification-section",
          );
          if (bvnSection) {
            bvnSection.scrollIntoView({ behavior: "smooth", block: "center" });
            bvnSection.classList.add(
              "ring-2",
              "ring-[#2b825b]",
              "ring-offset-2",
              "transition-all",
              "duration-500",
            );
            setTimeout(() => {
              bvnSection.classList.remove(
                "ring-2",
                "ring-[#2b825b]",
                "ring-offset-2",
              );
            }, 2000);
          }
        }, 500);
      }
    } else if (tab === "business") {
      setActiveTab("business");
    } else if (tab === "security") {
      setActiveTab("security");
    }
  }, [searchParams]);

  const handleWalletActivate = () => {
    setActiveTab("personal");
    // Optional: Add query param to scroll to BVN section
    router.push('/profile?tab=personal&verify=bvn');
  };

  // Show loading state while data is being fetched
  if (userLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f7] dark:bg-[#0e0e0e]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2b825b]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] dark:bg-[#0e0e0e] fade-in relative">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72 min-h-screen flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header with Back Button */}
            <div className="flex items-start gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-[#2b825b] hover:text-[#1e5d42] hover:bg-[#f0efe7] dark:hover:bg-[#242424] p-2 md:p-2.5 rounded-md border-2 border-transparent hover:border-[#242424] dark:hover:border-[#474747] transition-all"
              >
                <ArrowLeft className="w-5 h-5 md:mr-2" />
                <span className="hidden md:inline text-sm font-medium">
                  Back
                </span>
              </Button>

              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#141414] dark:text-[#f5f5f5] mb-2">
                  Profile Settings
                </h1>
                <p className="text-sm md:text-base text-[#6b6b6b] dark:text-[#a6a6a6]">
                  Manage your account settings and preferences
                </p>
              </div>
            </div>

            {/* Profile Header */}
            <ProfileHeader
              name={userData?.fullName || userData?.first_name || "User"}
              email={userData?.email || ""}
              subscription={(userTier as any) || "free"}
              walletActivated={!!userData?.transaction_pin}
              avatarUrl={userData?.profile_picture || userData?.profilePicture}
            />

            {/* Wallet Card */}
            <WalletCard
              allTimeBalance={lifetimeBalance || 0}
              currentBalance={balance || 0}
              totalTransactions={totalTransactions || 0}
              activated={!!userData?.bvnVerification}
              onActivate={handleWalletActivate}
            />

            {/* Tabs Navigation */}
            <div className="neo-card bg-card p-1 flex gap-1 rounded-lg">
              <button
                onClick={() => setActiveTab("personal")}
                className={`flex-1 py-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "personal"
                    ? "bg-[#2b825b] text-white dark:bg-[#236b49]"
                    : "text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                PERSONAL KYC
              </button>
              <button
                onClick={() => setActiveTab("business")}
                className={`flex-1 py-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "business"
                    ? "bg-[#2b825b] text-white dark:bg-[#236b49]"
                    : "text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                BUSINESS KYC
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`flex-1 py-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "security"
                    ? "bg-[#2b825b] text-white dark:bg-[#236b49]"
                    : "text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                SECURITY
              </button>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === "personal" && <PersonalKYCTab />}
              {activeTab === "business" && <BusinessKYCTab />}
              {activeTab === "security" && <SecurityTab />}
            </div>

            {/* Subscription Section - Now using the hook internally */}
            <SubscriptionSection />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Profile() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f7f7f5] dark:bg-[#0e0e0e]">
          <Loader2 className="w-8 h-8 animate-spin text-[#2b825b]" />
        </div>
      }
    >
      <NewProfilePage />
    </Suspense>
  );
}