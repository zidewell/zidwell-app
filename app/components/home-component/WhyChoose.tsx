import { Zap, Award, Shield, Sprout, Heart } from "lucide-react";

const reasons = [
  { icon: Zap, title: "Simplicity", description: "One platform instead of many apps" },
  { icon: Award, title: "Professionalism", description: "Receipts, agreements, and records that inspire trust with your customers" },
  { icon: Shield, title: "Peace of Mind", description: "Tax support and financial clarity at your fingertips" },
  { icon: Sprout, title: "Growth Support", description: "Access to community, events, and expert advice when you need it" },
  { icon: Heart, title: "Human-Centered Design", description: "Built for real-life situations Nigerian businesses face" }
];

const WhyChoose = () => {
  return (
    <section className="py-20 md:py-32 bg-[#01402e]/5 dark:bg-[#f7f0e5]/5">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-8 text-[#01402e] dark:text-[#f7f0e5]">
              Why Businesses Choose{" "}
              <span className="text-[#f4c600]">Zidwell</span>
            </h2>
            
            <div className="space-y-6">
              {reasons.map((reason, index) => (
                <div key={index} className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-white dark:bg-[#01402e] border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[4px_4px_0px_#01402e] dark:shadow-[4px_4px_0px_#f4c600] flex items-center justify-center shrink-0 group-hover:bg-[#f4c600] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-all">
                    <reason.icon className="w-6 h-6 text-[#01402e] dark:text-[#f7f0e5] group-hover:text-[#01402e] transition-colors" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1 text-[#01402e] dark:text-[#f7f0e5]">{reason.title}</h4>
                    <p className="text-[#01402e]/60 dark:text-[#f7f0e5]/60">{reason.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="bg-[#f4c600] border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[6px_6px_0px_#01402e] dark:shadow-[6px_6px_0px_#f4c600] p-8 md:p-12">
              <div className="text-6xl text-[#01402e]/30 font-black leading-none mb-4">"</div>
              <p className="text-xl md:text-2xl font-semibold text-[#01402e] mb-6">
                Zidwell helps business owners stop reacting to money problems and start making confident financial decisions.
              </p>
              <div className="w-16 h-1 bg-[#01402e]/30" />
            </div>
            <div className="absolute -bottom-4 -right-4 w-full h-full bg-[#01402e] dark:bg-[#f7f0e5] -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
