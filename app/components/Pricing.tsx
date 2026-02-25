import { Check, Sparkles } from "lucide-react";
import { Button2 } from "./ui/button2";

const plans = [
  {
    name: "Free",
    price: "₦0",
    period: "/month",
    description:
      "For freelancers & early-stage businesses",
    features: [
      "Unlimited money transfers at N50 per transfer",
      "Bookkeeping - 2 weeks free trial",
      "5 Invoices per month",
      "5 Receipts per month",
      "1 Contract per month",
      "Email support",
    ],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Growth",
    price: "₦10,000",
    period: "/month",
    yearlyPrice: "₦100,000/year (save ₦20,000)",
    description:
      "For growing businesses that want structure without stress",
    features: [
      "Everything in Free, plus:",
      "Unlimited Invoices",
      "Unlimited Receipts",
      "5 Contracts",
      "Bookkeeping tool",
      "Tax Calculator",
      "Invoice Payment Reminders",
      "Access to WhatsApp Business Community",
      "Whatsapp support",
    ],
    cta: "Go Growth",
    highlight: false,
  },
  {
    name: "Premium",
    price: "₦50,000",
    period: "/month",
    yearlyPrice: "₦500,000/year (save ₦100,000)",
    description:
      "Best for: founders and CEOs who want to move the burden of financial management to someone else.",
    features: [
      "Everything in Growth, plus:",
      "Unlimited contracts",
      "Financial Statement Preparation",
      "Tax Calculation Support",
      "Tax filing support",
      "Priority support",
    ],
    cta: "Upgrade to Premium",
    highlight: true,
  },
  {
    name: "Elite",
    price: "₦100,000+",
    period: "/month",
    yearlyPrice: "Customized price",
    description:
      "For established businesses & founders",
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
    highlight: false,
  },
];

const Pricing = () => {
  return (
    <section
      id="pricing"
      className="py-20 md:py-32 bg-gray-100/30 dark:bg-gray-900/30"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-gray-900 dark:text-gray-50">
            Simple plans that <span className="text-[#C29307]">grow</span> with
            you
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            We've worked hard to make our pricing as affordable as possible so you can get the best value and we'd have the resources to keep providing these services to you. Choose the plan that matches your business goals.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative flex flex-col ${
                plan.highlight
                  ? "bg-[#C29307] text-gray-900 border-2 border-gray-900 dark:border-gray-50 shadow-[6px_6px_0px_#111827] dark:shadow-[6px_6px_0px_#fbbf24]"
                  : "bg-white dark:bg-gray-900 border-2 border-gray-900 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24]"
              } p-6 hover:shadow-[6px_6px_0px_#111827] dark:hover:shadow-[6px_6px_0px_#fbbf24] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gray-900 dark:bg-gray-50 text-gray-50 dark:text-gray-900 text-xs font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  POPULAR
                </div>
              )}

              <div className="mb-6">
                <h3
                  className={`text-xl font-bold mb-2 ${
                    plan.highlight
                      ? "text-gray-900"
                      : "text-gray-900 dark:text-gray-50"
                  }`}
                >
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-3xl font-black ${
                      plan.highlight
                        ? "text-gray-900"
                        : "text-gray-900 dark:text-gray-50"
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`text-sm ${
                      plan.highlight
                        ? "text-gray-900/70"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>
                {plan.yearlyPrice && (
                  <p
                    className={`text-xs mt-1 ${
                      plan.highlight
                        ? "text-gray-900/70"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {plan.yearlyPrice}
                  </p>
                )}
                <p
                  className={`text-sm mt-3 ${
                    plan.highlight
                      ? "text-gray-900/80"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-2 mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    {feature.startsWith("Everything in") ? (
                      <span className="w-4 shrink-0"></span>
                    ) : (
                      <Check
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          plan.highlight ? "text-gray-900" : "text-[#C29307]"
                        }`}
                      />
                    )}
                    <span
                      className={`${
                        plan.highlight
                          ? "text-gray-900"
                          : "text-gray-900 dark:text-gray-50"
                      } ${feature.startsWith("Everything in") ? "font-medium" : ""}`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button2
                variant={plan.highlight ? "heroOutline" : "default"}
                className={`w-full ${
                  plan.highlight
                    ? "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800"
                    : ""
                }`}
              >
                {plan.cta}
              </Button2>
            </div>
          ))}
        </div>

        {/* ZidCoin Economy Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-900 border-2 border-gray-900 dark:border-gray-50 shadow-[6px_6px_0px_#111827] dark:shadow-[6px_6px_0px_#fbbf24] p-8">
            <h3 className="text-2xl md:text-3xl font-black mb-4 text-gray-900 dark:text-gray-50">
              The ZidCoin Economy: <span className="text-[#C29307]">Our Cashback & Reward System</span>
            </h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-50">What is ZidCoin?</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Zidcoin is the currency inside Zidwell. It's what we pay you for using our app. Every time you load data, airtime, cable subscription and electricity on Zidwell, you earn Zidcoins (ZC).
                </p>
                <p className="text-gray-600 dark:text-gray-400 mt-2 font-semibold">
                  Value: 1 Zidcoin = ₦1.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-50">How It Works</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#C29307]" />
                    <span>Get 20 Zidcoins rewards anytime you spend N2500 and above on Zidwell.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#C29307]" />
                    <span>Your Zidcoins accumulate in your wallet as cashback.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#C29307]" />
                    <span>Once your Zidcoin balance hits 3,000 ZC, you can cash it out by using it to purchase airtime or data for yourself.</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-50">Why It Matters</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Zidcoin turns every business transaction into an opportunity to earn. The more you use Zidwell, the more value you unlock — it's structure, savings, and growth all in one.
                </p>
                <p className="text-gray-600 dark:text-gray-400 mt-2 font-semibold">
                  Zidwell. Structure your hustle. Earn as you grow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;