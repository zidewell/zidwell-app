"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Users } from "lucide-react";
import { Button2 } from "../ui/button2";
import { useUserContextData } from "@/app/context/userData";

const Hero = () => {
  const { user } = useUserContextData();
  const router = useRouter();

  const mainHeroImage = "https://images.unsplash.com/photo-1739298061757-7a3339cee982?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjJ8fGhhcHB5JTIwYmxhY2slMjBidXNpbmVzcyUyMHBlb3BsZXxlbnwwfDB8MHx8fDA%3D";
  const floatingHeroImage = "https://images.unsplash.com/photo-1687422808248-f807f4ea2a2e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGhhcHB5JTIwYmxhY2slMjBidXNpbmVzc3xlbnwwfDB8MHx8fDA%3D";

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-[#f7f0e5] dark:bg-[#01402e]">
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(#01402e 1px, transparent 1px), linear-gradient(90deg, #01402e 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        <div className="mx-auto px-6 py-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="max-w-xl">
              {/* Badge */}
              <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 bg-[#f4c600]/10 border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[4px_4px_0px_#01402e] dark:shadow-[4px_4px_0px_#f4c600] mb-8">
                <span className="w-2 h-2 bg-[#f4c600] rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-[#01402e] dark:text-[#f7f0e5]">The OneApp for Business Finance</span>
              </div>

              {/* Main Heading */}
              <h1 className="animate-fade-up-delay-1 text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6 text-balance text-[#01402e] dark:text-[#f7f0e5]">
                Tax and Finance Management App for{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 text-[#f4c600]">SMEs</span>
                  <span className="absolute bottom-2 left-0 right-0 h-4 bg-[#f4c600]/40 z-0" />
                </span>
              </h1>

              {/* Subheading */}
              <p className="animate-fade-up-delay-2 text-lg md:text-xl text-[#01402e]/70 dark:text-[#f7f0e5]/70 mb-8 text-balance">
                Everything You Need to be Tax Ready All-in-One Place: Invoices, Receipts, Income and Expense Reports, Bookkeeping, Tax Calculator, Contracts and Payments, it's all here.
              </p>

              {/* CTA Buttons */}
              <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-start gap-4 mb-8">
                {user ? (
                  <Button2
                    variant="hero"
                    size="xl"
                    onClick={() => router.push("/dashboard")}
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2" />
                  </Button2>
                ) : (
                  <>
                    <Button2
                      variant="hero"
                      size="xl"
                      onClick={() => router.push("/auth/signup")}
                    >
                      Get Started Free
                      <ArrowRight className="ml-2" />
                    </Button2>
                    <Button2
                      variant="heroOutline"
                      size="xl"
                      onClick={() => router.push("/auth/login")}
                    >
                      <Users className="mr-2" />
                      Join our Community
                    </Button2>
                  </>
                )}
              </div>

              {/* Trust Indicators */}
              <div className="animate-fade-up-delay-3 flex flex-wrap items-center gap-6 text-sm text-[#01402e]/60 dark:text-[#f7f0e5]/60">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>No hidden fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Start for free</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Right - Image Collage */}
            <div className="animate-fade-up-delay-2 relative hidden lg:block">
              {/* Main image */}
              <div className="relative border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[8px_8px_0px_#01402e] dark:shadow-[8px_8px_0px_#f4c600] overflow-hidden rounded-lg">
                <Image
                  src={mainHeroImage}
                  alt="Nigerian business professionals"
                  width={800}
                  height={400}
                  className="w-full h-[400px] object-cover"
                  priority
                  unoptimized={process.env.NODE_ENV === 'development'}
                  onError={(e) => {
                    console.error("Failed to load main hero image");
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#01402e]/30 to-transparent" />
              </div>

              {/* Floating smaller image */}
              <div className="absolute -bottom-8 -left-8 w-48 h-48 border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[6px_6px_0px_#f4c600] overflow-hidden rounded-lg">
                <Image
                  src={floatingHeroImage}
                  alt="Nigerian business professional"
                  width={192}
                  height={192}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Failed to load floating hero image");
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#f4c600] border-2 border-[#01402e] dark:border-[#f7f0e5] shadow-[4px_4px_0px_#01402e] dark:shadow-[4px_4px_0px_#f4c600]" />
              <div className="absolute top-1/2 -right-6 w-8 h-8 bg-[#01402e] dark:bg-[#f7f0e5]" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;