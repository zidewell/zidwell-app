// app/components/home-component/ZidStorePricing.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Crown,
  Loader2,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  useSubscriptionState,
  type SubscriptionTier,
} from "@/app/components/store/SubscriptionBadge";

const heading = "font-['Space_Grotesk',sans-serif]";

interface Plan {
  id: SubscriptionTier;
  name: string;
  price: number;
  period: string;
  tagline: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  mailto?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    period: "forever",
    tagline: "Perfect for testing the waters.",
    features: [
      "1 online store",
      "Up to 10 products",
      "Payment links",
      "Store Wallet",
      "Naira payments",
    ],
    cta: "Start free",
  },
  {
    id: "sme",
    name: "SME",
    price: 5000,
    period: "per month",
    tagline: "For growing businesses doing real volume.",
    features: [
      "Unlimited products",
      "Custom store slug",
      "Installment payments",
      "Bookkeeping & records",
      "Lower transaction fees",
      "Priority support",
    ],
    highlighted: true,
    cta: "Subscribe to SME",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 15000,
    period: "per month",
    tagline: "For established brands and multi-store sellers.",
    features: [
      "Everything in SME",
      "Multi-store management",
      "Advanced tax management",
      "Dedicated account manager",
      "API access",
      "Custom integrations",
    ],
    cta: "Subscribe to Enterprise",
  },
  {
    id: "booster",
    name: "Booster",
    price: 0,
    period: "contact sales",
    tagline: "Custom volume pricing for high-volume merchants.",
    features: [
      "Everything in Enterprise",
      "Negotiated transaction fees",
      "Dedicated infrastructure",
      "Custom SLAs",
      "White-glove onboarding",
    ],
    cta: "Talk to sales",
    mailto: true,
  },
];

const formatNaira = (n: number) => `₦${n.toLocaleString()}`;

