"use client";

import { motion } from "framer-motion";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import Footer from "../components/home-component/Footer";
import Link from "next/link";
import Image from "next/image";

const heading = "font-['Space_Grotesk',sans-serif]";

const features = [
  { icon: Store, title: "Online Store", desc: "Create a beautiful online store for your products and services." },
  { icon: Tag, title: "Product Pages", desc: "Create individual product pages you can share anywhere." },
  { icon: Link2, title: "Payment Links", desc: "Share payment links through WhatsApp, Instagram, social media or anywhere else." },
  { icon: ShieldCheck, title: "Secure Payments", desc: "Receive secure payments from your customers." },
  { icon: Wallet, title: "Store Wallet", desc: "Manage money generated from your online store." },
  { icon: BookOpen, title: "Business Finances", desc: "Connect your sales with bookkeeping and financial records." },
  { icon: Receipt, title: "Tax Management", desc: "Keep track of your business tax obligations." },
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
  { num: "01", title: "Create your store", desc: "Set up your store and add your business information." },
  { num: "02", title: "Add your products", desc: "Upload products, images, descriptions and prices." },
  { num: "03", title: "Share your store", desc: "Share your store, product pages and payment links with customers." },
  { num: "04", title: "Get paid", desc: "Customers pay securely and you manage your sales and finances from Zidwell." },
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
    className={`rounded-[22px] bg-white px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)] ${className || ""}`}
  >
    <div className="flex items-center gap-2">
      <span
        className={`h-2 w-2 rounded-full ${
          accent === "gold" ? "bg-[#FDC020]" : accent === "plain" ? "bg-[#191919]" : "bg-[#FDC020]"
        }`}
      />
      <p className="text-[12px] font-semibold uppercase tracking-wide text-[#6B6B6B]">{label}</p>
    </div>
    <p className={`${heading} mt-1 text-[19px] font-bold text-[#191919]`}>{value}</p>
  </motion.div>
);

