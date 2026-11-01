// app/components/home-component/ZidStorePricing.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2, Sparkles } from "lucide-react";

type Billing = "monthly" | "yearly";

type Plan = {
  tier: "starter" | "sme" | "enterprise" | "booster";
  name: string;
  tagline: string;
  monthly: string;
  yearly: string;
  features: string[];
  cta: string;
  featured: boolean;
};

const PLANS: Plan[] = [
  {
    tier: "starter",
    name: "Starter",
    tagline: "For getting started",
    monthly: "Free",
    yearly: "Free",
    features: [
      "Online store",
      "Product images",
      "Payment links",
      "Basic bookkeeping",
      "Basic tax manager",
    ],
    cta: "Start Now",
    featured: false,
  },
  {
    tier: "sme",
    name: "SME",
    tagline: "For growing stores",
    monthly: "₦9,900",
    yearly: "₦99,900",
    features: [
      "Everything in Starter",
      "Product videos",
      "WhatsApp notifications",
      "CRM",
      "Customized customer emails",
      "Advanced bookkeeping + tax",
      "Invoicing + receipts",
    ],
    cta: "Subscribe",
    featured: true,
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    tagline: "For serious sellers",
    monthly: "₦29,900",
    yearly: "₦299,900",
    features: [
      "Everything in SME",
      "Turbo bookkeeping + tax",
      "Priority support",
      "Customized customer emails",
    ],
    cta: "Subscribe",
    featured: false,
  },
  {
    tier: "booster",
    name: "Booster",
    tagline: "For aggressive growth",
    monthly: "From ₦200,000",
    yearly: "From ₦2,400,000*",
    features: [
      "Everything in Enterprise",
      "Managed advertising",
      "Facebook / Instagram / Google / YouTube Ads",
      "Dedicated account manager",
    ],
    cta: "Talk to Sales",
    featured: false,
  },
];

