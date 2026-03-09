// components/subscription-page-guard.tsx
"use client";

import { useSubscription } from "@/app/hooks/useSubscripion"; 
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Crown, Zap, Sparkles, Lock } from "lucide-react";
import Link from "next/link";

interface SubscriptionPageGuardProps {
  children: React.ReactNode;
  requiredTier: 'free' | 'growth' | 'premium' | 'elite';
  featureKey: string;
  title?: string;
  description?: string;
}

const tierConfig = {
  growth: {
    icon: Zap,
    color: "text-blue-600",
    bg: "bg-blue-50",
    price: "₦10,000/month",
    features: [
      "Full bookkeeping access",
      "Tax calculator",
      "Payment reminders",
      "WhatsApp support",
    ]
  },
  premium: {
    icon: Crown,
    color: "text-[#C29307]",
    bg: "bg-[#C29307]/10",
    price: "₦50,000/month",
    features: [
      "Financial statements",
      "Tax filing support",
      "Priority support",
      "Unlimited everything",
    ]
  },
  elite: {
    icon: Sparkles,
    color: "text-purple-600",
    bg: "bg-purple-50",
    price: "₦100,000+/month",
    features: [
      "Full tax filing (VAT, PAYE, WHT)",
      "CFO-level guidance",
      "Dedicated account manager",
      "Audit coordination",
    ]
  }
};

export function SubscriptionPageGuard({
  children,
  requiredTier,
  featureKey,
  title = "Premium Feature",
  description = "This feature requires an upgraded plan"
}: SubscriptionPageGuardProps) {
  const { canAccessFeature, loading, subscription } = useSubscription();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      setChecking(false);
      const hasAccess = canAccessFeature(featureKey);
      
      if (!hasAccess && requiredTier !== 'free') {
        // Store the current URL to redirect back after upgrade
        sessionStorage.setItem('intendedUrl', window.location.pathname);
      }
    }
  }, [loading, canAccessFeature, featureKey, requiredTier]);

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C29307]"></div>
        </div>
      </div>
    );
  }

  const hasAccess = canAccessFeature(featureKey);

  if (!hasAccess) {
    const config = tierConfig[requiredTier as keyof typeof tierConfig];
    const Icon = config?.icon || Lock;

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Keep sidebar and header but show upgrade content */}
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-6">
          <div className={`w-20 h-20 rounded-full ${config?.bg || 'bg-gray-100'} flex items-center justify-center mb-6`}>
            <Icon className={`w-10 h-10 ${config?.color || 'text-gray-500'}`} />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {title}
          </h1>
          
          <p className="text-gray-600 text-center max-w-md mb-8">
            {description}. Upgrade to {requiredTier} plan to unlock this feature and many more benefits.
          </p>

          {requiredTier !== 'free' && config && (
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-8 max-w-md w-full">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Icon className={`w-5 h-5 ${config.color}`} />
                <span className="capitalize">{requiredTier} Plan Benefits</span>
              </h3>
              <ul className="space-y-3 mb-6">
                {config.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className={`w-5 h-5 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
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
                className={`block w-full py-3 px-4 rounded-lg text-center font-bold transition-all
                  ${requiredTier === 'premium' 
                    ? 'bg-[#C29307] text-gray-900 hover:bg-[#C29307]/90' 
                    : requiredTier === 'elite'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                Upgrade to {requiredTier}
              </Link>
            </div>
          )}

          <p className="text-sm text-gray-500">
            Already subscribed? <button 
              onClick={() => router.refresh()}
              className="text-[#C29307] hover:underline"
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