// components/Pricing.tsx
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
    name: "Free Trial",
    price: "₦0",
    period: "/month",
    description: "To Test if Zidwell is Right for You",
    features: [
      "Unlimited money transfers at N50 per transfer",
      "1 month free trial of Bookkeeping",
      "1 month free trial of Tax Calculator",
      "10 Invoices total",
      "10 Receipts total",
      "1 Contract total",
      "Basic support",
    ],
    cta: "Start Free",
    highlight: false,
    tier: "free",
    priceId: "free",
    amount: 0,
  },
  {
    name: "ZidLite",
    price: "₦4,900",
    period: "/month",
    yearlyPrice: "₦49,000/year (save ₦9,800)",
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
    highlight: false,
    tier: "zidlite",
    priceId: "price_zidlite_monthly",
    yearlyPriceId: "price_zidlite_yearly",
    amount: 4900,
    yearlyAmount: 49000,
  },
  {
    name: "Growth",
    price: "₦9,900",
    period: "/month",
    yearlyPrice: "₦99,000/year (save ₦19,800)",
    description: "For growing businesses that want structure without stress",
    features: [
      "Everything in Free, plus:",
      "Unlimited Invoices",
      "Unlimited Receipts",
      "5 Contracts total",
      "Bookkeeping tool",
      "Tax Calculator",
      "Access to WhatsApp Business Community",
      "WhatsApp support",
    ],
    cta: "Go Growth",
    highlight: true,
    tier: "growth",
    priceId: "price_growth_monthly",
    yearlyPriceId: "price_growth_yearly",
    amount: 9900,
    yearlyAmount: 99000,
  },
  {
    name: "Premium",
    price: "₦49,900",
    period: "/month",
    yearlyPrice: "₦499,000/year (save ₦99,800)",
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
    highlight: false,
    tier: "premium",
    priceId: "price_premium_monthly",
    yearlyPriceId: "price_premium_yearly",
    amount: 49900,
    yearlyAmount: 499000,
  },
  {
    name: "Elite",
    price: "₦100,000+",
    period: "/month",
    yearlyPrice: "Customized price",
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
    highlight: false,
    tier: "elite",
    priceId: "elite",
    amount: 100000,
  },
];

