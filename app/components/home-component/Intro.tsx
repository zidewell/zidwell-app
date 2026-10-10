// app/components/home-component/Intro.tsx
import { ArrowRight } from "lucide-react";

export function Intro() {
  return (
    <section className="py-20 sm:py-24 bg-ink text-background">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 text-center">
        <p className="font-display text-2xl sm:text-4xl leading-snug tracking-tight">
          Without <span className="text-gold">Structure</span>, Your Business
          Can&apos;t Grow.
        </p>
        <p className="mt-6 text-background/70 max-w-3xl mx-auto">
          When everything revolves around you, the CEO, your business slows
          down and becomes hard to run as you grow. Zidwell gives you the
          simple-to-use tools to start putting structure in your business, so
          you can easily organize things, delegate tasks, and have clear and
          clean financial records.
        </p>
        <a
          href="/auth/signup"
          className="mt-8 inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-gold text-ink text-sm font-semibold hover:opacity-90 transition"
        >
          Start for Free <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}