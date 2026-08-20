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
    name: "FREE",
    tagline: "Get a business bank account for free",
    tier: "free",
    amount: 0,
    yearlyAmount: 0,
    price: "₦0",
    yearlyPrice: "",
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

export function PlansSection() {
  const router = useRouter();
  const [selectedBilling, setSelectedBilling] = useState<"monthly" | "yearly">(
    "monthly",
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
    // Simulate loading user data
    setLoading(true);
    // You would fetch actual user data here
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
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

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (!plan) return;

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

  const getTierDisplayName = (tier?: string | null) => {
    if (!tier) return "Free";
    if (tier === "free") return "Free";
    if (tier === "starter") return "STARTER";
    if (tier === "sme") return "SME";
    if (tier === "enterprise") return "Enterprise";
    if (tier === "console") return "CONSOLE";
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  if (!mounted) {
    return (
      <>
        <style>{styles}</style>
        <section className="py-24 sm:py-32 bg-[oklch(1_0_0)] dark:bg-[oklch(0.14_0_0)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <div className="h-8 w-24 bg-[oklch(0.97_0_0)] dark:bg-[oklch(0.18_0_0)] rounded-full mx-auto mb-4 animate-pulse" />
              <div className="h-12 w-96 bg-[oklch(0.97_0_0)] dark:bg-[oklch(0.18_0_0)] rounded-lg mx-auto mb-4 animate-pulse" />
              <div className="h-6 w-72 bg-[oklch(0.97_0_0)] dark:bg-[oklch(0.18_0_0)] rounded-lg mx-auto animate-pulse" />
            </div>
            <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-96 bg-[oklch(0.97_0_0)] dark:bg-[oklch(0.18_0_0)] rounded-[32px] animate-pulse" />
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
      <section className="py-24 sm:py-32 bg-[oklch(1_0_0)] dark:bg-[oklch(0.14_0_0)]">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          {/* Success Message */}
          {showSuccess && (
            <div className="fixed top-4 right-4 z-50 bg-[oklch(0.84_0.16_88)] text-[oklch(0.17_0_0)] px-6 py-3 rounded-xl shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)] animate-slideIn">
              <p className="font-bold font-['Be_Vietnam_Pro',system-ui,sans-serif]">✓ Payment successful!</p>
              <p className="text-sm font-['Be_Vietnam_Pro',system-ui,sans-serif]">Your subscription has been activated.</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="fixed top-4 right-4 z-50 bg-[oklch(0.6_0.22_27)] text-[oklch(1_0_0)] px-6 py-3 rounded-xl shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)] animate-slideIn">
              <p className="font-bold font-['Be_Vietnam_Pro',system-ui,sans-serif]">✗ Error</p>
              <p className="text-sm font-['Be_Vietnam_Pro',system-ui,sans-serif]">{error}</p>
            </div>
          )}

          {/* Section Header */}
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm font-medium text-[oklch(0.66_0.18_148)] font-['Be_Vietnam_Pro',system-ui,sans-serif]">Pricing</p>
            <h2 className="mt-3 font-['Space_Grotesk','Cy_Grotesk_Key',system-ui,sans-serif] text-4xl sm:text-5xl font-semibold tracking-tight text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)]">
              Simple. Scalable. Built for growth.
            </h2>
            <p className="mt-4 text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] font-['Be_Vietnam_Pro',system-ui,sans-serif]">
              Start free. Upgrade as your business — and your books — grow.
            </p>

            {/* Current Plan Display */}
            {subscription && subscription.tier && subscription.tier !== "free" && (
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[oklch(0.84_0.16_88)]/10 dark:bg-[oklch(0.84_0.16_88)]/20 rounded-full">
                <span className="text-sm text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)] font-['Be_Vietnam_Pro',system-ui,sans-serif]">
                  Current Plan:
                </span>
                <span className="text-sm font-semibold text-[oklch(0.84_0.16_88)] font-['Be_Vietnam_Pro',system-ui,sans-serif]">
                  {getTierDisplayName(subscription.tier)}
                </span>
              </div>
            )}

            {/* Billing Toggle */}
            <div className="flex items-center justify-center mt-8">
              <div className="bg-[oklch(0.97_0_0)] dark:bg-[oklch(0.18_0_0)] p-1 rounded-full border-2 border-[oklch(0.85_0_0)] dark:border-[oklch(1_0_0)_/_12%]">
                <button
                  onClick={() => setSelectedBilling("monthly")}
                  disabled={processingTier !== null}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all font-['Be_Vietnam_Pro',system-ui,sans-serif] ${
                    selectedBilling === "monthly"
                      ? "bg-[oklch(0.84_0.16_88)] text-[oklch(0.17_0_0)]"
                      : "text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)] hover:text-[oklch(0.17_0_0)]/80 dark:hover:text-[oklch(0.98_0_0)]/80"
                  } disabled:opacity-50`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setSelectedBilling("yearly")}
                  disabled={processingTier !== null}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all font-['Be_Vietnam_Pro',system-ui,sans-serif] ${
                    selectedBilling === "yearly"
                      ? "bg-[oklch(0.84_0.16_88)] text-[oklch(0.17_0_0)]"
                      : "text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)] hover:text-[oklch(0.17_0_0)]/80 dark:hover:text-[oklch(0.98_0_0)]/80"
                  } disabled:opacity-50`}
                >
                  Yearly <span className="text-xs ml-1">Save up to 20%</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 ">
            {plans.map((plan) => {
              const currentPlan = isCurrentPlan(plan.tier);
              const isProcessing = processingTier === plan.tier;
              const isFeatured = plan.featured;
              
              // Get the correct price based on billing selection
              const getPriceDisplay = () => {
                if (selectedBilling === "yearly" && plan.yearlyPrice) {
                  return plan.yearlyPrice;
                }
                return plan.price;
              };

              const getSuffixDisplay = () => {
                if (selectedBilling === "yearly" && plan.yearlyAmount) {
                  return "/year";
                }
                return plan.suffix;
              };

              return (
                <div
                  key={plan.name}
                  className={`rounded-[32px] p-6 border shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)] flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                    isFeatured
                      ? "bg-[oklch(0.17_0_0)] dark:bg-[oklch(0.98_0_0)] border-[oklch(0.17_0_0)] dark:border-[oklch(0.98_0_0)] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)]"
                      : "bg-[oklch(1_0_0)] dark:bg-[oklch(0.14_0_0)] border-[oklch(0.85_0_0)] dark:border-[oklch(1_0_0)_/_12%]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-['Space_Grotesk','Cy_Grotesk_Key',system-ui,sans-serif] text-lg font-semibold ${
                      isFeatured ? "text-[oklch(1_0_0)] dark:text-[oklch(0.17_0_0)]" : "text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)]"
                    }`}>
                      {plan.name}
                    </p>
                    {isFeatured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.84_0.16_88)] text-[oklch(0.17_0_0)] px-2.5 py-1 text-[10px] font-semibold font-['Be_Vietnam_Pro',system-ui,sans-serif]">
                        <Sparkles className="h-3 w-3" /> Most loved
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 font-['Be_Vietnam_Pro',system-ui,sans-serif] ${
                    isFeatured ? "text-[oklch(1_0_0)]/60 dark:text-[oklch(0.17_0_0)]/60" : "text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)]"
                  }`}>
                    {plan.tagline}
                  </p>

                  <div className="mt-4 flex items-baseline gap-1 flex-wrap">
                    <span className={`font-['Space_Grotesk','Cy_Grotesk_Key',system-ui,sans-serif] text-3xl font-semibold ${
                      isFeatured ? "text-[oklch(1_0_0)] dark:text-[oklch(0.17_0_0)]" : "text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)]"
                    }`}>
                      {getPriceDisplay()}
                    </span>
                    {getSuffixDisplay() && (
                      <span className={`text-sm font-['Be_Vietnam_Pro',system-ui,sans-serif] ${
                        isFeatured ? "text-[oklch(1_0_0)]/60 dark:text-[oklch(0.17_0_0)]/60" : "text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)]"
                      }`}>
                        {getSuffixDisplay()}
                      </span>
                    )}
                  </div>
                  {plan.altPrice && selectedBilling === "monthly" && (
                    <p className={`mt-0.5 text-xs font-['Be_Vietnam_Pro',system-ui,sans-serif] ${
                      isFeatured ? "text-[oklch(1_0_0)]/50 dark:text-[oklch(0.17_0_0)]/50" : "text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)]"
                    }`}>
                      or {plan.altPrice}{plan.suffix}
                    </p>
                  )}
                  {selectedBilling === "yearly" && plan.yearlyPrice && (
                    <p className={`mt-0.5 text-xs font-['Be_Vietnam_Pro',system-ui,sans-serif] ${
                      isFeatured ? "text-[oklch(1_0_0)]/50 dark:text-[oklch(0.17_0_0)]/50" : "text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)]"
                    }`}>
                      {plan.yearlyPrice}
                    </p>
                  )}
                  <p className={`mt-2 text-xs font-['Be_Vietnam_Pro',system-ui,sans-serif] ${
                    isFeatured ? "text-[oklch(1_0_0)]/70 dark:text-[oklch(0.17_0_0)]/70" : "text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)]"
                  }`}>
                    {plan.note}
                  </p>

                  <ul className="mt-5 space-y-2.5 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm font-['Be_Vietnam_Pro',system-ui,sans-serif]">
                        <Check className={`h-4 w-4 mt-0.5 shrink-0 ${
                          isFeatured ? "text-[oklch(0.84_0.16_88)]" : "text-[oklch(0.66_0.18_148)]"
                        }`} />
                        <span className={
                          isFeatured 
                            ? "text-[oklch(1_0_0)]/90 dark:text-[oklch(0.17_0_0)]/90" 
                            : "text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)]"
                        }>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={loading || isProcessing || currentPlan}
                    className={`mt-6 inline-flex items-center justify-center px-5 py-3 rounded-full text-sm font-semibold transition font-['Be_Vietnam_Pro',system-ui,sans-serif] ${
                      isFeatured
                        ? "bg-[oklch(0.84_0.16_88)] text-[oklch(0.17_0_0)] hover:opacity-90"
                        : "bg-[oklch(0.97_0_0)] dark:bg-[oklch(0.18_0_0)] border border-[oklch(0.85_0_0)] dark:border-[oklch(1_0_0)_/_12%] hover:bg-[oklch(0.935_0_0)] dark:hover:bg-[oklch(0.22_0_0)] text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)]"
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
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] font-['Be_Vietnam_Pro',system-ui,sans-serif]">
            <span className="inline-flex items-center gap-1.5">
              <Globe2 className="h-3.5 w-3.5 text-[oklch(0.66_0.18_148)]" />
              Available worldwide
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[oklch(0.84_0.16_88)]" />
              Bank sync — Nigeria only
            </span>
            <span>· Cancel anytime</span>
          </div>
        </div>
      </section>
    </>
  );
}