const Landing = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white font-['Be_Vietnam_Pro',sans-serif] text-[#191919] antialiased">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[#F0F0F0] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo.png"
              alt="Zidwell Logo"
              width={49}
              height={40}
              className="w-10 object-contain transition-transform group-hover:scale-105"
            />
            <span className="text-xl font-bold tracking-tight text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)] font-['Space_Grotesk','Cy_Grotesk_Key',system-ui,sans-serif] uppercase">
              Zidwell
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/dashboard/services/payment/dashboard")}
              className="hidden rounded-3xl px-4 py-2.5 text-[15px] font-semibold text-[#6B6B6B] hover:text-[#191919] sm:inline-flex"
            >
              Get Early Access
            </button>
            <button
              onClick={() => router.push("/dashboard/services/payment/dashboard")}
              className="rounded-3xl bg-[#191919] px-5 py-2.5 text-[15px] font-bold text-white transition-colors hover:bg-[#000]"
            >
              Create Your Store
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="mx-auto max-w-[1200px] px-5 pb-6 pt-12 md:px-8 md:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#FAFAFA] px-4 py-2 text-[13px] font-bold uppercase tracking-wide text-[#6B6B6B]">
              Built for African commerce
            </span>
            <h1 className={`${heading} mt-6 text-[42px] font-bold leading-[1.03] tracking-tight md:text-[64px]`}>
              The simpler Shopify alternative for African businesses.
            </h1>
            <p className={`${heading} mt-5 text-[20px] font-bold leading-snug text-[#191919] md:text-[24px]`}>
              Create your store. Sell your products. Get paid. Manage your money.
            </p>
            <p className="mt-4 max-w-xl text-[16px] font-medium leading-relaxed text-[#6B6B6B] md:text-[17px]">
              No complicated setup. No monthly subscription. Just pay once to activate your store and a small
              commission when you make a sale.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => router.push("/dashboard/services/payment/dashboard")}
                className="inline-flex items-center justify-center gap-2 rounded-3xl bg-[#FDC020] px-8 py-4 text-[17px] font-bold text-[#191919] transition-colors hover:bg-[#e6a800]"
              >
                Create Your Store <ArrowRight className="h-[18px] w-[18px]" />
              </button>
              <button
                onClick={() => router.push("/dashboard/services/payment/dashboard")}
                className="inline-flex items-center justify-center gap-2 rounded-3xl border border-[#ECECEC] px-8 py-4 text-[17px] font-bold text-[#191919] transition-colors hover:border-[#191919]"
              >
                Get Early Access
              </button>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] font-semibold text-[#6B6B6B]">
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#FDC020]" /> One-time activation</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#FDC020]" /> No monthly fees</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#FDC020]" /> Naira & international payments</span>
            </div>
          </motion.div>

          {/* Visual composition */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] bg-[#FAFAFA]">
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
                <div className="relative aspect-square overflow-hidden rounded-[28px] bg-[#FAFAFA]">
                  <Image
                    src="/online-store-img/beauty-entrepreneur.jpg"
                    alt="African beauty entrepreneur with her skincare products"
                    fill
                    sizes="(max-width: 1024px) 25vw, 150px"
                    className="object-cover"
                  />
                </div>
                <div className="relative aspect-square overflow-hidden rounded-[28px] bg-[#FAFAFA]">
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

            <FloatingCard label="Payment received" value="₦125,000" className="absolute -left-3 top-8 md:-left-8" delay={0.3} />
            <FloatingCard label="New order" value="₦85,000" className="absolute -right-2 bottom-24 md:-right-6" delay={0.45} accent="plain" />
            <div className="absolute -bottom-5 left-6 rounded-[22px] bg-[#191919] px-5 py-3 text-white shadow-[0_16px_40px_rgba(0,0,0,0.2)]">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-white/60">Store</p>
              <p className={`${heading} text-[16px] font-bold`}>amaka.zidwell.com</p>
            </div>
          </div>
        </div>
      </header>

      {/* Problem */}
      <section className="mx-auto mt-24 max-w-[1200px] px-5 md:mt-32 md:px-8">
        <div className="rounded-[40px] bg-[#FAFAFA] p-8 md:p-14">
          <h2 className={`${heading} max-w-2xl text-[32px] font-bold leading-[1.08] tracking-tight md:text-[46px]`}>
            Selling online shouldn't be that complicated.
          </h2>
          <p className="mt-4 max-w-2xl text-[16px] font-medium leading-relaxed text-[#6B6B6B] md:text-[17px]">
            African businesses shouldn't have to stitch together different tools for their storefront, payments,
            customers and finances.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            {fragmented.map((f, i) => (
              <div key={f} className="flex items-center gap-3">
                <span className="rounded-3xl border border-dashed border-[#DCDCDC] bg-white px-4 py-3 text-[14px] font-semibold text-[#6B6B6B]">
                  {f}
                </span>
                {i < fragmented.length - 1 && <span className="text-[18px] font-bold text-[#C9C9C9]">+</span>}
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-start gap-4 rounded-[28px] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] md:flex-row md:items-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-3xl bg-[#FDC020]/15">
              <Store className="h-5 w-5 text-[#FDC020]" />
            </span>
            <p className={`${heading} text-[22px] font-bold tracking-tight md:text-[28px]`}>Zidwell brings it together.</p>
            <span className="text-[15px] font-medium text-[#6B6B6B] md:ml-auto">One platform. One dashboard. One login.</span>
          </div>
        </div>
      </section>

      {/* Value proposition */}
      <section className="mx-auto mt-24 max-w-[1200px] px-5 md:mt-32 md:px-8">
        <h2 className={`${heading} max-w-3xl text-[32px] font-bold leading-[1.08] tracking-tight md:text-[46px]`}>
          Everything you need to sell and manage your business online.
        </h2>
        <p className="mt-4 max-w-2xl text-[16px] font-medium text-[#6B6B6B] md:text-[17px]">
          Zidwell is one unified platform for your storefront, your payments and the money behind your business.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="rounded-[28px] border border-[#F0F0F0] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_12px_36px_rgba(0,0,0,0.07)]"
            >
              <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-3xl bg-[#FAFAFA]">
                <f.icon className="h-[20px] w-[20px] text-[#191919]" strokeWidth={1.6} />
              </span>
              <h3 className={`${heading} text-[19px] font-bold tracking-tight`}>{f.title}</h3>
              <p className="mt-2 text-[15px] font-medium leading-relaxed text-[#6B6B6B]">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* What it looks like */}
      <section className="mx-auto mt-24 max-w-[1200px] px-5 md:mt-32 md:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative">
            <div className="relative aspect-[5/4] overflow-hidden rounded-[36px] bg-[#FAFAFA]">
              <Image
                src="/online-store-img/showcase-owner.jpg"
                alt="African business owner holding a phone showing his Zidwell online store"
                fill
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover"
              />
            </div>
            <FloatingCard label="New order" value="₦85,000" className="absolute -left-4 top-10" delay={0.1} />
            <FloatingCard label="Payment received" value="₦125,000" className="absolute -right-4 top-1/3" delay={0.2} />
            <FloatingCard label="Store views" value="2,480" className="absolute -left-2 bottom-16" delay={0.3} accent="gold" />
            <FloatingCard label="New customer" value="Amaka Bello" className="absolute -right-3 -bottom-4" delay={0.4} accent="plain" />
          </div>

          <div>
            <h2 className={`${heading} text-[32px] font-bold leading-[1.08] tracking-tight md:text-[46px]`}>
              African commerce meets premium fintech.
            </h2>
            <p className="mt-4 text-[16px] font-medium leading-relaxed text-[#6B6B6B] md:text-[17px]">
              Your storefront, orders, customers and money in one clean dashboard — designed for how business is
              really done across Africa.
            </p>

            <div className="mt-10">
              <p className={`${heading} text-[19px] font-bold`}>Built for businesses selling in Africa and to the world.</p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {trust.map((t) => (
                  <span
                    key={t.label}
                    className="inline-flex items-center gap-2 rounded-3xl bg-[#FAFAFA] px-4 py-2.5 text-[14px] font-semibold text-[#191919]"
                  >
                    <t.icon className="h-4 w-4 text-[#6B6B6B]" strokeWidth={1.6} /> {t.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="relative h-40 overflow-hidden rounded-[24px]">
                <Image
                  src="/online-store-img/food-entrepreneur.jpg"
                  alt="African juice and food business owner behind his counter"
                  fill
                  sizes="(max-width: 1024px) 50vw, 260px"
                  className="object-cover"
                />
              </div>
              <div className="relative h-40 overflow-hidden rounded-[24px]">
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

      {/* How it works */}
      <section className="mx-auto mt-24 max-w-[1200px] px-5 md:mt-32 md:px-8">
        <h2 className={`${heading} text-[32px] font-bold leading-[1.08] tracking-tight md:text-[46px]`}>
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
              className="relative rounded-[28px] bg-[#FAFAFA] p-6"
            >
              <p className={`${heading} text-[14px] font-bold tracking-wide text-[#FDC020]`}>{s.num}</p>
              <h3 className={`${heading} mt-3 text-[19px] font-bold tracking-tight`}>{s.title}</h3>
              <p className="mt-2 text-[15px] font-medium leading-relaxed text-[#6B6B6B]">{s.desc}</p>
              {i < steps.length - 1 && (
                <ArrowRight className="absolute right-[-14px] top-1/2 hidden h-5 w-5 -translate-y-1/2 text-[#DCDCDC] md:block" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="mx-auto mt-24 max-w-[1200px] px-5 md:mt-32 md:px-8">
        <h2 className={`${heading} text-[32px] font-bold leading-[1.08] tracking-tight md:text-[46px]`}>
          Zidwell vs. Shopify
        </h2>
        <p className="mt-4 max-w-2xl text-[16px] font-medium text-[#6B6B6B] md:text-[17px]">
          Powerful enough to sell online. Simple enough to get started quickly.
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_1.15fr]">
          <div className="rounded-[32px] border border-[#F0F0F0] bg-white p-7">
            <p className={`${heading} text-[22px] font-bold tracking-tight`}>Shopify</p>
            <p className="mt-2 text-[15px] font-medium text-[#6B6B6B]">
              A powerful global ecommerce ecosystem with a huge app marketplace.
            </p>
            <ul className="mt-6 space-y-3">
              {["Online store builder", "Global ecommerce ecosystem", "App marketplace for extras", "Monthly subscription plans", "Payments and finance handled by third-party tools"].map((t) => (
                <li key={t} className="flex items-start gap-3 text-[15px] font-medium text-[#6B6B6B]">
                  <Minus className="mt-0.5 h-4 w-4 shrink-0 text-[#C9C9C9]" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[32px] bg-[#191919] p-7 text-white shadow-[0_24px_60px_rgba(0,0,0,0.18)] md:p-9">
            <div className="flex items-center gap-3">
              <p className={`${heading} text-[24px] font-bold tracking-tight`}>Zidwell</p>
              <span className="rounded-full bg-[#FDC020] px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-[#191919]">
                Built for Africa
              </span>
            </div>
            <p className="mt-2 text-[15px] font-medium text-white/70">
              Everything a Nigerian or African business needs to sell and manage money — in one place.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {["Online store", "Nigerian & African payments", "Store Wallet", "Business Account", "Bookkeeping", "Tax management", "Save-to-Pay", "One-time activation, no subscription"].map((t) => (
                <li key={t} className="flex items-start gap-3 text-[15px] font-semibold">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FDC020]" /> {t}
                </li>
              ))}
            </ul>
            <button
              onClick={() => router.push("/dashboard/services/payment/dashboard")}
              className="mt-8 inline-flex items-center gap-2 rounded-3xl bg-[#FDC020] px-7 py-3.5 text-[16px] font-bold text-[#191919] hover:bg-[#e6a800]"
            >
              Create Your Store <ArrowRight className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-24 max-w-[1200px] px-5 pb-24 md:mt-32 md:px-8">
        <div className="rounded-[40px] bg-[#FAFAFA] p-10 text-center md:p-16">
          <h2 className={`${heading} mx-auto max-w-2xl text-[32px] font-bold leading-[1.08] tracking-tight md:text-[46px]`}>
            Start selling online today.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] font-medium text-[#6B6B6B] md:text-[17px]">
            Pay once to activate your store. Keep the rest of your money moving.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={() => router.push("/dashboard/services/payment/dashboard")}
              className="inline-flex items-center justify-center gap-2 rounded-3xl bg-[#FDC020] px-8 py-4 text-[17px] font-bold text-[#191919] hover:bg-[#e6a800]"
            >
              Create Your Store <ArrowRight className="h-[18px] w-[18px]" />
            </button>
            <button
              onClick={() => router.push("/dashboard/services/payment/dashboard")}
              className="inline-flex items-center justify-center rounded-3xl border border-[#ECECEC] bg-white px-8 py-4 text-[17px] font-bold text-[#191919] hover:border-[#191919]"
            >
              Get Early Access
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;