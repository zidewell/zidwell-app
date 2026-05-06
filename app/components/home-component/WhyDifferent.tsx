// components/WhyDifferent.tsx
import { Heart, BookOpen, Headphones } from "lucide-react";

const WhyDifferent = () => {
  return (
    <section className="py-20 md:py-32 bg-(--bg-primary)">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-(--text-primary)">
              Why We're{" "}
              <span className="relative inline-block">
                <span className="relative z-10">Different</span>
                <span className="absolute bottom-2 left-0 right-0 h-4 bg-(--color-accent-yellow)/40 z-0" />
              </span>
            </h2>
            <p className="text-lg text-(--text-secondary) mb-6">
              Most fintech apps focus on transactions.{" "}
              <strong className="text-(--text-primary)">
                Zidwell focuses on financial wellbeing.
              </strong>
            </p>
            <p className="text-(--text-secondary) mb-8">
              We believe money should work for you, not confuse you. That's why
              Zidwell combines tools, education, and support into one simple
              experience.
            </p>
            <div className="space-y-4">
              {[
                {
                  icon: Heart,
                  title: "Finance with Context",
                  desc: "Understanding your unique Nigerian business needs",
                },
                {
                  icon: BookOpen,
                  title: "Structure with Support",
                  desc: "Not just tools, but guidance when you need it",
                },
                {
                  icon: Headphones,
                  title: "Technology with Heart",
                  desc: "Built by people who understand your journey",
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-(--color-accent-yellow) border-2 border-(--border-color)  flex items-center justify-center shrink-0 squircle-md">
                    <item.icon className="w-5 h-5 text-(--color-ink)" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 text-(--text-primary)">
                      {item.title}
                    </h4>
                    <p className="text-sm text-(--text-secondary)">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="bg-(--bg-primary) border-2 border-(--border-color) shadow-[6px_6px_0px_var(--border-color)] dark:shadow-[6px_6px_0px_var(--color-accent-yellow)] p-8 md:p-12 squircle-lg">
              <div className="space-y-6">
                <div className="border-b border-(--border-color) pb-6">
                  <span className="text-sm font-bold text-(--text-secondary) uppercase tracking-wider">
                    Before Zidwell
                  </span>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      "Payment App",
                      "Invoice Tool",
                      "Tax Software",
                      "Banking App",
                      "Spreadsheets",
                    ].map((item) => (
                      <span
                        key={item}
                        className="px-3 py-1 bg-destructive/10 text-destructive border border-destructive/30 text-sm squircle-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-(--text-secondary)">
                    5+ apps, endless confusion
                  </p>
                </div>
                <div>
                  <span className="text-sm font-bold text-(--color-accent-yellow) uppercase tracking-wider">
                    With Zidwell
                  </span>
                  <div className="mt-3">
                    <span className="px-6 py-3  bg-(--color-ink) text-white border-2 border-(--border-color)  inline-block squircle-md">
                      One Platform. Everything.
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-(--text-secondary)">
                    Clarity, control, and confidence
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-(--color-accent-yellow) border-2 border-(--border-color) " />
            <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-[var(--border-color)]" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyDifferent;
