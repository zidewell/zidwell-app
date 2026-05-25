// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Moon,
  Sun,
  RefreshCw,
  CalendarRange,
  LineChart,
  BookOpen,
  Users,
  Check,
  X,
  Wallet,
  TrendingUp,
  GraduationCap,
  Instagram,
  Facebook,
  Linkedin,
  Music2,
  Sparkles,
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Footer from "../components/home-component/Footer";
import Link from "next/link";
import { useUserContextData } from "../context/userData";

const adminStressed =
  "https://images.unsplash.com/photo-1758876201933-ff3b3484d810?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fHN0cmVzcyUyMG9mZmljZSUyMGJsYWNrJTIwd29tYW58ZW58MHx8MHx8fDA%3D";
const adminRelaxed =
  "https://images.unsplash.com/photo-1758876202189-0fbc277dfed9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8c3RyZXNzJTIwb2ZmaWNlJTIwYmxhY2slMjB3b21hbnxlbnwwfHwwfHx8MA%3D%3D";
const monthlyData = [
  { month: "Jan", income: 4200000, expenses: 2800000, students: 1240 },
  { month: "Feb", income: 4800000, expenses: 2900000, students: 1256 },
  { month: "Mar", income: 5100000, expenses: 3100000, students: 1270 },
  { month: "Apr", income: 5300000, expenses: 3000000, students: 1282 },
  { month: "May", income: 5600000, expenses: 3200000, students: 1295 },
  { month: "Jun", income: 6840000, expenses: 3500000, students: 1310 },
];

const feeDistribution = [
  { name: "Tuition", value: 65, color: "#FDC020" },
  { name: "Sports", value: 15, color: "#00B64F" },
  { name: "Library", value: 10, color: "#E6A800" },
  { name: "Other", value: 10, color: "#666666" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-primary border-border-color rounded-[16px] border p-3 shadow-soft">
        <p className="text-text-secondary text-xs font-medium">{label}</p>
        <p className="text-primary-custom mt-1 text-sm font-semibold">
          ₦{(payload[0].value / 1000000).toFixed(1)}M
        </p>
        <p className="text-text-secondary text-[10px]">
          Students: {payload[0].payload.students}
        </p>
      </div>
    );
  }
  return null;
};

function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}

function Logo() {
  const { user } = useUserContextData();
  return (
    <Link
      href={user ? "/dashboard" : "/"}
      className="flex items-center gap-2 group"
    >
      <Image
        src="/logo.png"
        alt="Zidwell Logo"
        width={49}
        height={40}
        className="w-10 object-contain transition-transform group-hover:scale-105"
      />
      <span className="text-xl font-bold tracking-tight text-(--text-primary) uppercase">
        Zidwell
      </span>
    </Link>
  );
}

