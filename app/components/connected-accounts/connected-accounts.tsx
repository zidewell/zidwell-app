import { ShieldCheck, Plus, CheckCircle2 } from "lucide-react";

const banks = [
  { name: "GTBank", short: "GT", color: "#e85d3a" },
  { name: "Zenith", short: "Z", color: "#cc0000" },
  { name: "Opay", short: "O", color: "#00b64f" },
  { name: "PalmPay", short: "P", color: "#7a3cf2" },
  { name: "Access", short: "A", color: "#f47b20" },
  { name: "UBA", short: "U", color: "#d4001a" },
];

export function ConnectedAccounts() {
  return (
    <section className="py-24 sm:py-32 bg-surface">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-leaf">Zidwell Sync · Nigeria</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight">
              One dashboard. All your accounts.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Nigerian businesses can connect multiple bank accounts and see the complete picture of their finances in one place — no more jumping between banking apps to check a balance or download a statement.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Outside Nigeria? Upload PDF or Excel statements with <span className="font-semibold text-foreground">Zidwell Books</span> — same dashboard, same clarity.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-background border border-border px-4 py-2 text-xs text-muted-foreground shadow-soft">
            <ShieldCheck className="h-4 w-4 text-leaf" />
            Secured by Nigeria's Open Banking System
          </div>
        </div>


        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banks.map((b) => (
            <div
              key={b.name}
              className="squircle-sm bg-background border border-border shadow-soft p-5 flex items-center gap-4"
            >
              <span
                className="h-12 w-12 rounded-2xl flex items-center justify-center font-display font-semibold text-white text-lg"
                style={{ background: b.color }}
              >
                {b.short}
              </span>
              <div className="flex-1">
                <p className="font-display font-semibold">{b.name}</p>
                <p className="text-[11px] text-muted-foreground">•••• 4821 · Auto-sync</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-leaf">
                <CheckCircle2 className="h-3.5 w-3.5" /> Live
              </span>
            </div>
          ))}

          <div className="squircle-sm bg-background border border-dashed border-border p-5 flex items-center gap-4 hover:bg-surface transition cursor-pointer">
            <span className="h-12 w-12 rounded-2xl flex items-center justify-center bg-surface border border-border">
              <Plus className="h-5 w-5 text-muted-foreground" />
            </span>
            <div>
              <p className="font-display font-semibold">Connect a bank</p>
              <p className="text-[11px] text-muted-foreground">Sync · up to 5 · Sync Unlimited · ∞</p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
