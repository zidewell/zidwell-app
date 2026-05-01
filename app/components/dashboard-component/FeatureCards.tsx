"use client";

import { useSubscription } from "@/app/hooks/useSubscripion";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  FileText,
  Receipt,
  FileSignature,
  CreditCard,
  Wallet,
  ArrowLeftRight,
  Phone,
  Wifi,
  Lock,
  Clock,
  Lightbulb,
  Tv,
  Smartphone,
  Scale,
  FileSpreadsheet,
  ChartColumnIncreasing,
} from "lucide-react";
import { useVerificationModal } from "@/app/context/verificationModalContext";
import { useUserContextData } from "@/app/context/userData";

interface FeatureCardsProps {
  onActionComplete?: () => void;
  usage?: any;
}

// ✅ Define allowed emails (same as in middleware)
const ALLOWED_PAYMENT_EMAILS = new Set([
  "characterinternational@gmail.com",
  "abdullahtimilehin15@gmail.com",
  "ebrusikefavour@gmail.com",
  "skillfidelafrica@gmail.com",
  // "verifiedaboki@gmail.com",
  "abbalolo360@gmail.com"
]);

// Helper function to check if user can access payment page
const canAccessPaymentPage = (userEmail?: string | null) => {
  if (!userEmail) return false;
  return ALLOWED_PAYMENT_EMAILS.has(userEmail.toLowerCase());
};

// Helper function to get all features based on user access
const getFeatures = (userEmail?: string | null) => {
  const baseFeatures = [
    // Core Business Tools
    {
      id: 1,
      title: "Bookkeeping",
      desc: "Track daily income & expenses",
      icon: BookOpen,
      color: "bg-[#2b825b] text-white",
      link: "/dashboard/services/bookkeeping",
      requiredTier: "growth",
      featureKey: "bookkeeping_access",
      type: "core",
    },
    {
      id: 2,
      title: "Invoice",
      desc: "Create & send invoices",
      icon: FileText,
      color: "bg-[#3b82f6] text-white",
      link: "/dashboard/services/create-invoice",
      requiredTier: "free",
      featureKey: "invoices_per_month",
      type: "core",
    },
    {
      id: 3,
      title: "Receipt",
      desc: "Issue digital receipts",
      icon: Receipt,
      color: "bg-[#2b825b] text-white",
      link: "/dashboard/services/receipt",
      requiredTier: "free",
      featureKey: "receipts_per_month",
      type: "core",
    },
    {
      id: 4,
      title: "Contracts",
      desc: "Manage business contracts",
      icon: FileSignature,
      color: "bg-[#f5b041] text-[#141414]",
      link: "/dashboard/services/contract",
      requiredTier: "free",
      featureKey: "contracts_per_month",
      type: "core",
    },
    {
      id: 5,
      title: "Tax Manager",
      desc: "File your taxes",
      icon: FileSpreadsheet,
      color: "bg-[#2b825b] text-white",
      link: "/dashboard/services/tax-filing",
      requiredTier: "premium",
      featureKey: "tax_support",
      type: "core",
    },
    // Payment & Wallet
    {
      id: 6,
      title: "Fund Wallet",
      desc: "Top up your wallet",
      icon: Wallet,
      color: "bg-[#2b825b] text-white",
      link: "/dashboard/fund-account",
      requiredTier: "free",
      featureKey: "wallet_funding",
      type: "payment",
    },
    {
      id: 7,
      title: "Transfer",
      desc: "Send money instantly",
      icon: ArrowLeftRight,
      color: "bg-[#2b825b] text-white",
      link: "/dashboard/fund-account/transfer-page",
      requiredTier: "free",
      featureKey: "transfers",
      type: "payment",
    },
    // Utility Services (BVN Required)
    {
      id: 8,
      title: "Buy Airtime",
      desc: "Recharge any network",
      icon: Phone,
      color: "bg-[#f5b041] text-[#141414]",
      link: "/dashboard/services/buy-airtime",
      requiredTier: "free",
      featureKey: "airtime",
      type: "utility",
    },
    {
      id: 9,
      title: "Buy Data",
      desc: "Purchase data bundles",
      icon: Wifi,
      color: "bg-[#db3a34] text-white",
      link: "/dashboard/services/buy-data",
      requiredTier: "free",
      featureKey: "data",
      type: "utility",
    },
    {
      id: 10,
      title: "Buy Light",
      desc: "Pay electricity bills",
      icon: Lightbulb,
      color: "bg-[#f5b041] text-[#141414]",
      link: "/dashboard/services/buy-power",
      requiredTier: "free",
      featureKey: "electricity",
      type: "utility",
    },
    {
      id: 11,
      title: "Cable TV",
      desc: "Pay TV subscription",
      icon: Tv,
      color: "bg-[#3b82f6] text-white",
      link: "/dashboard/services/buy-cable-tv",
      requiredTier: "free",
      featureKey: "cable_tv",
      type: "utility",
    },
  ];


  if (canAccessPaymentPage(userEmail)) {
    baseFeatures.push({
      id: 12,
      title: "Payment Page",
      desc: "Accept payments online",
      icon: CreditCard,
      color: "bg-[#3b82f6] text-white",
      link: "/dashboard/services/payment/dashboard",
      requiredTier: "growth",
      featureKey: "payment_pages",
      type: "payment",
    });
  }


  return baseFeatures.sort((a, b) => a.id - b.id);
};

