// app/verification/page.tsx
"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Carousel from "@/app/components/Carousel";
import IdentityVerificationFlow from "@/app/components/IdentityVerificationFlow";

function VerificationPageInner() {
  const searchParams = useSearchParams();

  const sessionId =
    searchParams.get("session_id") ||
    searchParams.get("sessionId") ||
    searchParams.get("session") ||
    searchParams.get("reference") ||
    (typeof window !== "undefined"
      ? sessionStorage.getItem("prembly_session_id")
      : null);

  const premblyResult = {
    status: searchParams.get("status"),
    code: searchParams.get("code"),
    message: searchParams.get("message"),
    sessionId,
  };

  const hasPremblyResult = !!(premblyResult.code && premblyResult.status);

  // ═══════════════════════════════════════════════════════════
  // DEBUG: dump everything Prembly sent us
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const allParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      allParams[key] = value;
    });

    console.log("\n═══ [Prembly Redirect Received] ═══");
    console.log("Full URL:", typeof window !== "undefined" ? window.location.href : "N/A");
    console.log("All query params:", JSON.stringify(allParams, null, 2));
    console.log("Session ID (resolved):", sessionId);
    console.log("Session ID from sessionStorage:", typeof window !== "undefined"
      ? sessionStorage.getItem("prembly_session_id")
      : "N/A");
    console.log("Parsed premblyResult:", JSON.stringify(premblyResult, null, 2));
    console.log("hasPremblyResult:", hasPremblyResult);
    console.log("════════════════════════════════════\n");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-(--bg-primary) lg:h-screen lg:overflow-hidden lg:flex lg:flex-row">
      <div className="w-full lg:w-1/2 lg:flex-shrink-0 lg:h-screen lg:overflow-y-auto flex flex-col">
        <main className="flex-1 mx-auto w-full max-w-2xl px-5 pt-10 pb-16 sm:pt-16">
          <IdentityVerificationFlow
            premblyResult={hasPremblyResult ? premblyResult : null}
          />
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