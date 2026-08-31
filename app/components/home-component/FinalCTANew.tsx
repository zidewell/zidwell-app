import { ArrowRight, Sparkles } from "lucide-react";

export function FinalCTA() {
  return (
    <section id="cta" className="py-28 sm:py-40 bg-surface">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 text-center">
        <p className="text-sm font-medium text-leaf">One platform</p>
        <h2 className="mt-4 font-display text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight">
          Stop running your business{" "}
          <span className="relative inline-block">
            in pieces.
            <span className="absolute -bottom-1 left-0 right-0 h-3 bg-gold/60 -z-10 rounded-full" />
          </span>
        </h2>
        <p className="mt-6 text-muted-foreground">
          Get banking, bookkeeping and business operations in one platform.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <a href="#" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-ink text-background text-sm font-semibold hover:opacity-90 transition">
            Start Free <ArrowRight className="h-4 w-4" />
          </a>
          <a href="#" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-background text-sm font-semibold border border-border hover:bg-surface-2 transition">
            Book a Demo
          </a>
        </div>
        <p className="mt-6 text-xs text-muted-foreground inline-flex items-center gap-1.5 justify-center">
          <Sparkles className="h-3.5 w-3.5 text-gold" /> Activate your business account for ₦1,000
        </p>
      </div>
    </section>
  );
}
