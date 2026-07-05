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
  const { userTier, isFree, isZidLite, isGrowth, isPremium, isElite } = useSubscription();
  const { unifiedEntries, activeJournalType } = useJournal();

  const getTierInfo = () => {
    if (isElite) return { icon: Sparkles, label: "Elite", color: "text-purple-500" };
    if (isPremium) return { icon: Crown, label: "Premium", color: "text-amber-500" };
    if (isGrowth) return { icon: Zap, label: "Growth", color: "text-blue-500" };
    if (isZidLite) return { icon: Zap, label: "ZidLite", color: "text-cyan-500" };
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

              {/* Tier-specific message */}
              {isFree && (
                <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-primary">💡 Upgrade to unlock:</span> Bank statement uploads, automatic bookkeeping, combined statements, and more!
                  </p>
                </div>
              )}
              {isZidLite && (
                <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-primary">📊 ZidLite:</span> Upload bank statements and get automatic bookkeeping from uploaded statements.
                  </p>
                </div>
              )}
              {isGrowth && (
                <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-primary">🚀 Growth:</span> Connect up to 5 Nigerian bank accounts for real-time transaction syncing.
                  </p>
                </div>
              )}
              {isPremium && (
                <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-primary">👑 Premium:</span> Unlimited bank accounts, advanced analytics, tax calculator, and priority support.
                  </p>
                </div>
              )}
              {isElite && (
                <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-primary">✨ Elite:</span> CFO-Level Financial Guidance, Full Tax Filing Support, and dedicated account manager.
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