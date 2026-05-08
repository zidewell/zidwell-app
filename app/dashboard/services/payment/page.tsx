// app/page.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Link2, BarChart3, Shield } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/app/components/dashboard-component/DashboardSidebar";
import DashboardHeader from "@/app/components/dashboard-component/DashboardHeader";

const steps = [
  {
    num: "01",
    title: "Create Your Page",
    desc: "Add your product details, images, price — all in one simple flow.",
  },
  {
    num: "02",
    title: "Share Your Link",
    desc: "Get a clean URL. Share on WhatsApp, Instagram, or anywhere.",
  },
  {
    num: "03",
    title: "Collect Money",
    desc: "Customers pay via bank transfer or card. You get instant alerts.",
  },
];

const useCases = [
  { emoji: "🏫", label: "School Fees" },
  { emoji: "🎨", label: "Freelance Services" },
  { emoji: "🎫", label: "Event Tickets" },
  { emoji: "📦", label: "Digital Products" },
  { emoji: "💝", label: "Donations" },
  { emoji: "🏪", label: "Small Business" },
];

const features = [
  {
    icon: Zap,
    title: "Instant Setup",
    desc: "Create a payment page in under 2 minutes",
  },
  {
    icon: Link2,
    title: "Shareable Links",
    desc: "WhatsApp-friendly URLs for easy sharing",
  },
  {
    icon: BarChart3,
    title: "Sales Dashboard",
    desc: "Track views, payments, and revenue",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    desc: "All transactions are encrypted and secure",
  },
];

const Landing = () => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen dark:bg-[#0e0e0e]">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72 min-h-screen flex flex-col">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1">
          {/* Hero */}
          <section className="container py-16 md:py-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-accent-yellow)]/20 text-[var(--color-accent-yellow)] text-sm font-medium mb-6">
                <Zap className="h-3.5 w-3.5" />
                New Feature
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6 text-[var(--text-primary)]">
                Create a Payment Page.
                <br />
                <span className="text-[var(--color-accent-yellow)]">Collect Money Instantly.</span>
              </h1>
              <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-xl mx-auto mb-10">
                Set up a beautiful payment page in 2 minutes. Share on WhatsApp.
                Start collecting school fees, service payments, event tickets
                anything.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="default"
                  size="lg"
                  className="text-base px-8 py-6 bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90"
                  onClick={() =>
                    router.push("/dashboard/services/payment/dashboard")
                  }
                >
                  Create Payment Page
                  <ArrowRight className="h-5 w-5 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-base px-8 py-6 border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                  onClick={() => {
                    document
                      .getElementById("how-it-works")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  See How It Works
                </Button>
              </div>
            </motion.div>

            {/* Use cases */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-wrap justify-center px-5 gap-3 mt-14"
            >
              {useCases.map((u) => (
                <span
                  key={u.label}
                  className="px-4 py-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-primary)]"
                >
                  {u.emoji} {u.label}
                </span>
              ))}
            </motion.div>
          </section>

          {/* How it works */}
          <section id="how-it-works" className="container py-16 md:py-24">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-[var(--text-primary)]">
              How It Works
            </h2>
            <p className="text-[var(--text-secondary)] text-center mb-14 max-w-md mx-auto">
              Three simple steps to start collecting payments
            </p>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {steps.map((s, i) => (
                <motion.div
                  key={s.num}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="relative p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] group hover:border-[var(--color-accent-yellow)] transition-colors"
                >
                  <span className="text-5xl font-['Space_Grotesk',sans-serif] font-bold text-[var(--color-accent-yellow)]/30 group-hover:text-[var(--color-accent-yellow)]/50 transition-colors">
                    {s.num}
                  </span>
                  <h3 className="text-xl font-bold mt-3 mb-2 text-[var(--text-primary)]">
                    {s.title}
                  </h3>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                    {s.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Features */}
          <section id="features" className="container py-16 md:py-24">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-14 text-[var(--text-primary)]">
              Everything You Need
            </h2>
            <div className="px-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center"
                >
                  <div className="h-12 w-12 rounded-xl bg-[var(--color-accent-yellow)]/20 flex items-center justify-center mx-auto mb-4">
                    <f.icon className="h-6 w-6 text-[var(--color-accent-yellow)]" />
                  </div>
                  <h3 className="font-bold mb-1 text-[var(--text-primary)]">
                    {f.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="container py-16 md:py-24">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto text-center p-10 md:p-16 rounded-3xl bg-[var(--color-ink)] text-[var(--bg-secondary)]"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to start collecting payments?
              </h2>
              <p className="text-[var(--bg-secondary)]/70 mb-8">
                Join thousands of freelancers, schools, and vendors already
                using Zidwell Pay.
              </p>
              <Button
                variant="default"
                size="lg"
                className="text-base px-10 py-6 bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90"
                onClick={() =>
                  router.push("/dashboard/services/payment/create")
                }
              >
                Create Your First Page
                <ArrowRight className="h-5 w-5 ml-1" />
              </Button>
            </motion.div>
          </section>

          {/* Footer */}
          <footer className="border-t border-[var(--border-color)] py-8">
            <div className="container text-center text-sm text-[var(--text-secondary)]">
              © 2026 Zidwell. All rights reserved.
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Landing;