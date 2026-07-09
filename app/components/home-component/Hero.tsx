import { ArrowRight, CheckCircle2, Globe2, Instagram } from "lucide-react";
import { Button } from "../ui/button";
import { PhoneMock } from "./PhoneMock"; 
import { FloatingCard } from "./FloatingCard"; 

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-yellow)]/5 via-transparent to-[var(--color-lemon-green)]/5 pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          <div className="lg:col-span-7 animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] border border-[var(--border-color)]">
              <Globe2 className="h-3.5 w-3.5 text-[var(--color-lemon-green)]" />
              Automatic financial records · for businesses worldwide
            </span>
            <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold tracking-tight text-[var(--text-primary)] leading-[1.1]">
              Your Financial Records,{" "}
              <span className="relative inline-block">
                Done For You.
                <span className="absolute -bottom-2 left-0 right-0 h-2 bg-[var(--color-accent-yellow)]/60 -z-10 rounded-full" />
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed">
              No matter the size of your business, Zidwell gives you easy, automatic, and clearly organized financial records.
            </p>
            <p className="mt-4 max-w-xl text-sm text-[var(--text-primary)]">
              So you're always ready for:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {["Taxes", "Loans", "Investors", "Business decisions"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)] px-3 py-1 text-xs font-medium text-[var(--text-primary)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-lemon-green)]" />
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="zidwell-primary" asChild>
                <a href="/auth/signup" className="flex items-center gap-2">
                  Start Free <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="zidwell-outline" asChild>
                <a href="https://instagram.com/zidwell" target="_blank" rel="noreferrer" className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" /> Follow on Instagram
                </a>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[var(--color-lemon-green)]" /> Manual, upload or auto-sync</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[var(--color-lemon-green)]" /> Tax-ready reports</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[var(--color-lemon-green)]" /> Invoices & receipts included</span>
            </div>
          </div>

          <div className="lg:col-span-5 relative mt-10 lg:mt-0">
            <div className="relative h-[480px] sm:h-[520px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <PhoneMock />
              </div>
              <FloatingCard
                className="absolute top-2 -left-2 sm:-left-6 animate-float"
                title="Money in · recorded"
                amount="$4,500"
                tone="leaf"
              />
              <FloatingCard
                className="absolute bottom-10 -right-2 sm:-right-6 animate-float-slow"
                title="Money out · categorized"
                amount="- ₦ 12,400"
                tone="gold"
              />
              <FloatingCard
                className="absolute top-1/2 -right-4 sm:right-2 hidden sm:flex animate-float"
                title="Financial health"
                amount="82 · Healthy"
                tone="ink"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}