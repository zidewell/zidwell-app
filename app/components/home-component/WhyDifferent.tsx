// components/WhyDifferent.tsx
"use client";

import { Heart, BookOpen, Headphones } from "lucide-react";

const WhyDifferent = () => {
  return (
    <section className="py-20 md:py-32 bg-[var(--bg-primary)] relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute -right-32 top-20 -z-10 h-80 w-80 rounded-full bg-[var(--color-accent-yellow)]/5 blur-3xl animate-blob" />
      <div className="absolute -left-32 bottom-10 -z-10 h-80 w-80 rounded-full bg-[var(--color-accent-yellow)]/10 blur-3xl animate-blob" style={{ animationDelay: "-4s" }} />

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Solid Background */}
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 text-[var(--text-primary)]">
              Why We're{" "}
              <span className="relative inline-block">
                <span className="relative z-10">Different</span>
                <span className="absolute bottom-2 left-0 right-0 h-4 bg-[var(--color-accent-yellow)]/40 z-0 rounded-sm" />
              </span>
            </h2>
            <p className="text-lg text-[var(--text-secondary)] mb-6">
              Most fintech apps focus on transactions.{" "}
              <strong className="text-[var(--text-primary)]">
                Zidwell focuses on financial wellbeing.
              </strong>
            </p>
            <p className="text-[var(--text-secondary)] mb-8">
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
                <div key={i} className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-[var(--color-accent-yellow)] border-2 border-[var(--border-color)] flex items-center justify-center shrink-0 rounded-xl shadow-soft transition-transform group-hover:scale-105">
                    <item.icon className="w-5 h-5 text-[var(--color-ink)]" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 text-[var(--text-primary)]">
                      {item.title}
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Glassy Card (Before/After Comparison) */}
          <div className="relative">
            {/* Glassmorphism effect */}
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border-color)] bg-gradient-to-br from-[var(--bg-primary)]/80 via-[var(--bg-primary)]/60 to-[var(--bg-primary)]/40 backdrop-blur-xl shadow-soft p-8 md:p-12">
              {/* Glass reflection effect */}
              <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[var(--color-accent-yellow)]/10 blur-3xl" />
              <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[var(--color-accent-yellow)]/5 blur-3xl" />

              {/* Inner glow border */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--color-accent-yellow)]/5 via-transparent to-[var(--color-accent-yellow)]/5 pointer-events-none" />

              <div className="relative z-10 space-y-6">
                {/* Before Zidwell */}
                <div className="border-b border-[var(--border-color)] pb-6">
                  <span className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">
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
                        className="px-3 py-1.5 bg-[var(--destructive)]/10 text-[var(--destructive)] border border-[var(--destructive)]/30 text-sm rounded-xl transition-all hover:scale-105 hover:bg-[var(--destructive)]/20"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-[var(--text-secondary)] flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--destructive)]" />
                    5+ apps, endless confusion
                  </p>
                </div>

                {/* With Zidwell */}
                <div>
                  <span className="text-sm font-bold text-[var(--color-accent-yellow)] uppercase tracking-wider">
                    With Zidwell
                  </span>
                  <div className="mt-3">
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-ink)] text-white border-2 border-[var(--border-color)] rounded-xl shadow-soft">
                      <span className="font-bold">One Platform.</span>
                      <span className="text-[var(--color-accent-yellow)]">Everything.</span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-[var(--text-secondary)] flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-lemon-green)]" />
                    Clarity, control, and confidence
                  </p>
                </div>

                {/* Additional benefit */}
                <div className="mt-6 pt-4 border-t border-[var(--border-color)]">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-accent-yellow)]/20 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-[var(--color-accent-yellow)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm text-[var(--text-primary)] font-medium">
                      Save up to 15+ hours monthly on financial management
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative corner elements */}
            <div className="absolute -top-4 -right-4 w-6 h-6 bg-[var(--color-accent-yellow)] rounded-full opacity-50" />
            <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-[var(--color-accent-yellow)]/30 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
      `}</style>
    </section>
  );
};

export default WhyDifferent;