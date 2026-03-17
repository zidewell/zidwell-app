"use client";

import Link from "next/link";
import {
  FileText,
  ArrowRight,
  ArrowLeft,
  Crown,
  Zap,
  Sparkles,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import InvoiceGen from "@/app/components/Invoice-components/InvoiceGen";
import { SubscriptionPageGuard } from "@/app/components/subscription-components/SubscriptionGuard";
import { useSubscription } from "@/app/hooks/useSubscripion";
import { useUserContextData } from "@/app/context/userData";

export default function InvoicePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { subscription, userTier, isPremium, isGrowth, isElite, isZidLite } =
    useSubscription();
  const { userData } = useUserContextData();
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      if (!userData?.id) return;

      try {
        const res = await fetch("/api/user/usage");

        if (res.ok) {
          const data = await res.json();
          setUsage(data);
        }
      } catch (error) {
        console.error("Error fetching usage:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [userData]);

  const isFree = userTier === "free";
  const isZidLiteUser = userTier === "zidlite";
  const isGrowthUser = userTier === "growth";
  const isPremiumUser = userTier === "premium";
  const isEliteUser = userTier === "elite";
  const hasUnlimitedInvoices = isPremiumUser || isGrowthUser || isEliteUser;

  const usedInvoices = usage?.invoices?.used || 0;
  const limit = hasUnlimitedInvoices ? "unlimited" : isZidLiteUser ? 10 : 5;
  const remaining = usage?.invoices?.remaining || 0;
  const hasReachedLimit = !hasUnlimitedInvoices && remaining <= 0;
  console.log(hasReachedLimit, "hasReachedLimit");

  const getTierInfo = () => {
    if (isEliteUser)
      return {
        icon: Sparkles,
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-100 dark:bg-purple-900/30",
        label: "Elite",
      };
    if (isPremiumUser)
      return {
        icon: Crown,
        color: "text-[#2b825b]",
        bg: "bg-[#2b825b]/10",
        label: "Premium",
      };
    if (isGrowthUser)
      return {
        icon: Zap,
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-100 dark:bg-green-900/30",
        label: "Growth",
      };
    if (isZidLiteUser)
      return {
        icon: Zap,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-100 dark:bg-blue-900/30",
        label: "ZidLite",
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

  const getTierMessage = () => {
    if (isEliteUser) {
      return "You have unlimited invoices with priority support!";
    }
    if (isPremiumUser) {
      return "You have unlimited invoices!";
    }
    if (isGrowthUser) {
      return "You have unlimited invoices!";
    }
    if (isZidLiteUser) {
      return `You have ${remaining} invoice${remaining !== 1 ? "s" : ""} remaining.`;
    }
    return null;
  };

  const tierMessage = getTierMessage();

  return (
    <SubscriptionPageGuard
      requiredTier="free"
      featureKey="invoices_per_month"
      title="Invoice & Payment System"
      description="Create professional invoices and accept payments seamlessly. Get paid faster with our elegant payment links."
    >
      <div className="min-h-screen bg-[#f7f7f7] dark:bg-[#0e0e0e] fade-in relative">
        <DashboardSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="lg:pl-72 min-h-screen flex flex-col">
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
              {/* Back button and header */}
              <div className="flex items-start gap-4 mb-6 md:mb-8">
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
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#141414] dark:text-[#f5f5f5]">
                      Invoice & Payment System
                    </h1>
                    {/* Single Tier Badge */}
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
                  <p className="text-sm md:text-base text-[#6b6b6b] dark:text-[#a6a6a6]">
                    Create professional invoices and accept payments seamlessly.
                    Get paid faster with our elegant payment links.
                  </p>
                </div>
              </div>

              {/* Tier Message - For paid tiers */}
              {tierMessage && !isFree && (
                <div
                  className={`mb-6 p-4 rounded-md border-2 ${
                    isEliteUser
                      ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                      : isPremiumUser
                        ? "bg-[#2b825b]/10 border-[#2b825b]"
                        : isGrowthUser
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                          : isZidLiteUser
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                            : ""
                  } shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000]`}
                >
                  <p
                    className={`font-medium flex items-center gap-2 ${
                      isEliteUser
                        ? "text-purple-600 dark:text-purple-400"
                        : isPremiumUser
                          ? "text-[#2b825b]"
                          : isGrowthUser
                            ? "text-green-600 dark:text-green-400"
                            : isZidLiteUser
                              ? "text-blue-600 dark:text-blue-400"
                              : ""
                    }`}
                  >
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        isEliteUser
                          ? "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800"
                          : isPremiumUser
                            ? "bg-[#2b825b] text-white"
                            : isGrowthUser
                              ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800"
                              : isZidLiteUser
                                ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                                : ""
                      }`}
                    >
                      {tierInfo.label.toUpperCase()}
                    </span>
                    {tierMessage}
                  </p>
                </div>
              )}

              {/* Usage Stats - Only for Free Tier */}
              {isFree && (
                <div className="mb-6 bg-[#ffffff] dark:bg-[#121212] border-2 border-[#242424] dark:border-[#474747] rounded-md p-4 shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000]">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-[#6b6b6b] dark:text-[#a6a6a6]">
                        Free Trial Invoice Usage:
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          hasReachedLimit
                            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                            : remaining <= 2
                              ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                      >
                        {usedInvoices}/5 used
                      </span>
                    </div>

                    {hasReachedLimit && (
                      <Link href="/pricing?upgrade=growth">
                        <Button
                          size="sm"
                          className="bg-[#2b825b] hover:bg-[#1e5d42] text-white border-2 border-[#242424] dark:border-[#474747] shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
                        >
                          Upgrade for more invoices
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* Progress bar for visual feedback */}
                  <div className="w-full mt-3">
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          hasReachedLimit
                            ? "bg-red-500"
                            : remaining <= 2
                              ? "bg-green-500"
                              : "bg-[#2b825b]"
                        }`}
                        style={{ width: `${(usedInvoices / 5) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#6b6b6b] dark:text-[#a6a6a6] mt-1">
                      {remaining} invoice{remaining !== 1 ? "s" : ""} remaining
                    </p>
                  </div>
                </div>
              )}

              {/* CTA Section */}
              <div className="max-w-4xl mx-auto">
                <Card className="bg-[#ffffff] dark:bg-[#121212] border-2 border-[#242424] dark:border-[#474747] rounded-md p-8 md:p-12 shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000]">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="h-12 w-12 rounded-lg bg-[#2b825b]/10 flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-[#2b825b]" />
                      </div>

                      <h3 className="text-2xl font-bold text-[#141414] dark:text-[#f5f5f5]">
                        Create Invoice
                      </h3>
                      <p className="text-[#6b6b6b] dark:text-[#a6a6a6]">
                        Generate professional invoices with itemized billing,
                        automatic calculations, and instant payment links.
                      </p>

                      <ul className="space-y-2 text-sm text-[#6b6b6b] dark:text-[#a6a6a6]">
                        <li className="flex items-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#2b825b] mr-2" />
                          Live preview as you create
                        </li>
                        <li className="flex items-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#2b825b] mr-2" />
                          Custom business branding
                        </li>
                        <li className="flex items-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#2b825b] mr-2" />
                          Shareable payment links
                        </li>
                        <li className="flex items-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#2b825b] mr-2" />
                          PDF download option
                        </li>
                      </ul>

                      <Link href="/dashboard/services/create-invoice/create">
                        <Button
                          className="bg-[#2b825b] hover:bg-[#1e5d42] text-white border-2 border-[#242424] dark:border-[#474747] shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
                          size="lg"
                          disabled={isFree && hasReachedLimit}
                        >
                          {isFree && hasReachedLimit
                            ? "Limit Reached"
                            : "Create Invoice"}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-[#f0efe7] dark:bg-[#242424] border-2 border-[#242424] dark:border-[#474747] rounded-md p-6 shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000]">
                        <h4 className="font-semibold text-[#141414] dark:text-[#f5f5f5] mb-3">
                          How it works
                        </h4>

                        <ol className="space-y-3 text-sm text-[#6b6b6b] dark:text-[#a6a6a6]">
                          {[
                            "Fill in your business details and add invoice items",
                            "Generate invoice and copy the payment link",
                            "Share via WhatsApp or email with your client",
                            "Client pays securely and you get instant notification",
                          ].map((text, i) => (
                            <li key={i} className="flex gap-3">
                              <span className="shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-[#2b825b] text-white text-xs font-bold">
                                {i + 1}
                              </span>
                              <span>{text}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Invoice History */}
              <div className="max-w-4xl mx-auto mt-16">
                <InvoiceGen />
              </div>
            </div>
          </main>
        </div>
      </div>
    </SubscriptionPageGuard>
  );
}
