"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import heroImage from "../../../public/hero-business-team.jpg";
import ConsultationModal from "./ConsultationModal";
import Image from "next/image";
import { Button2 } from "../ui/button2";
import { useRouter } from "next/navigation";

const HeroSection = () => {
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const router = useRouter();
  return (
    <section className="relative min-h-screen flex items-center pt-20 md:pt-24 overflow-hidden bg-gold-mesh">
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />

      {/* Background decorations */}
      <div className="absolute top-40 right-10 w-20 h-20 border-2 border-[#C29307] rotate-12 opacity-30" />
      <div className="absolute bottom-40 left-10 w-16 h-16 bg-[#C29307]/20 rotate-45" />
      <div className="absolute top-1/2 right-1/4 w-4 h-4 bg-[#C29307] rounded-full opacity-60" />
      <div className="absolute top-1/3 left-1/3 w-32 h-32 bg-linear-to-br from-[#C29307]/10 to-transparent rounded-full blur-2xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
                Business Growth Starts with{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">Healthy Accounting</span>
                  <span className="absolute bottom-2 left-0 w-full h-3 bg-[#C29307] z-0" />
                </span>{" "}
                & Financial Wellness.
              </h1>

              <p className="text-lg text-muted-neutral-900 max-w-xl leading-relaxed">
                We provide accounting services, tax management, and financial
                advisory services to save your business from unnecessary
                financial losses and tax risk. With Zidwell you save time,
                money, and your growth is smooth and easy.
              </p>
            </div>

            {/* Highlighted text */}
            <div className="border-l-4 border-[#C29307] pl-6 py-2 bg-linear-to-r from-[#C29307]/10 to-transparent">
              <p className="text-lg font-semibold">
                Think of Zidwell as your outsourced finance team, without the
                stress or high cost.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button2
                onClick={() => {
                  router.push("https://tally.so/r/447JoO");
                }}
                className="group"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button2>
              <Button2
                variant="heroOutline"
                className="group"
                onClick={() => setIsConsultationOpen(true)}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Talk to a Finance Expert
              </Button2>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-muted border-2 border-white flex items-center justify-center text-xs font-bold"
                  >
                    {i}0+
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-neutral-900">
                <span className="font-semibold text-neutral-900">100+</span>{" "}
                businesses trust Zidwell
              </p>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative border-2 border-neutral-900 shadow-[8px_8px_0px_#C29307]">
              <Image
                src="https://images.unsplash.com/photo-1653566031486-dc4ead13a35d?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Zidwell Finance team collaborating in modern office"
                className="w-full h-auto object-cover"
                height={500}
                width={500}
              />
              {/* Floating WhatsApp card */}
              <a
                href="https://wa.me/7069175399"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute -bottom-6 -left-6 bg-white border-2 border-neutral-900 p-4 shadow-[4px_4px_0px_hsl(252,8%,10%)] hover:shadow-[6px_6px_0px_hsl(252,8%,10%)] transition-all hover:-translate-y-1 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold flex items-center gap-1">
                      WhatsApp
                    </p>
                    <p className="text-xs text-muted-neutral-900">
                      +234-7069175399
                    </p>
                  </div>
                </div>
              </a>
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

export default HeroSection;
