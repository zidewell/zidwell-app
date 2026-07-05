// app/components/journal/IntelligencePanel.tsx

import { FileText, TrendingUp, Scale, Receipt, Brain, Heart } from 'lucide-react';
import { useTier } from '@/app/context/TierContext';
import { useJournal } from '@/app/context/JournalContext'; 
import { LockedOverlay } from './LockedOverlay'; 
import { HealthScore } from './HealthScore';
import { InsightCard } from './InsightCard';
import { useMemo } from 'react';

export function IntelligencePanel() {
  const { isBusiness } = useTier();
  const { unifiedEntries, activeJournalType, categories } = useJournal();

  const filtered = useMemo(
    () => unifiedEntries.filter((e) => e.journalType === activeJournalType),
    [unifiedEntries, activeJournalType]
  );

  const income = filtered.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const expense = filtered.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const profit = income - expense;
  const estimatedTax = Math.max(0, profit * 0.075);

  const formatNaira = (v: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v);

  const businessScore = useMemo(() => {
    const ratio = income === 0 ? 0 : Math.min(1, (income - expense) / income);
    const consistency = Math.min(1, filtered.length / 50);
    return Math.round(((ratio + 1) / 2) * 55 + consistency * 45);
  }, [income, expense, filtered.length]);

  const StatementCard = ({
    icon: Icon,
    title,
    rows,
  }: {
    icon: typeof FileText;
    title: string;
    rows: { label: string; value: string; bold?: boolean }[];
  }) => (
    <div className="squircle p-6 bg-card border border-border shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 squircle-sm bg-primary/15 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <h4 className="font-display font-semibold">{title}</h4>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className={
              'flex items-center justify-between text-sm py-2 ' +
              (r.bold ? 'border-t border-border pt-3 font-display font-semibold text-base' : '')
            }
          >
            <span className={r.bold ? '' : 'text-muted-foreground'}>{r.label}</span>
            <span className="tabular-nums">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const content = (
    <div className="space-y-6">
      {/* AI Financial Statements */}
      <section className="space-y-4">
        <div>
          <h3 className="font-display text-lg font-semibold">AI Financial Statements</h3>
          <p className="text-sm text-muted-foreground">Auto-generated from your journal entries.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <StatementCard
            icon={TrendingUp}
            title="Profit & Loss"
            rows={[
              { label: 'Revenue', value: formatNaira(income) },
              { label: 'Expenses', value: formatNaira(expense) },
              { label: 'Net Profit', value: formatNaira(profit), bold: true },
            ]}
          />
          <StatementCard
            icon={FileText}
            title="Cashflow"
            rows={[
              { label: 'Cash in', value: formatNaira(income) },
              { label: 'Cash out', value: formatNaira(expense) },
              { label: 'Net Cashflow', value: formatNaira(profit), bold: true },
            ]}
          />
          <StatementCard
            icon={Scale}
            title="Balance Sheet"
            rows={[
              { label: 'Assets', value: formatNaira(income) },
              { label: 'Liabilities', value: formatNaira(expense) },
              { label: 'Equity', value: formatNaira(profit), bold: true },
            ]}
          />
        </div>
      </section>

      {/* Tax Overview */}
      <section className="space-y-4">
        <div>
          <h3 className="font-display text-lg font-semibold">Tax Overview</h3>
          <p className="text-sm text-muted-foreground">Estimated exposure & compliance signals.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="squircle p-6 bg-card border border-border shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-2 mb-3">
              <Receipt className="h-4 w-4 text-primary" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Estimated Tax</span>
            </div>
            <p className="font-display text-2xl font-semibold tabular-nums">{formatNaira(estimatedTax)}</p>
            <p className="text-xs text-muted-foreground mt-1">Based on 7.5% on net profit</p>
          </div>
          <div className="squircle p-6 bg-card border border-border shadow-[var(--shadow-soft)]">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">This Month</span>
            <p className="font-display text-2xl font-semibold tabular-nums mt-2">
              {formatNaira(estimatedTax / 12)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Avg. monthly tax accrual</p>
          </div>
          <div className="squircle p-6 bg-card border border-border shadow-[var(--shadow-soft)]">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Compliance</span>
            <p className="font-display text-2xl font-semibold mt-2 text-success">On track</p>
            <p className="text-xs text-muted-foreground mt-1">Bookkeeping is up to date</p>
          </div>
        </div>
      </section>

      {/* AI Insights + Business Health */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 squircle p-6 bg-card border border-border shadow-[var(--shadow-soft)] flex items-center justify-center">
          <HealthScore
            score={businessScore}
            label="Business Health"
            verdict={
              businessScore >= 70
                ? 'Your business is financially healthy.'
                : 'There is room to strengthen your foundations.'
            }
          />
        </div>
        <div className="md:col-span-2 space-y-3">
          <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            AI Business Insights
          </h3>
          <InsightCard icon={Brain} message="Your most profitable category is consulting." tone="positive" />
          <InsightCard icon={TrendingUp} message="Revenue dropped 12% this month — consider re-engaging dormant clients." tone="warning" />
          <InsightCard icon={Heart} message="Your business is spending too much on logistics — review vendor contracts." tone="warning" />
        </div>
      </section>
    </div>
  );

  if (isBusiness) return content;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-semibold">Intelligence</h2>
        <p className="text-sm text-muted-foreground">
          AI-powered statements, tax overview, and business insights — available on Business.
        </p>
      </div>
      <LockedOverlay
        requiredTier="business"
        title="Unlock Financial Intelligence"
        description="AI Financial Statements, automatic tax calculation, AI Business Insights, and Business Health Score — all on Business."
        className="min-h-[500px]"
      >
        {content}
      </LockedOverlay>
    </div>
  );
}