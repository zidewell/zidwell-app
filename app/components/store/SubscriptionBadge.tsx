// app/components/store/SubscriptionBadge.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Sparkles, Check } from "lucide-react";
import Link from "next/link";

export type SubscriptionTier = "starter" | "sme" | "enterprise" | "booster";

export interface SubscriptionState {
  status: "guest" | "loading" | "free" | "paid";
  tier?: SubscriptionTier;
  activeUntil?: string | null;
}

const tierLabels: Record<SubscriptionTier, string> = {
  starter: "Starter",
  sme: "SME",
  enterprise: "Enterprise",
  booster: "Booster",
};

export function useSubscriptionState(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [meRes, subRes] = await Promise.all([
          fetch("/api/user/me", { credentials: "include" }),
          fetch("/api/store/zidstore-subscription/status", {
            credentials: "include",
          }),
        ]);

        if (cancelled) return;

        if (meRes.status === 401) {
          setState({ status: "guest" });
          return;
        }

        if (!subRes.ok) {
          setState({ status: "free" });
          return;
        }

        const sub = await subRes.json();
        if (sub?.active && sub?.tier && sub.tier !== "starter") {
          setState({
            status: "paid",
            tier: sub.tier as SubscriptionTier,
            activeUntil: sub.current_period_end ?? null,
          });
        } else {
          setState({ status: "free" });
        }
      } catch {
        if (!cancelled) setState({ status: "free" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function SubscriptionBadge({
  className = "",
  showOnGuest = true,
}: {
  className?: string;
  showOnGuest?: boolean;
}) {
  const state = useSubscriptionState();

  if (state.status === "loading") {
    return (
      <div
        className={`inline-block h-7 w-28 animate-pulse rounded-full bg-(--bg-secondary) ${className}`}
        aria-hidden
      />
    );
  }

  if (state.status === "guest") {
    if (!showOnGuest) return null;
    // ✅ Use callbackUrl (matches working /pricing flow) + query param for scroll
    return (
      <Link
        href={`/auth/login?callbackUrl=${encodeURIComponent(
          "/online-store?scroll=zidstore-pricing",
        )}`}
        className={`inline-flex items-center gap-1.5 rounded-full border border-(--border-color) bg-(--bg-primary) px-3 py-1.5 text-[12px] font-bold text-(--text-secondary) transition-colors hover:border-(--text-primary) hover:text-(--text-primary) ${className}`}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Log in to subscribe
      </Link>
    );
  }

  if (state.status === "paid" && state.tier) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center gap-1.5 rounded-full bg-[#191919] px-3 py-1.5 text-[12px] font-bold text-white ring-1 ring-(--color-accent-yellow)/40 ${className}`}
      >
        <Crown className="h-3.5 w-3.5 text-(--color-accent-yellow)" />
        {tierLabels[state.tier]}
        <span className="inline-flex items-center gap-0.5 text-(--color-accent-yellow)">
          <Check className="h-3 w-3" />
          Active
        </span>
      </motion.div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-(--bg-secondary) px-3 py-1.5 text-[12px] font-bold text-(--text-secondary) ${className}`}
    >
      <Sparkles className="h-3.5 w-3.5" />
      Free plan
    </div>
  );
}