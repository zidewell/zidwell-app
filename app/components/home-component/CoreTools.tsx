// app/components/home-component/CoreTools.tsx
import {
  Landmark,
  FileText,
  Receipt,
  FilePen,
  FolderLock,
  Store,
  ClipboardList,
  Calculator,
  Wallet,
  HeartPulse,
  MonitorCog,
  Users,
} from "lucide-react";

const tools = [
  {
    icon: Landmark,
    t: "Business Bank Account",
    d: "Give your business a proper bank account with signatories.",
  },
  {
    icon: ClipboardList,
    t: "Business Plan Template",
    d: "Document your goals and vision so you keep coming back to it.",
  },
  {
    icon: FileText,
    t: "Invoice Tool",
    d: "Send professional invoices and get paid.",
  },
  {
    icon: Receipt,
    t: "Receipt Tool",
    d: "Issue receipts the moment payments land.",
  },
  {
    icon: FilePen,
    t: "Digital Contracts",
    d: "Put important agreements in writing — no more gentleman's agreements.",
  },
  {
    icon: FolderLock,
    t: "Document Vault",
    d: "Keep every financial document safe in one place.",
  },
  {
    icon: Store,
    t: "Online Storefront",
    d: "Sell your products and services online — local & international.",
  },
  {
    icon: Calculator,
    t: "Tax Calculator",
    d: "Understand your potential taxes from your records.",
  },
  {
    icon: Users,
    t: "Extra Users",
    d: "Bring your team onto one system with role-based access.",
  },
  {
    icon: Wallet,
    t: "Payroll",
    d: "Pay your team on schedule.",
    addon: true,
  },
  {
    icon: HeartPulse,
    t: "HMO",
    d: "Health cover for your team.",
    addon: true,
  },
  {
    icon: MonitorCog,
    t: "Console",
    d: "For teams & multi-outlet businesses.",
  },
];

export function CoreTools() {
  return (
    <section id="tools" className="py-24 sm:py-32 bg-surface">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-leaf">
            The Business Owner&apos;s Toolkit
          </p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight">
            One Toolkit. Less Business Chaos.
          </h2>
          <p className="mt-4 text-muted-foreground">
            A set of business operations tools that helps you run your business
            smoothly from anywhere — giving structure to your business and
            accurate financial management.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((it) => {
            const Icon = it.icon;
            return (
              <div
                key={it.t}
                className="squircle bg-background border border-border shadow-soft p-6"
              >
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
                <h3 className="mt-4 font-display text-lg font-semibold">
                  {it.t}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{it.d}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 squircle bg-ink text-background p-8 text-center">
          <p className="font-display text-2xl font-semibold">
            One bundle. One Annual Payment. One Week Free Trial.
          </p>
          <a
            href="/auth/signup"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-gold text-ink text-sm font-semibold hover:opacity-90 transition"
          >
            Start Your 7-Day Free Trial
          </a>
        </div>
      </div>
    </section>
  );
}