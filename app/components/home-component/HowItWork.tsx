// components/HowItWorks.tsx
import { UserPlus, Wallet, TrendingUp } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create Your Wallet",
    description:
      "Sign up, verify your identity, and get your Zidwell wallet ready for use in minutes.",
  },
  {
    number: "02",
    icon: Wallet,
    title: "Use Zidwell for Everyday Finance",
    description:
      "Pay bills, send money, issue receipts, create contracts, and track your activity — all in one place.",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Build Financial Structure Over Time",
    description:
      "From cashback rewards to tax support and community learning, Zidwell helps you move from survival to stability, and from stability to growth.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-(--bg-secondary)">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-(--text-primary)">
            How Zidwell{" "}
            <span className="text-(--color-accent-yellow)">Works</span>
          </h2>
          <p className="text-lg text-(--text-secondary)">
            Three simple steps to financial clarity
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-(--color-accent-yellow)/50" />
                )}

                <div className="relative bg-(--bg-primary) border-2 border-(--color-accent-yellow) shadow-[4px_4px_0px_var(--color-accent-yellow)] p-6 h-full squircle-lg">
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-(--color-accent-yellow) border-2 border-(--border-color) shadow-[4px_4px_0px_var(--border-color)] dark:shadow-[4px_4px_0px_var(--color-accent-yellow)] flex items-center justify-center squircle-full">
                    <span className="font-black text-(--color-ink)">
                      {step.number}
                    </span>
                  </div>

                  <div className="w-16 h-16 bg-(--bg-secondary) border-2 border-(--border-color) flex items-center justify-center mb-4 mt-4 squircle-md">
                    <step.icon className="w-8 h-8 text-(--text-primary)" />
                  </div>

                  <h3 className="text-xl font-bold mb-3 text-(--text-primary)">
                    {step.title}
                  </h3>
                  <p className="text-(--text-secondary) text-sm">
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
