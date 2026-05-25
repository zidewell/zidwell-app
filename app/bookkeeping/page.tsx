"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Wallet,
  PieChart,
  Receipt,
  FileText,
  Users,
  TrendingUp,
  Layers,
  CheckCircle2,
  Moon,
  Sun,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowUp
} from "lucide-react";
import Footer from "../components/home-component/Footer";
import { Button } from "../components/ui/button";
import { useUserContextData } from "../context/userData";

// Sample images
const heroEntrepreneur = "https://images.unsplash.com/photo-1732067606788-6b0661b7cdef?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTk4fHxidXNpbmVzcyUyMGJsYWNrJTIwbWFuJTIwZGlzY3Vzc3xlbnwwfDB8MHx8fDI%3D";
const entrepreneursUsingApp = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80";

// --- Theme Hook ---
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

function Nav() {
  const { dark, toggle } = useTheme();
 const { user } = useUserContextData();
  return (
    <header className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-xl border-b border-border-color/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm text-text-secondary">
          <a href="#how" className="hover:text-text-primary transition">How it works</a>
          <a href="#features" className="hover:text-text-primary transition">Features</a>
          <a href="#dashboard" className="hover:text-text-primary transition">Dashboard</a>
          <a href="#ai" className="hover:text-text-primary transition">AI</a>
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="border-border-color hover:bg-bg-secondary grid h-9 w-9 place-items-center rounded-full border transition-colors shrink-0"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
         
          <Button variant="zidwell-primary" asChild className="whitespace-nowrap">
            <a href="/auth/signup">
              Start Free <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-primary-mesh pointer-events-none absolute inset-0" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          <div className="lg:col-span-7 animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-bg-secondary px-3 py-1.5 text-xs font-medium text-text-primary">
              <Sparkles className="h-3.5 w-3.5 text-[#FFD700]" />
              Futuristic AI-driven bookkeeping
            </span>
            <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold tracking-tight text-text-primary leading-[1.1]">
              Bookkeeping on Steroids.
              <span className="block mt-3">
                Here your money records{" "}
                <span className="relative inline-block">
                  itself
                  <span className="absolute -bottom-2 left-0 right-0 h-2 bg-[#FFD700]/60 -z-10 rounded-full" />
                </span>{" "}
                as you spend and earn.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base sm:text-lg text-text-secondary leading-relaxed">
              Automatic bookkeeping for businesses, freelancers, creators, and everyday people.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="zidwell-primary" asChild>
                <a href="/auth/signup" className="flex items-center gap-2">
                  Start Free <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
           
            </div>
            <div className="mt-8 flex items-center gap-3 text-xs text-text-secondary">
              <CheckCircle2 className="h-4 w-4 text-[#00B64F] shrink-0" />
              <span>No spreadsheets. No accountant jargon. Just clarity.</span>
            </div>
          </div>

          <div className="lg:col-span-5 relative mt-10 lg:mt-0">
            <div className="relative h-[480px] sm:h-[520px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <PhoneMock />
              </div>
              <FloatingCard
                className="absolute top-2 -left-2 sm:-left-6 animate-float"
                title="Income · Online Sales"
                amount="+ ₦ 45,000"
                tone="leaf"
              />
              <FloatingCard
                className="absolute bottom-10 -right-2 sm:-right-6 animate-float-slow"
                title="Expense · Logistics"
                amount="- ₦ 12,400"
                tone="gold"
              />
              <FloatingCard
                className="absolute top-1/2 -right-4 sm:right-2 hidden sm:flex animate-float"
                title="Auto-categorized"
                amount="98%"
                tone="ink"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatingCard({
  className = "",
  title,
  amount,
  tone,
}: {
  className?: string;
  title: string;
  amount: string;
  tone: "leaf" | "gold" | "ink";
}) {
  const dotClass = tone === "leaf" ? "bg-[#00B64F]" : tone === "gold" ? "bg-[#FFD700]" : "bg-[#191919]";
  
  return (
    <div className={`flex items-center gap-3 squircle-sm bg-white dark:bg-[#1a1a1a] border border-[#E5E5E5] dark:border-[#333333] shadow-float px-3 py-2 sm:px-4 sm:py-3 ${className}`}>
      <span className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full shrink-0 ${dotClass}`} />
      <div className="min-w-0">
        <p className="text-[9px] sm:text-[10px] text-[#666666] dark:text-[#A0A0A0] truncate">{title}</p>
        <p className="text-xs sm:text-sm font-semibold font-display text-[#191919] dark:text-white whitespace-nowrap">{amount}</p>
      </div>
    </div>
  );
}

function SocialBar() {
  return (
    <section className="border-y border-border-color bg-bg-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-text-secondary">
          <p className="font-medium text-center sm:text-left">Built for Nigerian entrepreneurs · Lagos · Abuja · Port Harcourt · Kano</p>
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="font-display text-text-primary whitespace-nowrap">10k+ businesses</span>
            <span className="font-display text-text-primary whitespace-nowrap">₦ 2.4B+ tracked</span>
            <span className="font-display text-text-primary whitespace-nowrap">98% auto-categorized</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { you: "You Receive Money", auto: "Income logged and categorized automatically." },
    { you: "You Send Money", auto: "Expense recorded and categorized automatically." },
    { you: "You Use Invoices", auto: "Records update instantly." },
    { you: "You Use Payment Pages", auto: "Dashboard updates automatically." },
  ];
  return (
    <section id="how" className="py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl text-center sm:text-left">
          <p className="text-sm font-medium text-[#00B64F]">How it works</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-text-primary">
            You live your life. We do the books.
          </h2>
          <p className="mt-4 text-text-secondary">
            Just use the app for your transactions. Every move flows into a clean, exportable ledger — quietly, in the background.
          </p>
        </div>

        <div className="mt-12 sm:mt-14 grid gap-4 sm:grid-cols-2">
          {steps.map((s, i) => (
            <div
              key={i}
              className="squircle bg-bg-primary p-5 sm:p-6 lg:p-7 hover:bg-bg-secondary transition shadow-soft border border-border-color"
            >
              <div className="flex items-center gap-3 text-xs text-text-secondary">
                <span className="h-6 w-6 rounded-full bg-bg-secondary border border-border-color flex items-center justify-center font-medium text-text-primary">
                  {i + 1}
                </span>
                <span>Step {i + 1}</span>
              </div>
              <p className="mt-4 sm:mt-5 font-display text-xl sm:text-2xl font-semibold text-text-primary">
                {s.you}
              </p>
              <div className="mt-3 flex items-start gap-2 text-sm text-text-secondary">
                <span className="mt-2 h-px w-6 bg-[#FFD700] shrink-0" />
                <span>→ {s.auto}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 sm:mt-10 max-w-3xl text-sm text-text-secondary">
          Export your bookkeeping records the same way you export your transaction history — one tap, ready for tax.
        </p>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: Sparkles, title: "Automatic Bookkeeping", desc: "Records itself as money moves in and out." },
    { icon: Users, title: "Personal & Business Mode", desc: "Switch contexts. Keep finances separate, clean." },
    { icon: TrendingUp, title: "Money Movement Insights", desc: "Understand where your money goes — visually." },
    { icon: Receipt, title: "Expense Tracking", desc: "Every spend tagged and categorized in real time." },
    { icon: PieChart, title: "Financial Reports", desc: "Beautiful monthly and yearly summaries." },
    { icon: FileText, title: "Tax Ready Records", desc: "Export clean, audit-ready statements anytime." },
    { icon: Wallet, title: "Wallet Integration", desc: "Connects natively to your Zidwell wallet." },
  ];
  return (
    <section id="features" className="py-16 sm:py-24 lg:py-32 bg-bg-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl text-center sm:text-left">
          <p className="text-sm font-medium text-[#00B64F]">Features</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-text-primary">
            Everything you'd hire a bookkeeper for. Without the bookkeeper.
          </h2>
        </div>

        <div className="mt-12 sm:mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => {
            const Icon = it.icon;
            const featured = i === 0;
            return (
              <div
                key={i}
                className={`squircle p-5 sm:p-6 lg:p-7 border transition hover:-translate-y-0.5 shadow-soft ${
                  featured
                    ? "bg-[#191919] border-[#191919] lg:row-span-2"
                    : "bg-bg-primary border-border-color"
                }`}
              >
                <div
                  className={`h-10 w-10 sm:h-11 sm:w-11 rounded-2xl flex items-center justify-center ${
                    featured ? "bg-[#FFD700] text-[#191919]" : "bg-bg-secondary text-text-primary"
                  }`}
                >
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${featured ? "text-[#FFD700]" : "text-[#FFD700]"}`} />
                </div>
                <h3 className={`mt-4 sm:mt-5 font-display text-lg sm:text-xl font-semibold ${featured ? "text-white" : "text-text-primary"}`}>
                  {it.title}
                </h3>
                <p className={`mt-2 text-sm ${featured ? "text-white/80" : "text-text-secondary"}`}>
                  {it.desc}
                </p>
                {featured && (
                  <div className="mt-6 sm:mt-8 squircle-sm bg-white/10 border border-white/10 p-3 sm:p-4">
                    <p className="text-xs text-white/70">Live · just now</p>
                    <p className="mt-1 font-display text-base sm:text-lg text-white">
                      ₦ 45,000 income from <span className="text-[#FFD700]">Online Sales</span> auto-logged.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Categories() {
  const tags = [
    { l: "Transport", e: "🚖", c: "gold" },
    { l: "Logistics", e: "📦", c: "ink" },
    { l: "Salary", e: "💼", c: "leaf" },
    { l: "Tax", e: "🧾", c: "gold" },
    { l: "Marketing", e: "📣", c: "ink" },
    { l: "School Fees", e: "🎓", c: "leaf" },
    { l: "Freelance Income", e: "💻", c: "gold" },
    { l: "Online Sales", e: "🛍️", c: "leaf" },
    { l: "Food", e: "🍱", c: "ink" },
    { l: "Family Support", e: "🤝", c: "gold" },
    { l: "Health", e: "🩺", c: "leaf" },
    { l: "Electricity Bill", e: "💡", c: "ink" },
    { l: "Data Subscription", e: "📶", c: "gold" },
  ];

  const getTagClass = (c: string) => {
    if (c === "gold") return "bg-[#FFD700]/15 hover:bg-[#FFD700]/25 text-text-primary";
    if (c === "leaf") return "bg-[#00B64F]/10 hover:bg-[#00B64F]/20 text-text-primary";
    return "bg-bg-secondary hover:bg-bg-secondary/80 text-text-primary";
  };

  return (
    <section className="py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-medium text-[#00B64F]">Smart categories</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-text-primary">
            Every Naira finds its place.
          </h2>
          <p className="mt-4 text-text-secondary">
            Zidwell understands what real Nigerian life looks like — and tags it for you.
          </p>
        </div>

        <div className="mt-12 sm:mt-14 flex flex-wrap justify-center gap-2 sm:gap-3">
          {tags.map((t, i) => (
            <span
              key={t.l}
              className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm font-medium transition border border-border-color/60 shadow-soft ${getTagClass(t.c)} ${
                i % 3 === 0 ? "animate-float" : i % 3 === 1 ? "animate-float-slow" : ""
              }`}
              style={{ animationDelay: `${(i % 5) * 0.4}s` }}
            >
              <span className="text-sm sm:text-base">{t.e}</span>
              {t.l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// Dashboard Component with Charts
function Dashboard() {
  const months = [
    { month: "Jan", income: 4200000, expenses: 2800000, students: 1240 },
    { month: "Feb", income: 4800000, expenses: 2900000, students: 1256 },
    { month: "Mar", income: 5100000, expenses: 3100000, students: 1270 },
    { month: "Apr", income: 5300000, expenses: 3000000, students: 1282 },
    { month: "May", income: 5600000, expenses: 3200000, students: 1295 },
    { month: "Jun", income: 6840000, expenses: 3500000, students: 1310 },
  ];
  
  const maxIncome = Math.max(...months.map(m => m.income));
  const maxExpense = Math.max(...months.map(m => m.expenses));
  const maxValue = Math.max(maxIncome, maxExpense);

  const feeDistribution = [
    { name: "Tuition", value: 65, color: "#FFD700" },
    { name: "Sports", value: 15, color: "#00B64F" },
    { name: "Library", value: 10, color: "#E6A800" },
    { name: "Other", value: 10, color: "#666666" },
  ];

  return (
    <div className="squircle-lg bg-bg-primary border border-border-color shadow-soft p-4 sm:p-5 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border-color">
        <div>
          <p className="text-text-secondary text-xs">Net balance · June</p>
          <p className="font-display text-2xl sm:text-3xl font-semibold text-text-primary">₦ 6,840,000</p>
        </div>
        <div className="flex gap-2 text-[11px]">
          <span className="rounded-full bg-[#00B64F]/10 text-[#00B64F] px-2.5 sm:px-3 py-1 font-medium whitespace-nowrap">Income ₦ 6.8M</span>
          <span className="rounded-full bg-[#191919]/5 dark:bg-white/10 px-2.5 sm:px-3 py-1 font-medium text-text-secondary whitespace-nowrap">Expense ₦ 3.5M</span>
        </div>
      </div>

      <div className="mt-5 sm:mt-6 grid gap-5 sm:gap-6 lg:grid-cols-3">
        {/* Bar Chart */}
        <div className="lg:col-span-2 squircle-sm bg-bg-secondary p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <p className="text-sm font-medium text-text-primary">Income vs Expenses</p>
            <p className="text-[10px] sm:text-[11px] text-text-secondary">Last 6 months</p>
          </div>
          <div className="flex items-end gap-1 sm:gap-2 h-48 sm:h-56">
            {months.map((item) => (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-1 sm:gap-2">
                <div className="flex gap-0.5 sm:gap-1 w-full justify-center">
                  <div
                    className="w-2 sm:w-3 rounded-t-md bg-[#00B64F] transition-all duration-500"
                    style={{ height: `${(item.income / maxValue) * 100}%` }}
                  />
                  <div
                    className="w-2 sm:w-3 rounded-t-md bg-[#FFD700] transition-all duration-500"
                    style={{ height: `${(item.expenses / maxValue) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] sm:text-[10px] text-text-secondary">{item.month}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-3 sm:gap-4 mt-4 pt-3 border-t border-border-color">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-[#00B64F]" />
              <span className="text-[9px] sm:text-[10px] text-text-secondary">Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-[#FFD700]" />
              <span className="text-[9px] sm:text-[10px] text-text-secondary">Expenses</span>
            </div>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="squircle-sm bg-bg-secondary p-4 sm:p-5">
          <p className="text-sm font-medium text-text-primary mb-3">Spending breakdown</p>
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 sm:w-36 sm:h-36">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  let currentAngle = 0;
                  return feeDistribution.map((item, index) => {
                    const percentage = item.value;
                    const angle = (percentage / 100) * 360;
                    const startAngle = currentAngle;
                    const endAngle = currentAngle + angle;
                    currentAngle = endAngle;
                    
                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;
                    const x1 = 50 + 40 * Math.cos(startRad);
                    const y1 = 50 + 40 * Math.sin(startRad);
                    const x2 = 50 + 40 * Math.cos(endRad);
                    const y2 = 50 + 40 * Math.sin(endRad);
                    const largeArc = angle > 180 ? 1 : 0;
                    
                    return (
                      <path
                        key={index}
                        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={item.color}
                        className="transition-all duration-500 cursor-pointer hover:opacity-80"
                      />
                    );
                  });
                })()}
                <circle cx="50" cy="50" r="25" fill="var(--bg-primary)" />
              </svg>
            </div>
            <div className="mt-3 text-center">
              <p className="font-display text-xl sm:text-2xl font-semibold text-text-primary">₦ 3.5M</p>
              <p className="text-[10px] sm:text-[11px] text-text-secondary">total expenses</p>
            </div>
          </div>
          <div className="mt-4 space-y-1.5 sm:space-y-2">
            {feeDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-[10px] sm:text-[11px]">
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-text-secondary">{item.name}</span>
                </span>
                <span className="font-medium text-text-primary">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mt-5 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="squircle-sm bg-bg-secondary p-3 sm:p-4">
          <p className="text-[10px] sm:text-[11px] text-text-secondary">Monthly trend</p>
          <p className="font-display text-base sm:text-lg font-semibold text-[#00B64F]">+18.2%</p>
          <p className="text-[9px] sm:text-[10px] text-text-secondary mt-1">vs last month</p>
        </div>
        <div className="squircle-sm bg-bg-secondary p-3 sm:p-4">
          <p className="text-[10px] sm:text-[11px] text-text-secondary">Largest category</p>
          <p className="font-display text-base sm:text-lg font-semibold text-text-primary">Tuition</p>
          <p className="text-[9px] sm:text-[10px] text-text-secondary mt-1">65% of expenses</p>
        </div>
        <div className="squircle-sm bg-bg-secondary p-3 sm:p-4">
          <p className="text-[10px] sm:text-[11px] text-text-secondary">Auto-categorized</p>
          <p className="font-display text-base sm:text-lg font-semibold text-[#FFD700]">98%</p>
          <p className="text-[9px] sm:text-[10px] text-text-secondary mt-1">of transactions</p>
        </div>
      </div>
    </div>
  );
}

// PhoneMock Component
function PhoneMock() {
  const transactions = [
    { label: "Online Sales", sub: "Auto · Income", amount: "+ ₦ 45,000", up: true },
    { label: "Data Subscription", sub: "Auto · Expense", amount: "- ₦ 5,000", up: false },
    { label: "Freelance Income", sub: "Auto · Income", amount: "+ ₦ 120,000", up: true },
  ];

  return (
    <div className="relative mx-auto w-[260px] sm:w-[300px]">
      {/* Whole phone container hover scale */}
      <div className="squircle-lg bg-[#191919] p-2 sm:p-3 shadow-float transition-transform duration-300 hover:scale-105">
        <div className="squircle bg-bg-primary overflow-hidden">
          <div className="px-4 pt-4 pb-2 sm:px-5 sm:pt-5 text-white">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
              <span>9:41</span>
              <span className="font-medium">Zidwell</span>
            </div>
            <div className="mt-3 sm:mt-4">
              <p className="text-[10px] sm:text-xs text-text-secondary">Net balance</p>
              <p className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
                ₦ 1,284,500
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                {/* Stat badges with hover scale */}
                <span className="rounded-full bg-[#00B64F]/10 text-[#00B64F] text-[9px] sm:text-[10px] px-1.5 py-0.5 sm:px-2 sm:py-1 font-medium transition-all duration-200 hover:scale-110 hover:bg-[#00B64F]/20 cursor-pointer">
                  +12.4% this month
                </span>
                <span className="rounded-full bg-[#FFD700]/15 text-[#FFD700] text-[9px] sm:text-[10px] px-1.5 py-0.5 sm:px-2 sm:py-1 font-medium transition-all duration-200 hover:scale-110 hover:bg-[#FFD700]/25 cursor-pointer">
                  Auto-tracked
                </span>
              </div>
            </div>

            <div className="mt-4 sm:mt-5 grid grid-cols-2 gap-2">
              {/* Income card hover scale */}
              <div className="squircle-sm bg-bg-secondary p-2 sm:p-3 transition-all duration-300 hover:scale-105 hover:bg-bg-secondary/80 cursor-pointer">
                <p className="text-[9px] sm:text-[10px] text-text-secondary">Income</p>
                <p className="font-display text-sm sm:text-base font-semibold text-text-primary">₦ 920k</p>
              </div>
              {/* Expense card hover scale */}
              <div className="squircle-sm bg-bg-secondary p-2 sm:p-3 transition-all duration-300 hover:scale-105 hover:bg-bg-secondary/80 cursor-pointer">
                <p className="text-[9px] sm:text-[10px] text-text-secondary">Expense</p>
                <p className="font-display text-sm sm:text-base font-semibold text-text-primary">₦ 364k</p>
              </div>
            </div>

            <div className="mt-4 sm:mt-5 space-y-1.5 sm:space-y-2">
              <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-text-secondary">Today</p>
              {transactions.map((tx, idx) => (
                // Individual transaction row hover scale
                <div 
                  key={idx} 
                  className="flex items-center justify-between rounded-xl sm:rounded-2xl bg-bg-secondary px-2 py-1.5 sm:px-3 sm:py-2 transition-all duration-300 hover:scale-105 hover:bg-bg-secondary/80 cursor-pointer"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {/* Icon container hover scale */}
                    <div className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full shrink-0 transition-transform duration-200 hover:scale-110 ${
                      tx.up ? "bg-[#00B64F]/15 text-[#00B64F] hover:bg-[#00B64F]/25" : "bg-[#FFD700]/20 text-[#FFD700] hover:bg-[#FFD700]/30"
                    }`}>
                      {tx.up ? <ArrowDownLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-medium text-text-primary truncate">{tx.label}</p>
                      <p className="text-[8px] sm:text-[9px] text-text-secondary truncate">{tx.sub}</p>
                    </div>
                  </div>
                  <p className={`text-[10px] sm:text-xs font-semibold whitespace-nowrap ml-2 transition-transform duration-200 hover:scale-105 ${tx.up ? "text-[#00B64F]" : "text-[#FFD700]"}`}>
                    {tx.amount}
                  </p>
                </div>
              ))}
            </div>
          </div>
          {/* Home indicator hover scale */}
          <div className="mx-auto my-2 sm:my-3 h-1 w-16 sm:w-24 rounded-full bg-bg-secondary transition-all duration-300 hover:scale-110 hover:bg-bg-secondary/80 cursor-pointer" />
        </div>
      </div>
    </div>
  );
}

// AIChat Component
function AIChat() {
  const messages = [
    { role: "user", content: "How much did I spend on food this month?" },
    { role: "ai", content: "You spent ₦ 86,400 on food in August — 14% less than July. Want a weekly breakdown?" },
    { role: "user", content: "Show my profit for last 90 days" },
    { role: "ai", content: "Profit (Jun–Aug): ₦ 2,140,000. Top earner: Online Sales." },
  ];

  return (
    <div className="squircle-lg p-4 sm:p-5 lg:p-6 border border-white/10 bg-gradient-to-b from-neutral-800 to-neutral-900">
      <div className="space-y-2 sm:space-y-3">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl sm:rounded-3xl px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm ${
              msg.role === "user"
                ? "bg-white/10 text-white rounded-br-md"
                : "bg-[#FFD700] text-[#191919] rounded-bl-md"
            }`}>
              {msg.content.split(/(₦[\d,]+)/g).map((part, i) => 
                part.match(/₦[\d,]+/) ? (
                  <span key={i} className="font-semibold">{part}</span>
                ) : (
                  <span key={i}>{part}</span>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 sm:mt-5 flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-2 sm:px-4 sm:py-2.5">
        <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#FFD700] shrink-0" />
        <input
          disabled
          placeholder="Ask anything about your money…"
          className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder:text-white/40 outline-none"
        />
        <button className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[#FFD700] text-[#191919] flex items-center justify-center shrink-0">
          <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>
      <p className="mt-2 sm:mt-3 text-center text-[9px] sm:text-[10px] text-white/40">Preview · Available soon for all Zidwell users</p>
    </div>
  );
}

function DashboardSection() {
  return (
    <section id="dashboard" className="py-16 sm:py-24 lg:py-32 bg-bg-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5">
            <p className="text-sm font-medium text-[#00B64F]">Dashboard</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-text-primary">
              A dashboard that doesn't feel like accounting.
            </h2>
            <p className="mt-4 text-text-secondary">
              Pie charts. Income vs expenses. Net balance. Monthly trends. Real Naira figures — designed for humans, not auditors.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <img
                src={entrepreneursUsingApp}
                alt="Nigerian entrepreneurs reviewing Zidwell"
                width={1280}
                height={960}
                loading="lazy"
                className="squircle-sm w-32 sm:w-40 object-cover aspect-square"
              />
              <div>
                <p className="font-display text-sm sm:text-base font-semibold text-text-primary">Loved by founders</p>
                <p className="text-[10px] sm:text-xs text-text-secondary">From market stalls to tech studios.</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7 mt-8 lg:mt-0">
            <Dashboard />
          </div>
        </div>
      </div>
    </section>
  );
}

function AISection() {
  return (
    <section id="ai" className="py-16 sm:py-24 lg:py-32 bg-[#191919] text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: "radial-gradient(at 20% 30%, rgba(253, 192, 32, 0.2), transparent 50%), radial-gradient(at 80% 70%, rgba(0, 182, 79, 0.15), transparent 50%)",
      }} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-xs text-white">
              <Sparkles className="h-3.5 w-3.5 text-[#FFD700]" /> Coming soon
            </span>
            <h2 className="mt-4 sm:mt-5 font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white">
              Your AI finance assistant.
            </h2>
            <p className="mt-3 sm:mt-4 text-white/90 max-w-md mx-auto lg:mx-0">
              Ask your money anything. Get real answers in plain English — no spreadsheets, no formulas.
            </p>
            <ul className="mt-5 sm:mt-6 space-y-2 text-sm text-white/80 text-center lg:text-left">
              <li>· "How much did I spend on food this month?"</li>
              <li>· "Show my profit for last 90 days."</li>
              <li>· "What category takes most of my money?"</li>
            </ul>
          </div>
          <div className="lg:col-span-7 mt-8 lg:mt-0">
            <AIChat />
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section id="cta" className="py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold tracking-tight text-text-primary leading-tight">
          Move from financial chaos to{" "}
          <span className="relative inline-block">
            clarity
            <span className="absolute -bottom-2 left-0 right-0 h-2 sm:h-3 bg-[#FFD700]/60 -z-10 rounded-full" />
          </span>{" "}
          and certainty.
        </h2>
        <div className="mt-8 sm:mt-10 flex flex-wrap justify-center gap-3">
          <Button variant="zidwell-primary" size="zidwell-lg" asChild>
            <a href="#">Get Started <ArrowRight className="h-4 w-4" /></a>
          </Button>
          <Button variant="zidwell-outline" size="zidwell-lg" asChild>
            <a href="#dashboard">See Demo</a>
          </Button>
        </div>

        <div className="mt-12 flex justify-center items-center sm:mt-16 h-48 sm:h-64 lg:h-80 squircle-lg overflow-hidden">
          <Image
            src={heroEntrepreneur}
            alt="Nigerian entrepreneur using Zidwell"
            width={1280}
            height={1280}
            loading="lazy"
            className="w-full md:w-xl h-full object-cover object-center rounded-2xl"
          />
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <Nav />
      <main>
        <Hero />
        <SocialBar />
        <HowItWorks />
        <Features />
        <Categories />
        <DashboardSection />
        <AISection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}