import Donut from "../donut";
import LegendDot from "../legendbot";
import Stat from "../stat";

export default function Dashboard() {
  const months = [
    { m: "Jan", i: 60, e: 35 },
    { m: "Feb", i: 72, e: 40 },
    { m: "Mar", i: 55, e: 38 },
    { m: "Apr", i: 80, e: 48 },
    { m: "May", i: 92, e: 52 },
    { m: "Jun", i: 110, e: 64 },
    { m: "Jul", i: 96, e: 58 },
    { m: "Aug", i: 124, e: 70 },
  ];
  const max = 130;

  return (
    <div className="squircle-lg bg-background border shadow-float p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Net balance · August</p>
          <p className="font-display text-3xl sm:text-4xl font-semibold">₦ 4,820,300</p>
        </div>
        <div className="flex gap-2 text-[11px]">
          <span className="rounded-full bg-leaf/10 text-leaf px-3 py-1 font-medium">Income ₦ 8.2M</span>
          <span className="rounded-full bg-ink/5 px-3 py-1 font-medium">Expense ₦ 3.4M</span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {/* Bars */}
        <div className="md:col-span-2 squircle-sm bg-surface p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Income vs Expenses</p>
            <p className="text-[11px] text-muted-foreground">Last 8 months</p>
          </div>
          <div className="mt-5 flex items-end gap-2 sm:gap-4 h-40">
            {months.map((mo) => (
              <div key={mo.m} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-1 h-full w-full justify-center">
                  <div
                    className="w-2 sm:w-3 rounded-t-md bg-leaf"
                    style={{ height: `${(mo.i / max) * 100}%` }}
                  />
                  <div
                    className="w-2 sm:w-3 rounded-t-md bg-gold"
                    style={{ height: `${(mo.e / max) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{mo.m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Donut */}
        <div className="squircle-sm bg-surface p-4 sm:p-5">
          <p className="text-sm font-medium">Spending breakdown</p>
          <div className="mt-4 flex items-center justify-center">
            <Donut />
          </div>
          <ul className="mt-4 space-y-2 text-[11px]">
            <LegendDot color="var(--gold)" label="Logistics" value="32%" />
            <LegendDot color="var(--leaf)" label="Marketing" value="24%" />
            <LegendDot color="var(--ink)" label="Salary" value="22%" />
            <LegendDot color="#cbd5e1" label="Other" value="22%" />
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Monthly trend" value="+18.2%" tone="leaf" />
        <Stat label="Largest category" value="Logistics" />
        <Stat label="Auto-categorized" value="98%" tone="gold" />
      </div>
    </div>
  );
}






 