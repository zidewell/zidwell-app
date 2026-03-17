import accountantImage from "../../../public/accountant-working.jpg";
import Image from "next/image";

const AboutSection = () => {
  return (
    <section
      id="about"
      className="py-20 md:py-28 lg:py-32 bg-[#F5F4F2]/30 relative overflow-hidden"
    >
      {/* Decorative gold patches */}
      <div className="absolute top-20 right-0 w-64 h-64 bg-linear-to-bl from-[#2b825b]/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-48 h-48 bg-linear-to-tr from-[#2b825b]/15 to-transparent rounded-full blur-2xl" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image */}
          <div className="relative order-2 lg:order-1">
            <div className="relative">
              {/* Decorative background */}
              <div className="absolute -top-4 -left-4 w-full h-full border-2 border-[#2b825b]" />
              <Image
                src="https://images.unsplash.com/photo-1666867936058-de34bfd5b320?q=80&w=442&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Zidwell accountant at work"
                className="relative w-full h-auto border-2 border-neutral-900 object-cover"
                width={500}
                height={500}
              />
            </div>

            {/* Stats card */}
            <div className="absolute -bottom-8 -right-4 md:right-8 bg-neutral-900 text-white p-6 border-2 border-neutral-900">
              <p className="text-3xl font-black text-[#2b825b]">5+ Years</p>
              <p className="text-sm">of Financial Expertise</p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6 order-1 lg:order-2">
            <div className="inline-block px-4 py-1 bg-[#2b825b]/20 border border-[#2b825b] text-sm font-semibold">
              WHO WE ARE
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight">
              Your Trusted Financial Management Partner
            </h2>

            <div className="space-y-4 text-muted-neutral-900">
              <p className="text-lg leading-relaxed">
                Zidwell is a finance and accounting services company built for
                businesses operating in Nigeria.
              </p>

              <p className="leading-relaxed">
                We help founders, SMEs, and professionals organize their money,
                stay tax-compliant, and make better financial decisions — all
                for less than the cost of hiring a full-time accountant.
              </p>
            </div>

            {/* What we do intro */}
            <div className="pt-6 border-t border-border">
              <h3 className="text-xl font-bold mb-3">What We Do</h3>
              <p className="text-muted-neutral-900">
                Zidwell combines human expertise with smart tools to help you
                manage your business finances properly. Our core focus:{" "}
                <span className="text-neutral-900 font-semibold">
                  clarity, compliance, and peace of mind.
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
