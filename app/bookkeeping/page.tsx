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
  ArrowUp,
  ShieldCheck,
  Plus,
  PiggyBank,
  Utensils,
  Bus,
  Smartphone,
  Wifi,
  Coins,
  TrendingDown,
  Tag,
  Check,
  Mic,
  Waves,
  Zap,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useUserContextData } from "../context/userData";

// Sample images
const heroEntrepreneur = "https://images.unsplash.com/photo-1732067606788-6b0661b7cdef?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTk4fHxidXNpbmVzcyUyMGJsYWNrJTIwbWFuJTIwZGlzY3Vzc3xlbnwwfDB8MHx8fDI%3D";
const entrepreneursUsingApp = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80";

// --- Theme Hook ---
function useTheme() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (stored === null && prefersDark);
    setDark(isDark);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark, mounted]);

  return { dark, toggle: () => setDark((d) => !d), mounted };
}

// --- Bank Data ---
const banks = [
  { name: "GTBank", short: "GT", color: "#e85d3a" },
  { name: "Zenith", short: "Z", color: "#cc0000" },
  { name: "Opay", short: "O", color: "#00b64f" },
  { name: "PalmPay", short: "P", color: "#7a3cf2" },
  { name: "Access", short: "A", color: "#f47b20" },
  { name: "UBA", short: "U", color: "#d4001a" },
];

// --- Plans Data ---
const plans = [
  {
    name: "Free",
    price: "₦0",
    note: "For Zidwell wallet users",
    features: [
      "Automatic bookkeeping from Zidwell wallet",
      "Manual income & expense entry",
      "Smart categorization · Money Flow",
      "Download bookkeeping statements",
    ],
    cta: "Start Free",
    featured: false,
  },
  {
    name: "Lite",
    price: "₦4,990",
    suffix: "/month",
    note: "For personal accounts",
    features: [
      "Everything in Free",
      "Connect 1 personal bank account",
      "Auto-sync external transactions",
      "Personal Money Flow analytics",
    ],
    cta: "Go Lite",
    featured: false,
  },
  {
    name: "Business",
    price: "₦9,990",
    suffix: "/month",
    note: "Connect up to 3 bank accounts",
    features: [
      "Everything in Lite",
      "Connect 3 bank accounts via Open Banking",
      "Premium analytics dashboard",
      "Financial Health Score",
      "Combined Monthly Statement",
    ],
    cta: "Go Business",
    featured: true,
  },
  {
    name: "Elite",
    price: "₦29,990",
    suffix: "/month",
    note: "Unlimited accounts · AI insights",
    features: [
      "Everything in Business",
      "Unlimited bank connections",
      "AI Business Insights",
      "Revenue & profitability analysis",
      "Priority support",
    ],
    cta: "Go Elite",
    featured: false,
  },
];

