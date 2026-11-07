// app/pricing/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2, ArrowLeft, Crown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "../hooks/useSubscripion";
import { useUserContextData } from "../context/userData";
import { SubscriptionBadge } from "../components/subscription-components/subscriptionBadges";
import Footer from "../components/home-component/Footer";
import { Nav } from "../components/home-component/Nav";
import {
  ZIDWELL_PLANS,
  type BillingPeriod,
  type Plan,
  formatNaira,
} from "../components/home-component/plans";

function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { subscription, loading: subLoading, refetch: refetchSubscription } =
    useSubscription();
  const { userData, loading: userLoading } = useUserContextData();

  const [selectedBilling, setSelectedBilling] =
    useState<BillingPeriod>("monthly");
  const [processing, setProcessing] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  const activeTier = subscription?.tier;
  const isActivePaid =
    subscription?.status === "active" &&
    !!activeTier &&
    activeTier !== "starter";

  const activeUntilLabel = useMemo(() => {
    if (!subscription?.expires_at) return null;
    try {
      return new Date(subscription.expires_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return null;
    }
  }, [subscription?.expires_at]);

  const redirectToLogin = () => {
    const cb = encodeURIComponent(
      `/pricing?scroll=pricing&billing=${selectedBilling}`,
    );
    window.location.href = `/auth/login?callbackUrl=${cb}`;
  };

  const handleSubscribe = async (plan: Plan) => {
    if (plan.mailto) {
      window.location.href =
        "mailto:sales@zidwell.com?subject=Zidwell%20Subscription";
      return;
    }
    if (plan.id === "starter") {
      if (userLoading) return;
      if (!userData?.id) {
        const cb = encodeURIComponent("/dashboard/services/payment/dashboard");
        window.location.href = `/auth/login?callbackUrl=${cb}`;
        return;
      }
      router.push("/dashboard/services/payment/dashboard");
      return;
    }
    if (userLoading) return;
    if (!userData?.id) {
      redirectToLogin();
      return;
    }
    if (isActivePaid) {
      toast.info("You already have an active subscription", {
        description: activeUntilLabel
          ? `Active until ${activeUntilLabel}`
          : undefined,
      });
      return;
    }

    setProcessing(plan.id);
    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          planTier: plan.id,
          amount: selectedBilling === "yearly" ? plan.yearly : plan.monthly,
          billingPeriod: selectedBilling,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        toast.info("Session expired — please log in again");
        setTimeout(redirectToLogin, 900);
        return;
      }
      if (res.status === 400 && data?.code === "ALREADY_SUBSCRIBED") {
        toast.info("You already have an active subscription");
        return;
      }
      if (!res.ok || !data?.checkoutLink) {
        throw new Error(data?.error || `Checkout failed (${res.status}).`);
      }
      window.location.href = data.checkoutLink;
    } catch (err: any) {
      toast.error("Subscription failed", { description: err?.message });
    } finally {
      setProcessing(null);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payment = searchParams?.get("payment");
    if (payment === "success") {
      toast.success("Subscription activated!");
      refetchSubscription?.();
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      window.history.replaceState({}, "", url.toString());
    } else if (payment === "failed") {
      toast.error("Payment failed. Please try again.");
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      window.history.replaceState({}, "", url.toString());
    }
    const billingParam = searchParams?.get("billing");
    if (billingParam === "yearly" || billingParam === "monthly") {
      setSelectedBilling(billingParam);
    }
    const shouldScroll =
      searchParams?.get("scroll") === "pricing" ||
      !!searchParams?.get("upgrade");
    if (shouldScroll && sectionRef.current) {
      requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth" });
        setHighlight(true);
        setTimeout(() => setHighlight(false), 1600);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const isLoading = userLoading || subLoading;

  return (
    <>
      <Nav />
      <section
        id="pricing"
        ref={sectionRef}
        className={`relative py-20 md:py-32 bg-(--bg-primary) overflow-hidden transition-all duration-700 ${
          highlight ? "pricing-highlight" : ""
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="font-narrow-display text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-(--text-primary)">
              Simple plans that{" "}
              <span className="text-[var(--color-accent-yellow)]">grow</span>{" "}
              with you
            </h2>
            <p className="text-lg text-(--text-secondary)">
              Start free on Starter. Upgrade as you grow. Cancel anytime.
            </p>

            <div className="mt-4">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-[var(--color-accent-yellow)] hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>

            {subscription && subscription.tier !== "starter" && (
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-yellow)]/10 rounded-full">
                <span className="text-sm text-(--text-primary)">
                  Current Plan:
                </span>
                <SubscriptionBadge />
              </div>
            )}
          </div>

          <div className="mb-12 flex items-center justify-center">
            <div className="inline-flex items-center p-1 rounded-full bg-(--bg-primary) border-2 border-(--border-color)">
              <button
                type="button"
                onClick={() => setSelectedBilling("monthly")}
                disabled={processing !== null}
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
                disabled={processing !== null}
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {ZIDWELL_PLANS.map((plan) => {
              const isProcessing = processing === plan.id;
              const isCurrent =
                activeTier === plan.id && subscription?.status === "active";
              const isLocked =
                isActivePaid && plan.id !== "starter" && activeTier !== plan.id;
              const isFeatured = plan.highlighted;

              const priceNum =
                selectedBilling === "yearly" ? plan.yearly : plan.monthly;
              const periodLabel =
                plan.id === "starter"
                  ? "forever"
                  : selectedBilling === "yearly"
                    ? "per year"
                    : "per month";
              const ctaLabel = isCurrent
                ? "Current Plan"
                : isLocked
                  ? "Subscription active"
                  : plan.cta;

              return (
                <div
                  key={plan.id}
                  id={`plan-${plan.id}`}
                  className={`relative flex flex-col p-6 rounded-2xl transition-all duration-150 ${
                    isFeatured
                      ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)] border-2 border-(--border-color) shadow-[6px_6px_0px_var(--border-color)]"
                      : "bg-(--bg-primary) border-2 border-(--border-color) shadow-[4px_4px_0px_var(--border-color)]"
                  } ${isCurrent ? "ring-4 ring-[var(--color-ink)]/20" : ""}`}
                >
                  {isFeatured && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[var(--border-color)] text-(--text-primary) text-xs font-bold flex items-center gap-1 rounded-full">
                      <Sparkles className="w-3 h-3" />
                      POPULAR
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[var(--color-accent-yellow)] text-[var(--color-ink)] text-xs font-bold whitespace-nowrap rounded-full flex items-center gap-1">
                      <Crown className="w-3 h-3" />
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
                        {plan.id === "starter"
                          ? "Free"
                          : formatNaira(priceNum)}
                      </span>
                      <span
                        className={`text-sm ${
                          isFeatured
                            ? "text-[var(--color-ink)]/70"
                            : "text-(--text-secondary)"
                        }`}
                      >
                        /{periodLabel}
                      </span>
                    </div>
                    {selectedBilling === "yearly" && plan.id !== "starter" && (
                      <p className="text-xs mt-1 text-green-600 dark:text-green-400 font-semibold">
                        Save {formatNaira(plan.monthly * 12 - plan.yearly)}
                      </p>
                    )}
                    {plan.note && (
                      <p
                        className={`text-sm mt-3 ${
                          isFeatured
                            ? "text-[var(--color-ink)]/80"
                            : "text-(--text-secondary)"
                        }`}
                      >
                        {plan.note}
                      </p>
                    )}
                  </div>

                  {plan.features && (
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
                  )}

                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={
                      isLoading || isProcessing || isCurrent || isLocked
                    }
                    className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      isFeatured
                        ? "bg-(--bg-primary) text-(--text-primary) hover:bg-[var(--bg-secondary)] border-2 border-(--border-color)"
                        : "bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90"
                    }`}
                  >
                    {isProcessing ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      ctaLabel
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="mt-10 text-center text-xs text-(--text-secondary)">
            Prices in Naira. Card or bank transfer. Subscribe anytime, cancel
            anytime. A 3.5% fee applies to successful payments.
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