import { BarChart3, PieChart, Receipt, ScrollText, Sparkles, TrendingUp, Upload } from "lucide-react";
import Image from "next/image";
export default function StatementsSection() {
  const reports = [
    { icon: BarChart3, t: "Profit & Loss Statement" },
    { icon: TrendingUp, t: "Cash Flow Statement" },
    { icon: ScrollText, t: "Balance Sheet" },
    { icon: PieChart, t: "Income & Expense Reports" },
    { icon: Sparkles, t: "Financial Health Overview" },
    { icon: Receipt, t: "Tax-Ready Summaries" },
  ];
  return (
    <section id="statements" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="squircle-lg overflow-hidden border shadow-float bg-surface">
              <Image
                width={1280}
                height={896}
                loading="lazy"
                src="/statements-upload.jpg"
                alt="Zidwell turns your records into professional financial statements"
                className="w-full h-auto object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-3 py-1.5 text-xs font-medium">
              <Upload className="h-3.5 w-3.5" /> What you get from your records
            </span>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl font-semibold tracking-tight">
              Not just bookkeeping. Real financial intelligence.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Once your records are organized, Zidwell generates the reports every serious business needs — useful for tax filing, loan applications, investor meetings and better business decisions.
            </p>
            <div className="mt-6 grid sm:grid-cols-2 gap-2">
              {reports.map((r) => {
                const Icon = r.icon;
                return (
                  <div key={r.t} className="squircle-sm bg-surface border border-border px-4 py-3 flex items-center gap-3">
                    <Icon className="h-4 w-4 text-leaf" />
                    <span className="text-sm font-medium">{r.t}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}