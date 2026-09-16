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
  FileSpreadsheet,
  Store,
  Zap,
} from "lucide-react";
import { useVerificationModal } from "@/app/context/verificationModalContext";
import { useUserContextData } from "@/app/context/userData";
import { ALLOWED_PAYMENT_EMAILS } from "./DashboardSidebar";

interface FeatureCardsProps {
  onActionComplete?: () => void;
  usage?: any;
}

const canAccessPaymentPage = (userEmail?: string | null) => {
  if (!userEmail) return false;
  return ALLOWED_PAYMENT_EMAILS.has(userEmail.toLowerCase());
};

const getFeatures = (userEmail?: string | null) => {
  const baseFeatures = [
    {
      id: 1,
      title: "Bookkeeping",
      desc: "Track daily income & expenses",
      icon: BookOpen,
      gradient: "from-amber-400 to-yellow-500",
      iconBg: "bg-amber-50 dark:bg-amber-950/30",
      iconColor: "text-amber-600 dark:text-amber-400",
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
      gradient: "from-blue-500 to-indigo-600",
      iconBg: "bg-blue-50 dark:bg-blue-950/30",
      iconColor: "text-blue-600 dark:text-blue-400",
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
      gradient: "from-emerald-500 to-teal-600",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
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
      gradient: "from-orange-500 to-amber-600",
      iconBg: "bg-orange-50 dark:bg-orange-950/30",
      iconColor: "text-orange-600 dark:text-orange-400",
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
      gradient: "from-violet-500 to-purple-600",
      iconBg: "bg-violet-50 dark:bg-violet-950/30",
      iconColor: "text-violet-600 dark:text-violet-400",
      link: "/dashboard/services/tax-filing",
      requiredTier: "premium",
      featureKey: "tax_support",
      type: "core",
    },
    {
      id: 6,
      title: "Fund Wallet",
      desc: "Top up your wallet",
      icon: Wallet,
      gradient: "from-green-500 to-emerald-600",
      iconBg: "bg-green-50 dark:bg-green-950/30",
      iconColor: "text-green-600 dark:text-green-400",
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
      gradient: "from-sky-500 to-cyan-600",
      iconBg: "bg-sky-50 dark:bg-sky-950/30",
      iconColor: "text-sky-600 dark:text-sky-400",
      link: "/dashboard/fund-account/transfer-page",
      requiredTier: "free",
      featureKey: "transfers",
      type: "payment",
    },
    {
      id: 8,
      title: "Buy Airtime",
      desc: "Recharge any network",
      icon: Phone,
      gradient: "from-rose-500 to-pink-600",
      iconBg: "bg-rose-50 dark:bg-rose-950/30",
      iconColor: "text-rose-600 dark:text-rose-400",
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
      gradient: "from-cyan-500 to-blue-600",
      iconBg: "bg-cyan-50 dark:bg-cyan-950/30",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      link: "/dashboard/services/buy-data",
      requiredTier: "free",
      featureKey: "data",
      type: "utility",
    },
    // {
    //   id: 10,
    //   title: "Buy Light",
    //   desc: "Pay electricity bills",
    //   icon: Lightbulb,
    //   gradient: "from-yellow-500 to-orange-500",
    //   iconBg: "bg-yellow-50 dark:bg-yellow-950/30",
    //   iconColor: "text-yellow-600 dark:text-yellow-400",
    //   link: "/dashboard/services/buy-power",
    //   requiredTier: "free",
    //   featureKey: "electricity",
    //   type: "utility",
    // },
    {
      id: 11,
      title: "Cable TV",
      desc: "Pay TV subscription",
      icon: Tv,
      gradient: "from-indigo-500 to-blue-600",
      iconBg: "bg-indigo-50 dark:bg-indigo-950/30",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      link: "/dashboard/services/buy-cable-tv",
      requiredTier: "free",
      featureKey: "cable_tv",
      type: "utility",
    },
  ];

  if (canAccessPaymentPage(userEmail)) {
    baseFeatures.push({
      id: 1.5,
      title: "Online Store",
      desc: "Buy products online",
      icon: Store,
      gradient: "from-fuchsia-500 to-purple-600",
      iconBg: "bg-fuchsia-50 dark:bg-fuchsia-950/30",
      iconColor: "text-fuchsia-600 dark:text-fuchsia-400",
      link: "/dashboard/services/payment/dashboard",
      requiredTier: "growth",
      featureKey: "online_store",
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

  const features = getFeatures(userData?.email);

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

    if (requiresBVN && !isVerified) {
      openVerificationModal();
      return;
    }

    if (feature.type === "utility") {
      router.push(feature.link);
      onActionComplete?.();
      return;
    }

    if (feature.type === "payment") {
      router.push(feature.link);
      onActionComplete?.();
      return;
    }

    const hasAccess = canAccessFeature(feature.featureKey);
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
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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
        const hasBookkeepingTrial =
          feature.featureKey === "bookkeeping_access" &&
          usage?.bookkeepingTrial?.isActive;
        const isLocked =
          (requiresBVN && !isVerified) ||
          (!hasAccess && !isUtility && !isPayment && !hasBookkeepingTrial);

        return (
          <button
            key={feature.id}
            onClick={() => handleFeatureClick(feature)}
            className={`
              group relative flex flex-col items-start gap-3 p-4 sm:p-5
              bg-white dark:bg-neutral-900
              border border-neutral-200/80 dark:border-neutral-800
              rounded-2xl
              shadow-sm
              hover:shadow-lg hover:border-neutral-300 dark:hover:border-neutral-700
              hover:-translate-y-0.5
              active:translate-y-0 active:shadow-sm
              transition-all duration-200 ease-out
              text-left w-full
              ${isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
            `}
            disabled={isLocked}
          >
            {/* Top-right status badge */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              {requiresBVN && !isVerified && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[10px] font-semibold">
                  <Lock className="w-2.5 h-2.5" />
                  BVN
                </span>
              )}
              {!hasAccess &&
                !isUtility &&
                !isPayment &&
                !hasBookkeepingTrial &&
                !requiresBVN && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-[10px] font-semibold">
                    <Lock className="w-2.5 h-2.5" />
                    {feature.requiredTier}
                  </span>
                )}
              {hasBookkeepingTrial && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                  <Clock className="w-2.5 h-2.5" />
                  {usage.bookkeepingTrial.daysRemaining}d
                </span>
              )}
            </div>

            {/* Icon */}
            <div
              className={`
                relative flex items-center justify-center
                w-11 h-11 sm:w-12 sm:h-12
                rounded-xl
                ${feature.iconBg}
                ${feature.iconColor}
                transition-transform duration-200
                group-hover:scale-105
              `}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
            </div>

            {/* Text content */}
            <div className="flex flex-col gap-0.5 w-full">
              <span className="text-sm sm:text-[15px] font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">
                {feature.title}
              </span>
              <span className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 leading-snug line-clamp-2">
                {feature.desc}
              </span>
            </div>

            {/* Usage badge for free tier */}
            {userTier === "free" &&
              remaining !== null &&
              !isUtility &&
              !isPayment &&
              !hasBookkeepingTrial && (
                <div className="flex items-center justify-between w-full mt-auto pt-1">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      remaining <= 1
                        ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                        : remaining <= 3
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {remaining} left
                  </span>
                  {progress > 0 && (
                    <div className="w-12 h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

            {/* Upgrade hint */}
            {!hasAccess &&
              !isUtility &&
              !isPayment &&
              !hasBookkeepingTrial &&
              !requiresBVN && (
                <div className="flex items-center gap-1 mt-auto pt-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  <Zap className="w-3 h-3" />
                  Upgrade to {feature.requiredTier}
                </div>
              )}

            {/* BVN required hint */}
            {requiresBVN && !isVerified && (
              <div className="flex items-center gap-1 mt-auto pt-1 text-[10px] font-semibold text-red-500 dark:text-red-400">
                <Lock className="w-3 h-3" />
                Verify BVN to unlock
              </div>
            )}

            {/* Subtle gradient accent on hover */}
            <div
              className={`
                pointer-events-none absolute inset-0 rounded-2xl
                bg-gradient-to-br ${feature.gradient}
                opacity-0 group-hover:opacity-[0.03]
                transition-opacity duration-200
              `}
            />
          </button>
        );
      })}
    </div>
  );
};

export default FeatureCards;