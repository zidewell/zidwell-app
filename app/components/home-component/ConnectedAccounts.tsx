import { Plus, ShieldCheck, CheckCircle2 } from "lucide-react";
import { banks } from "@/lib/banks"; 

export function ConnectedAccounts() {
  return (
    <section id="connected" className="py-24 sm:py-32 bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-[var(--color-lemon-green)]">Bank-connected · Core feature</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[var(--text-primary)]">All your bank accounts. One clean view.</h2>
            <p className="mt-4 text-[var(--text-secondary)]">Link every bank you use — personal or business — and every transaction flows into your bookkeeping automatically. This is the heart of Zidwell.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)] px-4 py-2 text-xs text-[var(--text-secondary)] shadow-soft">
            <ShieldCheck className="h-4 w-4 text-[var(--color-lemon-green)]" />
            Secured by Nigeria's Open Banking System
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banks.map((b) => (
            <div
              key={b.name}
              className="squircle-sm bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft p-5 flex items-center gap-4"
            >
              <span
                className="h-12 w-12 rounded-2xl flex items-center justify-center font-display font-semibold text-white text-lg"
                style={{ background: b.color }}
              >
                {b.short}
              </span>
              <div className="flex-1">
                <p className="font-display font-semibold text-[var(--text-primary)]">{b.name}</p>
                <p className="text-[11px] text-[var(--text-secondary)]">•••• 4821 · Auto-sync</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-lemon-green)]"><CheckCircle2 className="h-3.5 w-3.5" /> Live</span>
            </div>
          ))}
          <div className="squircle-sm bg-[var(--bg-primary)] border border-dashed border-[var(--border-color)] p-5 flex items-center gap-4 hover:bg-[var(--bg-secondary)] transition cursor-pointer">
            <span className="h-12 w-12 rounded-2xl flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border-color)]"><Plus className="h-5 w-5 text-[var(--text-secondary)]" /></span>
            <div>
              <p className="font-display font-semibold text-[var(--text-primary)]">Connect a bank</p>
              <p className="text-[11px] text-[var(--text-secondary)]">Lite · 1 · Business · 3 · Elite · unlimited</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}