import { UserPlus, Wallet, TrendingUp } from "lucide-react";

const steps = [
  { number: "01", icon: UserPlus, title: "Create Your Wallet", description: "Sign up, verify your identity, and get your Zidwell wallet ready for use in minutes." },
  { number: "02", icon: Wallet, title: "Use Zidwell for Everyday Finance", description: "Pay bills, send money, issue receipts, create contracts, and track your activity — all in one place." },
  { number: "03", icon: TrendingUp, title: "Build Financial Structure Over Time", description: "From cashback rewards to tax support and community learning, Zidwell helps you move from survival to stability, and from stability to growth." }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-[#01402e] dark:bg-[#f7f0e5] text-[#f7f0e5] dark:text-[#01402e]">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6">
            How Zidwell <span className="text-[#f4c600]">Works</span>
          </h2>
          <p className="text-lg text-[#f7f0e5]/70 dark:text-[#01402e]/70">
            Three simple steps to financial clarity
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-[#f4c600]/50" />
                )}
                
                <div className="relative bg-[#f7f0e5] dark:bg-[#01402e] text-[#01402e] dark:text-[#f7f0e5] border-2 border-[#f4c600] shadow-[4px_4px_0px_#f4c600] p-6 h-full">
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#f4c600] border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[4px_4px_0px_#01402e] dark:shadow-[4px_4px_0px_#f4c600] flex items-center justify-center">
                    <span className="font-black text-[#01402e]">{step.number}</span>
                  </div>
                  
                  <div className="w-16 h-16 bg-[#01402e]/10 dark:bg-[#f7f0e5]/10 border-2 border-[#01402e] dark:border-[#f7f0e5] flex items-center justify-center mb-4 mt-4">
                    <step.icon className="w-8 h-8 text-[#01402e] dark:text-[#f7f0e5]" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-[#01402e]/60 dark:text-[#f7f0e5]/60 text-sm">{step.description}</p>
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
