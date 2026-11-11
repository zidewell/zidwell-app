"use client";

import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import ReceiptGen from "@/app/components/Receipt-component/ReceiptGen";

import { Button } from "@/app/components/ui/button";
import { useUserContextData } from "@/app/context/userData";
import { SubscriptionPageGuard } from "@/app/components/subscription-components/SubscriptionGuard";
import { useSubscription } from "@/app/hooks/useSubscripion";
import { ArrowLeft, Crown, Zap, Star, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import Link from "next/link";

// Numeric limit per tier. Infinity means unlimited.
// booster is normalized to starter by useSubscription, so no entry needed.
const RECEIPT_LIMITS: Record<string, number> = {
  free: 5,
  starter: 5,
  sme: Infinity,
  enterprise: Infinity,
};

const resolveReceiptLimit = (tier: string): number =>
  RECEIPT_LIMITS[tier] ?? 5;

export default function ReceiptPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState<any[]>([]);
  const { userData } = useUserContextData();
  const { userTier } = useSubscription();

  const isEnterpriseUser = userTier === "enterprise";
  const isSmeUser = userTier === "sme";

  const receiptLimit = resolveReceiptLimit(userTier);
  const hasUnlimitedReceipts = !Number.isFinite(receiptLimit);

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

  const receiptCount = receipts.length;

  const hasReachedLimit = useMemo(() => {
    if (hasUnlimitedReceipts) return false;
    return receiptCount >= receiptLimit;
  }, [hasUnlimitedReceipts, receiptCount, receiptLimit]);

  const remainingReceipts: number | "unlimited" = useMemo(() => {
    if (hasUnlimitedReceipts) return "unlimited";
    return Math.max(0, receiptLimit - receiptCount);
  }, [hasUnlimitedReceipts, receiptCount, receiptLimit]);

  const getTierInfo = () => {
    if (isEnterpriseUser)
      return {
        icon: Crown,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-100 dark:bg-amber-900/20",
        label: "Enterprise",
      };
    if (isSmeUser)
      return {
        icon: Star,
        color: "text-(--color-accent-yellow)",
        bg: "bg-(--color-accent-yellow)/10",
        label: "SME",
      };
    return {
      icon: Zap,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/20",
      label: "Free",
    };
  };

  const tierInfo = getTierInfo();
  const TierIcon = tierInfo.icon;

  const getStatusBanner = () => {
    // Unlimited
    if (hasUnlimitedReceipts) {
      return {
        bg: isEnterpriseUser
          ? "bg-amber-50 dark:bg-amber-900/20"
          : "bg-(--color-accent-yellow)/10",
        border: isEnterpriseUser
          ? "border-amber-200 dark:border-amber-800"
          : "border-(--color-accent-yellow)",
        icon: <TierIcon className={`w-5 h-5 ${tierInfo.color}`} />,
        title: `${tierInfo.label} Plan`,
        message: "You have unlimited receipts. Create as many as you need.",
        showUpgrade: false,
        upgradeText: "",
        upgradeHref: "",
      };
    }

    // Limit hit
    if (hasReachedLimit) {
      return {
        bg: "bg-red-50 dark:bg-red-900/20",
        border: "border-red-200 dark:border-red-800",
        icon: (
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
        ),
        title: "Receipt Limit Reached",
        message: `You've used all ${receiptCount}/${receiptLimit} receipts on your Free plan.`,
        showUpgrade: true,
        upgradeText: "Upgrade to SME",
        upgradeHref: "/pricing?upgrade=sme",
      };
    }

    // Getting close
    if (receiptCount >= receiptLimit - 2) {
      return {
        bg: "bg-yellow-50 dark:bg-yellow-900/20",
        border: "border-yellow-200 dark:border-yellow-800",
        icon: (
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        ),
        title: "Running Low on Receipts",
        message: `You have ${remainingReceipts} of ${receiptLimit} free receipts left.`,
        showUpgrade: true,
        upgradeText: "Upgrade for Unlimited",
        upgradeHref: "/pricing?upgrade=sme",
      };
    }

    // Plenty of room
    return {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-800",
      icon: <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      title: "Free Plan",
      message: `You have ${remainingReceipts} of ${receiptLimit} receipts remaining.`,
      showUpgrade: true,
      upgradeText: "Upgrade for Unlimited",
      upgradeHref: "/pricing?upgrade=sme",
    };
  };

  const banner = getStatusBanner();

  return (
    <SubscriptionPageGuard
      requiredTier="free"
      featureKey="receipts_per_month"
      title="Receipt & Payment Proof System"
      description="Create, send, and track professional receipts for your business transactions."
    >
      <div className="min-h-screen bg-[#f7f7f7] dark:bg-[#0e0e0e] fade-in relative">
        <DashboardSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="min-h-screen flex flex-col lg:pl-[var(--sidebar-width,288px)] transition-[padding] duration-300 ease-in-out">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
              {/* Header */}
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
                      <span
                        className={`text-xs font-semibold ${tierInfo.color}`}
                      >
                        {tierInfo.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm md:text-base text-(--text-secondary)">
                    Create, manage, and track your receipts
                  </p>
                </div>
              </div>

              {/* Single banner — one tier signal for the whole page */}
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
                    <Link href={banner.upgradeHref}>
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

              <ReceiptGen receipts={receipts} loading={loading} />
            </div>
          </main>
        </div>
      </div>
    </SubscriptionPageGuard>
  );
}