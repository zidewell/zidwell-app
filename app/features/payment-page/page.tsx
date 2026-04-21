import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Link2, BarChart3, Shield } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";

function page() {
  const router = useRouter();

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
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="container py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e1bf46]/20 text-[#023528] dark:text-[#f5f5f5] text-sm font-medium mb-6">
            <Zap className="h-3.5 w-3.5" />
            New Feature
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6 text-[#141414] dark:text-[#f5f5f5]">
            Create a Payment Page.
            <br />
            <span className="text-[#e1bf46]">Collect Money Instantly.</span>
          </h1>
          <p className="text-lg md:text-xl text-[#6b6b6b] dark:text-[#a6a6a6] max-w-xl mx-auto mb-10">
            Set up a beautiful payment page in 2 minutes. Share on WhatsApp.
            Start collecting school fees, service payments, event tickets —
            anything.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="default"
              size="lg"
              className="text-base px-8 py-6"
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
              className="text-base px-8 py-6"
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
          className="flex flex-wrap justify-center gap-3 mt-14"
        >
          {useCases.map((u) => (
            <span
              key={u.label}
              className="px-4 py-2 rounded-full bg-[#f9f6ef] dark:bg-[#121212] border border-[#ded4c3] dark:border-[#474747] text-sm font-medium text-[#141414] dark:text-[#f5f5f5]"
            >
              {u.emoji} {u.label}
            </span>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="container py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-[#141414] dark:text-[#f5f5f5]">
          How It Works
        </h2>
        <p className="text-[#6b6b6b] dark:text-[#a6a6a6] text-center mb-14 max-w-md mx-auto">
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
              className="relative p-6 rounded-2xl bg-[#f9f6ef] dark:bg-[#121212] border border-[#ded4c3] dark:border-[#474747] group hover:border-[#e1bf46] transition-colors"
            >
              <span className="text-5xl font-['Space_Grotesk',sans-serif] font-bold text-[#e1bf46]/30 group-hover:text-[#e1bf46]/50 transition-colors">
                {s.num}
              </span>
              <h3 className="text-xl font-bold mt-3 mb-2 text-[#141414] dark:text-[#f5f5f5]">
                {s.title}
              </h3>
              <p className="text-[#6b6b6b] dark:text-[#a6a6a6] text-sm leading-relaxed">
                {s.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-14 text-[#141414] dark:text-[#f5f5f5]">
          Everything You Need
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-[#f9f6ef] dark:bg-[#121212] border border-[#ded4c3] dark:border-[#474747] text-center"
            >
              <div className="h-12 w-12 rounded-xl bg-[#e1bf46]/20 flex items-center justify-center mx-auto mb-4">
                <f.icon className="h-6 w-6 text-[#023528] dark:text-[#e1bf46]" />
              </div>
              <h3 className="font-bold mb-1 text-[#141414] dark:text-[#f5f5f5]">
                {f.title}
              </h3>
              <p className="text-sm text-[#6b6b6b] dark:text-[#a6a6a6]">
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
          className="max-w-2xl mx-auto text-center p-10 md:p-16 rounded-3xl bg-[#034936] dark:bg-[#023528] text-[#f7f0e2]"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to start collecting payments?
          </h2>
          <p className="text-[#f7f0e2]/70 mb-8">
            Join thousands of freelancers, schools, and vendors already using
            Zidwell Pay.
          </p>
          <Button
            variant="default"
            size="lg"
            className="text-base px-10 py-6 bg-[#e1bf46] text-[#023528] hover:bg-[#e1bf46]/90"
            onClick={() => router.push("/dashboard/services/payment/create")}
          >
            Create Your First Page
            <ArrowRight className="h-5 w-5 ml-1" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#ded4c3] dark:border-[#474747] py-8">
        <div className="container text-center text-sm text-[#6b6b6b] dark:text-[#a6a6a6]">
          © 2026 Zidwell. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

export default page;
