"use client";

import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import ReceiptGen from "@/app/components/Receipt-component/ReceiptGen";

import { Button } from "@/app/components/ui/button";
import { useUserContextData } from "@/app/context/userData";
import { SubscriptionPageGuard } from "@/app/components/subscription-components/SubscriptionGuard";
import { useSubscription } from "@/app/hooks/useSubscripion";
import {
  ArrowLeft,
  Crown,
  Zap,
  Sparkles,
  Star,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import Link from "next/link";

export default function ReceiptPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState<any[]>([]);
  const { userData } = useUserContextData();
  const { userTier } = useSubscription();
  const isFree = userTier === "free";
  const isSMEUser = userTier === "sme";
  const isEnterpriseUser = userTier === "enterprise";
  const isStarterUser = userTier === "starter";
  const isConsoleUser = userTier === "console";

  const [bookkeepingTrial, setBookkeepingTrial] = useState<any>(null);
  const [taxCalculatorTrial, setTaxCalculatorTrial] = useState<any>(null);

  const fetchReceipts = async (email: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/receipt/get-receipts-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: email }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch receipts");
      }

      const data = await res.json();
      setReceipts(data.receipts || []);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load receipts. Please try again.",
        confirmButtonColor: "var(--color-accent-yellow)",
        background: "var(--bg-primary)",
        customClass: {
          popup: "squircle-lg",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.email) {
      fetchReceipts(userData.email);
    }
  }, [userData]);

  const hasReceipts = receipts.length > 0;
  const receiptCount = receipts.length;

  const hasUnlimitedReceipts = isSMEUser || isEnterpriseUser || isConsoleUser;

  const receiptLimit = useMemo(() => {
    if (hasUnlimitedReceipts) return "unlimited";
    if (isStarterUser) return 10;
    return 5;
  }, [userTier, isStarterUser, hasUnlimitedReceipts]);

  const hasReachedLimit = useMemo(() => {
    if (hasUnlimitedReceipts) return false;
    if (isStarterUser) return receiptCount >= 10;
    return receiptCount >= 5;
  }, [userTier, isStarterUser, hasUnlimitedReceipts, receiptCount]);

  const remainingReceipts = useMemo(() => {
    if (hasUnlimitedReceipts) return "unlimited";
    if (isStarterUser) return Math.max(0, 10 - receiptCount);
    return Math.max(0, 5 - receiptCount);
  }, [userTier, isStarterUser, hasUnlimitedReceipts, receiptCount]);

  const getTierInfo = () => {
    if (isConsoleUser)
      return {
        icon: Sparkles,
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-100 dark:bg-purple-900/20",
        label: "Console",
      };
    if (isEnterpriseUser)
      return {
        icon: Crown,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-100 dark:bg-amber-900/20",
        label: "Enterprise",
      };
    if (isSMEUser)
      return {
        icon: Star,
        color: "text-(--color-accent-yellow)",
        bg: "bg-(--color-accent-yellow)/10",
        label: "SME",
      };
    if (isStarterUser)
      return {
        icon: Zap,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-100 dark:bg-blue-900/20",
        label: "Starter",
      };
    return {
      icon: Star,
      color: "text-gray-600 dark:text-gray-400",
      bg: "bg-gray-100 dark:bg-gray-800",
      label: "Free Trial",
    };
  };

  const tierInfo = getTierInfo();
  const TierIcon = tierInfo.icon;

  const getStatusBanner = () => {
    if (hasUnlimitedReceipts) {
      return {
        bg: isConsoleUser
          ? "bg-purple-50 dark:bg-purple-900/20"
          : isEnterpriseUser
            ? "bg-amber-50 dark:bg-amber-900/20"
            : "bg-(--color-accent-yellow)/10",
        border: isConsoleUser
          ? "border-purple-200 dark:border-purple-800"
          : isEnterpriseUser
            ? "border-amber-200 dark:border-amber-800"
            : "border-(--color-accent-yellow)",
        icon: <TierIcon className={`w-5 h-5 ${tierInfo.color}`} />,
        title: `${tierInfo.label} Plan`,
        message: "You have unlimited receipts! Create as many as you need.",
        showUpgrade: false,
      };
    }

    if (isStarterUser) {
      if (hasReachedLimit) {
        return {
          bg: "bg-red-50 dark:bg-red-900/20",
          border: "border-red-200 dark:border-red-800",
          icon: (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          ),
          title: "Starter Limit Reached",
          message: `You've used all ${receiptCount}/10 receipts. Upgrade to continue creating receipts.`,
          showUpgrade: true,
          upgradeText: "Upgrade for Unlimited",
        };
      }

      if (receiptCount >= 8) {
        return {
          bg: "bg-yellow-50 dark:bg-yellow-900/20",
          border: "border-yellow-200 dark:border-yellow-800",
          icon: (
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          ),
          title: "Limited Receipts Remaining",
          message: `You have ${remainingReceipts} Starter receipt${remainingReceipts !== 1 ? "s" : ""} left.`,
          showUpgrade: true,
          upgradeText: "Upgrade to SME",
        };
      }

      return {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-800",
        icon: <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
        title: "Starter Plan",
        message: `You have ${remainingReceipts} receipt${remainingReceipts !== 1 ? "s" : ""} remaining.`,
        showUpgrade: true,
        upgradeText: "Upgrade for Unlimited",
      };
    }

    if (hasReachedLimit) {
      return {
        bg: "bg-red-50 dark:bg-red-900/20",
        border: "border-red-200 dark:border-red-800",
        icon: (
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
        ),
        title: "Free Trial Limit Reached",
        message: `You've used all ${receiptCount}/5 receipts. Upgrade to continue creating receipts.`,
        showUpgrade: true,
        upgradeText: "Upgrade Now",
      };
    }

    if (receiptCount >= 4) {
      return {
        bg: "bg-yellow-50 dark:bg-yellow-900/20",
        border: "border-yellow-200 dark:border-yellow-800",
        icon: (
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        ),
        title: "Limited Receipts Remaining",
        message: `You have ${remainingReceipts} free receipt${remainingReceipts !== 1 ? "s" : ""} left.`,
        showUpgrade: true,
        upgradeText: "Upgrade for More",
      };
    }

    return {
      icon: <Star className="w-5 h-5 text-gray-600 dark:text-gray-400" />,
      title: "Free Trial",
      message: `You have ${remainingReceipts} free receipt${remainingReceipts !== 1 ? "s" : ""} remaining.`,
      showUpgrade: true,
      upgradeText: "Upgrade for More",
    };
  };

  const banner = getStatusBanner();

  return (
    <div className="min-h-screen bg-[#f7f7f7] dark:bg-[#0e0e0e] fade-in relative">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen flex flex-col lg:pl-[var(--sidebar-width,288px)] transition-[padding] duration-300 ease-in-out">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-start gap-4 mb-6 md:mb-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-(--color-accent-yellow) hover:text-(--color-accent-yellow)/80 hover:bg-(--bg-secondary) p-2 md:p-2.5 rounded-md border-2 border-transparent hover:border-(--border-color) transition-all"
              >
                <ArrowLeft className="w-5 h-5 md:mr-2" />
                <span className="hidden md:inline text-sm font-medium">
                  Back
                </span>
              </Button>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-(--text-primary)">
                    Receipt Management
                  </h1>
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${tierInfo.bg}`}
                  >
                    <TierIcon className={`w-4 h-4 ${tierInfo.color}`} />
                    <span className={`text-xs font-semibold ${tierInfo.color}`}>
                      {tierInfo.label}
                    </span>
                  </div>
                </div>
                <p className="text-sm md:text-base text-(--text-secondary)">
                  Create, manage, and track your receipts
                </p>
              </div>
            </div>

            <div
              className={`mb-6 p-4 rounded-lg border-2 ${banner.bg} ${banner.border} shadow-soft squircle-lg`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{banner.icon}</div>
                  <div>
                    <h3 className="font-semibold text-(--text-primary)">
                      {banner.title}
                    </h3>
                    <p className="text-sm text-(--text-secondary) mt-1">
                      {banner.message}
                    </p>
                  </div>
                </div>

                {banner.showUpgrade && (
                  <Link href="/pricing?upgrade=sme">
                    <Button
                      size="sm"
                      className="bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 whitespace-nowrap squircle-md"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      {banner.upgradeText}
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <ReceiptGen
              receipts={receipts}
              loading={loading}
              userTier={userTier as any}
              remainingReceipts={remainingReceipts}
            />
          </div>
        </main>
      </div>
    </div>
  );
}