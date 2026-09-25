"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardSidebar from "../components/dashboard-component/DashboardSidebar";
import DashboardHeader from "../components/dashboard-component/DashboardHeader";
import AnnouncementSlider from "../components/dashboard-component/AnnouncementSlider";
import FeatureCards from "../components/dashboard-component/FeatureCards";
import DataOverviewCards from "../components/dashboard-component/DataOverviewCards";
import DashboardCharts from "../components/dashboard-component/DashboardCharts";
import RecentArticles from "../components/dashboard-component/RecentArticles";
import MobileBottomNav from "../components/dashboard-component/MobileBottomNav";
import BVNVerificationBadge from "../components/VerificationBadge";
import BalanceCard from "../components/Balance-card";
import TransactionHistory from "../components/transaction-history";
import { useSubscription } from "../hooks/useSubscripion";
import { UpgradeBanner } from "../components/subscription-components/UpgradeBanner";
import { SubscriptionModal } from "../components/dashboard-component/SubscriptionModal";
import { useUserContextData } from "../context/userData";
import { CheckCircle, Loader2, X, Sparkles } from "lucide-react";

// ─── Usage type ───
interface UsageData {
  invoices_used: number;
  invoices_limit: number;
  receipts_used: number;
  receipts_limit: number;
  contracts_used: number;
  contracts_limit: number;
}

