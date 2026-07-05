import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default 
function FinalCTA() {
  return (
    <section id="cta" className="py-28 sm:py-40">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 text-center">
        <p className="text-sm font-medium text-leaf">Stop managing money in pieces</p>
        <h2 className="mt-4 font-display text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight">
          Start building complete{" "}
          <span className="relative inline-block">
            financial records.
            <span className="absolute -bottom-1 left-0 right-0 h-3 bg-gold/60 -z-10 rounded-full" />
          </span>
        </h2>
        <p className="mt-6 text-muted-foreground">Free to start. Upgrade when you're ready.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-ink text-background text-sm font-semibold hover:opacity-90 transition">
            Start Free <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#dashboard" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-surface text-sm font-semibold border border-border hover:bg-surface-2 transition">
            See Demo
          </a>
        </div>

        <div className="mt-16 squircle-lg overflow-hidden border relative h-64 sm:h-80">
          <Image
            src="/hero-entrepreneur.jpg"
            alt="Entrepreneur using Zidwell on a smartphone"
            fill
            className="object-cover"
            sizes="(min-width: 640px) 100vw, 100vw"
          />
        </div>
      </div>
    </section>
  );
}
