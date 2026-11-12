// app/components/home-component/Hero.tsx
import { ArrowRight, Store, Instagram, Play } from "lucide-react";
import Image from "next/image";
import { ToolkitOrbit } from "./ToolkitOrbit";

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-background text-ink"
    >
      <div className="absolute inset-0 grain-bg opacity-60" />

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-12 lg:gap-12 lg:py-20">
        {/* Copy — 5 cols */}
        <div className="lg:col-span-5 animate-fade-up">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border border-border bg-surface text-foreground/80"
          >
            <Store className="h-3.5 w-3.5 text-gold" />
            Built for ambitious SMEs
          </span>

          <h1 className="font-narrow-display mt-6 text-[42px] font-semibold leading-[1.04] sm:text-6xl lg:text-[64px]">
            Run Your business From
            <span className="text-gold"> One App</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            If you care about systems and structure then Zidwell is for you.
            It&apos;s the one place businesses get to manage their financial
            operations with ease.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 lg:flex-nowrap">
            <a
              href="#cta"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-3.5 text-sm font-semibold transition hover:opacity-90 cursor-pointer lg:px-6 bg-gold text-ink"
            >
              Sign Up <ArrowRight className="h-4 w-4" />
            </a>

            <a
              href="https://youtu.be/DTX24f8IGpQ?si=FgVfglySFshQHE8N"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-3.5 text-sm font-semibold transition cursor-pointer lg:px-6 border border-border bg-surface text-foreground hover:bg-surface-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Play className="h-4 w-4" />
              Watch Tutorial
            </a>

            <a
              href="https://www.instagram.com/zidwellfinance"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-3.5 text-sm font-semibold transition cursor-pointer lg:px-6 border border-border bg-surface text-foreground hover:bg-surface-2"
            >
              <Instagram className="h-4 w-4" />
              Follow on Instagram
            </a>
          </div>

          {/* Real African faces trust strip */}
          <div className="mt-10 flex items-center gap-3">
            <div className="flex -space-x-2">
              {[
                "https://images.unsplash.com/photo-1605980776566-0486c3ac7617?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
                "https://images.unsplash.com/photo-1595211877493-41a4e5f236b3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
                "https://images.unsplash.com/photo-1783012039560-5690190a9b9b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
                "https://images.unsplash.com/photo-1715005881129-266ccdd75e43?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
              ].map((src, i) => (
                <Image
                  key={i}
                  src={src}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full border-2 object-cover border-background"
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Trusted by{" "}
              <span className="font-semibold text-foreground">500+</span>{" "}
              African businesses
            </p>
          </div>
        </div>

        {/* Orbit — 7 cols — inherits theme tokens from .dark / :root */}
        <div className="lg:col-span-7 flex justify-center lg:justify-end lg:-mr-4 xl:-mr-8">
          <ToolkitOrbit />
        </div>
      </div>
    </section>
  );
}