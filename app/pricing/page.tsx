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
    name: "FREE",
    tier: "free",
    tagline: "Get a business bank account for free",
    price: "₦0",
    altPrice: "$0",
    suffix: "/month",
    note: "Business Account plan",
    region: "global",
    features: [
      "Business bank account at 0.2% per transaction",
      "Business account activation fee: N1000",
      "Payment links and payment APIs",
      "Available for Nigeria only",
    ],
    cta: "Start Free",
    featured: false,
    amount: 0,
  },

  {
    name: "STARTER",
    tagline: "Become organized",
    tier: "starter",
    amount: 9900,
    yearlyAmount: 99900,
    threeMonthAmount: 29900,
    price: "₦9,900",
    yearlyPrice: "₦99,900/year",
    threeMonthPrice: "₦29,900/3 months",
    altPrice: "$8",
    suffix: "/month",
    note: "Get organized",
    region: "global",
    features: [
      "Everything in Free, plus:",
      "Business Plan Template",
      "Bookkeeping Tool",
      "Invoice Tool",
      "Receipt Tool",
      "Document Vault",
    ],
    cta: "Go STARTER",
    featured: true,
  },

  {
    name: "SME",
    tagline: "Grow with clarity",
    tier: "sme",
    amount: 19900,
    yearlyAmount: 199900,
    threeMonthAmount: 59900,
    price: "₦19,900",
    yearlyPrice: "₦199,900/year",
    threeMonthPrice: "₦59,900/3 months",
    altPrice: "$15",
    suffix: "/month",
    note: "Grow with clarity",
    region: "global",
    features: [
      "Everything in Starter, plus:",
      "Tax tool",
      "Product webpage",
      "One Extra User",
      "Switch between Accounts",
      "Add-ons (additional fee): Payroll, HMO, Tax Filing Support",
    ],
    cta: "Go SME",
    featured: false,
  },
  {
    name: "ENTERPRISE",
    tagline: "Control team operations",
    tier: "enterprise",
    amount: 59900,
    yearlyAmount: 599900,
    threeMonthAmount: 179900,
    price: "₦59,900",
    yearlyPrice: "₦599,900/year",
    threeMonthPrice: "₦179,900/3 months",
    altPrice: "$43",
    suffix: "/month",
    note: "Control team operations",
    region: "global",
    features: [
      "Everything in SME, plus:",
      "Advanced Bookkeeping Tool",
      "Connected bank accounts",
      "Contract Tool",
      "Upload bank statements",
      "Downloadable financial statements",
      "2 Extra Users",
      "Add-ons (additional fee): Payroll, HMO, Tax Filing Support",
    ],
    cta: "Go ENTERPRISE",
    featured: false,
  },
  {
    name: "CONSOLE",
    tagline: "Run a business with multiple outlets",
    tier: "console",
    amount: 0,
    yearlyAmount: 0,
    price: "Custom Pricing",
    altPrice: "",
    suffix: "",
    note: "Custom Pricing for multiple outlets and teams",
    region: "global",
    features: [
      "Sub accounts - create multiple accounts for people and outlets",
      "Multi-users + signatories",
      "Request and Approval workflow",
      "Advanced finance dashboard",
      "Plus every other tool on Zidwell",
    ],
    cta: "Contact Sales",
    featured: false,
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
      if (plan && plan.tier !== "free" && plan.tier !== "console") {
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

    if (plan.tier === "console") {
      window.location.href =
        "mailto:sales@zidwell.com?subject=CONSOLE%20Plan%20Inquiry";
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
                className="inline-flex items-start gap-2 text-[var(--color-accent-yellow)] hover:underline"
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
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
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
