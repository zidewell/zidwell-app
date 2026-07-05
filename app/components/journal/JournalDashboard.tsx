// app/components/journal/JournalDashboard.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Minus,
  BarChart3,
  List,
  ArrowLeftRight,
  Settings2,
  RefreshCw,
  Printer,
  ArrowLeft,
  Brain,
  Download,
  Upload,
  ChevronDown,
  FileText,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui/button";
import { JournalHeader } from "./JournalHeader";
import { SummaryCard } from "./SummaryCard";
import { ProgressIndicator } from "./ProgressIndicator";
import { EntryForm } from "./EntryForm";
import { InsightsCharts } from "./InsightsCharts";
import { RecentEntries } from "./RecentEntries";
import { CategoryManager } from "./CategoryManager";
import { BankStatementUpload } from "./BankStatementUpload";
import { BankStatementDownload } from "./BankStatementDownload";
import { EntryType, JournalEntry } from "./types";
import { cn } from "@/lib/utils";
import { useJournal } from "@/app/context/JournalContext";
import { format } from "date-fns";
import Loader from "../Loader";
import { useTier } from "@/app/context/TierContext";
import { useRegion } from "@/app/context/RegionContext";
import { ConnectedAccounts } from "./ConnectedAccounts";
import { LockedOverlay } from "./LockedOverlay";
import { CombinedStatement } from "./CombinedStatement";
import { UpgradePrompt } from "./UpgradePrompt";
import { UpgradeModal } from "./UpgradeModal";
import { MoneyFlow } from "./MoneyFlow";
import { TransactionsTab } from "./TransactionTab";
import { IntelligencePanel } from "./IntelligencePanel";
import { toast } from "sonner";

type ActiveView = "dashboard" | "moneyflow" | "insights" | "entries" | "transactions" | "intelligence";

