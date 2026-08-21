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
} from "lucide-react";
import Loader from "@/app/components/Loader";

export function JournalDashboard() {
  const {
    activeJournalType,
    getAllTimeSummary,
    getTodaySummary,
    getWeekSummary,
    getMonthSummary,
    walletBalance,
    loading,
  } = useJournal();

  const [showEntryForm, setShowEntryForm] = useState(false);
  const [entryType, setEntryType] = useState<"income" | "expense">("income");
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editEntry, setEditEntry] = useState<any>(null);

  const allTime = getAllTimeSummary(activeJournalType);
  const today = getTodaySummary(activeJournalType);
  const week = getWeekSummary(activeJournalType);
  const month = getMonthSummary(activeJournalType);

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
    <div className="space-y-6 md:space-y-8">
      <JournalHeader />

      {/* REAL WALLET BALANCE — Source of Truth */}
      <div className="p-5 md:p-6 rounded-2xl border bg-(--bg-primary) border-(--border-color) shadow-soft squircle-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-(--text-secondary)">
              Current Wallet Balance
            </p>
            <p
              className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mt-1"
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
            className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center"
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
            <Wallet className="h-7 w-7 md:h-8 md:w-8" />
          </div>
        </div>
      </div>

      {/* NET FLOW / P&L SUMMARY CARDS */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Net Flow"
          amount={allTime.net}
          icon={BarChart3}
          variant="net"
        />
        <SummaryCard
          title="Total Income"
          amount={allTime.income}
          icon={TrendingUp}
          variant="income"
        />
        <SummaryCard
          title="Total Expenses"
          amount={allTime.expenses}
          icon={TrendingDown}
          variant="expense"
        />
        <SummaryCard
          title="This Month"
          amount={month.net}
          icon={BarChart3}
          variant="net"
        />
      </div>

      {/* PERIOD PROGRESS INDICATORS */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <ProgressIndicator label="Today" summary={today} />
        <ProgressIndicator label="This Week" summary={week} />
        <ProgressIndicator label="This Month" summary={month} />
      </div>

      {/* ACTION BUTTONS */}
      <section className="flex gap-4 flex-wrap">
        <Button
          onClick={() => openEntryForm("income")}
          className="flex-1 min-w-[160px] h-14 text-base font-semibold bg-green-600 hover:bg-green-700 text-white shadow-[var(--shadow-soft)]"
        >
          <Plus className="h-5 w-5 mr-2" /> Add Income
        </Button>
        <Button
          onClick={() => openEntryForm("expense")}
          className="flex-1 min-w-[160px] h-14 text-base font-semibold bg-red-600 hover:bg-red-700 text-white"
        >
          <Minus className="h-5 w-5 mr-2" /> Add Expense
        </Button>
        <Button 
          onClick={handleDownloadCSV} 
          variant="outline" 
          className="h-14 font-semibold border-(--border-color) text-(--text-secondary) hover:bg-(--bg-secondary) squircle-md"
        >
          <Download className="h-5 w-5 mr-2" /> Statement
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowCategoryManager(true)}
          className="h-14 font-semibold border-(--border-color) text-(--text-secondary) hover:bg-(--bg-secondary) squircle-md"
        >
          <Settings className="h-5 w-5 mr-2" />
          Categories
        </Button>
      </section>

      {/* INSIGHTS CHARTS */}
      <div className="space-y-4">
        <h2
          className="text-lg md:text-xl font-semibold text-(--text-primary)"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Insights
        </h2>
        <InsightsCharts />
      </div>

      {/* RECENT ENTRIES */}
      <div className="space-y-4">
        <h2
          className="text-lg md:text-xl font-semibold text-(--text-primary)"
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