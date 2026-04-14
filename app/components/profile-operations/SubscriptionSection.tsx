// app/components/new-profile/SubscriptionSection.tsx
import React from "react";
import { useUserContextData } from "@/app/context/userData";
import { useSubscription } from "@/app/hooks/useSubscripion";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { Crown, Zap, Sparkles, Star, AlertCircle } from "lucide-react";

type Tier = "free" | "zidlite" | "growth" | "premium" | "elite";

interface SubscriptionSectionProps {
  currentTier?: Tier;
}

// Updated tiers with correct pricing from your plans array
const tiers: {
  id: Tier;
  name: string;
  price: string;
  yearlyPrice?: string;
  features: string[];
  icon?: any;
}[] = [
{
  id: "free",
  name: "Free Trial",
  price: "₦0/mo",
  features: [
    "Unlimited money transfers at N50 per transfer",
    "1 month free trial of Bookkeeping",
    "1 month free trial of Tax Calculator",
    "10 Invoices total",
    "10 Receipts total",
    "1 Contract total",
    "Basic support",
  ],
  icon: Star,
},
  {
    id: "zidlite",
    name: "ZidLite",
    price: "₦4,900/mo",
    yearlyPrice: "₦49,000/year (save ₦9,800)",
    features: [
      "Everything in Free, plus:",
      "Unlimited money transfers at N50 per transfer",
      "Bookkeeping - 2 weeks free trial",
      "Tax Calculator - 2 weeks free trial",
      "20 Invoices total",
      "20 Receipts total",
      "2 Contracts total",
      "Access to WhatsApp Business Community",
      "WhatsApp support",
    ],
    icon: Zap,
  },
  {
    id: "growth",
    name: "Growth",
    price: "₦9,900/mo",
    yearlyPrice: "₦99,000/year (save ₦19,800)",
    features: [
      "Everything in Free, plus:",
      "Unlimited Invoices",
      "Unlimited Receipts",
      "5 Contracts total",
      "Bookkeeping tool",
      "Tax Calculator",
      "Access to WhatsApp Business Community",
      "WhatsApp support",
    ],
    icon: Zap,
  },
  {
    id: "premium",
    name: "Premium",
    price: "₦49,900/mo",
    yearlyPrice: "₦499,000/year (save ₦99,800)",
    features: [
      "Everything in Growth, plus:",
      "Invoice Payment Reminders",
      "Unlimited contracts",
      "Financial Statement Preparation",
      "Tax Calculation Support",
      "Tax filing support",
      "Priority support",
    ],
    icon: Crown,
  },
  {
    id: "elite",
    name: "Elite",
    price: "₦100,000+", // Removed the period property
    yearlyPrice: "Customized price",
    features: [
      "Everything in Premium, plus:",
      "Full Tax Filing Support",
      "VAT Filing",
      "PAYE Filing",
      "WHT Filing",
      "CIT Audit",
      "Monthly Tax Filing",
      "Yearly Tax Filing",
      "CFO-Level Financial Guidance",
      "Direct WhatsApp Support",
      "Annual Audit Coordination",
    ],
    icon: Sparkles,
  },
];

