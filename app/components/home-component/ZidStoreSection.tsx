// app/components/home-component/ZidStoreSection.tsx
"use client";

import { ArrowRight, ShoppingBag, Globe, Truck, ShieldCheck, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function ZidStoreSection() {
  return (
    <section
      id="zidstore"
      // Always-dark section: literal dark bg so it stays dark in both modes
      className="py-28 bg-[#0f0f0f] text-white relative overflow-hidden"
    >
      <div className="absolute inset-0 grain-bg opacity-40" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left — copy */}
          <div className="lg:col-span-6">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border border-white/15 bg-white/5 text-white/80">
              <ShoppingBag className="h-3.5 w-3.5" style={{ color: "var(--gold)" }} />
              New · ZidStore
            </span>

            <h2 className="mt-6 font-narrow-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
              The{" "}
              <span style={{ color: "var(--gold)" }}>Shopify alternative</span>{" "}
              for African businesses.
            </h2>

            <p className="mt-5 text-base sm:text-lg text-white/70 leading-relaxed max-w-xl">
              Launch a storefront in minutes. Accept payments in Naira, sell
              physical or digital products, and manage inventory — all from the
              same dashboard you already use to run your books.
            </p>

            <ul className="mt-8 space-y-3 text-sm text-white/80">
              {[
                { icon: Globe, t: "Custom domain + mobile-first storefront" },
                { icon: Truck, t: "Built-in delivery and logistics tracking" },
                { icon: ShieldCheck, t: "Paystack, Flutterwave & bank transfer built in" },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <li key={f.t} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                      <Icon className="h-3.5 w-3.5" style={{ color: "var(--gold)" }} />
                    </span>
                    {f.t}
                  </li>
                );
              })}
            </ul>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/online-store"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-3.5 text-sm font-semibold transition hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: "var(--gold)", color: "var(--ink)" }}
              >
                Visit ZidStore <ExternalLink className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-3.5 text-sm font-semibold border border-white/20 bg-white/5 text-white transition hover:bg-white/10 cursor-pointer"
              >
                Start your store <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <p className="mt-6 text-xs text-white/50">
              Everything you need to sell online — live in under 5 minutes.
            </p>
          </div>

          {/* Right — video + African merchant photo */}
          <div className="lg:col-span-6">
            <div className="relative">
              <div className="rotate-[-1.5deg] squircle-lg overflow-hidden border border-white/15 shadow-float bg-black">
                <div className="relative w-full aspect-video">
                  <iframe
                    src="https://www.youtube.com/embed/iGCQ8AGhuS8"
                    title="How to set up ZidStore"
                    className="absolute inset-0 h-full w-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Floating African merchant photo card */}
              <div className="hidden sm:block absolute -bottom-10 -left-6 w-56 squircle-lg overflow-hidden border border-white/15 shadow-float bg-black">
                <Image
                  src="https://images.pexels.com/photos/6956903/pexels-photo-6956903.jpeg?auto=compress&cs=tinysrgb&w=640"
                  alt="African woman running her online store with ZidStore"
                  width={400}
                  height={300}
                  className="h-40 w-full object-cover"
                />
                <div className="p-3">
                  <p className="text-[10px] font-medium text-white/60">Live storefront</p>
                  <p className="text-sm font-semibold text-white">mara-home.zidstore.com</p>
                  <p className="text-[10px] text-white/50 mt-0.5">₦0 setup · Live in 5 minutes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}