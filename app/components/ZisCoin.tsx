import { Coins, ArrowRight, Zap } from "lucide-react";

const ZidCoin = () => {
  return (
    <section
      id="zidcoin"
      className="py-20 md:py-32 bg-gray-900 dark:bg-gray-50 text-gray-50 dark:text-gray-900"
    >
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2b825b] border-2 border-[#2b825b] shadow-[4px_4px_0px_#fbbf24] mb-6">
              <Coins className="w-5 h-5 text-gray-900" />
              <span className="font-bold text-gray-900">
                The ZidCoin Economy
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6">
              Our Cashback &{" "}
              <span className="text-[#2b825b]">Reward System</span>
            </h2>

            <p className="text-lg text-gray-50/70 dark:text-gray-900/70 mb-8">
              ZidCoin is the currency inside Zidwell. It's what we pay you for
              using our app. Every time you load data, airtime, cable
              subscription and electricity on Zidwell, you earn ZidCoins.
            </p>

            <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50 border-2 border-[#2b825b] p-6 shadow-[4px_4px_0px_#fbbf24] mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold">Exchange Rate</span>
                <span className="text-2xl font-black text-[#2b825b]">
                  1 ZC = ₦1
                </span>
              </div>
              <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Earn{" "}
                <strong className="text-gray-900 dark:text-gray-50">
                  20 ZidCoins
                </strong>{" "}
                every time you spend ₦2,500+ on Zidwell
              </p>
            </div>
          </div>

          {/* Right - How It Works */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-[#2b825b] mb-6">
              How It Works
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-4 bg-gray-50/10 dark:bg-gray-900/10 border border-gray-50/20 dark:border-gray-900/20 p-4">
                <div className="w-10 h-10 bg-[#2b825b] border-2 border-gray-50 dark:border-gray-900 flex items-center justify-center shrink-0">
                  <span className="font-bold text-gray-900">1</span>
                </div>
                <div>
                  <h4 className="font-bold mb-1">Spend on Zidwell</h4>
                  <p className="text-sm text-gray-50/70 dark:text-gray-900/70">
                    Get 20 ZidCoins rewards anytime you spend ₦2,500+ on
                    airtime, data, cable, or electricity
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-[#2b825b]" />
              </div>

              <div className="flex items-start gap-4 bg-gray-50/10 dark:bg-gray-900/10 border border-gray-50/20 dark:border-gray-900/20 p-4">
                <div className="w-10 h-10 bg-[#2b825b] border-2 border-gray-50 dark:border-gray-900 flex items-center justify-center shrink-0">
                  <span className="font-bold text-gray-900">2</span>
                </div>
                <div>
                  <h4 className="font-bold mb-1">Accumulate Rewards</h4>
                  <p className="text-sm text-gray-50/70 dark:text-gray-900/70">
                    Your ZidCoins stack up in your wallet as cashback
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-[#2b825b]" />
              </div>

              <div className="flex items-start gap-4 bg-gray-50/10 dark:bg-gray-900/10 border border-gray-50/20 dark:border-gray-900/20 p-4">
                <div className="w-10 h-10 bg-[#2b825b] border-2 border-gray-50 dark:border-gray-900 flex items-center justify-center shrink-0">
                  <span className="font-bold text-gray-900">3</span>
                </div>
                <div>
                  <h4 className="font-bold mb-1">Cash Out at 3,000 ZC</h4>
                  <p className="text-sm text-gray-50/70 dark:text-gray-900/70">
                    Use your ZidCoins to purchase airtime or data for yourself
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-[#2b825b]/20 border border-[#2b825b]">
              <Zap className="w-6 h-6 text-[#2b825b]" />
              <p className="text-sm font-medium">
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
