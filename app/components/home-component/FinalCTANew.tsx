// app/components/home-component/FinalCTANew.tsx
import { ArrowRight, PlayCircle, Calendar } from "lucide-react";

export function FinalCTA() {
  return (
    <section id="cta" className="py-28 sm:py-40 bg-surface">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 text-center">
        <p className="text-sm font-medium text-leaf">Final Step</p>
        <h2 className="mt-4 font-display text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight">
          Your Business Needs{" "}
          <span className="relative inline-block">
            Structure
            <span className="absolute -bottom-1 left-0 right-0 h-3 bg-gold/60 -z-10 rounded-full" />
          </span>{" "}
          to Grow.
        </h2>
        <p className="mt-6 text-muted-foreground max-w-2xl mx-auto">
          Stop running everything on WhatsApp. Get the tools you need to manage
          your business properly and start building a business that doesn&apos;t
          depend on you remembering everything.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <a
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-ink text-background text-sm font-semibold hover:opacity-90 transition"
          >
            Start Your Free Trial <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="https://tally.so/r/Xx7Jed"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-background text-sm font-semibold border border-border hover:bg-surface-2 transition"
          >
            <PlayCircle className="h-4 w-4" /> Watch the Tutorial
          </a>
          <a
            href="https://tally.so/r/Xx7Jed"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-background text-sm font-semibold border border-border hover:bg-surface-2 transition"
          >
            <Calendar className="h-4 w-4" /> Book a Callback
          </a>
        </div>
      </div>
    </section>
  );
}