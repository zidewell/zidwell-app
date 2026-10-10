// app/pricing/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { Check, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSubscription } from "../hooks/useSubscripion";
import { useUserContextData } from "../context/userData";
import { SubscriptionBadge } from "../components/subscription-components/subscriptionBadges";
import Footer from "../components/home-component/Footer";
import { Button } from "../components/ui/button";
import { Nav } from "../components/home-component/Nav";

const plans = [
  {
    name: "Starter",
    tier: "starter",
    tagline: "Start Putting Structure Around Your Business",
    price: "₦99,900",
    altPrice: "$69",
    suffix: "/year",
    yearlyAmount: 99900,
    note: "For solo founders and early-stage businesses.",
    region: "global",
    features: [
      "Business bank account",
      "Business Plan Template",
      "Automatic Bookkeeping",
      "Invoice Tool",
      "Receipt Tool",
      "Online storefront",
      "Document Vault",
    ],
    cta: "Start Your Free Trial",
    featured: false,
    amount: 99900,
  },
  {
    name: "SME",
    tier: "sme",
    tagline: "Run Your Business Properly",
    price: "₦199,900",
    altPrice: "$139",
    suffix: "/year",
    yearlyAmount: 199900,
    note: "For growing small businesses with a small team.",
    region: "global",
    features: [
      "Business bank account",
      "Business Plan Template",
      "Automatic Bookkeeping",
      "Invoice Tool",
      "Receipt Tool",
      "International payments",
      "Online storefront",
      "Document Vault",
      "One Extra User",
    ],
    addons: [
      "Payroll",
      "HMO",
      "Tax Filing Support",
      "Virtual office/mailing address",
    ],
    cta: "Start Your Free Trial",
    featured: true,
    amount: 199900,
  },
  {
    name: "Enterprise",
    tier: "enterprise",
    tagline: "Full Business Finance System",
    price: "₦599,900",
    altPrice: "$419",
    suffix: "/year",
    yearlyAmount: 599900,
    note: "For organizations with teams and multiple operators.",
    region: "global",
    features: [
      "Business bank account",
      "Increased transaction limits",
      "Business Plan Template",
      "Automatic Bookkeeping",
      "Connect Your Bank Accounts",
      "Invoice Tool",
      "Receipt Tool",
      "International payments",
      "Online storefront",
      "Document Vault",
      "Three Extra Users",
      "Dedicated support team",
    ],
    addons: [
      "Payroll",
      "HMO",
      "Tax Filing Support",
      "Virtual office/mailing address",
    ],
    cta: "Start Your Free Trial",
    featured: false,
    amount: 599900,
  },
];

function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { subscription, loading } = useSubscription();
  const { userData } = useUserContextData();

  const [selectedBilling, setSelectedBilling] = useState<"monthly" | "yearly">(
    "yearly",
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
        "mailto:sales@zidwell.com?subject=Console%20Plan%20Inquiry";
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
      const amount = plan.amount;

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
      <Nav />
      <section id="pricing" className="py-20 md:py-32 bg-(--bg-primary)">
        <div className="container mx-auto px-4">
          {showSuccess && (
            <div className="fixed top-4 right-4 z-50 bg-[var(--color-accent-yellow)] text-[var(--color-ink)] px-6 py-3 rounded-xl shadow-pop animate-slideIn">
              <p className="font-bold">✓ Payment successful!</p>
              <p className="text-sm">Your subscription has been activated.</p>
            </div>
          )}

          {error && (
            <div className="fixed top-4 right-4 z-50 bg-[#EF4444] text-white px-6 py-3 rounded-xl shadow-pop animate-slideIn">
              <p className="font-bold">✗ Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

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

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
                      ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)] border-2 border-(--border-color) shadow-[6px_6px_0px_var(--border-color)]"
                      : "bg-(--bg-primary) border-2 border-(--border-color) shadow-[4px_4px_0px_var(--border-color)]"
                  } ${
                    isUpgrade
                      ? "ring-4 ring-[var(--color-accent-yellow)] ring-opacity-50"
                      : ""
                  }`}
                >
                  {isFeatured && (
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
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-3xl font-black ${
                          isFeatured
                            ? "text-[var(--color-ink)]"
                            : "text-(--text-primary)"
                        }`}
                      >
                        {plan.price}
                      </span>
                      <span
                        className={`text-sm ${
                          isFeatured
                            ? "text-[var(--color-ink)]/70"
                            : "text-(--text-secondary)"
                        }`}
                      >
                        {plan.suffix}
                      </span>
                    </div>
                    <p
                      className={`text-xs mt-1 ${
                        isFeatured
                          ? "text-[var(--color-ink)]/70"
                          : "text-(--text-secondary)"
                      }`}
                    >
                      or {plan.altPrice}
                      {plan.suffix}
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

                  {"addons" in plan && plan.addons && plan.addons.length > 0 && (
                    <div
                      className={`mb-6 pt-4 border-t ${
                        isFeatured
                          ? "border-[var(--color-ink)]/20"
                          : "border-(--border-color)"
                      }`}
                    >
                      <p
                        className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${
                          isFeatured
                            ? "text-[var(--color-ink)]/70"
                            : "text-(--text-secondary)"
                        }`}
                      >
                        Add-ons (additional fee)
                      </p>
                      <ul className="space-y-1.5">
                        {plan.addons.map((a: string) => (
                          <li
                            key={a}
                            className={`flex items-start gap-2 text-xs ${
                              isFeatured
                                ? "text-[var(--color-ink)]/80"
                                : "text-(--text-secondary)"
                            }`}
                          >
                            <span className="mt-1.5 h-1 w-1 rounded-full bg-[var(--color-accent-yellow)] shrink-0" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button
                    variant={isFeatured ? "outline" : "default"}
                    className={`w-full rounded-xl ${
                      isFeatured
                        ? "bg-(--bg-primary) text-(--text-primary) hover:bg-[var(--bg-secondary)] border-2 border-(--border-color)"
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
        <div className="min-h-screen flex items-center justify-center bg-(--bg-primary)">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent-yellow)]" />
        </div>
      }
    >
      <PricingPage />
    </Suspense>
  );
}