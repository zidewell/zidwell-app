import { businessTypes } from "./businessTypes";

export function Categories() {
  const getTagClass = (c: string) => {
    if (c === "gold") return "bg-[var(--color-accent-yellow)]/15 hover:bg-[var(--color-accent-yellow)]/25 text-[var(--text-primary)]";
    if (c === "leaf") return "bg-[var(--color-lemon-green)]/10 hover:bg-[var(--color-lemon-green)]/20 text-[var(--text-primary)]";
    return "bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 text-[var(--text-primary)]";
  };

  return (
    <section className="py-24 sm:py-32 bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-medium text-[var(--color-lemon-green)]">Zidwell for every business</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--text-primary)]">From freelancers to corporations.</h2>
          <p className="mt-4 text-[var(--text-secondary)]">Wherever you do business, and whatever you do — Zidwell organizes your financial records.</p>
        </div>
        <div className="mt-14 flex flex-wrap justify-center gap-3 sm:gap-4">
          {businessTypes.map((t, i) => (
            <span
              key={t.l}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition border border-[var(--border-color)]/60 shadow-soft ${getTagClass(t.c)} ${
                i % 3 === 0 ? "animate-float" : i % 3 === 1 ? "animate-float-slow" : ""
              }`}
              style={{ animationDelay: `${(i % 5) * 0.4}s` }}
            >
              <span className="text-base">{t.e}</span> {t.l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}