import type { Metadata } from "next";
import Hero from "./hero";
import SocialBar from "./socialbar";
import HowItWorks from "./howitwork";
import { BookkeepingStyles } from "../BookingKeepingStyles";
import { ConnectedAccounts } from "../connected-accounts/connected-accounts";
import MoneyFlowSection from "./moneyflow";
import StatementsSection from "./statement";
import BonusTools from "./bonustools";
import TeamControl from "./teamcontrol";
import BuiltForReal from "./buildforreal";
import DashboardSection from "./dashboardsection";
import HealthSection from "./healthsection";
import { Plans } from "../plan/plan";
import AISection from "./aisection";
import FinalCTA from "./finalcta";
import Header from "./Header";
import Footer from "./Footer";
import Categories from "./categories";


// ---------------------------------------------------------------------------
// Next.js metadata (replaces the TanStack Router `head()` function)
// This file is intended to live at: app/page.tsx
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: "Zidwell · Your Financial Records, Done For You",
  description:
    "Zidwell gives freelancers, SMEs and global businesses easy, automatic and clearly organized financial records — ready for taxes, loans, investors and better business decisions.",
  openGraph: {
    title: "Zidwell · Your Financial Records, Done For You",
    description:
      "Automatic bookkeeping and financial records for every business — freelancers, SMEs and global companies.",
  },
};

export default function Homepage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <SocialBar />
      <HowItWorks />
      <BookkeepingStyles />
      <ConnectedAccounts />
      <MoneyFlowSection />
      <StatementsSection />
      <BonusTools />
      <TeamControl />
      <Categories />
      <BuiltForReal />
      <DashboardSection />
      <HealthSection />
      <Plans />
      <AISection />
      <FinalCTA />
      <Footer />
    </div>
  );
}



