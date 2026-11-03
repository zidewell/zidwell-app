"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUserContextData } from "@/app/context/userData";
import { useSubscription } from "@/app/hooks/useSubscripion";

// ============================================================
// PLANS — tiers must match /api/subscription/checkout VALID_TIERS
//   free / starter / sme / enterprise
// ============================================================
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
    cta: "Subscribe",
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
    cta: "Subscribe",
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

type Billing = "monthly" | "yearly";

export function PricingNew() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData, loading: userLoading } = useUserContextData();
  const { subscription, loading: subLoading, refetch: refetchSubscription } =
    useSubscription();

  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedBilling, setSelectedBilling] = useState<Billing>("monthly");
  const [highlight, setHighlight] = useState(false);

  const sectionRef = useRef<HTMLElement | null>(null);
  const autoResumedRef = useRef(false);

  // ────────────────────────────────────────────────────────────
  // Sonner toast helper
  // ────────────────────────────────────────────────────────────
  const showToast = (
    message: string,
    variant: "success" | "error" = "error",
  ) => {
    if (variant === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  // ────────────────────────────────────────────────────────────
  // 1. URL params + scroll animation
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    const paymentStatus = searchParams?.get("payment");

    if (paymentStatus === "success") {
      showToast("Subscription activated successfully!", "success");
      refetchSubscription?.();
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      window.history.replaceState({}, "", url.toString());
    } else if (paymentStatus === "failed") {
      showToast("Payment failed. Please try again.", "error");
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      window.history.replaceState({}, "", url.toString());
    }

    const billingParam = searchParams?.get("billing");
    if (billingParam === "yearly" || billingParam === "monthly") {
      setSelectedBilling(billingParam);
    }

    const upgradeParam = searchParams?.get("upgrade");
    const shouldScroll =
      searchParams?.get("scroll") === "pricing" || !!upgradeParam;

    if (shouldScroll && sectionRef.current) {
      requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        setHighlight(true);
        setTimeout(() => setHighlight(false), 1600);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ────────────────────────────────────────────────────────────
  // 2. Auto-resume checkout after login
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (userLoading || subLoading || !userData?.id) return;
    if (autoResumedRef.current) return;

    const upgradeParam = searchParams?.get("upgrade");
    if (!upgradeParam) return;

    const plan = plans.find((p) => p.tier === upgradeParam);
    if (!plan || plan.tier === "free" || plan.tier === "enterprise") return;

    if (subscription?.tier === plan.tier && subscription?.status === "active") {
      return;
    }

    const billingParam = searchParams?.get("billing");
    const billing: Billing =
      billingParam === "yearly" ? "yearly" : "monthly";

    autoResumedRef.current = true;

    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", window.location.pathname);
    }

    setSelectedBilling(billing);
    void startCheckout(plan, billing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.id, userLoading, subLoading, searchParams, subscription?.tier]);

  // ────────────────────────────────────────────────────────────
  // 3. Shared checkout trigger
  // ────────────────────────────────────────────────────────────
  const startCheckout = async (
    plan: (typeof plans)[number],
    billing: Billing,
  ) => {
    setProcessing(plan.tier);

    try {
      const amount =
        billing === "yearly" && plan.yearlyAmount
          ? plan.yearlyAmount
          : plan.amount;

      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planTier: plan.tier,
          amount,
          billingPeriod: billing,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        if (data.logout) {
          const callbackUrl =
            `/pricing?upgrade=${plan.tier}` +
            `&billing=${billing}` +
            `&scroll=pricing`;
          router.push(
            `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
          );
          return;
        }
        throw new Error(data.error || "Checkout failed");
      }
      window.location.href = data.checkoutLink;
    } catch (e: any) {
      showToast(e.message || "Something went wrong.", "error");
      setProcessing(null);
    }
  };

  // ────────────────────────────────────────────────────────────
  // 4. Click handler
  // ────────────────────────────────────────────────────────────
  const handleSubscribe = async (plan: (typeof plans)[number]) => {
    if (plan.tier === "free") {
      router.push("/auth/signup");
      return;
    }

    if (plan.tier === "enterprise") {
      window.location.href = "mailto:sales@zidwell.com";
      return;
    }

    if (userLoading) return;

    if (!userData?.id) {
      const callbackUrl =
        `/pricing?upgrade=${plan.tier}` +
        `&billing=${selectedBilling}` +
        `&scroll=pricing`;
      router.push(
        `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      );
      return;
    }

    await startCheckout(plan, selectedBilling);
  };

  // ────────────────────────────────────────────────────────────
  // Subscription state helpers
  // ────────────────────────────────────────────────────────────
  const isCurrentPlan = (tier: string) =>
    subscription?.tier === tier && subscription?.status === "active";

  const isFreeUser = !subscription || subscription.tier === "free";

  // ────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────
  return (
    <section
      id="pricing"
      ref={sectionRef}
      className={`relative py-28 bg-background overflow-hidden transition-all duration-700 ${
        highlight ? "pricing-highlight" : ""
      }`}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes pricingPulse {
              0%   { box-shadow: 0 0 0 0 rgba(229, 179, 51, 0.55); }
              70%  { box-shadow: 0 0 0 18px rgba(229, 179, 51, 0); }
              100% { box-shadow: 0 0 0 0 rgba(229, 179, 51, 0); }
            }
            @keyframes fadeSlideUp {
              from { opacity: 0; transform: translateY(16px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            #pricing .plan-card {
              animation: fadeSlideUp 500ms ease-out both;
            }
            #pricing .plan-card:nth-child(2) { animation-delay: 80ms; }
            #pricing .plan-card:nth-child(3) { animation-delay: 160ms; }
            #pricing .plan-card:nth-child(4) { animation-delay: 240ms; }
            #pricing.pricing-highlight {
              animation: pricingPulse 1.6s ease-out;
            }
          `,
        }}
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
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

        {/* Billing toggle */}
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
              <span className="text-[10px] ml-1 opacity-80">
                Save up to 20%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl relative">
          {plans.map((plan) => {
            const isProcessing = processing === plan.tier;
            const isYearly = selectedBilling === "yearly";
            const isFree = plan.tier === "free";
            const isCurrent = isCurrentPlan(plan.tier);

            const freeDisabled = isFree && !isFreeUser;
            const disabled =
              isProcessing || userLoading || isCurrent || freeDisabled;

            const displayPrice = isYearly ? plan.yearlyPrice : plan.price;
            const displayAlt = isYearly
              ? plan.yearlyAltPrice
              : plan.altPrice;

            const ctaLabel = isCurrent
              ? "Current Plan"
              : isFree && !isFreeUser
                ? "Included"
                : plan.cta;

            return (
              <div
                key={plan.name}
                className={`plan-card relative squircle-lg p-5 sm:p-6 border transition-all duration-200 flex flex-col ${
                  plan.featured
                    ? "bg-ink text-background border-ink shadow-float"
                    : "bg-background border-border hover:bg-[var(--color-accent-yellow)]/5"
                } ${isCurrent ? "ring-2 ring-primary-custom" : ""}`}
              >
                {plan.featured && !isCurrent && (
                  <div className="absolute -top-4 left-6 rotate-[-2deg] bg-primary-custom text-ink text-[10px] font-semibold px-3 py-1 rounded-full shadow-soft whitespace-nowrap">
                    Most founders start here
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-4 left-6 rotate-[-2deg] bg-leaf text-background text-[10px] font-semibold px-3 py-1 rounded-full shadow-soft whitespace-nowrap">
                    Current Plan
                  </div>
                )}

                <p
                  className={`font-display text-base sm:text-lg font-semibold leading-tight ${
                    plan.featured ? "text-background" : "text-foreground"
                  }`}
                >
                  {plan.name}
                </p>
                <p
                  className={`text-[11px] sm:text-xs mt-1 leading-snug ${
                    plan.featured
                      ? "text-background/60"
                      : "text-muted-foreground"
                  }`}
                >
                  {plan.tagline}
                </p>

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
                      plan.featured
                        ? "text-background/50"
                        : "text-muted-foreground"
                    }`}
                  >
                    {isFree ? "free forever" : `/year · ${displayAlt}`}
                  </p>
                </div>

                <ul className="mt-5 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-[11px] sm:text-xs leading-snug"
                    >
                      <Check
                        className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                          plan.featured
                            ? "text-primary-custom"
                            : "text-leaf"
                        }`}
                      />
                      <span
                        className={
                          plan.featured
                            ? "text-background/90"
                            : "text-foreground"
                        }
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={disabled}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-primary-custom text-ink hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-center"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span>Processing…</span>
                    </>
                  ) : (
                    <span className="leading-tight">{ctaLabel}</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Prices in Naira. Card or bank transfer. Subscribe anytime, cancel
          anytime.
        </p>
      </div>
    </section>
  );
}
