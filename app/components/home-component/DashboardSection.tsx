
import { DashboardChart } from "./DashboardChart"; 

export function DashboardSection() {
  const entrepreneursUsingApp = "https://images.unsplash.com/photo-1604933762023-7213af7ff7a7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGJsYWNrJTIwYnVzaW5lc3MlMjB0eXBpbmd8ZW58MHx8MHx8fDA%3D";
  return (
    <section id="dashboard" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-5">
            <p className="text-sm font-medium text-[var(--color-lemon-green)]">Dashboard</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--text-primary)]">A dashboard that doesn't feel like accounting.</h2>
            <p className="mt-4 text-[var(--text-secondary)]">Pie charts. Income vs expenses. Net balance. Monthly trends. Real figures in your currency — designed for humans, not auditors.</p>
            <div className="mt-6 flex items-center gap-3">
              <img src={entrepreneursUsingApp} alt="Entrepreneurs reviewing Zidwell on a laptop" width={1280} height={960} loading="lazy" className="squircle-sm w-40 sm:w-56 object-cover aspect-[4/3]" />
              <div><p className="font-display text-base font-semibold text-[var(--text-primary)]">Loved by founders</p><p className="text-xs text-[var(--text-secondary)]">From market stalls to tech studios.</p></div>
            </div>
          </div>
          <div className="lg:col-span-7"><DashboardChart /></div>
        </div>
      </div>
    </section>
  );
}