// app/components/home-component/HowItWorksNew.tsx


function HowItWorks() {
  const steps = [
    {
      t: "Create your Zidwell account",
      d: "Sign up in minutes with your business details.",
    },
    {
      t: "Complete your KYC/KYB",
      d: "Get a free business bank account once verified.",
    },
    {
      t: "Pick a toolkit plan",
      d: "Start your 7-day free trial on any plan.",
    },
    {
      t: "Upgrade to paid",
      d: "After your free trial, upgrade if you like it.",
    },
  ];

  return (
    <section id="how" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-leaf">
            Simple 4-Steps to Start
          </p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight">
            Start Putting Structure Around Your Business Today.
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
              <p className="mt-5 font-display text-xl sm:text-2xl font-semibold">
                {s.t}
              </p>
              <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-2 h-px w-6 bg-gold" />
                <span>{s.d}</span>
              </div>
            </div>
          ))}

          <div className="squircle overflow-hidden border border-border shadow-soft min-h-[220px]">
            <img
              src={"/entrepreneurs-using-app.jpg"}
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