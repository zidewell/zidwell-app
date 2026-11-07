// app/components/home-component/GradientCTA.tsx
"use client";

import { ArrowRight } from "lucide-react";
import { PhoneMock } from "./PhoneMock";

export function GradientCTA() {
  return (
    <section id="cta" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Always-dark, literal bg + white text — never flips with theme */}
        <div className="relative squircle-lg overflow-hidden bg-[#0f0f0f] text-white px-6 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
          {/* Gold → Leaf gradient mesh, using globals.css tokens */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(120% 120% at 0% 0%, color-mix(in oklab, var(--gold) 35%, transparent) 0%, transparent 55%), radial-gradient(120% 120% at 100% 100%, color-mix(in oklab, var(--leaf) 28%, transparent) 0%, transparent 55%)",
            }}
          />
          <div className="absolute inset-0 grain-bg opacity-40 pointer-events-none" />

          <div className="relative grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* PhoneMock — left column */}
            <div className="order-2 lg:order-1 lg:col-span-5 flex justify-center lg:justify-start">
              <div className="relative rotate-[-4deg]">
                <PhoneMock />
              </div>
            </div>

            {/* Copy — right column */}
            <div className="order-1 lg:order-2 lg:col-span-7 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
                Start free · No card required
              </p>
              <h2 className="mt-3 font-narrow-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
                Join over{" "}
                <span style={{ color: "var(--gold)" }}>500+</span> businesses
                using Zidwell to simplify payments.
              </h2>
              <p className="mt-4 text-base text-white/70 max-w-lg leading-relaxed">
                Bank account, bookkeeping, invoices, storefront — one bundle,
                one simple dashboard. Set up in minutes.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/auth/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition hover:opacity-90 cursor-pointer"
                  style={{ backgroundColor: "var(--gold)", color: "var(--ink)" }}
                >
                  Start free <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold bg-white/10 text-white border border-white/25 hover:bg-white/20 transition cursor-pointer"
                >
                  See pricing
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}