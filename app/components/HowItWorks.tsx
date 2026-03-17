import { UserPlus, Wallet, TrendingUp, Shield } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create Your Account ",
    description: "Signup using your own name or brand name, either works.",
  },
  {
    number: "02",
    icon: Shield,
    title: "Identity Verification ",
    description:
      "Verify your identity with your BVN and business registration certificate if you have one. This is CBN policy.",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Use Zidwell Daily",
    description:
      "Pay bills, receive payment, issue receipts & invoices, create contracts etc. Financial structure happens over time with daily use.",
  },
];

const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      className="py-20 md:py-32 bg-gray-900 dark:bg-gray-50 text-gray-50 dark:text-gray-900"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6">
            How Zidwell <span className="text-[#2b825b]">Works</span>
          </h2>
          <p className="text-lg text-gray-50/70 dark:text-gray-900/70">
            3 Simple steps to financial structure for your business
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-[#2b825b]/50" />
                )}

                <div className="relative bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50 border-2 border-[#2b825b] shadow-[4px_4px_0px_#fbbf24] p-6 h-full">
                  {/* Number Badge */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#2b825b] border-2 border-gray-900 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] flex items-center justify-center">
                    <span className="font-black text-gray-900">
                      {step.number}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-50 flex items-center justify-center mb-4 mt-4">
                    <step.icon className="w-8 h-8 text-gray-900 dark:text-gray-50" />
                  </div>

                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