export function ZidStorePricing() {
  const router = useRouter();
  const subState = useSubscriptionState();
  const [busyPlan, setBusyPlan] = useState<SubscriptionTier | null>(null);

  const isActivePaid = subState.status === "paid" && !!subState.tier;
  const activeTier = subState.tier;

  const activeUntilLabel = useMemo(() => {
    if (!subState.activeUntil) return null;
    try {
      return new Date(subState.activeUntil).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return null;
    }
  }, [subState.activeUntil]);

  // ✅ Matches working /pricing flow: callbackUrl + ?scroll= query param
  const redirectToLogin = () => {
    const callbackUrl = encodeURIComponent(
      "/online-store?scroll=zidstore-pricing",
    );
    window.location.href = `/auth/login?callbackUrl=${callbackUrl}`;
  };

  const handleSubscribe = async (plan: Plan) => {
    if (plan.mailto) {
      window.location.href =
        "mailto:sales@zidwell.com?subject=ZidStore%20Booster%20Plan";
      return;
    }

    if (plan.id === "starter") {
      if (subState.status === "guest") {
        redirectToLogin();
        return;
      }
      router.push("/dashboard/services/payment/dashboard");
      return;
    }

    // ── Auth gate for paid plans ──
    if (subState.status === "guest") {
      toast.info("Please log in to subscribe", {
        description: "We'll bring you right back here after.",
        duration: 3500,
      });
      setTimeout(redirectToLogin, 900);
      return;
    }

    if (subState.status === "loading") {
      toast.info("Checking your account…");
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

    // Free user → start checkout
    setBusyPlan(plan.id);
    try {
      // ✅ FIX: route expects `planTier` + `billingPeriod`, not `plan`
      const res = await fetch("/api/store/zidstore-subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          planTier: plan.id,
          billingPeriod: "monthly",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        toast.info("Session expired — please log in again");
        setTimeout(redirectToLogin, 900);
        return;
      }

      if (res.status === 400 && data?.error === "ALREADY_SUBSCRIBED") {
        toast.info("You already have an active subscription");
        return;
      }

      if (!res.ok || !data?.authorization_url) {
        throw new Error(
          data?.error || `Checkout failed (${res.status}). Please try again.`,
        );
      }

      window.location.href = data.authorization_url;
    } catch (err: any) {
      console.error("[ZidStorePricing] subscribe failed:", err);
      toast.error("Subscription failed", {
        description: err?.message || "Please try again.",
      });
    } finally {
      setBusyPlan(null);
    }
  };

  const isLoading = subState.status === "loading";

  return (
    <section className="mx-auto mt-24 max-w-[1200px] px-5 md:mt-32 md:px-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-(--bg-secondary) px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-(--text-secondary)">
            <Sparkles className="h-3.5 w-3.5 text-(--color-accent-yellow)" />
            Pricing
          </span>
          <h2
            className={`${heading} mt-5 max-w-2xl text-[32px] font-bold leading-[1.08] tracking-tight text-(--text-primary) md:text-[46px]`}
          >
            Simple plans. Transparent fees.
          </h2>
          <p className="mt-4 max-w-xl text-[16px] font-medium text-(--text-secondary) md:text-[17px]">
            Start free, upgrade as you grow. No hidden charges, no locked-in
            contracts. Cancel anytime.
          </p>
        </div>

        {isActivePaid && activeTier && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-2xl border border-(--color-accent-yellow)/40 bg-(--color-accent-yellow)/10 px-4 py-3"
          >
            <Crown className="h-4 w-4 text-(--color-accent-yellow)" />
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wide text-(--text-secondary)">
                Current plan
              </p>
              <p className="text-[15px] font-bold text-(--text-primary)">
                {activeTier.charAt(0).toUpperCase() + activeTier.slice(1)}
                {activeUntilLabel && (
                  <span className="ml-2 text-[13px] font-medium text-(--text-secondary)">
                    · until {activeUntilLabel}
                  </span>
                )}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Plan grid */}
      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((plan, i) => {
          const isCurrentPaid =
            isActivePaid && activeTier === plan.id && plan.id !== "starter";
          const isLocked =
            isActivePaid &&
            plan.id !== "starter" &&
            plan.id !== "booster" &&
            activeTier !== plan.id;
          const isStarterBlocked = isActivePaid && plan.id === "starter";
          const isThisLoading = busyPlan === plan.id;

          const disabled =
            isLoading ||
            isThisLoading ||
            isCurrentPaid ||
            isLocked ||
            isStarterBlocked;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className={`relative flex flex-col rounded-[28px] border p-6 transition-shadow ${
                plan.highlighted
                  ? "border-(--color-accent-yellow) bg-(--bg-primary) shadow-[0_20px_60px_-20px_rgba(245,184,0,0.35)]"
                  : "border-(--border-color) bg-(--bg-primary) shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-6 rounded-full bg-(--color-accent-yellow) px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#191919]">
                  Most popular
                </span>
              )}

              <div>
                <h3
                  className={`${heading} text-[22px] font-bold tracking-tight text-(--text-primary)`}
                >
                  {plan.name}
                </h3>
                <p className="mt-1.5 min-h-[40px] text-[14px] font-medium text-(--text-secondary)">
                  {plan.tagline}
                </p>
              </div>

              <div className="mt-5 flex items-baseline gap-1">
                <span
                  className={`${heading} text-[38px] font-bold tracking-tight text-(--text-primary)`}
                >
                  {plan.price === 0 && plan.id === "booster"
                    ? "Custom"
                    : formatNaira(plan.price)}
                </span>
                <span className="text-[13px] font-semibold text-(--text-secondary)">
                  /{plan.period}
                </span>
              </div>

              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-[14px] font-medium text-(--text-primary)"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-(--color-accent-yellow)" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isCurrentPaid ? (
                  <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-[14px] font-bold text-green-600 dark:text-green-400">
                    <Check className="h-4 w-4" />
                    {activeUntilLabel
                      ? `Active until ${activeUntilLabel}`
                      : "Current plan"}
                  </div>
                ) : isLocked ? (
                  <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-(--bg-secondary) px-4 py-3 text-[14px] font-bold text-(--text-secondary)">
                    <Lock className="h-4 w-4" />
                    Subscription active
                  </div>
                ) : isStarterBlocked ? (
                  <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-(--bg-secondary) px-4 py-3 text-[14px] font-bold text-(--text-secondary)">
                    <Check className="h-4 w-4" />
                    Already subscribed
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={disabled}
                    className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[14px] font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                      plan.highlighted
                        ? "bg-(--color-accent-yellow) text-[#191919] hover:bg-[#e6a800]"
                        : "bg-(--bg-secondary) text-(--text-primary) hover:bg-(--border-color)"
                    }`}
                  >
                    {isThisLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Starting…
                      </>
                    ) : plan.mailto ? (
                      <>
                        <Mail className="h-4 w-4" />
                        {plan.cta}
                      </>
                    ) : (
                      <>
                        {plan.cta}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Fee transparency note */}
      <div className="mt-10 rounded-[24px] border border-(--border-color) bg-(--bg-secondary) p-6">
        <p className="text-[14px] font-medium leading-relaxed text-(--text-secondary)">
          <span className="font-bold text-(--text-primary)">
            Transaction fee:
          </span>{" "}
          A <span className="font-bold text-(--text-primary)">3.5%</span> fee
          applies to every successful payment. For paid plans, the subscription
          is billed monthly to your card on file. Cancel anytime from your
          dashboard — you keep access until the end of the billing period.
        </p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-semibold text-(--text-secondary)">
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-(--color-accent-yellow)" />
            No hidden charges
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-(--color-accent-yellow)" />
            Cancel anytime
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-(--color-accent-yellow)" />
            Secure Paystack checkout
          </span>
        </div>
      </div>
    </section>
  );
}
