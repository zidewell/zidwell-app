import { Sparkles } from "lucide-react";
import { AIChat } from "./AIChat";

export function AISection() {
  return (
    <section id="ai" className="py-24 sm:py-32 bg-ink text-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage:
          "radial-gradient(at 20% 30%, var(--color-accent-yellow)/0.3, transparent 50%), radial-gradient(at 80% 70%, var(--color-lemon-green)/0.25, transparent 50%)",
      }} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-ink/10 border border-ink/15 px-3 py-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5 text-gold" /> Coming soon
            </span>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl font-semibold tracking-tight">Your AI finance assistant.</h2>
            <p className="mt-4 text-background/70 max-w-md">Ask your money anything. Get real answers in plain English — no spreadsheets, no formulas.</p>
            <ul className="mt-6 space-y-2 text-sm text-background/80">
              <li>· "How much did I spend on food this month?"</li>
              <li>· "Show my profit for last 90 days."</li>
              <li>· "What category takes most of my money?"</li>
            </ul>
          </div>
          <div className="lg:col-span-7"><AIChat /></div>
        </div>
      </div>
    </section>
  );
}