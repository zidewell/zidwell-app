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
    "https://images.unsplash.com/photo-1758519288814-bb9f97e4df95?q=80&w=1331&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1732067606788-6b0661b7cdef?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1621569978145-08c89eb010fe?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1687422808565-929533931584?w=1600&auto=format&fit=crop&q=80",
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Cycle through background images every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex + 1) % backgroundImages.length,
      );
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
        <div className="absolute inset-0 bg-black/60" />
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

      <div className="container mx-auto px-6 py-12 relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col items-center justify-center text-center">
          {/* Main Heading */}
          <h1 className="animate-fade-up-delay-1 text-3xl md:text-5xl lg:text-6xl font-black leading-tight mb-6 text-balance text-white">
            For those who make the{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-[var(--color-accent-yellow)]">
                impossible
              </span>
            </span>{" "}
            seem normal.
          </h1>

          {/* Subheading */}
          <p className="animate-fade-up-delay-2 text-lg md:text-xl text-gray-200 mb-6 text-balance max-w-3xl">
            Use Zidwell daily for Instant transfers, automatic bookkeeping,
            payment pages, invoices. So your business records are clean and
            ready whenever you need it.
          </p>

          {/* Main Text */}
          <p className="animate-fade-up-delay-2 text-base md:text-lg text-gray-300 mb-8 text-balance leading-relaxed max-w-3xl">
            Entrepreneurs are the heroes of our society. We built Zidwell so
            heroes can handle their entire financial operations on one platform.
            You already run a business in a tough environment, why add to your
            stress by using 5 finance apps when you can use just one - Zidwell.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            {user ? (
              <Button
                onClick={() => router.push("/dashboard")}
                className="bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 px-8 py-6 text-lg font-semibold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-pop"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => router.push("/auth/signup")}
                  className="bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 px-8 py-6 text-lg font-semibold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-pop"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(
                      "https://www.instagram.com/zidwellfinance/",
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                  className="border-2 bg-transparent border-[var(--color-accent-yellow)] text-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)] hover:text-[var(--color-ink)] px-8 py-6 text-lg font-semibold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-pop"
                >
                  <Users className="mr-2 h-5 w-5" />
                  Follow on Instagram
                </Button>
              </>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="animate-fade-up-delay-3 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[var(--color-accent-yellow)] rounded-full" />
              <span>Trusted by 1000+ businesses</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
