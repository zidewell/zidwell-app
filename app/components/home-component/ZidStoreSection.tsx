// app/components/home-component/ZidStoreSection.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Store, ArrowRight, Play, ExternalLink } from "lucide-react";
import TubePlayer from "tubeplayer";

const ZIDSTORE_HOST = process.env.NEXT_PUBLIC_ZIDSTORE_HOST;
const VIDEO_URL = "https://youtu.be/iGCQ8AGhuS8";
const VIDEO_ID = "iGCQ8AGhuS8";

const getZidStoreHref = (): { href: string; external: boolean } => {
  if (process.env.NODE_ENV === "development" || !ZIDSTORE_HOST) {
    return { href: "/online-store", external: false };
  }
  return { href: `https://${ZIDSTORE_HOST}`, external: true };
};

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

export function ZidStoreSection() {
  const zidStore = getZidStoreHref();

  useEffect(() => {
    TubePlayer.init();
  }, []);

  return (
    <section id="zidstore" className="py-24 sm:py-32 bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-yellow)]/15 px-3 py-1.5 text-xs font-medium text-(--text-primary)">
              <Store className="h-3.5 w-3.5 text-[var(--color-accent-yellow)]" />
              New · ZidStore
            </span>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-(--text-primary)">
              The Shopify alternative for African businesses.
            </h2>
            <p className="mt-4 text-(--text-secondary)">
              Launch your own online store, sell to customers across Africa and
              beyond, and get paid — all wired into your Zidwell books.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={zidStore.href}
                {...(zidStore.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[var(--color-accent-yellow)] text-[var(--color-ink)] text-sm font-semibold hover:opacity-90 transition shadow-float"
              >
                Explore ZidStore <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={VIDEO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-(--bg-primary) border border-(--border-color) text-sm font-semibold text-(--text-primary) hover:bg-[var(--bg-secondary)] transition"
              >
                <Play className="h-4 w-4 text-[var(--color-lemon-green)]" />
                Watch tutorial
                <ExternalLink className="h-3.5 w-3.5 text-(--text-secondary)" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="squircle-lg overflow-hidden border border-(--border-color) shadow-float bg-black">
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
      </div>
    </section>
  );
}