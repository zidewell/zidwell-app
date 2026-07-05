import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Txn from "../txn";

export function PhoneMock() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[320px]">
      <div className="squircle-lg bg-ink p-3 shadow-float" style={{ background: "var(--ink)" }}>
        <div className="squircle bg-background overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>9:41</span>
              <span>Zidwell</span>
            </div>
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">Net balance</p>
              <p className="font-display text-3xl font-semibold tracking-tight">
                ₦ 1,284,500
              </p>
              <div className="mt-2 flex gap-2">
                <span className="rounded-full bg-leaf/10 text-leaf text-[10px] px-2 py-1 font-medium">
                  +12.4% this month
                </span>
                <span className="rounded-full bg-gold/15 text-[10px] px-2 py-1 font-medium">
                  Auto-tracked
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="squircle-sm bg-surface p-3">
                <p className="text-[10px] text-muted-foreground">Income</p>
                <p className="font-display text-base font-semibold">₦ 920k</p>
              </div>
              <div className="squircle-sm bg-surface p-3">
                <p className="text-[10px] text-muted-foreground">Expense</p>
                <p className="font-display text-base font-semibold">₦ 364k</p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Today
              </p>
              <Txn label="Online Sales" sub="Auto · Income" amount="+ ₦ 45,000" up />
              <Txn label="Data Subscription" sub="Auto · Expense" amount="- ₦ 5,000" />
              <Txn label="Freelance Income" sub="Auto · Income" amount="+ ₦ 120,000" up />
            </div>
          </div>
          <div className="mx-auto my-3 h-1 w-24 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}

