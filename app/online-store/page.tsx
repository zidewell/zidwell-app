// app/online-store/page.tsx
"use client";

import { motion } from "framer-motion";
import { Suspense, useEffect, useState } from "react";
import {
  ArrowRight,
  Store,
  Tag,
  Link2,
  ShieldCheck,
  Wallet,
  BookOpen,
  Receipt,
  Globe,
  Banknote,
  Building2,
  FileSpreadsheet,
  Check,
  Minus,
  Play,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ZidStorePricing } from "../components/home-component/ZidStorePricing";

const heading = "font-['Space_Grotesk',sans-serif]";

const VIDEO_URL = "https://youtu.be/iGCQ8AGhuS8";
const VIDEO_ID = "iGCQ8AGhuS8";

const features = [
  {
    icon: Store,
    title: "Online Store",
    desc: "Create a beautiful online store for your products and services.",
  },
  {
    icon: Tag,
    title: "Product Pages",
    desc: "Create individual product pages you can share anywhere.",
  },
  {
    icon: Link2,
    title: "Payment Links",
    desc: "Share payment links through WhatsApp, Instagram, social media or anywhere else.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    desc: "Receive secure payments from your customers.",
  },
  {
    icon: Wallet,
    title: "Store Wallet",
    desc: "Manage money generated from your online store.",
  },
  {
    icon: BookOpen,
    title: "Business Finances",
    desc: "Connect your sales with bookkeeping and financial records.",
  },
  {
    icon: Receipt,
    title: "Tax Management",
    desc: "Keep track of your business tax obligations.",
  },
];

const fragmented = [
  "Store builder",
  "Payment provider",
  "Bank account",
  "Spreadsheet",
  "Accounting software",
  "Tax tools",
  "Customer management",
];

const steps = [
  {
    num: "01",
    title: "Create your store",
    desc: "Set up your store and add your business information.",
  },
  {
    num: "02",
    title: "Add your products",
    desc: "Upload products, images, descriptions and prices.",
  },
  {
    num: "03",
    title: "Share your store",
    desc: "Share your store, product pages and payment links with customers.",
  },
  {
    num: "04",
    title: "Get paid",
    desc: "Customers pay securely and you manage your sales and finances from Zidwell.",
  },
];

const trust = [
  { icon: ShieldCheck, label: "Secure payments" },
  { icon: Banknote, label: "Naira payments" },
  { icon: Globe, label: "International customers" },
  { icon: Building2, label: "Business banking" },
  { icon: FileSpreadsheet, label: "Financial records" },
];

