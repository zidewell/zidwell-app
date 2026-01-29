import { Wrench, MapPin, Cpu, Shield } from "lucide-react";
import financeProfessional from "../../../public/finance-professional.jpg";
import Image from "next/image";

const reasons = [
  {
    icon: Wrench,
    title: "We focus on doing the work, not just giving tools",
  },
  {
    icon: MapPin,
    title: "We understand Nigerian tax and business realities",
  },
  {
    icon: Cpu,
    title: "We combine human expertise with simple technology",
  },
  {
    icon: Shield,
    title: "We help you avoid costly mistakes before they happen",
  },
];

const WhyUsSection = () => {
  return (
    <section className="py-20 md:py-28 lg:py-32 bg-[#F5F4F2]/30 relative overflow-hidden">
      {/* Gold mesh background */}
      <div className="absolute inset-0 bg-gold-mesh pointer-events-none opacity-70" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div>
              <div className="inline-block px-4 py-1 bg-[#C29307]/20 border border-[#C29307] text-sm font-semibold mb-4">
                WHY ZIDWELL
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6">
                Why Businesses Choose Zidwell
              </h2>
            </div>

            {/* Reasons */}
            <div className="space-y-4">
              {reasons.map((reason, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-white border-2 border-neutral-900 transition-all hover:shadow-[4px_4px_0px_#C29307]"
                >
                  <div className="w-12 h-12 bg-[#C29307] border-2 border-neutral-900 flex items-center justify-center shrink-0">
                    <reason.icon className="w-6 h-6" />
                  </div>
                  <p className="font-semibold">{reason.title}</p>
                </div>
              ))}
            </div>

            <p className="text-lg text-muted-neutral-900 border-l-4 border-[#C29307] pl-6">
              Zidwell gives you peace of mind so you can focus on growing your
              business.
            </p>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="relative border-2 border-neutral-900 shadow-[8px_8px_0px_hsl(252,8%,10%)]">
              <Image
                src={financeProfessional}
                alt="Zidwell finance professional analyzing data"
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Decorative element */}
            <div className="absolute -bottom-6 -left-6 w-24 h-24 border-2 border-[#C29307] bg-[#C29307]/20" />
          </div>
        </div>

        {/* Who is Zidwell for */}
        <div className="mt-24 text-center">
          <h3 className="text-2xl md:text-3xl font-black mb-8">
            Who Zidwell Is For
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              "Small and growing businesses",
              "Founders and entrepreneurs",
              "Professionals with side businesses",
              "Anyone who wants their finances done properly",
            ].map((item, index) => (
              <div
                key={index}
                className="px-6 py-3 bg-white border-2 border-neutral-900 font-medium hover:bg-[#C29307] transition-colors cursor-default"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyUsSection;
