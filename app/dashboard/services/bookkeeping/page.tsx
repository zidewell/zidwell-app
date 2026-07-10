// app/bookkeeping/page.tsx

"use client";

import { useState, useMemo } from "react";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import { JournalDashboard } from "@/app/components/journal/JournalDashboard";
import { JournalProvider } from "@/app/context/JournalContext";
import { useSubscription } from "@/app/hooks/useSubscripion"; 
import { Crown, Zap, Sparkles, Star, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { useJournal } from "@/app/context/JournalContext";

function BookkeepingPageContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { 
    userTier, 
    isFree, 
    isSolopreneur, 
    isSME, 
    isEnterprise, 
    isCorporation 
  } = useSubscription();
  const { unifiedEntries, activeJournalType } = useJournal();

  const getTierInfo = () => {
    if (isCorporation) return { icon: Sparkles, label: "Corporation", color: "text-purple-500" };
    if (isEnterprise) return { icon: Crown, label: "Enterprise", color: "text-amber-500" };
    if (isSME) return { icon: Star, label: "SME", color: "text-(--color-accent-yellow)" };
    if (isSolopreneur) return { icon: Zap, label: "Solopreneur", color: "text-blue-500" };
    return { icon: Star, label: "Free Trial", color: "text-gray-400" };
  };

  const tierInfo = getTierInfo();
  const TierIcon = tierInfo.icon;

  // Calculate summary for the current journal type
  const summary = useMemo(() => {
    const entries = unifiedEntries.filter(e => e.journalType === activeJournalType);
    const income = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
    const expenses = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
    return { income, expenses, net: income - expenses, count: entries.length };
  }, [unifiedEntries, activeJournalType]);

  const formatNaira = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] dark:bg-[#0e0e0e]">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="lg:pl-72 min-h-screen flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Tier Badge and Stats Header */}
            <div className="mb-6 p-4 bg-card border border-border rounded-xl shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <TierIcon className={`w-5 h-5 ${tierInfo.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Current Plan</p>
                    <p className="font-semibold text-lg flex items-center gap-2">
                      {tierInfo.label}
                      <span className="text-xs font-normal text-muted-foreground">
                        {isFree ? '• Limited features' : '• Active'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 md:gap-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Entries</p>
                    <p className="font-semibold text-lg">{summary.count}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Income</p>
                    <p className="font-semibold text-lg text-success">{formatNaira(summary.income)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Expenses</p>
                    <p className="font-semibold text-lg text-destructive">{formatNaira(summary.expenses)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Net</p>
                    <p className={`font-semibold text-lg ${summary.net >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatNaira(summary.net)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tier-specific messages */}
              {isFree && (
                <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-primary">💡 Upgrade to unlock:</span> Bank statement uploads, automatic bookkeeping, combined statements, and more!
                  </p>
                </div>
              )}
              {isSolopreneur && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    <span className="font-medium">📊 Solopreneur:</span> Upload bank statements and get automatic bookkeeping from uploaded statements.
                  </p>
                </div>
              )}
              {isSME && (
                <div className="mt-3 p-3 bg-(--color-accent-yellow)/10 rounded-lg border border-(--color-accent-yellow)/30">
                  <p className="text-sm text-(--color-accent-yellow)">
                    <span className="font-medium">🚀 SME:</span> Connect up to 3 Nigerian bank accounts for real-time transaction syncing. Tax calculator included!
                  </p>
                </div>
              )}
              {isEnterprise && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    <span className="font-medium">👑 Enterprise:</span> Connect 5 bank accounts, role-based permissions, downloadable reports, and dedicated onboarding support.
                  </p>
                </div>
              )}
              {isCorporation && (
                <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-sm text-purple-700 dark:text-purple-400">
                    <span className="font-medium">✨ Corporation:</span> Unlimited bank accounts, department-based access, payroll system, advanced reporting, and dedicated account manager.
                  </p>
                </div>
              )}
            </div>

            <JournalDashboard />
          </div>
        </main>
      </div>
    </div>
  );
}

function BookkeepingPage() {
  return (
    <JournalProvider>
      <BookkeepingPageContent />
    </JournalProvider>
  );
}

export default BookkeepingPage;