const SubscriptionSection: React.FC<SubscriptionSectionProps> = ({
  currentTier: propTier,
}) => {
  const { subscribe, refreshSubscription } = useUserContextData();
  const { userTier, isPremium, isGrowth, isElite, isZidLite, isFree } =
    useSubscription();

  const router = useRouter();

  // Use tier from hook, fallback to prop if provided
  const currentTier = userTier || propTier || "free";

  // Get tier display info
  const getTierInfo = (tierId: Tier) => {
    const tier = tiers.find((t) => t.id === tierId);
    if (!tier) return null;

    let bgColor = "";
    let textColor = "";
    let borderColor = "";

    switch (tierId) {
      case "elite":
        bgColor = "bg-purple-100 dark:bg-purple-900/20";
        textColor = "text-purple-600 dark:text-purple-400";
        borderColor = "border-purple-200 dark:border-purple-800";
        break;
      case "premium":
        bgColor = "bg-[#2b825b]/10";
        textColor = "text-[#2b825b]";
        borderColor = "border-[#2b825b]";
        break;
      case "growth":
        bgColor = "bg-green-100 dark:bg-green-900/20";
        textColor = "text-green-600 dark:text-green-400";
        borderColor = "border-green-200 dark:border-green-800";
        break;
      case "zidlite":
        bgColor = "bg-blue-100 dark:bg-blue-900/20";
        textColor = "text-blue-600 dark:text-blue-400";
        borderColor = "border-blue-200 dark:border-blue-800";
        break;
      default:
        bgColor = "bg-gray-100 dark:bg-gray-800";
        textColor = "text-gray-600 dark:text-gray-400";
        borderColor = "border-gray-200 dark:border-gray-700";
    }

    return { ...tier, bgColor, textColor, borderColor };
  };

  const handleSubscribe = async (tierId: Tier) => {
    if (tierId === "free") return;

    Swal.fire({
      title: "Upgrade Subscription",
      text: `You're about to upgrade to the ${tiers.find((t) => t.id === tierId)?.name} plan. You'll be redirected to payment.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2b825b",
      confirmButtonText: "Proceed",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        router.push(`/pricing?upgrade=${tierId}`);
      }
    });
  };

  // Get current plan summary
  const currentPlanInfo = getTierInfo(currentTier as Tier);

  return (
    <div className="neo-card bg-card p-6">
      {/* Current Plan Summary */}
      <div className="mb-6 p-4 rounded-lg border-2 border-[#2b825b] bg-[#2b825b]/5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {currentPlanInfo?.icon && (
              <div className={`p-2 rounded-full ${currentPlanInfo.bgColor}`}>
                <currentPlanInfo.icon
                  className={`w-5 h-5 ${currentPlanInfo.textColor}`}
                />
              </div>
            )}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Current Plan: {currentPlanInfo?.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {currentPlanInfo?.price} • {currentPlanInfo?.features[0]}
              </p>
              {currentPlanInfo?.yearlyPrice && (
                <p className="text-xs text-[#2b825b] mt-1">
                  {currentPlanInfo.yearlyPrice}
                </p>
              )}
            </div>
          </div>

          {currentTier !== "elite" && (
            <button
              onClick={() => handleSubscribe("elite")}
              className="bg-[#2b825b] hover:bg-[#1e5d42] text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Upgrade to Elite
            </button>
          )}
        </div>
      </div>

      <h3 className="font-heading text-foreground text-sm mb-5">
        AVAILABLE PLANS
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {tiers.map((tier) => {
          const isCurrent = tier.id === currentTier;
          const tierInfo = getTierInfo(tier.id);

          // Determine if this is an upgrade or downgrade
          const tierOrder = ["free", "zidlite", "growth", "premium", "elite"];
          const currentIndex = tierOrder.indexOf(currentTier);
          const tierIndex = tierOrder.indexOf(tier.id);
          const isUpgrade = tierIndex > currentIndex;
          const isDowngrade = tierIndex < currentIndex;

          return (
            <div
              key={tier.id}
              className={`border-2 p-4 transition-all ${
                isCurrent
                  ? "border-[#2b825b] shadow-[4px_4px_0px_#2b825b]"
                  : "border-foreground hover:shadow-[2px_2px_0px_#2b825b]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {tier.icon && (
                    <tier.icon
                      className={`w-4 h-4 ${isCurrent ? tierInfo?.textColor : "text-muted-foreground"}`}
                    />
                  )}
                  <span
                    className={` text-sm ${isCurrent ? "text-foreground font-bold" : "text-muted-foreground"}`}
                  >
                    {tier.name}
                  </span>
                </div>
                {isCurrent && (
                  <span className="text-[10px]  text-[#2b825b] border-2 border-[#2b825b] px-1.5 py-0.5">
                    CURRENT
                  </span>
                )}
              </div>

              <span className="text-lg font-heading text-foreground block mb-1">
                {tier.price}
              </span>
              {tier.yearlyPrice && (
                <span className="text-[10px] text-[#2b825b] block mb-3">
                  {tier.yearlyPrice}
                </span>
              )}

              <ul className="space-y-1.5 min-h-[140px]">
                {tier.features.map((f, index) => (
                  <li
                    key={index}
                    className="text-xs font-body text-muted-foreground flex items-start gap-1"
                  >
                    <span className="text-[#2b825b]">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {!isCurrent && (
                <button
                  type="button"
                  onClick={() => handleSubscribe(tier.id)}
                  className={`w-full mt-4 text-xs py-2 px-4 rounded-md transition-all font-medium ${
                    isUpgrade
                      ? "bg-[#2b825b] hover:bg-[#2b825b]/90 text-white dark:bg-[#236b49] dark:hover:bg-[#174c36]"
                      : isDowngrade
                        ? "bg-transparent text-foreground border-2 border-foreground hover:bg-foreground/5"
                        : "bg-transparent text-foreground border-2 border-foreground hover:bg-foreground/5"
                  }`}
                >
                  {isUpgrade ? "Upgrade" : "Switch to This Plan"}
                </button>
              )}

              {/* Show trial available for free users */}
              {isFree && tier.id === "zidlite" && (
                <p className="text-[10px] text-center mt-2 text-[#2b825b]">
                  2-week free trial available
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Plan Comparison Note */}
      <p className="text-xs text-muted-foreground text-center mt-6">
        All plans include core features. Upgrade anytime to unlock more
        capabilities.
        <button
          onClick={() => router.push("/pricing")}
          className="ml-1 text-[#2b825b] hover:underline font-medium"
        >
          View full comparison
        </button>
      </p>
    </div>
  );
};

export default SubscriptionSection;


