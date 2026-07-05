import { ClipboardCheck, Shield, UserCheck, Users } from "lucide-react";

export default function TeamControl() {
  const items = [
    { icon: Users, t: "Multi-user access", d: "Bring your whole team onto one system." },
    { icon: UserCheck, t: "Role-based permissions", d: "Owner, staff, finance, viewer — everyone in the right place." },
    { icon: ClipboardCheck, t: "Request & approval", d: "Approvals for payments, invoices, receipts and transfers." },
    { icon: Shield, t: "Audit logs", d: "See who did what, and when — full accountability." },
  ];
  return (
    <section className="py-24 sm:py-32 bg-surface">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-ink text-background px-3 py-1.5 text-xs font-medium">
              <Shield className="h-3.5 w-3.5 text-gold" /> Team & business control
            </span>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl font-semibold tracking-tight">
              For corporations, agencies and structured teams.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Give the right people the right access. Approve the right actions. Keep a clean record of everything that touches your money.
            </p>
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            {items.map((it) => {
              const Icon = it.icon;
              return (
                <div key={it.t} className="squircle bg-background border border-border shadow-soft p-6">
                  <span className="h-10 w-10 rounded-2xl bg-surface border border-border flex items-center justify-center">
                    <Icon className="h-5 w-5 text-ink" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold">{it.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{it.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}