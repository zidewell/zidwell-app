import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

export function PhoneMock() {
  const transactions = [
    { label: "Online Sales", sub: "Auto · Income", amount: "+ $4,500", up: true },
    { label: "Data Subscription", sub: "Auto · Expense", amount: "- ₦ 5,000", up: false },
    { label: "Freelance Income", sub: "Auto · Income", amount: "+ $120,000", up: true },
  ];

  return (
    <div className="relative mx-auto w-[290px] sm:w-[320px] group">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[var(--color-accent-yellow)]/20 via-[var(--color-lemon-green)]/20 to-[var(--color-accent-yellow)]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="squircle-lg bg-[var(--color-ink)] dark:bg-gray-500 p-2 shadow-float transition-all duration-500 hover:scale-105 hover:shadow-2xl">
        <div className="squircle rounded-2xl bg-[var(--bg-primary)] overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] animate-fade-up">
              <span className="animate-pulse">9:41</span>
              <span className="text-[var(--text-primary)]">Zidwell</span>
            </div>
            <div className="mt-4 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              <p className="text-xs text-[var(--text-secondary)]">Net balance</p>
              <p className="font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)] transition-all duration-300 hover:scale-105 origin-left">₦ 1,284,500</p>
              <div className="mt-2 flex gap-2">
                <span className="rounded-full bg-[var(--color-lemon-green)]/10 text-[var(--color-lemon-green)] text-[10px] px-2 py-1 font-medium transition-all duration-300 hover:scale-110 hover:bg-[var(--color-lemon-green)]/20 cursor-pointer">+12.4% this month</span>
                <span className="rounded-full bg-[var(--color-accent-yellow)]/15 text-[var(--color-accent-yellow)] text-[10px] px-2 py-1 font-medium transition-all duration-300 hover:scale-110 hover:bg-[var(--color-accent-yellow)]/25 cursor-pointer">Auto-tracked</span>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="squircle-sm bg-[var(--bg-secondary)] p-3 transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer animate-fade-up" style={{ animationDelay: "0.2s" }}>
                <p className="text-[10px] text-[var(--text-secondary)]">Income</p>
                <p className="font-display text-base font-semibold text-[var(--text-primary)]">$920k</p>
              </div>
              <div className="squircle-sm bg-[var(--bg-secondary)] p-3 transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer animate-fade-up" style={{ animationDelay: "0.25s" }}>
                <p className="text-[10px] text-[var(--text-secondary)]">Expense</p>
                <p className="font-display text-base font-semibold text-[var(--text-primary)]">₦ 364k</p>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] animate-fade-up" style={{ animationDelay: "0.3s" }}>Today</p>
              {transactions.map((tx, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-2xl bg-[var(--bg-secondary)] px-3 py-2.5 transition-all duration-300 hover:scale-102 hover:bg-[#EBEBEB] dark:hover:bg-[#353535] cursor-pointer animate-fade-up" style={{ animationDelay: `${0.35 + idx * 0.1}s` }}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${tx.up ? "bg-[var(--color-lemon-green)]/15 text-[var(--color-lemon-green)] hover:bg-[var(--color-lemon-green)]/25 hover:scale-110" : "bg-[var(--color-accent-yellow)]/20 text-[var(--color-accent-yellow)] hover:bg-[var(--color-accent-yellow)]/30 hover:scale-110"}`}>
                      {tx.up ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-primary)]">{tx.label}</p>
                      <p className="text-[10px] text-[var(--text-secondary)]">{tx.sub}</p>
                    </div>
                  </div>
                  <p className={`text-xs font-semibold transition-all duration-300 hover:scale-105 ${tx.up ? "text-[var(--color-lemon-green)]" : "text-[var(--color-accent-yellow)]"}`}>{tx.amount}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mx-auto my-3 h-1 w-24 rounded-full bg-[var(--border-color)] transition-all duration-300 hover:w-32 hover:bg-[var(--color-accent-yellow)] cursor-pointer" />
        </div>
      </div>
    </div>
  );
}