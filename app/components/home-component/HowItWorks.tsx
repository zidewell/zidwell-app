// app/components/home-component/HowItWorksNew.tsx
"use client";

import { useEffect,useRef, useState } from "react";

const steps = [
  {
    n: "01",
    t: "Create your Zidwell account",
    d: "You give us your email and business name. That's it. No forms yet.",
  },
  {
    n: "02",
    t: "Complete KYC",
    d: "BVN, CAC (if you have one). No CAC? You can still use every tool except the bank account.",
    img: "https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=800&h=1066&fit=crop",
  },
  {
    n: "03",
    t: "Pick a plan, start your 7-day trial",
    d: "No card. No \u201ctalk to sales.\u201d",
  },
  {
    n: "04",
    t: "If you like it, upgrade",
    d: "If you don\u2019t, walk away with your records exported to CSV.",
  },
];

export function HowItWorks() {
  const lineRef = useRef<SVGPathElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = lineRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="how" className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-leaf mb-3">
            How it works
          </p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
            Four steps. Ten minutes. That&apos;s the whole setup.
          </h2>
        </div>

        <div className="relative mt-10 sm:mt-12">
          {/* ───── Desktop: two-column grid. Left = timeline (dot + content), Right = image ───── */}
          <div className="hidden lg:grid lg:grid-cols-[1fr_320px] lg:gap-10">
            {/* Left column — vertical timeline */}
            <div className="relative">
              {/* Continuous gold connector — one vertical line behind all dots */}
              <span
                aria-hidden
                className="absolute left-[7px] top-2 bottom-2 w-px"
                style={{ backgroundColor: "var(--gold)", opacity: 0.6 }}
              />

              <div className="space-y-8">
                {steps.map((s) => (
                  <div key={s.n} className="relative flex gap-5">
                    {/* Dot */}
                    <span
                      className="relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: "var(--background)",
                        border: "2px solid var(--gold)",
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: "var(--gold)" }}
                      />
                    </span>

                    {/* Content */}
                    <div className="min-w-0 pt-0.5">
                      <p className="text-xs font-mono text-muted-foreground">
                        {s.n}
                      </p>
                      <h3 className="mt-0.5 font-display text-lg font-semibold">
                        {s.t}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-md">
                        {s.d}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Entrance animation overlay */}
              <svg
                aria-hidden
                className="absolute pointer-events-none left-[7px] top-2 h-[calc(100%-1rem)] w-px overflow-visible"
                preserveAspectRatio="none"
              >
                <path
                  ref={lineRef}
                  d="M 0.5 0 L 0.5 100%"
                  pathLength={1}
                  stroke="var(--gold)"
                  strokeWidth="2"
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 1,
                    strokeDashoffset: inView ? 0 : 1,
                    transition: "stroke-dashoffset 1.4s ease-out",
                    opacity: 0.9,
                  }}
                />
              </svg>
            </div>

            {/* Right column — large image (only shown next to the KYC step area) */}
            <div className="relative">
              <div className="sticky top-24 rotate-[-2deg] squircle-lg overflow-hidden border border-border shadow-float">
                <img
                  src={steps[1].img}
                  alt="African founder completing KYC on Zidwell"
                  width={800}
                  height={1066}
                  loading="lazy"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>

          {/* ───── Mobile: stacked rows. Dot + content side by side, image below ───── */}
          <div className="lg:hidden space-y-8">
            {steps.map((s, i) => {
              const isLast = i === steps.length - 1;
              return (
                <div key={s.n} className="relative flex gap-5">
                  {/* Left: dot + connector segment */}
                  <div className="relative flex flex-col items-center shrink-0 w-4">
                    <span
                      className="relative z-10 mt-1 h-4 w-4 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: "var(--background)",
                        border: "2px solid var(--gold)",
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: "var(--gold)" }}
                      />
                    </span>
                    {!isLast && (
                      <span
                        aria-hidden
                        className="absolute top-5 bottom-[-2rem] w-px"
                        style={{ backgroundColor: "var(--gold)", opacity: 0.6 }}
                      />
                    )}
                  </div>

                  {/* Right: content, then image below */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-muted-foreground">
                      {s.n}
                    </p>
                    <h3 className="mt-0.5 font-display text-lg font-semibold">
                      {s.t}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {s.d}
                    </p>
                    {s.img && (
                      <div className="mt-4 rotate-[-2deg] squircle-sm overflow-hidden border border-border shadow-float max-w-[240px]">
                        <img
                          src={s.img}
                          alt="African founder setting up Zidwell"
                          width={600}
                          height={800}
                          loading="lazy"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}