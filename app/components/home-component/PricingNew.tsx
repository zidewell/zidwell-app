"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

const plans = [
  {
    name: "Free",
    tagline: "Start Managing Your Money",
    tier: "free",
    amount: 0,
    yearlyAmount: 0,
    price: "₦0",
    yearlyPrice: "₦0",
    altPrice: "$0",
    yearlyAltPrice: "$0",
    suffix: "",
    note: "For individuals and early-stage freelancers.",
    features: [
      "Manual bookkeeping — Global",
      "Auto-bookkeeping (Wallet users, Nigeria)",
      "Payment Links & Sales pages (Nigeria)",
      "Free business bank account (Nigeria)",
      "Up to 5 invoices — Global",
      "Up to 5 receipts — Global",
      "Basic financial overview",
    ],
    cta: "Start Free",
    featured: false,
  },
  {
    name: "Starter",
    tagline: "If you're a one-person shop.",
    tier: "starter",
    amount: 99900,
    yearlyAmount: 999000,
    price: "₦99,900",
    yearlyPrice: "₦999,000",
    altPrice: "≈ $69",
    yearlyAltPrice: "≈ $690",
    features: [
      "Business bank account",
      "Business plan template",
      "Automatic bookkeeping",
      "Invoice + receipt tools",
      "Online storefront",
      "Document vault",
    ],
    cta: "Start your 7-day trial",
    featured: false,
  },
  {
    name: "SME",
    tagline: "If you have a small team and a real bank account.",
    tier: "sme",
    amount: 199900,
    yearlyAmount: 1999000,
    price: "₦199,900",
    yearlyPrice: "₦1,999,000",
    altPrice: "≈ $139",
    yearlyAltPrice: "≈ $1,390",
    features: [
      "Everything in Starter",
      "International payments",
      "One extra user",
      "Add-ons: Payroll, HMO, Tax Filing",
    ],
    cta: "Start your 7-day trial",
    featured: true,
  },
  {
    name: "Enterprise",
    tagline: "If you have outlets, approvals, and an accountant.",
    tier: "enterprise",
    amount: 599900,
    yearlyAmount: 5999000,
    price: "₦599,900",
    yearlyPrice: "₦5,999,000",
    altPrice: "≈ $419",
    yearlyAltPrice: "≈ $4,190",
    features: [
      "Everything in SME",
      "Increased transaction limits",
      "Connect external bank accounts",
      "Three extra users",
      "Dedicated support",
    ],
    cta: "Talk to sales",
    featured: false,
  },
];

export function PricingNew() {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedBilling, setSelectedBilling] = useState<"monthly" | "yearly">(
    "monthly",
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("payment");
    if (status === "failed") {
      setError("Payment failed. Please try again.");
      setTimeout(() => setError(null), 5000);
    }
  }, []);

  const handleSubscribe = async (plan: (typeof plans)[0]) => {
    if (plan.tier === "free") {
      router.push("/auth/signup");
      return;
    }

    if (plan.tier === "enterprise") {
      window.location.href = "mailto:sales@zidwell.com";
      return;
    }

    setProcessing(plan.tier);
    setError(null);

    try {
      const amount =
        selectedBilling === "yearly" && plan.yearlyAmount
          ? plan.yearlyAmount
          : plan.amount;

      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planTier: plan.tier,
          amount,
          billingPeriod: selectedBilling,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Checkout failed");
      window.location.href = data.checkoutLink;
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
      setProcessing(null);
    }
  };

  return (
    <section id="pricing" className="py-28 bg-background">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {error && (
          <div className="fixed top-4 right-4 z-50 bg-destructive text-destructive-foreground px-5 py-3 rounded-xl shadow-float text-sm">
            {error}
          </div>
        )}

        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-leaf mb-4">
            Pricing
          </p>
          <h2 className="font-narrow-display text-4xl sm:text-5xl font-semibold tracking-tight">
            One bundle. One annual payment.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Our Business Toolkit gives you more tools to organize and operate
            your business from anywhere, as it grows.
          </p>
        </div>

        {/* Billing Toggle — centered */}
        <div className="mt-8 flex items-center justify-center">
          <div className="inline-flex items-center p-1 rounded-full bg-surface border border-border">
            <button
              type="button"
              onClick={() => setSelectedBilling("monthly")}
              disabled={processing !== null}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                selectedBilling === "monthly"
                  ? "bg-primary-custom text-ink"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setSelectedBilling("yearly")}
              disabled={processing !== null}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                selectedBilling === "yearly"
                  ? "bg-primary-custom text-ink"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly{" "}
              <span className="text-[10px] ml-1 opacity-80">Save up to 20%</span>
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl relative">
          {plans.map((plan) => {
            const isProcessing = processing === plan.tier;
            const isYearly = selectedBilling === "yearly";
            const isFree = plan.tier === "free";

            const displayPrice = isYearly ? plan.yearlyPrice : plan.price;
            const displayAlt = isYearly ? plan.yearlyAltPrice : plan.altPrice;

            return (
              <div
                key={plan.name}
                className={`relative squircle-lg p-5 sm:p-6 border transition-all duration-200 flex flex-col ${
                  plan.featured
                    ? "bg-ink text-background border-ink shadow-float"
                    : "bg-background border-border hover:bg-[var(--color-accent-yellow)]/5"
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-4 left-6 rotate-[-2deg] bg-primary-custom text-ink text-[10px] font-semibold px-3 py-1 rounded-full shadow-soft whitespace-nowrap">
                    Most founders start here
                  </div>
                )}

                {/* Plan name + tagline */}
                <p
                  className={`font-display text-base sm:text-lg font-semibold leading-tight ${
                    plan.featured ? "text-background" : "text-foreground"
                  }`}
                >
                  {plan.name}
                </p>
                <p
                  className={`text-[11px] sm:text-xs mt-1 leading-snug ${
                    plan.featured ? "text-background/60" : "text-muted-foreground"
                  }`}
                >
                  {plan.tagline}
                </p>

                {/* Price — responsive so it never overflows */}
                <div className="mt-5 sm:mt-6">
                  <p
                    className={`font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tabular leading-none break-words ${
                      plan.featured ? "text-background" : "text-foreground"
                    }`}
                  >
                    {displayPrice}
                  </p>
                  <p
                    className={`mt-1.5 text-[10px] sm:text-[11px] leading-tight ${
                      plan.featured ? "text-background/50" : "text-muted-foreground"
                    }`}
                  >
                    {isFree ? "free forever" : `/year · ${displayAlt}`}
                  </p>
                </div>

                {/* Features */}
                <ul className="mt-5 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-[11px] sm:text-xs leading-snug"
                    >
                      <Check
                        className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                          plan.featured ? "text-primary-custom" : "text-leaf"
                        }`}
                      />
                      <span
                        className={
                          plan.featured ? "text-background/90" : "text-foreground"
                        }
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA — full width, wraps if long */}
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isProcessing}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-primary-custom text-ink hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-center"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span>Processing…</span>
                    </>
                  ) : (
                    <span className="leading-tight">{plan.cta}</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Prices in Naira. Card or bank transfer. 7-day trial on any plan — no
          card required to start.
        </p>
      </div>
    </section>
  );
}