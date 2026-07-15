export function HowItWorks() {
  const steps = [
    { you: "You earn money", auto: "Income logged and categorized automatically." },
    { you: "You spend money", auto: "Every expense recorded and categorized." },
    { you: "You send invoices", auto: "Invoices flow straight into your records." },
    { you: "You receive payments", auto: "Payments settle into your dashboard." },
    { you: "You upload statements", auto: "PDF or Excel — converted into clean records." },
    { you: "You connect bank accounts", auto: "Transactions synced into records in real time." },
  ];
  
  return (
    <section id="how" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-[var(--color-lemon-green)]">How Zidwell works</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--text-primary)]">One system. Every transaction. Clean financial records.</h2>
          <p className="mt-4 text-[var(--text-secondary)]">No spreadsheets. No accounting stress. No manual cleanup. Every movement of money becomes a financial record automatically — with no extra effort from you.</p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={i}
              className="squircle bg-[var(--bg-primary)] p-6 sm:p-7 hover:bg-[var(--bg-secondary)] transition group shadow-soft border border-[var(--border-color)]"
            >
              <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                <span className="h-6 w-6 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center font-medium text-[var(--text-primary)]">{i + 1}</span>
                <span>Step {i + 1}</span>
              </div>
              <p className="mt-5 font-display text-xl sm:text-2xl font-semibold text-[var(--text-primary)]">{s.you}</p>
              <div className="mt-3 flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                <span className="mt-2 h-px w-6 bg-[var(--color-accent-yellow)]" />
                <span>→ {s.auto}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-10 max-w-3xl text-sm text-[var(--text-secondary)]">Everything becomes structured financial data — ready to export, share and act on.</p>
      </div>
    </section>
  );
}