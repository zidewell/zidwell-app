export function DashboardChart() {
  const months = [
    { month: "Jan", income: 4200000, expenses: 2800000 },
    { month: "Feb", income: 4800000, expenses: 2900000 },
    { month: "Mar", income: 5100000, expenses: 3100000 },
    { month: "Apr", income: 5300000, expenses: 3000000 },
    { month: "May", income: 5600000, expenses: 3200000 },
    { month: "Jun", income: 6840000, expenses: 3500000 },
    { month: "Jul", income: 7200000, expenses: 3800000 },
    { month: "Aug", income: 8200000, expenses: 3400000 },
  ];
  const maxValue = Math.max(...months.map(m => Math.max(m.income, m.expenses)));
  const feeDistribution = [
    { name: "Logistics", value: 32, color: "var(--color-accent-yellow)" },
    { name: "Marketing", value: 24, color: "var(--color-lemon-green)" },
    { name: "Salary", value: 22, color: "var(--color-ink)" },
    { name: "Other", value: 22, color: "#cbd5e1" },
  ];

  return (
    <div className="squircle-lg bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-float p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--text-secondary)]">Net balance · August</p>
          <p className="font-display text-3xl sm:text-4xl font-semibold text-[var(--text-primary)]">₦ 4,820,300</p>
        </div>
        <div className="flex gap-2 text-[11px]">
          <span className="rounded-full bg-[var(--color-lemon-green)]/10 text-[var(--color-lemon-green)] px-3 py-1 font-medium">Income ₦ 8.2M</span>
          <span className="rounded-full bg-[var(--color-ink)]/5 dark:bg-white/10 px-3 py-1 font-medium text-[var(--text-secondary)]">Expense ₦ 3.4M</span>
        </div>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 squircle-sm bg-[var(--bg-secondary)] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[var(--text-primary)]">Income vs Expenses</p>
            <p className="text-[11px] text-[var(--text-secondary)]">Last 8 months</p>
          </div>
          <div className="mt-5 flex items-end gap-2 sm:gap-4 h-40">
            {months.map((mo) => (
              <div key={mo.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-1 h-full w-full justify-center">
                  <div className="w-2 sm:w-3 rounded-t-md bg-[var(--color-lemon-green)]" style={{ height: `${(mo.income / maxValue) * 100}%` }} />
                  <div className="w-2 sm:w-3 rounded-t-md bg-[var(--color-accent-yellow)]" style={{ height: `${(mo.expenses / maxValue) * 100}%` }} />
                </div>
                <span className="text-[10px] text-[var(--text-secondary)]">{mo.month}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="squircle-sm bg-[var(--bg-secondary)] p-4 sm:p-5">
          <p className="text-sm font-medium text-[var(--text-primary)]">Spending breakdown</p>
          <div className="mt-4 flex items-center justify-center">
            <svg viewBox="0 0 120 120" className="h-36 w-36">
              <circle cx="60" cy="60" r="42" fill="none" stroke="var(--border-color)" strokeWidth="14" />
              <circle cx="60" cy="60" r="42" fill="none" stroke="var(--color-accent-yellow)" strokeWidth="14" strokeDasharray="84.5 131.5" strokeDashoffset="0" transform="rotate(-90 60 60)" />
              <circle cx="60" cy="60" r="42" fill="none" stroke="var(--color-lemon-green)" strokeWidth="14" strokeDasharray="63.4 152.6" strokeDashoffset="-84.5" transform="rotate(-90 60 60)" />
              <circle cx="60" cy="60" r="42" fill="none" stroke="var(--color-ink)" strokeWidth="14" strokeDasharray="58.1 157.9" strokeDashoffset="-147.9" transform="rotate(-90 60 60)" />
              <circle cx="60" cy="60" r="42" fill="none" stroke="#cbd5e1" strokeWidth="14" strokeDasharray="58.1 157.9" strokeDashoffset="-206" transform="rotate(-90 60 60)" />
              <circle cx="60" cy="60" r="25" fill="var(--bg-primary)" />
              <text x="60" y="58" textAnchor="middle" className="fill-[var(--text-primary)]" style={{ fontSize: 11, fontWeight: 600 }}>₦ 3.4M</text>
              <text x="60" y="72" textAnchor="middle" className="fill-[var(--text-secondary)]" style={{ fontSize: 8 }}>total spent</text>
            </svg>
          </div>
          <ul className="mt-4 space-y-2 text-[11px]">
            {feeDistribution.map((item) => (
              <li key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-[var(--text-secondary)]">{item.name}</span>
                </span>
                <span className="font-medium text-[var(--text-primary)]">{item.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="squircle-sm bg-[var(--bg-secondary)] p-4">
          <p className="text-[11px] text-[var(--text-secondary)]">Monthly trend</p>
          <p className="font-display text-xl font-semibold text-[var(--color-lemon-green)]">+18.2%</p>
        </div>
        <div className="squircle-sm bg-[var(--bg-secondary)] p-4">
          <p className="text-[11px] text-[var(--text-secondary)]">Largest category</p>
          <p className="font-display text-xl font-semibold text-[var(--text-primary)]">Logistics</p>
        </div>
        <div className="squircle-sm bg-[var(--bg-secondary)] p-4">
          <p className="text-[11px] text-[var(--text-secondary)]">Auto-categorized</p>
          <p className="font-display text-xl font-semibold text-[var(--color-accent-yellow)]">98%</p>
        </div>
      </div>
    </div>
  );
}