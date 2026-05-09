// app/dashboard/services/tax-filling/page.tsx
"use client";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import TaxCalculator from "@/app/components/tax-filling-components/TaxCalculator";
import { Button } from "@/app/components/ui/button";
import { SubscriptionPageGuard } from "@/app/components/subscription-components/SubscriptionGuard";
import { useSubscription } from "@/app/hooks/useSubscripion";
import { ArrowLeft, Crown, Zap, Sparkles, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import Link from "next/link";

function TaxFilingPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { subscription, userTier, isPremium, isGrowth, isElite, isZidLite } =
    useSubscription();

  // Define tier variables
  const isFree = userTier === "free";
  const isZidLiteUser = userTier === "zidlite";
  const isGrowthUser = userTier === "growth";
  const isPremiumUser = userTier === "premium";
  const isEliteUser = userTier === "elite";

  const hasTaxCalculatorAccess = isGrowthUser || isPremiumUser || isEliteUser;
  const hasTaxSupport = isPremiumUser || isEliteUser;
  const hasFullTaxFiling = isEliteUser;

  // Get tier icon and color
  const getTierInfo = () => {
    if (isEliteUser)
      return {
        icon: Sparkles,
        color: "text-purple-600",
        bg: "bg-purple-100 dark:bg-purple-900/20",
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
        color: "text-(--color-accent-yellow)",
        bg: "bg-(--color-accent-yellow)/10",
        label: "Growth",
      };
    if (isZidLiteUser)
      return {
        icon: Zap,
        color: "text-blue-600",
        bg: "bg-blue-100 dark:bg-blue-900/20",
        label: "ZidLite",
      };
    return {
      icon: Star,
      color: "text-(--text-secondary)",
      bg: "bg-(--bg-secondary)",
      label: "Free Trial",
    };
  };

  const tierInfo = getTierInfo();
  const TierIcon = tierInfo.icon;

  return (
    <SubscriptionPageGuard
      requiredTier="growth"
      featureKey="tax_support"
      title="Tax Manager Services"
      description="Professional tax filing, calculations, and compliance tools for your business"
    >
      <div className="min-h-screen bg-(--bg-secondary) dark:bg-[#0e0e0e] fade-in relative">
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
                      Tax Manager Services
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
                  <p className="text-sm md:text-base text-(--text-secondary)">
                    Choose your filing option based on your tax history with us
                  </p>
                </div>
              </div>

              {/* Tax Calculator - Available to Growth and above */}
              <TaxCalculator userTier={userTier} />

              {/* Premium Features */}
              {hasTaxSupport && (
                <div className="mt-8 grid md:grid-cols-2 gap-6">
                  <div className="bg-(--bg-primary) border-2 border-(--border-color) rounded-md p-6 shadow-soft hover:shadow-pop transition-all">
                    <h3 className="font-bold text-lg text-(--text-primary) mb-3">
                      Tax Filing Support
                    </h3>
                    <p className="text-(--text-secondary) mb-4">
                      Get help filing your taxes with our experts
                    </p>
                    <Link href="/dashboard/services/tax-filing/support">
                      <Button className="w-full bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 border-2 border-(--border-color) shadow-soft active:shadow-none transition-all">
                        Start Filing
                      </Button>
                    </Link>
                  </div>
                  <div className="bg-(--bg-primary) border-2 border-(--border-color) rounded-md p-6 shadow-soft hover:shadow-pop transition-all">
                    <h3 className="font-bold text-lg text-(--text-primary) mb-3">
                      Financial Statements
                    </h3>
                    <p className="text-(--text-secondary) mb-4">
                      Generate P&L, Balance Sheet, and Cash Flow
                    </p>
                    <Link href="/dashboard/services/financial-statements">
                      <Button className="w-full bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 border-2 border-(--border-color) shadow-soft active:shadow-none transition-all">
                        View Statements
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Elite Features */}
              {hasFullTaxFiling && (
                <div className="mt-8 grid md:grid-cols-3 gap-6">
                  <div className="bg-(--bg-primary) border-2 border-purple-200 dark:border-purple-800 rounded-md p-6 shadow-soft hover:shadow-pop transition-all">
                    <h3 className="font-bold text-lg text-(--text-primary) mb-3">
                      VAT Filing
                    </h3>
                    <p className="text-(--text-secondary) mb-4">
                      File your VAT returns
                    </p>
                    <Link href="/dashboard/services/tax-filing/vat">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white border-2 border-(--border-color) shadow-soft active:shadow-none transition-all">
                        File VAT
                      </Button>
                    </Link>
                  </div>
                  <div className="bg-(--bg-primary) border-2 border-purple-200 dark:border-purple-800 rounded-md p-6 shadow-soft hover:shadow-pop transition-all">
                    <h3 className="font-bold text-lg text-(--text-primary) mb-3">
                      PAYE Filing
                    </h3>
                    <p className="text-(--text-secondary) mb-4">
                      File employee taxes
                    </p>
                    <Link href="/dashboard/services/tax-filing/paye">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white border-2 border-(--border-color) shadow-soft active:shadow-none transition-all">
                        File PAYE
                      </Button>
                    </Link>
                  </div>
                  <div className="bg-(--bg-primary) border-2 border-purple-200 dark:border-purple-800 rounded-md p-6 shadow-soft hover:shadow-pop transition-all">
                    <h3 className="font-bold text-lg text-(--text-primary) mb-3">
                      WHT Filing
                    </h3>
                    <p className="text-(--text-secondary) mb-4">
                      Withholding tax filing
                    </p>
                    <Link href="/dashboard/services/tax-filing/wht">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white border-2 border-(--border-color) shadow-soft active:shadow-none transition-all">
                        File WHT
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SubscriptionPageGuard>
  );
}

export default TaxFilingPage;
