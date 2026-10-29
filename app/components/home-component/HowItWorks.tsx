// app/components/home-component/HowItWorks.tsx
"use client";

import { useEffect, useRef, useState } from "react";
// 1. Import TubePlayer
import TubePlayer from "tubeplayer";
// 2. Import its CSS (critical, otherwise custom controls won't display)

const VIDEO_ID = "DTX24f8IGpQ";

const steps = [
  {
    n: "01",
    t: "Create your Zidwell account",
  },
  {
    n: "02",
    t: "Complete KYC",
  },
  {
    n: "03",
    t: "Start For Free, Upgrade to Pro as You Grow",
  },
];

export function HowItWorks() {
  const lineRef = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);

  // 3. Initialize TubePlayer (after component mounts)
  useEffect(() => {
    TubePlayer.init();
  }, []);

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
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="how" className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-leaf mb-3">
            How it works
          </p>
          <h2 className="font-narrow-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
            3 Steps to Get Started on Zidwell
          </h2>
        </div>

        <div className="relative mt-10 sm:mt-12">
          {/* ===== Desktop ===== */}
          <div className="hidden lg:grid lg:grid-cols-[1fr_560px] lg:gap-12">
            <div className="relative flex min-h-[360px] flex-col justify-between py-2">
              <span
                ref={lineRef}
                aria-hidden
                className="absolute top-2 bottom-2 left-[8px] w-px origin-top"
                style={{
                  backgroundColor: "var(--gold)",
                  opacity: 0.7,
                  transform: inView ? "scaleY(1)" : "scaleY(0)",
                  transition: "transform 1.4s ease-out",
                }}
              />

              {steps.map((s) => (
                <div key={s.n} className="relative flex gap-5">
                  <span
                    className="relative z-10 mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
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
                  <div className="min-w-0 pt-0.5">
                    <p className="text-xs font-mono text-muted-foreground">
                      {s.n}
                    </p>
                    <h3 className="mt-0.5 font-display text-lg font-semibold">
                      {s.t}
                    </h3>
                  </div>
                </div>
              ))}
            </div>

            {/* 4. Replace iframe with TubePlayer inline container */}
            <div className="relative">
              <div className="sticky top-24 rotate-[-2deg] squircle-lg overflow-hidden border border-border shadow-float bg-black">
                <div className="relative w-full aspect-video">
                  <div
                    data-tube-inline={VIDEO_ID}
                    data-tube-theme="dark"
                    data-tube-controls="play,progress,time,mute,volume,fullscreen"
                    data-tube-autoplay="false"
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ===== Mobile ===== */}
          <div className="space-y-8 lg:hidden">
            {steps.map((s, i) => {
              const isLast = i === steps.length - 1;
              return (
                <div key={s.n} className="relative flex gap-5">
                  <div className="relative flex w-4 shrink-0 flex-col items-center">
                    <span
                      className="relative z-10 mt-1 flex h-4 w-4 items-center justify-center rounded-full"
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
                        className="absolute left-1/2 top-5 w-px -translate-x-1/2"
                        style={{
                          backgroundColor: "var(--gold)",
                          opacity: 0.6,
                          bottom: "-2rem",
                        }}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-muted-foreground">
                      {s.n}
                    </p>
                    <h3 className="mt-0.5 font-display text-lg font-semibold">
                      {s.t}
                    </h3>

                    {/* The video only appears on the second step (i === 1) */}
                    {i === 1 && (
                      <div className="mt-4 w-full rotate-[-2deg] squircle-sm overflow-hidden border border-border shadow-float bg-black">
                        <div className="relative w-full aspect-video">
                          <div
                            data-tube-inline={VIDEO_ID}
                            data-tube-theme="dark"
                            data-tube-controls="play,progress,time,mute,volume,fullscreen"
                            data-tube-autoplay="false"
                            className="absolute inset-0 h-full w-full"
                          />
                        </div>
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