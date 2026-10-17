// app/components/home-component/PricingNew.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

const plans = [
  {
    name: "Starter",
    tagline: "If you're a one-person shop.",
    tier: "starter",
    amount: 99900,
    price: "₦99,900",
    altPrice: "≈ $69",
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
    price: "₦199,900",
    altPrice: "≈ $139",
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
    price: "₦599,900",
    altPrice: "≈ $419",
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
    if (plan.tier === "enterprise") {
      window.location.href = "mailto:sales@zidwell.com";
      return;
    }
    setProcessing(plan.tier);
    setError(null);
    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planTier: plan.tier,
          amount: plan.amount,
          billingPeriod: "yearly",
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
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        {error && (
          <div className="fixed top-4 right-4 z-50 bg-destructive text-destructive-foreground px-5 py-3 rounded-xl shadow-float text-sm">
            {error}
          </div>
        )}

        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-leaf mb-4">
            Pricing
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">
            One bundle. One annual payment.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Our Business Toolkit gives you more tools to organize and operate
            your business from anywhere, as it grows.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl relative">
          {plans.map((plan) => {
            const isProcessing = processing === plan.tier;
            return (
              <div
                key={plan.name}
                className={`relative squircle-lg p-6 border transition-all duration-200 flex flex-col ${
                  plan.featured
                    ? "bg-ink text-background border-ink shadow-float"
                    : "bg-background border-border hover:bg-[var(--color-accent-yellow)]/5"
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-4 left-6 rotate-[-2deg] bg-primary-custom text-ink text-[10px] font-semibold px-3 py-1 rounded-full shadow-soft">
                    Most founders start here
                  </div>
                )}

                <p
                  className={`font-display text-lg font-semibold ${
                    plan.featured ? "text-background" : "text-foreground"
                  }`}
                >
                  {plan.name}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    plan.featured ? "text-background/60" : "text-muted-foreground"
                  }`}
                >
                  {plan.tagline}
                </p>

                <div className="mt-6">
                  <p
                    className={`font-display text-5xl font-semibold tabular ${
                      plan.featured ? "text-background" : "text-foreground"
                    }`}
                  >
                    {plan.price}
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      plan.featured ? "text-background/50" : "text-muted-foreground"
                    }`}
                  >
                    /year · {plan.altPrice}
                  </p>
                </div>

                <ul className="mt-6 space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check
                        className={`h-4 w-4 mt-0.5 shrink-0 ${
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

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isProcessing}
                  className="mt-6 inline-flex items-center justify-center px-5 py-3 rounded-full text-sm font-semibold bg-primary-custom text-ink hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    plan.cta
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