"use client";

import { useState, useEffect } from "react";
import { Check, Sparkles, Crown, Zap, Star, ArrowRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useSubscription } from "../hooks/useSubscripion"; 
import { useRouter, useSearchParams } from "next/navigation";
import { SubscriptionBadge } from "../components/subscription-components/subscriptionBadges"; 
import Link from "next/link";

const plans = [
  {
    name: "Free",
    tier: "free",
    price: "₦0",
    period: "/month",
    description: "For freelancers & early-stage businesses",
    icon: Star,
    iconColor: "text-gray-600",
    iconBg: "bg-gray-100",
    features: [
      "Unlimited money transfers at N50 per transfer",
      "Bookkeeping - 2 weeks free trial",
      "5 Invoices per month",
      "5 Receipts per month",
      "1 Contract per month",
      "Email support",
    ],
    cta: "Get Started",
    ctaLink: "/dashboard",
    highlight: false,
    borderColor: "border-gray-200",
    bgColor: "bg-white",
    textColor: "text-gray-900",
    priceId: "free",
  },
  {
    name: "Growth",
    tier: "growth",
    price: "₦10,000",
    period: "/month",
    yearlyPrice: "₦100,000/year",
    yearlySavings: "Save ₦20,000",
    description: "For growing businesses that want structure without stress",
    icon: Zap,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    features: [
      "Everything in Free, plus:",
      "Unlimited Invoices",
      "Unlimited Receipts",
      "5 Contracts per month",
      "Bookkeeping tool",
      "Tax Calculator",
      "Invoice Payment Reminders",
      "Access to WhatsApp Business Community",
      "WhatsApp support",
    ],
    cta: "Go Growth",
    ctaLink: "/api/payments/growth",
    highlight: false,
    borderColor: "border-blue-200",
    bgColor: "bg-white",
    textColor: "text-gray-900",
    priceId: "price_growth_monthly",
    yearlyPriceId: "price_growth_yearly",
  },
  {
    name: "Premium",
    tier: "premium",
    price: "₦50,000",
    period: "/month",
    yearlyPrice: "₦500,000/year",
    yearlySavings: "Save ₦100,000",
    description: "Best for founders and CEOs who want to move the burden of financial management",
    icon: Crown,
    iconColor: "text-[#C29307]",
    iconBg: "bg-[#C29307]/10",
    features: [
      "Everything in Growth, plus:",
      "Unlimited contracts",
      "Financial Statement Preparation",
      "Tax Calculation Support",
      "Tax filing support",
      "Priority support",
      "Lawyer signatures (₦10,000)",
    ],
    cta: "Upgrade to Premium",
    ctaLink: "/api/payments/premium",
    highlight: true,
    borderColor: "border-[#C29307]",
    bgColor: "bg-[#C29307]/5",
    textColor: "text-gray-900",
    priceId: "price_premium_monthly",
    yearlyPriceId: "price_premium_yearly",
  },
  {
    name: "Elite",
    tier: "elite",
    price: "₦100,000+",
    period: "/month",
    yearlyPrice: "Custom pricing",
    description: "For established businesses & founders needing full financial management",
    icon: Sparkles,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-100",
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
    cta: "Contact Us",
    ctaLink: "/contact",
    highlight: false,
    borderColor: "border-purple-200",
    bgColor: "bg-white",
    textColor: "text-gray-900",
    priceId: "elite",
  },
];

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { subscription, subscribe, loading, userTier } = useSubscription();
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [processingTier, setProcessingTier] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const upgradeParam = searchParams?.get('upgrade');
  const billingParam = searchParams?.get('billing') as 'monthly' | 'yearly' | null;

  // Set billing from URL param if provided
  useEffect(() => {
    if (billingParam) {
      setSelectedBilling(billingParam);
    }
  }, [billingParam]);

  // Scroll to highlighted plan if upgrade param exists
  useEffect(() => {
    if (upgradeParam) {
      const element = document.getElementById(`plan-${upgradeParam}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [upgradeParam]);

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (plan.tier === 'free') {
      router.push('/dashboard');
      return;
    }

    if (plan.tier === 'elite') {
      window.location.href = 'mailto:sales@zidwell.com?subject=Elite%20Plan%20Inquiry';
      return;
    }

    setProcessingTier(plan.tier);

    try {
      // Calculate amount based on billing period
      const amount = selectedBilling === 'yearly' 
        ? (plan.tier === 'growth' ? 100000 : 500000)
        : (plan.tier === 'growth' ? 10000 : 50000);

      // Generate a unique reference
      const paymentReference = `SUB_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // In production, you would integrate with Paystack/Flutterwave here
      // For demo, simulate successful payment
      
      const result = await subscribe(
        plan.tier as 'growth' | 'premium' | 'elite',
        'card',
        amount,
        paymentReference,
        selectedBilling === 'yearly'
      );

      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => {
          const intendedService = sessionStorage.getItem('intendedUrl');
          if (intendedService) {
            sessionStorage.removeItem('intendedUrl');
            router.push(intendedService);
          } else {
            router.push('/dashboard?subscription=success');
          }
        }, 2000);
      } else {
        alert(`Subscription failed: ${result.error || 'Please try again'}`);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setProcessingTier(null);
    }
  };

  const isCurrentPlan = (tier: string) => {
    return subscription?.tier === tier && subscription?.status === 'active';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slideIn">
          <p className="font-bold">✓ Subscription successful!</p>
          <p className="text-sm">Redirecting you...</p>
        </div>
      )}

      {/* Hero Section */}
      <div className="pt-20 pb-10 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-gray-900 dark:text-gray-50">
            Simple, transparent{" "}
            <span className="text-[#C29307]">pricing</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your business. All plans include core features,
            with advanced tools for growing companies.
          </p>

          {/* Current Plan Display */}
          {subscription && subscription.tier !== 'free' && (
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#C29307]/10 rounded-full mb-8">
              <span className="text-sm text-gray-600 dark:text-gray-300">Current Plan:</span>
              <SubscriptionBadge />
            </div>
          )}

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mt-8">
            <div className="bg-white dark:bg-gray-800 p-1 rounded-full border-2 border-gray-200 dark:border-gray-700 shadow-sm">
              <button
                onClick={() => setSelectedBilling('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedBilling === 'monthly'
                    ? 'bg-[#C29307] text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedBilling('yearly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedBilling === 'yearly'
                    ? 'bg-[#C29307] text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Yearly <span className="text-xs ml-1 bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Save 20%</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const currentPlan = isCurrentPlan(plan.tier);
            const isHighlighted = plan.highlight || upgradeParam === plan.tier;
            
            return (
              <div
                key={plan.tier}
                id={`plan-${plan.tier}`}
                className={`relative flex flex-col rounded-2xl border-2 transition-all duration-300
                  ${plan.bgColor} dark:bg-gray-900
                  ${isHighlighted ? 'border-[#C29307] shadow-[0_0_0_4px_rgba(194,147,7,0.1)] scale-105 z-10' : plan.borderColor}
                  ${currentPlan ? 'ring-2 ring-green-500 ring-offset-2' : ''}
                  hover:shadow-xl hover:-translate-y-1
                `}
              >
                {/* Popular Badge */}
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#C29307] text-white text-xs font-bold rounded-full flex items-center gap-1 whitespace-nowrap">
                    <Sparkles className="w-3 h-3" />
                    MOST POPULAR
                  </div>
                )}

                {/* Current Plan Badge */}
                {currentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                    CURRENT PLAN
                  </div>
                )}

                <div className="p-6 flex-1">
                  {/* Icon & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl ${plan.iconBg} flex items-center justify-center`}>
                      <plan.icon className={`w-6 h-6 ${plan.iconColor}`} />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${plan.textColor} dark:text-gray-50`}>
                        {plan.name}
                      </h3>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-black ${plan.textColor} dark:text-gray-50`}>
                        {selectedBilling === 'yearly' && plan.yearlyPrice ? plan.yearlyPrice : plan.price}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedBilling === 'yearly' ? '/year' : plan.period}
                      </span>
                    </div>
                    {selectedBilling === 'yearly' && plan.yearlySavings && (
                      <p className="text-xs text-green-600 mt-1 font-semibold">
                        {plan.yearlySavings}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    {plan.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        {feature.startsWith("Everything in") ? (
                          <span className="w-4 shrink-0" />
                        ) : (
                          <Check className="w-4 h-4 text-[#C29307] shrink-0 mt-0.5" />
                        )}
                        <span className={`${plan.textColor} dark:text-gray-300 ${
                          feature.startsWith("Everything in") ? "font-semibold text-[#C29307]" : ""
                        }`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSubscribe(plan)}
                    disabled={loading || processingTier === plan.tier || currentPlan}
                    className={`w-full py-6 text-base font-semibold rounded-xl transition-all
                      ${plan.tier === 'free' ? 'bg-gray-900 text-white hover:bg-gray-800' : ''}
                      ${plan.tier === 'growth' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                      ${plan.tier === 'premium' ? 'bg-[#C29307] text-white hover:bg-[#b38606]' : ''}
                      ${plan.tier === 'elite' ? 'bg-purple-600 text-white hover:bg-purple-700' : ''}
                      ${currentPlan ? 'opacity-50 cursor-not-allowed' : ''}
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {processingTier === plan.tier ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span> Processing...
                      </span>
                    ) : currentPlan ? (
                      'Current Plan'
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {plan.cta}
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <div className="mt-20">
          <h2 className="text-3xl font-black text-center mb-12 text-gray-900 dark:text-gray-50">
            Compare <span className="text-[#C29307]">Features</span>
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="py-4 px-6 text-left text-gray-900 dark:text-gray-50 font-bold">Feature</th>
                  <th className="py-4 px-6 text-center text-gray-900 dark:text-gray-50 font-bold">Free</th>
                  <th className="py-4 px-6 text-center text-gray-900 dark:text-gray-50 font-bold">Growth</th>
                  <th className="py-4 px-6 text-center text-gray-900 dark:text-gray-50 font-bold">Premium</th>
                  <th className="py-4 px-6 text-center text-gray-900 dark:text-gray-50 font-bold">Elite</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300">Invoices</td>
                  <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">5/month</td>
                  <td className="py-4 px-6 text-center text-green-600 font-semibold">Unlimited</td>
                  <td className="py-4 px-6 text-center text-green-600 font-semibold">Unlimited</td>
                  <td className="py-4 px-6 text-center text-green-600 font-semibold">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300">Receipts</td>
                  <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">5/month</td>
                  <td className="py-4 px-6 text-center text-green-600 font-semibold">Unlimited</td>
                  <td className="py-4 px-6 text-center text-green-600 font-semibold">Unlimited</td>
                  <td className="py-4 px-6 text-center text-green-600 font-semibold">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300">Contracts</td>
                  <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">1/month</td>
                  <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">5/month</td>
                  <td className="py-4 px-6 text-center text-green-600 font-semibold">Unlimited</td>
                  <td className="py-4 px-6 text-center text-green-600 font-semibold">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300">Bookkeeping</td>
                  <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">14-day trial</td>
                  <td className="py-4 px-6 text-center text-green-600 font-semibold">✓</td>
                  <td className="py-4 px-6 text-center text-green-600 font-semibold">✓</td>
                  <td className="py-4 px-6 text-center text-green-600 font-semibold">✓</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300">Tax Calculator</td>
                  <td className="py-4 px-6 text-center text-gray-400">✗</td>
                  <td className="py-4 px-6 text-center text-green-600 font-semibold">✓</td>
                  <td className="py-4 px-6 text-center text-green-600 font-semibold">✓</td>
                  <td className="py-4 px-6 text-center text-green-600 font-semibold">✓</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300">Tax Filing Support</td>
                  <td className="py-4 px-6 text-center text-gray-400">✗</td>
                  <td className="py-4 px-6 text-center text-gray-400">✗</td>
                  <td className="py-4 px-6 text-center text-green-600 font-semibold">✓</td>
                  <td className="py-4 px-6 text-center text-green-600 font-semibold">✓</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300">Full Tax Filing (VAT, PAYE, WHT)</td>
                  <td className="py-4 px-6 text-center text-gray-400">✗</td>
                  <td className="py-4 px-6 text-center text-gray-400">✗</td>
                  <td className="py-4 px-6 text-center text-gray-400">✗</td>
                  <td className="py-4 px-6 text-center text-green-600 font-semibold">✓</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300">CFO Guidance</td>
                  <td className="py-4 px-6 text-center text-gray-400">✗</td>
                  <td className="py-4 px-6 text-center text-gray-400">✗</td>
                  <td className="py-4 px-6 text-center text-gray-400">✗</td>
                  <td className="py-4 px-6 text-center text-green-600 font-semibold">✓</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300">Transfer Fee</td>
                  <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">₦50</td>
                  <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">₦50</td>
                  <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">₦25</td>
                  <td className="py-4 px-6 text-center text-green-600 font-semibold">₦0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-black mb-8 text-gray-900 dark:text-gray-50">
            Frequently Asked <span className="text-[#C29307]">Questions</span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-50">
                Can I change plans later?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-50">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We accept card payments, bank transfers, and USSD. All payments are processed securely.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-50">
                Is there a discount for annual billing?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! Save 20% when you choose yearly billing on Growth and Premium plans.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-50">
                What happens when I reach my limit?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We'll notify you and offer the option to upgrade or purchase additional credits.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center bg-[#C29307]/5 rounded-3xl p-12 border-2 border-[#C29307]">
          <h2 className="text-3xl font-black mb-4 text-gray-900 dark:text-gray-50">
            Still not sure which plan?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Book a free consultation with our team to discuss your business needs and find the perfect plan.
          </p>
          <Link href="/contact">
            <Button className="bg-[#C29307] hover:bg-[#b38606] text-white px-8 py-6 text-lg font-semibold rounded-xl">
              Talk to Sales
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}