// app/components/profile-operations/SubscriptionSection.tsx
import React, { useState } from "react";
import { useUserContextData } from "@/app/context/userData";
import { useSubscription } from "@/app/hooks/useSubscripion";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { Check, Crown, Building2, Zap } from "lucide-react";
import {
  ZIDWELL_PLANS,
  formatNaira,
  type BillingPeriod,
  type PlanTier,
} from "@/app/components/home-component/plans";

const tierIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  starter: Zap,
  sme: Building2,
  enterprise: Crown,
};

interface SubscriptionSectionProps {
  currentTier?: PlanTier;
}

const SubscriptionSection: React.FC<SubscriptionSectionProps> = ({
  currentTier: propTier,
}) => {
  const router = useRouter();
  const { userData } = useUserContextData();
  const { userTier } = useSubscription();
  // Yearly default per your requirement
  const [billing, setBilling] = useState<BillingPeriod>("yearly");

  // Source of truth: DB → hook → prop → starter
  const rawTier =
    (userData?.subscription_tier as string | undefined) ||
    (userTier as string | undefined) ||
    propTier ||
    "starter";

  // "free" in the DB maps to the Starter plan (they're the same in plans.ts)
  const currentTierId: PlanTier =
    rawTier === "free" ? "starter" : (rawTier as PlanTier);

  const currentIndex = ZIDWELL_PLANS.findIndex((p) => p.id === currentTierId);
  const safeCurrentIndex = currentIndex === -1 ? 0 : currentIndex;
  const currentPlan = ZIDWELL_PLANS[safeCurrentIndex];

  const handleUpgrade = (tier: PlanTier, name: string) => {
    if (tier === "starter") return;
    Swal.fire({
      title: `Upgrade to ${name}`,
      text: `You're about to upgrade to the ${name} plan. You'll be redirected to payment.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "var(--color-accent-yellow)",
      confirmButtonText: "Proceed",
      cancelButtonText: "Cancel",
    }).then((r) => {
      if (r.isConfirmed) router.push(`/pricing?upgrade=${tier}`);
    });
  };

  const priceFor = (plan: (typeof ZIDWELL_PLANS)[number]) =>
    billing === "yearly" ? plan.yearly : plan.monthly;
  const suffix = billing === "yearly" ? "/yr" : "/mo";

  return (
    <div className="bg-(--bg-primary) border border-(--border-color) rounded-xl p-6 space-y-6 shadow-soft">
      {/* Current plan summary */}
      <div className="rounded-lg border border-(--border-color) bg-(--bg-secondary) p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-(--color-accent-yellow)/15">
            {React.createElement(tierIcons[currentPlan.id] || Zap, {
              className: "w-4 h-4 text-(--color-accent-yellow)",
            })}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-(--text-secondary) font-medium">
              Current Plan
            </p>
            <p className="text-sm font-semibold text-(--text-primary)">
              {currentPlan.name}
              <span className="ml-2 font-normal text-(--text-secondary)">
                {currentPlan.monthly === 0
                  ? "Free"
                  : `${formatNaira(currentPlan.monthly)}/mo`}
              </span>
            </p>
          </div>
        </div>
        <p className="text-xs text-(--text-secondary) max-w-md">
          {currentPlan.tagline}
        </p>
      </div>

      {/* Header + billing toggle (yearly default) */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-(--text-secondary)">
          Available Plans
        </h3>
        <div
          role="tablist"
          aria-label="Billing period"
          className="inline-flex rounded-lg border border-(--border-color) p-0.5 bg-(--bg-secondary)"
        >
          {(["yearly", "monthly"] as BillingPeriod[]).map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={billing === p}
              onClick={() => setBilling(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                billing === p
                  ? "bg-(--color-accent-yellow) text-(--color-ink)"
                  : "text-(--text-secondary) hover:text-(--text-primary)"
              }`}
            >
              {p}
              {p === "yearly" && (
                <span className="ml-1 text-[10px] opacity-80">(save)</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plan grid — ZIDWELL_PLANS already excludes Booster */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ZIDWELL_PLANS.map((plan, idx) => {
          const isCurrent = plan.id === currentPlan.id;
          const isUpgrade = idx > safeCurrentIndex;
          const Icon = tierIcons[plan.id] || Zap;
          const price = priceFor(plan);

          return (
            <div
              key={plan.id}
              className={`flex flex-col rounded-lg border p-5 transition-colors ${
                isCurrent
                  ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)/5"
                  : "border-(--border-color) hover:border-(--text-secondary)/40"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon
                    className={`w-4 h-4 ${isCurrent ? "text-(--color-accent-yellow)" : "text-(--text-secondary)"}`}
                  />
                  <span
                    className={`text-sm ${isCurrent ? "font-semibold text-(--text-primary)" : "text-(--text-secondary)"}`}
                  >
                    {plan.name}
                  </span>
                </div>
                {isCurrent && (
                  <span className="text-[10px] font-semibold text-(--color-accent-yellow) border border-(--color-accent-yellow) px-1.5 py-0.5 rounded">
                    CURRENT
                  </span>
                )}
              </div>

              <div className="mb-1">
                <span className="text-xl font-bold text-(--text-primary)">
                  {price === 0 ? "Free" : formatNaira(price)}
                </span>
                {price !== 0 && (
                  <span className="text-xs text-(--text-secondary)">
                    {suffix}
                  </span>
                )}
              </div>
              {billing === "yearly" && plan.monthly > 0 && (
                <p className="text-[11px] text-(--text-secondary) mb-3">
                  or {formatNaira(plan.monthly)}/mo billed monthly
                </p>
              )}

              <p className="text-xs text-(--text-secondary) mb-4">
                {plan.tagline}
              </p>

              <ul className="space-y-1.5 flex-1 mb-4">
                {plan.features?.map((f, i) => (
                  <li
                    key={i}
                    className="text-xs text-(--text-secondary) flex items-start gap-2"
                  >
                    <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-(--color-accent-yellow)" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="text-xs text-center py-2 text-(--text-secondary) border border-(--border-color) rounded-lg">
                  Your current plan
                </div>
              ) : isUpgrade ? (
                <button
                  type="button"
                  onClick={() => handleUpgrade(plan.id, plan.name)}
                  className="w-full bg-(--color-accent-yellow) hover:bg-(--color-accent-yellow)/90 text-(--color-ink) text-xs font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Upgrade to {plan.name}
                </button>
              ) : (
                <div className="text-xs text-center py-2 text-(--text-secondary) border border-(--border-color) rounded-lg">
                  Lower tier
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-(--text-secondary) text-center">
        Each plan is a clear upgrade in capability, not just more limits.
        <button
          onClick={() => router.push("/pricing")}
          className="ml-1 text-(--color-accent-yellow) hover:underline font-medium"
        >
          View full comparison
        </button>
      </p>
    </div>
  );
};

export default SubscriptionSection;
