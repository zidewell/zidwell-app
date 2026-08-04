// app/page.tsx
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

// ✅ Homepage-specific metadata (overrides root layout)
export const metadata = {
  title: "Zidwell | All-in-One Finance & Business Management Platform for Nigerian SMEs",
  description:
    "Zidwell helps Nigerian businesses with invoicing, receipts, contracts, accounting, tax filing, and financial management. All-in-one platform for SMEs, freelancers, and entrepreneurs.",
  keywords: [
    "invoice generator Nigeria",
    "online invoice maker Nigeria",
    "business accounting Nigeria",
    "SME finance platform",
    "Nigerian business tools",
    "digital receipt Nigeria",
    "contract creator Nigeria",
    "business tax filing Nigeria",
    "fintech platform Nigeria",
  ],
  alternates: {
    canonical: "https://zidwell.com",
  },
  openGraph: {
    title: "Zidwell | Finance & Business Tools for Nigerian SMEs",
    description:
      "Create invoices, receipts, contracts, manage finances, and grow your business with Zidwell. All-in-one platform for Nigerian entrepreneurs.",
    url: "https://zidwell.com",
    siteName: "Zidwell",
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: "https://zidwell.com/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Zidwell - Business Finance & Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@zidwellapp",
    creator: "@zidwellapp",
    title: "Zidwell | Business Finance Platform Nigeria",
    description:
      "Invoicing, contracts, receipts, accounting & financial tools for Nigerian businesses. Start free today.",
    images: ["https://zidwell.com/images/twitter-card.jpg"],
  },
};

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