const FloatingCard = ({
  label,
  value,
  className,
  delay = 0,
  accent = "yellow",
}: {
  label: string;
  value: string;
  className?: string;
  delay?: number;
  accent?: "yellow" | "gold" | "plain";
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className={`rounded-[22px] bg-(--bg-primary) px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-(--border-color) dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] ${
      className || ""
    }`}
  >
    <div className="flex items-center gap-2">
      <span
        className={`h-2 w-2 rounded-full ${
          accent === "gold"
            ? "bg-(--color-accent-yellow)"
            : accent === "plain"
              ? "bg-(--text-primary)"
              : "bg-(--color-accent-yellow)"
        }`}
      />
      <p className="text-[12px] font-semibold uppercase tracking-wide text-(--text-secondary)">
        {label}
      </p>
    </div>
    <p
      className={`${heading} mt-1 text-[19px] font-bold text-(--text-primary)`}
    >
      {value}
    </p>
  </motion.div>
);

function VideoBlock({
  videoId,
  className = "",
}: {
  videoId: string;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [playerId] = useState(
    () => `zid-inline-${Math.random().toString(36).substring(2, 11)}`,
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const mod = await import("tubeplayer");
        if (cancelled) return;
        const TubePlayer = (mod as any).default ?? mod;
        TubePlayer?.init?.();
      } catch (err) {
        console.warn("[VideoBlock] TubePlayer init failed:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [playerId]);

  const handlePlay = async () => {
    try {
      const mod = await import("tubeplayer");
      const TubePlayer = (mod as any).default ?? mod;
      const player = TubePlayer?.getPlayer?.(playerId);
      if (player && typeof player.play === "function") {
        player.play();
      }
    } catch (err) {
      console.warn("[VideoBlock] TubePlayer.play failed:", err);
    }
    setPlaying(true);
  };

  return (
    <div
      className={`overflow-hidden rounded-[28px] bg-black shadow-[0_24px_60px_rgba(0,0,0,0.35)] ring-1 ring-white/10 ${className}`}
    >
      <div className="relative w-full aspect-video">
        <div
          id={playerId}
          data-tube-inline={videoId}
          data-tube-theme="dark"
          data-tube-controls="play,progress,time,mute,volume,fullscreen"
          data-tube-autoplay="false"
          className="absolute inset-0 h-full w-full"
        />

        {!playing && (
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
        )}
      </div>
    </div>
  );
}

function InlineFooter() {
  return (
    <footer className="border-t border-(--border-color) bg-(--bg-secondary)">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6 sm:py-8">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <Image
            src="/logo.png"
            alt="Zidwell logo"
            width={32}
            height={32}
            className="h-6 w-6 object-contain sm:h-7 sm:w-7"
          />
          <span className="text-sm font-bold uppercase tracking-tight text-(--text-primary) sm:text-base">
            Zidwell
          </span>
        </Link>
        <p className="text-xs text-(--text-secondary) sm:text-sm">
          © {new Date().getFullYear()} Zidwell. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default function Landing() {
  const router = useRouter();

  const openTutorial = () => {
    window.open(VIDEO_URL, "_blank", "noopener,noreferrer");
  };

  const scrollToPricing = () => {
    document.getElementById("zidstore-pricing")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="min-h-screen bg-(--bg-primary) font-['Be_Vietnam_Pro',sans-serif] text-(--text-primary) antialiased">
      <nav className="sticky top-0 z-50 border-b border-(--border-color) bg-(--bg-primary)/90 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo.png"
              alt="Zidwell Logo"
              width={49}
              height={40}
              className="w-10 object-contain transition-transform group-hover:scale-105"
            />
            <span className="text-xl font-bold tracking-tight text-(--text-primary) uppercase">
              Zidwell
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={openTutorial}
              className="hidden cursor-pointer rounded-3xl px-4 py-2.5 text-[15px] font-semibold text-(--text-secondary) hover:text-(--text-primary) sm:inline-flex"
            >
              Watch Tutorial
            </button>
            <button
              onClick={() =>
                router.push("/dashboard/services/payment/dashboard")
              }
              className="cursor-pointer rounded-3xl bg-(--color-accent-yellow) px-6 py-2 font-bold text-(--color-ink) transition-colors hover:bg-[#e6a800]"
            >
              Create your store
            </button>
          </div>
        </div>
      </nav>

      <header className="mx-auto max-w-[1200px] px-5 pb-6 pt-12 md:px-8 md:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-(--bg-secondary) px-4 py-2 text-[13px] font-bold uppercase tracking-wide text-(--text-secondary)">
              Built for African commerce
            </span>
            <h1
              className={`${heading} mt-6 text-[42px] font-bold leading-[1.03] tracking-tight text-(--text-primary) md:text-[64px]`}
            >
              The simplified Shopify alternative for African businesses.
            </h1>
            <p
              className={`${heading} mt-5 text-[20px] font-bold leading-snug text-(--text-primary) md:text-[24px]`}
            >
              Create your store. Sell your products. Get paid. Manage your
              money.
            </p>
            <p className="mt-4 max-w-xl text-[16px] font-medium leading-relaxed text-(--text-secondary) md:text-[17px]">
              No complicated setup. Start free, then upgrade as you grow — with
              simple, transparent plans built for African businesses. See the
              exact pricing below.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() =>
                  router.push("/dashboard/services/payment/dashboard")
                }
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-3xl bg-(--color-accent-yellow) px-8 py-4 text-[17px] font-bold text-(--color-ink) transition-colors hover:bg-[#e6a800]"
              >
                Create your store <ArrowRight className="h-[18px] w-[18px]" />
              </button>
              <button
                onClick={scrollToPricing}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-3xl border border-(--border-color) px-8 py-4 text-[17px] font-bold text-(--text-primary) transition-colors hover:border-(--text-primary)"
              >
                See Pricing
              </button>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] font-semibold text-(--text-secondary)">
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-(--color-accent-yellow)" /> Free
                Starter plan
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-(--color-accent-yellow)" />{" "}
                Upgrade anytime
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-(--color-accent-yellow)" /> Naira
                &amp; international payments
              </span>
            </div>
          </motion.div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] bg-(--bg-secondary)">
                <Image
                  src="/online-store-img/hero-entrepreneur.jpg"
                  alt="African fashion entrepreneur in her boutique holding a phone"
                  fill
                  priority
                  sizes="(max-width: 1024px) 50vw, 300px"
                  className="object-cover"
                />
              </div>
              <div className="grid gap-4">
                <div className="relative aspect-square overflow-hidden rounded-[28px] bg-(--bg-secondary)">
                  <Image
                    src="/online-store-img/beauty-entrepreneur.jpg"
                    alt="African beauty entrepreneur with her skincare products"
                    fill
                    sizes="(max-width: 1024px) 25vw, 150px"
                    className="object-cover"
                  />
                </div>
                <div className="relative aspect-square overflow-hidden rounded-[28px] bg-(--bg-secondary)">
                  <Image
                    src="/online-store-img/payment-customer.jpg"
                    alt="Customer making a digital payment at an African shop"
                    fill
                    sizes="(max-width: 1024px) 25vw, 150px"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            <FloatingCard
              label="Payment received"
              value="₦125,000"
              className="absolute -left-3 top-8 md:-left-8"
              delay={0.3}
            />
            <FloatingCard
              label="New order"
              value="₦85,000"
              className="absolute -right-2 bottom-24 md:-right-6"
              delay={0.45}
              accent="plain"
            />
            <div className="absolute -bottom-5 left-6 rounded-[22px] bg-[#191919] px-5 py-3 text-white shadow-[0_16px_40px_rgba(0,0,0,0.2)] ring-1 ring-white/10">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-white/60">
                Store
              </p>
              <p className={`${heading} text-[16px] font-bold`}>
                amaka.zidwell.com
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto mt-20 max-w-[1200px] px-5 md:mt-28 md:px-8">
        <div className="rounded-[40px] bg-[#191919] p-8 text-white md:p-14">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.25fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-white/80">
                <Play className="h-3.5 w-3.5 text-(--color-accent-yellow)" />
                Tutorial
              </span>
              <h2
                className={`${heading} mt-5 text-[32px] font-bold leading-[1.08] tracking-tight md:text-[42px]`}
              >
                Watch how to set up your ZidStore in minutes.
              </h2>
              <p className="mt-4 text-[16px] font-medium leading-relaxed text-white/70 md:text-[17px]">
                The complete walkthrough — from signing up and activating your
                store, to uploading products, sharing your link and getting
                paid. No guesswork.
              </p>
              <div className="mt-6">
                <a
                  href={VIDEO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-3xl bg-(--color-accent-yellow) px-7 py-3.5 text-[16px] font-bold text-(--color-ink) transition-colors hover:bg-[#e6a800]"
                >
                  <Play className="h-[18px] w-[18px]" />
                  Watch on YouTube
                  <ExternalLink className="h-[14px] w-[14px]" />
                </a>
              </div>
            </div>

            <div>
              <VideoBlock videoId={VIDEO_ID} />
              <p className="mt-3 text-center text-[13px] font-medium text-white/50">
                ZidStore tutorial · How to set it up
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-[1200px] px-5 md:mt-32 md:px-8">
        <div className="rounded-[40px] bg-(--bg-secondary) p-8 md:p-14">
          <h2
            className={`${heading} max-w-2xl text-[32px] font-bold leading-[1.08] tracking-tight text-(--text-primary) md:text-[46px]`}
          >
            Selling online shouldn&apos;t be that complicated.
          </h2>
          <p className="mt-4 max-w-2xl text-[16px] font-medium leading-relaxed text-(--text-secondary) md:text-[17px]">
            African businesses shouldn&apos;t have to stitch together different
            tools for their storefront, payments, customers and finances.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            {fragmented.map((f, i) => (
              <div key={f} className="flex items-center gap-3">
                <span className="rounded-3xl border border-dashed border-(--border-color) bg-(--bg-primary) px-4 py-3 text-[14px] font-semibold text-(--text-secondary)">
                  {f}
                </span>
                {i < fragmented.length - 1 && (
                  <span className="text-[18px] font-bold text-(--text-secondary)/40">
                    +
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-start gap-4 rounded-[28px] bg-(--bg-primary) p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4)] md:flex-row md:items-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-3xl bg-(--color-accent-yellow)/15">
              <Store className="h-5 w-5 text-(--color-accent-yellow)" />
            </span>
            <p
              className={`${heading} text-[22px] font-bold tracking-tight text-(--text-primary) md:text-[28px]`}
            >
              Zidwell brings it together.
            </p>
            <span className="text-[15px] font-medium text-(--text-secondary) md:ml-auto">
              One platform. One dashboard. One login.
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-[1200px] px-5 md:mt-32 md:px-8">
        <h2
          className={`${heading} max-w-3xl text-[32px] font-bold leading-[1.08] tracking-tight text-(--text-primary) md:text-[46px]`}
        >
          Everything you need to sell and manage your business online.
        </h2>
        <p className="mt-4 max-w-2xl text-[16px] font-medium text-(--text-secondary) md:text-[17px]">
          Zidwell is one unified platform for your storefront, your payments and
          the money behind your business.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="rounded-[28px] border border-(--border-color) bg-(--bg-primary) p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_12px_36px_rgba(0,0,0,0.07)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_12px_36px_rgba(0,0,0,0.5)]"
            >
              <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-3xl bg-(--bg-secondary)">
                <f.icon
                  className="h-[20px] w-[20px] text-(--text-primary)"
                  strokeWidth={1.6}
                />
              </span>
              <h3
                className={`${heading} text-[19px] font-bold tracking-tight text-(--text-primary)`}
              >
                {f.title}
              </h3>
              <p className="mt-2 text-[15px] font-medium leading-relaxed text-(--text-secondary)">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-[1200px] px-5 md:mt-32 md:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative">
            <div className="relative aspect-[5/4] overflow-hidden rounded-[36px] bg-(--bg-secondary)">
              <Image
                src="/online-store-img/showcase-owner.jpg"
                alt="African business owner holding a phone showing his Zidwell online store"
                fill
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover"
              />
            </div>
            <FloatingCard
              label="New order"
              value="₦85,000"
              className="absolute -left-4 top-10"
              delay={0.1}
            />
            <FloatingCard
              label="Payment received"
              value="₦125,000"
              className="absolute -right-4 top-1/3"
              delay={0.2}
            />
            <FloatingCard
              label="Store views"
              value="2,480"
              className="absolute -left-2 bottom-16"
              delay={0.3}
              accent="gold"
            />
            <FloatingCard
              label="New customer"
              value="Amaka Bello"
              className="absolute -right-3 -bottom-4"
              delay={0.4}
              accent="plain"
            />
          </div>

          <div>
            <h2
              className={`${heading} text-[32px] font-bold leading-[1.08] tracking-tight text-(--text-primary) md:text-[46px]`}
            >
              African commerce meets premium fintech.
            </h2>
            <p className="mt-4 text-[16px] font-medium leading-relaxed text-(--text-secondary) md:text-[17px]">
              Your storefront, orders, customers and money in one clean
              dashboard — designed for how business is really done across
              Africa.
            </p>

            <div className="mt-10">
              <p
                className={`${heading} text-[19px] font-bold text-(--text-primary)`}
              >
                Built for businesses selling in Africa and to the world.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {trust.map((t) => (
                  <span
                    key={t.label}
                    className="inline-flex items-center gap-2 rounded-3xl bg-(--bg-secondary) px-4 py-2.5 text-[14px] font-semibold text-(--text-primary)"
                  >
                    <t.icon
                      className="h-4 w-4 text-(--text-secondary)"
                      strokeWidth={1.6}
                    />{" "}
                    {t.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="relative h-40 overflow-hidden rounded-[24px] bg-(--bg-secondary)">
                <Image
                  src="/online-store-img/food-entrepreneur.jpg"
                  alt="African juice and food business owner behind his counter"
                  fill
                  sizes="(max-width: 1024px) 50vw, 260px"
                  className="object-cover"
                />
              </div>
              <div className="relative h-40 overflow-hidden rounded-[24px] bg-(--bg-secondary)">
                <Image
                  src="/online-store-img/beauty-entrepreneur.jpg"
                  alt="African beauty entrepreneur with her product line"
                  fill
                  sizes="(max-width: 1024px) 50vw, 260px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-[1200px] px-5 md:mt-32 md:px-8">
        <h2
          className={`${heading} text-[32px] font-bold leading-[1.08] tracking-tight text-(--text-primary) md:text-[46px]`}
        >
          From idea to sale in minutes.
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="relative rounded-[28px] bg-(--bg-secondary) p-6"
            >
              <p
                className={`${heading} text-[14px] font-bold tracking-wide text-(--color-accent-yellow)`}
              >
                {s.num}
              </p>
              <h3
                className={`${heading} mt-3 text-[19px] font-bold tracking-tight text-(--text-primary)`}
              >
                {s.title}
              </h3>
              <p className="mt-2 text-[15px] font-medium leading-relaxed text-(--text-secondary)">
                {s.desc}
              </p>
              {i < steps.length - 1 && (
                <ArrowRight className="absolute right-[-14px] top-1/2 hidden h-5 w-5 -translate-y-1/2 text-(--text-secondary)/40 md:block" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      <Suspense
        fallback={
          <div className="py-24 text-center text-(--text-secondary)">
            Loading pricing…
          </div>
        }
      >
        <ZidStorePricing />
      </Suspense>

      <section className="mx-auto mt-24 max-w-[1200px] px-5 md:mt-32 md:px-8">
        <h2
          className={`${heading} text-[32px] font-bold leading-[1.08] tracking-tight text-(--text-primary) md:text-[46px]`}
        >
          Zidwell vs. Shopify
        </h2>
        <p className="mt-4 max-w-2xl text-[16px] font-medium text-(--text-secondary) md:text-[17px]">
          Powerful enough to sell online. Simple enough to get started quickly.
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_1.15fr]">
          <div className="rounded-[32px] border border-(--border-color) bg-(--bg-primary) p-7">
            <p
              className={`${heading} text-[22px] font-bold tracking-tight text-(--text-primary)`}
            >
              Shopify
            </p>
            <p className="mt-2 text-[15px] font-medium text-(--text-secondary)">
              A powerful global ecommerce ecosystem with a huge app marketplace.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Online store builder",
                "Global ecommerce ecosystem",
                "App marketplace for extras",
                "Payments and finance handled by third-party tools",
                "Setup designed for Western markets first",
              ].map((t) => (
                <li
                  key={t}
                  className="flex items-start gap-3 text-[15px] font-medium text-(--text-secondary)"
                >
                  <Minus className="mt-0.5 h-4 w-4 shrink-0 text-(--text-secondary)/50" />{" "}
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[32px] bg-[#191919] p-7 text-white shadow-[0_24px_60px_rgba(0,0,0,0.18)] ring-1 ring-white/10 md:p-9">
            <div className="flex items-center gap-3">
              <p className={`${heading} text-[24px] font-bold tracking-tight`}>
                Zidwell
              </p>
              <span className="rounded-full bg-(--color-accent-yellow) px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-[#191919]">
                Built for Africa
              </span>
            </div>
            <p className="mt-2 text-[15px] font-medium text-white/70">
              Everything a Nigerian or African business needs to sell and manage
              money — in one place.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Online store",
                "Nigerian & African payments",
                "Store Wallet",
                "Business Account",
                "Bookkeeping",
                "Tax management",
                "Save-to-Pay",
                "Free Starter plan",
              ].map((t) => (
                <li
                  key={t}
                  className="flex items-start gap-3 text-[15px] font-semibold"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-(--color-accent-yellow)" />{" "}
                  {t}
                </li>
              ))}
            </ul>
            <button
              onClick={() =>
                router.push("/dashboard/services/payment/dashboard")
              }
              className="mt-8 inline-flex cursor-pointer items-center gap-2 rounded-3xl bg-(--color-accent-yellow) px-7 py-3.5 text-[16px] font-bold text-[#191919] hover:bg-[#e6a800]"
            >
              Start Now <ArrowRight className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-[1200px] px-5 pb-24 md:mt-32 md:px-8">
        <div className="rounded-[40px] bg-(--bg-secondary) p-10 text-center md:p-16">
          <h2
            className={`${heading} mx-auto max-w-2xl text-[32px] font-bold leading-[1.08] tracking-tight text-(--text-primary) md:text-[46px]`}
          >
            Start selling online today.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] font-medium text-(--text-secondary) md:text-[17px]">
            Start free on the Starter plan, then upgrade as you grow. See the
            pricing section above for every plan and fee.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={() =>
                router.push("/dashboard/services/payment/dashboard")
              }
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-3xl bg-(--color-accent-yellow) px-8 py-4 text-[17px] font-bold text-(--color-ink) hover:bg-[#e6a800]"
            >
              Start Now <ArrowRight className="h-[18px] w-[18px]" />
            </button>
            <button
              onClick={scrollToPricing}
              className="inline-flex cursor-pointer items-center justify-center rounded-3xl border border-(--border-color) bg-(--bg-primary) px-8 py-4 text-[17px] font-bold text-(--text-primary) hover:border-(--text-primary)"
            >
              See Pricing
            </button>
          </div>
        </div>
      </section>

      <InlineFooter />
    </div>
  );
}
