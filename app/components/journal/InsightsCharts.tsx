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
  Legend,
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
  "#eab308",
  "#f59e0b",
  "#16a34a",
  "#3b82f6",
  "#8b5cf6",
  "#e11d48",
  "#06b6d4",
  "#eab308",
];

type TimeFilter = "daily" | "weekly" | "monthly" | "yearly";

export function InsightsCharts() {
  const {
    activeJournalType,
    getCategoryBreakdown,
    getEntriesForPeriod,
    calculateSummary,
  } = useJournal();
  const [filter, setFilter] = useState<TimeFilter>("weekly");

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

  const categoryData = useMemo(() => {
    return getCategoryBreakdown(activeJournalType, start, end);
  }, [activeJournalType, start, end, getCategoryBreakdown]);

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
        <div 
          className="rounded-lg p-3 shadow-[0_12px_40px_-12px_rgba(30,10,10,0.15)]"
          style={{
            backgroundColor: '#fcfbf9',
            borderColor: '#e6dfd6'
          }}
        >
          <p className="font-medium text-sm mb-2">{label}</p>
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

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div 
        className="flex gap-2 p-1 rounded-xl w-fit"
        style={{ backgroundColor: '#f5f1ea' }}
      >
        {(["daily", "weekly", "monthly", "yearly"] as TimeFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-lg font-medium text-sm capitalize transition-all"
            )}
            style={{
              backgroundColor: filter === f ? '#fcfbf9' : 'transparent',
              color: filter === f ? '#26121c' : '#80746e',
              boxShadow: filter === f ? '0 2px 20px -4px rgba(38,33,28,0.08)' : 'none'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Expense Breakdown Pie Chart */}
        <div 
          className="p-6 rounded-2xl border shadow-[0_2px_20px_-4px_rgba(38,33,28,0.08)]"
          style={{
            backgroundColor: '#fcfbf9',
            borderColor: '#e6dfd6'
          }}
        >
          <h3 className="text-lg mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Expense Breakdown
          </h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={(props) => {
                    const name = props.name || '';
                    const percent = typeof props.percent === 'number' ? props.percent : 0;
                    return `${name} ${(percent * 100).toFixed(0)}%`;
                  }}
                  labelLine={false}
                >
                  {categoryData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center" style={{ color: '#80746e' }}>
              No expense data for this period
            </div>
          )}
        </div>

        {/* Income vs Expenses Bar Chart */}
        <div 
          className="p-6 rounded-2xl border shadow-[0_2px_20px_-4px_rgba(38,33,28,0.08)]"
          style={{
            backgroundColor: '#fcfbf9',
            borderColor: '#e6dfd6'
          }}
        >
          <h3 className="text-lg mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Income vs Expenses
          </h3>
          {incomeVsExpenseData.some((d) => d.income > 0 || d.expenses > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={incomeVsExpenseData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e6dfd6"
                />
                <XAxis
                  dataKey="name"
                  stroke="#80746e"
                  fontSize={12}
                />
                <YAxis
                  stroke="#80746e"
                  fontSize={12}
                  tickFormatter={formatCurrency}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#16a34a"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="#e11d48"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center" style={{ color: '#80746e' }}>
              No data for this period
            </div>
          )}
        </div>

        {/* Financial Trend Line Chart */}
        <div 
          className="p-6 rounded-2xl border shadow-[0_2px_20px_-4px_rgba(38,33,28,0.08)] lg:col-span-2"
          style={{
            backgroundColor: '#fcfbf9',
            borderColor: '#e6dfd6'
          }}
        >
          <h3 className="text-lg mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Financial Trend (Year)
          </h3>
          {trendData.some((d) => d.balance !== 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e6dfd6"
                />
                <XAxis
                  dataKey="name"
                  stroke="#80746e"
                  fontSize={12}
                />
                <YAxis
                  stroke="#80746e"
                  fontSize={12}
                  tickFormatter={formatCurrency}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="balance"
                  name="Running Balance"
                  stroke="#eab308"
                  strokeWidth={3}
                  dot={{ fill: "#eab308", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  name="Monthly Net"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center" style={{ color: '#80746e' }}>
              Start logging entries to see your financial trend
            </div>
          )}
        </div>
      </div>
    </div>
  );
}