// app/components/home-component/PlansSection.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Globe2, MapPin, Loader2 } from "lucide-react";

const styles = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-slideIn {
    animation: slideIn 0.3s ease-out both;
  }
`;

const plans = [
  {
    name: "Starter",
    tagline: "Start Putting Structure Around Your Business",
    tier: "starter",
    amount: 99900,
    yearlyAmount: 99900,
    price: "₦99,900",
    yearlyPrice: "₦99,900/year",
    altPrice: "$69",
    suffix: "/year",
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
    addons: [],
    cta: "Start Your Free Trial",
    featured: false,
  },
  {
    name: "SME",
    tagline: "Run Your Business Properly",
    tier: "sme",
    amount: 199900,
    yearlyAmount: 199900,
    price: "₦199,900",
    yearlyPrice: "₦199,900/year",
    altPrice: "$139",
    suffix: "/year",
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
  },
  {
    name: "Enterprise",
    tagline: "Full Business Finance System",
    tier: "enterprise",
    amount: 599900,
    yearlyAmount: 599900,
    price: "₦599,900",
    yearlyPrice: "₦599,900/year",
    altPrice: "$419",
    suffix: "/year",
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
  },
];

export function PlansSection() {
  const router = useRouter();
  const [selectedBilling, setSelectedBilling] = useState<"monthly" | "yearly">(
    "yearly",
  );
  const [processingTier, setProcessingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const paymentStatus = params.get("payment");
      if (paymentStatus === "success") {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
      } else if (paymentStatus === "failed") {
        setError("Payment failed. Please try again.");
        setTimeout(() => setError(null), 5000);
      }
    }
  }, []);

  const isCurrentPlan = (tier: string) => {
    return subscription?.tier === tier && subscription?.status === "active";
  };

  const handleSubscribe = async (plan: (typeof plans)[0]) => {
    if (!plan) return;

    if (plan.tier === "free") {
      router.push("/dashboard");
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

  const getTierDisplayName = (tier?: string | null) => {
    if (!tier) return "Free";
    if (tier === "starter") return "Starter";
    if (tier === "sme") return "SME";
    if (tier === "enterprise") return "Enterprise";
    if (tier === "console") return "Console";
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  if (!mounted) {
    return (
      <>
        <style>{styles}</style>
        <section className="py-24 sm:py-32 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <div className="h-8 w-24 bg-surface rounded-full mx-auto mb-4 animate-pulse" />
              <div className="h-12 w-96 bg-surface rounded-lg mx-auto mb-4 animate-pulse" />
              <div className="h-6 w-72 bg-surface rounded-lg mx-auto animate-pulse" />
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-96 bg-surface rounded-[32px] animate-pulse"
                />
              ))}
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <section id="pricing" className="py-24 sm:py-32 bg-background">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          {showSuccess && (
            <div className="fixed top-4 right-4 z-50 bg-gold text-ink px-6 py-3 rounded-xl shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)] animate-slideIn">
              <p className="font-bold">✓ Payment successful!</p>
              <p className="text-sm">Your subscription has been activated.</p>
            </div>
          )}

          {error && (
            <div className="fixed top-4 right-4 z-50 bg-destructive text-destructive-foreground px-6 py-3 rounded-xl shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)] animate-slideIn">
              <p className="font-bold">✗ Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm font-medium text-leaf">Pricing</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-text-primary">
              One Bundle. One Annual Payment.
            </h2>
            <p className="mt-4 text-text-secondary">
              Our Business Toolkit gives you more tools to organize and
              operate your business from anywhere, as it grows.
            </p>

            {subscription &&
              subscription.tier &&
              subscription.tier !== "free" && (
                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-full">
                  <span className="text-sm text-text-primary">
                    Current Plan:
                  </span>
                  <span className="text-sm font-semibold text-gold">
                    {getTierDisplayName(subscription.tier)}
                  </span>
                </div>
              )}
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {plans.map((plan) => {
              const currentPlan = isCurrentPlan(plan.tier);
              const isProcessing = processingTier === plan.tier;
              const isFeatured = plan.featured;

              return (
                <div
                  key={plan.name}
                  className={`rounded-[32px] p-6 border shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)] flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                    isFeatured
                      ? "bg-ink text-background border-ink shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)]"
                      : "bg-background text-text-primary border-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`font-display text-lg font-semibold ${
                        isFeatured ? "text-background" : "text-text-primary"
                      }`}
                    >
                      {plan.name}
                    </p>
                    {isFeatured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gold text-ink px-2.5 py-1 text-[10px] font-semibold">
                        <Sparkles className="h-3 w-3" /> Most loved
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs mt-0.5 ${
                      isFeatured ? "text-background/60" : "text-text-secondary"
                    }`}
                  >
                    {plan.tagline}
                  </p>

                  <div className="mt-4 flex items-baseline gap-1 flex-wrap">
                    <span
                      className={`font-display text-3xl font-semibold ${
                        isFeatured ? "text-background" : "text-text-primary"
                      }`}
                    >
                      {plan.price}
                    </span>
                    <span
                      className={`text-sm ${
                        isFeatured ? "text-background/60" : "text-text-secondary"
                      }`}
                    >
                      {plan.suffix}
                    </span>
                  </div>
                  <p
                    className={`mt-0.5 text-xs ${
                      isFeatured ? "text-background/50" : "text-text-secondary"
                    }`}
                  >
                    or {plan.altPrice}
                    {plan.suffix}
                  </p>
                  <p
                    className={`mt-2 text-xs ${
                      isFeatured ? "text-background/70" : "text-text-secondary"
                    }`}
                  >
                    {plan.note}
                  </p>

                  <ul className="mt-5 space-y-2.5 flex-1">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check
                          className={`h-4 w-4 mt-0.5 shrink-0 ${
                            isFeatured ? "text-gold" : "text-leaf"
                          }`}
                        />
                        <span
                          className={
                            isFeatured
                              ? "text-background/90"
                              : "text-text-primary"
                          }
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {plan.addons && plan.addons.length > 0 && (
                    <div
                      className={`mt-4 pt-4 border-t ${
                        isFeatured
                          ? "border-background/10"
                          : "border-border"
                      }`}
                    >
                      <p
                        className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${
                          isFeatured
                            ? "text-background/60"
                            : "text-text-secondary"
                        }`}
                      >
                        Add-ons (additional fee)
                      </p>
                      <ul className="space-y-1.5">
                        {plan.addons.map((a) => (
                          <li
                            key={a}
                            className={`flex items-start gap-2 text-xs ${
                              isFeatured
                                ? "text-background/70"
                                : "text-text-secondary"
                            }`}
                          >
                            <span className="mt-1.5 h-1 w-1 rounded-full bg-gold shrink-0" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={loading || isProcessing || currentPlan}
                    className={`mt-6 inline-flex items-center justify-center px-5 py-3 rounded-full text-sm font-semibold transition ${
                      isFeatured
                        ? "bg-gold text-ink hover:opacity-90"
                        : "bg-surface border-border hover:bg-surface-2 text-text-primary"
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

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <Globe2 className="h-3.5 w-3.5 text-leaf" />
              Available worldwide
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-gold" />
              Bank sync — Nigeria only
            </span>
            <span>· 7-day free trial · Cancel anytime</span>
          </div>
        </div>
      </section>
    </>
  );
}