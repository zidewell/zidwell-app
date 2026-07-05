// app/components/journal/MoneyFlow.tsx

import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { startOfDay, subDays, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Heart, Sparkles, Wallet, ArrowDown, ArrowUp } from 'lucide-react';
import { useJournal } from '@/app/context/JournalContext'; 
import { useTier } from '@/app/context/TierContext'; 
import { HealthScore } from './HealthScore'; 
import { InsightCard } from './InsightCard'; 
import { UpgradePrompt } from './UpgradePrompt'; 
import { cn } from '@/lib/utils';

type TimeRange = 'today' | '7d' | '30d' | '60d' | '90d' | '180d' | '365d';
type ItemFilter = 'inflow' | 'outflow' | 'data-airtime' | 'savings' | 'food' | 'transportation' | 'rent';

const TIME_OPTIONS: { id: TimeRange; label: string; days: number }[] = [
  { id: 'today', label: 'Today', days: 0 },
  { id: '7d', label: '7 days', days: 7 },
  { id: '30d', label: '30 days', days: 30 },
  { id: '60d', label: '60 days', days: 60 },
  { id: '90d', label: '90 days', days: 90 },
  { id: '180d', label: '180 days', days: 180 },
  { id: '365d', label: '365 days', days: 365 },
];

const ITEM_OPTIONS: { id: ItemFilter; label: string; icon: string }[] = [
  { id: 'inflow', label: 'Total Inflow', icon: '↓' },
  { id: 'outflow', label: 'Total Outflow', icon: '↑' },
  { id: 'data-airtime', label: 'Data & Airtime', icon: '📱' },
  { id: 'savings', label: 'Total Saved', icon: '🐷' },
  { id: 'food', label: 'Food', icon: '🍽️' },
  { id: 'transportation', label: 'Transport', icon: '🚗' },
  { id: 'rent', label: 'Rent', icon: '🏠' },
];

const CHART_COLORS = [
  'hsl(43, 98%, 56%)',
  'hsl(144, 100%, 36%)',
  'hsl(0, 0%, 20%)',
  'hsl(220, 70%, 55%)',
  'hsl(280, 60%, 55%)',
  'hsl(0, 72%, 51%)',
  'hsl(180, 60%, 45%)',
  'hsl(35, 90%, 55%)',
];

interface MoneyFlowProps {
  premium?: boolean;
}

