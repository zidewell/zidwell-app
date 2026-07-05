export default function Categories() {
  const types = [
    { l: "Freelancers & Solopreneurs", e: "🧑‍💻", c: "gold" },
    { l: "Agencies & Consultants", e: "🤝", c: "leaf" },
    { l: "SMEs & Startups", e: "🚀", c: "ink" },
    { l: "Law Firms", e: "⚖️", c: "gold" },
    { l: "Schools", e: "🎓", c: "leaf" },
    { l: "Cooperatives", e: "🏘️", c: "ink" },
    { l: "Retail & Stores", e: "🛍️", c: "gold" },
    { l: "Growing Enterprises", e: "🏢", c: "leaf" },
    { l: "Corporations", e: "🏛️", c: "ink" },
  ];

  const cls = (c: string) =>
    c === "gold"
      ? "bg-gold/15 hover:bg-gold/25"
      : c === "leaf"
      ? "bg-leaf/10 hover:bg-leaf/20"
      : "bg-surface hover:bg-surface-2";

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-medium text-leaf">Zidwell for every business</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight">
            From freelancers to corporations.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Wherever you do business, and whatever you do — Zidwell organizes your financial records.
          </p>
        </div>

        <div className="mt-14 flex flex-wrap justify-center gap-3 sm:gap-4">
          {types.map((t, i) => (
            <span
              key={t.l}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition border border-border/60 shadow-soft ${cls(t.c)} ${
                i % 3 === 0 ? "animate-float" : i % 3 === 1 ? "animate-float-slow" : ""
              }`}
              style={{ animationDelay: `${(i % 5) * 0.4}s` }}
            >
              <span className="text-base">{t.e}</span>
              {t.l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}