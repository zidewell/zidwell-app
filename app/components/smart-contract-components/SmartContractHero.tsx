"use client";

import React from "react";
import ButtonPrimary from "./ButtonPrimary";
import ButtonGhost from "./ButtonGhost";
import IconDoc from "./IconDoc";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

const SmartContractHero: React.FC = () => {
  const router = useRouter();

  return (
    <header className="py-16">
      <div className="container mx-auto px-6 md:px-12 lg:px-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            Smart Contracts
            <span className="block text-[#C29307]">Made Simple</span>
          </h1>

          <p className="mt-4 text-gray-600">
            Create, send, and sign professional contracts in minutes. Legally
            binding, digitally secured, effortlessly managed.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <ButtonPrimary
              onClick={() =>
                router.push("/dashboard/services/contract/create-contract-form")
              }
            >
              Create Contract Now
            </ButtonPrimary>

            <a href="#contract-pricing">
              <Button variant="outline">View Pricing</Button>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SmartContractHero;
