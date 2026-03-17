"use client";

import { useSubscription } from "../hooks/useSubscripion";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  Scale,
  Receipt,
  Smartphone,
  Wifi,
  Lightbulb,
  Tv,
  CreditCard,
  ChartColumnIncreasing,
  Lock,
  Clock,
} from "lucide-react";
import { useVerificationModal } from "@/app/context/verificationModalContext";
import { useUserContextData } from "@/app/context/userData";

interface ServicesGridProps {
  onActionComplete?: () => void;
  usage?: any;
}

const services = [
  {
    id: 1,
    title: "Tax Manager",
    description: "File your tax",
    icon: FileSpreadsheet,
    color: "bg-gray-50 text-gray-600",
    link: "/dashboard/services/tax-filing",
    requiredTier: "premium",
    featureKey: "tax_support",
    type: "core",
  },
  {
    id: 2,
    title: "Create Agreement",
    description: "Generate Agreement",
    icon: Scale,
    color: "bg-indigo-50 text-indigo-600",
    link: "/dashboard/services/contract",
    requiredTier: "free",
    featureKey: "contracts_per_month",
    type: "core",
  },
  {
    id: 3,
    title: "Create Receipt",
    description: "Generate Receipt",
    icon: Receipt,
    color: "bg-red-50 text-red-600",
    link: "/dashboard/services/receipt",
    requiredTier: "free",
    featureKey: "receipts_per_month",
    type: "core",
  },
  {
    id: 4,
    title: "Airtime",
    description: "Buy Airtime",
    icon: Smartphone,
    color: "bg-green-50 text-green-600",
    link: "/dashboard/services/buy-airtime",
    requiredTier: "free",
    featureKey: "transfer_fee",
    type: "utility",
  },
  {
    id: 5,
    title: "Internet Top up",
    description: "Buy Data",
    icon: Wifi,
    color: "bg-blue-50 text-blue-600",
    link: "/dashboard/services/buy-data",
    requiredTier: "free",
    featureKey: "transfer_fee",
    type: "utility",
  },
  {
    id: 6,
    title: "Buy Light",
    description: "Pay Electricity",
    icon: Lightbulb,
    color: "bg-green-50 text-[#2b825b]",
    link: "/dashboard/services/buy-power",
    requiredTier: "free",
    featureKey: "transfer_fee",
    type: "utility",
  },
  {
    id: 7,
    title: "Cable TV",
    description: "Pay TV Subscription",
    icon: Tv,
    color: "bg-purple-50 text-purple-600",
    link: "/dashboard/services/buy-cable-tv",
    requiredTier: "free",
    featureKey: "transfer_fee",
    type: "utility",
  },
  {
    id: 8,
    title: "Create Invoice",
    description: "Generate invoice",
    icon: CreditCard,
    color: "bg-red-50 text-red-600",
    link: "/dashboard/services/create-invoice",
    requiredTier: "free",
    featureKey: "invoices_per_month",
    type: "core",
  },
  {
    id: 9,
    title: "Bookkeeping",
    description: "Manage your finances",
    icon: ChartColumnIncreasing,
    color: "bg-blue-50 text-blue-600",
    link: "/dashboard/services/bookkeeping",
    requiredTier: "growth",
    featureKey: "bookkeeping_access",
    type: "core",
  },
];

