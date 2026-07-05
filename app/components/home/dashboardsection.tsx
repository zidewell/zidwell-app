import Dashboard from "../dashboard/dashboard";

export default function DashboardSection() {
  return (
    <section id="dashboard" className="py-24 sm:py-32 bg-surface">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-5">
            <p className="text-sm font-medium text-leaf">Dashboard</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight">
              A dashboard that doesn't feel like accounting.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Pie charts. Income vs expenses. Net balance. Monthly trends. Real figures in your currency — designed for humans, not auditors.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <img
                src="/entrepreneurs-using-app.jpg"
                alt="Entrepreneurs reviewing Zidwell on a laptop"
                width={1280}
                height={960}
                loading="lazy"
                className="squircle-sm w-40 sm:w-56 object-cover aspect-[4/3]"
              />
              <div>
                <p className="font-display text-base font-semibold">Loved by founders</p>
                <p className="text-xs text-muted-foreground">From market stalls to tech studios.</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7">
            <Dashboard />
          </div>
        </div>
      </div>
    </section>
  );
}