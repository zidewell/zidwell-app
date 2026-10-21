// app/components/home-component/ToolsBento.tsx
import {
  Landmark,
  FileText,
  Receipt,
  FilePen,
  FolderLock,
  Store,
  Calculator,
  Wallet,
  HeartPulse,
  ClipboardList,
  MonitorCog,
  ArrowRight,
} from "lucide-react";

export function ToolsBento() {
  return (
    <section id="tools" className="py-28 bg-surface">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-leaf mb-4">
            The toolkit
          </p>
          <h2 className="font-narrow-display text-4xl sm:text-5xl font-semibold tracking-tight">
            Everything your business needs. Nothing it doesn&apos;t.
          </h2>
          <p className="mt-4 text-muted-foreground">
            A bank account, automatic bookkeeping, and every document tool a
            founder actually uses — in one bundle, not eleven subscriptions.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-8 gap-4">
          <div className="md:col-span-5 squircle-lg bg-ink text-background p-6 sm:p-8 flex flex-col justify-between min-h-[280px]">
            <div>
              <span className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center">
                <Landmark className="h-5 w-5 text-primary-custom" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold">
                Business Bank Account
              </h3>
              <p className="mt-2 text-sm text-background/70 max-w-md">
                Open a real account with signatories. No more &quot;send to my
                personal.&quot;
              </p>
            </div>
            <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-8 w-8 rounded-xl bg-[#e85d3a] flex items-center justify-center text-white text-xs font-bold">
                    GT
                  </span>
                  <div>
                    <p className="text-xs font-medium text-white">GTBank</p>
                    <p className="text-[10px] text-white/50">•••• 4821 · Business</p>
                  </div>
                </div>
                <span className="text-[10px] text-leaf font-medium">Live</span>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-white/50">Balance</p>
                  <p className="font-display text-xl font-semibold tabular">
                    ₦1,284,500.00
                  </p>
                </div>
                <span className="text-[10px] text-white/50">Signatories: 2</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 squircle-lg bg-background border border-border p-6 sm:p-8 flex flex-col justify-between min-h-[280px]">
            <div>
              <span className="h-10 w-10 rounded-2xl bg-surface border border-border flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-ink" />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold">
                Auto-Bookkeeping
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Every transaction lands in the right category. You just approve
                the ones Zidwell isn&apos;t sure about.
              </p>
            </div>
            <div className="mt-6 flex items-end gap-1.5 h-16">
              {[40, 55, 45, 70, 65, 85, 78, 92].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm bg-leaf"
                  style={{ height: `${h}%`, opacity: 0.55 + i * 0.05 }}
                />
              ))}
            </div>
          </div>

          {[
            { icon: FileText, t: "Invoice", d: "Send a branded PDF. It self-files when paid." },
            { icon: Receipt, t: "Receipt", d: "Auto-issues on payment. Attached to the transaction." },
            { icon: FilePen, t: "Contracts", d: "E-signature + archive, linked to the client's account." },
            { icon: FolderLock, t: "Vault", d: "CAC, TIN, statements. One folder, not eleven." },
          ].map((it) => {
            const Icon = it.icon;
            return (
              <div
                key={it.t}
                className="md:col-span-2 squircle bg-background border border-border p-5 flex flex-col justify-between min-h-[160px]"
              >
                <span className="h-9 w-9 rounded-xl bg-surface border border-border flex items-center justify-center">
                  <Icon className="h-4 w-4 text-ink" />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold">{it.t}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {it.d}
                  </p>
                </div>
              </div>
            );
          })}

          <div className="md:col-span-8 squircle bg-background border border-border p-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="text-muted-foreground font-medium">Also included:</span>
            {[
              { icon: Store, l: "Storefront" },
              { icon: Calculator, l: "Tax calculator" },
              { icon: Wallet, l: "Payroll", addon: true },
              { icon: HeartPulse, l: "HMO", addon: true },
              { icon: ClipboardList, l: "Business plan" },
              { icon: MonitorCog, l: "Console" },
            ].map((it) => {
              const Icon = it.icon;
              return (
                <a
                  key={it.l}
                  href="#"
                  className="inline-flex items-center gap-1.5 text-foreground hover:text-primary-custom transition-colors cursor-pointer"
                >
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {it.l}
                  {it.addon && (
                    <span className="text-[9px] text-muted-foreground">(add-on)</span>
                  )}
                </a>
              );
            })}
            <a
              href="#pricing"
              className="inline-flex items-center gap-1 text-primary-custom font-medium ml-auto cursor-pointer"
            >
              See plans <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <div className="mt-6 max-w-md md:ml-6 text-xs text-muted-foreground italic">
          <p>
            &ldquo;We used to Venmo from a personal account. Now my whole team
            sees where every naira comes from.&rdquo;
          </p>
          <p className="mt-1 not-italic font-medium text-foreground">
            — Tunde A., law firm, Abuja
          </p>
        </div>
      </div>
    </section>
  );
}