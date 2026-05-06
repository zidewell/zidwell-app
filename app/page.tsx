"use client";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import CTA from "./components/home-component/CTA";
import Features from "./components/home-component/Features";
import Footer from "./components/home-component/Footer";
import Hero from "./components/home-component/Hero";
import Testimonials from "./components/home-component/Testimonials";
import { useEffect, useMemo, useState } from "react";
import Pricing from "./components/home-component/Pricing";
import WhyDifferent from "./components/home-component/WhyDifferent";
import HowItWorks from "./components/home-component/HowItWork";
import WhyChoose from "./components/home-component/WhyChoose";
import ZidCoin from "./components/home-component/Zidcoin";
import FAQ from "./components/home-component/FAQ";
import Header from "./components/home-component/Header";

const animations = [
  "fade-up",
  "fade-down",
  "fade-left",
  "fade-right",
  "zoom-in",
  "zoom-in-up",
  "flip-left",
  "flip-right",
];

function HomeContent() {
  const [aosLoaded, setAosLoaded] = useState(false);

  useEffect(() => {
    // Dynamically import AOS only on client side
    import("aos").then((AOS) => {
      AOS.default.init({
        duration: 800,
        once: true,
      });
      setAosLoaded(true);
    });
  }, []);

  const componentSettings = useMemo(() => {
    const components = [
      { id: "hero", name: "Hero" },
      { id: "features", name: "Features" },
      { id: "howItWorks", name: "HowItWorks" },
      { id: "whyDifferent", name: "WhyDifferent" },
      { id: "whyChoose", name: "WhyChoose" },
      { id: "testimonials", name: "Testimonials" },
      { id: "pricing", name: "Pricing" },
      { id: "zidCoin", name: "ZidCoin" },
      { id: "faq", name: "FAQ" },
      { id: "cta", name: "CTA" },
    ];

    return components.map((component) => ({
      ...component,
      animation: animations[Math.floor(Math.random() * animations.length)],
      delay: Math.floor(Math.random() * 300),
      duration: 600 + Math.floor(Math.random() * 600),
    }));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 overflow-x-hidden">
      <Header />

      {componentSettings.map((component) => (
        <div
          key={component.id}
          data-aos={aosLoaded ? component.animation : undefined}
          data-aos-delay={aosLoaded ? component.delay : undefined}
          data-aos-duration={aosLoaded ? component.duration : undefined}
        >
          {component.id === "hero" && <Hero />}
          {component.id === "features" && <Features />}
          {component.id === "howItWorks" && <HowItWorks />}
          {component.id === "whyDifferent" && <WhyDifferent />}
          {component.id === "whyChoose" && <WhyChoose />}
          {component.id === "testimonials" && <Testimonials />}
          {component.id === "pricing" && <Pricing />}
          {component.id === "zidCoin" && <ZidCoin />}
          {component.id === "faq" && <FAQ />}
          {component.id === "cta" && <CTA />}
        </div>
      ))}

      <Footer />
    </main>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <Loader2 className="w-8 h-8 animate-spin text-[#2b825b]" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}