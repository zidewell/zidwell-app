// app/components/home-component/StatementsPreview.tsx
export function StatementsPreview() {
  const rows = [
    { l: "Revenue", v: "8,240,000", bold: true },
    { l: "Cost of goods sold", v: "(3,120,000)" },
    { l: "Gross profit", v: "5,120,000", bold: true, divider: true },
    { l: "Operating expenses", v: "(1,890,000)" },
    { l: "Salaries", v: "(1,420,000)" },
    { l: "Rent & utilities", v: "(280,000)" },
    { l: "Marketing", v: "(190,000)" },
    { l: "Net profit", v: "3,230,000", bold: true, divider: true, gold: true },
  ];

  return (
    <section id="statements" className="py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-leaf mb-4">
              Financial statements
            </p>
            <h2 className="font-narrow-display text-4xl sm:text-5xl font-semibold tracking-tight">
              When the investor asks for your P&amp;L, you&apos;ll have it in 30
              seconds.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Every record Zidwell keeps feeds directly into a profit-and-loss, a
              cash-flow, and a balance sheet. Exportable as PDF, or shareable via
              link with read-only access for your accountant.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {["Cash flow", "Balance sheet", "Tax summary"].map((l) => (
                <a
                  key={l}
                  href="#"
                  className="text-foreground hover:text-primary-custom transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  {l}
                  <span className="text-primary-custom">→</span>
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="squircle-lg bg-background border border-border shadow-float overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <p className="font-display text-lg font-semibold">
                    Profit &amp; Loss
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Mara Home · Aug 2026
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-leaf" />
                  Live
                </div>
              </div>
              <div className="p-6 space-y-1">
                {rows.map((r, i) => (
                  <div key={i}>
                    {r.divider && <div className="h-px bg-border my-2" />}
                    <div className="flex items-center justify-between py-1.5">
                      <p
                        className={`text-sm ${
                          r.bold
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {r.l}
                      </p>
                      <p
                        className={`text-sm tabular ${
                          r.gold
                            ? "text-primary-custom font-semibold"
                            : r.bold
                            ? "font-semibold text-foreground"
                            : "text-foreground"
                        }`}
                      >
                        ₦{r.v}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}