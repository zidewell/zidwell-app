// app/components/home-component/GradientCTA.tsx
"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";

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

          <div className="relative grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
                Start free · No card required
              </p>
              <h2 className="mt-3 font-narrow-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
                Join over{" "}
                <span style={{ color: "var(--gold)" }}>5,000+</span> businesses
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

            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-[260px] sm:w-[300px] rotate-[4deg]">
                <div className="rounded-[36px] bg-black p-2 shadow-float border border-white/10">
                  <div className="rounded-[28px] overflow-hidden">
                    <Image
                      src="https://images.pexels.com/photos/887987/pexels-photo-887987.jpeg?auto=compress&cs=tinysrgb&w=600"
                      alt="African business owner using the Zidwell dashboard on mobile"
                      width={600}
                      height={900}
                      className="h-[520px] w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}