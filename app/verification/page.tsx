// app/verification/page.tsx
"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Carousel from "@/app/components/Carousel";
import IdentityVerificationFlow from "@/app/components/IdentityVerificationFlow";

function VerificationPageInner() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-(--bg-primary) lg:h-screen lg:overflow-hidden lg:flex lg:flex-row">
      <div className="w-full lg:w-1/2 lg:flex-shrink-0 lg:h-screen lg:overflow-y-auto flex flex-col">
        <header className="sticky top-0 z-40 bg-(--bg-primary)/85 backdrop-blur-md border-b border-(--border-color)">
          <div className="mx-auto max-w-2xl px-5 py-3 flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="h-10 w-10 -ml-2 rounded-full flex items-center justify-center hover:bg-(--bg-secondary) transition-colors cursor-pointer"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-5 w-5 text-(--text-primary)" />
            </button>
            <span className="text-sm font-medium text-(--text-secondary)">
              Back to dashboard
            </span>
          </div>
        </header>

        <main className=" flex-1  mx-auto w-full max-w-2xl px-5 pt-10 pb-16 sm:pt-16">
          <IdentityVerificationFlow />
        </main>
      </div>

      <div className="hidden lg:block lg:w-1/2 lg:flex-shrink-0 lg:h-screen lg:overflow-hidden">
        <Carousel />
      </div>
    </div>
  );
}

export default function VerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-(--bg-primary)">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-(--color-accent-yellow)" />
        </div>
      }
    >
      <VerificationPageInner />

      
    </Suspense>
  );
}