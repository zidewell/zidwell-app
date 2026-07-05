import { Upload, Link2, PencilLine, ArrowRight, Check } from "lucide-react";

const styles = [
  {
    icon: PencilLine,
    badge: "Manual Records",
    title: "Simple way to track your money.",
    desc: "Record income and expenses manually, organize transactions by category, and get a basic financial overview so you can start understanding your business finances.",
    fit: "Freelancers and early-stage businesses.",
    price: "Free · Everywhere",
    region: "Worldwide",
    tone: "leaf",
  },
  {
    icon: Upload,
    badge: "Upload Statements · Zidwell Books",
    title: "Turn banking history into clean records.",
    desc: "Upload PDF or Excel bank statements and Zidwell converts them into structured bookkeeping and financial summaries — automatically.",
    fit: "Businesses that want instant clarity — anywhere in the world.",
    price: "From ₦4,900 / $3.99 mo",
    region: "Worldwide",
    tone: "gold",
  },
  {
    icon: Link2,
    badge: "Live Bank Sync · Zidwell Sync",
    title: "Real-time records from your bank accounts.",
    desc: "Connect Nigerian bank accounts. Transactions are captured, auto-categorized into income & expenses, and combined across accounts into one dashboard — with a monthly combined statement.",
    fit: "Businesses that want full clarity & automation.",
    price: "Nigeria — from ₦29,900 / mo",
    region: "Nigeria only",
    tone: "ink",
  },
];

export function BookkeepingStyles() {
  return (
    <section id="styles" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-leaf">Core ways to build your financial records</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight">
            Choose how Zidwell records your money.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Three simple ways to turn every transaction into a clean financial record — pick what fits how you run your business today.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {styles.map((s) => {
            const Icon = s.icon;
            const dot =
              s.tone === "leaf" ? "bg-leaf text-background" : s.tone === "gold" ? "bg-gold text-ink" : "bg-ink text-background";
            return (
              <div key={s.badge} className="squircle bg-surface border border-border shadow-soft p-6 sm:p-7 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className={`h-11 w-11 rounded-2xl flex items-center justify-center ${dot}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-background border border-border text-muted-foreground">
                    {s.region}
                  </span>
                </div>
                <p className="mt-5 text-xs font-semibold tracking-wider uppercase text-muted-foreground">{s.badge}</p>
                <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{s.desc}</p>
                <div className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
                  <Check className="h-4 w-4 mt-0.5 text-leaf shrink-0" />
                  <span>{s.fit}</span>
                </div>
                <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
                  <span className="font-display text-sm font-semibold">{s.price}</span>
                  <a href="#plans" className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:text-leaf transition">
                    See pricing <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
