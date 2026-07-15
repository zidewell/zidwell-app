// "use client";
// import { Suspense } from "react";
// import { Loader2 } from "lucide-react";
// import CTA from "./components/home-component-old/CTA";
// import Features from "./components/home-component-old/Features";
// import Footer from "./components/home-component-old/Footer";
// import Hero from "./components/home-component-old/Hero";
// import Testimonials from "./components/home-component-old/Testimonials";
// import { useEffect, useMemo, useState } from "react";
// import Pricing from "./components/home-component-old/Pricing";
// import WhyDifferent from "./components/home-component-old/WhyDifferent";
// import HowItWorks from "./components/home-component-old/HowItWork";
// import WhyChoose from "./components/home-component-old/WhyChoose";
// import ZidCoin from "./components/home-component-old/Zidcoin";
// import FAQ from "./components/home-component-old/FAQ";
// import Header from "./components/home-component-old/Header";

// const animations = [
//   "fade-up",
//   "fade-down",
//   "fade-left",
//   "fade-right",
//   "zoom-in",
//   "zoom-in-up",
//   "flip-left",
//   "flip-right",
// ];

// function HomeContent() {
//   const [aosLoaded, setAosLoaded] = useState(false);

//   useEffect(() => {
//     // Dynamically import AOS only on client side
//     import("aos").then((AOS) => {
//       AOS.default.init({
//         duration: 800,
//         once: true,
//       });
//       setAosLoaded(true);
//     });
//   }, []);

//   const componentSettings = useMemo(() => {
//     const components = [
//       { id: "hero", name: "Hero" },
//       { id: "features", name: "Features" },
//       { id: "howItWorks", name: "HowItWorks" },
//       { id: "whyDifferent", name: "WhyDifferent" },
//       { id: "whyChoose", name: "WhyChoose" },
//       { id: "testimonials", name: "Testimonials" },
//       { id: "pricing", name: "Pricing" },
//       { id: "zidCoin", name: "ZidCoin" },
//       { id: "faq", name: "FAQ" },
//       { id: "cta", name: "CTA" },
//     ];

//     return components.map((component) => ({
//       ...component,
//       animation: animations[Math.floor(Math.random() * animations.length)],
//       delay: Math.floor(Math.random() * 300),
//       duration: 600 + Math.floor(Math.random() * 600),
//     }));
//   }, []);

//   return (
//     <main className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 overflow-x-hidden">
//       <Header />

//       {componentSettings.map((component) => (
//         <div
//           key={component.id}
//           data-aos={aosLoaded ? component.animation : undefined}
//           data-aos-delay={aosLoaded ? component.delay : undefined}
//           data-aos-duration={aosLoaded ? component.duration : undefined}
//         >
//           {component.id === "hero" && <Hero />}
//           {component.id === "features" && <Features />}
//           {component.id === "howItWorks" && <HowItWorks />}
//           {component.id === "whyDifferent" && <WhyDifferent />}
//           {component.id === "whyChoose" && <WhyChoose />}
//           {component.id === "testimonials" && <Testimonials />}
//           {component.id === "pricing" && <Pricing />}
//           {/* {component.id === "zidCoin" && <ZidCoin />} */}
//           {component.id === "faq" && <FAQ />}
//           {component.id === "cta" && <CTA />}
//         </div>
//       ))}

//       <Footer />
//     </main>
//   );
// }

// export default function Page() {
//   return (
//     <Suspense
//       fallback={
//         <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
//           <Loader2 className="w-8 h-8 animate-spin text-(--color-accent-yellow)" />
//         </div>
//       }
//     >
//       <HomeContent />
//     </Suspense>
//   );
// }




"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { AISection } from "./components/home-component/AISection"; 
import { BonusTools } from "./components/home-component/BonusTools";
import { BuiltForReal } from "./components/home-component/BuiltForReal";
import { Categories } from "./components/home-component/Categories";
import { ConnectedAccounts } from "./components/home-component/ConnectedAccounts";
import { DashboardSection } from "./components/home-component/DashboardSection";
import { FinalCTA } from "./components/home-component/FinalCTA";
import Footer from "./components/home-component/Footer";
import { HealthSection } from "./components/home-component/HealthSection";
import { Hero } from "./components/home-component/Hero";
import { HowItWorks } from "./components/home-component/HowItWork";
import { MoneyFlowSection } from "./components/home-component/MoneyFlowSection";
import { Nav } from "./components/home-component/Nav";
import { PlansSection } from "./components/home-component/PlansSection";
import { SocialBar } from "./components/home-component/SocialBar";
import { StatementsSection } from "./components/home-component/StatementsSection";
import { TeamControl } from "./components/home-component/TeamControl";

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

function LandingContent() {
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
      { id: "nav", name: "Nav" },
      { id: "hero", name: "Hero" },
      { id: "socialBar", name: "SocialBar" },
      { id: "howItWorks", name: "HowItWorks" },
      { id: "connectedAccounts", name: "ConnectedAccounts" },
      { id: "moneyFlowSection", name: "MoneyFlowSection" },
      { id: "statementsSection", name: "StatementsSection" },
      { id: "bonusTools", name: "BonusTools" },
      { id: "teamControl", name: "TeamControl" },
      { id: "categories", name: "Categories" },
      { id: "builtForReal", name: "BuiltForReal" },
      { id: "dashboardSection", name: "DashboardSection" },
      { id: "healthSection", name: "HealthSection" },
      { id: "plansSection", name: "PlansSection" },
      { id: "aiSection", name: "AISection" },
      { id: "finalCTA", name: "FinalCTA" },
    ];

    return components.map((component) => ({
      ...component,
      animation: animations[Math.floor(Math.random() * animations.length)],
      delay: Math.floor(Math.random() * 300),
      duration: 600 + Math.floor(Math.random() * 600),
    }));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {componentSettings.map((component) => (
        <div
          key={component.id}
          data-aos={aosLoaded ? component.animation : undefined}
          data-aos-delay={aosLoaded ? component.delay : undefined}
          data-aos-duration={aosLoaded ? component.duration : undefined}
        >
          {component.id === "nav" && <Nav />}
          {component.id === "hero" && <Hero />}
          {component.id === "socialBar" && <SocialBar />}
          {component.id === "howItWorks" && <HowItWorks />}
          {component.id === "connectedAccounts" && <ConnectedAccounts />}
          {component.id === "moneyFlowSection" && <MoneyFlowSection />}
          {component.id === "statementsSection" && <StatementsSection />}
          {component.id === "bonusTools" && <BonusTools />}
          {component.id === "teamControl" && <TeamControl />}
          {component.id === "categories" && <Categories />}
          {component.id === "builtForReal" && <BuiltForReal />}
          {component.id === "dashboardSection" && <DashboardSection />}
          {component.id === "healthSection" && <HealthSection />}
          {component.id === "plansSection" && <PlansSection />}
          {component.id === "aiSection" && <AISection />}
          {component.id === "finalCTA" && <FinalCTA />}
        </div>
      ))}
      <Footer />
    </div>
  );
}

export default function Landing() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent-yellow)]" />
        </div>
      }
    >
      <LandingContent />
    </Suspense>
  );
}
