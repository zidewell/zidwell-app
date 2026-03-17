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
  const { subscription, userTier, isPremium, isGrowth, isElite, isZidLite } = useSubscription();

  // Define tier variables
  const isFree = userTier === 'free';
  const isZidLiteUser = userTier === 'zidlite';
  const isGrowthUser = userTier === 'growth';
  const isPremiumUser = userTier === 'premium';
  const isEliteUser = userTier === 'elite';
  
  const hasTaxCalculatorAccess = isGrowthUser || isPremiumUser || isEliteUser;
  const hasTaxSupport = isPremiumUser || isEliteUser;
  const hasFullTaxFiling = isEliteUser;

  // Get tier icon and color
  const getTierInfo = () => {
    if (isEliteUser) return { icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20', label: 'Elite' };
    if (isPremiumUser) return { icon: Crown, color: 'text-[#2b825b]', bg: 'bg-[#2b825b]/10', label: 'Premium' };
    if (isGrowthUser) return { icon: Zap, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20', label: 'Growth' };
    if (isZidLiteUser) return { icon: Zap, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20', label: 'ZidLite' };
    return { icon: Star, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800', label: 'Free Trial' };
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
                  <span className="hidden md:inline text-sm font-medium">Back</span>
                </Button>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#141414] dark:text-[#f5f5f5]">
                      Tax Manager Services
                    </h1>
                    {/* Single Tier Badge */}
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${tierInfo.bg}`}>
                      <TierIcon className={`w-4 h-4 ${tierInfo.color}`} />
                      <span className={`text-xs font-semibold ${tierInfo.color}`}>
                        {tierInfo.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm md:text-base text-[#6b6b6b] dark:text-[#a6a6a6]">
                    Choose your filing option based on your tax history with us
                  </p>
                </div>
              </div>

              {/* Tier-specific messages */}
              {isFree && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-md shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000]">
                  <p className="text-blue-700 dark:text-blue-400 font-medium flex items-center gap-2">
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold border border-blue-200 dark:border-blue-800">
                      FREE TRIAL
                    </span>
                    Upgrade to Growth or higher to access tax calculator and filing tools.
                  </p>
                </div>
              )}

              {isZidLiteUser && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-md shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000]">
                  <p className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-2">
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold border border-blue-200 dark:border-blue-800">
                      ZIDLITE
                    </span>
                    Upgrade to Growth or higher to access tax calculator and filing tools.
                  </p>
                </div>
              )}

              {isGrowthUser && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-md shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000]">
                  <p className="text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
                    <span className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 px-2 py-1 rounded text-xs font-bold border border-green-200 dark:border-green-800">
                      GROWTH
                    </span>
                    You have access to tax calculator. Upgrade to Premium for filing support.
                  </p>
                </div>
              )}

              {isPremiumUser && (
                <div className="mb-6 p-4 bg-[#2b825b]/10 border-2 border-[#2b825b] rounded-md shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000]">
                  <p className="text-[#2b825b] font-medium flex items-center gap-2">
                    <span className="bg-[#2b825b] text-white px-2 py-1 rounded text-xs font-bold">
                      PREMIUM
                    </span>
                    You have access to tax calculator and filing support.
                  </p>
                </div>
              )}

              {isEliteUser && (
                <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-md shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000]">
                  <p className="text-purple-600 dark:text-purple-400 font-medium flex items-center gap-2">
                    <span className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 px-2 py-1 rounded text-xs font-bold border border-purple-200 dark:border-purple-800">
                      ELITE
                    </span>
                    You have access to full tax filing including VAT, PAYE, and WHT!
                  </p>
                </div>
              )}

              {/* Tax Calculator - Available to Growth and above */}
              <TaxCalculator userTier={userTier} />

              {/* Premium Features */}
              {hasTaxSupport && (
                <div className="mt-8 grid md:grid-cols-2 gap-6">
                  <div className="bg-[#ffffff] dark:bg-[#121212] border-2 border-[#242424] dark:border-[#474747] rounded-md p-6 shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] hover:shadow-[4px_4px_0px_#242424] dark:hover:shadow-[4px_4px_0px_#000000] transition-all">
                    <h3 className="font-bold text-lg text-[#141414] dark:text-[#f5f5f5] mb-3">Tax Filing Support</h3>
                    <p className="text-[#6b6b6b] dark:text-[#a6a6a6] mb-4">Get help filing your taxes with our experts</p>
                    <Link href="/dashboard/services/tax-filing/support">
                      <Button className="w-full bg-[#2b825b] text-white hover:bg-[#1e5d42] border-2 border-[#242424] dark:border-[#474747] shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all">
                        Start Filing
                      </Button>
                    </Link>
                  </div>
                  <div className="bg-[#ffffff] dark:bg-[#121212] border-2 border-[#242424] dark:border-[#474747] rounded-md p-6 shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] hover:shadow-[4px_4px_0px_#242424] dark:hover:shadow-[4px_4px_0px_#000000] transition-all">
                    <h3 className="font-bold text-lg text-[#141414] dark:text-[#f5f5f5] mb-3">Financial Statements</h3>
                    <p className="text-[#6b6b6b] dark:text-[#a6a6a6] mb-4">Generate P&L, Balance Sheet, and Cash Flow</p>
                    <Link href="/dashboard/services/financial-statements">
                      <Button className="w-full bg-[#2b825b] text-white hover:bg-[#1e5d42] border-2 border-[#242424] dark:border-[#474747] shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all">
                        View Statements
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Elite Features */}
              {hasFullTaxFiling && (
                <div className="mt-8 grid md:grid-cols-3 gap-6">
                  <div className="bg-[#ffffff] dark:bg-[#121212] border-2 border-purple-200 dark:border-purple-800 rounded-md p-6 shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] hover:shadow-[4px_4px_0px_#242424] dark:hover:shadow-[4px_4px_0px_#000000] transition-all">
                    <h3 className="font-bold text-lg text-[#141414] dark:text-[#f5f5f5] mb-3">VAT Filing</h3>
                    <p className="text-[#6b6b6b] dark:text-[#a6a6a6] mb-4">File your VAT returns</p>
                    <Link href="/dashboard/services/tax-filing/vat">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white border-2 border-[#242424] dark:border-[#474747] shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all">
                        File VAT
                      </Button>
                    </Link>
                  </div>
                  <div className="bg-[#ffffff] dark:bg-[#121212] border-2 border-purple-200 dark:border-purple-800 rounded-md p-6 shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] hover:shadow-[4px_4px_0px_#242424] dark:hover:shadow-[4px_4px_0px_#000000] transition-all">
                    <h3 className="font-bold text-lg text-[#141414] dark:text-[#f5f5f5] mb-3">PAYE Filing</h3>
                    <p className="text-[#6b6b6b] dark:text-[#a6a6a6] mb-4">File employee taxes</p>
                    <Link href="/dashboard/services/tax-filing/paye">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white border-2 border-[#242424] dark:border-[#474747] shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all">
                        File PAYE
                      </Button>
                    </Link>
                  </div>
                  <div className="bg-[#ffffff] dark:bg-[#121212] border-2 border-purple-200 dark:border-purple-800 rounded-md p-6 shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] hover:shadow-[4px_4px_0px_#242424] dark:hover:shadow-[4px_4px_0px_#000000] transition-all">
                    <h3 className="font-bold text-lg text-[#141414] dark:text-[#f5f5f5] mb-3">WHT Filing</h3>
                    <p className="text-[#6b6b6b] dark:text-[#a6a6a6] mb-4">Withholding tax filing</p>
                    <Link href="/dashboard/services/tax-filing/wht">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white border-2 border-[#242424] dark:border-[#474747] shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all">
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