"use client";

import Features from "@/app/components/smart-contract-components/Features";
import Pricing from "@/app/components/smart-contract-components/Pricing";
import SmartContractHero from "@/app/components/smart-contract-components/SmartContractHero";
import SmartContractStep from "@/app/components/smart-contract-components/SmartContractStep";
import { useSubscription } from "@/app/hooks/useSubscripion";
import { ArrowLeft, Crown, Zap, Sparkles, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import Header from "@/app/components/home-component/Header";

const ContractLandingPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-(--bg-secondary) dark:bg-[#0e0e0e] fade-in relative">
      <Header />
      <div className="max-w-6xl mx-auto px-4 pt-24 md:pt-28">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-(--color-accent-yellow) hover:bg-(--bg-secondary) text-sm md:text-base squircle-md"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="hidden md:block">Back</span>
        </Button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5 ">
        <SmartContractHero />
        <Features />
        <SmartContractStep />
        <Pricing />
      </div>
    </div>
  );
};

export default ContractLandingPage;
