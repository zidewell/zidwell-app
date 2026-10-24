"use client";

import { useState } from "react";
import { useSubscription } from "@/app/hooks/useSubscripion";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  FileText,
  Receipt,
  FileSignature,
  FileSpreadsheet,
  Wallet,
  ArrowLeftRight,
  Phone,
  Wifi,
  Lock,
  Clock,
  Tv,
  Store,
  Zap,
  FolderLock,
  MapPin,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useVerificationModal } from "@/app/context/verificationModalContext";
import { useUserContextData } from "@/app/context/userData";

interface FeatureCardsProps {
  onActionComplete?: () => void;
  usage?: any;
}

/** Number of tiles shown before "See More" on mobile */
const MOBILE_COLLAPSED_COUNT = 8;

const getFeatures = () => {
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
      title: "Airtime",
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
      title: "Data",
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
    // -------- Business Suite (Coming Soon placeholders) --------
    {
      id: 12,
      title: "Vault",
      desc: "Securely store & share files",
      icon: FolderLock,
      gradient: "from-slate-500 to-gray-700",
      iconBg: "bg-slate-50 dark:bg-slate-950/30",
      iconColor: "text-slate-600 dark:text-slate-300",
      link: "#",
      requiredTier: "growth",
      featureKey: "document_vault",
      type: "suite",
      comingSoon: true,
    },
    {
      id: 13,
      title: "Virtual Office",
      desc: "Get a real mailing address",
      icon: MapPin,
      gradient: "from-teal-500 to-emerald-600",
      iconBg: "bg-teal-50 dark:bg-teal-950/30",
      iconColor: "text-teal-600 dark:text-teal-400",
      link: "#",
      requiredTier: "growth",
      featureKey: "virtual_office",
      type: "suite",
      comingSoon: true,
    },
    {
      id: 14,
      title: "Business Plan",
      desc: "Set goals & stay accountable",
      icon: Target,
      gradient: "from-purple-500 to-violet-600",
      iconBg: "bg-purple-50 dark:bg-purple-950/30",
      iconColor: "text-purple-600 dark:text-purple-400",
      link: "#",
      requiredTier: "growth",
      featureKey: "business_plan",
      type: "suite",
      comingSoon: true,
    },
  ];

  // Online Store — available to everyone.
  baseFeatures.push({
    id: 10,
    title: "Store",
    desc: "Buy products online",
    icon: Store,
    gradient: "from-fuchsia-500 to-purple-600",
    iconBg: "bg-fuchsia-50 dark:bg-fuchsia-950/30",
    iconColor: "text-fuchsia-600 dark:text-fuchsia-400",
    link: "/dashboard/services/payment/dashboard",
    requiredTier: "growth",
    featureKey: "online_store",
    type: "payment",
    isNew: true,
  } as any);

  return baseFeatures.sort((a: any, b: any) => a.id - b.id);
};

