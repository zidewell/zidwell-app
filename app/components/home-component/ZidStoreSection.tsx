// app/components/home-component/ZidStoreSection.tsx
"use client";

import { useEffect } from "react";
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

export function ZidStoreSection() {
  const zidStore = getZidStoreHref();

  // Initialize TubePlayer
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
              <div className="relative w-full aspect-video">
                {/* Replace iframe with TubePlayer inline container */}
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
      </div>
    </section>
  );
}