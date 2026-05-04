// components/Hero.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Users } from "lucide-react";
import { useUserContextData } from "@/app/context/userData";
import { Button } from "../ui/button";

const Hero = () => {
  const { user } = useUserContextData();
  const router = useRouter();

  const mainHeroImage =
    "https://images.unsplash.com/photo-1739298061757-7a3339cee982?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjJ8fGhhcHB5JTIwYmxhY2slMjBidXNpbmVzcyUyMHBlb3BsZXxlbnwwfDB8MHx8fDA%3D";
  const floatingHeroImage =
    "https://images.unsplash.com/photo-1687422808248-f807f4ea2a2e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGhhcHB5JTIwYmxhY2slMjBidXNpbmVzc3xlbnwwfDB8MHx8fDA%3D";

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-(--bg-primary)">
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="mx-auto px-6 py-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="max-w-xl">
              {/* Badge */}
              <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 bg-(--color-accent-yellow)/10 border-2 border-(--border-color) shadow-[4px_4px_0px_var(--border-color)] squircle-md mb-8">
                <span className="w-2 h-2 bg-(--color-accent-yellow) rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-(--text-primary)">
                  The OneApp for Business Finance
                </span>
              </div>

              {/* Main Heading */}
              <h1 className="animate-fade-up-delay-1 text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6 text-balance text-(--text-primary)">
                Tax and Finance Management App for{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 text-(--color-accent-yellow)">
                    SMEs
                  </span>
                  <span className="absolute bottom-2 left-0 right-0 h-4 bg-(--color-accent-yellow)/40 z-0" />
                </span>
              </h1>

              {/* Subheading */}
              <p className="animate-fade-up-delay-2 text-lg md:text-xl text-(--text-secondary) mb-8 text-balance">
                Everything You Need to be Tax Ready All-in-One Place: Invoices,
                Receipts, Income and Expense Reports, Bookkeeping, Tax
                Calculator, Contracts and Payments, it's all here.
              </p>

              {/* CTA Buttons */}
              <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-start gap-4 mb-8">
                {user ? (
                  <Button
                    onClick={() => router.push("/dashboard")}
                    className="bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 px-8 py-6 text-lg font-semibold squircle-md transition-all hover:-translate-y-0.5 hover:shadow-pop"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => router.push("/auth/signup")}
                      className="bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 px-8 py-6 text-lg font-semibold squircle-md transition-all hover:-translate-y-0.5 hover:shadow-pop"
                    >
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/auth/login")}
                      className="border-2 border-(--color-accent-yellow) text-(--color-accent-yellow) hover:bg-(--color-accent-yellow) hover:text-(--color-ink) px-8 py-6 text-lg font-semibold squircle-md transition-all hover:-translate-y-0.5 hover:shadow-pop"
                    >
                      <Users className="mr-2 h-5 w-5" />
                      Join our Community
                    </Button>
                  </>
                )}
              </div>

              {/* Trust Indicators */}
              <div className="animate-fade-up-delay-3 flex flex-wrap items-center gap-6 text-sm text-(--text-secondary)">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[var(--color-lemon-green)] rounded-full" />
                  <span>No hidden fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[var(--color-lemon-green)] rounded-full" />
                  <span>Start for free</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[var(--color-lemon-green)] rounded-full" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Right - Image Collage */}
            <div className="animate-fade-up-delay-2 relative hidden lg:block">
              <div className="relative border-2 border-(--border-color) shadow-[8px_8px_0px_var(--border-color)] overflow-hidden squircle-lg">
                <Image
                  src={mainHeroImage}
                  alt="Nigerian business professionals"
                  width={800}
                  height={400}
                  className="w-full h-[400px] object-cover"
                  priority
                  unoptimized={process.env.NODE_ENV === "development"}
                  onError={(e) => {
                    console.error("Failed to load main hero image");
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--text-primary)]/30 to-transparent" />
              </div>

              <div className="absolute -bottom-8 -left-8 w-48 h-48 border-2 border-(--border-color) shadow-[6px_6px_0px_var(--color-accent-yellow)] overflow-hidden squircle-lg">
                <Image
                  src={floatingHeroImage}
                  alt="Nigerian business professional"
                  width={192}
                  height={192}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Failed to load floating hero image");
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>

              <div className="absolute -top-4 -right-4 w-16 h-16 bg-(--color-accent-yellow) border-2 border-(--border-color) shadow-[4px_4px_0px_var(--border-color)]" />
              <div className="absolute top-1/2 -right-6 w-8 h-8 bg-[var(--border-color)]" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
