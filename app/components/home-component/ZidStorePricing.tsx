// app/components/home-component/ZidStorePricing.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2, Sparkles, PartyPopper, X, Lock } from "lucide-react";
import { toast } from "sonner";

type Billing = "monthly" | "yearly";

type Plan = {
  tier: "starter" | "sme" | "enterprise" | "booster";
  name: string;
  tagline: string;
  monthly: string;
  yearly: string;
  features: string[];
  cta: string;
  featured: boolean;
};

const PLANS: Plan[] = [
  {
    tier: "starter",
    name: "Starter",
    tagline: "For getting started",
    monthly: "Free",
    yearly: "Free",
    features: [
      "Online store",
      "Product images",
      "Payment links",
      "Basic bookkeeping",
      "Basic tax manager",
    ],
    cta: "Start Now",
    featured: false,
  },
  {
    tier: "sme",
    name: "SME",
    tagline: "For growing stores",
    monthly: "₦9,900",
    yearly: "₦99,900",
    features: [
      "Everything in Starter",
      "Product videos",
      "WhatsApp notifications",
      "CRM",
      "Customized customer emails",
      "Advanced bookkeeping + tax",
      "Invoicing + receipts",
    ],
    cta: "Subscribe",
    featured: true,
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    tagline: "For serious sellers",
    monthly: "₦29,900",
    yearly: "₦299,900",
    features: [
      "Everything in SME",
      "Turbo bookkeeping + tax",
      "Priority support",
      "Customized customer emails",
    ],
    cta: "Subscribe",
    featured: false,
  },
  {
    tier: "booster",
    name: "Booster",
    tagline: "For aggressive growth",
    monthly: "From ₦200,000",
    yearly: "From ₦2,400,000*",
    features: [
      "Everything in Enterprise",
      "Managed advertising",
      "Facebook / Instagram / Google / YouTube Ads",
      "Dedicated account manager",
    ],
    cta: "Talk to Sales",
    featured: false,
  },
];

