import { MoneyFlow } from "./MoneyFlow";

export function MoneyFlowSection() {
  return (
    <section id="money-flow" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <p className="text-sm font-medium text-[var(--color-lemon-green)]">Financial welliness starts with clarity</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--text-primary)]">Simple Bookkeeping = Clear Financial Records</h2>
            <p className="mt-4 text-[var(--text-secondary)]">Track income, expenses, profits and cashflow — filtered by time, category or behavior. Big, beautiful figures designed for everyday business owners, not accountants.</p>
            <div className="mt-6 squircle-sm bg-[var(--bg-primary)] border border-[var(--border-color)] p-4 text-sm shadow-soft">
              <p className="font-medium text-[var(--text-primary)]">Want the full picture?</p>
              <p className="mt-1 text-[var(--text-secondary)]">Upload statements or connect your bank to unlock visibility across every account.</p>
            </div>
          </div>
          <div className="lg:col-span-7"><MoneyFlow /></div>
        </div>
      </div>
    </section>
  );
}