export default function Pricing() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    subscription,
    subscribe,
    loading,
    userTier,
    canAccessFeature,
    checkTrialStatus,
    activateTrial,
  } = useSubscription();
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
      if (element) element.scrollIntoView({ behavior: "smooth" });
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
      const plan = plans.find(p => p.tier === upgradePlan);
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
        headers: { "Content-Type": "application/json" },
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
      if (!data.success)
        throw new Error(data.error || "Failed to create checkout");
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
      const paymentReference = `SUB_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const subscriptionResult = await subscribe(
        plan.tier as any,
        "card",
        amount,
        paymentReference,
        selectedBilling === "yearly",
      );
      if (!subscriptionResult.success)
        throw new Error(
          subscriptionResult.error || "Failed to create subscription",
        );
      await createNombaCheckout(plan, amount);
    } catch (error: any) {
      console.error("Subscription error:", error);
      setError(error.message || "An error occurred. Please try again.");
      setProcessingTier(null);
    }
  };

  const isCurrentPlan = (tier: string) =>
    subscription?.tier === tier && subscription?.status === "active";

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
        if (trialType === "bookkeeping")
          checkTrialStatus("bookkeeping_access").then(setBookkeepingTrial);
        else
          checkTrialStatus("tax_calculator_access").then(setTaxCalculatorTrial);
      } else setError(result.error || "Failed to activate trial");
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <section id="pricing" className="py-20 md:py-32 bg-[var(--bg-primary)]">
      <div className="container mx-auto px-4">
        {showSuccess && (
          <div className="fixed top-4 right-4 z-50 bg-[var(--color-accent-yellow)] text-[var(--color-ink)] px-6 py-3 rounded-xl shadow-pop animate-slideIn">
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
        {error && (
          <div className="fixed top-4 right-4 z-50 bg-[var(--destructive)] text-white px-6 py-3 rounded-xl shadow-pop animate-slideIn">
            <p className="font-bold">✗ Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-[var(--text-primary)]">
            Simple plans that{" "}
            <span className="text-[var(--color-accent-yellow)]">grow</span> with you
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            We've worked hard to make our pricing as affordable as possible so
            you can get the best value. Choose the plan that matches your
            business goals.
          </p>
          {subscription && subscription.tier !== "free" && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-yellow)]/10 rounded-full">
              <span className="text-sm text-[var(--text-primary)]">
                Current Plan:
              </span>
              <SubscriptionBadge />
            </div>
          )}
          {subscription?.tier === "free" && (
            <div className="mt-6 space-y-2">
              {bookkeepingTrial?.isActive && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-yellow)]/10 rounded-full mr-2">
                  <span className="text-sm text-[var(--color-accent-yellow)]">
                    Bookkeeping Trial: {bookkeepingTrial.daysRemaining} days
                    remaining
                  </span>
                </div>
              )}
              {taxCalculatorTrial?.isActive && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-yellow)]/10 rounded-full">
                  <span className="text-sm text-[var(--color-accent-yellow)]">
                    Tax Calculator Trial: {taxCalculatorTrial.daysRemaining}{" "}
                    days remaining
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-center mt-8">
            <div className="bg-[var(--bg-secondary)] p-1 rounded-full border-2 border-[var(--border-color)]">
              <button
                onClick={() => setSelectedBilling("monthly")}
                disabled={processingTier !== null}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedBilling === "monthly" ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)]" : "text-[var(--text-primary)]"} disabled:opacity-50`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedBilling("yearly")}
                disabled={processingTier !== null}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${selectedBilling === "yearly" ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)]" : "text-[var(--text-primary)]"} disabled:opacity-50`}
              >
                Yearly <span className="text-xs ml-1">Save up to 20%</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const currentPlan = isCurrentPlan(plan.tier);
            const isUpgrade = upgradeParam === plan.tier;
            const isProcessing = processingTier === plan.tier;
            return (
              <div
                key={index}
                className={`relative flex flex-col p-6 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150 rounded-2xl ${
                  plan.highlight
                    ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)] border-2 border-[var(--border-color)] shadow-[6px_6px_0px_var(--border-color)]"
                    : "bg-[var(--bg-primary)] border-2 border-[var(--border-color)] shadow-[4px_4px_0px_var(--border-color)]"
                } ${isUpgrade ? "ring-4 ring-[var(--color-accent-yellow)] ring-opacity-50" : ""}`}
              >
                {plan.highlight && (
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
                    className={`text-xl font-bold mb-2 ${plan.highlight ? "text-[var(--color-ink)]" : "text-[var(--text-primary)]"}`}
                  >
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-3xl font-black ${plan.highlight ? "text-[var(--color-ink)]" : "text-[var(--text-primary)]"}`}
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
                      className={`text-sm ${plan.highlight ? "text-[var(--color-ink)]/70" : "text-[var(--text-secondary)]"}`}
                    >
                      {selectedBilling === "yearly" ? "/year" : plan.period}
                    </span>
                  </div>
                  {selectedBilling === "yearly" && plan.yearlyPrice && (
                    <p
                      className={`text-xs mt-1 ${plan.highlight ? "text-[var(--color-ink)]/70" : "text-[var(--text-secondary)]"}`}
                    >
                      {plan.yearlyPrice}
                    </p>
                  )}
                  <p
                    className={`text-sm mt-3 ${plan.highlight ? "text-[var(--color-ink)]/80" : "text-[var(--text-secondary)]"}`}
                  >
                    {plan.description}
                  </p>
                </div>
                <ul className="space-y-2 mb-8 grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      {!feature.startsWith("Everything in") && (
                        <Check
                          className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlight ? "text-[var(--color-ink)]" : "text-[var(--color-accent-yellow)]"}`}
                        />
                      )}
                      <span
                        className={`${plan.highlight ? "text-[var(--color-ink)]" : "text-[var(--text-primary)]"} ${feature.startsWith("Everything in") ? "font-medium" : ""}`}
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
                      ? "bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] border-2 border-[var(--border-color)]"
                      : "bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90"
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
                {plan.tier === "free" && subscription?.tier === "free" && (
                  <div className="mt-3 space-y-2">
                    {!bookkeepingTrial?.isActive && (
                      <button
                        onClick={() => handleActivateTrial("bookkeeping")}
                        className="block w-full text-sm text-[var(--color-accent-yellow)] hover:underline"
                      >
                        Activate 14-day bookkeeping trial
                      </button>
                    )}
                    {!taxCalculatorTrial?.isActive && (
                      <button
                        onClick={() => handleActivateTrial("tax_calculator")}
                        className="block w-full text-sm text-[var(--color-accent-yellow)] hover:underline"
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

        <div className="mt-20 max-w-4xl mx-auto">
          <div className="bg-[var(--bg-primary)] border-2 border-[var(--border-color)] shadow-[6px_6px_0px_var(--border-color)] p-8 rounded-2xl">
            <h3 className="text-2xl md:text-3xl font-black mb-4 text-[var(--text-primary)]">
              The ZidCoin Economy:{" "}
              <span className="text-[var(--color-accent-yellow)]">
                Our Cashback & Reward System
              </span>
            </h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-bold mb-2 text-[var(--text-primary)]">
                  What is ZidCoin?
                </h4>
                <p className="text-[var(--text-secondary)]">
                  Zidcoin is the currency inside Zidwell. It's what we pay you
                  for using our app. Every time you load data, airtime, cable
                  subscription and electricity on Zidwell, you earn Zidcoins
                  (ZC).
                </p>
                <p className="text-[var(--text-secondary)] mt-2 font-semibold">
                  Value: 1 Zidcoin = ₦1.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-bold mb-2 text-[var(--text-primary)]">
                  How It Works
                </h4>
                <ul className="space-y-2 text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 shrink-0 mt-0.5 text-[var(--color-accent-yellow)]" />
                    <span>
                      Get 20 Zidcoins rewards anytime you spend N2500 and above
                      on Zidwell.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 shrink-0 mt-0.5 text-[var(--color-accent-yellow)]" />
                    <span>
                      Your Zidcoins accumulate in your wallet as cashback.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 shrink-0 mt-0.5 text-[var(--color-accent-yellow)]" />
                    <span>
                      Once your Zidcoin balance hits 3,000 ZC, you can cash it
                      out.
                    </span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-bold mb-2 text-[var(--text-primary)]">
                  Why It Matters
                </h4>
                <p className="text-[var(--text-secondary)]">
                  Zidcoin turns every business transaction into an opportunity
                  to earn. The more you use Zidwell, the more value you unlock —
                  it's structure, savings, and growth all in one.
                </p>
                <p className="text-[var(--text-secondary)] mt-2 font-semibold">
                  Zidwell. Structure your hustle. Earn as you grow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}