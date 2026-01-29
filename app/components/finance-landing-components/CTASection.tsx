"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Button2 } from "../ui/button2";
import ConsultationModal from "./ConsultationModal";
import { useRouter } from "next/navigation";

const CTASection = () => {
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const router = useRouter();
  return (
    <section className="py-20 md:py-28 lg:py-32 relative overflow-hidden bg-gold-gradient-subtle">
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />

      {/* Background decorations */}
      <div className="absolute top-10 left-10 w-20 h-20 border-2 border-[#C29307] rotate-45 opacity-30" />
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-[#C29307]/10 rounded-full" />
      <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-[#C29307]" />
      <div className="absolute bottom-1/3 right-1/3 w-24 h-24 bg-linear-to-br from-[#C29307]/20 to-transparent rounded-full blur-xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Promise */}
          <div className="mb-12">
            <div className="inline-block px-4 py-1 bg-[#C29307] text-neutral-900 text-sm font-semibold mb-4">
              OUR PROMISE
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6">
              No confusion. No guesswork.{" "}
              <span className="relative inline-block">
                <span className="relative z-10">100% Results.</span>
                <span className="absolute bottom-2 left-0 w-full h-3 bg-[#C29307] z-0" />
              </span>
            </h2>
            <p className="text-xl text-muted-neutral-900 max-w-2xl mx-auto">
              Clear records, proper structure, and experts working for you for
              less than the price of a full-time accountant.
            </p>
          </div>

          {/* CTA */}
          <div className="bg-neutral-900 text-white p-8 md:p-12 border-2 border-neutral-900">
            <h3 className="text-2xl md:text-3xl font-bold mb-6">
              Ready to get your business finances in order?
            </h3>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button2
                onClick={() => router.push("https://tally.so/r/447JoO")}
                className="bg-[#C29307] text-neutral-900 border-white group"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button2>
              <Button2
                variant="heroOutline"
                className="bg-white text-neutral-900 border-white group"
                onClick={() => setIsConsultationOpen(true)}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Talk to a Finance Expert
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

export default CTASection;
