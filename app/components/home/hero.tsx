import { ArrowRight, CheckCircle2, Globe2, Instagram } from "lucide-react";
import { PhoneMock } from "../phone-mock/phone-mock";
import FloatingCard from "./floatcard";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden grain-bg">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 pt-16 sm:pt-24 pb-20">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-7 animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs font-medium border border-border">
              <Globe2 className="h-3.5 w-3.5 text-leaf" />
              Automatic financial records · for businesses worldwide
            </span>
            <h1 className="mt-6 font-display text-[40px] leading-[1.04] sm:text-6xl lg:text-7xl font-semibold tracking-tight">
              Your Financial Records,{" "}
              <span className="relative inline-block">
                Done For You.
                <span className="absolute -bottom-1 left-0 right-0 h-2 bg-gold/60 -z-10 rounded-full" />
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base sm:text-lg text-muted-foreground">
              No matter the size of your business, Zidwell gives you easy, automatic, and clearly organized financial records.
            </p>
            <p className="mt-4 max-w-xl text-sm text-foreground">
              So you're always ready for:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {["Taxes", "Loans", "Investors", "Business decisions"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-background border border-border px-3 py-1 text-xs font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-leaf" />
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth/signup" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-ink text-background text-sm font-semibold hover:opacity-90 transition">
                Start Free <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="https://instagram.com/zidwellfinance" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-surface text-sm font-semibold border border-border hover:bg-surface-2 transition">
                <Instagram className="h-4 w-4" /> Follow on Instagram
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-leaf" /> Manual, upload or auto-sync</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-leaf" /> Tax-ready reports</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-leaf" /> Invoices & receipts included</span>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative h-[520px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <PhoneMock />
              </div>

              <FloatingCard
                className="absolute top-2 -left-2 sm:-left-6 animate-float"
                title="Money in · recorded"
                amount="+ $4,500"
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