export function ZidStorePricing() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [billing, setBilling] = useState<Billing>("monthly");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [pulsingTier, setPulsingTier] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  const [successModal, setSuccessModal] = useState<{
    planTier: string;
    amount: number | null;
    reference: string;
  } | null>(null);

  // ─── Subscription state ───
  const [activeSubscription, setActiveSubscription] = useState<{
    plan_tier: string;
    expires_at: string;
  } | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  const sectionRef = useRef<HTMLElement>(null);
  const autoTriggeredRef = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popupRef = useRef<Window | null>(null);

  const clearPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  };

  // ─── Fetch active ZidStore subscription ───
  const fetchActiveSubscription = async () => {
    try {
      const res = await fetch(
        "/api/store/zidstore-subscription/status",
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const data = await res.json();

      if (data?.active && data?.subscription) {
        setActiveSubscription({
          plan_tier: data.subscription.plan_tier,
          expires_at: data.subscription.current_period_end,
        });
      } else {
        setActiveSubscription(null);
      }
    } catch (err) {
      console.error("[ZidStorePricing] subscription fetch failed:", err);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCheckingSubscription(true);
      try {
        const res = await fetch(
          "/api/store/zidstore-subscription/status",
          { cache: "no-store" }
        );
        if (!res.ok) {
          if (!cancelled) setCheckingSubscription(false);
          return;
        }
        const data = await res.json();
        if (cancelled) return;

        if (data?.active && data?.subscription) {
          setActiveSubscription({
            plan_tier: data.subscription.plan_tier,
            expires_at: data.subscription.current_period_end,
          });
        }
      } catch (err) {
        console.error("[ZidStorePricing] subscription fetch failed:", err);
      } finally {
        if (!cancelled) setCheckingSubscription(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Show success ───
  const showSuccess = (
    planTier: string,
    amount: number | null,
    reference: string
  ) => {
    setLoadingTier(null);
    setSuccessModal({ planTier, amount, reference });
    try {
      toast.success(`${planTier.toUpperCase()} plan activated successfully!`, {
        description:
          amount != null
            ? `Charged ₦${Number(amount).toLocaleString()}`
            : undefined,
        duration: 8000,
      });
    } catch (err) {
      console.error("[ZidStorePricing] toast failed:", err);
    }
    // Refresh subscription state + server data
    fetchActiveSubscription();
    router.refresh();
  };

  const showCancel = () => {
    setLoadingTier(null);
    setNoticeMsg(
      "Checkout cancelled. No charge was made — try again whenever you're ready."
    );
    try {
      toast.info("Checkout cancelled — no charge was made.", {
        duration: 6000,
      });
    } catch {}
  };

  // ─── Subscribe ───
  const handleSubscribe = async (
    planTier: string,
    billingPeriod: "monthly" | "yearly"
  ) => {
    if (planTier === "starter") {
      router.push("/dashboard/services/payment/dashboard");
      return;
    }
    if (planTier === "booster") {
      window.location.href =
        "mailto:sales@zidwell.com?subject=Booster%20plan%20inquiry";
      return;
    }

    // ─── Client-side guard ───
    if (activeSubscription) {
      const endsAt = new Date(activeSubscription.expires_at);
      if (endsAt.getTime() > Date.now()) {
        toast.error(
          `You already have an active ${activeSubscription.plan_tier.toUpperCase()} plan. It expires on ${endsAt.toLocaleDateString()}.`
        );
        return;
      }
    }

    clearPolling();
    popupRef.current = null;
    setErrorMsg(null);
    setNoticeMsg(null);
    setLoadingTier(planTier);

    try {
      const res = await fetch("/api/store/zidstore-subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planTier, billingPeriod }),
      });

      const data = await res.json();

      if (data?.code === "ALREADY_SUBSCRIBED") {
        setLoadingTier(null);
        toast.error(data.error || "You already have an active subscription");
        await fetchActiveSubscription();
        return;
      }

      if (!res.ok || !data.success || !data.authorization_url) {
        throw new Error(data?.error || "Could not start checkout");
      }

      const width = 500;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        data.authorization_url,
        "paystack_checkout",
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      if (!popup || popup.closed) {
        window.location.href = data.authorization_url;
        return;
      }

      popupRef.current = popup;
      const reference = data.reference;

      const checkInterval = setInterval(async () => {
        if (popup.closed) {
          clearPolling();
          setTimeout(async () => {
            try {
              const lateRes = await fetch(
                `/api/payment-page/verify?reference=${encodeURIComponent(
                  reference
                )}`,
                { cache: "no-store" }
              );
              const lateData = await lateRes.json();

              if (lateData.success) {
                showSuccess(planTier, lateData.amount ?? null, reference);
                return;
              }
            } catch {}
            showCancel();
          }, 2000);
          return;
        }

        try {
          const statusRes = await fetch(
            `/api/payment-page/verify?reference=${encodeURIComponent(
              reference
            )}`,
            { cache: "no-store" }
          );
          const statusData = await statusRes.json();

          if (statusData.success) {
            clearPolling();
            try {
              popup.close();
            } catch {}
            popupRef.current = null;
            showSuccess(planTier, statusData.amount ?? null, reference);
            return;
          }
        } catch {}
      }, 1500);

      pollIntervalRef.current = checkInterval;

      pollTimeoutRef.current = setTimeout(() => {
        clearPolling();
        setLoadingTier(null);
        setNoticeMsg(
          "Checkout timed out. If you completed payment, your subscription will activate shortly."
        );
        try {
          toast.error("Checkout timed out");
        } catch {}
        try {
          if (popup && !popup.closed) popup.close();
        } catch {}
        popupRef.current = null;
      }, 10 * 60 * 1000);
    } catch (err: any) {
      console.error("[ZidStorePricing] checkout error:", err);
      setLoadingTier(null);
      setErrorMsg(err.message || "Could not start checkout");
      try {
        toast.error(err.message || "Could not start checkout");
      } catch {}
    }
  };

  useEffect(() => {
    return () => {
      clearPolling();
      try {
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close();
        }
      } catch {}
      popupRef.current = null;
    };
  }, []);

  // ─── Handle returns from login OR Paystack redirect ───
  useEffect(() => {
    const subscribeTier = searchParams.get("subscribe");
    const subscribePeriod = searchParams.get("period") as Billing | null;
    const reference =
      searchParams.get("reference") || searchParams.get("trxref");
    const subscribed = searchParams.get("subscribed");

    if ((reference || subscribed === "1") && !subscribeTier) {
      if (autoTriggeredRef.current) return;
      autoTriggeredRef.current = true;

      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("reference");
        url.searchParams.delete("trxref");
        url.searchParams.delete("from_checkout");
        url.searchParams.delete("subscribed");
        url.searchParams.delete("plan");
        url.searchParams.delete("period");
        url.searchParams.delete("status");
        window.history.replaceState({}, "", url.toString());
      }

      if (!reference) return;

      (async () => {
        try {
          const res = await fetch(
            `/api/payment-page/verify?reference=${encodeURIComponent(
              reference
            )}`,
            { cache: "no-store" }
          );
          const data = await res.json();

          if (data.success) {
            showSuccess(
              String(
                (data.metadata as any)?.plan_tier || "plan"
              ).toUpperCase(),
              data.amount ?? null,
              reference
            );
          } else {
            showCancel();
          }
        } catch (err) {
          console.error("[ZidStorePricing] return verify failed:", err);
        }
      })();
      return;
    }

    const paymentStatus = searchParams.get("status");
    if (paymentStatus === "cancelled" || paymentStatus === "failed") {
      setNoticeMsg(
        paymentStatus === "cancelled"
          ? "Checkout cancelled. You can try again whenever you're ready."
          : "Payment failed. Please try again or contact support."
      );
    }

    if (!subscribeTier) return;
    if (autoTriggeredRef.current) return;
    autoTriggeredRef.current = true;

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("subscribe");
      url.searchParams.delete("period");
      window.history.replaceState({}, "", url.toString());
    }

    if (subscribePeriod === "monthly" || subscribePeriod === "yearly") {
      setBilling(subscribePeriod);
    }

    setTimeout(() => {
      sectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setPulsingTier(subscribeTier);
      setTimeout(() => {
        void handleSubscribe(
          subscribeTier as Plan["tier"],
          (subscribePeriod as Billing) || "monthly"
        );
        setPulsingTier(null);
      }, 900);
    }, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <section
      id="zidstore-pricing"
      ref={sectionRef}
      className="py-24 sm:py-32 bg-(--bg-primary)"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent-yellow)] mb-3">
            ZidStore Pricing
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-(--text-primary)">
            Pick a plan. Sell online today.
          </h2>
          <p className="mt-4 text-(--text-secondary)">
            Simple pricing built for African businesses. Upgrade anytime.
          </p>
        </div>

    
        <div className="mt-8 flex items-center justify-center">
          <div className="inline-flex items-center p-1 rounded-full bg-(--bg-secondary) border border-(--border-color)">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                billing === "monthly"
                  ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)]"
                  : "text-(--text-secondary) hover:text-(--text-primary)"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling("yearly")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                billing === "yearly"
                  ? "bg-[var(--color-accent-yellow)] text-[var(--color-ink)]"
                  : "text-(--text-secondary) hover:text-(--text-primary)"
              }`}
            >
              Yearly{" "}
              <span className="text-[10px] ml-1 opacity-80">Save 17%</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-6 max-w-lg mx-auto rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-300 text-sm px-4 py-3">
            {errorMsg}
          </div>
        )}

        {noticeMsg && !errorMsg && (
          <div className="mt-6 max-w-lg mx-auto rounded-lg border border-[var(--color-accent-yellow)]/40 bg-[var(--color-accent-yellow)]/10 text-(--text-primary) text-sm px-4 py-3">
            {noticeMsg}
          </div>
        )}

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const isLoading = loadingTier === plan.tier;
            const isPulsing = pulsingTier === plan.tier;
            const price = billing === "yearly" ? plan.yearly : plan.monthly;

            const isCurrentPlan =
              activeSubscription?.plan_tier === plan.tier;
            const isLockedByOtherPlan =
              activeSubscription !== null &&
              plan.tier !== "starter" &&
              plan.tier !== "booster" &&
              !isCurrentPlan;
            const isStarterWhileSubscribed =
              activeSubscription !== null && plan.tier === "starter";

            return (
              <div
                key={plan.tier}
                className={`relative rounded-[28px] p-6 border flex flex-col transition-all duration-300 ${
                  plan.featured
                    ? "bg-[#191919] text-white border-[#191919] shadow-float"
                    : "bg-(--bg-primary) border-(--border-color)"
                } ${
                  isPulsing
                    ? "ring-4 ring-[var(--color-accent-yellow)] scale-[1.03] shadow-2xl"
                    : ""
                } ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-yellow)] text-[#191919] text-[10px] font-bold px-3 py-1">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full bg-green-500 text-white text-[10px] font-bold px-3 py-1">
                    <Check className="h-3 w-3" />
                    Your Plan
                  </div>
                )}

                <p
                  className={`font-display text-xl font-semibold ${
                    plan.featured ? "text-white" : "text-(--text-primary)"
                  }`}
                >
                  {plan.name}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    plan.featured ? "text-white/60" : "text-(--text-secondary)"
                  }`}
                >
                  {plan.tagline}
                </p>

                <div className="mt-5">
                  <p
                    className={`font-display text-3xl font-semibold ${
                      plan.featured ? "text-white" : "text-(--text-primary)"
                    }`}
                  >
                    {price}
                  </p>
                  <p
                    className={`mt-1 text-[11px] ${
                      plan.featured
                        ? "text-white/50"
                        : "text-(--text-secondary)"
                    }`}
                  >
                    {billing === "monthly" ? "/month" : "/year"}
                  </p>
                </div>

                <ul className="mt-6 space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className={`flex items-start gap-2 text-xs leading-snug ${
                        plan.featured
                          ? "text-white/90"
                          : "text-(--text-primary)"
                      }`}
                    >
                      <Check
                        className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                          plan.featured
                            ? "text-[var(--color-accent-yellow)]"
                            : "text-[var(--color-lemon-green)]"
                        }`}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* ─── Action button (context-aware) ─── */}
                {checkingSubscription ? (
                  <div className="mt-6 w-full py-3 rounded-full text-sm font-semibold text-center bg-(--bg-secondary) text-(--text-secondary)">
                    <Loader2 className="w-4 h-4 animate-spin inline" />
                  </div>
                ) : isCurrentPlan ? (
                  <div className="mt-6 w-full py-3 rounded-full text-sm font-semibold text-center bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/30">
                    ✓ Active until{" "}
                    {new Date(
                      activeSubscription!.expires_at
                    ).toLocaleDateString()}
                  </div>
                ) : isLockedByOtherPlan ? (
                  <div className="mt-6 w-full py-3 rounded-full text-sm font-semibold text-center bg-(--bg-secondary) text-(--text-secondary) border border-(--border-color) cursor-not-allowed inline-flex items-center justify-center gap-2">
                    <Lock className="size-3.5" />
                    Locked — subscription active
                  </div>
                ) : isStarterWhileSubscribed ? (
                  <div className="mt-6 w-full py-3 rounded-full text-sm font-semibold text-center bg-(--bg-secondary) text-(--text-secondary) border border-(--border-color) cursor-not-allowed">
                    Already subscribed
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSubscribe(plan.tier, billing)}
                    disabled={isLoading}
                    className={`mt-6 inline-flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-semibold transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                      plan.featured
                        ? "bg-[var(--color-accent-yellow)] text-[#191919] hover:opacity-90"
                        : "bg-(--bg-secondary) text-(--text-primary) border border-(--border-color) hover:bg-(--bg-primary)"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing…
                      </>
                    ) : (
                      plan.cta
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-(--text-secondary)">
          * Booster pricing is custom.{" "}
          <a
            href="mailto:sales@zidwell.com"
            className="text-[var(--color-accent-yellow)] hover:underline"
          >
            Contact sales
          </a>{" "}
          for a tailored quote.
        </p>
      </div>

      {/* Success Modal */}
      {successModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative max-w-md w-full bg-(--bg-primary) rounded-[2rem] border border-(--border-color) p-6 sm:p-8 text-center shadow-2xl">
            <button
              onClick={() => setSuccessModal(null)}
              className="absolute top-4 right-4 text-(--text-secondary) hover:text-(--text-primary) transition-colors"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>

            <div className="flex justify-center mb-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-green-500/10">
                <PartyPopper className="size-10 text-green-600" />
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-(--text-primary)">
              Subscription Active 🎉
            </h2>

            <p className="mt-3 text-sm text-(--text-secondary)">
              Your{" "}
              <span className="font-semibold text-(--color-accent-yellow)">
                {successModal.planTier.toUpperCase()}
              </span>{" "}
              plan is now live.
              {successModal.amount != null && (
                <> We received ₦{successModal.amount.toLocaleString()}.</>
              )}
            </p>

            <div className="mt-5 p-4 rounded-2xl bg-(--bg-secondary) text-xs text-(--text-secondary) font-mono break-all">
              {successModal.reference}
            </div>

            <p className="mt-3 text-xs text-(--text-secondary)">
              A receipt has been emailed to you.
            </p>

            <div className="mt-6 space-y-2">
              <button
                onClick={() => {
                  setSuccessModal(null);
                  router.push("/dashboard/services/payment/dashboard");
                }}
                className="w-full rounded-2xl bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) px-6 py-3.5 text-sm font-bold transition-colors"
              >
                Go to Dashboard →
              </button>
              <button
                onClick={() => setSuccessModal(null)}
                className="w-full rounded-2xl px-6 py-3 text-sm font-medium text-(--text-secondary) hover:bg-(--bg-secondary) transition-colors"
              >
                Stay on this page
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
