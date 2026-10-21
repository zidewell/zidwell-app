// app/components/home-component/ApprovalNote.tsx
import { Shield, Layers, Users, Eye } from "lucide-react";

export function ApprovalNote() {
  return (
    <section id="console" className="py-28 bg-surface">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-ink text-background px-3 py-1.5 text-xs font-medium">
              <Shield className="h-3.5 w-3.5 text-primary-custom" /> Zidwell Console
            </span>
            <h2 className="mt-5 font-narrow-display text-4xl sm:text-5xl font-semibold tracking-tight">
              When you hire your first person, this is already set up.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Roles, approvals, and a full audit log — so your ops lead can pay a
              supplier without you having to be on WhatsApp at midnight.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {[
                { icon: Layers, l: "Sub-accounts" },
                { icon: Users, l: "Roles" },
                { icon: Eye, l: "Audit log" },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <span
                    key={c.l}
                    className="inline-flex items-center gap-1.5 rounded-full bg-background border border-border px-3 py-1.5 text-xs font-medium text-foreground"
                  >
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {c.l}
                  </span>
                );
              })}
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              Included on Enterprise.{" "}
              <a
                href="#pricing"
                className="text-primary-custom font-medium hover:underline cursor-pointer"
              >
                See pricing →
              </a>
            </p>
          </div>

          <div className="lg:col-span-6">
            <div className="squircle-lg bg-background border border-border shadow-float p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Approval requested
                </p>
                <span className="text-[10px] text-primary-custom font-medium">
                  Action needed
                </span>
              </div>
              <div className="h-px w-full bg-border mb-4" />
              <div className="flex items-start gap-3">
                <img
                  src="https://images.pexels.com/photos/5669602/pexels-photo-5669602.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop&crop=face"
                  alt="Adaeze O."
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">Adaeze O.</span> wants to send{" "}
                    <span className="font-semibold tabular">₦420,000</span> to
                  </p>
                  <p className="mt-1 text-sm text-foreground font-medium">
                    &ldquo;Lagos Print Co.&rdquo;
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Invoice #INV-2041 · Marketing
                  </p>
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <button className="flex-1 py-2.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-surface transition-colors cursor-pointer">
                  Reject
                </button>
                <button className="flex-1 py-2.5 rounded-full bg-primary-custom text-ink text-sm font-medium hover:opacity-90 transition cursor-pointer">
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}