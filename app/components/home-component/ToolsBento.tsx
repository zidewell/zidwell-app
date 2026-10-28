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
} from "lucide-react";

const ZIDSTORE_HOST = process.env.NEXT_PUBLIC_ZIDSTORE_HOST;
const zidStore =
  process.env.NODE_ENV === "development" || !ZIDSTORE_HOST
    ? { href: "/online-store", external: false }
    : { href: `https://${ZIDSTORE_HOST}`, external: true };

const featureCards = [
  {
    key: "invoice",
    icon: FileText,
    title: "Invoice",
    desc: "Send a branded PDF. It self-files when paid.",
    href: "/features/invoice",
    external: false,
  },
  {
    key: "receipt",
    icon: Receipt,
    title: "Receipt",
    desc: "Auto-issues on payment. Attached to the transaction.",
    href: "/features/receipt",
    external: false,
  },
  {
    key: "tax",
    icon: Calculator,
    title: "Tax Manager",
    desc: "Tax-ready summaries, one click away when filing.",
    href: "/features/tax",
    external: false,
  },
  {
    key: "contracts",
    icon: FilePen,
    title: "Contracts",
    desc: "E-signature + archive, linked to the client's account.",
    href: "/features/contracts",
    external: false,
  },
  {
    key: "vault",
    icon: FolderLock,
    title: "Vault",
    desc: "CAC, TIN, statements. One folder, not eleven.",
    href: "/features/vault",
    external: false,
  },
] as const;

export function ToolsBento() {
  return (
    <section id="tools" className="py-28 bg-surface">
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

        <div className="mt-14 grid grid-cols-1 md:grid-cols-8 gap-4">
          {/* Business Bank Account — clickable */}
          <Link
            href="/features/bank-account"
            className="group md:col-span-5 squircle-lg bg-[#0f0f0f] text-white p-6 sm:p-8 flex flex-col justify-between min-h-[320px] ring-0 hover:ring-2 hover:ring-primary-custom/70 hover:-translate-y-1 hover:shadow-float active:translate-y-0 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary-custom"
          >
            <div>
              <span className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-primary-custom/20 transition-colors">
                <Landmark className="h-5 w-5 text-primary-custom" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold flex items-center gap-2">
                Business Bank Account
                <ArrowRight className="h-4 w-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary-custom" />
              </h3>
              <p className="mt-2 text-sm text-white/70 max-w-md">
                Open a real account with signatories. No more &quot;send to my
                personal.&quot;
              </p>
            </div>
            <div className="mt-6 rounded-2xl overflow-hidden relative">
              <Image
                src="https://images.pexels.com/photos/4968391/pexels-photo-4968391.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="African business owner using the Zidwell bank account"
                width={600}
                height={400}
                className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-black/60 backdrop-blur-sm p-3 text-white">
                <p className="text-[10px] text-white/70">
                  GTBank · •••• 4821 · Business
                </p>
                <p className="font-display text-lg font-semibold tabular">
                  ₦1,284,500.00
                </p>
              </div>
            </div>
          </Link>

          {/* Auto-Bookkeeping — clickable */}
          <Link
            href="/features/bookkeeping"
            className="group md:col-span-3 squircle-lg bg-background border border-border p-6 sm:p-8 flex flex-col justify-between min-h-[320px] hover:border-primary-custom/70 hover:bg-[var(--color-accent-yellow)]/5 hover:-translate-y-1 hover:shadow-float active:translate-y-0 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary-custom"
          >
            <div>
              <span className="h-10 w-10 rounded-2xl bg-surface border border-border flex items-center justify-center group-hover:border-primary-custom/50 group-hover:bg-[var(--color-accent-yellow)]/10 transition-colors">
                <ClipboardList className="h-5 w-5 text-ink" />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold flex items-center gap-2">
                Auto-Bookkeeping
                <ArrowRight className="h-4 w-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary-custom" />
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Every transaction lands in the right category. You just approve
                the ones Zidwell isn&apos;t sure about.
              </p>
            </div>
            <div className="mt-6 relative rounded-2xl overflow-hidden">
              <Image
                src="https://images.pexels.com/photos/6694543/pexels-photo-6694543.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="African founder reviewing bookkeeping on Zidwell"
                width={400}
                height={300}
                className="h-28 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-3 text-white">
                <p className="text-[10px] text-white/70">Auto-categorized</p>
                <p className="font-display text-sm font-semibold">
                  98% this month
                </p>
              </div>
            </div>
          </Link>

          {/* Clickable feature cards — Invoice, Receipt, Tax, Contracts, Vault */}
          {featureCards.map((it) => {
            const Icon = it.icon;
            return (
              <Link
                key={it.key}
                href={it.href}
                className="group md:col-span-2 squircle bg-background border border-border p-5 flex flex-col justify-between min-h-[160px] hover:border-primary-custom/70 hover:bg-[var(--color-accent-yellow)]/5 hover:-translate-y-1 hover:shadow-float active:translate-y-0 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary-custom"
              >
                <span className="h-9 w-9 rounded-xl bg-surface border border-border flex items-center justify-center group-hover:border-primary-custom/50 group-hover:bg-[var(--color-accent-yellow)]/10 transition-colors">
                  <Icon className="h-4 w-4 text-ink group-hover:text-primary-custom transition-colors" />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold flex items-center gap-1.5">
                    {it.title}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary-custom" />
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {it.desc}
                  </p>
                </div>
              </Link>
            );
          })}

          {/* ZidStore card — clickable */}
          <Link
            href={zidStore.href}
            {...(zidStore.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="group md:col-span-8 squircle bg-background border border-border p-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm hover:border-primary-custom/70 hover:bg-[var(--color-accent-yellow)]/5 hover:-translate-y-1 hover:shadow-float active:translate-y-0 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary-custom"
          >
            <span className="h-9 w-9 rounded-xl bg-surface border border-border flex items-center justify-center group-hover:border-primary-custom/50 group-hover:bg-[var(--color-accent-yellow)]/10 transition-colors">
              <Store className="h-4 w-4 text-ink group-hover:text-primary-custom transition-colors" />
            </span>
            <div className="flex-1 min-w-[180px]">
              <p className="font-display text-base font-semibold text-foreground">
                ZidStore
              </p>
              <p className="text-xs text-muted-foreground">
                Your own online storefront, live in minutes.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-primary-custom font-medium">
              Visit ZidStore{" "}
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          <div className="md:col-span-8 squircle bg-background border border-border p-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="text-muted-foreground font-medium">
              Also included:
            </span>
            {[
              { icon: Wallet, l: "Payroll", addon: true },
              { icon: HeartPulse, l: "HMO", addon: true },
              { icon: ClipboardList, l: "Business plan" },
              { icon: MonitorCog, l: "Console" },
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
                    <span className="text-[9px] text-muted-foreground">
                      (add-on)
                    </span>
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

        <div className="mt-6 max-w-md md:ml-6 text-xs text-muted-foreground italic">
          <p>
            &ldquo;We used to Venmo from a personal account. Now my whole team
            sees where every naira comes from.&rdquo;
          </p>
          <p className="mt-1 not-italic font-medium text-foreground">
            — Tunde A., law firm, Abuja
          </p>
        </div>
      </div>
    </section>
  );
}