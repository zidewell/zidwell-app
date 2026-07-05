import { Check, Sparkles, Globe2, MapPin } from "lucide-react";

const plans = [
  {
    name: "Free",
    tagline: "Start Managing Your Money",
    price: "₦0",
    altPrice: "$0",
    suffix: "",
    note: "For individuals and early-stage freelancers.",
    region: "global",
    features: [
      "Manual bookkeeping — Global",
      "Auto-bookkeeping (Wallet users, Nigeria)",
      "Payment Links & Sales pages (Nigeria)",
      "Free business bank account (Nigeria)",
      "Up to 5 invoices — Global",
      "Up to 5 receipts — Global",
      "Basic financial overview",
    ],
    cta: "Start Free",
    featured: false,
  },
  {
    name: "Solopreneur",
    tagline: "Get Organized",
    price: "₦4,900",
    altPrice: "$3.99",
    suffix: "/month",
    note: "For freelancers and solo business owners.",
    region: "global",
    features: [
      "Everything in Free, plus:",
      "Up to 10 invoices",
      "Unlimited receipts",
      "Branded invoices",
      "Better expense tracking",
      "Basic financial insights",
    ],
    cta: "Go Solopreneur",
    featured: false,
  },
  {
    name: "SME",
    tagline: "Run Your Business Properly",
    price: "₦29,900",
    altPrice: "$21.99",
    suffix: "/month",
    note: "For growing small businesses.",
    region: "global",
    features: [
      "Everything in Solopreneur, plus:",
      "Upload bank statements (PDF / Excel / CSV)",
      "Connect up to 3 bank accounts — Nigeria",
      "Auto-bookkeeping from connected accounts — Nigeria",
      "Unlimited invoices & receipts",
      "Vault — store financial documents safely",
      "Tax calculator",
      "Financial statements (view): P&L · Cashflow · Balance Sheet",
      "1 extra team member",
    ],
    cta: "Go SME",
    featured: true,
  },
  {
    name: "Enterprise",
    tagline: "Team Business Management",
    price: "₦100,000",
    altPrice: "$75",
    suffix: "/month",
    note: "For teams that need structure.",
    region: "global",
    features: [
      "Everything in SME, plus:",
      "Multi-user access (full team)",
      "Role-based permissions",
      "Approvals for payments, invoices, receipts, transfers",
      "Connect up to 5 bank accounts — Nigeria",
      "Downloadable financial reports",
      "10 contracts",
      "Dedicated onboarding support",
    ],
    cta: "Go Enterprise",
    featured: false,
  },
  {
    name: "Corporation",
    tagline: "Full Business Finance System",
    price: "₦300,000",
    altPrice: "$220",
    suffix: "/month",
    note: "For large organizations and structured companies.",
    region: "global",
    features: [
      "Everything in Enterprise, plus:",
      "Unlimited contracts",
      "Department-based access (HR, Finance, Ops…)",
      "Connect unlimited bank accounts — Nigeria",
      "Simple payroll system",
      "Advanced financial reporting",
      "Custom financial structure setup",
      "Priority onboarding & dedicated account manager",
    ],
    cta: "Talk to Sales",
    featured: false,
  },
];

export function Plans() {
  return (
    <section id="plans" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-medium text-leaf">Pricing</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight">
            Simple. Scalable. Built for growth.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start free. Upgrade as your business — and your books — grow.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`squircle p-6 border shadow-soft flex flex-col ${
                p.featured
                  ? "bg-ink text-background border-ink shadow-float"
                  : "bg-background border-border"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-lg font-semibold">{p.name}</p>
                {p.featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold text-ink px-2.5 py-1 text-[10px] font-semibold">
                    <Sparkles className="h-3 w-3" /> Most loved
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 ${p.featured ? "text-background/60" : "text-muted-foreground"}`}>
                {p.tagline}
              </p>

              <div className="mt-4 flex items-baseline gap-1 flex-wrap">
                <span className="font-display text-3xl font-semibold">{p.price}</span>
                {p.suffix && (
                  <span className={`text-sm ${p.featured ? "text-background/60" : "text-muted-foreground"}`}>
                    {p.suffix}
                  </span>
                )}
              </div>
              {p.altPrice && (
                <p className={`mt-0.5 text-xs ${p.featured ? "text-background/50" : "text-muted-foreground"}`}>
                  or {p.altPrice}{p.suffix}
                </p>
              )}
              <p className={`mt-2 text-xs ${p.featured ? "text-background/70" : "text-muted-foreground"}`}>
                {p.note}
              </p>

              <ul className="mt-5 space-y-2.5 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`h-4 w-4 mt-0.5 shrink-0 ${p.featured ? "text-gold" : "text-leaf"}`} />
                    <span className={p.featured ? "text-background/90" : "text-foreground"}>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#cta"
                className={`mt-6 inline-flex items-center justify-center px-5 py-3 rounded-full text-sm font-semibold transition ${
                  p.featured
                    ? "bg-gold text-ink hover:opacity-90"
                    : "bg-surface border border-border hover:bg-surface-2"
                }`}
              >
                {p.cta}
              </a>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Globe2 className="h-3.5 w-3.5 text-leaf" /> Available worldwide</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gold" /> Bank sync — Nigeria only</span>
          <span>· Cancel anytime</span>
        </div>
      </div>
    </section>
  );
}