const FeatureCards = ({ onActionComplete, usage }: FeatureCardsProps) => {
  const { canAccessFeature, userTier } = useSubscription();
  const router = useRouter();
  const { userData } = useUserContextData();
  const { openVerificationModal } = useVerificationModal();
  const [expanded, setExpanded] = useState(false);

  const features = getFeatures();

  const bvnRequiredServices = [
    "/dashboard/fund-account",
    "/dashboard/fund-account/transfer-page",
    "/dashboard/services/buy-airtime",
    "/dashboard/services/buy-data",
    "/dashboard/services/buy-power",
    "/dashboard/services/buy-cable-tv",
    "/dashboard/services/create-invoice",
  ];

  const handleFeatureClick = (feature: any) => {
    if (feature.comingSoon) return;
    if (feature.link === "#") return;

    const isVerified = userData?.bvnVerification === "verified";
    const requiresBVN = bvnRequiredServices.includes(feature.link);

    if (requiresBVN && !isVerified) {
      openVerificationModal();
      return;
    }

    if (feature.type === "utility" || feature.type === "payment") {
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

  // Only show "See more" if there are more than the collapsed count
  const hasOverflow = features.length > MOBILE_COLLAPSED_COUNT;

  // Determine which features to render
  const visibleFeatures = expanded ? features : features.slice(0, MOBILE_COLLAPSED_COUNT);

  // Compute lock state per feature (shared by both mobile and desktop rendering)
  const getFeatureState = (feature: any) => {
    const isUtility = feature.type === "utility";
    const isPayment = feature.type === "payment";
    const comingSoon = feature.comingSoon === true;
    const isVerified = userData?.bvnVerification === "verified";
    const requiresBVN = bvnRequiredServices.includes(feature.link);
    const hasAccess =
      isUtility || isPayment ? true : canAccessFeature(feature.featureKey);
    const hasBookkeepingTrial =
      feature.featureKey === "bookkeeping_access" &&
      usage?.bookkeepingTrial?.isActive;

    const isLocked =
      comingSoon ||
      (requiresBVN && !isVerified) ||
      (!hasAccess && !isUtility && !isPayment && !hasBookkeepingTrial);

    return {
      isUtility,
      isPayment,
      comingSoon,
      requiresBVN,
      isVerified,
      hasAccess,
      hasBookkeepingTrial,
      isLocked,
    };
  };

  // ---- Mobile: OPay-style compact tile ----
  const renderMobileTile = (feature: any) => {
    const { isLocked, comingSoon, requiresBVN, isVerified, hasBookkeepingTrial } =
      getFeatureState(feature);
    const Icon = feature.icon;

    return (
      <button
        key={feature.id}
        onClick={() => handleFeatureClick(feature)}
        disabled={isLocked}
        className={`
          group relative flex flex-col items-center justify-start gap-1.5
          pt-3 pb-2 px-1 rounded-xl
          bg-white dark:bg-neutral-900
          border border-neutral-200/70 dark:border-neutral-800
          active:scale-[0.97] transition-transform duration-150
          w-full
          ${isLocked ? "opacity-60" : ""}
        `}
      >
        {/* Small status dots (top-right) */}
        {(comingSoon || (requiresBVN && !isVerified) || hasBookkeepingTrial) && (
          <span className="absolute top-1.5 right-1.5 flex items-center gap-0.5">
            {comingSoon && (
              <span className="px-1 py-[1px] rounded bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-[8px] font-bold uppercase leading-none">
                Soon
              </span>
            )}
            {!comingSoon && requiresBVN && !isVerified && (
              <Lock className="w-2.5 h-2.5 text-red-500" />
            )}
            {!comingSoon && hasBookkeepingTrial && !requiresBVN && (
              <Clock className="w-2.5 h-2.5 text-emerald-500" />
            )}
          </span>
        )}
        {!comingSoon && feature.isNew && !isLocked && (
          <span className="absolute top-1.5 right-1.5 px-1 py-[1px] rounded bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-[8px] font-bold uppercase leading-none">
            New
          </span>
        )}

        {/* Icon circle */}
        <div
          className={`
            flex items-center justify-center
            w-11 h-11 rounded-full
            ${feature.iconBg} ${feature.iconColor}
          `}
        >
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>

        {/* Label */}
        <span className="text-[11px] font-medium text-neutral-800 dark:text-neutral-200 text-center leading-tight line-clamp-2 px-0.5">
          {feature.title}
        </span>
      </button>
    );
  };

  // ---- Desktop: original richer card ----
  const renderDesktopCard = (feature: any) => {
    const { isUtility, isPayment, comingSoon, requiresBVN, isVerified, hasAccess, hasBookkeepingTrial, isLocked } =
      getFeatureState(feature);
    const Icon = feature.icon;
    const showNewBadge = feature.isNew && !comingSoon && !isLocked;
    const showSoonBadge = comingSoon;

    return (
      <button
        key={feature.id}
        onClick={() => handleFeatureClick(feature)}
        className={`
          group relative flex flex-col items-start gap-3 p-4 sm:p-5
          bg-white dark:bg-neutral-900
          border rounded-2xl
          shadow-sm
          hover:shadow-md hover:-translate-y-0.5
          active:translate-y-0 active:shadow-sm
          transition-all duration-200 ease-out
          text-left w-full
          ${
            comingSoon
              ? "border-amber-200/70 dark:border-amber-500/25 ring-1 ring-amber-100/60 dark:ring-amber-500/10 opacity-90 cursor-not-allowed"
              : feature.isNew && !isLocked
                ? "border-amber-200 dark:border-amber-500/30 ring-1 ring-amber-100 dark:ring-amber-500/10"
                : "border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
          }
          ${isLocked && !comingSoon ? "opacity-60 cursor-not-allowed" : ""}
          ${!isLocked && !comingSoon ? "cursor-pointer" : ""}
        `}
        disabled={isLocked}
      >
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {showSoonBadge && (
            <span className="flex items-center gap-1 px-1.5 py-[2px] rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/70 dark:border-amber-500/25 text-[9px] font-semibold uppercase tracking-wide leading-none">
              Soon
            </span>
          )}
          {showNewBadge && (
            <span className="flex items-center gap-1 px-1.5 py-[2px] rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/70 dark:border-amber-500/25 text-[9px] font-semibold uppercase tracking-wide leading-none">
              New
            </span>
          )}
          {requiresBVN && !isVerified && !comingSoon && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[10px] font-semibold">
              <Lock className="w-2.5 h-2.5" />
              BVN
            </span>
          )}
          {!hasAccess &&
            !isUtility &&
            !isPayment &&
            !hasBookkeepingTrial &&
            !requiresBVN &&
            !comingSoon && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-[10px] font-semibold">
                <Lock className="w-2.5 h-2.5" />
                {feature.requiredTier}
              </span>
            )}
          {hasBookkeepingTrial && !comingSoon && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
              <Clock className="w-2.5 h-2.5" />
              {usage.bookkeepingTrial.daysRemaining}d
            </span>
          )}
        </div>

        <div
          className={`
            relative flex items-center justify-center
            w-11 h-11 sm:w-12 sm:h-12
            rounded-xl
            ${feature.iconBg} ${feature.iconColor}
            transition-transform duration-200 group-hover:scale-105
          `}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
        </div>

        <div className="flex flex-col gap-0.5 w-full">
          <span className="text-sm sm:text-[15px] font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">
            {feature.title}
          </span>
          <span className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 leading-snug line-clamp-2">
            {feature.desc}
          </span>
        </div>

        {!hasAccess && !isUtility && !isPayment && !hasBookkeepingTrial && !requiresBVN && !comingSoon && (
          <div className="flex items-center gap-1 mt-auto pt-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
            <Zap className="w-3 h-3" />
            Upgrade to {feature.requiredTier}
          </div>
        )}
        {comingSoon && (
          <div className="flex items-center gap-1 mt-auto pt-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
            <Clock className="w-3 h-3" />
            Coming Soon
          </div>
        )}
        {requiresBVN && !isVerified && !comingSoon && (
          <div className="flex items-center gap-1 mt-auto pt-1 text-[10px] font-semibold text-red-500 dark:text-red-400">
            <Lock className="w-3 h-3" />
            Verify BVN to unlock
          </div>
        )}

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
  };

  return (
    <div>
      {/* -------- Mobile: OPay-style compact grid (4 cols) -------- */}
      <div className="sm:hidden">
        <div className="grid grid-cols-4 gap-2">
          {visibleFeatures.map(renderMobileTile)}
        </div>

        {/* See More / See Less toggle */}
        {hasOverflow && (
          <div className="flex justify-center mt-3">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs font-semibold text-(--color-accent-yellow) px-3 py-1.5 rounded-full hover:bg-(--color-accent-yellow)/10 transition-colors"
            >
              {expanded ? (
                <>
                  See Less <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  See More <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* -------- Desktop/tablet: original richer grid -------- */}
      <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {features.map(renderDesktopCard)}
      </div>
    </div>
  );
};

export default FeatureCards;