"use client";

import { Check, Star } from "lucide-react";
import { Button2 } from "../ui/button2";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useRouter } from "next/navigation";

const pricingData = {
  monthly: {
    multiplier: 1,
    suffix: "/month",
    prices: {
      starter: {
        currentPrice: "₦60,000",
        description: "",
      },
      growth: {
        currentPrice: "₦150,000",
        description: "",
      },
      elite: {
        currentPrice: "₦300,000",
        description: "",
      },
    },
  },
  quarterly: {
    multiplier: 3,
    suffix: "/quarter",
    prices: {
      starter: {
        currentPrice: "₦165,000",
        description: "save N15000",
      },
      growth: {
        currentPrice: "₦420,000",
        description: "save 30,000",
      },
      elite: {
        currentPrice: "₦860,000",
        description: "save 40,000",
      },
    },
  },
  biannually: {
    multiplier: 6,
    suffix: "/6 months",
    prices: {
      starter: {
        currentPrice: "₦330,000",
        description: "save 40,000",
      },
      growth: {
        currentPrice: "₦820,000",
        description: "save 80,000",
      },
      elite: {
        currentPrice: "₦1,650,000",
        description: "save 150,000",
      },
    },
  },
  yearly: {
    multiplier: 12,
    suffix: "/year",
    prices: {
      starter: {
        currentPrice: "₦650,000",
        description: "save 70,000",
      },
      growth: {
        currentPrice: "₦1,700,000",
        description: "save 100,000",
      },
      elite: {
        currentPrice: "₦3,400,000",
        description: "save 200,000",
      },
    },
  },
};

const plans = [
  {
    key: "starter",
    name: "Business Starter",
    description: "Perfect for small businesses just getting started",
    features: [
      "Accounting & bookkeeping support",
      "Tax management support",
      "Monthly Financial Statements",
      "Zidwell Finance App",
      "Free Monthly Financial Wellness Clinic (group)",
    ],
    popular: false,
    buttonVariant: "brutalOutline" as const,
  },
  {
    key: "growth",
    name: "Business Growth",
    description: "For growing businesses that need more support",
    features: [
      "Everything in Starter Plan +",
      "Monthly Tax Filing support",
      "1 Monthly Management Meeting with CEO",
      "Active WhatsApp Support",
      "Staff Payroll Support",
      "Zidwell Business Tools",
    ],
    popular: true,
    buttonVariant: "brutal" as const,
  },
  {
    key: "elite",
    name: "Business Elite",
    description: "Complete financial management for established businesses",
    features: [
      "Everything in Growth Plan +",
      "Business Budgeting & Forecasting",
      "Business Savings & Investment Advisory",
      "Full Staff Payroll Management",
      "Business tools dashboard",
      "Monthly Management Meeting with CEO",
      "Dedicated WhatsApp Support",
      "Tax Planning & Advisory (Advanced)",
    ],
    popular: false,
    buttonVariant: "brutalOutline" as const,
  },
];

const PricingSection = () => {
  const [billingPeriod, setBillingPeriod] =
    useState<keyof typeof pricingData>("monthly");
  const router = useRouter();
  return (
    <section
      id="pricing"
      className="py-20 md:py-28 lg:py-32 p-5 relative overflow-hidden"
    >
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-50" />

      {/* Gold accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-linear-to-br from-[#C29307]/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-gradient-to-tl from-[#C29307]/15 to-transparent rounded-full blur-2xl" />

      <div className="container-custom relative">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-block px-4 py-1 bg-[#C29307]/20 border border-[#C29307] text-sm font-semibold mb-4">
            PRICING
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose the plan that fits your business needs. All plans include
            access to our core services.
          </p>
        </div>

        {/* Billing Period Tabs */}
        <Tabs
          value={billingPeriod}
          onValueChange={(v) => setBillingPeriod(v as keyof typeof pricingData)}
          className="w-full"
        >
          <div className="flex justify-center mb-10">
            <TabsList className="bg-secondary/50 border-2 border-foreground p-1 h-auto flex-wrap">
              <TabsTrigger
                value="monthly"
                className="px-6 py-2 font-bold data-[state=active]:bg-[#C29307] data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Monthly
              </TabsTrigger>
              <TabsTrigger
                value="quarterly"
                className="px-6 py-2 font-bold data-[state=active]:bg-[#C29307] data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Quarterly
              </TabsTrigger>
              <TabsTrigger
                value="biannually"
                className="px-6 py-2 font-bold data-[state=active]:bg-[#C29307] data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Biannually
              </TabsTrigger>
              <TabsTrigger
                value="yearly"
                className="px-6 py-2 font-bold data-[state=active]:bg-[#C29307] data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Yearly
              </TabsTrigger>
            </TabsList>
          </div>

          {Object.keys(pricingData).map((period) => (
            <TabsContent key={period} value={period} className="mt-0">
              {/* Pricing Cards */}
              <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                {plans.map((plan) => {
                  const priceInfo =
                    pricingData[period as keyof typeof pricingData].prices[
                      plan.key as keyof typeof pricingData.monthly.prices
                    ];

                  return (
                    <div
                      key={plan.key}
                      className={`relative bg-card border-2 border-foreground p-6 md:p-8 transition-all duration-300 ${
                        plan.popular
                          ? "shadow-[8px_8px_0px_#C29307] -translate-y-2"
                          : "hover:shadow-[4px_4px_0px_#18171c]"
                      }`}
                    >
                      {/* Popular badge */}
                      {plan.popular && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#C29307] border-2 border-foreground px-4 py-1 flex items-center gap-2">
                          <Star className="w-4 h-4 fill-foreground" />
                          <span className="text-sm font-bold">
                            MOST POPULAR
                          </span>
                        </div>
                      )}

                      {/* Plan header */}
                      <div className="text-center pb-6 border-b border-border">
                        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {plan.description}
                        </p>
                        <div className="flex flex-col items-center">
                          <div className="flex items-baseline justify-center">
                            <span className="text-4xl md:text-5xl font-black">
                              {priceInfo.currentPrice}
                            </span>
                            <span className="text-muted-foreground ml-1">
                              {
                                pricingData[period as keyof typeof pricingData]
                                  .suffix
                              }
                            </span>
                          </div>
                          {priceInfo.description && (
                            <div className="mt-2 px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-md">
                              {priceInfo.description}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Features */}
                      <ul className="space-y-3 py-6">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="w-5 h-5 bg-[#C29307] shrink-0 flex items-center justify-center mt-0.5">
                              <Check className="w-3 h-3" />
                            </span>
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <Button2
                        onClick={() => router.push("/f-onboarding")}
                        className="w-full"
                        size="lg"
                        variant="heroOutline"
                      >
                        Get Started
                      </Button2>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};

export default PricingSection;