function Nav() {
  const { dark, toggle } = useTheme();

  return (
    <header className="bg-bg-primary/80 sticky top-0 z-40 border-b border-border-color/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Logo />
        <nav className="text-text-secondary hidden items-center gap-8 text-sm md:flex">
          <a
            href="#features"
            className="hover:text-text-primary transition-colors"
          >
            Features
          </a>
          <a
            href="#dashboard"
            className="hover:text-text-primary transition-colors"
          >
            Dashboard
          </a>
          <a
            href="#plans"
            className="hover:text-text-primary transition-colors"
          >
            Payment plans
          </a>
          <a
            href="#compare"
            className="hover:text-text-primary transition-colors"
          >
            Why Zidwell
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="border-border-color hover:bg-bg-secondary grid h-9 w-9 place-items-center rounded-[20px] border transition-colors"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Link
            href="/auth/signup"
            className="btn-zidwell-primary inline-flex items-center gap-1 text-sm"
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-primary-mesh pointer-events-none absolute inset-0" />

      <div className="mx-auto max-w-7xl px-6 pb-20 pt-16 md:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="bg-bg-primary/60 border-border-color mx-auto inline-flex items-center gap-2 rounded-[20px] border px-3 py-1 text-xs text-text-secondary backdrop-blur">
            <span className="bg-primary-custom h-1.5 w-1.5 rounded-full" />
            Built for Nigerian schools
          </div>
          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            School fees collection,
            <br />
            <span className="relative inline-block">
              made simple
              <span className="bg-primary-custom absolute -bottom-2 left-0 h-1.5 w-full rounded-full" />
            </span>
            .
          </h1>
          <p className="text-text-secondary mx-auto mt-8 max-w-2xl text-base leading-relaxed md:text-lg">
            Create flexible payment plans for parents, retire manual
            reconciliations, and bring financial clarity to every student record
            — all in one quiet, premium dashboard.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/auth/signup"
              className="btn-zidwell-primary inline-flex items-center gap-1.5"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="text-text-secondary mt-4 text-xs">
            No card required • Setup in under an hour
          </p>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto mt-20 max-w-5xl">
      <div className="border-border-color bg-bg-primary absolute -left-6 top-10 hidden w-56 rotate-[-4deg] rounded-[20px] border p-4 shadow-soft md:block">
        <div className="flex items-center gap-3">
          <div className="bg-primary-light-bg flex h-9 w-9 items-center justify-center rounded-full">
            <Wallet className="text-primary-custom h-4 w-4" />
          </div>
          <div>
            <p className="text-text-secondary text-xs">Payment received</p>
            <p className="font-display text-sm font-semibold">₦100,000.00</p>
          </div>
        </div>
        <p className="text-text-secondary mt-3 text-[10px]">
          Adaeze O. • Term 2 instalment
        </p>
      </div>

      <div className="border-border-color bg-bg-primary absolute -right-6 top-32 hidden w-60 rotate-[5deg] rounded-[20px] border p-4 shadow-soft md:block">
        <div className="flex items-center justify-between">
          <p className="text-text-secondary text-xs">Reconciled today</p>
          <span className="bg-primary-light-bg text-primary-custom rounded-[16px] px-2 py-0.5 text-[10px] font-medium">
            Auto
          </span>
        </div>
        <p className="mt-2 font-display text-xl font-semibold">142 / 142</p>
        <div className="bg-bg-secondary mt-2 h-1.5 w-full overflow-hidden rounded-full">
          <div className="bg-primary-custom h-full w-full" />
        </div>
      </div>

      <DashboardMock />
    </div>
  );
}

