"use client";

import { useState } from "react";
import { useJournal } from "@/app/context/JournalContext";
import { JournalHeader } from "./JournalHeader";
import { SummaryCard } from "./SummaryCard";
import { ProgressIndicator } from "./ProgressIndicator";
import { RecentEntries } from "./RecentEntries";
import { InsightsCharts } from "./InsightsCharts";
import { ExportStatementModal } from "./ExportStatementModal";
import { CategoryManager } from "./CategoryManager";
import { EntryForm } from "./EntryForm";
import { Button } from "../ui/button";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Download,
  Settings,
  Plus,
  Minus,
  Calendar,
} from "lucide-react";
import Loader from "@/app/components/Loader";
import { PeriodSummary } from "../journal/types";

type TimeFilter = '7D' | '30D' | '60D' | '90D' | '180D' | 'All Time';

export function JournalDashboard() {
  const {
    activeJournalType,
    getAllTimeSummary,
    getTodaySummary,
    getWeekSummary,
    getMonthSummary,
    getDaysSummary,
    walletBalance,
    loading,
  } = useJournal();

  const [showEntryForm, setShowEntryForm] = useState(false);
  const [entryType, setEntryType] = useState<"income" | "expense">("income");
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editEntry, setEditEntry] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState<TimeFilter>('30D');

  const allTime = getAllTimeSummary(activeJournalType);
  const today = getTodaySummary(activeJournalType);
  const week = getWeekSummary(activeJournalType);
  const month = getMonthSummary(activeJournalType);

  // Get filtered summary based on selected time filter
  const getFilteredSummary = (filter: TimeFilter): PeriodSummary => {
    if (filter === 'All Time') {
      return allTime;
    }
    const daysMap: Record<Exclude<TimeFilter, 'All Time'>, number> = {
      '7D': 7,
      '30D': 30,
      '60D': 60,
      '90D': 90,
      '180D': 180,
    };
    return getDaysSummary(activeJournalType, daysMap[filter]);
  };

  const filteredSummary = getFilteredSummary(selectedFilter);

  const handleExport = async (dateRange: { from: string; to: string }) => {
    console.log("Exporting", dateRange);
  };

  const handleDownloadCSV = () => {
    setShowExportModal(true);
  };

  const openEntryForm = (type: "income" | "expense") => {
    setEntryType(type);
    setEditEntry(null);
    setShowEntryForm(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));
  };

  // Show loader while categories and wallet transactions are being fetched
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <JournalHeader />

      {/* WALLET BALANCE + SUMMARY CARDS in one row */}
      <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Wallet Balance Card */}
        <div className="p-4 sm:p-5 md:p-6 rounded-2xl border bg-(--bg-primary) border-(--border-color) shadow-soft squircle-lg">
          <div className="flex flex-row sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-(--text-secondary)">
                Current Balance
              </p>
              <p
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight mt-1"
                style={{
                  color:
                    walletBalance >= 0
                      ? "var(--color-lemon-green)"
                      : "var(--destructive)",
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}
              >
                {walletBalance < 0 ? "-" : ""}
                {formatCurrency(walletBalance)}
              </p>
            </div>
            <div
              className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  walletBalance >= 0
                    ? "rgba(0, 182, 79, 0.1)"
                    : "rgba(239, 68, 68, 0.1)",
                color:
                  walletBalance >= 0
                    ? "var(--color-lemon-green)"
                    : "var(--destructive)",
              }}
            >
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
            </div>
          </div>
        </div>

        {/* Income Card */}
        <SummaryCard
          title={`Income (${selectedFilter})`}
          amount={filteredSummary.income}
          icon={TrendingUp}
          variant="income"
        />

        {/* Expenses Card */}
        <SummaryCard
          title={`Expenses (${selectedFilter})`}
          amount={filteredSummary.expenses}
          icon={TrendingDown}
          variant="expense"
        />
      </div>

      {/* PERIOD FILTERS */}
      <div className="flex flex-col gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-(--text-secondary)" />
          <span className="text-xs sm:text-sm font-medium text-(--text-secondary)">
            Time Period:
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {(['7D', '30D', '60D', '90D', '180D', 'All Time'] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                selectedFilter === filter
                  ? 'bg-(--color-accent-yellow) text-(--color-ink) shadow-md'
                  : 'bg-(--bg-secondary) text-(--text-secondary) hover:bg-(--bg-tertiary) border border-(--border-color)'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* PERIOD PROGRESS INDICATORS */}
      <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3">
        <ProgressIndicator label="Today" summary={today} />
        <ProgressIndicator label="This Week" summary={week} />
        <ProgressIndicator label="This Month" summary={month} />
      </div>

      {/* ACTION BUTTONS */}
      <section className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
        <Button
          onClick={() => openEntryForm("income")}
          className="flex-1 min-w-[120px] sm:min-w-[140px] md:min-w-[160px] h-11 sm:h-12 md:h-14 text-sm sm:text-base font-semibold bg-green-600 hover:bg-green-700 text-white shadow-[var(--shadow-soft)]"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" /> 
          <span className="hidden xs:inline">Add Income</span>
          <span className="xs:hidden">Income</span>
        </Button>
        <Button
          onClick={() => openEntryForm("expense")}
          className="flex-1 min-w-[120px] sm:min-w-[140px] md:min-w-[160px] h-11 sm:h-12 md:h-14 text-sm sm:text-base font-semibold bg-red-600 hover:bg-red-700 text-white"
        >
          <Minus className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" /> 
          <span className="hidden xs:inline">Add Expense</span>
          <span className="xs:hidden">Expense</span>
        </Button>
        <Button 
          onClick={handleDownloadCSV} 
          variant="outline" 
          className="flex-1 min-w-[100px] sm:min-w-[120px] h-11 sm:h-12 md:h-14 text-sm sm:text-base font-semibold border-(--border-color) text-(--text-secondary) hover:bg-(--bg-secondary) squircle-md"
        >
          <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" /> 
          <span className="hidden xs:inline">Statement</span>
          <span className="xs:hidden">Export</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowCategoryManager(true)}
          className="flex-1 min-w-[100px] sm:min-w-[120px] h-11 sm:h-12 md:h-14 text-sm sm:text-base font-semibold border-(--border-color) text-(--text-secondary) hover:bg-(--bg-secondary) squircle-md"
        >
          <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
          <span className="hidden xs:inline">Categories</span>
          <span className="xs:hidden">Settings</span>
        </Button>
      </section>

      {/* INSIGHTS CHARTS */}
      <div className="space-y-3 sm:space-y-4">
        <h2
          className="text-lg sm:text-xl md:text-2xl font-semibold text-(--text-primary)"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Insights
        </h2>
        <InsightsCharts />
      </div>

      {/* RECENT ENTRIES */}
      <div className="space-y-3 sm:space-y-4">
        <h2
          className="text-lg sm:text-xl md:text-2xl font-semibold text-(--text-primary)"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Recent Transactions
        </h2>
        <RecentEntries
          onEdit={(entry) => {
            setEditEntry(entry);
            setShowEntryForm(true);
          }}
        />
      </div>

      {/* MODALS */}
      <EntryForm
        open={showEntryForm}
        onOpenChange={setShowEntryForm}
        editEntry={editEntry}
        defaultType={entryType}
      />
      <CategoryManager
        open={showCategoryManager}
        onOpenChange={setShowCategoryManager}
      />
      <ExportStatementModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        journalType={activeJournalType}
      />
    </div>
  );
}