function DashboardPage() {
  const router = useRouter();
  const { userData } = useUserContextData();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPlan, setSuccessPlan] = useState("");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const { userTier, userId, loading: subscriptionLoading } = useSubscription();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // ─── Activation toast states ───
  const [showVerifiedToast, setShowVerifiedToast] = useState(false);
  const [activationChecking, setActivationChecking] = useState(false);

  const searchParams = useSearchParams();

  // ─── Subscription success toast (existing) ───
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

  // ─── Already-verified cookie toast ───
  // proxy.ts sets `already_verified=1` when it redirects a fully
  // verified user away from /verification. Read it here, clear it,
  // and show a one-shot toast.
  useEffect(() => {
    if (typeof document === "undefined") return;

    const cookies = document.cookie.split("; ");
    const hasFlag = cookies.some((c) =>
      c.trim().startsWith("already_verified=")
    );

    if (hasFlag) {
      document.cookie =
        "already_verified=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      document.cookie =
        "already_verified=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      setShowVerifiedToast(true);
      const timer = setTimeout(() => setShowVerifiedToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  // ─── Auto-open subscription modal near limits ───
  useEffect(() => {
    if (userTier === "free" && usage) {
      const invoiceUsage = (usage.invoices_used / 5) * 100;
      if (invoiceUsage >= 80) {
        setShowSubscriptionModal(true);
      }
    }
  }, [userTier, usage]);

  // ─── Fetch usage ───
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

  const refreshUsage = () => {
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    if (userTier === "free") {
      fetchUsage();
    }
  }, [userTier, refreshKey]);

  useEffect(() => {
    const handleFocus = () => {
      if (userTier === "free") {
        fetchUsage();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [userTier]);

  // ─── Plan formatting ───
  const formatPlanName = (plan: string) => {
    if (!plan) return "";
    const planMap: Record<string, string> = {
      free: "Free",
      solopreneur: "Solopreneur",
      sme: "SME",
      enterprise: "Enterprise",
      corporation: "Corporation",
    };
    return planMap[plan] || plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  const getFreeTierLimits = () => ({
    invoices: 5,
    receipts: 5,
    contracts: 1,
  });

  const isNearLimit = () => {
    if (!usage || userTier !== "free") return false;
    const limits = getFreeTierLimits();
    return (
      usage.invoices_used / limits.invoices >= 0.8 ||
      usage.receipts_used / limits.receipts >= 0.8 ||
      usage.contracts_used / limits.contracts >= 0.8
    );
  };

  // ─── Manual activation check ───
  const handleCheckActivation = async () => {
    if (activationChecking) return;
    setActivationChecking(true);

    try {
      const res = await fetch("/api/activate", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (data?.activation?.activated) {
        // Reload so userData (context) refetches and the banner disappears
        window.location.reload();
      } else {
        alert(
          data?.activation?.reason ||
            "Not enough funds yet. Fund ₦2,000 or more to activate your account."
        );
      }
    } catch (err) {
      console.error("Activation check failed:", err);
      alert("Could not check activation status. Please try again.");
    } finally {
      setActivationChecking(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#f7f7f7] dark:bg-[#0e0e0e]">
      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />

      {/* ─── Subscription success toast ─── */}
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

      {/* ─── Already-verified toast ─── */}
      {showVerifiedToast && (
        <div className="fixed top-20 right-4 z-50 animate-slideIn">
          <div className="bg-(--color-accent-yellow) text-(--color-ink) px-6 py-4 rounded-lg shadow-lg border-l-4 border-yellow-600 max-w-md">
            <div className="flex items-start gap-3">
              <div className="shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-lg">Welcome back!</p>
                  <button
                    onClick={() => setShowVerifiedToast(false)}
                    className="text-(--color-ink)/80 hover:text-(--color-ink)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-(--color-ink)/80 mt-1">
                  You&apos;re already verified — nothing more to do. Enjoy
                  Zidwell!
                </p>
                <div className="mt-3">
                  <button
                    onClick={() => setShowVerifiedToast(false)}
                    className="text-xs bg-(--color-ink)/10 hover:bg-(--color-ink)/20 text-(--color-ink) px-3 py-1 rounded-full transition-colors"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[var(--sidebar-width,288px)] transition-[padding] duration-300 ease-in-out">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        <UpgradeBanner />

        <main className="flex-1 px-4 md:px-6 py-6 md:py-8 pb-28 lg:pb-10 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
            <BVNVerificationBadge />

            {/* ─── Activation banner ─── */}
            {userData?.bank78Verified && !userData?.activationPaid && (
              <div className="rounded-2xl bg-(--color-accent-yellow)/10 border border-(--color-accent-yellow)/30 p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-(--color-accent-yellow) flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-(--text-primary) text-lg">
                      Activate your account
                    </h3>
                    <p className="text-sm text-(--text-secondary) mt-1 leading-relaxed">
                      Fund your wallet with <strong>₦2,000 or more</strong>.
                      We&apos;ll debit <strong>₦1,000</strong> for activation
                      and leave <strong>₦1,000</strong> in your wallet to get
                      you started.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-(--bg-secondary) border border-(--border-color) p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs text-(--text-secondary) font-medium">
                      Your account number
                    </p>
                    <p className="font-semibold tracking-widest text-(--text-primary) text-lg">
                      {userData?.bankAccountNumber || "—"}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/dashboard/fund-account")}
                    className="h-11 px-5 rounded-2xl text-sm font-semibold bg-(--color-accent-yellow) text-(--color-ink) hover:opacity-90 cursor-pointer"
                  >
                    Fund Wallet
                  </button>
                </div>

                <button
                  onClick={handleCheckActivation}
                  disabled={activationChecking}
                  className="text-xs underline text-(--text-secondary) hover:text-(--text-primary) cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {activationChecking ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    "Already funded? Check activation status"
                  )}
                </button>
              </div>
            )}

            {/* Hero */}
            <div className="text-left">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#141414] dark:text-[#f5f5f5] tracking-tight uppercase">
                OneApp to Rule Your Money
              </h1>
              <p className="text-sm md:text-base text-[#6b6b6b] dark:text-[#a6a6a6] mt-2">
                Everything you need to control your finances is here.
              </p>
            </div>

            {/* Announcement */}
            <section>
              <AnnouncementSlider />
            </section>

            {/* Quick Actions */}
            <section className="mt-16">
              <h3 className="text-sm font-bold text-[#6b6b6b] dark:text-[#a6a6a6] uppercase tracking-widest mb-4">
                Quick Actions
              </h3>
              <FeatureCards onActionComplete={refreshUsage} usage={usage} />
            </section>

            {/* Articles */}
            <section className="mt-20">
              <RecentArticles />
            </section>
          </div>
        </main>
      </div>

      {/* Mobile bottom nav (disabled) */}
      {/* <MobileBottomNav /> */}

      {/* Dev-only subscription modal trigger */}
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
        <div className="min-h-screen flex items-center justify-center bg-[#f7f7f5] dark:bg-[#0e0e0e]">
          <Loader2 className="w-8 h-8 animate-spin text-(--color-accent-yellow)" />
        </div>
      }
    >
      <DashboardPage />
    </Suspense>
  );
}