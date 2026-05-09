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
        color: "text-(--color-accent-yellow)",
        bg: "bg-(--color-accent-yellow)/10",
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
                  className="text-(--color-accent-yellow) hover:text-(--color-accent-yellow) hover:bg-(--bg-secondary) p-2 md:p-2.5 rounded-md transition-all"
                >
                  <ArrowLeft className="w-5 h-5 md:mr-2" />
                  <span className="hidden md:inline text-sm font-medium">
                    Back
                  </span>
                </Button>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-(--text-primary)">
                      Invoice & Payment System
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
                    Create professional invoices and accept payments seamlessly.
                    Get paid faster with our elegant payment links.
                  </p>
                </div>
              </div>

              {/* Tier Message - For paid tiers */}
              {tierMessage && !isFree && (
                <div className="mb-6 p-4 rounded-md border-2 bg-(--bg-secondary) border-(--border-color) shadow-soft squircle-lg">
                  <p
                    className={`font-medium flex items-center gap-2 text-(--text-primary)`}
                  >
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-(--color-accent-yellow) text-(--color-ink)">
                      {tierInfo.label.toUpperCase()}
                    </span>
                    {tierMessage}
                  </p>
                </div>
              )}

              {/* {isFree && (
                <div className="mb-6 bg-(--bg-primary) border-2 border-(--border-color) rounded-md p-4 shadow-soft squircle-lg">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-(--text-secondary)">
                        Free Trial Invoice Usage:
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          hasReachedLimit
                            ? "bg-destructive/20 text-destructive"
                            : remaining <= 2
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-(--color-lemon-green)/20 text-(--color-lemon-green)"
                        }`}
                      >
                        {usedInvoices}/5 used
                      </span>
                    </div>

                    {hasReachedLimit && (
                      <Link href="/pricing?upgrade=growth">
                        <Button
                          size="sm"
                          className="bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 squircle-md"
                        >
                          Upgrade for more invoices
                        </Button>
                      </Link>
                    )}
                  </div>

               
                  <div className="w-full mt-3">
                    <div className="w-full h-1.5 bg-(--bg-secondary) rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          hasReachedLimit
                            ? "bg-destructive"
                            : remaining <= 2
                              ? "bg-(--color-lemon-green)"
                              : "bg-(--color-accent-yellow)"
                        }`}
                        style={{ width: `${(usedInvoices / 5) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-(--text-secondary) mt-1">
                      {remaining} invoice{remaining !== 1 ? "s" : ""} remaining
                    </p>
                  </div>
                </div>
              )} */}

              {/* CTA Section */}
              <div className="max-w-4xl mx-auto">
                <Card className="bg-(--bg-primary) border-2 border-(--border-color) rounded-md p-8 md:p-12 shadow-soft squircle-lg">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="h-12 w-12 rounded-lg bg-(--color-accent-yellow)/10 flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-(--color-accent-yellow)" />
                      </div>

                      <h3 className="text-2xl font-bold text-(--text-primary)">
                        Create Invoice
                      </h3>
                      <p className="text-(--text-secondary)">
                        Generate professional invoices with itemized billing,
                        automatic calculations, and instant payment links.
                      </p>

                      <ul className="space-y-2 text-sm text-(--text-secondary)">
                        <li className="flex items-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-(--color-accent-yellow) mr-2" />
                          Live preview as you create
                        </li>
                        <li className="flex items-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-(--color-accent-yellow) mr-2" />
                          Custom business branding
                        </li>
                        <li className="flex items-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-(--color-accent-yellow) mr-2" />
                          Shareable payment links
                        </li>
                        <li className="flex items-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-(--color-accent-yellow) mr-2" />
                          PDF download option
                        </li>
                      </ul>

                      <Link href="/dashboard/services/create-invoice/create">
                        <Button
                          className="bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 squircle-md"
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
                      <div className="bg-(--bg-secondary) border-2 border-(--border-color) rounded-md p-6 shadow-soft squircle-lg">
                        <h4 className="font-semibold text-(--text-primary) mb-3">
                          How it works
                        </h4>

                        <ol className="space-y-3 text-sm text-(--text-secondary)">
                          {[
                            "Fill in your business details and add invoice items",
                            "Generate invoice and copy the payment link",
                            "Share via WhatsApp or email with your client",
                            "Client pays securely and you get instant notification",
                          ].map((text, i) => (
                            <li key={i} className="flex gap-3">
                              <span className="shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-(--color-accent-yellow) text-(--color-ink) text-xs font-bold">
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
