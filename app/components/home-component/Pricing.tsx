"use client";

import { Check, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { useSubscription } from "@/app/hooks/useSubscripion";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { SubscriptionBadge } from "../subscription-components/subscriptionBadges";
import { useUserContextData } from "@/app/context/userData";

const plans = [
  {
    name: "Free",
    tier: "free",
    price: "₦0",
    period: "/month",
    description: "Start managing your money",
    features: [
      "Manual bookkeeping - Global",
      "Auto-bookkeeping (Wallet users in Nigeria only)",
      "Payment Links & Sales pages (Nigeria)",
      "Free business bank account (Nigeria)",
      "Up to 5 invoices - Global",
      "Up to 5 receipts - Global",
      "Basic financial overview - Global",
    ],
    cta: "Get Started",
    highlight: false,
    amount: 0,
  },
  {
    name: "Solopreneur",
    tier: "solopreneur",
    price: "₦4,900",
    period: "/month",
    yearlyPrice: "₦49,000/year (save ₦9,800)",
    description: "Get organized as a freelancer or solo business owner",
    features: [
      "Everything in Free, plus:",
      "Up to 10 invoices - Global",
      "Unlimited receipts - Global",
      "Branded invoices - Global",
      "Better expense tracking - Global",
      "Basic financial insights - Global",
    ],
    cta: "Go Solopreneur",
    highlight: false,
    amount: 4900,
    yearlyAmount: 49000,
  },
  {
    name: "SME",
    tier: "sme",
    price: "₦29,900",
    period: "/month",
    yearlyPrice: "₦299,000/year (save ₦59,800)",
    description: "Run your growing business properly",
    features: [
      "Everything in Solopreneur, plus:",
      "Upload bank statements (PDF / Excel / CSV) - Global",
      "Connect up to 3 bank accounts - Nigeria",
      "Auto-bookkeeping from connected bank accounts - Nigeria",
      "Unlimited invoices - Global",
      "Unlimited receipts - Global",
      "Vault (store financial documents safely) - Global",
      "Tax calculator - Global",
      "Financial statements (view only): Profit & Loss, Cash Flow, Balance Sheet",
      "1 extra team member access (besides owner) - Global",
    ],
    cta: "Go SME",
    highlight: true,
    amount: 29900,
    yearlyAmount: 299000,
  },
  {
    name: "Enterprise",
    tier: "enterprise",
    price: "₦100,000",
    period: "/month",
    yearlyPrice: "₦1,000,000/year (save ₦200,000)",
    description: "Control team operations with structure",
    features: [
      "Everything in SME, plus:",
      "Multi-user access (full team) - Global",
      "Role-based permissions (owner, staff, finance, viewer) - Global",
      "Request & approval system for: Payments, Invoices, Receipts, Money transfers",
      "Connect 5 bank accounts - Nigeria",
      "Auto-bookkeeping from connected bank accounts - Nigeria",
      "Downloadable financial reports - Global",
      "10 Contracts - Global",
      "Dedicated onboarding support - Global",
    ],
    cta: "Go Enterprise",
    highlight: false,
    amount: 100000,
    yearlyAmount: 1000000,
  },
  {
    name: "Corporation",
    tier: "corporation",
    price: "₦300,000",
    period: "/month",
    yearlyPrice: "₦3,000,000/year (save ₦600,000)",
    description: "Run a full company finance system",
    features: [
      "Everything in Enterprise, plus:",
      "Unlimited contracts - Global",
      "Department-based access - HR, Finance, Operations, etc",
      "Connect unlimited bank accounts - Nigeria",
      "Auto-bookkeeping from connected bank accounts - Nigeria",
      "Simple payroll system - Global",
      "Advanced financial reporting - Global",
      "Custom financial structure setup - Global",
      "Priority onboarding support - Global",
      "Dedicated account manager - Global",
    ],
    cta: "Contact Sales",
    highlight: false,
    amount: 300000,
    yearlyAmount: 3000000,
  },
];

export default function Pricing() {
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
      if (element) element.scrollIntoView({ behavior: "smooth" });
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

  const isCurrentPlan = (tier: string) =>
    subscription?.tier === tier && subscription?.status === "active";

  return (
    <section id="pricing" className="py-20 md:py-32 bg-(--bg-primary)">
      <div className="container mx-auto px-4">
        {showSuccess && (
          <div className="fixed top-4 right-4 z-50 bg-(--color-accent-yellow) text-(--color-ink) px-6 py-3 rounded-xl shadow-pop animate-slideIn">
            <p className="font-bold">✓ Payment successful!</p>
            <p className="text-sm">Your subscription has been activated.</p>
          </div>
        )}
        {error && (
          <div className="fixed top-4 right-4 z-50 bg-destructive text-white px-6 py-3 rounded-xl shadow-pop animate-slideIn">
            <p className="font-bold">✗ Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-(--text-primary)">
            Simple plans that{" "}
            <span className="text-(--color-accent-yellow)">grow</span> with you
          </h2>
          <p className="text-lg text-(--text-secondary)">
            Choose the plan that matches your business goals. Each plan is a
            clear upgrade in capability, not just more limits.
          </p>
          {subscription && subscription.tier !== "free" && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-(--color-accent-yellow)/10 rounded-full">
              <span className="text-sm text-(--text-primary)">
                Current Plan:
              </span>
              <SubscriptionBadge />
            </div>
          )}

          <div className="flex items-center justify-center mt-8">
            <div className="bg-(--bg-secondary) p-1 rounded-full border-2 border-(--border-color)">
              <button
                onClick={() => setSelectedBilling("monthly")}
                disabled={processingTier !== null}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedBilling === "monthly" ? "bg-(--color-accent-yellow) text-(--color-ink)" : "text-(--text-primary)"} disabled:opacity-50`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedBilling("yearly")}
                disabled={processingTier !== null}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedBilling === "yearly" ? "bg-(--color-accent-yellow) text-(--color-ink)" : "text-(--text-primary)"} disabled:opacity-50`}
              >
                Yearly <span className="text-xs ml-1">Save up to 20%</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-6">
          {plans.map((plan, index) => {
            const currentPlan = isCurrentPlan(plan.tier);
            const isUpgrade = upgradeParam === plan.tier;
            const isProcessing = processingTier === plan.tier;
            return (
              <div
                key={index}
                className={`relative flex flex-col p-6 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150 rounded-2xl ${
                  plan.highlight
                    ? "bg-(--color-accent-yellow) text-(--color-ink) border-2 border-(--border-color) shadow-[6px_6px_0px_var(--border-color)]"
                    : "bg-(--bg-primary) border-2 border-(--border-color) shadow-[4px_4px_0px_var(--border-color)]"
                } ${isUpgrade ? "ring-4 ring-(--color-accent-yellow) ring-opacity-50" : ""}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-(--border-color) text-(--text-primary) text-xs font-bold flex items-center gap-1 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    POPULAR
                  </div>
                )}
                {currentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-(--color-accent-yellow) text-(--color-ink) text-xs font-bold whitespace-nowrap rounded-full">
                    CURRENT PLAN
                  </div>
                )}
                <div className="mb-6">
                  <h3
                    className={`text-xl font-bold mb-2 ${plan.highlight ? "text-(--color-ink)" : "text-(--text-primary)"}`}
                  >
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-3xl font-black ${plan.highlight ? "text-(--color-ink)" : "text-(--text-primary)"}`}
                    >
                      {selectedBilling === "yearly" && plan.yearlyAmount
                        ? `₦${plan.yearlyAmount.toLocaleString()}`
                        : plan.price}
                    </span>
                    <span
                      className={`text-sm ${plan.highlight ? "text-(--color-ink)/70" : "text-(--text-secondary)"}`}
                    >
                      {selectedBilling === "yearly" ? "/year" : plan.period}
                    </span>
                  </div>
                  {selectedBilling === "yearly" && plan.yearlyPrice && (
                    <p
                      className={`text-xs mt-1 ${plan.highlight ? "text-(--color-ink)/70" : "text-(--text-secondary)"}`}
                    >
                      {plan.yearlyPrice}
                    </p>
                  )}
                  <p
                    className={`text-sm mt-3 ${plan.highlight ? "text-(--color-ink)/80" : "text-(--text-secondary)"}`}
                  >
                    {plan.description}
                  </p>
                </div>
                <ul className="space-y-2 mb-8 grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      {!feature.startsWith("Everything in") && (
                        <Check
                          className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlight ? "text-(--color-ink)" : "text-(--color-accent-yellow)"}`}
                        />
                      )}
                      <span
                        className={`${plan.highlight ? "text-(--color-ink)" : "text-(--text-primary)"} ${feature.startsWith("Everything in") ? "font-medium" : ""}`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlight ? "outline" : "default"}
                  className={`w-full rounded-xl ${
                    plan.highlight
                      ? "bg-(--bg-primary) text-(--text-primary) hover:bg-(--bg-secondary) border-2 border-(--border-color)"
                      : "bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90"
                  }`}
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading || isProcessing || currentPlan}
                >
                  {isProcessing
                    ? "Processing..."
                    : currentPlan
                      ? "Current Plan"
                      : plan.cta}
                </Button>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}