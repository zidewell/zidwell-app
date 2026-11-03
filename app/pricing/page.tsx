// app/pricing/page.tsx
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Check, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useSubscription } from "../hooks/useSubscripion";
import { useUserContextData } from "../context/userData";
import { SubscriptionBadge } from "../components/subscription-components/subscriptionBadges";
import Footer from "../components/home-component/Footer";
import { Button } from "../components/ui/button";
import { Nav } from "../components/home-component/Nav";

// ============================================================
// PLANS — MUST match PricingNew & checkout VALID_TIERS
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
    note: "For solo founders and early-stage businesses.",
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
    note: "For growing small businesses with a small team.",
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
    note: "For organizations with teams and multiple operators.",
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

function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { subscription, loading: subLoading, refetch: refetchSubscription } =
    useSubscription();
  const { userData, loading: userLoading } = useUserContextData();

  const [selectedBilling, setSelectedBilling] = useState<Billing>("monthly");
  const [processingTier, setProcessingTier] = useState<string | null>(null);
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
    setProcessingTier(plan.tier);

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
      console.error("Subscription error:", e);
      showToast(e.message || "An error occurred. Please try again.", "error");
      setProcessingTier(null);
    }
  };

  // ────────────────────────────────────────────────────────────
  // 4. Click handler
  // ────────────────────────────────────────────────────────────
  const handleSubscribe = async (plan: (typeof plans)[number]) => {
    if (plan.tier === "free") {
      router.push("/dashboard");
      return;
    }

    if (plan.tier === "enterprise") {
      window.location.href =
        "mailto:sales@zidwell.com?subject=Enterprise%20Plan%20Inquiry";
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
    <>
      <Nav />
      <section
        id="pricing"
        ref={sectionRef}
        className={`relative py-20 md:py-32 bg-(--bg-primary) overflow-hidden ${
          highlight ? "pricing-highlight" : ""
        }`}
      >
        <style jsx>{`
          @keyframes pricingPulse {
            0% {
              box-shadow: 0 0 0 0 rgba(229, 179, 51, 0.55);
            }
            70% {
              box-shadow: 0 0 0 18px rgba(229, 179, 51, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(229, 179, 51, 0);
            }
          }
          @keyframes fadeSlideUp {
            from {
              opacity: 0;
              transform: translateY(16px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          section :global(.plan-card) {
            animation: fadeSlideUp 500ms ease-out both;
          }
          section :global(.plan-card:nth-child(2)) {
            animation-delay: 80ms;
          }
          section :global(.plan-card:nth-child(3)) {
            animation-delay: 160ms;
          }
          section :global(.plan-card:nth-child(4)) {
            animation-delay: 240ms;
          }
          section:global(.pricing-highlight) {
            animation: pricingPulse 1.6s ease-out;
          }
        `}</style>

        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-(--text-primary)">
              Simple plans that{" "}
              <span className="text-[var(--color-accent-yellow)]">grow</span>{" "}
              with you
            </h2>
            <p className="text-lg text-(--text-secondary)">
              Our Business Toolkit gives you more tools to organize and operate
              your business from anywhere, as it grows.
            </p>

            <div className="mt-4">
              <button
                onClick={() => router.back()}
                className="inline-flex items-start gap-2 text-[var(--color-accent-yellow)] hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>

            {subscription && subscription.tier !== "free" && (
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-yellow)]/10 rounded-full">
                <span className="text-sm text-(--text-primary)">
                  Current Plan:
                </span>
                <SubscriptionBadge />
              </div>
            )}
          </div>

          {/* Billing toggle */}
          <div className="mb-12 flex items-center justify-center">
            <div className="inline-flex items-center p-1 rounded-full bg-(--bg-primary) border-2 border-(--border-color)">
              <button
                type="button"
                onClick={() => setSelectedBilling("monthly")}
                disabled={processingTier !== null}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                  selectedBilling === "monthly"
                    ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)]"
                    : "text-(--text-secondary) hover:text-(--text-primary)"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setSelectedBilling("yearly")}
                disabled={processingTier !== null}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                  selectedBilling === "yearly"
                    ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)]"
                    : "text-(--text-secondary) hover:text-(--text-primary)"
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
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans.map((plan) => {
              const currentPlan = isCurrentPlan(plan.tier);
              const isProcessing = processingTier === plan.tier;
              const isFeatured = plan.featured;
              const isYearly = selectedBilling === "yearly";
              const isFree = plan.tier === "free";
              const isFreeUserNow = isFreeUser;

              const freeDisabled = isFree && !isFreeUserNow;
              const disabled =
                userLoading ||
                subLoading ||
                isProcessing ||
                currentPlan ||
                freeDisabled;

              const displayPrice = isYearly
                ? plan.yearlyPrice
                : plan.price;
              const displayAlt = isYearly
                ? plan.yearlyAltPrice
                : plan.altPrice;

              const ctaLabel = currentPlan
                ? "Current Plan"
                : isFree && !isFreeUserNow
                  ? "Included"
                  : plan.cta;

              return (
                <div
                  key={plan.tier}
                  id={`plan-${plan.tier}`}
                  className={`plan-card relative flex flex-col p-6 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150 rounded-2xl ${
                    isFeatured
                      ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)] border-2 border-(--border-color) shadow-[6px_6px_0px_var(--border-color)]"
                      : "bg-(--bg-primary) border-2 border-(--border-color) shadow-[4px_4px_0px_var(--border-color)]"
                  } ${currentPlan ? "ring-4 ring-[var(--color-ink)]/20" : ""}`}
                >
                  {isFeatured && !currentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[var(--border-color)] text-(--text-primary) text-xs font-bold flex items-center gap-1 rounded-full">
                      <Sparkles className="w-3 h-3" />
                      POPULAR
                    </div>
                  )}

                  {currentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[var(--color-accent-yellow)] text-[var(--color-ink)] text-xs font-bold whitespace-nowrap rounded-full">
                      CURRENT PLAN
                    </div>
                  )}

                  <div className="mb-6">
                    <h3
                      className={`text-xl font-bold mb-2 ${
                        isFeatured
                          ? "text-[var(--color-ink)]"
                          : "text-(--text-primary)"
                      }`}
                    >
                      {plan.name}
                    </h3>
                    <p
                      className={`text-xs mb-3 ${
                        isFeatured
                          ? "text-[var(--color-ink)]/70"
                          : "text-(--text-secondary)"
                      }`}
                    >
                      {plan.tagline}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-3xl font-black ${
                          isFeatured
                            ? "text-[var(--color-ink)]"
                            : "text-(--text-primary)"
                        }`}
                      >
                        {displayPrice}
                      </span>
                      <span
                        className={`text-sm ${
                          isFeatured
                            ? "text-[var(--color-ink)]/70"
                            : "text-(--text-secondary)"
                        }`}
                      >
                        /year
                      </span>
                    </div>
                    <p
                      className={`text-xs mt-1 ${
                        isFeatured
                          ? "text-[var(--color-ink)]/70"
                          : "text-(--text-secondary)"
                      }`}
                    >
                      {isFree ? "free forever" : `or ${displayAlt}/year`}
                    </p>
                    <p
                      className={`text-sm mt-3 ${
                        isFeatured
                          ? "text-[var(--color-ink)]/80"
                          : "text-(--text-secondary)"
                      }`}
                    >
                      {plan.note}
                    </p>
                  </div>

                  <ul className="space-y-2 mb-8 grow">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isFeatured
                              ? "text-[var(--color-ink)]"
                              : "text-[var(--color-accent-yellow)]"
                          }`}
                        />
                        <span
                          className={
                            isFeatured
                              ? "text-[var(--color-ink)]"
                              : "text-(--text-primary)"
                          }
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={isFeatured ? "outline" : "default"}
                    className={`w-full rounded-xl ${
                      isFeatured
                        ? "bg-(--bg-primary) text-(--text-primary) hover:bg-[var(--bg-secondary)] border-2 border-(--border-color)"
                        : "bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90"
                    }`}
                    onClick={() => handleSubscribe(plan)}
                    disabled={disabled}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      ctaLabel
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          <p className="mt-10 text-center text-xs text-(--text-secondary)">
            Prices in Naira. Card or bank transfer. Subscribe anytime, cancel
            anytime.
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
}

export default function Pricing() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-(--bg-primary)">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent-yellow)]" />
        </div>
      }
    >
      <PricingPage />
    </Suspense>
  );
}
