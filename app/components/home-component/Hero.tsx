// app/components/home-component/Hero.tsx
import { ArrowRight, CheckCircle2, Store, Instagram, Play } from "lucide-react";
import Image from "next/image";
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

          <h1 className="mt-6 text-[42px] font-semibold leading-[1.04] sm:text-6xl lg:text-[64px]">
            Run Your business From
            <span style={{ color: "var(--gold)" }}> One App</span>
          </h1>

          <p
            className="mt-6 max-w-xl text-base leading-relaxed sm:text-lg"
            style={{
              color: "color-mix(in oklab, var(--background) 70%, transparent)",
            }}
          >
            If you care about systems and structure then Zidwell is for you.{" "}
            It&apos;s the one place businesses get to manage their financial
            operations with ease.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 lg:flex-nowrap">
            <a
              href="#cta"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-3.5 text-sm font-semibold transition hover:opacity-90 cursor-pointer lg:px-6"
              style={{
                backgroundColor: "var(--gold)",
                color: "var(--ink)",
              }}
            >
              Sign Up <ArrowRight className="h-4 w-4" />
            </a>

            <a
              href="https://youtu.be/DTX24f8IGpQ?si=FgVfglySFshQHE8N"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-3.5 text-sm font-semibold transition cursor-pointer lg:px-6"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                borderWidth: 1,
                borderColor:
                  "color-mix(in oklab, var(--background) 20%, transparent)",
                backgroundColor:
                  "color-mix(in oklab, var(--background) 5%, transparent)",
                color: "var(--background)",
              }}
            >
              <Play className="h-4 w-4" />
              Watch Tutorial
            </a>

            <a
              href="https://www.instagram.com/zidwellfinance"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-3.5 text-sm font-semibold transition cursor-pointer lg:px-6"
              style={{
                borderWidth: 1,
                borderColor:
                  "color-mix(in oklab, var(--background) 20%, transparent)",
                backgroundColor:
                  "color-mix(in oklab, var(--background) 5%, transparent)",
                color: "var(--background)",
              }}
            >
              <Instagram className="h-4 w-4" />
              Follow on Instagram
            </a>
          </div>

   

        
        </div>

        {/* Orbit */}
        <div className="lg:col-span-7 flex justify-center lg:justify-end lg:-mr-4 xl:-mr-8">
          <ToolkitOrbit />
        </div>
      </div>
    </section>
  );
}