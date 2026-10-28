// app/page.tsx
import { Nav } from "./components/home-component/Nav";
import { Hero } from "./components/home-component/Hero";
import { TrustMarquee } from "./components/home-component/TrustMarquee";
import { ToolsBento } from "./components/home-component/ToolsBento";

import { DashboardTabs } from "./components/home-component/DashboardTabs";
import { BankingRow } from "./components/home-component/BankingRow";
import { ApprovalNote } from "./components/home-component/ApprovalNote";
import { StatementsPreview } from "./components/home-component/StatementsPreview";
import { EditorialQuote } from "./components/home-component/EditorialQuote";
import { PricingNew } from "./components/home-component/PricingNew";
import { FAQNew } from "./components/home-component/FAQNew";
import Footer from "./components/home-component/Footer";
import { HowItWorks } from "./components/home-component/HowItWorks";

import { ZidStoreSection } from "./components/home-component/ZidStoreSection";
import { VideoTestimonials } from "./components/home-component/VideoTestimonials";
import { GradientCTA } from "./components/home-component/GradientCTA";

export default function HomePage() {
  return (
    <>
      <Nav />
      {/* pt-16 md:pt-20 offsets the fixed nav (h-16 mobile / md:h-20 desktop) */}
      <main className="pt-16 md:pt-20">
        <Hero />
        <TrustMarquee />

        {/* Feature cards — Bookkeeping, ZidStore, Invoice, Receipt,
            Tax Manager, Contracts, Business Account */}
        <ToolsBento />

        <HowItWorks />
        <DashboardTabs />
        <BankingRow />
        <ApprovalNote />
        <StatementsPreview />
        <ZidStoreSection />
        <VideoTestimonials />
        <EditorialQuote />
        <PricingNew />
        <FAQNew />
        <GradientCTA />
      </main>
      <Footer />
    </>
  );
}