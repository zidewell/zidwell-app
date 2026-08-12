"use client";
import { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  parseISO,
  startOfDay,
  endOfDay,
} from "date-fns";
import { cn } from "@/lib/utils";
import { useJournal } from "@/app/context/JournalContext";

const CHART_COLORS = [
  "var(--color-accent-yellow)",
  "#f59e0b",
  "var(--color-lemon-green)",
  "#3b82f6",
  "#8b5cf6",
  "var(--destructive)",
  "#06b6d4",
  "#eab308",
  "#ec4899",
  "#10b981",
  "#6366f1",
  "#f97316",
];

type TimeFilter = "daily" | "weekly" | "monthly" | "yearly";

// Group tiny slices into "Other" to prevent legend clutter
function consolidateCategoryData(data: { name: string; value: number; category?: any }[]) {
  if (data.length <= 8) return data;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const threshold = total * 0.03; // 3% threshold

  const main = data.filter((d) => d.value >= threshold);
  const small = data.filter((d) => d.value < threshold);

  if (small.length > 0) {
    const otherValue = small.reduce((sum, d) => sum + d.value, 0);
    main.push({ name: "Other", value: otherValue, category: null });
  }

  return main;
}

export function InsightsCharts() {
  const {
    activeJournalType,
    getCategoryBreakdown,
    getEntriesForPeriod,
    calculateSummary,
  } = useJournal();
  const [filter, setFilter] = useState<TimeFilter>("weekly");
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  const getDateRange = (filterType: TimeFilter) => {
    const today = new Date();
    switch (filterType) {
      case "daily":
        return { start: startOfDay(today), end: endOfDay(today) };
      case "weekly":
        return {
          start: startOfWeek(today, { weekStartsOn: 1 }),
          end: endOfWeek(today, { weekStartsOn: 1 }),
        };
      case "monthly":
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case "yearly":
        return { start: startOfYear(today), end: endOfYear(today) };
    }
  };

  const { start, end } = getDateRange(filter);

  const rawCategoryData = useMemo(() => {
    return getCategoryBreakdown(activeJournalType, start, end);
  }, [activeJournalType, start, end, getCategoryBreakdown]);

  const categoryData = useMemo(() => {
    return consolidateCategoryData(rawCategoryData);
  }, [rawCategoryData]);

  const incomeVsExpenseData = useMemo(() => {
    const entries = getEntriesForPeriod(activeJournalType, start, end);

    let intervals: Date[];
    let formatStr: string;

    switch (filter) {
      case "daily":
        return [
          {
            name: "Today",
            income: entries
              .filter((e) => e.type === "income")
              .reduce((s, e) => s + e.amount, 0),
            expenses: entries
              .filter((e) => e.type === "expense")
              .reduce((s, e) => s + e.amount, 0),
          },
        ];
      case "weekly":
        intervals = eachDayOfInterval({ start, end });
        formatStr = "EEE";
        break;
      case "monthly":
        intervals = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
        formatStr = "'W'w";
        break;
      case "yearly":
        intervals = eachMonthOfInterval({ start, end });
        formatStr = "MMM";
        break;
    }

    return intervals.map((date) => {
      const periodStart =
        filter === "monthly"
          ? startOfWeek(date, { weekStartsOn: 1 })
          : filter === "yearly"
            ? startOfMonth(date)
            : startOfDay(date);
      const periodEnd =
        filter === "monthly"
          ? endOfWeek(date, { weekStartsOn: 1 })
          : filter === "yearly"
            ? endOfMonth(date)
            : endOfDay(date);

      const periodEntries = entries.filter((e) => {
        const entryDate = parseISO(e.date);
        return entryDate >= periodStart && entryDate <= periodEnd;
      });

      return {
        name: format(date, formatStr),
        income: periodEntries
          .filter((e) => e.type === "income")
          .reduce((s, e) => s + e.amount, 0),
        expenses: periodEntries
          .filter((e) => e.type === "expense")
          .reduce((s, e) => s + e.amount, 0),
      };
    });
  }, [activeJournalType, start, end, filter, getEntriesForPeriod]);

  const trendData = useMemo(() => {
    const entries = getEntriesForPeriod(
      activeJournalType,
      startOfYear(new Date()),
      endOfYear(new Date()),
    );
    const months = eachMonthOfInterval({
      start: startOfYear(new Date()),
      end: endOfYear(new Date()),
    });

    let runningBalance = 0;
    return months.map((month) => {
      const monthEntries = entries.filter((e) => {
        const entryDate = parseISO(e.date);
        return (
          entryDate >= startOfMonth(month) && entryDate <= endOfMonth(month)
        );
      });

      const summary = calculateSummary(monthEntries);
      runningBalance += summary.net;

      return {
        name: format(month, "MMM"),
        balance: runningBalance,
        net: summary.net,
      };
    });
  }, [activeJournalType, getEntriesForPeriod, calculateSummary]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `₦${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `₦${(value / 1000).toFixed(0)}K`;
    return `₦${value.toFixed(0)}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg p-3 shadow-pop bg-(--bg-primary) border border-(--border-color) squircle-sm">
          <p className="font-medium text-sm mb-2 text-(--text-primary)">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom legend item renderer
  const LegendItem = ({ color, name, value, percent }: any) => (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className="shrink-0 w-3 h-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-(--text-secondary) truncate">
        {name}
      </span>
      <span className="text-xs font-medium text-(--text-primary) shrink-0">
        {percent ? `${(percent * 100).toFixed(0)}%` : formatCurrency(value)}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 rounded-xl w-fit bg-(--bg-secondary) overflow-x-auto max-w-full">
        {(["daily", "weekly", "monthly", "yearly"] as TimeFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 sm:px-4 py-2 rounded-lg font-medium text-sm capitalize transition-all whitespace-nowrap",
            )}
            style={{
              backgroundColor:
                filter === f ? "var(--bg-primary)" : "transparent",
              color:
                filter === f ? "var(--text-primary)" : "var(--text-secondary)",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Expense Breakdown Pie Chart */}
        <div className="p-4 sm:p-6 rounded-2xl border bg-(--bg-primary) border-(--border-color) shadow-soft squircle-lg">
          <h3
            className="text-base md:text-lg mb-4 text-(--text-primary)"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Expense Breakdown
          </h3>
          {categoryData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Pie Chart */}
              <div className="w-full sm:w-1/2" style={{ minHeight: 220 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius="45%"
                      outerRadius="75%"
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                      onMouseLeave={() => setActivePieIndex(null)}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                          stroke="var(--bg-primary)"
                          strokeWidth={2}
                          opacity={activePieIndex === null || activePieIndex === index ? 1 : 0.5}
                          style={{ transition: "opacity 0.2s", cursor: "pointer" }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Custom Legend Grid — No More Stacking */}
              <div className="w-full sm:w-1/2 grid grid-cols-1 xs:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {categoryData.map((entry, index) => {
                  const total = categoryData.reduce((s, d) => s + d.value, 0);
                  const percent = total > 0 ? entry.value / total : 0;
                  return (
                    <LegendItem
                      key={entry.name}
                      color={CHART_COLORS[index % CHART_COLORS.length]}
                      name={entry.name}
                      value={entry.value}
                      percent={percent}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-(--text-secondary) text-sm">
              No expense data for this period
            </div>
          )}
        </div>

        {/* Income vs Expenses Bar Chart */}
        <div className="p-4 sm:p-6 rounded-2xl border bg-(--bg-primary) border-(--border-color) shadow-soft squircle-lg">
          <h3
            className="text-base md:text-lg mb-4 text-(--text-primary)"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Income vs Expenses
          </h3>
          {incomeVsExpenseData.some((d) => d.income > 0 || d.expenses > 0) ? (
            <div className="w-full" style={{ minHeight: 250 }}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={incomeVsExpenseData} barCategoryGap="20%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-color)"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-secondary)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "var(--border-color)" }}
                  />
                  <YAxis
                    stroke="var(--text-secondary)"
                    fontSize={11}
                    tickFormatter={formatCurrency}
                    tickLine={false}
                    axisLine={{ stroke: "var(--border-color)" }}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="var(--color-lemon-green)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill="var(--destructive)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-(--text-secondary) text-sm">
              No data for this period
            </div>
          )}
        </div>

        {/* Financial Trend Line Chart — Full Width */}
        <div className="p-4 sm:p-6 rounded-2xl border bg-(--bg-primary) border-(--border-color) shadow-soft squircle-lg lg:col-span-2">
          <h3
            className="text-base md:text-lg mb-4 text-(--text-primary)"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Financial Trend (Year)
          </h3>
          {trendData.some((d) => d.balance !== 0) ? (
            <div className="w-full" style={{ minHeight: 280 }}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-color)"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-secondary)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: "var(--border-color)" }}
                  />
                  <YAxis
                    stroke="var(--text-secondary)"
                    fontSize={11}
                    tickFormatter={formatCurrency}
                    tickLine={false}
                    axisLine={{ stroke: "var(--border-color)" }}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    name="Running Balance"
                    stroke="var(--color-accent-yellow)"
                    strokeWidth={3}
                    dot={{ fill: "var(--color-accent-yellow)", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    name="Monthly Net"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-(--text-secondary) text-sm">
              Start logging entries to see your financial trend
            </div>
          )}
        </div>
      </div>
    </div>
  );
}