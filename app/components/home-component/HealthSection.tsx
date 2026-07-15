import { CheckCircle2 } from "lucide-react";
import { HealthScore } from "./HealthScore"; 

export function HealthSection() {
  return (
    <section className="py-24 sm:py-32 bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-lemon-green)]/10 text-[var(--color-lemon-green)] px-3 py-1.5 text-xs font-medium">Why Zidwell</span>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--text-primary)]">Business isn't just about making money. It's about understanding it.</h2>
            <p className="mt-4 text-[var(--text-secondary)]">A live Financial Health Score paired with intelligent, plain-English insights — so you can make better decisions, faster.</p>
            <ul className="mt-6 space-y-2 text-sm text-[var(--text-primary)]">
              {["Know exactly where your money is", "Always be ready for taxes", "Always be ready for investors", "Always understand your cash flow", "Replace scattered tools with one system"].map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-[var(--color-lemon-green)] shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-7"><HealthScore /></div>
        </div>
      </div>
    </section>
  );
}