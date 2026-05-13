"use client";

import { useState, useEffect, Suspense } from "react";
import {
  Check,
  Sparkles,
  Crown,
  Zap,
  Star,
  ArrowRight,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSubscription } from "../hooks/useSubscripion";
import { useUserContextData } from "../context/userData";
import { SubscriptionBadge } from "../components/subscription-components/subscriptionBadges";
import Footer from "../components/home-component/Footer";
import { Button } from "../components/ui/button";
import Header from "../components/home-component/Header";

const plans = [
  {
    name: "Free Trial",
    tier: "free",
    price: "₦0",
    period: "/month",
    icon: Star,
    description: "To Test if Zidwell is Right for You",
    features: [
      "Unlimited transfers at N50 each",
      "1 month free trial of Bookkeeping",
      "1 month free trial of Tax Calculator",
      "10 Invoices total",
      "10 Receipts total",
      "1 Contract total",
      "Basic support",
    ],
    cta: "Start Free",
    amount: 0,
    color: "gray",
  },
  {
    name: "ZidLite",
    tier: "zidlite",
    price: "₦4,900",
    period: "/month",
    yearlyPrice: "₦49,000/year (save ₦9,800)",
    icon: Zap,
    description:
      "For businesses that want to test what finance automation looks like",
    features: [
      "Everything in Free, plus:",
      "Transfers fee at N50",
      "Bookkeeping free trial",
      "Tax Calculator free trial",
      "20 Invoices",
      "20 Receipts",
      "2 Contracts",
      "WhatsApp Business Community",
      "WhatsApp support",
    ],
    cta: "Go ZidLite",
    amount: 4900,
    yearlyAmount: 49000,
    color: "blue",
  },
  {
    name: "Growth",
    tier: "growth",
    price: "₦9,900",
    period: "/month",
    yearlyPrice: "₦99,000/year (save ₦19,800)",
    icon: Zap,
    description: "For growing businesses that want structure without stress",
    features: [
      "Everything in ZidLite, plus:",
      "Unlimited Invoices",
      "Unlimited Receipts",
      "5 Contracts total",
      "Bookkeeping tool",
      "Tax Calculator",
      "WhatsApp Community access",
      "WhatsApp support",
    ],
    cta: "Go Growth",
    highlight: true,
    amount: 9900,
    yearlyAmount: 99000,
    color: "yellow",
  },
  {
    name: "Premium",
    tier: "premium",
    price: "₦49,900",
    period: "/month",
    yearlyPrice: "₦499,000/year (save ₦99,800)",
    icon: Crown,
    description: "Best for: founders and CEOs who want hands-on help",
    features: [
      "Everything in Growth, plus:",
      "Invoice Payment Reminders",
      "Unlimited contracts",
      "Financial Statement Preparation",
      "Tax Calculation Support",
      "Tax filing support",
      "Priority support",
    ],
    cta: "Upgrade to Premium",
    amount: 49900,
    yearlyAmount: 499000,
    color: "amber",
  },
  {
    name: "Elite",
    tier: "elite",
    price: "₦100,000+",
    period: "/month",
    yearlyPrice: "Customized price",
    icon: Sparkles,
    description: "For established businesses & founders that need tax support",
    features: [
      "Everything in Premium, plus:",
      "Full Tax Filing Support",
      "VAT Filing",
      "PAYE Filing",
      "WHT Filing",
      "CIT Audit",
      "Monthly Tax Filing",
      "Yearly Tax Filing",
      "CFO-Level Financial Guidance",
      "Direct WhatsApp Support",
      "Annual Audit Coordination",
    ],
    cta: "Contact Us",
    amount: 100000,
    color: "purple",
  },
];

