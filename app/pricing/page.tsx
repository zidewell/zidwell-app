"use client";

import { useState, useEffect, Suspense } from "react";
import {
  Check,
  Sparkles,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSubscription } from "../hooks/useSubscripion";
import { useUserContextData } from "../context/userData";
import { SubscriptionBadge } from "../components/subscription-components/subscriptionBadges";
import Footer from "../components/home-component-old/Footer";
import { Button } from "../components/ui/button";
import Header from "../components/home-component-old/Header";

const plans = [
  {
    name: "Free",
    tier: "free",
    tagline: "Start Managing Your Money",
    price: "₦0",
    altPrice: "$0",
    suffix: "/month",
    note: "For individuals and early-stage freelancers.",
    region: "global",
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
    amount: 0,
  },
  {
    name: "Solopreneur",
    tier: "solopreneur",
    tagline: "Get Organized",
    price: "₦4,900",
    altPrice: "$3.99",
    suffix: "/month",
    yearlyPrice: "₦49,000/year (save ₦9,800)",
    yearlyAmount: 49000,
    note: "For freelancers and solo business owners.",
    region: "global",
    features: [
      "Everything in Free, plus:",
      "Up to 10 invoices",
      "Unlimited receipts",
      "Branded invoices",
      "Better expense tracking",
      "Basic financial insights",
    ],
    cta: "Go Solopreneur",
    featured: false,
    amount: 4900,
  },
  {
    name: "SME",
    tier: "sme",
    tagline: "Run Your Business Properly",
    price: "₦29,900",
    altPrice: "$21.99",
    suffix: "/month",
    yearlyPrice: "₦299,000/year (save ₦59,800)",
    yearlyAmount: 299000,
    note: "For growing small businesses.",
    region: "global",
    features: [
      "Everything in Solopreneur, plus:",
      "Upload bank statements (PDF / Excel / CSV)",
      "Connect up to 3 bank accounts — Nigeria",
      "Auto-bookkeeping from connected accounts — Nigeria",
      "Unlimited invoices & receipts",
      "Vault — store financial documents safely",
      "Tax calculator",
      "Financial statements (view): P&L · Cashflow · Balance Sheet",
      "1 extra team member",
    ],
    cta: "Go SME",
    featured: true,
    amount: 29900,
  },
  {
    name: "Enterprise",
    tier: "enterprise",
    tagline: "Team Business Management",
    price: "₦100,000",
    altPrice: "$75",
    suffix: "/month",
    yearlyPrice: "₦1,000,000/year (save ₦200,000)",
    yearlyAmount: 1000000,
    note: "For teams that need structure.",
    region: "global",
    features: [
      "Everything in SME, plus:",
      "Multi-user access (full team)",
      "Role-based permissions",
      "Approvals for payments, invoices, receipts, transfers",
      "Connect up to 5 bank accounts — Nigeria",
      "Downloadable financial reports",
      "10 contracts",
      "Dedicated onboarding support",
    ],
    cta: "Go Enterprise",
    featured: false,
    amount: 100000,
  },
  {
    name: "Corporation",
    tier: "corporation",
    tagline: "Full Business Finance System",
    price: "₦300,000",
    altPrice: "$220",
    suffix: "/month",
    yearlyPrice: "₦3,000,000/year (save ₦600,000)",
    yearlyAmount: 3000000,
    note: "For large organizations and structured companies.",
    region: "global",
    features: [
      "Everything in Enterprise, plus:",
      "Unlimited contracts",
      "Department-based access (HR, Finance, Ops…)",
      "Connect unlimited bank accounts — Nigeria",
      "Simple payroll system",
      "Advanced financial reporting",
      "Custom financial structure setup",
      "Priority onboarding & dedicated account manager",
    ],
    cta: "Talk to Sales",
    featured: false,
    amount: 300000,
  },
];