export function JournalDashboard() {
  const { 
    activeJournalType, 
    getTodaySummary, 
    getWeekSummary, 
    getMonthSummary, 
    getYearSummary, 
    unifiedEntries,
    categories,
    refetch,
    loading
  } = useJournal();
  const { isPremium, hasBankSync, tier } = useTier();
  const { isNigeria } = useRegion();
  
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [entryType, setEntryType] = useState<EntryType>('expense');
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isStatementDropdownOpen, setIsStatementDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const todaySummary = getTodaySummary(activeJournalType);
  const weekSummary = getWeekSummary(activeJournalType);
  const monthSummary = getMonthSummary(activeJournalType);
  const yearSummary = getYearSummary(activeJournalType);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsStatementDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return <Loader />;
  }

  const openEntryForm = (type: EntryType) => {
    setEntryType(type);
    setEditingEntry(null);
    setShowEntryForm(true);
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setEntryType(entry.type);
    setShowEntryForm(true);
  };

  const handleCloseEntryForm = (open: boolean) => {
    setShowEntryForm(open);
    if (!open) setEditingEntry(null);
  };

  // Handle Statement button click - works like UpgradePrompt
  const handleStatementClick = () => {
    if (!isPremium) {
      // Free user: Open UpgradeModal (just like UpgradePrompt does)
      setShowUpgradeModal(true);
      return;
    }
    // Premium user: Toggle dropdown
    setIsStatementDropdownOpen(!isStatementDropdownOpen);
  };

  const handleStatementAction = (action: 'upload' | 'download') => {
    setIsStatementDropdownOpen(false);
    if (action === 'upload') {
      setShowUploadModal(true);
    } else {
      setShowDownloadModal(true);
    }
  };

  const navItems: { id: ActiveView; label: string; icon: typeof Wallet }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Wallet },
    { id: 'moneyflow', label: 'Money Flow', icon: BarChart3 },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'entries', label: 'Entries', icon: List },
    ...(isNigeria ? [{ id: 'transactions' as ActiveView, label: 'Transactions', icon: ArrowLeftRight }] : []),
    { id: 'intelligence', label: 'Intelligence', icon: Brain },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-8">
        <JournalHeader />

        {/* Navigation */}
        <nav className="flex gap-2 border-b border-border pb-4 flex-wrap items-center">
          {activeView !== 'dashboard' && (
            <button
              onClick={() => setActiveView('dashboard')}
              className="flex items-center gap-2 px-3 py-2 squircle-sm font-medium text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </button>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 squircle-sm font-medium text-sm transition-all',
                  activeView === item.id
                    ? 'bg-foreground text-background shadow-[var(--shadow-soft)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
          <button
            onClick={() => setShowCategoryManager(true)}
            className="ml-auto flex items-center gap-2 px-4 py-2 squircle-sm font-medium text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <Settings2 className="h-4 w-4" />
            Categories
          </button>
        </nav>

        {activeView === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            {/* Connected Accounts */}
            {isNigeria && (
              hasBankSync ? (
                <ConnectedAccounts />
              ) : (
                <LockedOverlay
                  requiredTier="premium"
                  title="Connect your bank accounts"
                  description="Zidwell Sync auto-syncs up to 5 Nigerian bank accounts — GTBank, Zenith, Opay, PalmPay and more — so bookkeeping happens as you spend and earn."
                  className="min-h-[200px]"
                >
                  <div className="grid gap-3 sm:grid-cols-3 p-2">
                    {['GT', 'Z', 'O'].map((l, i) => (
                      <div key={i} className="squircle p-5 bg-card border border-border">
                        <div className="w-12 h-12 squircle-sm bg-primary/15" />
                        <p className="font-display font-semibold mt-3">Bank Account</p>
                        <p className="text-sm text-muted-foreground">•••• 1234</p>
                      </div>
                    ))}
                  </div>
                </LockedOverlay>
              )
            )}

            {/* Today's Summary */}
            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Today's Summary</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <SummaryCard title="Income" amount={todaySummary.income} icon={TrendingUp} variant="income" />
                <SummaryCard title="Expenses" amount={todaySummary.expenses} icon={TrendingDown} variant="expense" />
                <SummaryCard title="Net Today" amount={todaySummary.net} icon={Wallet} variant="net" />
              </div>
            </section>

            {/* CTAs - All buttons in one row */}
            <section className="flex flex-wrap gap-2">
              <Button
                onClick={() => openEntryForm('income')}
                className="flex-1 min-w-[100px] h-11 text-sm font-semibold bg-[#00B64F] hover:bg-[#00B64F]/90 text-white shadow-[var(--shadow-soft)]"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Add Income
              </Button>
              <Button
                onClick={() => openEntryForm('expense')}
                className="flex-1 min-w-[100px] h-11 text-sm font-semibold bg-destructive hover:bg-destructive/90 text-white"
              >
                <Minus className="h-4 w-4 mr-1.5" /> Add Expense
              </Button>
              
              {/* Statement Button - Works like UpgradePrompt */}
              <div className="relative" ref={dropdownRef}>
                <Button
                  onClick={handleStatementClick}
                  className={cn(
                    "flex-1 min-w-[120px] h-11 text-sm font-semibold",
                    isPremium
                      ? "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30"
                      : "bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 shadow-[var(--shadow-soft)] group"
                  )}
                >
                  <FileText className="h-4 w-4 mr-1.5" />
                  Statement
                  {isPremium ? (
                    <ChevronDown className={cn(
                      "h-4 w-4 ml-1 transition-transform duration-200",
                      isStatementDropdownOpen && "rotate-180"
                    )} />
                  ) : (
                    <Sparkles className="h-3 w-3 ml-1 group-hover:animate-pulse" />
                  )}
                </Button>
                
                {/* Dropdown Menu - Only for Premium users */}
                {isPremium && isStatementDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-(--bg-primary) border border-(--border-color) rounded-xl shadow-pop z-50 overflow-hidden min-w-[200px]">
                    <button
                      onClick={() => handleStatementAction('upload')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-(--text-primary) hover:bg-(--bg-secondary) transition-colors"
                    >
                      <Upload className="h-4 w-4 text-(--color-accent-yellow)" />
                      <span>Upload Statement</span>
                    </button>
                    <div className="border-t border-(--border-color)" />
                    <button
                      onClick={() => handleStatementAction('download')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-(--text-primary) hover:bg-(--bg-secondary) transition-colors"
                    >
                      <Download className="h-4 w-4 text-(--color-accent-yellow)" />
                      <span>Download Statement</span>
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Progress */}
            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Progress</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <ProgressIndicator label="This Week" summary={weekSummary} />
                <ProgressIndicator label="This Month" summary={monthSummary} />
                <ProgressIndicator label="This Year" summary={yearSummary} />
              </div>
            </section>

            {/* Combined Statement - Premium */}
            {isPremium && <CombinedStatement />}

            {!isPremium && (
              <UpgradePrompt
                title="Generate Combined Monthly Statements"
                description="Merge Zidwell wallet + bank transactions into a single downloadable PDF."
              />
            )}

            {/* Recent */}
            <section className="space-y-4 ">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold">Recent Entries</h2>
                <button onClick={() => setActiveView('entries')} className="text-sm text-primary hover:underline">
                  View all
                </button>
              </div>
              <div className="squircle border rounded-xl bg-card overflow-hidden p-3">
                <RecentEntries onEdit={handleEdit} limit={5} />
              </div>
            </section>
          </div>
        )}

        {activeView === 'moneyflow' && (
          <div className="animate-fade-in">
            <MoneyFlow premium />
          </div>
        )}

        {activeView === 'insights' && (
          <div className="animate-fade-in">
            <InsightsCharts />
          </div>
        )}

        {activeView === 'entries' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => openEntryForm('income')} 
                className="bg-[#00B64F] hover:bg-[#00B64F]/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Income
              </Button>
              <Button 
                onClick={() => openEntryForm('expense')} 
                className="bg-destructive hover:bg-destructive/90 text-white"
              >
                <Minus className="h-4 w-4 mr-2" /> Add Expense
              </Button>
              
              {/* Statement Button in entries view */}
              <div className="relative" ref={dropdownRef}>
                <Button
                  onClick={handleStatementClick}
                  className={cn(
                    isPremium
                      ? "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30"
                      : "bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 group"
                  )}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Statement
                  {isPremium ? (
                    <ChevronDown className={cn(
                      "h-4 w-4 ml-1 transition-transform duration-200",
                      isStatementDropdownOpen && "rotate-180"
                    )} />
                  ) : (
                    <Sparkles className="h-3 w-3 ml-1 group-hover:animate-pulse" />
                  )}
                </Button>
                
                {isPremium && isStatementDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-(--bg-primary) border border-(--border-color) rounded-xl shadow-pop z-50 overflow-hidden min-w-[200px]">
                    <button
                      onClick={() => handleStatementAction('upload')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-(--text-primary) hover:bg-(--bg-secondary) transition-colors"
                    >
                      <Upload className="h-4 w-4 text-(--color-accent-yellow)" />
                      <span>Upload Statement</span>
                    </button>
                    <div className="border-t border-(--border-color)" />
                    <button
                      onClick={() => handleStatementAction('download')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-(--text-primary) hover:bg-(--bg-secondary) transition-colors"
                    >
                      <Download className="h-4 w-4 text-(--color-accent-yellow)" />
                      <span>Download Statement</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="squircle border border-border bg-card overflow-hidden">
              <RecentEntries onEdit={handleEdit} />
            </div>
          </div>
        )}

        {activeView === 'transactions' && (
          <div className="animate-fade-in">
            <TransactionsTab />
          </div>
        )}

        {activeView === 'intelligence' && (
          <div className="animate-fade-in">
            <IntelligencePanel />
          </div>
        )}

        <EntryForm open={showEntryForm} onOpenChange={handleCloseEntryForm} defaultType={entryType} editEntry={editingEntry} />
        <CategoryManager open={showCategoryManager} onOpenChange={setShowCategoryManager} />

        {/* Upload Statement Modal */}
        <BankStatementUpload
          open={showUploadModal}
          onOpenChange={setShowUploadModal}
          onUploadComplete={() => refetch()}
        />

        {/* Download Statement Modal */}
        <BankStatementDownload
          open={showDownloadModal}
          onOpenChange={setShowDownloadModal}
        />

        {/* Upgrade Modal - Opens when free user clicks Statement button */}
        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          highlight="premium"
        />
      </div>
    </div>
  );
}