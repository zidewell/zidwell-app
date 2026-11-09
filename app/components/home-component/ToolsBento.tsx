// app/components/home-component/ToolsBento.tsx
import Link from "next/link";
import {
  BookOpen,
  FileText,
  Receipt,
  FileSignature,
  FileSpreadsheet,
  Wallet,
  ArrowLeftRight,
  Phone,
  Wifi,
  Tv,
  FolderLock,
  MapPin,
  Target,
  Store,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";

const ZIDSTORE_HOST = process.env.NEXT_PUBLIC_ZIDSTORE_HOST;
const zidStore =
  process.env.NODE_ENV === "development" || !ZIDSTORE_HOST
    ? { href: "/online-store", external: false }
    : { href: `https://${ZIDSTORE_HOST}`, external: true };

type FeatureCard = {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  href: string;
  external: boolean;
  tone: "gold" | "leaf";
  badge?: "new" | "soon";
};

const featureCards: FeatureCard[] = [
  {
    key: "bookkeeping",
    icon: BookOpen,
    title: "Bookkeeping",
    desc: "Track daily income & expenses.",
    href: "/features/bookkeeping",
    external: false,
    tone: "gold",
  },
  {
    key: "invoice",
    icon: FileText,
    title: "Invoice",
    desc: "Create & send branded invoices.",
    href: "/features/invoice",
    external: false,
    tone: "gold",
  },
  {
    key: "receipt",
    icon: Receipt,
    title: "Receipt",
    desc: "Issue digital receipts instantly.",
    href: "/features/receipt",
    external: false,
    tone: "leaf",
  },
  {
    key: "contracts",
    icon: FileSignature,
    title: "Contracts",
    desc: "Manage business contracts.",
    href: "/features/contracts",
    external: false,
    tone: "gold",
  },
  {
    key: "tax",
    icon: FileSpreadsheet,
    title: "Tax Manager",
    desc: "File your taxes, tax-ready summaries.",
    href: "/features/tax",
    external: false,
    tone: "leaf",
  },
  {
    key: "wallet",
    icon: Wallet,
    title: "Business Account",
    desc: "Provide by our banking partners.",
    href: "/features/wallet",
    external: false,
    tone: "gold",
  },
  {
    key: "transfer",
    icon: ArrowLeftRight,
    title: "Transfer",
    desc: "Send money instantly.",
    href: "/features/transfer",
    external: false,
    tone: "leaf",
  },
  {
    key: "airtime",
    icon: Phone,
    title: "Buy Airtime",
    desc: "Recharge any network.",
    href: "/features/airtime",
    external: false,
    tone: "gold",
  },
  {
    key: "data",
    icon: Wifi,
    title: "Buy Data",
    desc: "Purchase data bundles.",
    href: "/features/data",
    external: false,
    tone: "leaf",
  },
  {
    key: "cable-tv",
    icon: Tv,
    title: "Cable TV",
    desc: "Pay TV subscription.",
    href: "/features/cable-tv",
    external: false,
    tone: "gold",
  },
  {
    key: "zidstore",
    icon: Store,
    title: "Online Store",
    desc: "Own an online store, sell globally.",
    href: zidStore.href,
    external: zidStore.external,
    tone: "gold",
    badge: "new",
  },
  {
    key: "document-vault",
    icon: FolderLock,
    title: "Document Vault",
    desc: "Store sensitive financial documents.",
    href: "#",
    external: false,
    tone: "leaf",
    badge: "soon",
  },
  {
    key: "virtual-office",
    icon: MapPin,
    title: "Virtual Office",
    desc: "Get a real mailing address.",
    href: "#",
    external: false,
    tone: "gold",
    badge: "soon",
  },
  {
    key: "business-plan",
    icon: Target,
    title: "Business Plan",
    desc: "Set goals & stay accountable.",
    href: "#",
    external: false,
    tone: "leaf",
    badge: "soon",
  },
];

export function ToolsBento() {
  return (
    <section id="tools" className="py-28 bg-surface scroll-mt-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <h2 className="font-narrow-display text-4xl sm:text-5xl font-semibold tracking-tight">
            Everything a Business Needs<br />
            to Run Smoothly Everyday.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Business operations tools end to end on one plartform with your team having access as well
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {featureCards.map((it) => {
            const Icon = it.icon;
            const isGold = it.tone === "gold";
            const isSoon = it.badge === "soon";
            const isNew = it.badge === "new";

            const cardClass = `
              group relative flex flex-col justify-between gap-4 min-h-[180px]
              squircle-lg bg-background border p-5 sm:p-6
              transition-all duration-200
              outline-none focus-visible:ring-2 focus-visible:ring-primary-custom
              ${
                isSoon
                  ? "border-amber-200/70 dark:border-amber-500/25 opacity-90 cursor-not-allowed"
                  : isNew
                    ? "border-amber-200 dark:border-amber-500/30 ring-1 ring-amber-100 dark:ring-amber-500/10 hover:border-primary-custom/70 hover:bg-[var(--color-accent-yellow)]/5 hover:-translate-y-1 hover:shadow-float active:translate-y-0"
                    : "border-border hover:border-primary-custom/70 hover:bg-[var(--color-accent-yellow)]/5 hover:-translate-y-1 hover:shadow-float active:translate-y-0"
              }
            `;

            const content = (
              <>
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  {isSoon && (
                    <span className="flex items-center gap-1 px-1.5 py-[2px] rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/70 dark:border-amber-500/25 text-[9px] font-semibold uppercase tracking-wide leading-none">
                      <Clock className="h-2.5 w-2.5" />
                      Soon
                    </span>
                  )}
                  {isNew && (
                    <span className="flex items-center gap-1 px-1.5 py-[2px] rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/70 dark:border-amber-500/25 text-[9px] font-semibold uppercase tracking-wide leading-none">
                      <Sparkles className="h-2.5 w-2.5" />
                      New
                    </span>
                  )}
                </div>

                <span
                  className={`h-12 w-12 rounded-2xl flex items-center justify-center border transition-colors ${
                    isGold
                      ? "bg-(--color-accent-yellow)/15 border-[varborder-(--color-accent-yellow)/30 group-hover:bg-[var(--color-accent-yellow)/25"
                      : "bg-leaf/10 border-leaf/25 group-hover:bg-leaf/20"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      isGold ? "text-primary-custom" : "text-leaf"
                    }`}
                  />
                </span>

                <div>
                  <h3 className="font-display text-base sm:text-lg font-semibold flex items-center gap-1.5 leading-tight">
                    {it.title}
                    {!isSoon && (
                      <ArrowRight className="h-4 w-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary-custom shrink-0" />
                    )}
                  </h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    {it.desc}
                  </p>
                  {isSoon && (
                    <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                      <Clock className="h-3 w-3" />
                      Coming Soon
                    </p>
                  )}
                </div>
              </>
            );

            if (isSoon) {
              return (
                <div key={it.key} aria-disabled="true" className={cardClass}>
                  {content}
                </div>
              );
            }

            return (
              <Link
                key={it.key}
                href={it.href}
                {...(it.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className={cardClass}
              >
                {content}
              </Link>
            );
          })}
        </div>

       
      </div>
    </section>
  );
}