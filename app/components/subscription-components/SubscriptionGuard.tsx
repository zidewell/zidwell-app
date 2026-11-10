// app/components/subscription-components/SubscriptionGuard.tsx
"use client";

import { useSubscription } from "@/app/hooks/useSubscripion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Crown, Zap, Sparkles, Star, Lock, Briefcase } from "lucide-react";
import Link from "next/link";

interface SubscriptionPageGuardProps {
  children: React.ReactNode;
  requiredTier: "free" | "starter" | "sme" | "enterprise";
  featureKey: string;
  title?: string;
  description?: string;
}

// Real Zidwell tiers. starter is the free plan.
const tierConfig = {
  free: {
    icon: Star,
    color: "text-gray-600",
    bg: "bg-gray-100",
    price: "₦0",
    features: [
      "Up to 5 invoices",
      "Up to 5 receipts",
      "Business Plan Template",
      "Basic financial overview",
    ],
  },
  starter: {
    icon: Briefcase,
    color: "text-blue-600",
    bg: "bg-blue-50",
    price: "₦0",
    features: [
      "Business bank account",
      "Business Plan Template",
      "Automatic Bookkeeping",
      "Invoice Tool (5/month)",
      "Receipt Tool (5/month)",
      "Online storefront",
      "Document Vault",
    ],
  },
  sme: {
    icon: Zap,
    color: "text-(--color-accent-yellow)",
    bg: "bg-(--color-accent-yellow)/10",
    price: "₦199,900/year",
    features: [
      "Unlimited invoices & receipts",
      "International payments",
      "One Extra User",
      "Tax Calculator",
      "Financial Statements",
      "1 Contract",
      "Priority support",
    ],
  },
  enterprise: {
    icon: Crown,
    color: "text-amber-600",
    bg: "bg-amber-50",
    price: "₦599,900/year",
    features: [
      "Everything in SME, plus:",
      "Increased transaction limits",
      "Connect Bank Accounts",
      "Three Extra Users",
      "Lawyer Signature on Contracts",
      "10 Contracts",
      "Dedicated support team",
    ],
  },
};

export function SubscriptionPageGuard({
  children,
  requiredTier,
  featureKey,
  title = "Premium Feature",
  description = "This feature requires an upgraded plan",
}: SubscriptionPageGuardProps) {
  const { canAccessFeature, loading, userTier } = useSubscription();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      setChecking(false);
      const hasAccess = canAccessFeature(featureKey);

      if (!hasAccess && requiredTier !== "free") {
        sessionStorage.setItem("intendedUrl", window.location.pathname);
      }
    }
  }, [loading, canAccessFeature, featureKey, requiredTier]);

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-(--color-accent-yellow)"></div>
        </div>
      </div>
    );
  }

  const hasAccess = canAccessFeature(featureKey);

  if (!hasAccess) {
    const config = tierConfig[requiredTier];
    const Icon = config?.icon || Lock;

    const getTierDisplayName = (tier: string) => {
      if (tier === "starter") return "Starter (Free)";
      if (tier === "sme") return "SME";
      if (tier === "enterprise") return "Enterprise";
      return tier;
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-6">
          <div
            className={`w-20 h-20 rounded-full ${config?.bg || "bg-gray-100"} flex items-center justify-center mb-6`}
          >
            <Icon
              className={`w-10 h-10 ${config?.color || "text-gray-500"}`}
            />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">{title}</h1>

          <p className="text-gray-600 text-center max-w-md mb-8">
            {description}. Upgrade to {getTierDisplayName(requiredTier)} plan
            to unlock this feature and many more benefits.
          </p>

          {requiredTier !== "free" && config && (
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-8 max-w-md w-full">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Icon className={`w-5 h-5 ${config.color}`} />
                <span>{getTierDisplayName(requiredTier)} Plan Benefits</span>
              </h3>
              <ul className="space-y-3 mb-6">
                {config.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div
                      className={`w-5 h-5 rounded-full ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}
                    >
                      <div className={`w-2 h-2 rounded-full ${config.color}`} />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <p className="text-2xl font-bold text-gray-900 mb-4">
                {config.price}
              </p>
              <Link
                href={`/pricing?upgrade=${requiredTier}`}
                className={`block w-full py-3 px-4 rounded-lg text-center font-bold transition-all ${
                  requiredTier === "enterprise"
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : requiredTier === "sme"
                      ? "bg-(--color-accent-yellow) text-gray-900 hover:bg-(--color-accent-yellow)/90"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Upgrade to {getTierDisplayName(requiredTier)}
              </Link>
            </div>
          )}

          <p className="text-sm text-gray-500">
            Already subscribed?{" "}
            <button
              onClick={() => router.refresh()}
              className="text-(--color-accent-yellow) hover:underline"
            >
              Click here to refresh
            </button>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}