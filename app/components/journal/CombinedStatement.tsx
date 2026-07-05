// app/components/journal/CombinedStatement.tsx

import { useMemo, useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Button } from '../ui/button';
import { useJournal } from '@/app/context/JournalContext';
import { toast } from 'sonner';

export function CombinedStatement() {
  const { unifiedEntries, activeJournalType, categories } = useJournal();
  const [isDownloading, setIsDownloading] = useState(false);
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthEntries = useMemo(
    () =>
      unifiedEntries.filter((e) => {
        if (e.journalType !== activeJournalType) return false;
        const d = parseISO(e.date);
        return d >= monthStart && d <= monthEnd;
      }),
    [unifiedEntries, activeJournalType, monthStart, monthEnd]
  );

  const inflow = monthEntries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const outflow = monthEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);

  const banks = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('zidwell_connected_banks') || '[]') as { bank: string }[];
    } catch {
      return [];
    }
  }, []);

  const formatNaira = (v: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v);

  const formatNairaNoSymbol = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(value));
  };

  const formatDateDisplay = (dateString: string) => {
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
    if (monthEntries.length === 0) {
      toast.error('No transactions found for this month');
      return;
    }

    setIsDownloading(true);

    try {
      const fromDate = format(monthStart, 'yyyy-MM-dd');
      const toDate = format(monthEnd, 'yyyy-MM-dd');

      // Sort by date (oldest first for statement)
      const sortedEntries = [...monthEntries].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Calculate totals
      const totalIncome = monthEntries
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0);

      const totalExpenses = monthEntries
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0);

      const netBalance = totalIncome - totalExpenses;
      const openingBalance = 0;

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
  <title>Combined Monthly Statement - ${format(now, 'MMMM yyyy')}</title>
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
          <h1>COMBINED MONTHLY STATEMENT</h1>
          <div class="subtitle">For the Month of ${format(now, 'MMMM yyyy')}</div>
        </div>
      </div>
      <div class="header-right">
        <div class="period">Period: <span>${formatDateDisplay(fromDate)}</span> to <span>${formatDateDisplay(toDate)}</span></div>
      </div>
    </div>

    <!-- Company Info -->
    <div class="company-info">
      <div>
        <div class="name">Zidwell Bookkeeping</div>
        <div class="details">Combined Statement - Wallet + Bank Accounts</div>
      </div>
      <div>
        <div class="details">Generated: ${format(new Date(), 'dd MMM yyyy hh:mm a')}</div>
        <div class="details">Journal: ${activeJournalType.charAt(0).toUpperCase() + activeJournalType.slice(1)}</div>
      </div>
    </div>

    <!-- Connected Accounts -->
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; padding: 12px 16px; background: #f8f6f3; border-radius: 8px;">
      <span style="font-size: 12px; font-weight: 600; color: #666666;">Accounts Included:</span>
      <span style="font-size: 12px; padding: 4px 12px; background: #FDC020; border-radius: 12px; color: #191919; font-weight: 500;">Zidwell Wallet</span>
      ${banks.map((b) => `
        <span style="font-size: 12px; padding: 4px 12px; background: #e5e5e5; border-radius: 12px; color: #191919; font-weight: 500;">${b.bank}</span>
      `).join('')}
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
          <span class="label">Opening Balance (${formatDateDisplay(fromDate)})</span>
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
          <span class="label">Closing Balance (${formatDateDisplay(toDate)})</span>
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
          <span class="label">Accounts Connected</span>
          <span class="value">${banks.length + 1}</span>
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
      link.download = `combined-statement-${format(now, 'yyyy-MM')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Combined statement downloaded! (${sortedEntries.length} transactions)`);
    } catch (error) {
      console.error('Error generating statement:', error);
      toast.error('Failed to generate statement. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="squircle-lg p-6 md:p-8 bg-card border border-border shadow-[var(--shadow-card)] relative overflow-hidden"
      style={{ backgroundImage: 'var(--gradient-card)' }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="p-3 squircle-sm bg-primary/15 text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Combined Monthly Statement
            </p>
            <h3 className="font-display text-xl font-semibold mt-0.5">{format(now, 'MMMM yyyy')}</h3>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-xs px-2 py-1 squircle-sm bg-secondary">Zidwell Wallet</span>
              {banks.map((b, i) => (
                <span key={i} className="text-xs px-2 py-1 squircle-sm bg-secondary">
                  {b.bank}
                </span>
              ))}
            </div>
          </div>
        </div>
        <Button 
          onClick={generatePDFStatement} 
          disabled={isDownloading || monthEntries.length === 0}
          className="bg-foreground text-background hover:opacity-90 font-semibold"
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-1.5" />
              Export PDF
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Inflow</p>
          <p className="font-display text-lg font-semibold text-success tabular-nums">{formatNaira(inflow)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Outflow</p>
          <p className="font-display text-lg font-semibold text-destructive tabular-nums">{formatNaira(outflow)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Net</p>
          <p className="font-display text-lg font-semibold tabular-nums">{formatNaira(inflow - outflow)}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        {monthEntries.length} transactions · {banks.length + 1} account{banks.length === 0 ? '' : 's'} included
      </p>
    </div>
  );
}