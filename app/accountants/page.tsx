



"use client";

import { useEffect, useMemo } from "react";
import AboutSection from "../components/finance-landing-components/AboutSection";
import ClienteleSection from "../components/finance-landing-components/ClientelSection";
import CTASection from "../components/finance-landing-components/CTASection";
import Footer from "../components/finance-landing-components/Footer";
import HeroSection from "../components/finance-landing-components/HeroSection";
import Navbar from "../components/finance-landing-components/Navbar";
import PricingSection from "../components/finance-landing-components/PricingSection";
import ProcessSection from "../components/finance-landing-components/ProcessSection";
import ServicesSection from "../components/finance-landing-components/ServicesSection";
import TestimonialsSection from "../components/finance-landing-components/TestimonialsSection";
import WhyUsSection from "../components/finance-landing-components/WhyUseSection";
import Aos from "aos";

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
    Aos.init({
      duration: 800,
      once: true,
    });
  }, []);

  const sectionAnimations = useMemo(() => {
    const sections = [
      { id: "hero", name: "HeroSection" },
      { id: "about", name: "AboutSection" },
      { id: "clientele", name: "ClienteleSection" },
      { id: "services", name: "ServicesSection" },
      { id: "process", name: "ProcessSection" },
      { id: "pricing", name: "PricingSection" },
      { id: "testimonials", name: "TestimonialsSection" },
      { id: "whyus", name: "WhyUsSection" },
      { id: "cta", name: "CTASection" },
    ];
    
    return sections.map(section => ({
      ...section,
      animation: animations[Math.floor(Math.random() * animations.length)],
      delay: Math.floor(Math.random() * 200), // Random delay between 0-200ms
    }));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {sectionAnimations.map((section) => (
          <div 
            key={section.id}
            data-aos={section.animation}
            data-aos-delay={section.delay}
          >
            {section.id === "hero" && <HeroSection />}
            {section.id === "about" && <AboutSection />}
            {section.id === "clientele" && <ClienteleSection />}
            {section.id === "services" && <ServicesSection />}
            {section.id === "process" && <ProcessSection />}
            {section.id === "pricing" && <PricingSection />}
            {section.id === "testimonials" && <TestimonialsSection />}
            {section.id === "whyus" && <WhyUsSection />}
            {section.id === "cta" && <CTASection />}
          </div>
        ))}
      </main>
      <Footer />
    </div>
  );
};

export default page;