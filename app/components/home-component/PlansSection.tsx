"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Globe2, MapPin, Loader2 } from "lucide-react";
import { plans } from "./plans";
import { useSubscription } from "@/app/hooks/useSubscripion";
import { useUserContextData } from "@/app/context/userData";
import { Button } from "../ui/button";

export function PlansSection() {
  const router = useRouter();
  const { subscription, loading } = useSubscription();
  const { userData } = useUserContextData();

  const [selectedBilling, setSelectedBilling] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [processingTier, setProcessingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Check for payment success from URL params
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");
    if (paymentStatus === "success") {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } else if (paymentStatus === "failed") {
      setError("Payment failed. Please try again.");
      setTimeout(() => setError(null), 5000);
    }
  }, []);

  const isCurrentPlan = (tier: string) => {
    return subscription?.tier === tier && subscription?.status === "active";
  };

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

      // Redirect to payment gateway
      window.location.href = data.checkoutLink;
    } catch (error: any) {
      console.error("Subscription error:", error);
      setError(error.message || "An error occurred. Please try again.");
      setProcessingTier(null);
    }
  };

  return (
    <section id="plans" className="py-24 sm:py-32 bg-[var(--bg-primary)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
          <p className="text-sm font-medium text-[var(--color-lemon-green)]">
            Pricing
          </p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--text-primary)]">
            Simple plans that{" "}
            <span className="text-[var(--color-accent-yellow)]">grow</span> with
            you
          </h2>
          <p className="mt-4 text-[var(--text-secondary)]">
            Choose the plan that matches your business goals. Each plan is a
            clear upgrade in capability, not just more limits.
          </p>

          {/* Current Plan Display */}
          {subscription && subscription.tier !== "free" && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-yellow)]/10 rounded-full">
              <span className="text-sm text-[var(--text-primary)]">
                Current Plan:
              </span>
              <span className="text-sm font-semibold text-[var(--color-accent-yellow)]">
                {subscription.tier.charAt(0).toUpperCase() +
                  subscription.tier.slice(1)}
              </span>
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
            const isProcessing = processingTier === plan.tier;
            const isFeatured = plan.featured;

            return (
              <div
                key={plan.name}
                className={`relative flex flex-col p-6 hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150 rounded-2xl ${
                  isFeatured
                    ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)] border-2 border-[var(--border-color)] shadow-[6px_6px_0px_var(--border-color)]"
                    : "bg-[var(--bg-primary)] border-2 border-[var(--border-color)] shadow-[4px_4px_0px_var(--border-color)]"
                }`}
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
                      isFeatured
                        ? "text-[var(--color-ink)]"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-3xl font-black ${
                        isFeatured
                          ? "text-[var(--color-ink)]"
                          : "text-[var(--text-primary)]"
                      }`}
                    >
                      {selectedBilling === "yearly" && plan.yearlyAmount
                        ? `₦${plan.yearlyAmount.toLocaleString()}`
                        : plan.price}
                    </span>
                    <span
                      className={`text-sm ${
                        isFeatured
                          ? "text-[var(--color-ink)]/70"
                          : "text-[var(--text-secondary)]"
                      }`}
                    >
                      {selectedBilling === "yearly"
                        ? "/year"
                        : plan.suffix || "/month"}
                    </span>
                  </div>
                  {selectedBilling === "yearly" && plan.yearlyPrice && (
                    <p
                      className={`text-xs mt-1 ${
                        isFeatured
                          ? "text-[var(--color-ink)]/70"
                          : "text-[var(--text-secondary)]"
                      }`}
                    >
                      {plan.yearlyPrice}
                    </p>
                  )}
                  <p
                    className={`text-sm mt-3 ${
                      isFeatured
                        ? "text-[var(--color-ink)]/80"
                        : "text-[var(--text-secondary)]"
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
                      {!feature.startsWith("Everything in") && (
                        <Check
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isFeatured
                              ? "text-[var(--color-ink)]"
                              : "text-[var(--color-accent-yellow)]"
                          }`}
                        />
                      )}
                      <span
                        className={`${
                          isFeatured
                            ? "text-[var(--color-ink)]"
                            : "text-[var(--text-primary)]"
                        } ${feature.startsWith("Everything in") ? "font-medium" : ""}`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading || isProcessing || currentPlan}
                  className={`mt-6 inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold transition ${
                    isFeatured
                      ? "bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] border-2 border-[var(--border-color)]"
                      : "bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
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
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-1.5">
            <Globe2 className="h-3.5 w-3.5 text-[var(--color-lemon-green)]" />
            Available worldwide
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-[var(--color-accent-yellow)]" />
            Bank sync — Nigeria only
          </span>
          <span>· Cancel anytime</span>
        </div>
      </div>
    </section>
  );
}