function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { subscription, loading } = useSubscription();
  const { userData } = useUserContextData();

  const [selectedBilling, setSelectedBilling] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [processingTier, setProcessingTier] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upgradeParam = searchParams?.get("upgrade");

  useEffect(() => {
    const paymentStatus = searchParams?.get("payment");
    if (paymentStatus === "success") {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } else if (paymentStatus === "failed") {
      setError("Payment failed. Please try again.");
      setTimeout(() => setError(null), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    if (upgradeParam && plans.some((p) => p.tier === upgradeParam)) {
      const element = document.getElementById("pricing");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [upgradeParam]);

  // Handle callback after login
  useEffect(() => {
    const upgradePlan = searchParams?.get("upgrade");
    const billingParam = searchParams?.get("billing");

    if (upgradePlan && userData?.id) {
      if (billingParam === "yearly") {
        setSelectedBilling("yearly");
      }

      const plan = plans.find((p) => p.tier === upgradePlan);
      if (plan && plan.tier !== "free" && plan.tier !== "corporation") {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
        handleSubscribe(plan);
      }
    }
  }, [searchParams, userData?.id]);

  const handleSubscribe = async (plan: (typeof plans)[0]) => {
    if (plan.tier === "free") {
      router.push("/dashboard");
      return;
    }

    if (plan.tier === "corporation") {
      window.location.href =
        "mailto:sales@zidwell.com?subject=Corporation%20Plan%20Inquiry";
      return;
    }

    if (!userData?.id) {
      const callbackUrl = `/pricing?upgrade=${plan.tier}&billing=${selectedBilling}`;
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    setProcessingTier(plan.tier);
    setError(null);

    try {
      const amount =
        selectedBilling === "yearly" && plan.yearlyAmount
          ? plan.yearlyAmount
          : plan.amount;

      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planTier: plan.tier,
          amount,
          billingPeriod: selectedBilling,
          userEmail: userData.email,
          userId: userData.id,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create checkout");
      }

      window.location.href = data.checkoutLink;
    } catch (error: any) {
      console.error("Subscription error:", error);
      setError(error.message || "An error occurred. Please try again.");
      setProcessingTier(null);
    }
  };

  const isCurrentPlan = (tier: string) => {
    return subscription?.tier === tier && subscription?.status === "active";
  };

  return (
    <>
      <Header />
      <section id="pricing" className="py-20 md:py-32 bg-[var(--bg-primary)]">
        <div className="container mx-auto px-4">
          {/* Success Message */}
          {showSuccess && (
            <div className="fixed top-4 right-4 z-50 bg-[var(--color-accent-yellow)] text-[var(--color-ink)] px-6 py-3 rounded-xl shadow-pop animate-slideIn">
              <p className="font-bold">✓ Payment successful!</p>
              <p className="text-sm">Your subscription has been activated.</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="fixed top-4 right-4 z-50 bg-[#EF4444] text-white px-6 py-3 rounded-xl shadow-pop animate-slideIn">
              <p className="font-bold">✗ Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-[var(--text-primary)]">
              Simple plans that{" "}
              <span className="text-[var(--color-accent-yellow)]">grow</span> with you
            </h2>
            <p className="text-lg text-[var(--text-secondary)]">
              Choose the plan that matches your business goals. Each plan is a
              clear upgrade in capability, not just more limits.
            </p>

            {/* Back Button */}
            <div className="mt-4">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-[var(--color-accent-yellow)] hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>

            {/* Current Plan Display */}
            {subscription && subscription.tier !== "free" && (
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-yellow)]/10 rounded-full">
                <span className="text-sm text-[var(--text-primary)]">
                  Current Plan:
                </span>
                <SubscriptionBadge />
              </div>
            )}

            {/* Billing Toggle */}
            <div className="flex items-center justify-center mt-8">
              <div className="bg-[var(--bg-secondary)] p-1 rounded-full border-2 border-[var(--border-color)]">
                <button
                  onClick={() => setSelectedBilling("monthly")}
                  disabled={processingTier !== null}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedBilling === "monthly"
                      ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)]"
                      : "text-[var(--text-primary)] hover:text-[var(--text-primary)]/80"
                  } disabled:opacity-50`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setSelectedBilling("yearly")}
                  disabled={processingTier !== null}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedBilling === "yearly"
                      ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)]"
                      : "text-[var(--text-primary)] hover:text-[var(--text-primary)]/80"
                  } disabled:opacity-50`}
                >
                  Yearly <span className="text-xs ml-1">Save up to 20%</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-6">
            {plans.map((plan) => {
              const currentPlan = isCurrentPlan(plan.tier);
              const isUpgrade = upgradeParam === plan.tier;
              const isProcessing = processingTier === plan.tier;
              const isFeatured = plan.featured;

              return (
                <div
                  key={plan.tier}
                  id={`plan-${plan.tier}`}
                  className={`relative flex flex-col p-6 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150 rounded-2xl ${
                    isFeatured
                      ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)] border-2 border-[var(--border-color)] shadow-[6px_6px_0px_var(--border-color)]"
                      : "bg-[var(--bg-primary)] border-2 border-[var(--border-color)] shadow-[4px_4px_0px_var(--border-color)]"
                  } ${isUpgrade ? "ring-4 ring-[var(--color-accent-yellow)] ring-opacity-50" : ""}`}
                >
                  {isFeatured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[var(--border-color)] text-[var(--text-primary)] text-xs font-bold flex items-center gap-1 rounded-full">
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
                        isFeatured ? "text-[var(--color-ink)]" : "text-[var(--text-primary)]"
                      }`}
                    >
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-3xl font-black ${
                          isFeatured ? "text-[var(--color-ink)]" : "text-[var(--text-primary)]"
                        }`}
                      >
                        {selectedBilling === "yearly" && plan.yearlyAmount
                          ? `₦${plan.yearlyAmount.toLocaleString()}`
                          : plan.price}
                      </span>
                      <span
                        className={`text-sm ${
                          isFeatured ? "text-[var(--color-ink)]/70" : "text-[var(--text-secondary)]"
                        }`}
                      >
                        {selectedBilling === "yearly" ? "/year" : plan.suffix}
                      </span>
                    </div>
                    {selectedBilling === "yearly" && plan.yearlyPrice && (
                      <p
                        className={`text-xs mt-1 ${
                          isFeatured ? "text-[var(--color-ink)]/70" : "text-[var(--text-secondary)]"
                        }`}
                      >
                        {plan.yearlyPrice}
                      </p>
                    )}
                    <p
                      className={`text-sm mt-3 ${
                        isFeatured ? "text-[var(--color-ink)]/80" : "text-[var(--text-secondary)]"
                      }`}
                    >
                      {plan.note}
                    </p>
                  </div>

                  <ul className="space-y-2 mb-8 grow">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        {!feature.startsWith("Everything in") && (
                          <Check
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              isFeatured ? "text-[var(--color-ink)]" : "text-[var(--color-accent-yellow)]"
                            }`}
                          />
                        )}
                        <span
                          className={`${
                            isFeatured ? "text-[var(--color-ink)]" : "text-[var(--text-primary)]"
                          } ${feature.startsWith("Everything in") ? "font-medium" : ""}`}
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
                        ? "bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] border-2 border-[var(--border-color)]"
                        : "bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90"
                    }`}
                    onClick={() => handleSubscribe(plan)}
                    disabled={loading || isProcessing || currentPlan}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : currentPlan ? (
                      "Current Plan"
                    ) : (
                      plan.cta
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
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
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent-yellow)]" />
        </div>
      }
    >
      <PricingPage />
    </Suspense>
  );
}