export function ZidStorePricing() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [billing, setBilling] = useState<Billing>("monthly");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [pulsingTier, setPulsingTier] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  const sectionRef = useRef<HTMLElement>(null);

  // Guard so the auto-checkout only fires once per mount.
  const autoTriggeredRef = useRef(false);
  // Guard so the login redirect only fires once per mount.
  const redirectingToLoginRef = useRef(false);

  const handleSubscribe = async (tier: Plan["tier"], period: Billing) => {
    // Booster → mailto
    if (tier === "booster") {
      window.location.href =
        "mailto:sales@zidwell.com?subject=ZidStore%20Booster%20Inquiry";
      return;
    }

    // Starter (free) → dashboard
    if (tier === "starter") {
      router.push("/dashboard/services/payment/dashboard");
      return;
    }

    // SME / Enterprise → checkout
    setLoadingTier(tier);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/store/zidstore-subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planTier: tier, billingPeriod: period }),
      });

      // ── 401 → genuinely not logged in → redirect once ──
      if (res.status === 401) {
        if (redirectingToLoginRef.current) return;
        redirectingToLoginRef.current = true;

        const callbackUrl = `/online-store?subscribe=${tier}&period=${period}`;
        router.push(
          `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
        );
        return;
      }

      const data = await res.json();

      if (!res.ok || !data.success || !data.authorization_url) {
        throw new Error(data?.error || "Could not start checkout");
      }

      window.location.href = data.authorization_url;
    } catch (err: any) {
      console.error("[ZidStorePricing] checkout error:", err);
      setErrorMsg(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  };

  // ── Auto-trigger checkout after returning from login ──
  useEffect(() => {
    const subscribeTier = searchParams.get("subscribe");
    const subscribePeriod = searchParams.get("period") as Billing | null;

    // Show a friendly notice if the user came back from a cancelled/abandoned checkout.
    const paymentStatus = searchParams.get("status");
    const subscribed = searchParams.get("subscribed");
    if (paymentStatus === "cancelled" || paymentStatus === "failed") {
      setNoticeMsg(
        paymentStatus === "cancelled"
          ? "Checkout cancelled. You can try again whenever you're ready."
          : "Payment failed. Please try again or contact support.",
      );
    } else if (subscribed === "1") {
      setNoticeMsg(
        "Thanks! Your payment is being confirmed. You'll receive an email shortly.",
      );
    }

    // Nothing else to do if there's no subscribe param.
    if (!subscribeTier) return;

    // Guard against remounts.
    if (autoTriggeredRef.current) return;
    autoTriggeredRef.current = true;

    // ⚠️ IMMEDIATELY strip the trigger params from the URL so that
    // cancelling Paystack / refreshing / navigating back won't re-fire.
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("subscribe");
      url.searchParams.delete("period");
      url.searchParams.delete("subscribed");
      url.searchParams.delete("plan");
      url.searchParams.delete("status");
      window.history.replaceState({}, "", url.toString());
    }

    if (subscribePeriod === "monthly" || subscribePeriod === "yearly") {
      setBilling(subscribePeriod);
    }

    setTimeout(() => {
      sectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setPulsingTier(subscribeTier);

      setTimeout(() => {
        void handleSubscribe(
          subscribeTier as Plan["tier"],
          (subscribePeriod as Billing) || "monthly",
        );
        setPulsingTier(null);
      }, 900);
    }, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <section
      id="zidstore-pricing"
      ref={sectionRef}
      className="py-24 sm:py-32 bg-(--bg-primary)"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent-yellow)] mb-3">
            ZidStore Pricing
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-(--text-primary)">
            Pick a plan. Sell online today.
          </h2>
          <p className="mt-4 text-(--text-secondary)">
            Simple pricing built for African businesses. Upgrade anytime.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mt-8 flex items-center justify-center">
          <div className="inline-flex items-center p-1 rounded-full bg-(--bg-secondary) border border-(--border-color)">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                billing === "monthly"
                  ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)]"
                  : "text-(--text-secondary) hover:text-(--text-primary)"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling("yearly")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                billing === "yearly"
                  ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)]"
                  : "text-(--text-secondary) hover:text-(--text-primary)"
              }`}
            >
              Yearly{" "}
              <span className="text-[10px] ml-1 opacity-80">Save 17%</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-6 max-w-lg mx-auto rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-300 text-sm px-4 py-3">
            {errorMsg}
          </div>
        )}

        {noticeMsg && !errorMsg && (
          <div className="mt-6 max-w-lg mx-auto rounded-lg border border-[var(--color-accent-yellow)]/40 bg-[var(--color-accent-yellow)]/10 text-(--text-primary) text-sm px-4 py-3">
            {noticeMsg}
          </div>
        )}

        {/* Plans grid */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const isLoading = loadingTier === plan.tier;
            const isPulsing = pulsingTier === plan.tier;
            const price = billing === "yearly" ? plan.yearly : plan.monthly;

            return (
              <div
                key={plan.tier}
                className={`relative rounded-[28px] p-6 border flex flex-col transition-all duration-300 ${
                  plan.featured
                    ? "bg-[#191919] text-white border-[#191919] shadow-float"
                    : "bg-(--bg-primary) border-(--border-color)"
                } ${
                  isPulsing
                    ? "ring-4 ring-[var(--color-accent-yellow)] scale-[1.03] shadow-2xl"
                    : ""
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-yellow)] text-[#191919] text-[10px] font-bold px-3 py-1">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </div>
                )}

                <p
                  className={`font-display text-xl font-semibold ${
                    plan.featured ? "text-white" : "text-(--text-primary)"
                  }`}
                >
                  {plan.name}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    plan.featured ? "text-white/60" : "text-(--text-secondary)"
                  }`}
                >
                  {plan.tagline}
                </p>

                <div className="mt-5">
                  <p
                    className={`font-display text-3xl font-semibold ${
                      plan.featured ? "text-white" : "text-(--text-primary)"
                    }`}
                  >
                    {price}
                  </p>
                  <p
                    className={`mt-1 text-[11px] ${
                      plan.featured ? "text-white/50" : "text-(--text-secondary)"
                    }`}
                  >
                    {billing === "monthly" ? "/month" : "/year"}
                  </p>
                </div>

                <ul className="mt-6 space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className={`flex items-start gap-2 text-xs leading-snug ${
                        plan.featured ? "text-white/90" : "text-(--text-primary)"
                      }`}
                    >
                      <Check
                        className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                          plan.featured
                            ? "text-[var(--color-accent-yellow)]"
                            : "text-[var(--color-lemon-green)]"
                        }`}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handleSubscribe(plan.tier, billing)}
                  disabled={isLoading}
                  className={`mt-6 inline-flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-semibold transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                    plan.featured
                      ? "bg-[var(--color-accent-yellow)] text-[#191919] hover:opacity-90"
                      : "bg-(--bg-secondary) text-(--text-primary) border border-(--border-color) hover:bg-(--bg-primary)"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
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

        <p className="mt-10 text-center text-xs text-(--text-secondary)">
          * Booster pricing is custom.{" "}
          <a
            href="mailto:sales@zidwell.com"
            className="text-[var(--color-accent-yellow)] hover:underline"
          >
            Contact sales
          </a>{" "}
          for a tailored quote.
        </p>
      </div>
    </section>
  );
}