function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { subscription, loading, checkTrialStatus, activateTrial, subscribe } =
    useSubscription();
  const { userData } = useUserContextData();

  const [selectedBilling, setSelectedBilling] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [processingTier, setProcessingTier] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookkeepingTrial, setBookkeepingTrial] = useState<any>(null);
  const [taxCalculatorTrial, setTaxCalculatorTrial] = useState<any>(null);

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
    if (subscription?.tier === "free") {
      checkTrialStatus("bookkeeping_access").then(setBookkeepingTrial);
      checkTrialStatus("tax_calculator_access").then(setTaxCalculatorTrial);
    }
  }, [subscription?.tier, checkTrialStatus]);

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
      // Set the billing period if specified
      if (billingParam === "yearly") {
        setSelectedBilling("yearly");
      }

      // Find and trigger subscription for the plan
      const plan = plans.find((p) => p.tier === upgradePlan);
      if (plan && plan.tier !== "free" && plan.tier !== "elite") {
        // Clear the URL parameters
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
        // Trigger subscription
        handleSubscribe(plan);
      }
    }
  }, [searchParams, userData?.id]);

  const createNombaCheckout = async (
    plan: (typeof plans)[0],
    amount: number,
  ) => {
    try {
      if (!userData?.id) {
        router.push("/auth/login");
        return;
      }

      const orderReference = `SUB_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planTier: plan.tier,
          amount,
          billingPeriod: selectedBilling,
          userEmail: userData.email,
          userId: userData.id,
          orderReference,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create checkout");
      }

      sessionStorage.setItem(
        "pendingOrder",
        JSON.stringify({
          orderReference: data.orderReference,
          planTier: plan.tier,
          amount,
          billingPeriod: selectedBilling,
          timestamp: Date.now(),
        }),
      );

      window.location.href = data.checkoutLink;
    } catch (error: any) {
      console.error("Checkout error:", error);
      setError(
        error.message || "Failed to initialize payment. Please try again.",
      );
      setProcessingTier(null);
    }
  };

  const handleSubscribe = async (plan: (typeof plans)[0]) => {
    if (plan.tier === "free") {
      router.push("/dashboard");
      return;
    }

    if (plan.tier === "elite") {
      window.location.href =
        "mailto:sales@zidwell.com?subject=Elite%20Plan%20Inquiry";
      return;
    }

    // If not logged in, redirect to login with callback URL
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

      // Call the subscription checkout API
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

      // Redirect to Nomba checkout
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

  const handleActivateTrial = async (
    trialType: "bookkeeping" | "tax_calculator",
  ) => {
    try {
      const featureKey =
        trialType === "bookkeeping"
          ? "bookkeeping_access"
          : "tax_calculator_access";
      const result = await activateTrial(featureKey, 14);
      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
        if (trialType === "bookkeeping") {
          checkTrialStatus("bookkeeping_access").then(setBookkeepingTrial);
        } else {
          checkTrialStatus("tax_calculator_access").then(setTaxCalculatorTrial);
        }
      } else {
        setError(result.error || "Failed to activate trial");
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <>
      <Header />
      <section id="pricing" className="py-20 md:py-32 bg-(--bg-primary)">
        <div className="container mx-auto px-4">
          {/* Success Message */}
          {showSuccess && (
            <div className="fixed top-4 right-4 z-50 bg-(--color-accent-yellow) text-(--color-ink) px-6 py-3 rounded-xl shadow-pop animate-slideIn">
              <p className="font-bold">
                ✓{" "}
                {subscription?.tier === "free"
                  ? "Trial activated!"
                  : "Payment successful!"}
              </p>
              <p className="text-sm">
                {subscription?.tier === "free"
                  ? "Your 14-day trial has started."
                  : "Your subscription has been activated."}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="fixed top-4 right-4 z-50 bg-destructive text-white px-6 py-3 rounded-xl shadow-pop animate-slideIn">
              <p className="font-bold">✗ Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-(--text-primary)">
              Simple plans that{" "}
              <span className="text-(--color-accent-yellow)">grow</span> with
              you
            </h2>
            <p className="text-lg text-(--text-secondary)">
              We've worked hard to make our pricing as affordable as possible so
              you can get the best value. Choose the plan that matches your
              business goals.
            </p>

            {/* Back Button */}
            <div className="mt-4">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-(--color-accent-yellow) hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>

            {/* Current Plan Display */}
            {subscription && subscription.tier !== "free" && (
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-(--color-accent-yellow)/10 rounded-full">
                <span className="text-sm text-(--text-primary)">
                  Current Plan:
                </span>
                <SubscriptionBadge />
              </div>
            )}

            {/* Trials Display for Free Users */}
            {subscription?.tier === "free" && (
              <div className="mt-6 space-y-2">
                {bookkeepingTrial?.isActive && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-(--color-accent-yellow)/10 rounded-full mr-2">
                    <span className="text-sm text-(--color-accent-yellow)">
                      Bookkeeping Trial: {bookkeepingTrial.daysRemaining} days
                      remaining
                    </span>
                  </div>
                )}
                {taxCalculatorTrial?.isActive && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-(--color-accent-yellow)/10 rounded-full">
                    <span className="text-sm text-(--color-accent-yellow)">
                      Tax Calculator Trial: {taxCalculatorTrial.daysRemaining}{" "}
                      days remaining
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Billing Toggle */}
            <div className="flex items-center justify-center mt-8">
              <div className="bg-(--bg-secondary) p-1 rounded-full border-2 border-(--border-color)">
                <button
                  onClick={() => setSelectedBilling("monthly")}
                  disabled={processingTier !== null}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedBilling === "monthly"
                      ? "bg-(--color-accent-yellow) text-(--color-ink)"
                      : "text-(--text-primary)"
                  } disabled:opacity-50`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setSelectedBilling("yearly")}
                  disabled={processingTier !== null}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedBilling === "yearly"
                      ? "bg-(--color-accent-yellow) text-(--color-ink)"
                      : "text-(--text-primary)"
                  } disabled:opacity-50`}
                >
                  Yearly <span className="text-xs ml-1">Save up to 20%</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {plans.map((plan, index) => {
              const currentPlan = isCurrentPlan(plan.tier);
              const isUpgrade = upgradeParam === plan.tier;
              const isProcessing = processingTier === plan.tier;

              return (
                <div
                  key={index}
                  id={`plan-${plan.tier}`}
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

                  {/* Current Plan Badge */}
                  {currentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-(--color-accent-yellow) text-(--color-ink) text-xs font-bold rounded-full whitespace-nowrap">
                      CURRENT PLAN
                    </div>
                  )}

                  <div className="mb-6">
                    <h3
                      className={`text-xl font-bold mb-2 ${
                        plan.highlight
                          ? "text-(--color-ink)"
                          : "text-(--text-primary)"
                      }`}
                    >
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-3xl font-black ${
                          plan.highlight
                            ? "text-(--color-ink)"
                            : "text-(--text-primary)"
                        }`}
                      >
                        {selectedBilling === "yearly" && plan.yearlyPrice
                          ? plan.tier === "zidlite"
                            ? "₦49,000"
                            : plan.tier === "growth"
                              ? "₦99,000"
                              : plan.tier === "premium"
                                ? "₦499,000"
                                : plan.price
                          : plan.price}
                      </span>
                      <span
                        className={`text-sm ${
                          plan.highlight
                            ? "text-(--color-ink)/70"
                            : "text-(--text-secondary)"
                        }`}
                      >
                        {selectedBilling === "yearly" ? "/year" : plan.period}
                      </span>
                    </div>
                    {selectedBilling === "yearly" && plan.yearlyPrice && (
                      <p
                        className={`text-xs mt-1 ${
                          plan.highlight
                            ? "text-(--color-ink)/70"
                            : "text-(--text-secondary)"
                        }`}
                      >
                        {plan.yearlyPrice}
                      </p>
                    )}
                    <p
                      className={`text-sm mt-3 ${
                        plan.highlight
                          ? "text-(--color-ink)/80"
                          : "text-(--text-secondary)"
                      }`}
                    >
                      {plan.description}
                    </p>
                  </div>

                  <ul className="space-y-2 mb-8 grow">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        {!feature.startsWith("Everything in") && (
                          <Check
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              plan.highlight
                                ? "text-(--color-ink)"
                                : "text-(--color-accent-yellow)"
                            }`}
                          />
                        )}
                        <span
                          className={`${
                            plan.highlight
                              ? "text-(--color-ink)"
                              : "text-(--text-primary)"
                          } ${feature.startsWith("Everything in") ? "font-medium" : ""}`}
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

                  {/* Trial Buttons for Free Plan */}
                  {plan.tier === "free" && subscription?.tier === "free" && (
                    <div className="mt-3 space-y-2">
                      {!bookkeepingTrial?.isActive && (
                        <button
                          onClick={() => handleActivateTrial("bookkeeping")}
                          className="block w-full text-sm text-(--color-accent-yellow) hover:underline"
                        >
                          Activate 14-day bookkeeping trial
                        </button>
                      )}
                      {!taxCalculatorTrial?.isActive && (
                        <button
                          onClick={() => handleActivateTrial("tax_calculator")}
                          className="block w-full text-sm text-(--color-accent-yellow) hover:underline"
                        >
                          Activate 14-day tax calculator trial
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ZidCoin Economy Section */}
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="bg-(--bg-primary) border-2 border-(--border-color) shadow-[6px_6px_0px_var(--border-color)] p-8 rounded-2xl">
              <h3 className="text-2xl md:text-3xl font-black mb-4 text-(--text-primary)">
                The ZidCoin Economy:{" "}
                <span className="text-(--color-accent-yellow)">
                  Our Cashback & Reward System
                </span>
              </h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-bold mb-2 text-(--text-primary)">
                    What is ZidCoin?
                  </h4>
                  <p className="text-(--text-secondary)">
                    Zidcoin is the currency inside Zidwell. It's what we pay you
                    for using our app. Every time you load data, airtime, cable
                    subscription and electricity on Zidwell, you earn Zidcoins
                    (ZC).
                  </p>
                  <p className="text-(--text-secondary) mt-2 font-semibold">
                    Value: 1 Zidcoin = ₦1.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-bold mb-2 text-(--text-primary)">
                    How It Works
                  </h4>
                  <ul className="space-y-2 text-(--text-secondary)">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 shrink-0 mt-0.5 text-(--color-accent-yellow)" />
                      <span>
                        Get 20 Zidcoins rewards anytime you spend N2500 and
                        above on Zidwell.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 shrink-0 mt-0.5 text-(--color-accent-yellow)" />
                      <span>
                        Your Zidcoins accumulate in your wallet as cashback.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 shrink-0 mt-0.5 text-(--color-accent-yellow)" />
                      <span>
                        Once your Zidcoin balance hits 3,000 ZC, you can cash it
                        out.
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-bold mb-2 text-(--text-primary)">
                    Why It Matters
                  </h4>
                  <p className="text-(--text-secondary)">
                    Zidcoin turns every business transaction into an opportunity
                    to earn. The more you use Zidwell, the more value you unlock
                    — it's structure, savings, and growth all in one.
                  </p>
                  <p className="text-(--text-secondary) mt-2 font-semibold">
                    Zidwell. Structure your hustle. Earn as you grow.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

export default function price() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-(--bg-primary)">
          <Loader2 className="w-8 h-8 animate-spin text-(--color-accent-yellow)" />
        </div>
      }
    >
      <PricingPage />
    </Suspense>
  );
}
