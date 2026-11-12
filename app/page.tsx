// app/page.tsx
import { Nav } from "./components/home-component/Nav";
import { Hero } from "./components/home-component/Hero";
import { TrustMarquee } from "./components/home-component/TrustMarquee";
import { ToolsBento } from "./components/home-component/ToolsBento";
import { EditorialQuote } from "./components/home-component/EditorialQuote";
import { PricingNew } from "./components/home-component/PricingNew";
import { FAQNew } from "./components/home-component/FAQNew";
import Footer from "./components/home-component/Footer";
import { HowItWorks } from "./components/home-component/HowItWorks";

import { ZidStoreSection } from "./components/home-component/ZidStoreSection";
import { VideoTestimonials } from "./components/home-component/VideoTestimonials";
import { GradientCTA } from "./components/home-component/GradientCTA";
import RecentArticles from "./components/dashboard-component/RecentArticles";

export default function HomePage() {
  return (
    <>
      <Nav />
      {/* pt-16 md:pt-20 offsets the fixed nav (h-16 mobile / md:h-20 desktop) */}
      <main className="pt-16 md:pt-20">
        <Hero />
        <TrustMarquee />

        <ToolsBento />

        <HowItWorks />

        <ZidStoreSection />
        <VideoTestimonials />
        <EditorialQuote />
        <PricingNew />
        <FAQNew />
        <div className="px-6 mx-auto md:w-6xl">
          <RecentArticles />
        </div>
        <GradientCTA />
      </main>
      <Footer />
    </>
  );
}
