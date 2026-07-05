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
    <div className="min-h-screen bg-(--bg-primary) fade-in">
      <Header />

      <main>
        {/* 1. HERO SECTION */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-(--color-accent-yellow)/5 via-transparent to-(--color-accent-yellow)/5" />
          <div className="py-16 sm:py-20 lg:py-32">
            <div className="max-w-3xl mx-auto text-center px-4">
              <div className="inline-flex items-center gap-2 rounded-none px-4 py-1.5 text-sm font-semibold mb-8 bg-(--color-accent-yellow) text-(--color-ink) border-2 border-(--border-color) shadow-[4px_4px_0px_var(--border-color)] mx-auto squircle-sm">
                <Zap className="h-4 w-4" />
                Automated Receipt System
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-(--text-primary) mb-6 tracking-tight leading-tight">
                Receipts That{" "}
                <span className="text-(--color-accent-yellow) underline decoration-(--color-accent-yellow) decoration-4 underline-offset-4">
                  Create Themselves
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-(--text-secondary) mb-10 max-w-2xl mx-auto leading-relaxed">
                Stop manually creating receipts every time you get paid. Zidwell
                automatically generates and sends professional receipts for
                every invoice you create and every payment you receive —{" "}
                <span className="font-semibold text-(--text-primary)">
                  instantly
                </span>
                .
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard/services/receipt">
                  <Button className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-bold border-2 border-(--border-color) bg-(--color-accent-yellow) text-(--color-ink) shadow-[4px_4px_0px_var(--border-color)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all squircle-md">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-bold border-2 border-(--border-color) shadow-[2px_2px_0px_var(--border-color)] hover:translate-y-px hover:translate-y-px hover:shadow-none transition-all bg-transparent text-(--text-primary) squircle-md"
                  >
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 2. VALUE SHIFT - Full width background */}
        <section className="py-12 sm:py-16 lg:py-24 bg-(--bg-secondary)">
          <div className="max-w-3xl mx-auto text-center px-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 text-(--text-primary)">
              You Don't Create Receipts Anymore.{" "}
              <span className="text-(--color-accent-yellow)">
                They Just Happen.
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl leading-relaxed text-(--text-secondary)">
              Whether a customer pays your Zidwell invoice or uses your Zidwell
              payment page, we automatically generate a professional receipt and
              send it to them immediately.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 sm:gap-4 justify-center">
              {["No manual work", "No follow-up", "No stress"].map((item) => (
                <span
                  key={item}
                  className="px-4 sm:px-5 py-1.5 sm:py-2 border-2 border-(--color-accent-yellow) bg-(--color-accent-yellow)/10 text-(--color-accent-yellow) font-semibold text-xs sm:text-sm squircle-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* 3. HOW IT WORKS */}
        <section className="py-12 sm:py-16 lg:py-24">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-(--text-primary) mb-12 sm:mb-16">
              How Zidwell Receipts Work
            </h2>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
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
                  className="relative p-4 sm:p-6 bg-(--bg-primary) border-2 border-(--border-color) shadow-[4px_4px_0px_var(--border-color)] squircle-lg"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-3 sm:gap-4 mb-3">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center bg-(--color-accent-yellow) text-(--color-ink) font-bold text-lg sm:text-xl border-2 border-(--border-color) squircle-md shrink-0">
                      {item.step}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-(--text-primary)">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-sm sm:text-base text-(--text-secondary) ml-14 sm:ml-16">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-center mt-8 sm:mt-10 text-base sm:text-lg font-semibold text-(--color-accent-yellow)">
              👉 No extra steps required from you
            </p>
          </div>
        </section>

        {/* 4. AUTOMATION FEATURES - Full width background */}
        <section className="py-12 sm:py-16 lg:py-24 bg-(--bg-secondary)">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-(--text-primary) mb-12 sm:mb-16">
              Fully Automated Receipt System
            </h2>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
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
                  className="p-4 sm:p-6 bg-(--bg-primary) border-2 border-(--border-color) shadow-[2px_2px_0px_var(--border-color)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all squircle-lg"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="h-10 w-10 flex items-center justify-center mb-4 bg-(--color-accent-yellow)/10 border-2 border-(--color-accent-yellow) squircle-md">
                    <feature.icon className="h-5 w-5 text-(--color-accent-yellow)" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-(--text-primary) mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-(--text-secondary) leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. WHAT YOUR RECEIPTS INCLUDE */}
        <section className="py-12 sm:py-16 lg:py-24">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-(--text-primary) mb-4">
              Professional & Secure Receipts
            </h2>
            <p className="text-center text-(--text-secondary) mb-12 sm:mb-16 max-w-lg mx-auto text-sm sm:text-base">
              Every receipt is clean, branded, and verifiable.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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
                  className="flex flex-col items-center text-center p-3 sm:p-4 bg-(--bg-primary) border-2 border-(--border-color) hover:border-(--color-accent-yellow) transition-colors squircle-lg"
                >
                  <div className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center bg-(--color-accent-yellow)/10 mb-2 sm:mb-3 squircle-md">
                    <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-(--color-accent-yellow)" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-(--text-primary)">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. WHY THIS MATTERS - Full width background */}
        <section className="py-12 sm:py-16 lg:py-24 bg-(--bg-secondary)">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-10 sm:mb-12 text-(--text-primary)">
              Why Receipts Matter for Your Business
            </h2>

            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              {[
                { icon: CheckCircle2, text: "Builds trust with customers" },
                { icon: TrendingUp, text: "Keeps proper financial records" },
                { icon: Scale, text: "Helps during tax filing" },
                { icon: ShieldAlert, text: "Prevents payment disputes" },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-3 p-3 sm:p-4 border-2 border-(--color-accent-yellow)/30 bg-(--color-accent-yellow)/5 squircle-lg"
                >
                  <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-(--color-accent-yellow) shrink-0" />
                  <span className="font-medium text-base sm:text-lg text-(--text-primary)">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-center mt-8 sm:mt-10 text-sm sm:text-base text-(--text-secondary) italic">
              "You don't want to start looking for receipts when tax officials
              ask."
            </p>
          </div>
        </section>

        {/* 7. CTA SECTION - Replaces Pricing */}
        <section className="py-16 sm:py-24">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="bg-(--bg-primary) border-2 border-(--color-accent-yellow) shadow-[6px_6px_0px_var(--color-accent-yellow)] p-8 sm:p-12 squircle-lg">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-(--text-primary) mb-4">
                Ready to Automate Your Receipts?
              </h2>
              <p className="text-base sm:text-lg text-(--text-secondary) mb-8 max-w-xl mx-auto">
                Join thousands of Nigerian businesses already using Zidwell to
                automate their financial workflows.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard/services/receipt">
                  <Button className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-bold border-2 border-(--border-color) bg-(--color-accent-yellow) text-(--color-ink) shadow-[4px_4px_0px_var(--border-color)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all squircle-md">
                    Get Started Free
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-bold border-2 border-(--border-color) shadow-[2px_2px_0px_var(--border-color)] hover:translate-y-px hover:translate-y-px hover:shadow-none transition-all bg-transparent text-(--text-primary) squircle-md"
                  >
                    View All Plans
                  </Button>
                </Link>
              </div>
              <p className="text-xs sm:text-sm text-(--text-secondary) mt-6">
                ✓ No credit card required for free trial
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t-2 border-(--border-color) py-6 sm:py-8 bg-(--bg-secondary)">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-xs sm:text-sm text-(--text-secondary)">
              Powered by{" "}
              <a
                href="https://zidwell.com"
                className="font-bold text-(--color-accent-yellow) hover:underline"
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