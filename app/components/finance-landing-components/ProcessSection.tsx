"use client";
import { useState } from "react";
import { Button } from "../ui/button";
import { ArrowRight, UserCheck, MessageCircle } from "lucide-react";
import { Button2 } from "../ui/button2";
import { useRouter } from "next/navigation";
import ConsultationModal from "./ConsultationModal";

const ProcessSection = () => {
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const router = useRouter();

  return (
    <section className="py-20 md:py-28 lg:py-32 bg-neutral-900 text-white relative overflow-hidden">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern-dark pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block px-4 py-1 bg-[#C29307] text-neutral-900 text-sm font-semibold mb-4">
            OUR PROCESS
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6">
            2 Ways to Get Started
          </h2>
          <p className="text-lg opacity-80">
            Choose the path that works best for your business
          </p>
        </div>

        {/* Two Options */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Option 1: Self-Start */}
          <div className="bg-white text-neutral-900 border-2 border-white p-8 md:p-10 relative">
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#C29307] border-2 border-neutral-900 flex items-center justify-center font-black text-xl">
              1
            </div>

            <div className="pt-4">
              <div className="w-16 h-16 bg-secondary border-2 border-neutral-900 flex items-center justify-center mb-6">
                <UserCheck className="w-8 h-8" />
              </div>

              <h3 className="text-2xl font-bold mb-4">Get Started Yourself</h3>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-[#C29307] shrink-0 flex items-center justify-center text-sm font-bold mt-0.5">
                    ✓
                  </span>
                  <span>Sign up and fill out our business discovery form</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-[#C29307] shrink-0 flex items-center justify-center text-sm font-bold mt-0.5">
                    ✓
                  </span>
                  <span>Choose one of our service plans</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-[#C29307] shrink-0 flex items-center justify-center text-sm font-bold mt-0.5">
                    ✓
                  </span>
                  <span>Our team reaches out to get you started</span>
                </li>
              </ul>

              <Button2
                onClick={() => router.push("/f-onboarding")}
                size="lg"
                className="w-full group"
              >
                Start Now
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button2>
            </div>
          </div>

          {/* Option 2: Talk to Expert */}
          <div className="bg-[#C29307] text-neutral-900 border-2 border-neutral-900 p-8 md:p-10 relative shadow-[8px_8px_0px_hsl(0,0%,100%)]">
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-neutral-900 text-white border-2 border-white flex items-center justify-center font-black text-xl">
              2
            </div>

            <div className="pt-4">
              <div className="w-16 h-16 bg-white border-2 border-neutral-900 flex items-center justify-center mb-6">
                <MessageCircle className="w-8 h-8" />
              </div>

              <h3 className="text-2xl font-bold mb-4">
                Talk to a Finance Expert
              </h3>

              <p className="mb-6 opacity-90">
                Pay a one-time consultation fee of{" "}
                <span className="font-black text-2xl">₦50,000</span> to speak
                one-on-one with our top finance manager so we understand your
                business and get you started.
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-neutral-900 text-white shrink-0 flex items-center justify-center text-sm font-bold mt-0.5">
                    ✓
                  </span>
                  <span>Personalized consultation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-neutral-900 text-white shrink-0 flex items-center justify-center text-sm font-bold mt-0.5">
                    ✓
                  </span>
                  <span>Direct access to senior finance expert</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-neutral-900 text-white shrink-0 flex items-center justify-center text-sm font-bold mt-0.5">
                    ✓
                  </span>
                  <span>Customized recommendations</span>
                </li>
              </ul>

              <Button2
                variant="heroOutline"
                size="lg"
                className="w-full group bg-white"
                onClick={() => setIsConsultationOpen(true)}
              >
                Book Consultation
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button2>
            </div>
          </div>
        </div>
      </div>

      {/* Consultation Modal */}
      <ConsultationModal
        open={isConsultationOpen}
        onOpenChange={setIsConsultationOpen}
      />
    </section>
  );
};

export default ProcessSection;
