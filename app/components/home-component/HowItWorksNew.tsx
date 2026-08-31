import entrepreneursUsingApp from "/public/entrepreneurs-using-app.jpg";

function HowItWorks() {
  const steps = [
    { t: "Create your account", d: "Sign up in minutes with your business details." },
    { t: "Complete KYC", d: "BVN + CAC documents to verify your business." },
    { t: "Activate with ₦1,000", d: "One-time business account activation fee." },
    { t: "Access your dashboard", d: "Available immediately after activation." },
    { t: "Send & receive payments", d: "Run your business money from one account." },
    { t: "Organize your records", d: "Bookkeeping, invoices, receipts and more." },
    { t: "Add more tools as you grow", d: "Tax tools, payroll, HMO, team controls." },
  ];
  return (
    <section id="how" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-leaf">How Zidwell works</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight">
            From sign up to running your business — in seven steps.
          </h2>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.t}
              className="squircle bg-surface p-6 sm:p-7 hover:bg-surface-2 transition shadow-soft border border-border"
            >
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-6 w-6 rounded-full bg-background border flex items-center justify-center font-medium text-foreground">
                  {i + 1}
                </span>
                <span>Step {i + 1}</span>
              </div>
              <p className="mt-5 font-display text-xl sm:text-2xl font-semibold">{s.t}</p>
              <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-2 h-px w-6 bg-gold" />
                <span>{s.d}</span>
              </div>
            </div>
          ))}

          <div className="squircle overflow-hidden border border-border shadow-soft min-h-[220px]">
            <img
              src={entrepreneursUsingApp.src}
              alt="Business owners setting up their Zidwell account"
              width={1280}
              height={960}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export { HowItWorks };