// --- Category Tags ---
const categoriesTags = [
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

// --- Time Filters ---
const timeFilters = ["Today", "7d", "30d", "60d", "90d", "180d", "365d"] as const;

// --- Money Flow Items ---
const itemFilters = [
  { key: "inflow", label: "Total Inflow", icon: ArrowDownLeft, tone: "leaf", value: "₦ 1,842,500", pct: "+12.4%", up: true },
  { key: "outflow", label: "Total Outflow", icon: ArrowUpRight, tone: "gold", value: "₦ 734,200", pct: "-4.1%", up: false },
  { key: "saved", label: "Total Saved", icon: PiggyBank, tone: "leaf", value: "₦ 1,108,300", pct: "+18.6%", up: true },
  { key: "data", label: "Data", icon: Wifi, tone: "ink", value: "₦ 28,400", pct: "3.8%", up: false },
  { key: "airtime", label: "Airtime", icon: Smartphone, tone: "ink", value: "₦ 14,900", pct: "2.0%", up: false },
  { key: "food", label: "Food", icon: Utensils, tone: "gold", value: "₦ 86,400", pct: "11.7%", up: false },
  { key: "transport", label: "Transport", icon: Bus, tone: "leaf", value: "₦ 43,000", pct: "5.8%", up: false },
  { key: "wallet", label: "Wallet Spend", icon: Wallet, tone: "ink", value: "₦ 312,000", pct: "42.4%", up: false },
] as const;

// ========== COMPONENTS ==========

function Nav() {
  const { dark, toggle, mounted } = useTheme();
  const { user } = useUserContextData();

  if (!mounted) return null;

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#191919]/80 backdrop-blur-xl border-b border-[#E5E5E5] dark:border-[#333333]/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
          <Image src="/logo.png" alt="Zidwell Logo" width={49} height={40} className="w-10 object-contain transition-transform group-hover:scale-105" />
          <span className="text-xl font-bold tracking-tight text-[#191919] dark:text-white uppercase">Zidwell</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm text-[#666666] dark:text-[#A0A0A0]">
          <a href="#how" className="hover:text-[#191919] dark:hover:text-white transition">How it works</a>
          <a href="#money-flow" className="hover:text-[#191919] dark:hover:text-white transition">Money Flow</a>
          <a href="#features" className="hover:text-[#191919] dark:hover:text-white transition">Features</a>
          <a href="#plans" className="hover:text-[#191919] dark:hover:text-white transition">Plans</a>
          <a href="#ai" className="hover:text-[#191919] dark:hover:text-white transition">AI</a>
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="border-[#E5E5E5] dark:border-[#333333] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] grid h-9 w-9 place-items-center rounded-full border transition-colors shrink-0"
          >
            {dark ? <Sun className="h-4 w-4 text-[#FDC020]" /> : <Moon className="h-4 w-4 text-[#191919]" />}
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
      <div className="absolute inset-0 bg-gradient-to-br from-[#FDC020]/5 via-transparent to-[#00B64F]/5 pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          <div className="lg:col-span-7 animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#F5F5F5] dark:bg-[#2A2A2A] px-3 py-1.5 text-xs font-medium text-[#191919] dark:text-white border border-[#E5E5E5] dark:border-[#333333]">
              <Sparkles className="h-3.5 w-3.5 text-[#FDC020]" />
              Futuristic AI-driven bookkeeping · Bank-connected
            </span>
            <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold tracking-tight text-[#191919] dark:text-white leading-[1.1]">
              Bookkeeping on{" "}
              <span className="relative inline-block">
                Steroids.
                <span className="absolute -bottom-2 left-0 right-0 h-2 bg-[#FDC020]/60 -z-10 rounded-full" />
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base sm:text-lg text-[#666666] dark:text-[#A0A0A0] leading-relaxed">
              All your bank accounts connected to one intelligent brain for Accurate bookkeeping and clear financial records.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="zidwell-primary" asChild>
                <a href="/auth/signup" className="flex items-center gap-2">
                  Start Free <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="zidwell-outline" asChild>
                <a href="#dashboard" className="flex items-center gap-2">
                  See Demo
                </a>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#666666] dark:text-[#A0A0A0]">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#00B64F]" /> Connect any Nigerian bank</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#00B64F]" /> Auto-categorized</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#00B64F]" /> Tax-ready</span>
            </div>
          </div>

          <div className="lg:col-span-5 relative mt-10 lg:mt-0">
            <div className="relative h-[480px] sm:h-[520px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <PhoneMock />
              </div>
              <FloatingCard
                className="absolute top-2 -left-2 sm:-left-6 animate-float"
                title="GTBank · Auto-synced"
                amount="+ ₦ 45,000"
                tone="leaf"
              />
              <FloatingCard
                className="absolute bottom-10 -right-2 sm:-right-6 animate-float-slow"
                title="Opay · Logistics"
                amount="- ₦ 12,400"
                tone="gold"
              />
              <FloatingCard
                className="absolute top-1/2 -right-4 sm:right-2 hidden sm:flex animate-float"
                title="3 banks connected"
                amount="Live"
                tone="ink"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatingCard({ className = "", title, amount, tone }: { className?: string; title: string; amount: string; tone: "leaf" | "gold" | "ink" }) {
  const dotClass = tone === "leaf" ? "bg-[#00B64F]" : tone === "gold" ? "bg-[#FDC020]" : "bg-[#191919] dark:bg-white";
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
    <section className="border-y border-[#E5E5E5] dark:border-[#333333] bg-[#F5F5F5] dark:bg-[#2A2A2A]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-[#666666] dark:text-[#A0A0A0]">
          <p className="font-medium text-center sm:text-left">Bookkeeping · Payments · Invoices · Receipts — one app, built for Nigeria</p>
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="font-display text-[#191919] dark:text-white whitespace-nowrap">10k+ businesses</span>
            <span className="font-display text-[#191919] dark:text-white whitespace-nowrap">₦ 2.4B+ tracked</span>
            <span className="font-display text-[#191919] dark:text-white whitespace-nowrap">All major banks</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ConnectedAccounts() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-[#00B64F]">Bank-connected · Core feature</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#191919] dark:text-white">All your bank accounts. One clean view.</h2>
            <p className="mt-4 text-[#666666] dark:text-[#A0A0A0]">Link every bank you use — personal or business — and every transaction flows into your bookkeeping automatically. This is the heart of Zidwell.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-[#1a1a1a] border border-[#E5E5E5] dark:border-[#333333] px-4 py-2 text-xs text-[#666666] dark:text-[#A0A0A0] shadow-soft">
            <ShieldCheck className="h-4 w-4 text-[#00B64F]" />
            Secured by Nigeria's Open Banking System
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banks.map((b) => (
            <div
              key={b.name}
              className="squircle-sm bg-white dark:bg-[#1a1a1a] border border-[#E5E5E5] dark:border-[#333333] shadow-soft p-5 flex items-center gap-4"
            >
              <span
                className="h-12 w-12 rounded-2xl flex items-center justify-center font-display font-semibold text-white text-lg"
                style={{ background: b.color }}
              >
                {b.short}
              </span>
              <div className="flex-1">
                <p className="font-display font-semibold text-[#191919] dark:text-white">{b.name}</p>
                <p className="text-[11px] text-[#666666] dark:text-[#A0A0A0]">•••• 4821 · Auto-sync</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#00B64F]"><CheckCircle2 className="h-3.5 w-3.5" /> Live</span>
            </div>
          ))}
          <div className="squircle-sm bg-white dark:bg-[#1a1a1a] border border-dashed border-[#E5E5E5] dark:border-[#333333] p-5 flex items-center gap-4 hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] transition cursor-pointer">
            <span className="h-12 w-12 rounded-2xl flex items-center justify-center bg-[#F5F5F5] dark:bg-[#2A2A2A] border border-[#E5E5E5] dark:border-[#333333]"><Plus className="h-5 w-5 text-[#666666] dark:text-[#A0A0A0]" /></span>
            <div>
              <p className="font-display font-semibold text-[#191919] dark:text-white">Connect a bank</p>
              <p className="text-[11px] text-[#666666] dark:text-[#A0A0A0]">Lite · 1 · Business · 3 · Elite · unlimited</p>
            </div>
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
    { you: "You Send Invoices & Receipts", auto: "Paid invoices and issued receipts sync into your books." },
    { you: "You Take Payments", auto: "Payment pages settle straight into your dashboard." },
  ];
  return (
    <section id="how" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-[#00B64F]">How it works</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#191919] dark:text-white">You live your life. We do the books.</h2>
          <p className="mt-4 text-[#666666] dark:text-[#A0A0A0]">Just use the app for your transactions. Every move flows into a clean, exportable ledger — quietly, in the background.</p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {steps.map((s, i) => (
            <div
              key={i}
              className="squircle bg-white dark:bg-[#1a1a1a] p-6 sm:p-7 hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] transition group shadow-soft border border-[#E5E5E5] dark:border-[#333333]"
            >
              <div className="flex items-center gap-3 text-xs text-[#666666] dark:text-[#A0A0A0]">
                <span className="h-6 w-6 rounded-full bg-[#F5F5F5] dark:bg-[#2A2A2A] border border-[#E5E5E5] dark:border-[#333333] flex items-center justify-center font-medium text-[#191919] dark:text-white">{i + 1}</span>
                <span>Step {i + 1}</span>
              </div>
              <p className="mt-5 font-display text-xl sm:text-2xl font-semibold text-[#191919] dark:text-white">{s.you}</p>
              <div className="mt-3 flex items-start gap-2 text-sm text-[#666666] dark:text-[#A0A0A0]">
                <span className="mt-2 h-px w-6 bg-[#FDC020]" />
                <span>→ {s.auto}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-10 max-w-3xl text-sm text-[#666666] dark:text-[#A0A0A0]">Export your bookkeeping records the same way you export your transaction history — one tap, ready for tax.</p>
      </div>
    </section>
  );
}

function MoneyFlow() {
  const [time, setTime] = useState<(typeof timeFilters)[number]>("30d");
  const [item, setItem] = useState<(typeof itemFilters)[number]["key"]>("inflow");
  const active = itemFilters.find((i) => i.key === item)!;
  const toneText = active.tone === "leaf" ? "text-[#00B64F]" : active.tone === "gold" ? "text-[#FDC020]" : "text-[#191919] dark:text-white";

  return (
    <div className="squircle-lg bg-white dark:bg-[#1a1a1a] border border-[#E5E5E5] dark:border-[#333333] shadow-float p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-[#191919] dark:text-white">Money Flow</p>
        <div className="inline-flex rounded-full bg-[#F5F5F5] dark:bg-[#2A2A2A] border border-[#E5E5E5] dark:border-[#333333] p-1">
          {timeFilters.map((t) => (
            <button
              key={t}
              onClick={() => setTime(t)}
              className={`px-3 py-1.5 text-[11px] sm:text-xs font-medium rounded-full transition ${
                time === t ? "bg-[#191919] dark:bg-white text-white dark:text-[#191919]" : "text-[#666666] dark:text-[#A0A0A0] hover:text-[#191919] dark:hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-8 sm:mt-12 text-center">
        <p className="text-xs uppercase tracking-widest text-[#666666] dark:text-[#A0A0A0]">{active.label} · {time}</p>
        <p className={`mt-3 font-display text-5xl sm:text-7xl font-semibold tracking-tight ${toneText}`}>{active.value}</p>
        <p className={`mt-3 text-sm font-medium ${active.up ? "text-[#00B64F]" : "text-[#666666] dark:text-[#A0A0A0]"}`}>
          {active.up ? "▲" : "▾"} {active.pct} vs previous period
        </p>
      </div>
      <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {itemFilters.map((f) => {
          const Icon = f.icon;
          const isActive = f.key === item;
          return (
            <button
              key={f.key}
              onClick={() => setItem(f.key)}
              className={`squircle-sm border p-3 text-left transition ${
                isActive
                  ? "bg-[#191919] dark:bg-white text-white dark:text-[#191919] border-[#191919] dark:border-white"
                  : "bg-[#F5F5F5] dark:bg-[#2A2A2A] border-[#E5E5E5] dark:border-[#333333] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A]/80"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-[#FDC020]" : "text-[#666666] dark:text-[#A0A0A0]"}`} />
              <p className={`mt-2 text-[11px] font-medium ${isActive ? "text-white/80 dark:text-[#191919]/80" : "text-[#191919] dark:text-white"}`}>{f.label}</p>
              <p className={`text-[10px] ${isActive ? "text-white/60 dark:text-[#191919]/60" : "text-[#666666] dark:text-[#A0A0A0]"}`}>{f.value}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MoneyFlowSection() {
  return (
    <section id="money-flow" className="py-24 sm:py-32 bg-[#F5F5F5] dark:bg-[#2A2A2A]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <p className="text-sm font-medium text-[#00B64F]">Money Flow</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#191919] dark:text-white">One number. The whole story.</h2>
            <p className="mt-4 text-[#666666] dark:text-[#A0A0A0]">Filter your money by time, by category, by behavior. Big, beautiful figures — no spreadsheets, no jargon. Just the Naira that matters, right now.</p>
            <div className="mt-6 squircle-sm bg-white dark:bg-[#1a1a1a] border border-[#E5E5E5] dark:border-[#333333] p-4 text-sm shadow-soft">
              <p className="font-medium text-[#191919] dark:text-white">Want the full picture?</p>
              <p className="mt-1 text-[#666666] dark:text-[#A0A0A0]">Connect your bank accounts to unlock visibility across all your spending.</p>
            </div>
          </div>
          <div className="lg:col-span-7"><MoneyFlow /></div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: Sparkles, title: "Automatic Bookkeeping", desc: "Records itself as money moves in and out." },
    { icon: Users, title: "Personal & Business Mode", desc: "Switch contexts. Keep finances separate, clean." },
    { icon: TrendingUp, title: "Money Flow Analytics", desc: "Filter by time and category — one figure, total clarity." },
    { icon: Receipt, title: "Smart Categorization", desc: "Every spend tagged in real time — Food, Data, Logistics." },
    { icon: PieChart, title: "Combined Statements", desc: "Merge wallet and bank account history into one PDF." },
    { icon: FileText, title: "Tax Ready Records", desc: "Export clean, audit-ready statements anytime." },
    { icon: Wallet, title: "Bank + Wallet Sync", desc: "Connect 3 banks on Premium · unlimited on Elite." },
  ];
  return (
    <section id="features" className="py-24 sm:py-32 bg-[#F5F5F5] dark:bg-[#2A2A2A]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-[#00B64F]">Features</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#191919] dark:text-white">Everything you'd hire a bookkeeper for. Without the bookkeeper.</h2>
          </div>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => {
            const Icon = it.icon;
            const featured = i === 0;
            return (
              <div
                key={i}
                className={`squircle p-6 sm:p-7 border transition hover:-translate-y-0.5 shadow-soft ${
                  featured
                    ? "bg-[#191919] text-white border-[#191919] lg:row-span-2"
                    : "bg-white dark:bg-[#1a1a1a] border-[#E5E5E5] dark:border-[#333333]"
                }`}
              >
                <div
                  className={`h-11 w-11 rounded-2xl flex items-center justify-center ${
                    featured ? "bg-[#FDC020] text-[#191919]" : "bg-[#F5F5F5] dark:bg-[#2A2A2A] text-[#191919] dark:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className={`mt-5 font-display text-xl font-semibold ${featured ? "text-white" : "text-[#191919] dark:text-white"}`}>{it.title}</h3>
                <p className={`mt-2 text-sm ${featured ? "text-white/70" : "text-[#666666] dark:text-[#A0A0A0]"}`}>{it.desc}</p>
                {featured && (
                  <div className="mt-8 squircle-sm bg-white/10 border border-white/10 p-4">
                    <p className="text-xs text-white/60">Live · just now</p>
                    <p className="mt-1 font-display text-lg text-white">₦ 45,000 income from <span className="text-[#FDC020]">Online Sales</span> auto-logged.</p>
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
  const getTagClass = (c: string) => {
    if (c === "gold") return "bg-[#FDC020]/15 hover:bg-[#FDC020]/25 text-[#191919] dark:text-white";
    if (c === "leaf") return "bg-[#00B64F]/10 hover:bg-[#00B64F]/20 text-[#191919] dark:text-white";
    return "bg-[#F5F5F5] dark:bg-[#2A2A2A] hover:bg-[#F5F5F5]/80 dark:hover:bg-[#2A2A2A]/80 text-[#191919] dark:text-white";
  };

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-medium text-[#00B64F]">Smart categories</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#191919] dark:text-white">Every Naira finds its place.</h2>
          <p className="mt-4 text-[#666666] dark:text-[#A0A0A0]">Zidwell understands what real Nigerian life looks like — and tags it for you.</p>
        </div>
        <div className="mt-14 flex flex-wrap justify-center gap-3 sm:gap-4">
          {categoriesTags.map((t, i) => (
            <span
              key={t.l}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition border border-[#E5E5E5]/60 dark:border-[#333333]/60 shadow-soft ${getTagClass(t.c)} ${
                i % 3 === 0 ? "animate-float" : i % 3 === 1 ? "animate-float-slow" : ""
              }`}
              style={{ animationDelay: `${(i % 5) * 0.4}s` }}
            >
              <span className="text-base">{t.e}</span> {t.l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// Dashboard Component
function DashboardChart() {
  const months = [
    { month: "Jan", income: 4200000, expenses: 2800000 },
    { month: "Feb", income: 4800000, expenses: 2900000 },
    { month: "Mar", income: 5100000, expenses: 3100000 },
    { month: "Apr", income: 5300000, expenses: 3000000 },
    { month: "May", income: 5600000, expenses: 3200000 },
    { month: "Jun", income: 6840000, expenses: 3500000 },
    { month: "Jul", income: 7200000, expenses: 3800000 },
    { month: "Aug", income: 8200000, expenses: 3400000 },
  ];
  const maxValue = Math.max(...months.map(m => Math.max(m.income, m.expenses)));
  const feeDistribution = [
    { name: "Logistics", value: 32, color: "#FDC020" },
    { name: "Marketing", value: 24, color: "#00B64F" },
    { name: "Salary", value: 22, color: "#191919" },
    { name: "Other", value: 22, color: "#cbd5e1" },
  ];

  return (
    <div className="squircle-lg bg-white dark:bg-[#1a1a1a] border border-[#E5E5E5] dark:border-[#333333] shadow-float p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#666666] dark:text-[#A0A0A0]">Net balance · August</p>
          <p className="font-display text-3xl sm:text-4xl font-semibold text-[#191919] dark:text-white">₦ 4,820,300</p>
        </div>
        <div className="flex gap-2 text-[11px]">
          <span className="rounded-full bg-[#00B64F]/10 text-[#00B64F] px-3 py-1 font-medium">Income ₦ 8.2M</span>
          <span className="rounded-full bg-[#191919]/5 dark:bg-white/10 px-3 py-1 font-medium text-[#666666] dark:text-[#A0A0A0]">Expense ₦ 3.4M</span>
        </div>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 squircle-sm bg-[#F5F5F5] dark:bg-[#2A2A2A] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#191919] dark:text-white">Income vs Expenses</p>
            <p className="text-[11px] text-[#666666] dark:text-[#A0A0A0]">Last 8 months</p>
          </div>
          <div className="mt-5 flex items-end gap-2 sm:gap-4 h-40">
            {months.map((mo) => (
              <div key={mo.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-1 h-full w-full justify-center">
                  <div className="w-2 sm:w-3 rounded-t-md bg-[#00B64F]" style={{ height: `${(mo.income / maxValue) * 100}%` }} />
                  <div className="w-2 sm:w-3 rounded-t-md bg-[#FDC020]" style={{ height: `${(mo.expenses / maxValue) * 100}%` }} />
                </div>
                <span className="text-[10px] text-[#666666] dark:text-[#A0A0A0]">{mo.month}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="squircle-sm bg-[#F5F5F5] dark:bg-[#2A2A2A] p-4 sm:p-5">
          <p className="text-sm font-medium text-[#191919] dark:text-white">Spending breakdown</p>
          <div className="mt-4 flex items-center justify-center">
            <svg viewBox="0 0 120 120" className="h-36 w-36">
              <circle cx="60" cy="60" r="42" fill="none" stroke="#E5E5E5" strokeWidth="14" />
              <circle cx="60" cy="60" r="42" fill="none" stroke="#FDC020" strokeWidth="14" strokeDasharray="84.5 131.5" strokeDashoffset="0" transform="rotate(-90 60 60)" />
              <circle cx="60" cy="60" r="42" fill="none" stroke="#00B64F" strokeWidth="14" strokeDasharray="63.4 152.6" strokeDashoffset="-84.5" transform="rotate(-90 60 60)" />
              <circle cx="60" cy="60" r="42" fill="none" stroke="#191919" strokeWidth="14" strokeDasharray="58.1 157.9" strokeDashoffset="-147.9" transform="rotate(-90 60 60)" />
              <circle cx="60" cy="60" r="42" fill="none" stroke="#cbd5e1" strokeWidth="14" strokeDasharray="58.1 157.9" strokeDashoffset="-206" transform="rotate(-90 60 60)" />
              <circle cx="60" cy="60" r="25" fill="white" />
              <text x="60" y="58" textAnchor="middle" className="fill-[#191919]" style={{ fontSize: 11, fontWeight: 600 }}>₦ 3.4M</text>
              <text x="60" y="72" textAnchor="middle" className="fill-[#666666]" style={{ fontSize: 8 }}>total spent</text>
            </svg>
          </div>
          <ul className="mt-4 space-y-2 text-[11px]">
            {feeDistribution.map((item) => (
              <li key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: item.color }} /><span className="text-[#666666] dark:text-[#A0A0A0]">{item.name}</span></span>
                <span className="font-medium text-[#191919] dark:text-white">{item.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="squircle-sm bg-[#F5F5F5] dark:bg-[#2A2A2A] p-4"><p className="text-[11px] text-[#666666] dark:text-[#A0A0A0]">Monthly trend</p><p className="font-display text-xl font-semibold text-[#00B64F]">+18.2%</p></div>
        <div className="squircle-sm bg-[#F5F5F5] dark:bg-[#2A2A2A] p-4"><p className="text-[11px] text-[#666666] dark:text-[#A0A0A0]">Largest category</p><p className="font-display text-xl font-semibold text-[#191919] dark:text-white">Logistics</p></div>
        <div className="squircle-sm bg-[#F5F5F5] dark:bg-[#2A2A2A] p-4"><p className="text-[11px] text-[#666666] dark:text-[#A0A0A0]">Auto-categorized</p><p className="font-display text-xl font-semibold text-[#FDC020]">98%</p></div>
      </div>
    </div>
  );
}

function DashboardSection() {
  return (
    <section id="dashboard" className="py-24 sm:py-32 bg-[#F5F5F5] dark:bg-[#2A2A2A]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-5">
            <p className="text-sm font-medium text-[#00B64F]">Dashboard</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#191919] dark:text-white">A dashboard that doesn't feel like accounting.</h2>
            <p className="mt-4 text-[#666666] dark:text-[#A0A0A0]">Pie charts. Income vs expenses. Net balance. Monthly trends. Real Naira figures — designed for humans, not auditors.</p>
            <div className="mt-6 flex items-center gap-3">
              <img src={entrepreneursUsingApp} alt="Nigerian entrepreneurs reviewing Zidwell on a laptop" width={1280} height={960} loading="lazy" className="squircle-sm w-40 sm:w-56 object-cover aspect-[4/3]" />
              <div><p className="font-display text-base font-semibold text-[#191919] dark:text-white">Loved by founders</p><p className="text-xs text-[#666666] dark:text-[#A0A0A0]">From market stalls to tech studios.</p></div>
            </div>
          </div>
          <div className="lg:col-span-7"><DashboardChart /></div>
        </div>
      </div>
    </section>
  );
}

function HealthScore() {
  const score = 82;
  const r = 56;
  const C = 2 * Math.PI * r;
  const dash = (score / 100) * C;

  return (
    <div className="squircle-lg bg-white dark:bg-[#1a1a1a] border border-[#E5E5E5] dark:border-[#333333] shadow-float p-5 sm:p-8">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 140 140" className="h-48 w-48">
            <circle cx="70" cy="70" r={r} fill="none" stroke="#E5E5E5" strokeWidth="14" />
            <circle cx="70" cy="70" r={r} fill="none" stroke="#00B64F" strokeWidth="14" strokeDasharray={`${dash} ${C - dash}`} strokeLinecap="round" transform="rotate(-90 70 70)" />
            <text x="70" y="70" textAnchor="middle" className=" fill-[#191919] dark:fill-white text-3xl font-semibold">{score}</text>
            <text x="70" y="90" textAnchor="middle" className="fill-[#666666] text-[10px]">/ 100</text>
          </svg>
          <p className="mt-3 font-display text-lg font-semibold text-[#191919] dark:text-white">Financially healthy</p>
          <p className="text-xs text-[#666666] dark:text-[#A0A0A0]">Cashflow stable · Income diversified</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3 squircle-sm bg-[#F5F5F5] dark:bg-[#2A2A2A] border border-[#E5E5E5] dark:border-[#333333] p-4"><span className="h-9 w-9 rounded-xl flex items-center justify-center bg-[#00B64F]/10 text-[#00B64F]"><TrendingUp className="h-4 w-4" /></span><p className="text-sm leading-relaxed text-[#191919] dark:text-white">Your cashflow increased <b>18%</b> from last month.</p></div>
          <div className="flex items-start gap-3 squircle-sm bg-[#F5F5F5] dark:bg-[#2A2A2A] border border-[#E5E5E5] dark:border-[#333333] p-4"><span className="h-9 w-9 rounded-xl flex items-center justify-center bg-[#FDC020]/15 text-[#FDC020]"><Coins className="h-4 w-4" /></span><p className="text-sm leading-relaxed text-[#191919] dark:text-white">You spent <b>₦ 43,000</b> on transport this month.</p></div>
          <div className="flex items-start gap-3 squircle-sm bg-[#F5F5F5] dark:bg-[#2A2A2A] border border-[#E5E5E5] dark:border-[#333333] p-4"><span className="h-9 w-9 rounded-xl flex items-center justify-center bg-[#F5F5F5] dark:bg-[#2A2A2A] text-[#191919] dark:text-white"><TrendingDown className="h-4 w-4" /></span><p className="text-sm leading-relaxed text-[#191919] dark:text-white">Your biggest expense category is <b>inventory</b>.</p></div>
          <div className="flex items-start gap-3 squircle-sm bg-[#F5F5F5] dark:bg-[#2A2A2A] border border-[#E5E5E5] dark:border-[#333333] p-4"><span className="h-9 w-9 rounded-xl flex items-center justify-center bg-[#00B64F]/10 text-[#00B64F]"><Sparkles className="h-4 w-4" /></span><p className="text-sm leading-relaxed text-[#191919] dark:text-white">Most of your income came from <b>transfers</b>.</p></div>
        </div>
      </div>
    </div>
  );
}

function HealthSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#00B64F]/10 text-[#00B64F] px-3 py-1.5 text-xs font-medium">Premium · Elite</span>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#191919] dark:text-white">Your business, financially healthy.</h2>
            <p className="mt-4 text-[#666666] dark:text-[#A0A0A0]">A live Financial Health Score scored from your cashflow stability, income diversity, expense balance, and bookkeeping consistency — paired with intelligent, conversational insights.</p>
            <ul className="mt-6 space-y-2 text-sm text-[#666666] dark:text-[#A0A0A0]"><li>· "Your business is spending too much on logistics."</li><li>· "Revenue dropped 12% this month."</li><li>· "Your most profitable category is consulting."</li></ul>
          </div>
          <div className="lg:col-span-7"><HealthScore /></div>
        </div>
      </div>
    </section>
  );
}

function PlansSection() {
  return (
    <section id="plans" className="py-24 sm:py-32 bg-[#F5F5F5] dark:bg-[#2A2A2A]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-medium text-[#00B64F]">Plans</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#191919] dark:text-white">Pick the level of financial clarity you need.</h2>
          <p className="mt-4 text-[#666666] dark:text-[#A0A0A0]">Start free. Upgrade when you're ready to see every Naira across every account.</p>
        </div>
        <div className="mt-10 mx-auto max-w-3xl squircle-sm bg-[#FDC020]/15 border border-[#FDC020]/40 shadow-soft p-4 sm:p-5 flex items-start sm:items-center gap-3 flex-col sm:flex-row text-center sm:text-left">
          <span className="h-10 w-10 rounded-2xl bg-[#FDC020] text-[#191919] flex items-center justify-center shrink-0"><Tag className="h-5 w-5" /></span>
          <p className="text-sm text-[#191919] dark:text-white"><span className="font-semibold">Zidwell Pro users get 50% off the first month.</span> <span className="text-[#666666] dark:text-[#A0A0A0]">Lite is just ₦2,490 instead of ₦4,990.</span></p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => (
            <div key={p.name} className={`rounded-xl p-6 border shadow-soft flex flex-col ${p.featured ? "bg-[#191919] text-white border-[#191919] shadow-float" : "bg-white dark:bg-[#1a1a1a] border-[#E5E5E5] dark:border-[#333333]"}`}>
              <div className="flex items-center justify-between"><p className={`font-display text-lg font-semibold ${p.featured ? "text-white" : "text-[#191919] dark:text-white"}`}>{p.name}</p>{p.featured && <span className="inline-flex items-center gap-1 rounded-full bg-[#FDC020] text-[#191919] px-2.5 py-1 text-[10px] font-semibold"><Sparkles className="h-3 w-3" /> Most loved</span>}</div>
              <div className="mt-4 flex items-baseline gap-1"><span className={`font-display text-3xl font-semibold ${p.featured ? "text-white" : "text-[#191919] dark:text-white"}`}>{p.price}</span>{p.suffix && <span className={`text-sm ${p.featured ? "text-white/60" : "text-[#666666] dark:text-[#A0A0A0]"}`}>{p.suffix}</span>}</div>
              <p className={`mt-1 text-xs ${p.featured ? "text-white/70" : "text-[#666666] dark:text-[#A0A0A0]"}`}>{p.note}</p>
              <ul className="mt-5 space-y-2.5 flex-1">{p.features.map((f) => (<li key={f} className="flex items-start gap-2 text-sm"><Check className={`h-4 w-4 mt-0.5 shrink-0 ${p.featured ? "text-[#FDC020]" : "text-[#00B64F]"}`} /><span className={p.featured ? "text-white/90" : "text-[#191919] dark:text-white"}>{f}</span></li>))}</ul>
              <Button variant={p.featured ? "zidwell-primary" : "zidwell-outline"} className="mt-6 w-full" asChild><a href="#cta">{p.cta}</a></Button>
            </div>
          ))}
        </div>
      </div>
    </section>
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
    <div className="relative mx-auto w-[290px] sm:w-[320px] group">
      {/* Outer glow effect */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#FDC020]/20 via-[#00B64F]/20 to-[#FDC020]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Main phone container with hover animation */}
      <div className="squircle-lg bg-[#191919] dark:bg-gray-500 p-2 shadow-float transition-all duration-500 hover:scale-105 hover:shadow-2xl">
        <div className="squircle rounded-2xl bg-white dark:bg-[#1a1a1a] overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            {/* Status bar with fade in */}
            <div className="flex items-center justify-between text-[11px] text-[#666666] dark:text-[#A0A0A0] animate-fade-up">
              <span className="animate-pulse">9:41</span>
              <span className="text-[#191919] dark:text-white">Zidwell</span>
            </div>
            
            {/* Balance section with slide up */}
            <div className="mt-4 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              <p className="text-xs text-[#666666] dark:text-[#A0A0A0]">Net balance</p>
              <p className="font-display text-3xl font-semibold tracking-tight text-[#191919] dark:text-white transition-all duration-300 hover:scale-105 origin-left">
                ₦ 1,284,500
              </p>
              <div className="mt-2 flex gap-2">
                <span className="rounded-full bg-[#00B64F]/10 text-[#00B64F] text-[10px] px-2 py-1 font-medium transition-all duration-300 hover:scale-110 hover:bg-[#00B64F]/20 cursor-pointer">
                  +12.4% this month
                </span>
                <span className="rounded-full bg-[#FDC020]/15 text-[#FDC020] text-[10px] px-2 py-1 font-medium transition-all duration-300 hover:scale-110 hover:bg-[#FDC020]/25 cursor-pointer">
                  Auto-tracked
                </span>
              </div>
            </div>
            
            {/* Stats cards with stagger animation */}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="squircle-sm bg-[#F5F5F5] dark:bg-[#2A2A2A] p-3 transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer animate-fade-up" style={{ animationDelay: "0.2s" }}>
                <p className="text-[10px] text-[#666666] dark:text-[#A0A0A0]">Income</p>
                <p className="font-display text-base font-semibold text-[#191919] dark:text-white">₦ 920k</p>
              </div>
              <div className="squircle-sm bg-[#F5F5F5] dark:bg-[#2A2A2A] p-3 transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer animate-fade-up" style={{ animationDelay: "0.25s" }}>
                <p className="text-[10px] text-[#666666] dark:text-[#A0A0A0]">Expense</p>
                <p className="font-display text-base font-semibold text-[#191919] dark:text-white">₦ 364k</p>
              </div>
            </div>
            
            {/* Transactions section */}
            <div className="mt-5 space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-[#666666] dark:text-[#A0A0A0] animate-fade-up" style={{ animationDelay: "0.3s" }}>
                Today
              </p>
              {transactions.map((tx, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between rounded-2xl bg-[#F5F5F5] dark:bg-[#2A2A2A] px-3 py-2.5 transition-all duration-300 hover:scale-102 hover:bg-[#EBEBEB] dark:hover:bg-[#353535] cursor-pointer animate-fade-up"
                  style={{ animationDelay: `${0.35 + idx * 0.1}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                      tx.up ? "bg-[#00B64F]/15 text-[#00B64F] hover:bg-[#00B64F]/25 hover:scale-110" : "bg-[#FDC020]/20 text-[#FDC020] hover:bg-[#FDC020]/30 hover:scale-110"
                    }`}>
                      {tx.up ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#191919] dark:text-white">{tx.label}</p>
                      <p className="text-[10px] text-[#666666] dark:text-[#A0A0A0]">{tx.sub}</p>
                    </div>
                  </div>
                  <p className={`text-xs font-semibold transition-all duration-300 hover:scale-105 ${
                    tx.up ? "text-[#00B64F]" : "text-[#FDC020]"
                  }`}>
                    {tx.amount}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Home indicator with hover animation */}
          <div className="mx-auto my-3 h-1 w-24 rounded-full bg-[#E5E5E5] dark:bg-[#333333] transition-all duration-300 hover:w-32 hover:bg-[#FDC020] cursor-pointer" />
        </div>
      </div>
    </div>
  );
}

// AIChat Component
function AIChatComponent() {
  return (
    <div className="relative">
      <div aria-hidden className="absolute -inset-6 rounded-[3rem] blur-3xl opacity-60 pointer-events-none" style={{ background: "radial-gradient(at 30% 20%, rgba(253, 192, 32, 0.3), transparent 60%), radial-gradient(at 80% 80%, rgba(0, 182, 79, 0.25), transparent 60%)" }} />
      <div className="relative squircle-lg p-5 sm:p-7 border border-white/10 overflow-hidden" style={{ background: "linear-gradient(180deg, #2A2A2A, #191919)" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2"><span className="relative flex h-2.5 w-2.5"><span className="absolute inset-0 rounded-full bg-[#00B64F] opacity-75 animate-ping" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#00B64F]" /></span><p className="text-xs text-white/70 font-medium">Zidwell AI · online</p></div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] text-white/60"><Zap className="h-3 w-3 text-[#FDC020]" /> GPT-grade finance brain</div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-end"><div className="max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-relaxed bg-white/10 text-white rounded-br-md border border-white/10">How much did I spend on food this month?</div></div>
          <div className="flex justify-start"><div className="max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-relaxed bg-[#FDC020] text-[#191919] rounded-bl-md shadow-float">You spent <span className="font-semibold">₦ 86,400</span> on food in August — <span className="font-semibold">14% less</span> than July. Want a weekly breakdown?</div></div>
          <div className="flex justify-end"><div className="max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-relaxed bg-white/10 text-white rounded-br-md border border-white/10">Show my profit for last 90 days</div></div>
          <div className="flex justify-start"><div className="max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-relaxed bg-[#FDC020] text-[#191919] rounded-bl-md shadow-float">Profit (Jun–Aug): <span className="font-semibold">₦ 2,140,000</span>. Top earner: <span className="font-semibold">Online Sales</span>.<div className="mt-3 flex items-end gap-1.5 h-10">{[40, 65, 35, 80, 55, 90, 70].map((h, i) => (<span key={i} className="w-2 rounded-sm bg-gradient-to-t from-[#FDC020] to-[#00B64F]" style={{ height: `${h}%` }} />))}</div></div></div>
          <div className="flex justify-start"><div className="rounded-3xl rounded-bl-md bg-white/5 border border-white/10 px-4 py-3 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-pulse" /><span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-pulse delay-150" /><span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-pulse delay-300" /></div></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">{["What's my biggest expense?", "Compare June vs August", "Forecast next month"].map((s) => (<button key={s} className="text-[11px] text-white/80 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition">{s}</button>))}</div>
        <div className="mt-5 flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-3">
          <Sparkles className="h-4 w-4 text-[#FDC020] shrink-0" />
          <input disabled placeholder="Ask anything about your money…" className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/40 outline-none" />
          <button className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center transition"><Mic className="h-4 w-4" /></button>
          <button className="h-9 w-9 rounded-full bg-gradient-to-br from-[#FDC020] to-[#00B64F] text-[#191919] flex items-center justify-center shadow-float"><ArrowUp className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-white/40"><Waves className="h-3 w-3" /> Preview · Coming soon for all Zidwell users</div>
      </div>
    </div>
  );
}

function AISection() {
  return (
    <section id="ai" className="py-24 sm:py-32 bg-[#191919] text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(at 20% 30%, rgba(253, 192, 32, 0.2), transparent 50%), radial-gradient(at 80% 70%, rgba(0, 182, 79, 0.15), transparent 50%)" }} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-xs"><Sparkles className="h-3.5 w-3.5 text-[#FDC020]" /> Coming soon</span>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl font-semibold tracking-tight">Your AI finance assistant.</h2>
            <p className="mt-4 text-white/70 max-w-md">Ask your money anything. Get real answers in plain English — no spreadsheets, no formulas.</p>
            <ul className="mt-6 space-y-2 text-sm text-white/80"><li>· "How much did I spend on food this month?"</li><li>· "Show my profit for last 90 days."</li><li>· "What category takes most of my money?"</li></ul>
          </div>
          <div className="lg:col-span-7"><AIChatComponent /></div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section id="cta" className="py-28 sm:py-40">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-display text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-[#191919] dark:text-white">
          Move from financial chaos to{" "}
          <span className="relative inline-block">clarity<span className="absolute -bottom-1 left-0 right-0 h-3 bg-[#FDC020]/60 -z-10 rounded-full" /></span> and certainty.
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button variant="zidwell-primary" size="zidwell-lg" asChild><a href="#">Get Started <ArrowRight className="h-4 w-4" /></a></Button>
          <Button variant="zidwell-outline" size="zidwell-lg" asChild><a href="#dashboard">See Demo</a></Button>
        </div>
        <div className="mt-16 squircle-lg overflow-hidden border border-[#E5E5E5] dark:border-[#333333] shadow-float">
          <img src={heroEntrepreneur} alt="Nigerian entrepreneur using Zidwell on a smartphone" width={1280} height={1280} loading="lazy" className="w-full h-64 sm:h-80 object-cover" />
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-[#E5E5E5] dark:border-[#333333]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 flex flex-col sm:flex-row justify-between gap-6 items-start sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Zidwell Logo" width={28} height={28} className="w-7 object-contain" />
            <span className="font-display font-semibold tracking-tight text-[#191919] dark:text-white">Zidwell</span>
          </div>
          <p className="mt-3 font-display text-lg max-w-md text-[#191919] dark:text-white">Zidwell, make the impossible feel normal.</p>
        </div>
        <p className="text-xs text-[#666666] dark:text-[#A0A0A0]">© {new Date().getFullYear()} Zidwell. Made in Lagos.</p>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a] text-[#191919] dark:text-white">
      <Nav />
      <main>
        <Hero />
        <SocialBar />
        <ConnectedAccounts />
        <HowItWorks />
        <MoneyFlowSection />
        <Features />
        <Categories />
        <DashboardSection />
        <HealthSection />
        <PlansSection />
        <AISection />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}