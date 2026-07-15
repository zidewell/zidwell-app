import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
export function PhoneMock() {
  const transactions = [
    { label: "Online Sales", sub: "Auto · Income", amount: "+ $4,500", up: true },
    { label: "Data Subscription", sub: "Auto · Expense", amount: "- ₦ 5,000", up: false },
    { label: "Freelance Income", sub: "Auto · Income", amount: "+ $120,000", up: true },
  ];

  return (
    <div className="relative mx-auto w-[290px] sm:w-[320px] group">
      <div className="absolute -inset-4 rounded-3xl  blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="rounded-[40px] bg-[oklch(0.17_0_0)] dark:bg-[oklch(0.98_0_0)] p-2 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)] transition-all duration-500 hover:scale-105 hover:shadow-2xl">
        <div className="rounded-[32px] bg-[oklch(1_0_0)] dark:bg-[oklch(0.14_0_0)] overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center justify-between text-[11px] text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] animate-fade-up">
              <span className="animate-pulse">9:41</span>
              <span className="text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)] font-['Be_Vietnam_Pro',system-ui,sans-serif]">Zidwell</span>
            </div>
            <div className="mt-4 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              <p className="text-xs text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] font-['Be_Vietnam_Pro',system-ui,sans-serif]">Net balance</p>
              <p className="font-['Space_Grotesk','Cy_Grotesk_Key',system-ui,sans-serif] text-3xl font-semibold tracking-tight text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)] transition-all duration-300 hover:scale-105 origin-left">
                ₦ 1,284,500
              </p>
              <div className="mt-2 flex gap-2">
                <span className="rounded-full bg-[oklch(0.66_0.18_148)]/10 dark:bg-[oklch(0.66_0.18_148)]/20 text-[oklch(0.66_0.18_148)] text-[10px] px-2 py-1 font-medium font-['Be_Vietnam_Pro',system-ui,sans-serif] transition-all duration-300 hover:scale-110 hover:bg-[oklch(0.66_0.18_148)]/20 dark:hover:bg-[oklch(0.66_0.18_148)]/30 cursor-pointer">
                  +12.4% this month
                </span>
                <span className="rounded-full bg-[oklch(0.84_0.16_88)]/15 dark:bg-[oklch(0.84_0.16_88)]/25 text-[oklch(0.84_0.16_88)] text-[10px] px-2 py-1 font-medium font-['Be_Vietnam_Pro',system-ui,sans-serif] transition-all duration-300 hover:scale-110 hover:bg-[oklch(0.84_0.16_88)]/25 dark:hover:bg-[oklch(0.84_0.16_88)]/35 cursor-pointer">
                  Auto-tracked
                </span>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-[20px] bg-[oklch(0.97_0_0)] dark:bg-[oklch(0.18_0_0)] p-3 transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer animate-fade-up" style={{ animationDelay: "0.2s" }}>
                <p className="text-[10px] text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] font-['Be_Vietnam_Pro',system-ui,sans-serif]">Income</p>
                <p className="font-['Space_Grotesk','Cy_Grotesk_Key',system-ui,sans-serif] text-base font-semibold text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)]">$920k</p>
              </div>
              <div className="rounded-[20px] bg-[oklch(0.97_0_0)] dark:bg-[oklch(0.18_0_0)] p-3 transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer animate-fade-up" style={{ animationDelay: "0.25s" }}>
                <p className="text-[10px] text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] font-['Be_Vietnam_Pro',system-ui,sans-serif]">Expense</p>
                <p className="font-['Space_Grotesk','Cy_Grotesk_Key',system-ui,sans-serif] text-base font-semibold text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)]">₦ 364k</p>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] font-['Be_Vietnam_Pro',system-ui,sans-serif] animate-fade-up" style={{ animationDelay: "0.3s" }}>
                Today
              </p>
              {transactions.map((tx, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between rounded-2xl bg-[oklch(0.97_0_0)] dark:bg-[oklch(0.18_0_0)] px-3 py-2.5 transition-all duration-300 hover:scale-[1.02] hover:bg-[oklch(0.935_0_0)] dark:hover:bg-[oklch(0.22_0_0)] cursor-pointer animate-fade-up" 
                  style={{ animationDelay: `${0.35 + idx * 0.1}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                      tx.up 
                        ? "bg-[oklch(0.66_0.18_148)]/15 dark:bg-[oklch(0.66_0.18_148)]/25 text-[oklch(0.66_0.18_148)] hover:bg-[oklch(0.66_0.18_148)]/25 dark:hover:bg-[oklch(0.66_0.18_148)]/35 hover:scale-110" 
                        : "bg-[oklch(0.84_0.16_88)]/20 dark:bg-[oklch(0.84_0.16_88)]/30 text-[oklch(0.84_0.16_88)] hover:bg-[oklch(0.84_0.16_88)]/30 dark:hover:bg-[oklch(0.84_0.16_88)]/40 hover:scale-110"
                    }`}>
                      {tx.up ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)] font-['Be_Vietnam_Pro',system-ui,sans-serif]">{tx.label}</p>
                      <p className="text-[10px] text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] font-['Be_Vietnam_Pro',system-ui,sans-serif]">{tx.sub}</p>
                    </div>
                  </div>
                  <p className={`text-xs font-semibold font-['Be_Vietnam_Pro',system-ui,sans-serif] transition-all duration-300 hover:scale-105 ${
                    tx.up ? "text-[oklch(0.66_0.18_148)]" : "text-[oklch(0.84_0.16_88)]"
                  }`}>
                    {tx.amount}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="mx-auto my-3 h-1 w-24 rounded-full bg-[oklch(0.85_0_0)] dark:bg-[oklch(1_0_0)_/_12%] transition-all duration-300 hover:w-32 hover:bg-[oklch(0.84_0.16_88)] dark:hover:bg-[oklch(0.84_0.16_88)] cursor-pointer" />
        </div>
      </div>
    </div>
  );
}