const FeatureCards = ({ onActionComplete, usage }: FeatureCardsProps) => {
  const { canAccessFeature, userTier } = useSubscription();
  const router = useRouter();
  const { userData } = useUserContextData();
  const { openVerificationModal } = useVerificationModal();

  // ✅ Get features based on user's email
  const features = getFeatures(userData?.email);

  // Services that require BVN verification
  const bvnRequiredServices = [
    "/dashboard/fund-account",
    "/dashboard/fund-account/transfer-page",
    "/dashboard/services/buy-airtime",
    "/dashboard/services/buy-data",
    "/dashboard/services/buy-power",
    "/dashboard/services/buy-cable-tv",
    "/dashboard/services/create-invoice",
  ];

  const handleFeatureClick = (feature: (typeof features)[0]) => {
    const isVerified = userData?.bvnVerification === "verified";
    const requiresBVN = bvnRequiredServices.includes(feature.link);

    console.log(requiresBVN, isVerified);
    // Check BVN verification first for protected services
    if (requiresBVN && !isVerified) {
      openVerificationModal();
      return;
    }

    // Utility services are always accessible after BVN check
    if (feature.type === "utility") {
      router.push(feature.link);
      onActionComplete?.();
      return;
    }

    // Payment services need BVN check (already done above)
    if (feature.type === "payment") {
      router.push(feature.link);
      onActionComplete?.();
      return;
    }

    // Core services need subscription check
    const hasAccess = canAccessFeature(feature.featureKey);

    // Check if bookkeeping has active trial
    const hasBookkeepingTrial =
      feature.featureKey === "bookkeeping_access" &&
      usage?.bookkeepingTrial?.isActive;

    if (!hasAccess && !hasBookkeepingTrial) {
      sessionStorage.setItem("intendedService", feature.link);
      router.push(`/pricing?upgrade=${feature.requiredTier}`);
      return;
    }

    router.push(feature.link);
    onActionComplete?.();
  };

  const getRemainingCount = (featureKey: string) => {
    if (!usage) return null;

    switch (featureKey) {
      case "invoices_per_month":
        return usage.invoices?.remaining;
      case "receipts_per_month":
        return usage.receipts?.remaining;
      case "contracts_per_month":
        return usage.contracts?.remaining;
      default:
        return null;
    }
  };

  const getProgressPercentage = (featureKey: string) => {
    if (!usage) return 0;

    switch (featureKey) {
      case "invoices_per_month":
        return (
          ((usage.invoices?.used || 0) / (usage.invoices?.limit || 1)) * 100
        );
      case "receipts_per_month":
        return (
          ((usage.receipts?.used || 0) / (usage.receipts?.limit || 1)) * 100
        );
      case "contracts_per_month":
        return (
          ((usage.contracts?.used || 0) / (usage.contracts?.limit || 1)) * 100
        );
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
      {features.map((feature) => {
        const isUtility = feature.type === "utility";
        const isPayment = feature.type === "payment";
        const hasAccess =
          isUtility || isPayment ? true : canAccessFeature(feature.featureKey);
        const remaining = getRemainingCount(feature.featureKey);
        const progress = getProgressPercentage(feature.featureKey);
        const Icon = feature.icon;
        const isVerified = userData?.bvnVerification === "verified";
        const requiresBVN = bvnRequiredServices.includes(feature.link);

        // Check if bookkeeping has active trial
        const hasBookkeepingTrial =
          feature.featureKey === "bookkeeping_access" &&
          usage?.bookkeepingTrial?.isActive;

        // Determine if button should be disabled
        const isDisabled =
          (requiresBVN && !isVerified) ||
          (!hasAccess && !isUtility && !isPayment && !hasBookkeepingTrial);

        return (
          <button
            key={feature.id}
            onClick={() => handleFeatureClick(feature)}
            className={`
              group relative flex flex-col items-center gap-3 p-4 
              bg-[#ffffff] dark:bg-[#171717] 
              border-2 border-[#242424] dark:border-[#474747] rounded-md
              shadow-[2px_2px_0px_#242424] dark:shadow-[2px_2px_0px_#000000] 
              hover:shadow-[6px_6px_0px_#242424] dark:hover:shadow-[6px_6px_0px_rgba(43,130,91,0.4)] 
              hover:-translate-x-px hover:-translate-y-px
              active:shadow-none active:translate-x-0.5 active:translate-y-0.5
              transition-all duration-150 text-center
              ${isDisabled ? "opacity-75 cursor-not-allowed" : "cursor-pointer"}
            `}
            disabled={isDisabled}
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
              !isPayment &&
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
              !isPayment &&
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

            {/* Icon */}
            <div
              className={`p-3.5 rounded-md border-2 border-[#242424] dark:border-[#474747] ${feature.color}`}
            >
              <Icon className="w-5 h-5" />
            </div>

            {/* Title */}
            <span className="text-sm font-bold text-[#141414] dark:text-[#f5f5f5] uppercase tracking-wide">
              {feature.title}
            </span>

            {/* Description */}
            <span className="text-xs text-[#6b6b6b] dark:text-[#a6a6a6] leading-tight hidden sm:block font-sans">
              {feature.desc}
            </span>

            {/* Status Messages */}
            {requiresBVN && !isVerified && (
              <span className="text-xs text-red-500 mt-1">BVN required</span>
            )}

            {!hasAccess &&
              !isUtility &&
              !isPayment &&
              !hasBookkeepingTrial &&
              !requiresBVN && (
                <span className="text-xs text-[#2b825b] mt-1">
                  Upgrade to {feature.requiredTier}
                </span>
              )}

            {/* Progress bar for free tier core services */}
            {userTier === "free" &&
              progress > 0 &&
              !isUtility &&
              !isPayment &&
              !hasBookkeepingTrial && (
                <div className="mt-2 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(progress)}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              )}
          </button>
        );
      })}
    </div>
  );
};

export default FeatureCards;