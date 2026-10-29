import Image from "next/image";
import Link from "next/link";
import {
  Landmark,
  FileText,
  Receipt,
  FilePen,
  FolderLock,
  Store,
  Calculator,
  Wallet,
  HeartPulse,
  ClipboardList,
  MonitorCog,
  ArrowRight,
  BookOpen,
} from "lucide-react";

const ZIDSTORE_HOST = process.env.NEXT_PUBLIC_ZIDSTORE_HOST;
const zidStore =
  process.env.NODE_ENV === "development" || !ZIDSTORE_HOST
    ? { href: "/online-store", external: false }
    : { href: `https://${ZIDSTORE_HOST}`, external: true };

/**
 * The 7 core toolkit features — one card each, in orbit-node style.
 * Order mirrors ToolkitOrbit: Store, Bank, Bookkeeping, Tax, Invoice,
 * Multi-signatory (Console), Business Plan.
 */
const featureCards = [
  {
    key: "zidstore",
    icon: Store,
    title: "Online Store",
    desc: "Your own storefront, live in minutes.",
    href: zidStore.href,
    external: zidStore.external,
    tone: "gold" as const,
  },
  {
    key: "bank-account",
    icon: Landmark,
    title: "Business Bank Account",
    desc: "A real account with signatories.",
    href: "/features/bank-account",
    external: false,
    tone: "leaf" as const,
  },
  {
    key: "bookkeeping",
    icon: BookOpen,
    title: "Bookkeeping",
    desc: "Every transaction auto-categorized.",
    href: "/features/bookkeeping",
    external: false,
    tone: "gold" as const,
  },
  {
    key: "tax",
    icon: Calculator,
    title: "Tax Manager",
    desc: "Tax-ready summaries, one click away.",
    href: "/features/tax",
    external: false,
    tone: "leaf" as const,
  },
  {
    key: "invoice",
    icon: FileText,
    title: "Invoice",
    desc: "Send a branded PDF. It self-files when paid.",
    href: "/features/invoice",
    external: false,
    tone: "gold" as const,
  },
  {
    key: "console",
    icon: MonitorCog,
    title: "Multi-signatory",
    desc: "Roles, approvals and a full audit log.",
    href: "/features/console",
    external: false,
    tone: "leaf" as const,
  },
  {
    key: "business-plan",
    icon: ClipboardList,
    title: "Business Plan",
    desc: "A plan template built for African founders.",
    href: "/features/business-plan",
    external: false,
    tone: "gold" as const,
  },
] as const;

export function ToolsBento() {
  return (
    <section id="tools" className="py-28 bg-surface scroll-mt-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-leaf mb-4">
            The toolkit
          </p>
          <h2 className="font-narrow-display text-4xl sm:text-5xl font-semibold tracking-tight">
            Everything your business needs. Nothing it doesn&apos;t.
          </h2>
          <p className="mt-4 text-muted-foreground">
            A bank account, automatic bookkeeping, and every document tool a
            founder actually uses — in one bundle, not eleven subscriptions.
          </p>
        </div>

        {/* Feature grid — 7 cards, orbit-node style */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {featureCards.map((it) => {
            const Icon = it.icon;
            const isGold = it.tone === "gold";

            return (
              <Link
                key={it.key}
                href={it.href}
                {...(it.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="group relative flex flex-col justify-between gap-4 min-h-[180px] squircle-lg bg-background border border-border p-5 sm:p-6
                           hover:border-primary-custom/70 hover:bg-[var(--color-accent-yellow)]/5 hover:-translate-y-1 hover:shadow-float
                           active:translate-y-0 transition-all duration-200
                           outline-none focus-visible:ring-2 focus-visible:ring-primary-custom"
              >
                {/* Icon tile — mirror of orbit node's icon treatment */}
                <span
                  className={`h-12 w-12 rounded-2xl flex items-center justify-center border transition-colors ${
                    isGold
                      ? "bg-[var(--color-accent-yellow)]/15 border-[var(--color-accent-yellow)]/30 group-hover:bg-[var(--color-accent-yellow)]/25"
                      : "bg-leaf/10 border-leaf/25 group-hover:bg-leaf/20"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      isGold ? "text-primary-custom" : "text-leaf"
                    }`}
                  />
                </span>

                {/* Text block */}
                <div>
                  <h3 className="font-display text-base sm:text-lg font-semibold flex items-center gap-1.5 leading-tight">
                    {it.title}
                    <ArrowRight className="h-4 w-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary-custom shrink-0" />
                  </h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    {it.desc}
                  </p>
                </div>
              </Link>
            );
          })}

          {/* 8th cell — "See all" slot keeps the grid balanced (7 cards + 1 CTA) */}
          <Link
            href="#pricing"
            className="group relative flex flex-col items-start justify-between gap-4 min-h-[180px] squircle-lg border border-dashed border-border bg-surface/50 p-5 sm:p-6
                       hover:border-primary-custom/70 hover:bg-[var(--color-accent-yellow)]/5 hover:-translate-y-1 hover:shadow-float
                       active:translate-y-0 transition-all duration-200
                       outline-none focus-visible:ring-2 focus-visible:ring-primary-custom"
          >
            <span className="h-12 w-12 rounded-2xl flex items-center justify-center border border-dashed border-border text-muted-foreground group-hover:border-primary-custom/40 group-hover:text-primary-custom transition-colors">
              <ArrowRight className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-base sm:text-lg font-semibold leading-tight">
                See all tools
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Plus payroll, HMO, contracts, vault and more.
              </p>
            </div>
          </Link>
        </div>

        {/* Secondary "also included" strip — kept below the grid */}
        <div className="mt-8 squircle bg-background border border-border p-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="text-muted-foreground font-medium">Also included:</span>
          {[
            { icon: FilePen, l: "Contracts" },
            { icon: FolderLock, l: "Vault" },
            { icon: Receipt, l: "Receipts" },
            { icon: Wallet, l: "Payroll", addon: true },
            { icon: HeartPulse, l: "HMO", addon: true },
          ].map((it) => {
            const Icon = it.icon;
            return (
              <a
                key={it.l}
                href="#"
                className="inline-flex items-center gap-1.5 text-foreground hover:text-primary-custom hover:underline underline-offset-2 transition-colors cursor-pointer"
              >
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                {it.l}
                {it.addon && (
                  <span className="text-[9px] text-muted-foreground">(add-on)</span>
                )}
              </a>
            );
          })}
          <a
            href="#pricing"
            className="inline-flex items-center gap-1 text-primary-custom font-medium ml-auto hover:underline underline-offset-2 cursor-pointer"
          >
            See plans <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}