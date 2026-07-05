// app/components/journal/BankStatementDownload.tsx

"use client";

import { useState } from 'react';
import { Download, FileText, Calendar, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useJournal } from '@/app/context/JournalContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface BankStatementDownloadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BankStatementDownload({ open, onOpenChange }: BankStatementDownloadProps) {
  const { unifiedEntries, activeJournalType, categories } = useJournal();
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [isDownloading, setIsDownloading] = useState(false);

  const formatNaira = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNairaNoSymbol = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(value));
  };

  const getToday = () => {
    return new Date().toISOString().split('T')[0];
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return 'Select date';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatDateLong = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'hh:mm a');
  };

  const getBase64Logo = async (): Promise<string> => {
    try {
      const response = await fetch("/logo.png");
      if (!response.ok) throw new Error("Logo not found");
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error loading logo:", error);
      return "";
    }
  };

  const generatePDFStatement = async () => {
    setIsDownloading(true);

    try {
      const fromDateTime = new Date(dateRange.from);
      fromDateTime.setHours(0, 0, 0, 0);

      const toDateTime = new Date(dateRange.to);
      toDateTime.setHours(23, 59, 59, 999);

      const filteredEntries = unifiedEntries.filter((entry) => {
        const entryDate = new Date(entry.date);
        const matchesDate = entryDate >= fromDateTime && entryDate <= toDateTime;
        return matchesDate && entry.journalType === activeJournalType;
      });

      if (filteredEntries.length === 0) {
        toast.error('No transactions found in the selected date range');
        setIsDownloading(false);
        return;
      }

      // Sort by date (oldest first for statement)
      const sortedEntries = [...filteredEntries].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Calculate totals
      const totalIncome = filteredEntries
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0);

      const totalExpenses = filteredEntries
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0);

      const netBalance = totalIncome - totalExpenses;
      const openingBalance = 0; // You can calculate this from previous period

      // Get logo as base64
      const logoBase64 = await getBase64Logo();

      // Build the table rows
      let runningBalance = openingBalance;
      const tableRows = sortedEntries.map((entry) => {
        const category = categories.find(c => c.id === entry.categoryId);
        const categoryName = category?.name || 'Other';
        const isIncome = entry.type === 'income';
        const amount = isIncome ? entry.amount : -entry.amount;
        runningBalance += amount;

        return `
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; font-size: 13px;">${formatDateLong(entry.date)}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; font-size: 13px;">${formatTime(entry.date)}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; font-size: 13px;">${entry.note || entry.transactionDescription || ''}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; font-size: 13px;">${entry.source === 'wallet' ? 'Wallet' : 'Manual'}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; font-size: 13px;">${categoryName}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; font-size: 13px; text-align: center;">
              <span style="background: ${isIncome ? '#e8f5e9' : '#ffebee'}; color: ${isIncome ? '#2e7d32' : '#c62828'}; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">
                ${isIncome ? 'INFLOW' : 'OUTFLOW'}
              </span>
            </td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; font-size: 13px; text-align: right; font-weight: 600; color: ${isIncome ? '#2e7d32' : '#c62828'};">
              ${formatNairaNoSymbol(entry.amount)}
            </td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; font-size: 13px; text-align: right; font-weight: 600;">
              ${formatNairaNoSymbol(runningBalance)}
            </td>
          </tr>
        `;
      });

      const logoHtml = logoBase64 
        ? `<img src="${logoBase64}" alt="Zidwell Logo" style="height: 50px; width: auto;" />`
        : `<span style="font-size: 24px; font-weight: 700; color: #FDC020;">ZIDWELL</span>`;

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bookkeeping Statement</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 40px 20px;
      color: #191919;
    }
    
    .statement-container {
      max-width: 1200px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #FDC020;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .header-left h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 28px;
      font-weight: 700;
      color: #191919;
    }
    
    .header-left .subtitle {
      color: #666666;
      font-size: 14px;
      font-weight: 400;
    }
    
    .header-right {
      text-align: right;
    }
    
    .header-right .period {
      font-size: 16px;
      font-weight: 600;
      color: #191919;
    }
    
    .header-right .period span {
      color: #FDC020;
    }
    
    .company-info {
      display: flex;
      justify-content: space-between;
      background: #f8f6f3;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    
    .company-info .name {
      font-weight: 600;
      font-size: 16px;
      color: #191919;
    }
    
    .company-info .details {
      font-size: 13px;
      color: #666666;
    }
    
    .table-wrapper {
      overflow-x: auto;
      margin-bottom: 24px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    
    thead th {
      background: #f8f6f3;
      color: #191919;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 12px 12px;
      text-align: left;
      border-bottom: 2px solid #e5e5e5;
      white-space: nowrap;
    }
    
    thead th:last-child,
    thead th:nth-last-child(2) {
      text-align: right;
    }
    
    tbody tr:hover {
      background: #faf8f6;
    }
    
    tbody tr:last-child td {
      border-bottom: none;
    }
    
    .totals-section {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      padding: 20px;
      background: #f8f6f3;
      border-radius: 12px;
      margin-top: 20px;
      margin-bottom: 24px;
    }
    
    .totals-section .total-item {
      text-align: center;
    }
    
    .totals-section .total-item .label {
      font-size: 12px;
      color: #666666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .totals-section .total-item .value {
      font-size: 20px;
      font-weight: 700;
      margin-top: 4px;
    }
    
    .totals-section .total-item .value.income {
      color: #2e7d32;
    }
    
    .totals-section .total-item .value.expense {
      color: #c62828;
    }
    
    .totals-section .total-item .value.net {
      color: #191919;
    }
    
    .legend-section {
      display: flex;
      gap: 24px;
      padding: 16px 20px;
      background: #faf8f6;
      border-radius: 12px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    
    .legend-section .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #666666;
    }
    
    .legend-section .legend-item .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    
    .legend-section .legend-item .dot.income { background: #2e7d32; }
    .legend-section .legend-item .dot.expense { background: #c62828; }
    .legend-section .legend-item .dot.transfer { background: #FDC020; }
    .legend-section .legend-item .dot.other { background: #9e9e9e; }
    
    .summary-section {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      padding: 20px;
      background: #f8f6f3;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    
    .summary-section .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e5e5;
    }
    
    .summary-section .summary-item:last-child {
      border-bottom: none;
    }
    
    .summary-section .summary-item .label {
      color: #666666;
      font-size: 14px;
    }
    
    .summary-section .summary-item .value {
      font-weight: 600;
      font-size: 14px;
    }
    
    .footer {
      text-align: center;
      color: #999999;
      font-size: 12px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      margin-top: 20px;
    }
    
    @media print {
      body { background: white; padding: 0; }
      .statement-container { box-shadow: none; border-radius: 0; padding: 20px; }
      .table-wrapper { overflow: visible; }
      tbody tr:hover { background: transparent; }
    }
    
    @media (max-width: 768px) {
      .header { flex-direction: column; align-items: flex-start; gap: 12px; }
      .header-right { text-align: left; }
      .totals-section { grid-template-columns: repeat(2, 1fr); }
      .summary-section { grid-template-columns: 1fr; }
      .company-info { flex-direction: column; gap: 8px; }
      .legend-section { gap: 12px; }
    }
  </style>
</head>
<body>
  <div class="statement-container">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        ${logoHtml}
        <div>
          <h1>BOOKKEEPING STATEMENT</h1>
          <div class="subtitle">For the Period ${formatDateDisplay(dateRange.from)} - ${formatDateDisplay(dateRange.to)}</div>
        </div>
      </div>
      <div class="header-right">
        <div class="period">Period: <span>${formatDateDisplay(dateRange.from)}</span> to <span>${formatDateDisplay(dateRange.to)}</span></div>
      </div>
    </div>

    <!-- Company Info -->
    <div class="company-info">
      <div>
        <div class="name">Zidwell Bookkeeping</div>
        <div class="details">Your Financial Records</div>
      </div>
      <div>
        <div class="details">Generated: ${format(new Date(), 'dd MMM yyyy hh:mm a')}</div>
        <div class="details">Journal: ${activeJournalType.charAt(0).toUpperCase() + activeJournalType.slice(1)}</div>
      </div>
    </div>

    <!-- Transactions Table -->
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Description / Narration</th>
            <th>From / To</th>
            <th>Category</th>
            <th style="text-align: center;">Type</th>
            <th style="text-align: right;">Amount (NGN)</th>
            <th style="text-align: right;">Balance (NGN)</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="totals-section">
      <div class="total-item">
        <div class="label">Total Inflow</div>
        <div class="value income">₦${formatNairaNoSymbol(totalIncome)}</div>
      </div>
      <div class="total-item">
        <div class="label">Total Outflow</div>
        <div class="value expense">₦${formatNairaNoSymbol(totalExpenses)}</div>
      </div>
      <div class="total-item">
        <div class="label">Net Balance</div>
        <div class="value net">₦${formatNairaNoSymbol(netBalance)}</div>
      </div>
      <div class="total-item">
        <div class="label">Total Transactions</div>
        <div class="value net">${sortedEntries.length}</div>
      </div>
    </div>

    <!-- Legend -->
    <div class="legend-section">
      <div class="legend-item">
        <span class="dot income"></span> Income
      </div>
      <div class="legend-item">
        <span class="dot expense"></span> Expenses
      </div>
      <div class="legend-item">
        <span class="dot transfer"></span> Transfers
      </div>
      <div class="legend-item">
        <span class="dot other"></span> Others
      </div>
    </div>

    <!-- Summary -->
    <div class="summary-section">
      <div>
        <div class="summary-item">
          <span class="label">Opening Balance (${formatDateDisplay(dateRange.from)})</span>
          <span class="value">₦${formatNairaNoSymbol(openingBalance)}</span>
        </div>
        <div class="summary-item">
          <span class="label">Total Inflows</span>
          <span class="value" style="color: #2e7d32;">₦${formatNairaNoSymbol(totalIncome)}</span>
        </div>
        <div class="summary-item">
          <span class="label">Total Outflows</span>
          <span class="value" style="color: #c62828;">₦${formatNairaNoSymbol(totalExpenses)}</span>
        </div>
        <div class="summary-item" style="font-weight: 700; border-top: 2px solid #191919; padding-top: 12px;">
          <span class="label">Closing Balance (${formatDateDisplay(dateRange.to)})</span>
          <span class="value" style="color: #FDC020;">₦${formatNairaNoSymbol(netBalance)}</span>
        </div>
      </div>
      <div>
        <div class="summary-item">
          <span class="label">Total Income Categories</span>
          <span class="value">${categories.filter(c => c.type === 'income' || c.type === 'both').length}</span>
        </div>
        <div class="summary-item">
          <span class="label">Total Expense Categories</span>
          <span class="value">${categories.filter(c => c.type === 'expense' || c.type === 'both').length}</span>
        </div>
        <div class="summary-item">
          <span class="label">Average Transaction Value</span>
          <span class="value">₦${formatNairaNoSymbol(sortedEntries.length > 0 ? (totalIncome + totalExpenses) / sortedEntries.length : 0)}</span>
        </div>
        <div class="summary-item">
          <span class="label">Statement Generated</span>
          <span class="value">${format(new Date(), 'dd MMM yyyy')}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      This statement is computer generated and does not require a signature.<br>
      © ${new Date().getFullYear()} Zidwell. All rights reserved.
    </div>
  </div>
</body>
</html>`;

      // Call the PDF generation API
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: htmlContent }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Convert response to blob and download
      const pdfBlob = await response.blob();
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bookkeeping-statement-${activeJournalType}-${dateRange.from}-${dateRange.to}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Statement downloaded! (${sortedEntries.length} transactions)`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating statement:', error);
      toast.error('Failed to generate statement. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-(--bg-primary) border-(--border-color)">
        <DialogHeader>
          <DialogTitle className="text-xl text-(--text-primary) font-display">
            Download Bookkeeping Statement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="p-4 rounded-xl bg-(--bg-secondary) border border-(--border-color)">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-(--bg-primary)">
                <FileText className="h-5 w-5 text-(--color-accent-yellow)" />
              </div>
              <div>
                <p className="text-sm font-medium text-(--text-primary)">
                  Professional PDF Statement
                </p>
                <p className="text-xs text-(--text-secondary)">
                  Download a professional bookkeeping statement with all your transactions
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-(--text-secondary) block mb-1">
                From Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-(--text-secondary)" />
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
                  max={dateRange.to || getToday()}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-(--text-secondary) block mb-1">
                To Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-(--text-secondary)" />
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-(--border-color) bg-(--bg-primary) text-(--text-primary) focus:ring-(--color-accent-yellow) focus:border-(--color-accent-yellow)"
                  min={dateRange.from}
                  max={getToday()}
                />
              </div>
            </div>
          </div>

          {/* Quick Range Buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Last 7 days', days: 7 },
              { label: 'Last 30 days', days: 30 },
              { label: 'Last 3 months', days: 90 },
              { label: 'Last 6 months', days: 180 },
              { label: 'Last 12 months', days: 365 },
            ].map(({ label, days }) => (
              <Button
                key={label}
                variant="outline"
                size="sm"
                onClick={() => {
                  const to = getToday();
                  const fromDate = new Date();
                  fromDate.setDate(fromDate.getDate() - days);
                  const from = fromDate.toISOString().split('T')[0];
                  setDateRange({ from, to });
                }}
                className="border-(--border-color) text-(--text-secondary) hover:bg-(--bg-secondary)"
              >
                {label}
              </Button>
            ))}
          </div>

          {/* Summary Preview */}
          {dateRange.from && dateRange.to && (
            <div className="p-3 rounded-lg bg-(--bg-secondary) border border-(--border-color)">
              <p className="text-sm text-(--text-primary)">
                Selected: {formatDateDisplay(dateRange.from)} to {formatDateDisplay(dateRange.to)}
              </p>
              <p className="text-xs text-(--text-secondary) mt-1">
                Journal: {activeJournalType.charAt(0).toUpperCase() + activeJournalType.slice(1)}
              </p>
              <div className="mt-2 flex gap-4 text-xs flex-wrap">
                <span className="text-success">
                  Inflow: ₦{formatNairaNoSymbol(unifiedEntries
                    .filter(e => e.journalType === activeJournalType && new Date(e.date) >= new Date(dateRange.from) && new Date(e.date) <= new Date(dateRange.to))
                    .filter(e => e.type === 'income')
                    .reduce((sum, e) => sum + e.amount, 0)
                  )}
                </span>
                <span className="text-destructive">
                  Outflow: ₦{formatNairaNoSymbol(unifiedEntries
                    .filter(e => e.journalType === activeJournalType && new Date(e.date) >= new Date(dateRange.from) && new Date(e.date) <= new Date(dateRange.to))
                    .filter(e => e.type === 'expense')
                    .reduce((sum, e) => sum + e.amount, 0)
                  )}
                </span>
                <span className="text-(--color-accent-yellow) font-semibold">
                  Net: ₦{formatNairaNoSymbol(unifiedEntries
                    .filter(e => e.journalType === activeJournalType && new Date(e.date) >= new Date(dateRange.from) && new Date(e.date) <= new Date(dateRange.to))
                    .reduce((sum, e) => sum + (e.type === 'income' ? e.amount : -e.amount), 0)
                  )}
                </span>
              </div>
            </div>
          )}

          <Button
            onClick={generatePDFStatement}
            disabled={isDownloading || !dateRange.from || !dateRange.to}
            className="w-full bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 font-semibold h-12"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Statement...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download PDF Statement
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}