export default function ServicesGrid({
  onActionComplete,
  usage,
}: ServicesGridProps) {
  const { canAccessFeature, userTier } = useSubscription();
  const router = useRouter();
  const { userData } = useUserContextData();
  const { openVerificationModal } = useVerificationModal();

  // Services that require BVN verification (excluding My Transaction)
  const bvnRequiredServices = [
    "/dashboard/fund-account",
    "/dashboard/fund-account/transfer-page",
    "/dashboard/services/buy-airtime",
    "/dashboard/services/buy-data",
    "/dashboard/services/buy-power",
    "/dashboard/services/buy-cable-tv",
  ];

  const handleServiceClick = (service: (typeof services)[0]) => {
    const isVerified = userData?.bvnVerification === "verified";
    const requiresBVN = bvnRequiredServices.includes(service.link);

    // Check BVN verification first for protected services
    if (requiresBVN && !isVerified) {
      openVerificationModal();
      return;
    }

    // Utility services are always accessible (after BVN check)
    if (service.type === "utility") {
      router.push(service.link);
      return;
    }

    // Core services need subscription check
    const hasAccess = canAccessFeature(service.featureKey);

    if (!hasAccess) {
      sessionStorage.setItem("intendedService", service.link);
      router.push(`/pricing?upgrade=${service.requiredTier}`);
      return;
    }

    router.push(service.link);
  };

  const getRemainingCount = (featureKey: string) => {
    if (!usage) return null;

    switch (featureKey) {
      case "invoices_per_month":
        return usage.invoices.remaining;
      case "receipts_per_month":
        return usage.receipts.remaining;
      case "contracts_per_month":
        return usage.contracts.remaining;
      default:
        return null;
    }
  };

  const getProgressPercentage = (featureKey: string) => {
    if (!usage) return 0;

    switch (featureKey) {
      case "invoices_per_month":
        return (usage.invoices.used / usage.invoices.limit) * 100;
      case "receipts_per_month":
        return (usage.receipts.used / usage.receipts.limit) * 100;
      case "contracts_per_month":
        return (usage.contracts.used / usage.contracts.limit) * 100;
      default:
        return 0;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-green-500";
    return "bg-green-500";
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {services.map((service) => {
        const isUtility = service.type === "utility";
        const hasAccess = isUtility
          ? true
          : canAccessFeature(service.featureKey);
        const remaining = getRemainingCount(service.featureKey);
        const progress = getProgressPercentage(service.featureKey);
        const Icon = service.icon;
        const isVerified = userData?.bvnVerification === "verified";
        const requiresBVN = bvnRequiredServices.includes(service.link);

        // Check if bookkeeping has active trial
        const hasBookkeepingTrial =
          service.featureKey === "bookkeeping_access" &&
          usage?.bookkeepingTrial?.isActive;

        // Determine if button should be disabled
        const isDisabled =
          (requiresBVN && !isVerified) ||
          (!hasAccess && !isUtility && !hasBookkeepingTrial);

        return (
          <button
            key={service.id}
            onClick={() => handleServiceClick(service)}
            className={`relative p-4 rounded-lg border-2 border-gray-900 dark:border-gray-50 
              shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] 
              hover:shadow-[6px_6px_0px_#111827] dark:hover:shadow-[6px_6px_0px_#fbbf24] 
              hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150
              ${isDisabled ? "opacity-75" : ""}`}
          >
            {/* BVN Required Indicator */}
            {requiresBVN && !isVerified && (
              <div className="absolute top-2 right-2">
                <Lock className="w-4 h-4 text-red-500" />
              </div>
            )}

            {/* Lock icon for inaccessible core services */}
            {!hasAccess &&
              !isUtility &&
              !hasBookkeepingTrial &&
              !requiresBVN && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
              )}

            {/* Trial icon for bookkeeping trial */}
            {hasBookkeepingTrial && (
              <div className="absolute top-2 right-2">
                <Clock className="w-4 h-4 text-green-500" />
              </div>
            )}

            {/* Usage badge for free tier core services */}
            {userTier === "free" &&
              remaining !== null &&
              !isUtility &&
              !hasBookkeepingTrial && (
                <div className="absolute top-2 left-2">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      remaining <= 1
                        ? "bg-red-100 text-red-600"
                        : remaining <= 3
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-green-100 text-green-600"
                    }`}
                  >
                    {remaining} left
                  </span>
                </div>
              )}

            {/* Trial badge for bookkeeping */}
            {hasBookkeepingTrial && (
              <div className="absolute top-2 left-2">
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-600">
                  {usage.bookkeepingTrial.daysRemaining} days trial
                </span>
              </div>
            )}

            <div
              className={`w-12 h-12 rounded-lg ${service.color} flex items-center justify-center mb-3
              ${isDisabled ? "opacity-75" : ""}`}
            >
              <Icon className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-left text-gray-900 dark:text-gray-50">
              {service.title}
              {requiresBVN && !isVerified && (
                <span className="block text-xs text-red-500 mt-1">
                  BVN required
                </span>
              )}
              {!hasAccess &&
                !isUtility &&
                !hasBookkeepingTrial &&
                !requiresBVN && (
                  <span className="block text-xs text-[#2b825b] mt-1">
                    Upgrade to {service.requiredTier}
                  </span>
                )}
              {hasBookkeepingTrial && (
                <span className="block text-xs text-green-600 mt-1">
                  Trial active
                </span>
              )}
            </h3>

            <p className="text-xs text-left text-gray-500 dark:text-gray-400">
              {service.description}
            </p>

            {/* Progress bar for free tier core services */}
            {userTier === "free" &&
              progress > 0 &&
              !isUtility &&
              !hasBookkeepingTrial && (
                <div className="mt-2 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(progress)}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
          </button>
        );
      })}
    </div>
  );
}
