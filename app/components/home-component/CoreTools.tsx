import {
  Landmark,
  Layers,
  Users,
  BookOpen,
  FileText,
  Receipt,
  FilePen,
  FolderLock,
  Calculator,
  Wallet,
  HeartPulse,
  MonitorCog,
} from "lucide-react";

const tools = [
  { icon: Landmark, t: "Business Bank Account", d: "Send, receive and manage business money." },
  { icon: Layers, t: "Sub Accounts", d: "Separate accounts for people and outlets." },
  { icon: Users, t: "Multi-user + Signatories", d: "Add your team and assign signatories." },
  { icon: BookOpen, t: "Bookkeeping", d: "Clean, organized financial records." },
  { icon: FileText, t: "Invoices", d: "Send branded invoices and get paid." },
  { icon: Receipt, t: "Receipts", d: "Issue receipts the moment payments land." },
  { icon: FilePen, t: "Contracts", d: "Create, send and store business contracts." },
  { icon: FolderLock, t: "Document Vault", d: "Keep every financial document safe." },
  { icon: Calculator, t: "Tax Tools", d: "Stay organized and ready for filing." },
  { icon: Wallet, t: "Payroll", d: "Pay your team on schedule.", addon: true },
  { icon: HeartPulse, t: "HMO", d: "Health cover for your team.", addon: true },
  { icon: MonitorCog, t: "Console", d: "For teams & multi-outlet businesses." },
];

export function CoreTools() {
  return (
    <section id="tools" className="py-24 sm:py-32 bg-surface">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-leaf">Core tools</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight">
            Everything your business runs on.
          </h2>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.t} className="squircle bg-background border border-border shadow-soft p-6">
                <div className="flex items-start justify-between">
                  <span className="h-10 w-10 rounded-2xl bg-surface border border-border flex items-center justify-center">
                    <Icon className="h-5 w-5 text-ink" />
                  </span>
                  {it.addon && (
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-gold/20 text-ink">
                      Add-on
                    </span>
                  )}
                </div>
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
