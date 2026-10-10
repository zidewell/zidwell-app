// app/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import Loader from "@/app/components/Loader";
import { CoreTools } from "./components/home-component/CoreTools";
import { FAQ } from "./components/home-component/FAQ";
import { FinalCTA } from "./components/home-component/FinalCTANew";
import Footer from "./components/home-component/Footer";
import { Hero } from "./components/home-component/Hero";
import { HowItWorks } from "./components/home-component/HowItWorksNew";
import { Intro } from "./components/home-component/Intro";
import { Nav } from "./components/home-component/Nav";
import { PlansSection } from "./components/home-component/PlansSection";
import { SocialBar } from "./components/home-component/SocialBar";
import { Testimonials } from "./components/home-component/Testimonials";
import { TrustBar } from "./components/home-component/TrustBar";

const metadata = {
  title:
    "Zidwell | The Business Owner's Toolkit — Manage, Organize & Grow Your Business",
  description:
    "Zidwell is the Business Owner's Toolkit: a business bank account, automatic bookkeeping, invoices, receipts, contracts, online storefront, document vault and tax tools — all in one place. 7-day free trial.",
  keywords: [
    "business owner toolkit",
    "business bank account Nigeria",
    "automatic bookkeeping",
    "invoice tool Nigeria",
    "receipt tool Nigeria",
    "digital contracts",
    "online storefront Nigeria",
    "document vault",
    "tax calculator Nigeria",
    "SME finance platform",
    "Zidwell",
  ],
  alternates: {
    canonical: "https://zidwell.com",
  },
  openGraph: {
    title: "Zidwell | The Business Owner's Toolkit",
    description:
      "One bundle. One annual payment. One week free trial. Manage your money, organize your business, sell online, and build with structure.",
    url: "https://zidwell.com",
    siteName: "Zidwell",
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: "https://zidwell.com/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Zidwell — The Business Owner's Toolkit",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@zidwellapp",
    creator: "@zidwellapp",
    title: "Zidwell | The Business Owner's Toolkit",
    description:
      "Business bank account, bookkeeping, invoices, receipts, contracts, storefront & more — in one toolkit. Start your 7-day free trial.",
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

// ─────────────────────────────────────────────────────────────────────────────
// Section order — the new narrative
//
//   1. Nav
//   2. Hero               — "Tools That Help You Build & Run Your Business Empire"
//   3. Intro              — "Without Structure, Your Business Can't Grow"
//   4. TrustBar           — quick trust signal
//   5. SocialBar          — global reach + multi-currency
//   6. CoreTools          — "One Toolkit. Less Business Chaos."
//   7. HowItWorks         — "Simple 4-Steps to Start"
//   8. Testimonials       — "Businesses Are Building with Zidwell"
//   9. PlansSection       — Starter / SME / Enterprise
//  10. FAQ                — Questions, answered
//  11. FinalCTA           — "Your Business Needs Structure to Grow"
//  12. Footer
// ─────────────────────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: "nav", name: "Nav" },
  { id: "hero", name: "Hero" },
  { id: "intro", name: "Intro" },
  { id: "trustBar", name: "TrustBar" },
  { id: "socialBar", name: "SocialBar" },
  { id: "coreTools", name: "CoreTools" },
  { id: "howItWorks", name: "HowItWorks" },
  { id: "testimonials", name: "Testimonials" },
  { id: "plansSection", name: "PlansSection" },
  { id: "faq", name: "FAQ" },
  { id: "finalCTA", name: "FinalCTA" },
] as const;

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

  // Pre-compute animation settings once per mount so React doesn't
  // re-randomize them on every render.
  const [componentSettings] = useState(() =>
    SECTIONS.map((section) => ({
      ...section,
      animation: animations[Math.floor(Math.random() * animations.length)],
      delay: Math.floor(Math.random() * 300),
      duration: 600 + Math.floor(Math.random() * 600),
    })),
  );

  return (
    <div className="min-h-screen bg-(--bg-primary) text-(--text-primary)">
      {componentSettings.map((component) => (
        <div
          key={component.id}
          data-aos={aosLoaded ? component.animation : undefined}
          data-aos-delay={aosLoaded ? component.delay : undefined}
          data-aos-duration={aosLoaded ? component.duration : undefined}
        >
          {component.id === "nav" && <Nav />}
          {component.id === "hero" && <Hero />}
          {component.id === "intro" && <Intro />}
          {component.id === "trustBar" && <TrustBar />}
          {component.id === "socialBar" && <SocialBar />}
          {component.id === "coreTools" && <CoreTools />}
          {component.id === "howItWorks" && <HowItWorks />}
          {component.id === "testimonials" && <Testimonials />}
          {component.id === "plansSection" && <PlansSection />}
          {component.id === "faq" && <FAQ />}
          {component.id === "finalCTA" && <FinalCTA />}
        </div>
      ))}
      <Footer />
    </div>
  );
}

export default function Landing() {
  return (
    <Suspense fallback={<Loader />}>
      <LandingContent />
    </Suspense>
  );
}