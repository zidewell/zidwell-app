// app/components/home-component/HowItWorks.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import TubePlayer from "tubeplayer";

const VIDEO_ID = "DTX24f8IGpQ";

const steps = [
  { n: "01", t: "Create your Zidwell account" },
  { n: "02", t: "Complete KYC" },
  { n: "03", t: "Start For Free, Upgrade to Pro as You Grow" },
];

function VideoPlayOverlay() {
  const [playing, setPlaying] = useState(false);
  if (playing) return null;

  const handlePlay = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setPlaying(true);

    const wrap = (e.currentTarget as HTMLElement).closest("[data-video-wrap]");
    if (!wrap) return;

    const selectors = [
      ".tubeplayer-play-button",
      ".tubeplayer-controls button[aria-label*='Play']",
      ".tubeplayer-controls button[title*='Play']",
      "[data-tube-inline] button",
      "[data-tube-inline] iframe",
      "iframe",
    ];

    for (const sel of selectors) {
      const btn = wrap.querySelector<HTMLElement>(sel);
      if (btn) {
        btn.click();
        if (sel.includes("iframe") && btn instanceof HTMLIFrameElement) {
          try {
            btn.contentWindow?.postMessage(
              JSON.stringify({ event: "command", func: "playVideo" }),
              "*"
            );
          } catch {}
        }
        return;
      }
    }

    const iframe = wrap.querySelector("iframe");
    if (iframe?.contentWindow) {
      try {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "playVideo" }),
          "*"
        );
      } catch {}
    }
  };

  return (
    <button
      type="button"
      aria-label="Play video"
      onClick={handlePlay}
      className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer bg-black/20 hover:bg-black/30 transition-colors"
    >
      <span className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/30" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-float">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-7 w-7 ml-0.5 text-ink"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  );
}

export function HowItWorks() {
  const lineRef = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);

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

            <div className="relative">
              {/* rotation removed — was rotate-[-2deg] */}
              <div className="sticky top-24 squircle-lg overflow-hidden border border-border shadow-float bg-black">
                <div className="relative w-full aspect-video" data-video-wrap>
                  <div
                    data-tube-inline={VIDEO_ID}
                    data-tube-theme="dark"
                    data-tube-controls="play,progress,time,mute,volume,fullscreen"
                    data-tube-autoplay="false"
                    className="absolute inset-0 h-full w-full"
                  />
                  <VideoPlayOverlay />
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

                    {i === 1 && (
                      // rotation removed — was rotate-[-2deg]
                      <div className="mt-4 w-full squircle-sm overflow-hidden border border-border shadow-float bg-black">
                        <div
                          className="relative w-full aspect-video"
                          data-video-wrap
                        >
                          <div
                            data-tube-inline={VIDEO_ID}
                            data-tube-theme="dark"
                            data-tube-controls="play,progress,time,mute,volume,fullscreen"
                            data-tube-autoplay="false"
                            className="absolute inset-0 h-full w-full"
                          />
                          <VideoPlayOverlay />
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