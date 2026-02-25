"use client";
import CTA from "./components/CTA";
import Features from "./components/Features";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Testimonials from "./components/Testimonials";
import AOS from 'aos';
import { useEffect, useMemo } from "react";
import 'aos/dist/aos.css'; 
import Pricing from "./components/Pricing";
import WhyDifferent from "./components/WhyDifferent";
import HowItWorks from "./components/HowItWorks";
import WhyChoose from "./components/WhyChoose";
import ZidCoin from "./components/ZisCoin";
import FAQ from "./components/Faq";

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

const page = () => {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
    });
  }, []);

  const componentSettings = useMemo(() => {
    const components = [
      { id: "hero", name: "Hero" },
      { id: "features", name: "Features" },
      { id: "whyDifferent", name: "WhyDifferent" },
      { id: "howItWorks", name: "HowItWorks" },
      { id: "whyChoose", name: "WhyChoose" },
      { id: "testimonials", name: "Testimonials" },
      { id: "pricing", name: "Pricing" },
      { id: "zidCoin", name: "ZidCoin" },
      { id: "faq", name: "FAQ" },
      { id: "cta", name: "CTA" },
    ];
    
    return components.map(component => ({
      ...component,
      animation: animations[Math.floor(Math.random() * animations.length)],
      delay: Math.floor(Math.random() * 300), // 0-300ms delay
      duration: 600 + Math.floor(Math.random() * 600), // 600-1200ms duration
    }));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 overflow-x-hidden">
      <Header />
      
      {componentSettings.map((component) => (
        <div 
          key={component.id}
          data-aos={component.animation}
          data-aos-delay={component.delay}
          data-aos-duration={component.duration}
        >
          {component.id === "hero" && <Hero />}
          {component.id === "features" && <Features />}
          {component.id === "whyDifferent" && <WhyDifferent />}
          {component.id === "howItWorks" && <HowItWorks />}
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
};

export default page;
