import { Layers, UserCheck, ClipboardCheck, Users, Eye, Shield, Building2, ArrowRight } from "lucide-react";
import consoleTeams from "/public/console-teams.jpg";
import { Dashboard } from "./Dashboard";

const items = [
  { icon: Layers, t: "Sub Accounts", d: "Multiple accounts for people and outlets." },
  { icon: UserCheck, t: "Roles & Permissions", d: "Everyone gets exactly the access they need." },
  { icon: ClipboardCheck, t: "Request & Approval Workflow", d: "Approve payments before money moves." },
  { icon: Users, t: "Multi-user Access", d: "Bring your whole team onto one system." },
  { icon: Eye, t: "Advanced Financial Visibility", d: "See every outlet in one dashboard." },
];

export function ConsoleSection() {
  return (
    <section id="console" className="py-24 sm:py-32 bg-surface">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-ink text-background px-3 py-1.5 text-xs font-medium">
              <Shield className="h-3.5 w-3.5 text-gold" /> Zidwell Console
            </span>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl font-semibold tracking-tight">
              Built for teams, outlets and multiple operators.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Designed for organizations with teams, outlets and multiple operators — with the control and visibility that keeps everything accountable.
            </p>
            <div className="mt-8 squircle-lg overflow-hidden border shadow-float">
              <img
                src={consoleTeams.src}
                alt="A team reviewing business accounts on Zidwell Console"
                width={1600}
                height={1000}
                loading="lazy"
                className="w-full h-56 sm:h-64 object-cover"
              />
            </div>
          </div>
          <div className="lg:col-span-7 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
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
              <div className="squircle bg-ink text-background p-6 flex flex-col justify-between">
                <Building2 className="h-6 w-6 text-gold" />
                <div className="mt-6">
                  <p className="font-display text-lg font-semibold">Custom pricing</p>
                  <a href="#cta" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gold">
                    Talk to sales <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
            <Dashboard />
          </div>
        </div>
      </div>
    </section>
  );
}
