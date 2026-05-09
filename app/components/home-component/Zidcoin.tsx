// components/ZidCoin.tsx
import { Coins, ArrowRight, Zap } from "lucide-react";

const ZidCoin = () => {
  return (
    <section id="zidcoin" className="py-20 md:py-32 bg-(--bg-secondary)">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-(--color-accent-yellow) border-2 border-(--color-accent-yellow) shadow-[4px_4px_0px_var(--color-accent-yellow)] mb-6 squircle-md">
              <Coins className="w-5 h-5 text-(--color-ink)" />
              <span className="font-bold text-(--color-ink)">
                The ZidCoin Economy
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-(--text-primary)">
              Our Cashback &{" "}
              <span className="text-(--color-accent-yellow)">
                Reward System
              </span>
            </h2>
            <p className="text-lg text-(--text-secondary) mb-8">
              ZidCoin is the currency inside Zidwell. It's what we pay you for
              using our app.
            </p>
            <div className="bg-(--bg-primary) border-2 border-(--color-accent-yellow) p-6 mb-8 squircle-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-(--text-primary)">
                  Exchange Rate
                </span>
                <span className="text-2xl font-black text-(--color-accent-yellow)">
                  1 ZC = ₦1
                </span>
              </div>
              <div className="w-full h-1 bg-(--border-color) mb-4" />
              <p className="text-sm text-(--text-secondary)">
                Earn{" "}
                <strong className="text-(--text-primary)">20 ZidCoins</strong>{" "}
                every time you spend ₦2,500+ on Zidwell
              </p>
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-(--color-accent-yellow) mb-6">
              How It Works
            </h3>
            <div className="space-y-4">
              {[
                {
                  num: "1",
                  title: "Spend on Zidwell",
                  desc: "Get 20 ZidCoins rewards anytime you spend ₦2,500+ on airtime, data, cable, or electricity",
                },
                {
                  num: "2",
                  title: "Accumulate Rewards",
                  desc: "Your ZidCoins stack up in your wallet as cashback",
                },
                {
                  num: "3",
                  title: "Cash Out at 3,000 ZC",
                  desc: "Use your ZidCoins to purchase airtime or data for yourself",
                },
              ].map((step, i) => (
                <div key={i}>
                  <div className="flex items-start gap-4 bg-(--bg-primary)/50 border border-(--border-color) p-4 squircle-lg">
                    <div className="w-10 h-10 bg-(--color-accent-yellow) border-2 border-(--border-color) flex items-center justify-center shrink-0 squircle-full">
                      <span className="font-bold text-(--color-ink)">
                        {step.num}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold mb-1 text-(--text-primary)">
                        {step.title}
                      </h4>
                      <p className="text-sm text-(--text-secondary)">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                  {i < 2 && (
                    <div className="flex justify-center py-1">
                      <ArrowRight className="w-6 h-6 text-(--color-accent-yellow)" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 p-4 bg-(--color-accent-yellow)/20 border border-(--color-accent-yellow) squircle-lg">
              <Zap className="w-6 h-6 text-(--color-accent-yellow)" />
              <p className="text-sm font-medium text-(--text-primary)">
                The more you use Zidwell, the more value you unlock — structure,
                savings, and growth all in one.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ZidCoin;
