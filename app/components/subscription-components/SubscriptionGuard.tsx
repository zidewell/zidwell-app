// components/subscription-components/SubscriptionGuard.tsx
"use client";

import { useSubscription } from "@/app/hooks/useSubscripion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Crown, Zap, Sparkles, Star, Lock, Building2, Briefcase } from "lucide-react";
import Link from "next/link";

interface SubscriptionPageGuardProps {
  children: React.ReactNode;
  requiredTier: "free" | "solopreneur" | "sme" | "enterprise" | "corporation";
  featureKey: string;
  title?: string;
  description?: string;
}

const tierConfig = {
  solopreneur: {
    icon: Briefcase,
    color: "text-blue-600",
    bg: "bg-blue-50",
    price: "₦4,900/month",
    yearlyPrice: "₦49,000/year",
    features: [
      "Up to 10 invoices",
      "Unlimited receipts",
      "Branded invoices",
      "Better expense tracking",
      "Basic financial insights",
    ],
  },
  sme: {
    icon: Building2,
    color: "text-(--color-accent-yellow)",
    bg: "bg-(--color-accent-yellow)/10",
    price: "₦29,900/month",
    yearlyPrice: "₦299,000/year",
    features: [
      "Tax calculator access",
      "Unlimited invoices",
      "Unlimited receipts",
      "Bank statement uploads",
      "Connect up to 3 bank accounts",
      "Financial statements (P&L, Cash Flow, Balance Sheet)",
      "1 extra team member access",
    ],
  },
  enterprise: {
    icon: Crown,
    color: "text-amber-600",
    bg: "bg-amber-50",
    price: "₦100,000/month",
    yearlyPrice: "₦1,000,000/year",
    features: [
      "Full tax calculator",
      "Tax filing support",
      "Financial statements",
      "Role-based permissions",
      "Request & approval system",
      "Connect 5 bank accounts",
      "10 contracts",
      "Dedicated onboarding support",
    ],
  },
  corporation: {
    icon: Sparkles,
    color: "text-purple-600",
    bg: "bg-purple-50",
    price: "₦300,000+/month",
    yearlyPrice: "₦3,000,000/year",
    features: [
      "Full tax filing (VAT, PAYE, WHT)",
      "Unlimited contracts",
      "Department-based access",
      "Unlimited bank accounts",
      "Payroll system",
      "Advanced financial reporting",
      "Priority onboarding support",
      "Dedicated account manager",
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
  const { canAccessFeature, loading, subscription, userTier } = useSubscription();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      setChecking(false);
      const hasAccess = canAccessFeature(featureKey);

      if (!hasAccess && requiredTier !== "free") {
        // Store the current URL to redirect back after upgrade
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
    const config = tierConfig[requiredTier as keyof typeof tierConfig];
    const Icon = config?.icon || Lock;

    // Get the display name for the tier
    const getTierDisplayName = (tier: string) => {
      if (tier === "solopreneur") return "Solopreneur";
      if (tier === "sme") return "SME";
      if (tier === "enterprise") return "Enterprise";
      if (tier === "corporation") return "Corporation";
      return tier;
    };

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Keep sidebar and header but show upgrade content */}
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-6">
          <div
            className={`w-20 h-20 rounded-full ${config?.bg || "bg-gray-100"} flex items-center justify-center mb-6`}
          >
            <Icon className={`w-10 h-10 ${config?.color || "text-gray-500"}`} />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">{title}</h1>

          <p className="text-gray-600 text-center max-w-md mb-8">
            {description}. Upgrade to {getTierDisplayName(requiredTier)} plan to unlock this feature
            and many more benefits.
          </p>

          {requiredTier !== "free" && config && (
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-8 max-w-md w-full">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Icon className={`w-5 h-5 ${config.color}`} />
                <span className="capitalize">{getTierDisplayName(requiredTier)} Plan Benefits</span>
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
              {config.yearlyPrice && (
                <p className="text-sm text-(--color-accent-yellow) mb-4">
                  {config.yearlyPrice}
                </p>
              )}
              <Link
                href={`/pricing?upgrade=${requiredTier}`}
                className={`block w-full py-3 px-4 rounded-lg text-center font-bold transition-all
                  ${
                    requiredTier === "enterprise"
                      ? "bg-amber-600 text-white hover:bg-amber-700"
                      : requiredTier === "corporation"
                        ? "bg-purple-600 text-white hover:bg-purple-700"
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