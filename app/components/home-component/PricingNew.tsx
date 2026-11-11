// app/components/home-component/PricingNew.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserContextData } from "@/app/context/userData";
import { useSubscription } from "@/app/hooks/useSubscripion";
import { Check, Loader2, Crown } from "lucide-react";
import { toast } from "sonner";
import {
  ZIDWELL_PLANS,
  type BillingPeriod,
  type Plan,
  formatNaira,
} from "@/app/components/home-component/plans";

// Default billing period — yearly is the default selection.
const DEFAULT_BILLING_PERIOD: BillingPeriod = "yearly";

export function PricingNew() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData, loading: userLoading } = useUserContextData();
  const {
    subscription,
    loading: subLoading,
    refetch: refetchSubscription,
  } = useSubscription();

  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedBilling, setSelectedBilling] =
    useState<BillingPeriod>(DEFAULT_BILLING_PERIOD);
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
    } else if (payment === "failed") {
      toast.error("Payment failed. Please try again.");
    }
    const billingParam = searchParams?.get("billing");
    if (billingParam === "yearly" || billingParam === "monthly") {
      setSelectedBilling(billingParam);
    }
    if (searchParams?.get("scroll") === "pricing" && sectionRef.current) {
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
    <section
      id="pricing"
      ref={sectionRef}
      className={`relative py-28 bg-background overflow-hidden transition-all duration-700 ${
        highlight ? "pricing-highlight" : ""
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-leaf mb-4">
            Pricing
          </p>
          <h2 className="font-narrow-display text-4xl sm:text-5xl font-semibold tracking-tight">
            Simple plans. Transparent fees.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start free on Starter. Upgrade as you grow. Cancel anytime.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center">
          <div className="inline-flex items-center p-1 rounded-full bg-surface border border-border">
            <button
              type="button"
              onClick={() => setSelectedBilling("yearly")}
              disabled={processing !== null}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                selectedBilling === "yearly"
                  ? "bg-primary-custom text-ink"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly{" "}
              <span className="text-[10px] ml-1 opacity-80">
                Save up to 20%
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedBilling("monthly")}
              disabled={processing !== null}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                selectedBilling === "monthly"
                  ? "bg-primary-custom text-ink"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ZIDWELL_PLANS.map((plan) => {
            const isProcessing = processing === plan.id;
            const isCurrent =
              activeTier === plan.id && subscription?.status === "active";
            const isLocked =
              isActivePaid && plan.id !== "starter" && activeTier !== plan.id;

            const priceNum =
              selectedBilling === "yearly" ? plan.yearly : plan.monthly;
            const priceLabel =
              selectedBilling === "yearly"
                ? plan.yearlyLabel
                : plan.monthlyLabel;
            const periodLabel =
              plan.id === "starter"
                ? "forever"
                : selectedBilling === "yearly"
                  ? "per year"
                  : "per month";
            const ctaLabel = isCurrent
              ? "Current plan"
              : isLocked
                ? "Subscription active"
                : plan.cta;

            return (
              <div
                key={plan.id}
                className={`relative squircle-lg p-5 sm:p-6 border transition-all duration-200 flex flex-col ${
                  plan.highlighted
                    ? "bg-ink text-background border-ink shadow-float"
                    : "bg-background border-border hover:bg-[var(--color-accent-yellow)]/5"
                } ${isCurrent ? "ring-2 ring-primary-custom" : ""}`}
              >
                {plan.highlighted && !isCurrent && (
                  <div className="absolute -top-4 left-6 rotate-[-2deg] bg-primary-custom text-ink text-[10px] font-semibold px-3 py-1 rounded-full shadow-soft whitespace-nowrap">
                    Most popular
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-4 left-6 rotate-[-2deg] bg-leaf text-background text-[10px] font-semibold px-3 py-1 rounded-full shadow-soft whitespace-nowrap flex items-center gap-1">
                    <Crown className="h-3 w-3" /> Current plan
                  </div>
                )}

                <p
                  className={`font-display text-base sm:text-lg font-semibold leading-tight ${
                    plan.highlighted ? "text-background" : "text-foreground"
                  }`}
                >
                  {plan.name}
                </p>
                <p
                  className={`text-[11px] sm:text-xs mt-1 leading-snug ${
                    plan.highlighted
                      ? "text-background/60"
                      : "text-muted-foreground"
                  }`}
                >
                  {plan.tagline}
                </p>

                <div className="mt-5 sm:mt-6">
                  {priceLabel && (
                    <span
                      className={`text-[11px] font-semibold ${
                        plan.highlighted
                          ? "text-background/60"
                          : "text-muted-foreground"
                      }`}
                    >
                      {priceLabel}{" "}
                    </span>
                  )}
                  <span
                    className={`font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tabular leading-none break-words ${
                      plan.highlighted ? "text-background" : "text-foreground"
                    }`}
                  >
                    {plan.id === "starter" ? "Free" : formatNaira(priceNum)}
                  </span>
                  <p
                    className={`mt-1.5 text-[10px] sm:text-[11px] leading-tight ${
                      plan.highlighted
                        ? "text-background/50"
                        : "text-muted-foreground"
                    }`}
                  >
                    /{periodLabel}
                    {selectedBilling === "yearly" && plan.id !== "starter" && (
                      <span className="ml-2 text-green-500 font-semibold">
                        Save {formatNaira(plan.monthly * 12 - plan.yearly)}
                      </span>
                    )}
                  </p>
                </div>

                {plan.features && (
                  <ul className="mt-4 flex-1 space-y-1.5">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-[11px] sm:text-xs leading-snug"
                      >
                        <Check
                          className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                            plan.highlighted
                              ? "text-primary-custom"
                              : "text-leaf"
                          }`}
                        />
                        <span
                          className={
                            plan.highlighted
                              ? "text-background/90"
                              : "text-foreground"
                          }
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isLoading || isProcessing || isCurrent || isLocked}
                  className={`mt-5 inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-center ${
                    plan.highlighted
                      ? "bg-primary-custom text-ink hover:opacity-90"
                      : "bg-surface text-foreground hover:bg-surface-2 border border-border"
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      Starting…
                    </>
                  ) : (
                    ctaLabel
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Prices in Naira. Card or bank transfer. Subscribe anytime, cancel
          anytime. A 3.5% fee applies to successful payments.
        </p>
      </div>
    </section>
  );
}