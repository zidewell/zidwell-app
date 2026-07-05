import { CreditCard, FilePen, FileText, FolderLock, Link2, Receipt } from "lucide-react";

export default function BonusTools() {
  const tools = [
    { icon: FileText, t: "Invoices", d: "Send branded invoices — every one flows into your records." },
    { icon: Receipt, t: "Receipts", d: "Issue receipts automatically when payments land." },
    { icon: CreditCard, t: "Payment Pages & Links", d: "Get paid by link and settle straight into bookkeeping." },
    { icon: FilePen, t: "Contracts", d: "Send, sign and store contracts alongside the money." },
    { icon: FolderLock, t: "Document Vault", d: "Safely store financial documents in one place." },
    { icon: Link2, t: "Everything connected", d: "Every action automatically updates your financial records." },
  ];
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-leaf">Business tools built into your records</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight">
            Run your business from one system.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Financial efficiency is the foundation of every business. Every tool inside Zidwell updates your books as you use it — no double entry, no lost paperwork.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.t} className="squircle bg-surface border border-border shadow-soft p-6">
                <span className="h-10 w-10 rounded-2xl bg-background border border-border flex items-center justify-center">
                  <Icon className="h-5 w-5 text-ink" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{it.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{it.d}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
