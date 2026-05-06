"use client";

import Link from "next/link";
import {
  FileText,
  ArrowRight,
  Zap,
  Mail,
  CreditCard,
  Receipt,
  Send,
  CheckCircle2,
  Shield,
  Download,
  Link2,
  BadgeCheck,
  Building2,
  TrendingUp,
  Scale,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Header from "@/app/components/home-component/Header";
import Footer from "@/app/components/home-component/Footer";

export default function ReceiptsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] fade-in">
      <Header />

      <main>
        {/* 1. HERO SECTION */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-yellow)]/5 via-transparent to-[var(--color-accent-yellow)]/5" />
          <div className="py-20 sm:py-32">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 rounded-none px-4 py-1.5 text-sm font-semibold mb-8 bg-[var(--color-accent-yellow)] text-[var(--color-ink)] border-2 border-[var(--border-color)] shadow-[4px_4px_0px_var(--border-color)] mx-auto squircle-sm">
                <Zap className="h-4 w-4" />
                Automated Receipt System
              </div>

              <h1 className="text-4xl sm:text-6xl font-bold text-[var(--text-primary)] mb-6 tracking-tight leading-tight">
                Receipts That{" "}
                <span className="text-[var(--color-accent-yellow)] underline decoration-[var(--color-accent-yellow)] decoration-4 underline-offset-4">
                  Create Themselves
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed">
                Stop manually creating receipts every time you get paid. Zidwell
                automatically generates and sends professional receipts for
                every invoice you create and every payment you receive —{" "}
                <span className="font-semibold text-[var(--text-primary)]">
                  instantly
                </span>
                .
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard/services/receipt">
                  <Button className="w-full sm:w-auto h-14 px-8 text-base font-bold border-2 border-[var(--border-color)] bg-[var(--color-accent-yellow)] text-[var(--color-ink)] shadow-[4px_4px_0px_var(--border-color)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all squircle-md">
                    Start Free Trial
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto h-14 px-8 text-base font-bold border-2 border-[var(--border-color)] shadow-[2px_2px_0px_var(--border-color)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all bg-transparent text-[var(--text-primary)] squircle-md"
                  >
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 2. VALUE SHIFT - Full width background */}
        <section className="py-16 sm:py-24 bg-[var(--bg-secondary)]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-[var(--text-primary)]">
              You Don't Create Receipts Anymore.{" "}
              <span className="text-[var(--color-accent-yellow)]">
                They Just Happen.
              </span>
            </h2>
            <p className="text-lg sm:text-xl leading-relaxed text-[var(--text-secondary)]">
              Whether a customer pays your Zidwell invoice or uses your Zidwell
              payment page, we automatically generate a professional receipt and
              send it to them immediately.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              {["No manual work", "No follow-up", "No stress"].map((item) => (
                <span
                  key={item}
                  className="px-5 py-2 border-2 border-[var(--color-accent-yellow)] bg-[var(--color-accent-yellow)]/10 text-[var(--color-accent-yellow)] font-semibold text-sm squircle-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* 3. HOW IT WORKS */}
        <section className="py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-[var(--text-primary)] mb-16">
              How Zidwell Receipts Work
            </h2>

            <div className="grid gap-6 sm:grid-cols-2">
              {[
                {
                  icon: FileText,
                  step: "1",
                  title: "Create Invoice or Payment Page",
                  description:
                    "Send an invoice or share your payment page link.",
                },
                {
                  icon: CreditCard,
                  step: "2",
                  title: "Customer Makes Payment",
                  description: "Your customer pays via transfer or checkout.",
                },
                {
                  icon: Receipt,
                  step: "3",
                  title: "Receipt is Created Automatically",
                  description:
                    "Zidwell instantly generates a professional receipt.",
                },
                {
                  icon: Send,
                  step: "4",
                  title: "Receipt is Sent",
                  description:
                    "The customer receives it via email, while you just sit and watch Zidwell work for you.",
                },
              ].map((item, index) => (
                <div
                  key={item.step}
                  className="relative p-6 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] shadow-[4px_4px_0px_var(--border-color)] squircle-lg"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="h-12 w-12 flex items-center justify-center bg-[var(--color-accent-yellow)] text-[var(--color-ink)] font-bold text-xl border-2 border-[var(--border-color)] squircle-md">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-[var(--text-secondary)] ml-16">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-center mt-10 text-lg font-semibold text-[var(--color-accent-yellow)]">
              👉 No extra steps required from you
            </p>
          </div>
        </section>

        {/* 4. AUTOMATION FEATURES - Full width background */}
        <section className="py-16 sm:py-24 bg-[var(--bg-secondary)]">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-[var(--text-primary)] mb-16">
              Fully Automated Receipt System
            </h2>

            <div className="grid gap-6 sm:grid-cols-2">
              {[
                {
                  icon: Mail,
                  title: "Invoice Payments",
                  description:
                    "Receipts are automatically created and sent when an invoice is paid.",
                },
                {
                  icon: CreditCard,
                  title: "Payment Pages",
                  description:
                    "Every payment made through your payment page gets an instant receipt.",
                },
                {
                  icon: FileText,
                  title: "Manual Receipts (Optional)",
                  description:
                    "You can still create receipts manually for transactions outside our platform — we got you covered either way.",
                },
                {
                  icon: Zap,
                  title: "Instant Delivery",
                  description:
                    "Customers receive receipts immediately after payment.",
                },
              ].map((feature, index) => (
                <div
                  key={feature.title}
                  className="p-6 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] shadow-[2px_2px_0px_var(--border-color)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all squircle-lg"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="h-10 w-10 flex items-center justify-center mb-4 bg-[var(--color-accent-yellow)]/10 border-2 border-[var(--color-accent-yellow)] squircle-md">
                    <feature.icon className="h-5 w-5 text-[var(--color-accent-yellow)]" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. WHAT YOUR RECEIPTS INCLUDE */}
        <section className="py-16 sm:py-24">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-[var(--text-primary)] mb-4">
              Professional & Secure Receipts
            </h2>
            <p className="text-center text-[var(--text-secondary)] mb-16 max-w-lg mx-auto">
              Every receipt is clean, branded, and verifiable.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { icon: BadgeCheck, label: "Clean, branded design" },
                { icon: Building2, label: "Your business name & logo" },
                { icon: CreditCard, label: "Payment details" },
                { icon: Shield, label: "Unique receipt ID" },
                { icon: CheckCircle2, label: "Digital verification" },
                { icon: Download, label: "Downloadable PDF" },
                { icon: Link2, label: "Shareable link" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center text-center p-4 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] hover:border-[var(--color-accent-yellow)] transition-colors squircle-lg"
                >
                  <div className="h-10 w-10 flex items-center justify-center bg-[var(--color-accent-yellow)]/10 mb-3 squircle-md">
                    <item.icon className="h-5 w-5 text-[var(--color-accent-yellow)]" />
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. WHY THIS MATTERS - Full width background */}
        <section className="py-16 sm:py-24 bg-[var(--bg-secondary)]">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-[var(--text-primary)]">
              Why Receipts Matter for Your Business
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: CheckCircle2, text: "Builds trust with customers" },
                { icon: TrendingUp, text: "Keeps proper financial records" },
                { icon: Scale, text: "Helps during tax filing" },
                { icon: ShieldAlert, text: "Prevents payment disputes" },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-3 p-4 border-2 border-[var(--color-accent-yellow)]/30 bg-[var(--color-accent-yellow)]/5 squircle-lg"
                >
                  <item.icon className="h-6 w-6 text-[var(--color-accent-yellow)] shrink-0" />
                  <span className="font-medium text-lg text-[var(--text-primary)]">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-center mt-10 text-sm text-[var(--text-secondary)] italic">
              "You don't want to start looking for receipts when tax officials
              ask."
            </p>
          </div>
        </section>

        {/* 7. PRICING */}
        <section id="pricing" className="py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-[var(--text-primary)] mb-4">
              Simple Subscription Pricing
            </h2>
            <p className="text-center text-[var(--text-secondary)] mb-16">
              Receipts are generated automatically — no extra charges per
              receipt.
            </p>

            <div className="grid gap-6 sm:grid-cols-3">
              {/* Free Trial */}
              <div className="p-6 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] shadow-[2px_2px_0px_var(--border-color)] flex flex-col squircle-lg hover:shadow-[4px_4px_0px_var(--border-color)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                  Free Trial
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">1 Month</p>
                <div className="text-3xl font-bold text-[var(--text-primary)] mb-6">
                  ₦0
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <CheckCircle2 className="h-4 w-4 text-[var(--color-lemon-green)]" />
                    10 Receipts
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <CheckCircle2 className="h-4 w-4 text-[var(--color-lemon-green)]" />
                    Full access to features
                  </li>
                </ul>
                <Link href="/dashboard/services/receipt">
                  <Button className="w-full border-2 border-[var(--border-color)] bg-[var(--color-accent-yellow)] text-[var(--color-ink)] font-bold hover:bg-[var(--color-accent-yellow)]/90 transition-all squircle-md">
                    Start Free Trial
                  </Button>
                </Link>
              </div>

              {/* Standard */}
              <div className="p-6 bg-[var(--bg-primary)] border-2 border-[var(--color-accent-yellow)] shadow-[4px_4px_0px_var(--color-accent-yellow)] flex flex-col relative squircle-lg hover:shadow-[6px_6px_0px_var(--color-accent-yellow)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                <div className="absolute -top-3 left-4 px-3 py-0.5 bg-[var(--color-accent-yellow)] text-[var(--color-ink)] text-xs font-bold border-2 border-[var(--border-color)] squircle-sm">
                  POPULAR
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                  Standard
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">Monthly</p>
                <div className="text-3xl font-bold text-[var(--text-primary)] mb-6">
                  ₦4,900
                  <span className="text-base font-normal text-[var(--text-secondary)]">
                    /mo
                  </span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <CheckCircle2 className="h-4 w-4 text-[var(--color-lemon-green)]" />
                    20 Receipts
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <CheckCircle2 className="h-4 w-4 text-[var(--color-lemon-green)]" />
                    Automated receipts
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <CheckCircle2 className="h-4 w-4 text-[var(--color-lemon-green)]" />
                    Invoice & payment page integration
                  </li>
                </ul>
                <Link href="/pricing">
                  <Button className="w-full border-2 border-[var(--border-color)] bg-[var(--color-accent-yellow)] text-[var(--color-ink)] font-bold hover:bg-[var(--color-accent-yellow)]/90 transition-all squircle-md">
                    Get Started
                  </Button>
                </Link>
              </div>

              {/* Pro */}
              <div className="p-6 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] shadow-[2px_2px_0px_var(--border-color)] flex flex-col squircle-lg hover:shadow-[4px_4px_0px_var(--border-color)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                  Pro
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">Monthly</p>
                <div className="text-3xl font-bold text-[var(--text-primary)] mb-6">
                  ₦9,900
                  <span className="text-base font-normal text-[var(--text-secondary)]">
                    /mo
                  </span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <CheckCircle2 className="h-4 w-4 text-[var(--color-lemon-green)]" />
                    Unlimited Receipts
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <CheckCircle2 className="h-4 w-4 text-[var(--color-lemon-green)]" />
                    Full automation
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <CheckCircle2 className="h-4 w-4 text-[var(--color-lemon-green)]" />
                    No limits
                  </li>
                </ul>
                <Link href="/pricing">
                  <Button className="w-full border-2 border-[var(--border-color)] bg-[var(--color-accent-yellow)] text-[var(--color-ink)] font-bold hover:bg-[var(--color-accent-yellow)]/90 transition-all squircle-md">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t-2 border-[var(--border-color)] py-8 bg-[var(--bg-secondary)]">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Powered by{" "}
              <a
                href="https://zidwell.com"
                className="font-bold text-[var(--color-accent-yellow)] hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Zidwell Finance
              </a>{" "}
              Financial tools for Nigerian entrepreneurs.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}