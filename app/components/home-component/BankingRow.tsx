// app/components/home-component/BankingRow.tsx
import { ShieldCheck } from "lucide-react";

const heroBanks = [
  { name: "GTBank", short: "GT", color: "#e85d3a", lastSync: "12s ago" },
  { name: "Zenith", short: "Z", color: "#cc0000", lastSync: "34s ago" },
  { name: "Opay", short: "O", color: "#00b64f", lastSync: "8s ago" },
];

const otherBanks = ["Access", "UBA", "First Bank", "Kuda", "PalmPay", "Moniepoint"];

export function BankingRow() {
  return (
    <section id="banking" className="py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="squircle bg-surface border border-border px-5 py-3 flex items-center gap-2.5 mb-12">
          <ShieldCheck className="h-4 w-4 text-leaf shrink-0" />
          <p className="text-xs text-muted-foreground">
            Linked through Nigeria&apos;s Open Banking system. We never see or
            store your bank login.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-leaf mb-4">
              Bank-connected
            </p>
            <h2 className="font-narrow-display text-4xl sm:text-5xl font-semibold tracking-tight">
              Every naira, in one view.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Link every bank you use — personal or business. Transactions land in
              Zidwell within 30 seconds.
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="grid sm:grid-cols-3 gap-3">
              {heroBanks.map((b) => (
                <div
                  key={b.name}
                  className="squircle bg-background border border-border shadow-soft p-5 group cursor-pointer hover:border-[var(--color-accent-yellow)]/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="h-14 w-14 rounded-2xl flex items-center justify-center font-display font-semibold text-white text-xl"
                      style={{ background: b.color }}
                    >
                      {b.short}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-leaf">
                      <span className="h-1.5 w-1.5 rounded-full bg-leaf" />
                      Live
                    </span>
                  </div>
                  <p className="font-display text-lg font-semibold text-foreground">
                    {b.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    •••• 4821 · Business
                  </p>
                  <p className="mt-3 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    Synced {b.lastSync}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-2 text-sm">
              <span className="text-foreground font-medium">Plus 20 more.</span>
              {otherBanks.map((name, i) => (
                <span key={name} className="inline-flex items-baseline gap-3">
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary-custom transition-colors cursor-pointer"
                  >
                    {name}
                  </a>
                  {i < otherBanks.length - 1 && (
                    <span className="text-muted-foreground/40">·</span>
                  )}
                </span>
              ))}
              <a
                href="#"
                className="text-primary-custom font-medium hover:underline cursor-pointer"
              >
                See all →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}