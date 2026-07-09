import { Shield, Users, UserCheck, ClipboardCheck, History } from "lucide-react";

export function TeamControl() {
  const items = [
    { icon: Users, t: "Multi-user access", d: "Bring your whole team onto one system." },
    { icon: UserCheck, t: "Role-based permissions", d: "Owner, staff, finance, viewer — everyone in the right place." },
    { icon: ClipboardCheck, t: "Request & approval", d: "Approvals for payments, invoices, receipts and transfers." },
    { icon: History, t: "Audit logs", d: "See who did what, and when — full accountability." },
  ];
  
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] text-white dark:bg-white dark:text-[var(--color-ink)] px-3 py-1.5 text-xs font-medium">
              <Shield className="h-3.5 w-3.5 text-[var(--color-accent-yellow)]" /> Team & business control
            </span>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--text-primary)]">For corporations, agencies and structured teams.</h2>
            <p className="mt-4 text-[var(--text-secondary)]">Give the right people the right access. Approve the right actions. Keep a clean record of everything that touches your money.</p>
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            {items.map((it) => {
              const Icon = it.icon;
              return (
                <div key={it.t} className="squircle bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft p-6">
                  <span className="h-10 w-10 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center">
                    <Icon className="h-5 w-5 text-[var(--text-primary)]" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-[var(--text-primary)]">{it.t}</h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{it.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}