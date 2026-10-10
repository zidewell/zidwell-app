// app/components/home-component/Hero.tsx
import { ArrowRight, CheckCircle2, Instagram, PlayCircle } from "lucide-react";
import { FloatingCard } from "./FloatingCard";
import { PhoneMock } from "./PhoneMock";

const styles = `
  .hero-gradient {
    background-image: 
      radial-gradient(at 20% 10%, oklch(0.84 0.16 88 / 0.14), transparent 50%),
      radial-gradient(at 80% 0%, oklch(0.66 0.18 148 / 0.10), transparent 50%);
  }
`;

export function Hero() {
  return (
    <>
      <style>{styles}</style>
      <section className="relative overflow-hidden hero-gradient bg-background">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 pt-16 sm:pt-24 pb-20">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-7 animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs font-medium border border-border text-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-leaf" />
                The Business Owner&apos;s Toolkit
              </span>
              <h1 className="mt-6 font-display text-[40px] leading-[1.04] sm:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground">
                Tools That Help You Build &amp; Run Your{" "}
                <span className="relative inline-block">
                  Business Empire
                  <span className="absolute -bottom-1 left-0 right-0 h-2 bg-gold/60 rounded-full" />
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base sm:text-lg text-muted-foreground">
                Running your business all on WhatsApp keeps you unstructured and
                informal. Zidwell gives you a bundle of business tools to help
                you manage your money, customers, documents, sales and
                day-to-day business operations — all in one place.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-ink text-background text-sm font-semibold hover:opacity-90 transition"
                >
                  Sign Up <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="https://tally.so/r/Xx7Jed"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-surface text-sm font-semibold border border-border hover:bg-surface-2 transition text-foreground"
                >
                  <PlayCircle className="h-4 w-4" /> Watch Video
                </a>
                <a
                  href="https://instagram.com/zidwell"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold border border-border bg-surface hover:bg-surface-2 transition text-foreground"
                >
                  <Instagram className="h-4 w-4" /> Follow on Instagram
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-leaf" /> Free business
                  bank account
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-leaf" /> Invoices &amp;
                  receipts included
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-leaf" /> 7-day free trial
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative h-[520px]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <PhoneMock />
                </div>

                <FloatingCard
                  className="absolute top-2 -left-2 sm:-left-6 animate-float"
                  title="Business account · payment in"
                  amount="+ ₦ 850,000"
                  tone="leaf"
                />
                <FloatingCard
                  className="absolute bottom-10 -right-2 sm:-right-6 animate-float-slow"
                  title="Invoice · paid & recorded"
                  amount="INV-2041"
                  tone="gold"
                />
                <FloatingCard
                  className="absolute top-1/2 -right-4 sm:right-2 hidden sm:flex animate-float"
                  title="Storefront · new order"
                  amount="2 items"
                  tone="ink"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}