// components/HowItWorks.tsx
"use client";

import {
  UserPlus,
  Wallet,
  TrendingUp,
  ArrowRight,
  Shield,
  Check,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const stepImages = {
  step1:
    "https://images.unsplash.com/photo-1585490931726-a7784b1575a5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YmxhY2slMjBtZW4lMjB3cml0aW5nfGVufDB8fDB8fHww",
  step2:
    "https://images.unsplash.com/photo-1664575198308-3959904fa430?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  step3:
    "https://images.unsplash.com/photo-1579880651719-3cef00eae7de?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTl8fGJsYWNrJTIwbWFufGVufDB8fDB8fHww",
};

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create Your Wallet",
    description:
      "Sign up, verify your identity, and get your Zidwell wallet ready for use in minutes.",
    image: stepImages.step1,
    accent: "warm" as const,
    cta: "Get Started",
  },
  {
    number: "02",
    icon: Wallet,
    title: "Use Zidwell for Everyday Finance",
    description:
      "Pay bills, send money, issue receipts, create contracts, and track your activity — all in one place.",
    image: stepImages.step2,
    accent: "fresh" as const,
    cta: "Explore Features",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Build Financial Structure Over Time",
    description:
      "From cashback rewards to tax support and community learning, Zidwell helps you move from survival to stability, and from stability to growth.",
    image: stepImages.step3,
    accent: "ink" as const,
    cta: "Start Growing",
  },
];

const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden border-t border-[var(--border-color)] bg-[var(--bg-primary)] py-20 md:py-32"
    >
      {/* Background blobs */}
      <div className="absolute -left-32 top-20 -z-10 h-80 w-80 rounded-full bg-[var(--color-accent-yellow)]/20 blur-3xl animate-blob" />
      <div
        className="absolute -right-32 bottom-10 -z-10 h-80 w-80 rounded-full bg-[var(--color-accent-yellow)]/15 blur-3xl animate-blob"
        style={{ animationDelay: "-4s" }}
      />

      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
              Simple Process
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl text-balance text-[var(--text-primary)]">
              How Zidwell{" "}
              <span className="bg-gradient-to-r from-[var(--color-accent-yellow)] to-[var(--color-accent-yellow)] bg-clip-text text-transparent">
                Works
              </span>
            </h2>
          </div>
          <p className="max-w-sm text-sm text-[var(--text-secondary)]">
            Three simple steps to financial clarity. From setup to growth,
            Zidwell handles the structure while you focus on what matters.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            const isInk = step.accent === "ink";
            const isFresh = step.accent === "fresh";
            const isWarm = step.accent === "warm";

            return (
              <div
                key={index}
                className={`reveal hover-lift group relative flex flex-col overflow-hidden rounded-2xl border transition-all hover:shadow-soft ${
                  isInk
                    ? "border-[var(--border-color)] bg-[var(--color-ink)] text-[var(--color-white)]"
                    : "border-[var(--border-color)] bg-[var(--bg-primary)]"
                }`}
              >
                {/* Life-size image */}
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={step.image}
                    alt={`${step.title} illustration`}
                    width={500}
                    height={500}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Gradient overlay */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${
                      isInk
                        ? "from-[var(--color-ink)] via-[var(--color-ink)]/30"
                        : "from-[var(--bg-primary)] via-[var(--bg-primary)]/10"
                    } to-transparent`}
                  />

                  {/* Step Number Badge - Overlay on image */}
                  <div className="absolute left-5 top-5 grid h-12 w-12 place-items-center rounded-xl shadow-soft bg-[var(--color-accent-yellow)] border-2 border-[var(--border-color)]">
                    <span className="font-black text-[var(--color-ink)] text-lg">
                      {step.number}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div
                  className={`flex flex-1 flex-col p-6 ${isInk ? "bg-[var(--color-ink)]" : "bg-[var(--bg-primary)]"}`}
                >
                  {/* Icon */}
                  <div
                    className={`mb-4 grid h-12 w-12 place-items-center rounded-xl shadow-soft ${
                      isInk
                        ? "bg-[var(--color-white)]/10 text-[var(--color-white)]"
                        : "bg-[var(--color-accent-yellow)]/10 text-[var(--color-accent-yellow)]"
                    }`}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>

                  {/* Title */}
                  <h3
                    className={`font-display text-xl font-bold ${isInk ? "text-[var(--color-white)]" : "text-[var(--text-primary)]"}`}
                  >
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p
                    className={`mt-2 text-sm ${isInk ? "text-[var(--color-white)]/75" : "text-[var(--text-secondary)]"}`}
                  >
                    {step.description}
                  </p>

                  {/* CTA Button */}
                  <Link href="/auth/signup" className="mt-auto pt-6">
                    <span
                      className={`group/btn inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold transition-transform hover:-translate-y-0.5 ${
                        isInk
                          ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)]"
                          : isFresh
                            ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)]"
                            : "bg-[var(--color-accent-yellow)] text-[var(--color-ink)]"
                      }`}
                    >
                      {step.cta}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                    </span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Features Footer */}
        <div className="mt-10 rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)]/60 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            Everything included
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Automatic bookkeeping",
              "Built-in tax calculator",
              "Live circles dashboard",
              "Bank-grade security",
              "Unlimited transfers",
              "Receipt & invoice generator",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2.5 text-sm font-medium text-[var(--text-primary)]"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-accent-yellow)] text-[var(--color-ink)]">
                  <Check className="h-3 w-3" />
                </span>
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
