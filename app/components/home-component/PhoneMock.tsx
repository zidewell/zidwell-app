// app/components/home-component/PhoneMock.tsx
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

const transactions = [
  { label: "Online Sales", sub: "Auto · Income", amount: "+ ₦450,000", up: true },
  { label: "Data Subscription", sub: "Auto · Expense", amount: "- ₦5,000", up: false },
  { label: "Freelance Income", sub: "Auto · Income", amount: "+ ₦120,000", up: true },
];

export function PhoneMock() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[310px]">
      <div className="rounded-[40px] bg-ink p-2 shadow-float">
        <div className="rounded-[32px] bg-background overflow-hidden">
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>9:41</span>
              <span className="font-medium text-foreground">Zidwell</span>
            </div>

            <div className="mt-4">
              <p className="text-[10px] text-muted-foreground">Net balance</p>
              <p className="font-display text-2xl font-semibold tracking-tight text-foreground tabular">
                ₦1,284,500
              </p>
              <div className="mt-2 flex gap-1.5">
                <span className="rounded-full bg-leaf/10 text-leaf text-[9px] px-2 py-0.5 font-medium">
                  +12.4% this month
                </span>
                <span className="rounded-full bg-gold/15 text-ink dark:text-gold text-[9px] px-2 py-0.5 font-medium">
                  Auto-tracked
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-surface p-2.5">
                <p className="text-[9px] text-muted-foreground">Income</p>
                <p className="font-display text-sm font-semibold tabular">₦920k</p>
              </div>
              <div className="rounded-2xl bg-surface p-2.5">
                <p className="text-[9px] text-muted-foreground">Expense</p>
                <p className="font-display text-sm font-semibold tabular">₦364k</p>
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                Today
              </p>
              {transactions.map((tx, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl bg-surface px-2.5 py-2"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${
                        tx.up ? "bg-leaf/10 text-leaf" : "bg-gold/15 text-gold"
                      }`}
                    >
                      {tx.up ? (
                        <ArrowDownLeft className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-foreground">{tx.label}</p>
                      <p className="text-[9px] text-muted-foreground">{tx.sub}</p>
                    </div>
                  </div>
                  <p
                    className={`text-[11px] font-semibold tabular ${
                      tx.up ? "text-leaf" : "text-gold"
                    }`}
                  >
                    {tx.amount}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="mx-auto my-3 h-1 w-20 rounded-full bg-border" />
        </div>
      </div>
    </div>
  );
}