// components/Hero.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Users } from "lucide-react";
import { useUserContextData } from "@/app/context/userData";
import { Button } from "../ui/button";

const Hero = () => {
  const { user } = useUserContextData();
  const router = useRouter();

  // Array of background images
  const backgroundImages = [
    "https://images.unsplash.com/photo-1758519288948-e3c87d2d78d8?w=1600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1687422808248-f807f4ea2a2e?w=1600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1687422808565-929533931584?w=1600&auto=format&fit=crop&q=80",
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Cycle through background images every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image with opacity and transition */}
      <div className="absolute inset-0 z-0">
        {backgroundImages.map((image, index) => (
          <div
            key={image}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
        ))}
        {/* Dark overlay to ensure text readability */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] z-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="mx-auto px-6 py-12 relative z-10">
        <div className="max-w-5xl">
          {/* Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 bg-(--color-accent-yellow)/10 border-2 border-(--border-color)  squircle-md mb-8">
            <span className="w-2 h-2 bg-(--color-accent-yellow) rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-white">
              The OneApp for Business Finance
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="animate-fade-up-delay-1 text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6 text-balance text-white">
            Tax and Finance Management App for{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-(--color-accent-yellow)">
                SMEs
              </span>
              <span className="absolute bottom-2 left-0 right-0 h-4 bg-(--color-accent-yellow)/40 z-0" />
            </span>
          </h1>

          {/* Subheading */}
          <p className="animate-fade-up-delay-2 text-lg md:text-xl text-gray-200 mb-8 text-balance">
            Everything You Need to be Tax Ready All-in-One Place: Invoices,
            Receipts, Income and Expense Reports, Bookkeeping, Tax Calculator,
            Contracts and Payments, it's all here.
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
                  className="border-2 bg-transparent border-(--color-accent-yellow) text-(--color-accent-yellow) hover:bg-(--color-accent-yellow) hover:text-(--color-ink) px-8 py-6 text-lg font-semibold squcircle-md transition-all hover:-translate-y-0.5 hover:shadow-pop"
                >
                  <Users className="mr-2 h-5 w-5" />
                  Join our Community
                </Button>
              </>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="animate-fade-up-delay-3 flex flex-wrap items-center gap-6 text-sm text-gray-200">
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
      </div>
    </section>
  );
};

export default Hero;