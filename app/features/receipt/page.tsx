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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f5f0e6] dark:bg-[#0d1f18]">
      <Header />

      <main>
        {/* 1. HERO SECTION */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#034835]/5 via-transparent to-[#e4c644]/5" />
          <div className="container relative py-20 sm:py-32">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 rounded-none px-4 py-1.5 text-sm font-semibold mb-8 bg-[#e4c644] text-[#034835] border-2 border-[#034835] shadow-[4px_4px_0px_#034835]">
                <Zap className="h-4 w-4" />
                Automated Receipt System
              </div>

              <h1 className="text-4xl sm:text-6xl font-bold text-[#034835] dark:text-[#f5f0e6] mb-6 tracking-tight leading-tight">
                Receipts That{" "}
                <span className="text-[#e4c644] underline decoration-[#e4c644] decoration-4 underline-offset-4">
                  Create Themselves
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-[#0a3b2d] dark:text-[#c9bfa8] mb-10 max-w-2xl mx-auto leading-relaxed">
                Stop manually creating receipts every time you get paid.
                Zidwell automatically generates and sends professional receipts
                for every invoice you create and every payment you receive —{" "}
                <span className="font-semibold text-[#034835] dark:text-[#f5f0e6]">instantly</span>.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard/services/receipt">
                  <Button className="w-full sm:w-auto h-14 px-8 text-base font-bold rounded-none border-2 border-[#034835] bg-[#034835] text-[#f5f0e6] shadow-[4px_4px_0px_#034835] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                    Start Free Trial
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" className="w-full sm:w-auto h-14 px-8 text-base font-bold rounded-none border-2 border-[#034835] shadow-[2px_2px_0px_#034835] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all bg-transparent text-[#034835] dark:text-[#f5f0e6] dark:border-[#f5f0e6] dark:shadow-[2px_2px_0px_#f5f0e6]">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 2. VALUE SHIFT */}
        <section className="py-16 sm:py-24 bg-[#034835] text-[#f5f0e6]">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                You Don't Create Receipts Anymore.{" "}
                <span className="text-[#e4c644]">They Just Happen.</span>
              </h2>
              <p className="text-lg sm:text-xl leading-relaxed opacity-90">
                Whether a customer pays your Zidwell invoice or uses your
                Zidwell payment page, we automatically generate a professional
                receipt and send it to them immediately.
              </p>
              <div className="mt-8 flex flex-wrap gap-4 justify-center">
                {["No manual work", "No follow-up", "No stress"].map((item) => (
                  <span
                    key={item}
                    className="px-5 py-2 rounded-none border-2 border-[#e4c644] bg-[#e4c644]/10 text-[#e4c644] font-semibold text-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 3. HOW IT WORKS */}
        <section className="py-16 sm:py-24">
          <div className="container">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-[#034835] dark:text-[#f5f0e6] mb-16">
              How Zidwell Receipts Work
            </h2>

            <div className="max-w-4xl mx-auto grid gap-6 sm:grid-cols-2">
              {[
                {
                  icon: FileText,
                  step: "1",
                  title: "Create Invoice or Payment Page",
                  description: "Send an invoice or share your payment page link.",
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
                  description: "Zidwell instantly generates a professional receipt.",
                },
                {
                  icon: Send,
                  step: "4",
                  title: "Receipt is Sent",
                  description: "The customer receives it via email, while you just sit and watch Zidwell work for you.",
                },
              ].map((item, index) => (
                <div
                  key={item.step}
                  className="relative p-6 bg-white dark:bg-[#14261f] border-2 border-[#034835] dark:border-[#e4c644] rounded-none shadow-[4px_4px_0px_#034835] dark:shadow-[4px_4px_0px_#e4c644]"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="h-12 w-12 rounded-none flex items-center justify-center bg-[#e4c644] text-[#034835] font-bold text-xl border-2 border-[#034835] dark:border-[#f5f0e6]">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-bold text-[#034835] dark:text-[#f5f0e6]">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-[#0a3b2d] dark:text-[#c9bfa8] ml-16">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-center mt-10 text-lg font-semibold text-[#034835] dark:text-[#e4c644]">
              👉 No extra steps required from you
            </p>
          </div>
        </section>

        {/* 4. AUTOMATION FEATURES */}
        <section className="py-16 sm:py-24 bg-[#f0ebe0] dark:bg-[#0a1a14]">
          <div className="container">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-[#034835] dark:text-[#f5f0e6] mb-16">
              Fully Automated Receipt System
            </h2>

            <div className="max-w-4xl mx-auto grid gap-6 sm:grid-cols-2">
              {[
                {
                  icon: Mail,
                  title: "Invoice Payments",
                  description: "Receipts are automatically created and sent when an invoice is paid.",
                  color: "bg-[#034835]",
                },
                {
                  icon: CreditCard,
                  title: "Payment Pages",
                  description: "Every payment made through your payment page gets an instant receipt.",
                  color: "bg-[#034835]",
                },
                {
                  icon: FileText,
                  title: "Manual Receipts (Optional)",
                  description: "You can still create receipts manually for transactions outside our platform — we got you covered either way.",
                  color: "bg-[#e4c644]",
                },
                {
                  icon: Zap,
                  title: "Instant Delivery",
                  description: "Customers receive receipts immediately after payment.",
                  color: "bg-[#e4c644]",
                },
              ].map((feature, index) => (
                <div
                  key={feature.title}
                  className="p-6 bg-white dark:bg-[#14261f] border-2 border-[#034835] dark:border-[#e4c644] rounded-none shadow-[2px_2px_0px_#034835] dark:shadow-[2px_2px_0px_#e4c644] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`h-10 w-10 rounded-none flex items-center justify-center mb-4 ${feature.color} border-2 border-[#034835] dark:border-[#f5f0e6]`}>
                    <feature.icon className="h-5 w-5 text-[#f5f0e6]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#034835] dark:text-[#f5f0e6] mb-2">
                     {feature.title}
                  </h3>
                  <p className="text-sm text-[#0a3b2d] dark:text-[#c9bfa8] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. WHAT YOUR RECEIPTS INCLUDE */}
        <section className="py-16 sm:py-24">
          <div className="container">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-[#034835] dark:text-[#f5f0e6] mb-4">
              Professional & Secure Receipts
            </h2>
            <p className="text-center text-[#0a3b2d] dark:text-[#c9bfa8] mb-16 max-w-lg mx-auto">
              Every receipt is clean, branded, and verifiable.
            </p>

            <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
                  className="flex flex-col items-center text-center p-4 bg-white dark:bg-[#14261f] border-2 border-[#c9bfa8] dark:border-[#0a3b2d] rounded-none hover:border-[#034835] dark:hover:border-[#e4c644] transition-colors"
                >
                  <div className="h-10 w-10 rounded-none flex items-center justify-center bg-[#034835]/10 dark:bg-[#e4c644]/10 mb-3">
                    <item.icon className="h-5 w-5 text-[#034835] dark:text-[#e4c644]" />
                  </div>
                  <span className="text-sm font-medium text-[#034835] dark:text-[#f5f0e6]">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. WHY THIS MATTERS */}
        <section className="py-16 sm:py-24 bg-[#034835] text-[#f5f0e6]">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
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
                    className="flex items-center gap-3 p-4 rounded-none border-2 border-[#e4c644]/30 bg-[#e4c644]/5"
                  >
                    <item.icon className="h-6 w-6 text-[#e4c644] shrink-0" />
                    <span className="font-medium text-lg">{item.text}</span>
                  </div>
                ))}
              </div>

              <p className="text-center mt-10 text-sm opacity-70 italic">
                "You don't want to start looking for receipts when tax officials ask."
              </p>
            </div>
          </div>
        </section>

        {/* 7. PRICING */}
        <section id="pricing" className="py-16 sm:py-24">
          <div className="container">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-[#034835] dark:text-[#f5f0e6] mb-4">
              Simple Subscription Pricing
            </h2>
            <p className="text-center text-[#0a3b2d] dark:text-[#c9bfa8] mb-16">
               Receipts are generated automatically — no extra charges per receipt.
            </p>

            <div className="max-w-4xl mx-auto grid gap-6 sm:grid-cols-3">
              {/* Free Trial */}
              <div className="p-6 bg-white dark:bg-[#14261f] border-2 border-[#034835] dark:border-[#e4c644] rounded-none shadow-[2px_2px_0px_#034835] dark:shadow-[2px_2px_0px_#e4c644] flex flex-col">
                <div className="h-10 w-10 rounded-none flex items-center justify-center bg-[#034835]/10 text-[#034835] dark:text-[#e4c644] font-bold mb-4 border-2 border-[#034835] dark:border-[#e4c644]">
                  
                </div>
                <h3 className="text-xl font-bold text-[#034835] dark:text-[#f5f0e6] mb-1">
                  Free Trial
                </h3>
                <p className="text-sm text-[#0a3b2d] dark:text-[#c9bfa8] mb-4">1 Month</p>
                <div className="text-3xl font-bold text-[#034835] dark:text-[#f5f0e6] mb-6">
                  ₦0
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-sm text-[#0a3b2d] dark:text-[#c9bfa8]">
                    <CheckCircle2 className="h-4 w-4 text-[#034835] dark:text-[#e4c644]" />
                    10 Receipts
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[#0a3b2d] dark:text-[#c9bfa8]">
                    <CheckCircle2 className="h-4 w-4 text-[#034835] dark:text-[#e4c644]" />
                    Full access to features
                  </li>
                </ul>
                <Link href="/dashboard/services/receipt">
                  <Button className="w-full rounded-none border-2 border-[#034835] bg-[#034835] text-[#f5f0e6] font-bold shadow-[2px_2px_0px_#034835] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                    Start Free Trial
                  </Button>
                </Link>
              </div>

              {/* Standard */}
              <div className="p-6 bg-white dark:bg-[#14261f] border-2 border-[#e4c644] rounded-none shadow-[4px_4px_0px_#e4c644] flex flex-col relative">
                <div className="absolute -top-3 left-4 px-3 py-0.5 bg-[#e4c644] text-[#034835] text-xs font-bold border-2 border-[#034835] dark:border-[#f5f0e6]">
                  POPULAR
                </div>
                <div className="h-10 w-10 rounded-none flex items-center justify-center bg-[#e4c644]/10 text-[#e4c644] font-bold mb-4 border-2 border-[#e4c644]">
                  
                </div>
                <h3 className="text-xl font-bold text-[#034835] dark:text-[#f5f0e6] mb-1">
                  Standard
                </h3>
                <p className="text-sm text-[#0a3b2d] dark:text-[#c9bfa8] mb-4">Monthly</p>
                <div className="text-3xl font-bold text-[#034835] dark:text-[#f5f0e6] mb-6">
                  ₦4,900<span className="text-base font-normal text-[#0a3b2d] dark:text-[#c9bfa8]">/mo</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-sm text-[#0a3b2d] dark:text-[#c9bfa8]">
                    <CheckCircle2 className="h-4 w-4 text-[#e4c644]" />
                    20 Receipts
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[#0a3b2d] dark:text-[#c9bfa8]">
                    <CheckCircle2 className="h-4 w-4 text-[#e4c644]" />
                    Automated receipts
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[#0a3b2d] dark:text-[#c9bfa8]">
                    <CheckCircle2 className="h-4 w-4 text-[#e4c644]" />
                    Invoice & payment page integration
                  </li>
                </ul>
                <Link href="/pricing">
                  <Button className="w-full rounded-none border-2 border-[#034835] bg-[#e4c644] text-[#034835] font-bold shadow-[2px_2px_0px_#034835] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                    Get Started
                  </Button>
                </Link>
              </div>

              {/* Pro */}
              <div className="p-6 bg-white dark:bg-[#14261f] border-2 border-[#034835] dark:border-[#e4c644] rounded-none shadow-[2px_2px_0px_#034835] dark:shadow-[2px_2px_0px_#e4c644] flex flex-col">
                <div className="h-10 w-10 rounded-none flex items-center justify-center bg-[#e4c644]/10 text-[#e4c644] font-bold mb-4 border-2 border-[#e4c644]">
                  
                </div>
                <h3 className="text-xl font-bold text-[#034835] dark:text-[#f5f0e6] mb-1">
                  Pro
                </h3>
                <p className="text-sm text-[#0a3b2d] dark:text-[#c9bfa8] mb-4">Monthly</p>
                <div className="text-3xl font-bold text-[#034835] dark:text-[#f5f0e6] mb-6">
                  ₦9,900<span className="text-base font-normal text-[#0a3b2d] dark:text-[#c9bfa8]">/mo</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-sm text-[#0a3b2d] dark:text-[#c9bfa8]">
                    <CheckCircle2 className="h-4 w-4 text-[#e4c644]" />
                    Unlimited Receipts
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[#0a3b2d] dark:text-[#c9bfa8]">
                    <CheckCircle2 className="h-4 w-4 text-[#e4c644]" />
                    Full automation
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[#0a3b2d] dark:text-[#c9bfa8]">
                    <CheckCircle2 className="h-4 w-4 text-[#e4c644]" />
                    No limits
                  </li>
                </ul>
                <Link href="/pricing">
                  <Button className="w-full rounded-none border-2 border-[#034835] bg-[#034835] text-[#f5f0e6] font-bold shadow-[2px_2px_0px_#034835] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t-2 border-[#034835] dark:border-[#e4c644] py-8 bg-[#034835] text-[#f5f0e6]">
          <div className="container text-center">
            <p className="text-sm opacity-80">
              Powered by{" "}
              <a
                href="https://zidwell.com"
                className="font-bold text-[#e4c644] hover:underline"
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