import { Heart, BookOpen, Headphones } from "lucide-react";

const WhyDifferent = () => {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-[#01402e] dark:text-[#f7f0e5]">
              Why We're{" "}
              <span className="relative inline-block">
                <span className="relative z-10">Different</span>
                <span className="absolute bottom-2 left-0 right-0 h-4 bg-[#f4c600]/40 z-0" />
              </span>
            </h2>
            
            <p className="text-lg text-[#01402e]/60 dark:text-[#f7f0e5]/60 mb-6">
              Most fintech apps focus on transactions. <strong className="text-[#01402e] dark:text-[#f7f0e5]">Zidwell focuses on financial wellbeing.</strong>
            </p>
            
            <p className="text-[#01402e]/60 dark:text-[#f7f0e5]/60 mb-8">
              We believe money should work for you, not confuse you. That's why Zidwell combines tools, education, and support into one simple experience.
            </p>

            <div className="space-y-4">
              {[
                { icon: Heart, title: "Finance with Context", desc: "Understanding your unique Nigerian business needs" },
                { icon: BookOpen, title: "Structure with Support", desc: "Not just tools, but guidance when you need it" },
                { icon: Headphones, title: "Technology with Heart", desc: "Built by people who understand your journey" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#f4c600] border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[4px_4px_0px_#01402e] dark:shadow-[4px_4px_0px_#f4c600] flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-[#01402e]" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 text-[#01402e] dark:text-[#f7f0e5]">{item.title}</h4>
                    <p className="text-sm text-[#01402e]/60 dark:text-[#f7f0e5]/60">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="bg-white dark:bg-[#01402e] border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[6px_6px_0px_#01402e] dark:shadow-[6px_6px_0px_#f4c600] p-8 md:p-12">
              <div className="space-y-6">
                <div className="border-b border-[#01402e]/20 dark:border-[#f7f0e5]/20 pb-6">
                  <span className="text-sm font-bold text-[#01402e]/60 dark:text-[#f7f0e5]/60 uppercase tracking-wider">Before Zidwell</span>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Payment App", "Invoice Tool", "Tax Software", "Banking App", "Spreadsheets"].map((item) => (
                      <span key={item} className="px-3 py-1 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 text-sm">
                        {item}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-[#01402e]/60 dark:text-[#f7f0e5]/60">5+ apps, endless confusion</p>
                </div>
                
                <div>
                  <span className="text-sm font-bold text-[#f4c600] uppercase tracking-wider">With Zidwell</span>
                  <div className="mt-3">
                    <span className="px-6 py-3 bg-[#f4c600] text-[#01402e] border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[4px_4px_0px_#01402e] dark:shadow-[4px_4px_0px_#f4c600] font-bold inline-block">
                      One Platform. Everything.
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-[#01402e]/60 dark:text-[#f7f0e5]/60">Clarity, control, and confidence</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-[#f4c600] border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[4px_4px_0px_#01402e] dark:shadow-[4px_4px_0px_#f4c600]" />
            <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-[#01402e] dark:bg-[#f7f0e5]" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyDifferent;
