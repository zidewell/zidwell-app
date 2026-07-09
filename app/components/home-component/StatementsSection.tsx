import { BarChart3, TrendingUp, ScrollText, PieChart, Sparkles, Receipt, Upload } from "lucide-react";
import statementsUpload from "../../../public/statements-upload.jpg";
import Image from "next/image";

export function StatementsSection() {
  const reports = [
    { icon: BarChart3, t: "Profit & Loss Statement" },
    { icon: TrendingUp, t: "Cash Flow Statement" },
    { icon: ScrollText, t: "Balance Sheet" },
    { icon: PieChart, t: "Income & Expense Reports" },
    { icon: Sparkles, t: "Financial Health Overview" },
    { icon: Receipt, t: "Tax-Ready Summaries" },
  ];
  
  return (
    <section id="statements" className="py-24 sm:py-32 bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="squircle-lg overflow-hidden border border-[var(--border-color)] shadow-float bg-[var(--bg-primary)]">
              <Image
                src={statementsUpload}
                alt="Zidwell turns your records into professional financial statements"
                width={1280}
                height={896}
                loading="lazy"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-yellow)]/15 px-3 py-1.5 text-xs font-medium text-[var(--text-primary)]">
              <Upload className="h-3.5 w-3.5 text-[var(--color-accent-yellow)]" /> What you get from your records
            </span>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--text-primary)]">Not just bookkeeping. Real financial intelligence.</h2>
            <p className="mt-4 text-[var(--text-secondary)]">Once your records are organized, Zidwell generates the reports every serious business needs — useful for tax filing, loan applications, investor meetings and better business decisions.</p>
            <div className="mt-6 grid sm:grid-cols-2 gap-2">
              {reports.map((r) => {
                const Icon = r.icon;
                return (
                  <div key={r.t} className="squircle-sm bg-[var(--bg-primary)] border border-[var(--border-color)] px-4 py-3 flex items-center gap-3 shadow-soft">
                    <Icon className="h-4 w-4 text-[var(--color-lemon-green)]" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">{r.t}</span>
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