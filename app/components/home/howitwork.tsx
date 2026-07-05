export default function HowItWorks() {
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
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-leaf">How Zidwell works</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight">
            One system. Every transaction. Clean financial records.
          </h2>
          <p className="mt-4 text-muted-foreground">
            No spreadsheets. No accounting stress. No manual cleanup. Every movement of money becomes a financial record automatically — with no extra effort from you.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={i}
              className="squircle bg-surface p-6 sm:p-7 hover:bg-surface-2 transition group shadow-soft border border-border"
            >
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-6 w-6 rounded-full bg-background border flex items-center justify-center font-medium text-foreground">
                  {i + 1}
                </span>
                <span>Step {i + 1}</span>
              </div>
              <p className="mt-5 font-display text-xl sm:text-2xl font-semibold">
                {s.you}
              </p>
              <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-2 h-px w-6 bg-gold" />
                <span>→ {s.auto}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 max-w-3xl text-sm text-muted-foreground">
          Everything becomes structured financial data — ready to export, share and act on.
        </p>
      </div>
    </section>
  );
}