import { MoneyFlow } from "../money-flow/money-flow";

export default function MoneyFlowSection() {
  return (
    <section id="money-flow" className="py-24 sm:py-32 bg-surface">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <p className="text-sm font-medium text-leaf">Know where your money is going</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight">
              One number. The whole story.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Track income, expenses, profits and cashflow — filtered by time, category or behavior. Big, beautiful figures designed for everyday business owners, not accountants.
            </p>
            <div className="mt-6 squircle-sm bg-background border border-border p-4 text-sm shadow-soft">
              <p className="font-medium">Want the full picture?</p>
              <p className="mt-1 text-muted-foreground">
                Upload statements or connect your bank to unlock visibility across every account.
              </p>
            </div>
          </div>
          <div className="lg:col-span-7">
            <MoneyFlow />
          </div>
        </div>
      </div>
    </section>
  );
}
