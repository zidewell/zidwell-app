// app/dashboard/page.tsx
"use client";

import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardSidebar from "../components/dashboard-component/DashboardSidebar";
import DashboardHeader from "../components/dashboard-component/DashboardHeader";
import AnnouncementSlider from "../components/dashboard-component/AnnouncementSlider";
import FeatureCards from "../components/dashboard-component/FeatureCards";
import DashboardCharts from "../components/dashboard-component/DashboardCharts";
import RecentArticles from "../components/dashboard-component/RecentArticles";
import MobileBottomNav from "../components/dashboard-component/MobileBottomNav";
import TransactionHistory from "../components/transaction-history";
import { useSubscription } from "../hooks/useSubscripion";
import { UpgradeBanner } from "../components/subscription-components/UpgradeBanner";
import { SubscriptionModal } from "../components/dashboard-component/SubscriptionModal";
import { CheckCircle, Loader2, X } from "lucide-react";
import { useUserContextData } from "../context/userData";

function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPlan, setSuccessPlan] = useState("");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const { userTier, userId, loading: subscriptionLoading } = useSubscription();
  const [refreshKey, setRefreshKey] = useState(0);
  const { userData, loading: userLoading, refreshUserData } = useUserContextData();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [verificationChecked, setVerificationChecked] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  // ✅ Check if user is verified - with proper null checks
  const isUserVerified = useCallback((): boolean => {
    if (!userData) return false;
    
    // Primary check: bvn_verification
    if (userData.bvn_verification === 'verified') {
      return true;
    }
    
    // Secondary checks for backward compatibility
    return (
      userData.identity_verified === true ||
      userData.kyc_level === 'personal_verified' ||
      userData.kyc_level === 'business_verified' ||
      userData.verification_completed === true
    );
  }, [userData]);

  // ✅ Check localStorage for cached user data on mount
  useEffect(() => {
    // If userData is already loaded, mark initial load as complete
    if (userData && !userLoading) {
      setInitialLoadComplete(true);
      return;
    }

    // Try to get user data from localStorage as fallback
    try {
      const stored = localStorage.getItem("userData");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id) {
          console.log("📦 Using cached user data from localStorage");
          // Don't set state, just use for verification check
          // The context will update when ready
        }
      }
    } catch (e) {
      // Ignore
    }

    // Mark initial load as complete after a timeout to prevent infinite loading
    const timer = setTimeout(() => {
      if (!userData && !userLoading) {
        console.log("⏰ Initial load timeout - checking verification with available data");
        setInitialLoadComplete(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [userData, userLoading]);

  // ✅ Single redirect effect - waits for data to be ready
  useEffect(() => {
    // Skip if already redirecting
    if (isRedirecting) return;
    
    // Wait for user data to be loaded or initial load to complete
    if (userLoading) {
      console.log("⏳ Waiting for user data to load...");
      return;
    }

    // If no user data and initial load is not complete, wait
    if (!userData && !initialLoadComplete) {
      console.log("⏳ Waiting for user data...");
      return;
    }

    // If no user data after loading, redirect to login
    if (!userData) {
      console.log("❌ No user data found, redirecting to login");
      setIsRedirecting(true);
      router.replace("/auth/login");
      return;
    }

    // Check if user is verified
    const verified = isUserVerified();
    
    console.log("🔍 Dashboard - Verification check:", {
      bvn_verification: userData.bvn_verification,
      identity_verified: userData.identity_verified,
      kyc_level: userData.kyc_level,
      verification_completed: userData.verification_completed,
      isVerified: verified,
    });

    // Only redirect if NOT verified
    if (!verified) {
      console.log("🔄 User not verified, redirecting to onboarding");
      setIsRedirecting(true);
      router.replace("/onboarding");
    } else {
      console.log("✅ User is verified, showing dashboard");
      setVerificationChecked(true);
    }
  }, [userData, userLoading, router, isRedirecting, isUserVerified, initialLoadComplete]);

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

  // Format plan name for display
  const formatPlanName = (plan: string) => {
    if (!plan) return "";
    const planMap: Record<string, string> = {
      zidlite: "ZidLite",
      growth: "Growth",
      premium: "Premium",
      elite: "Elite",
    };
    return planMap[plan] || plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  // ✅ Show loader while checking or redirecting
  if (userLoading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f5] dark:bg-[#0e0e0e]">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  // If no user data and not loading, show loader (waiting for initial load)
  if (!userData && !initialLoadComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f5] dark:bg-[#0e0e0e]">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  // If user is not verified, don't render dashboard (redirect will happen via useEffect)
  if (userData && !isUserVerified()) {
    return null;
  }

  // If there's no user data, show loader
  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f5] dark:bg-[#0e0e0e]">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <UpgradeBanner />

        <main className="flex-1 px-4 md:px-6 py-6 md:py-8 pb-28 lg:pb-10 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
            {/* Hero Section */}
            <div className="text-left">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#141414] dark:text-[#f5f5f5] tracking-tight uppercase">
                OneApp to Rule Your Money
              </h1>
              <p className="text-sm md:text-base text-[#6b6b6b] dark:text-[#a6a6a6] mt-2">
                Everything you need to control your finances is here.
              </p>
            </div>

            {/* Announcement Slider */}
            <section>
              <AnnouncementSlider />
            </section>

            {/* Quick Actions / Service Cards */}
            <section>
              <h3 className="text-sm font-bold text-[#6b6b6b] dark:text-[#a6a6a6] uppercase tracking-widest mb-4">
                Quick Actions
              </h3>
              <FeatureCards />
            </section>

            {/* Articles */}
            <section className="mt-6">
              <RecentArticles />
            </section>
          </div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f7f7f5] dark:bg-[#0e0e0e]">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        </div>
      }
    >
      <DashboardPage />
    </Suspense>
  );
}