export function MoneyFlow({ premium = false }: MoneyFlowProps) {
  const { activeJournalType, unifiedEntries, categories } = useJournal();
  const { isPremium } = useTier();
  const [time, setTime] = useState<TimeRange>('30d');
  const [item, setItem] = useState<ItemFilter>('inflow');

  const { start, end } = useMemo(() => {
    const today = new Date();
    const days = TIME_OPTIONS.find((t) => t.id === time)!.days;
    return {
      start: days === 0 ? startOfDay(today) : startOfDay(subDays(today, days)),
      end: today,
    };
  }, [time]);

  const periodEntries = useMemo(
    () =>
      unifiedEntries.filter((e) => {
        if (e.journalType !== activeJournalType) return false;
        const d = parseISO(e.date);
        return d >= start && d <= end;
      }),
    [unifiedEntries, activeJournalType, start, end]
  );

  // Previous period for delta
  const prevEntries = useMemo(() => {
    const days = TIME_OPTIONS.find((t) => t.id === time)!.days || 1;
    const prevStart = subDays(start, days);
    return unifiedEntries.filter((e) => {
      if (e.journalType !== activeJournalType) return false;
      const d = parseISO(e.date);
      return d >= prevStart && d < start;
    });
  }, [unifiedEntries, activeJournalType, start, time]);

  const { centerAmount, centerLabel, deltaPct } = useMemo(() => {
    const calc = (list: typeof periodEntries) => {
      if (item === 'inflow') return list.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
      if (item === 'outflow') return list.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
      return list.filter((e) => e.categoryId === item).reduce((s, e) => s + e.amount, 0);
    };
    const curr = calc(periodEntries);
    const prev = calc(prevEntries);
    const delta = prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;
    const label = ITEM_OPTIONS.find((i) => i.id === item)!.label;
    return { centerAmount: curr, centerLabel: label, deltaPct: delta };
  }, [periodEntries, prevEntries, item]);

  const pieData = useMemo(() => {
    const isInflowView = item === 'inflow';
    const filtered = periodEntries.filter((e) =>
      isInflowView ? e.type === 'income' : e.type === 'expense'
    );
    const breakdown: Record<string, number> = {};
    filtered.forEach((e) => {
      const cat = categories.find((c) => c.id === e.categoryId);
      const name = cat?.name ?? 'Other';
      breakdown[name] = (breakdown[name] || 0) + e.amount;
    });
    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [periodEntries, categories, item]);

  const formatNaira = (v: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v);

  // Premium insights
  const insights = useMemo(() => {
    const income = periodEntries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const expense = periodEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    const transport = periodEntries.filter((e) => e.categoryId === 'transport').reduce((s, e) => s + e.amount, 0);
    const byCategory: Record<string, number> = {};
    periodEntries
      .filter((e) => e.type === 'expense')
      .forEach((e) => {
        const cat = categories.find((c) => c.id === e.categoryId);
        const name = cat?.name ?? 'Other';
        byCategory[name] = (byCategory[name] || 0) + e.amount;
      });
    const biggest = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
    const biggestCat = biggest ? biggest[0] : null;

    const list: { icon: typeof Heart; message: string; tone: 'positive' | 'neutral' | 'warning' }[] = [];
    if (transport > 0) list.push({ 
      icon: TrendingDown, 
      message: `You spent ${formatNaira(transport)} on transport in this period.`, 
      tone: 'neutral' 
    });
    if (income > expense) list.push({ 
      icon: TrendingUp, 
      message: `Your inflow exceeded outflow by ${formatNaira(income - expense)} — great cashflow.`, 
      tone: 'positive' 
    });
    else if (expense > income) list.push({ 
      icon: TrendingDown, 
      message: `Outflow exceeded inflow by ${formatNaira(expense - income)} — consider tightening expenses.`, 
      tone: 'warning' 
    });
    if (biggestCat) list.push({ 
      icon: Wallet, 
      message: `Your biggest expense category is ${biggestCat}.`, 
      tone: 'neutral' 
    });
    if (list.length === 0) list.push({ 
      icon: Sparkles, 
      message: 'Add a few entries to unlock personalised insights.', 
      tone: 'neutral' 
    });
    return list;
  }, [periodEntries, categories]);

  const healthScore = useMemo(() => {
    const income = periodEntries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const expense = periodEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    const ratio = income === 0 ? 0 : Math.min(1, (income - expense) / income);
    const consistency = Math.min(1, periodEntries.length / 30);
    return Math.round(((ratio + 1) / 2) * 60 + consistency * 40);
  }, [periodEntries]);

  return (
    <div className="space-y-6">
      {/* Time filter */}
      <div className="flex flex-wrap gap-2">
        {TIME_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setTime(opt.id)}
            className={cn(
              'px-4 py-2 squircle-sm text-sm font-medium transition-all',
              time === opt.id
                ? 'bg-foreground text-background shadow-[var(--shadow-soft)]'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Centerpiece */}
      <div
        className="squircle-lg p-8 md:p-12 bg-card border border-border shadow-[var(--shadow-card)] relative overflow-hidden"
        style={{ backgroundImage: 'var(--gradient-card)' }}
      >
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="text-center md:text-left space-y-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{centerLabel}</p>
            <p className="font-display text-5xl md:text-6xl font-semibold tabular-nums">
              {formatNaira(centerAmount)}
            </p>
            <div
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 squircle-sm text-sm font-medium',
                deltaPct >= 0 ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
              )}
            >
              {deltaPct >= 0 ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
              {Math.abs(deltaPct).toFixed(1)}% vs previous period
            </div>
          </div>

          <div className="h-[260px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="hsl(var(--background))"
                    strokeWidth={3}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--card))',
                    }}
                    formatter={(v: number) => formatNaira(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No data for this period yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item filter */}
      <div className="flex flex-wrap gap-2">
        {ITEM_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setItem(opt.id)}
            className={cn(
              'px-4 py-2 squircle-sm text-sm font-medium transition-all inline-flex items-center gap-2',
              item === opt.id
                ? 'bg-primary text-primary-foreground shadow-[var(--shadow-premium)]'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            <span>{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Premium: Health score + insights */}
      {premium && isPremium && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1 squircle p-6 bg-card border border-border shadow-[var(--shadow-soft)] flex items-center justify-center">
            <HealthScore score={healthScore} label="Financial Health" />
          </div>
          <div className="md:col-span-2 space-y-3">
            <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Intelligent Insights
            </h3>
            <div className="space-y-3">
              {insights.map((ins, i) => (
                <InsightCard key={i} icon={ins.icon} message={ins.message} tone={ins.tone} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Free upgrade prompt */}
      {!isPremium && (
        <UpgradePrompt
          title="See your full financial picture"
          description="Connect your bank accounts to unlock health scores, AI insights, and combined statements."
        />
      )}
    </div>
  );
}