function DashboardMock() {
  return (
    <div className="border-border-color bg-bg-primary rounded-[28px] border p-2 shadow-pop">
      <div className="border-border-color bg-bg-primary rounded-[20px] border">
        <div className="border-border-color flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-1.5">
            <span className="bg-muted h-2.5 w-2.5 rounded-full" />
            <span className="bg-muted h-2.5 w-2.5 rounded-full" />
            <span className="bg-muted h-2.5 w-2.5 rounded-full" />
          </div>
          <p className="text-text-secondary text-xs">
            app.zidwell.com / overview
          </p>
          <div className="bg-muted h-5 w-16 rounded" />
        </div>
        <div className="grid grid-cols-12 gap-0">
          <aside className="border-border-color col-span-3 hidden border-r p-4 md:block">
            <div className="space-y-1">
              {[
                ["Overview", true],
                ["Students", false],
                ["Fees", false],
                ["Payments", false],
                ["Reports", false],
                ["Bookkeeping", false],
              ].map(([label, active]) => (
                <div
                  key={label as string}
                  className={`flex items-center justify-between rounded-[16px] px-3 py-2 text-xs ${
                    active
                      ? "bg-bg-secondary font-medium"
                      : "text-text-secondary"
                  }`}
                >
                  <span>{label}</span>
                  {active && (
                    <span className="bg-primary-custom h-1.5 w-1.5 rounded-full" />
                  )}
                </div>
              ))}
            </div>
          </aside>
          <div className="col-span-12 space-y-5 p-5 md:col-span-9">
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Fees collected" value="₦42.8M" trend="+12.4%" />
              <Stat label="Outstanding" value="₦6.2M" trend="-8.1%" muted />
              <Stat label="Active students" value="1,284" trend="+34" />
            </div>
            <div className="border-border-color rounded-[20px] border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Income summary</p>
                <p className="text-text-secondary text-[10px]">Last 6 months</p>
              </div>
              <div className="mt-4 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient
                        id="colorIncome"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#FDC020"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#FDC020"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-color)"
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
                      axisLine={{ stroke: "var(--border-color)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
                      axisLine={{ stroke: "var(--border-color)" }}
                      tickFormatter={(value) => `₦${value / 1000000}M`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#FDC020"
                      strokeWidth={2}
                      fill="url(#colorIncome)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="border-border-color rounded-[20px] border">
              <div className="border-border-color flex items-center justify-between border-b px-4 py-2.5">
                <p className="text-sm font-medium">Recent transactions</p>
                <p className="text-text-secondary text-[10px]">
                  Auto-reconciled
                </p>
              </div>
              <div className="divide-border-color divide-y">
                {[
                  ["Chiamaka Eze", "JSS 2 • Term 2", "₦150,000"],
                  ["Tunde Bakare", "SS 1 • Instalment 2/3", "₦100,000"],
                  ["Halima Yusuf", "Primary 4 • Full", "₦220,000"],
                ].map(([name, meta, amt]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between px-4 py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="bg-primary-light-bg h-6 w-6 rounded-full" />
                      <div>
                        <p className="font-medium">{name}</p>
                        <p className="text-text-secondary text-[10px]">
                          {meta}
                        </p>
                      </div>
                    </div>
                    <p className="font-display font-semibold">{amt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  trend,
  muted,
}: {
  label: string;
  value: string;
  trend: string;
  muted?: boolean;
}) {
  return (
    <div className="border-border-color rounded-[20px] border p-3">
      <p className="text-text-secondary text-[10px] uppercase tracking-wider">
        {label}
      </p>
      <p className="mt-1 font-display text-lg font-semibold">{value}</p>
      <p
        className={`text-[10px] ${muted ? "text-text-secondary" : "text-primary-custom"}`}
      >
        {trend}
      </p>
    </div>
  );
}

function Features() {
  const items = [
    {
      icon: RefreshCw,
      title: "Automatic reconciliation",
      desc: "Every payment matches the right student instantly — no spreadsheets, no second-guessing.",
    },
    {
      icon: CalendarRange,
      title: "Flexible payment plans",
      desc: "Split fees into instalments that work for parents while keeping the school on track.",
    },
    {
      icon: LineChart,
      title: "Financial dashboard",
      desc: "A live picture of collections, outstanding balances and income trends.",
    },
    {
      icon: BookOpen,
      title: "Bookkeeping automation",
      desc: "Receipts, ledgers and reports written in the background while you run the school.",
    },
    {
      icon: Users,
      title: "Parent-friendly payments",
      desc: "Parents pay in seconds with card, transfer or USSD — and get instant confirmation.",
    },
    {
      icon: Sparkles,
      title: "Clarity by default",
      desc: "Every number traceable to a student, a term and a moment in time.",
    },
  ];

  return (
    <section
      id="features"
      className="border-border-color bg-bg-primary border-t"
    >
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <p className="text-primary-custom text-xs font-medium uppercase tracking-widest">
            Features
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
            Quiet software for a noisy bursary.
          </h2>
          <p className="text-text-secondary mt-4">
            Zidwell handles the repetitive parts of school finance so
            administrators can spend their day on actual education.
          </p>
        </div>
        <div className="border-border-color bg-border-color mt-14 grid gap-px overflow-hidden rounded-[28px] border md:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-bg-primary hover:bg-bg-secondary group p-7 transition-colors"
            >
              <div className="border-border-color bg-bg-primary flex h-10 w-10 items-center justify-center rounded-[16px] border">
                <Icon className="text-primary-custom h-4 w-4" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">
                {title}
              </h3>
              <p className="text-text-secondary mt-2 text-sm leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PaymentPlan() {
  return (
    <section
      id="plans"
      className="border-border-color bg-bg-secondary/40 border-t"
    >
      <div className="mx-auto grid max-w-7xl gap-16 px-6 py-24 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-primary-custom text-xs font-medium uppercase tracking-widest">
            Payment plans
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
            ₦300,000 fees,
            <br /> split into three calm payments.
          </h2>
          <p className="text-text-secondary mt-5 max-w-md">
            Give parents room to breathe without losing visibility. Zidwell
            schedules, reminds and reconciles each instalment for you.
          </p>
          <div className="mt-8 flex items-center gap-6 text-sm">
            <div>
              <p className="font-display text-2xl font-semibold">98%</p>
              <p className="text-text-secondary text-xs">on-time rate</p>
            </div>
            <div className="bg-border-color h-8 w-px" />
            <div>
              <p className="font-display text-2xl font-semibold">3 min</p>
              <p className="text-text-secondary text-xs">to set up a plan</p>
            </div>
          </div>
        </div>

        <div className="border-border-color bg-bg-primary rounded-[28px] border p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-xs">Total fees · Term 2</p>
              <p className="font-display text-3xl font-semibold">₦300,000</p>
            </div>
            <div className="bg-primary-light-bg text-primary-custom rounded-[16px] px-3 py-1 text-xs font-medium">
              3 instalments
            </div>
          </div>
          <div className="bg-bg-secondary mt-6 h-2 w-full overflow-hidden rounded-full">
            <div className="bg-primary-custom h-full w-2/3 rounded-full" />
          </div>
          <p className="text-text-secondary mt-2 text-xs">
            ₦200,000 paid · ₦100,000 remaining
          </p>

          <div className="mt-6 space-y-3">
            {[
              {
                label: "Instalment 1",
                date: "Sep 5",
                amt: "₦100,000",
                status: "Paid",
              },
              {
                label: "Instalment 2",
                date: "Oct 5",
                amt: "₦100,000",
                status: "Paid",
              },
              {
                label: "Instalment 3",
                date: "Nov 5",
                amt: "₦100,000",
                status: "Upcoming",
              },
            ].map((i) => (
              <div
                key={i.label}
                className="border-border-color rounded-[20px] border p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        i.status === "Paid"
                          ? "bg-primary-custom text-ink"
                          : "border-border-color border"
                      }`}
                    >
                      {i.status === "Paid" ? (
                        <Check className="text-ink h-4 w-4" />
                      ) : (
                        <span className="text-text-secondary text-xs">3</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{i.label}</p>
                      <p className="text-text-secondary text-xs">{i.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-sm font-semibold">
                      {i.amt}
                    </p>
                    <p
                      className={`text-[10px] ${
                        i.status === "Paid"
                          ? "text-primary-custom"
                          : "text-text-secondary"
                      }`}
                    >
                      {i.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardSection() {
  return (
    <section
      id="dashboard"
      className="border-border-color bg-bg-primary border-t"
    >
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-primary-custom text-xs font-medium uppercase tracking-widest">
            Dashboard
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
            One place for every naira.
          </h2>
          <p className="text-text-secondary mt-4">
            Fees collected, outstanding balances, student records, financial
            reports and income summaries — composed into a single, premium view.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-12">
          {/* Income Trend Chart */}
          <div className="border-border-color bg-bg-primary rounded-[20px] border p-6 lg:col-span-7 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium">Income trend</p>
                <p className="text-text-secondary text-[10px] mt-1">
                  Last 6 months
                </p>
              </div>
              <div className="flex gap-2 text-[10px]">
                <span className="bg-primary-custom text-ink rounded-[16px] px-3 py-1.5 font-medium shadow-sm">
                  Revenue
                </span>
                <span className="border-border-color text-text-secondary rounded-[16px] border px-3 py-1.5 transition-colors hover:border-primary-custom/50">
                  Students
                </span>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-color)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                    axisLine={{ stroke: "var(--border-color)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
                    axisLine={{ stroke: "var(--border-color)" }}
                    tickLine={false}
                    tickFormatter={(value) => `₦${value / 1000000}M`}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "var(--bg-secondary)", opacity: 0.5 }}
                  />
                  <Bar
                    dataKey="income"
                    fill="#FDC020"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={60}
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Side Cards */}
          <div className="space-y-6 lg:col-span-5">
            <MiniCard
              icon={TrendingUp}
              title="Total Revenue"
              value="₦68.4M"
              sub="+18.2% vs last term"
            />
            <MiniCard
              icon={Wallet}
              title="Collection Rate"
              value="87.2%"
              sub="↑ 5.3% from last term"
            />

            {/* Fee Distribution Chart */}
            <div className="border-border-color bg-bg-primary rounded-[20px] border p-5 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium">Fee Distribution</p>
                <div className="flex flex-wrap gap-2">
                  {feeDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div
                        className="h-2.5 w-2.5 rounded-full shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-text-secondary text-[9px] font-medium">
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={feeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                      animationDuration={1500}
                      animationEasing="ease-in-out"
                    >
                      {feeDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="var(--bg-primary)"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `${value}%`}
                      contentStyle={{
                        backgroundColor: "var(--bg-primary)",
                        borderColor: "var(--border-color)",
                        borderRadius: "12px",
                        padding: "8px 12px",
                        fontSize: "12px",
                        color: "var(--text-primary)",
                      }}
                      itemStyle={{ color: "var(--text-primary)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 pt-3 border-t border-border-color text-center">
                <p className="text-text-secondary text-[10px]">
                  Based on current term fee structure
                </p>
              </div>
            </div>
          </div>

          {/* Student Records Table */}
          <div className="border-border-color bg-bg-primary rounded-[20px] border p-6 lg:col-span-12 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium">Student records</p>
                <p className="text-text-secondary text-[10px] mt-0.5">
                  Real-time fee tracking
                </p>
              </div>
              <a
                className="text-text-secondary hover:text-primary-custom text-xs transition-all duration-200 flex items-center gap-1 hover:gap-2"
                href="#"
              >
                View all students <ArrowRight className="h-3 w-3" />
              </a>
            </div>
            <div className="border-border-color overflow-x-auto rounded-[16px] border">
              <table className="w-full text-left text-sm">
                <thead className="bg-bg-secondary/50 text-text-secondary text-xs">
                  <tr className="border-b border-border-color">
                    <th className="px-4 py-3 font-semibold">Student</th>
                    <th className="px-4 py-3 font-semibold">Class</th>
                    <th className="px-4 py-3 font-semibold">Plan</th>
                    <th className="px-4 py-3 font-semibold">Balance</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color">
                  {[
                    ["Chiamaka Eze", "JSS 2", "3 instalments", "₦0", "Settled"],
                    [
                      "Tunde Bakare",
                      "SS 1",
                      "3 instalments",
                      "₦100,000",
                      "On track",
                    ],
                    [
                      "Halima Yusuf",
                      "Primary 4",
                      "Full payment",
                      "₦0",
                      "Settled",
                    ],
                    [
                      "Oluwaseun A.",
                      "JSS 3",
                      "2 instalments",
                      "₦80,000",
                      "Due soon",
                    ],
                    [
                      "Adaeze Okonkwo",
                      "SS 2",
                      "4 instalments",
                      "₦150,000",
                      "Pending",
                    ],
                    [
                      "Emeka Okafor",
                      "JSS 1",
                      "3 instalments",
                      "₦50,000",
                      "Partially paid",
                    ],
                  ].map((row, idx) => (
                    <tr
                      key={row[0]}
                      className="hover:bg-bg-secondary/30 transition-colors duration-150"
                    >
                      {row.map((c, i) => (
                        <td key={i} className="px-4 py-3 text-sm">
                          {i === 4 ? (
                            <span
                              className={`inline-flex rounded-[12px] px-2.5 py-1 text-[10px] font-medium ${
                                c === "Settled"
                                  ? "bg-primary-light-bg text-primary-custom"
                                  : c === "On track"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : c === "Due soon"
                                      ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              }`}
                            >
                              {c}
                            </span>
                          ) : (
                            <span className="text-text-primary">{c}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between text-text-secondary text-[10px]">
              <p>Showing 6 of 1,284 students</p>
              <div className="flex gap-2">
                <button className="hover:text-primary-custom transition-colors px-2 py-1 rounded-lg hover:bg-bg-secondary">
                  Previous
                </button>
                <button className="bg-primary-custom text-ink px-3 py-1 rounded-lg font-medium">
                  1
                </button>
                <button className="hover:text-primary-custom transition-colors px-2 py-1 rounded-lg hover:bg-bg-secondary">
                  2
                </button>
                <button className="hover:text-primary-custom transition-colors px-2 py-1 rounded-lg hover:bg-bg-secondary">
                  3
                </button>
                <button className="hover:text-primary-custom transition-colors px-2 py-1 rounded-lg hover:bg-bg-secondary">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniCard({
  icon: Icon,
  title,
  value,
  sub,
}: {
  icon: any;
  title: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="border-border-color bg-bg-primary rounded-[20px] border p-5">
      <div className="flex items-center justify-between">
        <p className="text-text-secondary text-xs">{title}</p>
        <div className="bg-primary-light-bg flex h-8 w-8 items-center justify-center rounded-[16px]">
          <Icon className="text-primary-custom h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold">{value}</p>
      <p className="text-text-secondary mt-1 text-xs">{sub}</p>
    </div>
  );
}

function Compare() {
  const before = [
    "Spreadsheets that never reconcile",
    "WhatsApp payment confirmations",
    "Manual reconciliation every week",
    "Confusion at term end",
  ];
  const after = [
    "Automated, audit-ready records",
    "Instant in-app payment confirmations",
    "Reconciliation that happens by itself",
    "A clean, organised financial picture",
  ];

  return (
    <section
      id="compare"
      className="border-border-color bg-bg-primary border-t"
    >
      <div className="mx-auto max-w-5xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-primary-custom text-xs font-bold uppercase tracking-widest">
            Before / After
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
            From scattered to settled.
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {/* Before Card */}
          <div className="border-border-color bg-bg-secondary/40 overflow-hidden rounded-[28px] border transition-all duration-300 hover:shadow-lg">
            <div className="relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
              {/* Dark mode overlay for better image visibility */}
              <div className="absolute inset-0 bg-black/5 dark:bg-black/40 z-10" />
              <Image
                src={adminStressed}
                width={600}
                height={500}
                alt="Overwhelmed school administrator buried in paperwork before using Zidwell"
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105 dark:brightness-90"
                priority
              />
              <div className="bg-bg-primary/95 dark:bg-bg-primary/95 backdrop-blur-sm absolute left-4 top-4 rounded-[16px] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-primary shadow-md z-20">
                Before Zidwell
              </div>
            </div>
            <div className="p-8">
              <p className="text-text-secondary text-xs font-medium uppercase tracking-wider">
                The Old Way
              </p>
              <ul className="mt-6 space-y-4">
                {before.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm group">
                    <span className="bg-bg-secondary dark:bg-gray-800 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full transition-colors group-hover:bg-red-100 dark:group-hover:bg-red-900/30">
                      <X className="text-text-secondary group-hover:text-red-500 dark:group-hover:text-red-400 h-3 w-3 transition-colors" />
                    </span>
                    <span className="text-text-secondary line-through decoration-text-secondary/30 group-hover:decoration-text-secondary/50 transition-all dark:decoration-gray-600 dark:group-hover:decoration-gray-500">
                      {b}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* After Card */}
          <div className="bg-gradient-to-br from-foreground to-gray-800 dark:from-gray-900 dark:to-black border-foreground relative overflow-hidden rounded-[28px] border text-background shadow-xl transition-all duration-300 hover:shadow-2xl">
            <div className="relative overflow-hidden">
              {/* Gradient overlay that works in both modes */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-custom/20 to-transparent dark:from-primary-custom/30 z-10" />
              <Image
                src={adminRelaxed}
                width={600}
                height={500}
                alt="Calm, confident school administrator managing finances with Zidwell"
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105 dark:brightness-95"
                priority
              />
              <div className="bg-primary-custom text-ink absolute left-4 top-4 rounded-[16px] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider shadow-lg z-20">
                After Zidwell
              </div>
            </div>
            <div className="p-8">
              <p className="text-background/70 dark:text-white/60 text-xs font-medium uppercase tracking-wider">
                The Zidwell Way
              </p>
              <ul className="mt-6 space-y-4">
                {after.map((a) => (
                  <li key={a} className="flex items-start gap-3 text-sm group">
                    <span className="bg-primary-custom/20 dark:bg-primary-custom/30 flex h-5 w-5 items-center justify-center rounded-full transition-all group-hover:bg-primary-custom group-hover:scale-110">
                      <Check className="text-primary-custom dark:text-primary-custom group-hover:text-ink dark:group-hover:text-ink h-3 w-3 transition-colors" />
                    </span>
                    <span className="text-background dark:text-white/90 group-hover:text-white dark:group-hover:text-white transition-colors">
                      {a}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
function FinalCTA() {
  return (
    <section id="cta" className="border-border-color bg-bg-primary border-t">
      <div className="mx-auto max-w-7xl px-6 py-28">
        <div className="bg-bg-secondary/40 border-border-color relative overflow-hidden rounded-[32px] border p-12 text-center md:p-20">
          <div className="bg-primary-mesh pointer-events-none absolute inset-0" />
          <div className="relative">
            <p className="text-primary-custom text-xs font-medium uppercase tracking-widest">
              Ready when you are
            </p>
            <h2 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-bold tracking-tight md:text-6xl">
              Build a better financial system for your school.
            </h2>
            <p className="text-text-secondary mx-auto mt-6 max-w-xl">
              Join Nigerian schools using Zidwell to collect fees, automate
              bookkeeping and bring quiet order to their finances.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/auth/signup"
                className="btn-zidwell-primary inline-flex items-center gap-1.5"
              >
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <div className="bg-bg-primary text-text-primary min-h-screen">
      <Nav />
      <main>
        <Hero />
        <Features />
        <PaymentPlan />
        <DashboardSection />
        <Compare />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
