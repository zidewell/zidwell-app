"use client";
import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "../ui/button";
import { JournalHeader } from "./JournalHeader";
import { SummaryCard } from "./SummaryCard";
import { ProgressIndicator } from "./ProgressIndicator";
import { EntryForm } from "./EntryForm";
import { InsightsCharts } from "./InsightsCharts";
import { RecentEntries } from "./RecentEntries";
import { CategoryManager } from "./CategoryManager";
import { ExportStatementModal } from "./ExportStatementModal";
import { EntryType, JournalEntry } from "./types";
import { cn } from "@/lib/utils";
import { useJournal } from "@/app/context/JournalContext";
import { format } from "date-fns";
import Loader from "../Loader";

type ActiveView = "dashboard" | "insights" | "entries";

export function JournalDashboard() {
  const {
    activeJournalType,
    getAllTimeSummary,
    getTodaySummary,
    getWeekSummary,
    getMonthSummary,
    getYearSummary,
    entries,
    unifiedEntries,
    categories,
    loading,
    error,
    refetch,
    updateTrigger,
  } = useJournal();

  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [entryType, setEntryType] = useState<EntryType>("expense");
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [, setForceUpdate] = useState(0);

  // Force re-render when entries change
  useEffect(() => {
    console.log("JournalDashboard - Entries updated:", entries.length);
    console.log("JournalDashboard - Unified entries:", unifiedEntries?.length);
    setForceUpdate((prev) => prev + 1);
  }, [entries, unifiedEntries, updateTrigger]);

  // Get summaries
  const allTimeSummary = getAllTimeSummary(activeJournalType);
  const todaySummary = getTodaySummary(activeJournalType);
  const weekSummary = getWeekSummary(activeJournalType);
  const monthSummary = getMonthSummary(activeJournalType);
  const yearSummary = getYearSummary(activeJournalType);

  // Helper function for date formatting
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return "Select date";
    const date = new Date(dateString);
    return format(date, "MMM dd, yyyy");
  };

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
    if (!open) {
      setEditingEntry(null);
    }
  };

  const handleExportPDF = async (dateRange: { from: string; to: string }) => {
    setExporting(true);
    try {
      // Filter entries by date range
      const fromDateTime = new Date(dateRange.from);
      fromDateTime.setHours(0, 0, 0, 0);

      const toDateTime = new Date(dateRange.to);
      toDateTime.setHours(23, 59, 59, 999);

      // Use unifiedEntries instead of entries to include wallet transactions
      let filteredEntries = unifiedEntries.filter((entry) => {
        const entryDate = new Date(entry.date);
        const matchesDate =
          entryDate >= fromDateTime && entryDate <= toDateTime;

        if (entry.journalType && activeJournalType) {
          return matchesDate && entry.journalType === activeJournalType;
        }
        return matchesDate;
      });

      // Also include manual entries that might not be in unifiedEntries
      const manualFiltered = entries.filter((entry) => {
        const entryDate = new Date(entry.date);
        const matchesDate =
          entryDate >= fromDateTime && entryDate <= toDateTime;
        if (entry.journalType && activeJournalType) {
          return matchesDate && entry.journalType === activeJournalType;
        }
        return matchesDate;
      });

      // Merge and deduplicate by id
      const allFiltered = [...filteredEntries, ...manualFiltered];
      const uniqueEntries = Array.from(
        new Map(allFiltered.map((entry) => [entry.id, entry])).values(),
      );

      if (uniqueEntries.length === 0) {
        alert(
          `No journal entries found in the selected date range (${formatDateDisplay(dateRange.from)} to ${formatDateDisplay(dateRange.to)}) for ${activeJournalType} journal.`,
        );
        setExporting(false);
        return;
      }

      // Sort entries by date (newest first)
      const sortedEntries = [...uniqueEntries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      // Calculate summaries
      const totalIncome = uniqueEntries
        .filter((e) => e.type === "income")
        .reduce((sum, e) => sum + e.amount, 0);

      const totalExpenses = uniqueEntries
        .filter((e) => e.type === "expense")
        .reduce((sum, e) => sum + e.amount, 0);

      const netTotal = totalIncome - totalExpenses;

      // Group by category for breakdown
      const categoryBreakdown: Record<
        string,
        { income: number; expense: number; icon: string }
      > = {};

      uniqueEntries.forEach((entry) => {
        const category = categories.find((c) => c.id === entry.categoryId);
        const categoryName = category?.name || "Other";
        const categoryIcon = category?.icon || "📦";

        if (!categoryBreakdown[categoryName]) {
          categoryBreakdown[categoryName] = {
            income: 0,
            expense: 0,
            icon: categoryIcon,
          };
        }

        if (entry.type === "income") {
          categoryBreakdown[categoryName].income += entry.amount;
        } else {
          categoryBreakdown[categoryName].expense += entry.amount;
        }
      });

      // Create professional receipt HTML
      const receiptHTML = `<!DOCTYPE html>
<html>
<head>
  <title>Journal Statement - ${activeJournalType} - ${formatDateDisplay(dateRange.from)} to ${formatDateDisplay(dateRange.to)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f7f3ee;
      padding: 40px 20px;
      color: #191919;
      line-height: 1.5; 
    }
    
    .statement-container {
      max-width: 1000px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 1px solid #E5E5E5;
      border-radius: 28px;
      padding: 40px;
      box-shadow: 0 20px 35px -8px rgba(0, 0, 0, 0.15), 0 5px 12px -4px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #E5E5E5;
      padding-bottom: 30px;
      margin-bottom: 30px;
    }
    
    .title-section h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 32px;
      font-weight: 700;
      color: #191919;
      margin-bottom: 8px;
    }
    
    .title-section p {
      color: #666666;
      font-size: 14px;
    }
    
    .journal-badge {
      background: #FDC020;
      color: #191919;
      padding: 12px 24px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 18px;
      box-shadow: 0 2px 4px rgba(25, 25, 25, 0.1);
    }
    
    .period {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #F5F5F5;
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 30px;
    }
    
    .period-item {
      display: flex;
      flex-direction: column;
    }
    
    .period-label {
      font-size: 12px;
      color: #666666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .period-value {
      font-size: 18px;
      font-weight: 600;
      color: #191919;
    }
    
    .period-divider {
      width: 2px;
      height: 30px;
      background: #E5E5E5;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .summary-card {
      background: white;
      border: 1px solid #E5E5E5;
      border-radius: 20px;
      padding: 20px;
    }
    
    .summary-card.income {
      background: linear-gradient(145deg, #ffffff, #f0fdf4);
      border-color: rgba(0, 182, 79, 0.3);
    }
    
    .summary-card.expense {
      background: linear-gradient(145deg, #ffffff, #fef2f2);
      border-color: rgba(239, 68, 68, 0.3);
    }
    
    .summary-card.net {
      background: #FDC020;
      border: none;
    }
    
    .summary-title {
      font-size: 14px;
      color: #666666;
      margin-bottom: 8px;
    }
    
    .summary-card.net .summary-title {
      color: rgba(25, 25, 25, 0.8);
    }
    
    .summary-amount {
      font-size: 28px;
      font-weight: 700;
    }
    
    .summary-card.income .summary-amount {
      color: #00B64F;
    }
    
    .summary-card.expense .summary-amount {
      color: #ef4444;
    }
    
    .summary-card.net .summary-amount {
      color: #191919;
    }
    
    .breakdown-section {
      background: #F5F5F5;
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 40px;
    }
    
    .breakdown-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 18px;
      font-weight: 600;
      color: #191919;
      margin-bottom: 20px;
    }
    
    .breakdown-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    
    .category-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px dashed #E5E5E5;
    }
    
    .category-name {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
    }
    
    .category-icon {
      font-size: 18px;
    }
    
    .category-income {
      color: #00B64F;
      font-weight: 600;
    }
    
    .category-expense {
      color: #ef4444;
      font-weight: 600;
    }
    
    .transactions-section {
      margin-bottom: 30px;
    }
    
    .transactions-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 18px;
      font-weight: 600;
      color: #191919;
      margin-bottom: 16px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    th {
      text-align: left;
      padding: 12px 16px;
      background: #F5F5F5;
      color: #666666;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    td {
      padding: 16px;
      border-bottom: 1px solid #E5E5E5;
      font-size: 14px;
    }
    
    .transaction-income {
      color: #00B64F;
      font-weight: 600;
    }
    
    .transaction-expense {
      color: #ef4444;
      font-weight: 600;
    }
    
    .transaction-category {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .transaction-note {
      color: #666666;
      font-size: 12px;
      margin-top: 4px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #E5E5E5;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #666666;
      font-size: 12px;
    }
    
    .footer-stats {
      display: flex;
      gap: 24px;
    }
    
    .footer-stat {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    
    .footer-stat-label {
      font-size: 11px;
      color: #666666;
    }
    
    .footer-stat-value {
      font-size: 16px;
      font-weight: 600;
      color: #191919;
    }
    
    .signature {
      font-family: 'Playfair Display', Georgia, serif;
      font-style: italic;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .statement-container {
        box-shadow: none;
        border: none;
      }
    }
  </style>
</head>
<body>
  <div class="statement-container">
    <div class="header">
      <div class="title-section">
        <h1>Journal Statement</h1>
        <p>${activeJournalType.charAt(0).toUpperCase() + activeJournalType.slice(1)} Account</p>
      </div>
      <div class="journal-badge">
        ZIDWELL BOOKKEEP
      </div>
    </div>
    
    <div class="period">
      <div class="period-item">
        <span class="period-label">From Date</span>
        <span class="period-value">${formatDateDisplay(dateRange.from)}</span>
      </div>
      <div class="period-divider"></div>
      <div class="period-item">
        <span class="period-label">To Date</span>
        <span class="period-value">${formatDateDisplay(dateRange.to)}</span>
      </div>
      <div class="period-divider"></div>
      <div class="period-item">
        <span class="period-label">Generated On</span>
        <span class="period-value">${format(new Date(), "MMM dd, yyyy")}</span>
      </div>
    </div>
    
    <div class="summary-grid">
      <div class="summary-card income">
        <div class="summary-title">Total Income</div>
        <div class="summary-amount">₦${totalIncome.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</div>
        <div style="font-size: 12px; color: #00B64F; margin-top: 8px;">
          ${uniqueEntries.filter((e) => e.type === "income").length} transactions
        </div>
      </div>
      <div class="summary-card expense">
        <div class="summary-title">Total Expenses</div>
        <div class="summary-amount">₦${totalExpenses.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</div>
        <div style="font-size: 12px; color: #ef4444; margin-top: 8px;">
          ${uniqueEntries.filter((e) => e.type === "expense").length} transactions
        </div>
      </div>
      <div class="summary-card net">
        <div class="summary-title">Net Balance</div>
        <div class="summary-amount">₦${netTotal.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</div>
        <div style="font-size: 12px; color: rgba(25,25,25,0.8); margin-top: 8px;">
          ${netTotal >= 0 ? "Positive" : "Negative"}
        </div>
      </div>
    </div>
    
    <div class="breakdown-section">
      <div class="breakdown-title">Category Breakdown</div>
      <div class="breakdown-grid">
        ${Object.entries(categoryBreakdown)
          .map(
            ([name, data]) => `
          <div class="category-item">
            <span class="category-name">
              <span class="category-icon">${data.icon}</span>
              ${name}
            </span>
            <div style="display: flex; gap: 16px;">
              ${data.income > 0 ? `<span class="category-income">+₦${data.income.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>` : ""}
              ${data.expense > 0 ? `<span class="category-expense">-₦${data.expense.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>` : ""}
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
    
    <div class="transactions-section">
      <div class="transactions-title">Transaction Details</div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Description</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${sortedEntries
            .map((entry) => {
              const category = categories.find(
                (c) => c.id === entry.categoryId,
              );
              const categoryIcon = category?.icon || "📦";
              const categoryName = category?.name || "Other";
              const isIncome = entry.type === "income";
              const displayNote =
                entry.note || (entry.type === "income" ? "Income" : "Expense");

              return `
              <tr>
                <td style="width: 100px;">${format(new Date(entry.date), "MMM dd, yyyy")}</td>
                <td>
                  <div class="transaction-category">
                    <span style="font-size: 16px;">${categoryIcon}</span>
                    ${categoryName}
                  </div>
                </td>
                <td>
                  ${displayNote}
                  <div class="transaction-note">Ref: ${entry.id.slice(0, 8)}</div>
                </td>
                <td style="text-align: right; font-weight: 600;" class="${isIncome ? "transaction-income" : "transaction-expense"}">
                  ${isIncome ? "+" : "-"}₦${entry.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
    
    <div class="footer">
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">Zidwell Book</div>
        <div>${format(new Date(), "MMMM d, yyyy h:mm a")}</div>
      </div>
      <div class="footer-stats">
        <div class="footer-stat">
          <span class="footer-stat-label">Total Entries</span>
          <span class="footer-stat-value">${sortedEntries.length}</span>
        </div>
        <div class="footer-stat">
          <span class="footer-stat-label">Net Balance</span>
          <span class="footer-stat-value" style="color: ${netTotal >= 0 ? "#00B64F" : "#ef4444"}">
            ₦${netTotal.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
    
    <div style="margin-top: 30px; text-align: center; color: #666666; font-size: 11px;">
      <span class="signature">— This is an official statement from your Zidwell Journal —</span>
    </div>
  </div>
</body>
</html>`;

      // Call PDF generation API
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ html: receiptHTML }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Convert response to blob and download
      const pdfBlob = await response.blob();
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `journal-statement-${activeJournalType}-${dateRange.from}-${dateRange.to}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Success notification
      const notification = document.createElement("div");
      notification.className =
        "fixed top-4 right-4 bg-(--color-accent-yellow) text-(--color-ink) px-4 py-2 rounded-lg shadow-pop z-50 animate-in fade-in slide-in-from-top-2 squircle-sm";
      notification.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>Journal statement downloaded successfully! (${sortedEntries.length} entries)</span>
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export statement. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-8">
        <JournalHeader />

        {/* Navigation */}
        <nav className="flex gap-2 pb-4 flex-wrap border-b border-(--border-color)">
          <button
            onClick={() => setActiveView("dashboard")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all",
            )}
            style={{
              backgroundColor:
                activeView === "dashboard"
                  ? "var(--color-accent-yellow)"
                  : "transparent",
              color:
                activeView === "dashboard"
                  ? "var(--color-ink)"
                  : "var(--text-secondary)",
              boxShadow:
                activeView === "dashboard"
                  ? "0 4px 20px -4px rgba(253, 192, 32, 0.3)"
                  : "none",
            }}
          >
            <Wallet className="h-4 w-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveView("insights")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all",
            )}
            style={{
              backgroundColor:
                activeView === "insights"
                  ? "var(--color-accent-yellow)"
                  : "transparent",
              color:
                activeView === "insights"
                  ? "var(--color-ink)"
                  : "var(--text-secondary)",
              boxShadow:
                activeView === "insights"
                  ? "0 4px 20px -4px rgba(253, 192, 32, 0.3)"
                  : "none",
            }}
          >
            <BarChart3 className="h-4 w-4" />
            Insights
          </button>
          <button
            onClick={() => setActiveView("entries")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all",
            )}
            style={{
              backgroundColor:
                activeView === "entries"
                  ? "var(--color-accent-yellow)"
                  : "transparent",
              color:
                activeView === "entries"
                  ? "var(--color-ink)"
                  : "var(--text-secondary)",
              boxShadow:
                activeView === "entries"
                  ? "0 4px 20px -4px rgba(253, 192, 32, 0.3)"
                  : "none",
            }}
          >
            <List className="h-4 w-4" />
            Entries
          </button>

          <button
            onClick={() => setShowCategoryManager(true)}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all hover:bg-(--bg-secondary)"
            style={{
              color: "var(--text-secondary)",
              backgroundColor: "var(--bg-secondary)",
            }}
          >
            <Settings2 className="h-4 w-4" />
            Categories
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all hover:bg-(--bg-secondary)"
            style={{
              color: "var(--text-secondary)",
              backgroundColor: "var(--bg-secondary)",
            }}
          >
            <Printer className="h-4 w-4" />
            Export
          </button>
        </nav>

        {activeView === "dashboard" && (
          <div className="space-y-8 animate-fade-in">
            {/* ALL-TIME Summary Cards */}
            <section className="space-y-4">
              <h2
                className="text-xl font-medium text-(--text-primary)"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Account Summary
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <SummaryCard
                  key={`income-${unifiedEntries?.length || entries.length}-${updateTrigger}`}
                  title="Total Income"
                  amount={allTimeSummary.income}
                  icon={TrendingUp}
                  variant="income"
                />
                <SummaryCard
                  key={`expense-${unifiedEntries?.length || entries.length}-${updateTrigger}`}
                  title="Total Expenses"
                  amount={allTimeSummary.expenses}
                  icon={TrendingDown}
                  variant="expense"
                />
                <SummaryCard
                  key={`net-${unifiedEntries?.length || entries.length}-${updateTrigger}`}
                  title="Net Balance"
                  amount={allTimeSummary.net}
                  icon={Wallet}
                  variant="net"
                />
              </div>
            </section>

            {/* CTA Buttons */}
            <section className="flex gap-4">
              <Button
                onClick={() => openEntryForm("income")}
                className="flex-1 h-14 text-base font-semibold bg-(--color-lemon-green) text-white hover:bg-(--color-lemon-green)/90 squircle-md shadow-soft"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Income
              </Button>
              <Button
                onClick={() => openEntryForm("expense")}
                className="flex-1 h-14 text-base font-semibold bg-destructive text-white hover:bg-destructive/90 squircle-md shadow-soft"
              >
                <Minus className="h-5 w-5 mr-2" />
                Add Expense
              </Button>
            </section>

            {/* Progress Indicators */}
            <section className="space-y-4">
              <h2
                className="text-xl font-medium text-(--text-primary)"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Progress
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <ProgressIndicator
                  key={`week-${unifiedEntries?.length || entries.length}-${updateTrigger}`}
                  label="This Week"
                  summary={weekSummary}
                />
                <ProgressIndicator
                  key={`month-${unifiedEntries?.length || entries.length}-${updateTrigger}`}
                  label="This Month"
                  summary={monthSummary}
                />
                <ProgressIndicator
                  key={`year-${unifiedEntries?.length || entries.length}-${updateTrigger}`}
                  label="This Year"
                  summary={yearSummary}
                />
              </div>
            </section>

            {/* Recent Activity */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2
                  className="text-xl font-medium text-(--text-primary)"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Recent Entries
                </h2>
                <button
                  onClick={() => setActiveView("entries")}
                  className="text-sm hover:underline transition-all text-(--color-accent-yellow)"
                >
                  View all →
                </button>
              </div>
              <div className="rounded-2xl overflow-hidden transition-all squircle-lg">
                <RecentEntries onEdit={handleEdit} limit={5} />
              </div>
            </section>
          </div>
        )}

        {activeView === "insights" && (
          <div className="animate-fade-in">
            <InsightsCharts />
          </div>
        )}

        {activeView === "entries" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2
                className="text-xl font-medium text-(--text-primary)"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                All Transactions
              </h2>
              <div className="flex gap-3">
                <div className="text-sm px-3 py-1.5 rounded-md bg-(--bg-secondary) text-(--text-secondary)">
                  <span className="font-medium">Total: </span>
                  {unifiedEntries?.length || 0} entries
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => openEntryForm("income")}
                className="bg-(--color-lemon-green) text-white hover:bg-(--color-lemon-green)/90 squircle-md shadow-soft"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Income
              </Button>
              <Button
                onClick={() => openEntryForm("expense")}
                className="bg-destructive text-white hover:bg-destructive/90 squircle-md shadow-soft"
              >
                <Minus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </div>

            <div className="rounded-2xl border overflow-hidden bg-(--bg-primary) border-(--border-color) shadow-soft squircle-lg">
              <RecentEntries onEdit={handleEdit} />
            </div>
          </div>
        )}

        <EntryForm
          open={showEntryForm}
          onOpenChange={handleCloseEntryForm}
          defaultType={entryType}
          editEntry={editingEntry}
        />

        <CategoryManager
          open={showCategoryManager}
          onOpenChange={setShowCategoryManager}
        />
      </div>

      {/* Export Statement Modal */}
      <ExportStatementModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportPDF}
        journalType={activeJournalType}
      />
    </div>
  );
}
