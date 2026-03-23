import { Coins, ArrowRight, Zap } from "lucide-react";

const ZidCoin = () => {
  return (
    <section id="zidcoin" className="py-20 md:py-32 bg-[#01402e] dark:bg-[#f7f0e5] text-[#f7f0e5] dark:text-[#01402e]">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#f4c600] border-2 border-[#f4c600] shadow-[4px_4px_0px_#f4c600] mb-6">
              <Coins className="w-5 h-5 text-[#01402e]" />
              <span className="font-bold text-[#01402e]">The ZidCoin Economy</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6">
              Our Cashback & <span className="text-[#f4c600]">Reward System</span>
            </h2>
            
            <p className="text-lg text-[#f7f0e5]/70 dark:text-[#01402e]/70 mb-8">
              ZidCoin is the currency inside Zidwell. It's what we pay you for using our app.
            </p>

            <div className="bg-[#f7f0e5] dark:bg-[#01402e] text-[#01402e] dark:text-[#f7f0e5] border-2 border-[#f4c600] p-6 shadow-[4px_4px_0px_#f4c600] mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold">Exchange Rate</span>
                <span className="text-2xl font-black text-[#f4c600]">1 ZC = ₦1</span>
              </div>
              <div className="w-full h-1 bg-[#01402e]/10 dark:bg-[#f7f0e5]/10 mb-4" />
              <p className="text-sm text-[#01402e]/60 dark:text-[#f7f0e5]/60">
                Earn <strong className="text-[#01402e] dark:text-[#f7f0e5]">20 ZidCoins</strong> every time you spend ₦2,500+ on Zidwell
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-[#f4c600] mb-6">How It Works</h3>
            
            <div className="space-y-4">
              {[
                { num: "1", title: "Spend on Zidwell", desc: "Get 20 ZidCoins rewards anytime you spend ₦2,500+ on airtime, data, cable, or electricity" },
                { num: "2", title: "Accumulate Rewards", desc: "Your ZidCoins stack up in your wallet as cashback" },
                { num: "3", title: "Cash Out at 3,000 ZC", desc: "Use your ZidCoins to purchase airtime or data for yourself" },
              ].map((step, i) => (
                <div key={i}>
                  <div className="flex items-start gap-4 bg-[#f7f0e5]/10 dark:bg-[#01402e]/10 border border-[#f7f0e5]/20 dark:border-[#01402e]/20 p-4">
                    <div className="w-10 h-10 bg-[#f4c600] border-2 border-[#f7f0e5] dark:border-[#01402e] flex items-center justify-center shrink-0">
                      <span className="font-bold text-[#01402e]">{step.num}</span>
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">{step.title}</h4>
                      <p className="text-sm text-[#f7f0e5]/70 dark:text-[#01402e]/70">{step.desc}</p>
                    </div>
                  </div>
                  {i < 2 && (
                    <div className="flex justify-center py-1">
                      <ArrowRight className="w-6 h-6 text-[#f4c600]" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 p-4 bg-[#f4c600]/20 border border-[#f4c600]">
              <Zap className="w-6 h-6 text-[#f4c600]" />
              <p className="text-sm font-medium">
                The more you use Zidwell, the more value you unlock — structure, savings, and growth all in one.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ZidCoin;
