// app/components/home-component/Hero.tsx
import { ArrowRight, CheckCircle2, Store } from "lucide-react";
import { ToolkitOrbit } from "./ToolkitOrbit";

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden"
      style={{ backgroundColor: "var(--ink)", color: "var(--background)" }}
    >
      <div className="absolute inset-0 grain-bg opacity-60" />

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-12 lg:gap-12 lg:py-20">
        {/* Copy — 5 cols */}
        <div className="lg:col-span-5 animate-fade-up">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
            style={{
              borderWidth: 1,
              borderColor:
                "color-mix(in oklab, var(--background) 15%, transparent)",
              backgroundColor:
                "color-mix(in oklab, var(--background) 5%, transparent)",
              color: "color-mix(in oklab, var(--background) 80%, transparent)",
            }}
          >
            <Store className="h-3.5 w-3.5" style={{ color: "var(--gold)" }} />
            Built for ambitious SMEs
          </span>

          <h1 className="mt-6 font-display text-[42px] font-semibold leading-[1.04] sm:text-6xl lg:text-[64px]">
            Get a Business Bank Account + An{" "}
            <span style={{ color: "var(--gold)" }}>Online Store</span> in 60
            Seconds
          </h1>

          <p
            className="mt-6 max-w-xl text-base leading-relaxed sm:text-lg"
            style={{
              color: "color-mix(in oklab, var(--background) 70%, transparent)",
            }}
          >
            Our goal at Zidwell is to give you the tools to run your business
            hitch-free. Business bank account, online store, bookkeeping, sales
            records, tax calculator and more — all in one place.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#cta"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition hover:opacity-90 cursor-pointer"
              style={{
                backgroundColor: "var(--gold)",
                color: "var(--ink)",
              }}
            >
              Start Free <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#tools"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition cursor-pointer"
              style={{
                borderWidth: 1,
                borderColor:
                  "color-mix(in oklab, var(--background) 20%, transparent)",
                backgroundColor:
                  "color-mix(in oklab, var(--background) 5%, transparent)",
                color: "var(--background)",
              }}
            >
              Explore the Toolkit
            </a>
          </div>

          <div
            className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs"
            style={{
              color: "color-mix(in oklab, var(--background) 60%, transparent)",
            }}
          >
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2
                className="h-4 w-4"
                style={{ color: "var(--leaf)" }}
              />
              Built for everyday selling
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2
                className="h-4 w-4"
                style={{ color: "var(--leaf)" }}
              />
              Clean financial records
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2
                className="h-4 w-4"
                style={{ color: "var(--leaf)" }}
              />
              One simple dashboard
            </span>
          </div>
        </div>

        {/* Orbit — 7 cols. Your orbit is width: min(78vw, 34rem), so it needs
            the wide column and can bleed slightly right on desktop. */}
        <div className="lg:col-span-7 flex justify-center lg:justify-end lg:-mr-4 xl:-mr-8">
          <ToolkitOrbit />
        </div>
      </div>
    </section>
  );
}