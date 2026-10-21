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


export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <TrustMarquee />
        <HowItWorks />
        <ToolsBento />
        <DashboardTabs />
        <BankingRow />
        <ApprovalNote />
        <StatementsPreview />
        <EditorialQuote />
        <PricingNew />
        <FAQNew />
      
      </main>
      <Footer />
    </>
  );
}