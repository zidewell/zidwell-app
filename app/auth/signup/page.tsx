"use client";

import Carousel from "@/app/components/Carousel";
import Onboarding from "@/app/components/Onboarding";
import { TooltipProvider } from "@/app/components/ui/tooltip";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-(--bg-primary) lg:h-screen lg:overflow-hidden lg:flex lg:flex-row">
      {/* ─── LEFT COLUMN — 50% on desktop, only scrollable pane ─── */}
      <div className="w-full lg:w-1/2 lg:flex-shrink-0 lg:h-screen lg:overflow-y-auto flex flex-col">
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-(--color-accent-yellow) mx-auto"></div>
                <p className="mt-4 text-(--text-secondary)">Loading...</p>
              </div>
            </div>
          }
        >
          <TooltipProvider>
            <Onboarding />
          </TooltipProvider>
        </Suspense>
      </div>

      {/* ─── RIGHT COLUMN — 50% on desktop, fixed carousel ───
          Hidden on mobile since the carousel is a desktop-only visual. */}
      <div className="hidden lg:block lg:w-1/2 lg:flex-shrink-0 lg:h-screen lg:overflow-hidden">
        <Carousel />
      </div>
    </div>
  );
}