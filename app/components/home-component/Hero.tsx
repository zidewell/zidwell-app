import Link from "next/link";
import { FloatingCard } from "./FloatingCard";
import { PhoneMock } from "./PhoneMock";
import { ArrowRight, CheckCircle2, Globe2, Instagram } from "lucide-react";

const styles = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fade-up {
    animation: fadeUp 0.7s ease-out both;
  }
`;

export function Hero() {
  return (
    <>
      <style>{styles}</style>
      <section
        className="relative overflow-hidden bg-[oklch(1_0_0)] dark:bg-[oklch(0.14_0_0)]"
        style={{
          backgroundImage: `
            radial-gradient(at 20% 10%, oklch(0.84 0.16 88 / 0.14), transparent 50%),
            radial-gradient(at 80% 0%, oklch(0.66 0.18 148 / 0.10), transparent 50%)
          `,
        }}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 pt-16 sm:pt-24 pb-20">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-7 animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.97_0_0)] dark:bg-[oklch(0.18_0_0)] px-3 py-1.5 text-xs font-medium font-['Be_Vietnam_Pro',system-ui,sans-serif] border border-[oklch(0.85_0_0)] dark:border-[oklch(1_0_0)_/_12%] text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)]">
                <Globe2 className="h-3.5 w-3.5 text-[oklch(0.66_0.18_148)]" />
                Automatic financial records · for businesses worldwide
              </span>
              <h1 className="mt-6 font-['Space_Grotesk','Cy_Grotesk_Key',system-ui,sans-serif] text-[40px] leading-[1.04] sm:text-6xl lg:text-7xl font-semibold tracking-tight text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)]">
                Your Financial Records,{" "}
                <span className="relative inline-block">
                  Done For You.
                  <span className="absolute -bottom-1 left-0 right-0 h-2 bg-[oklch(0.84_0.16_88)]/60 dark:bg-[oklch(0.84_0.16_88)]/40 -z-10 rounded-full" />
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base sm:text-lg text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] font-['Be_Vietnam_Pro',system-ui,sans-serif]">
                No matter the size of your business, Zidwell gives you easy,
                automatic, and clearly organized financial records.
              </p>
              <p className="mt-4 max-w-xl text-sm text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)] font-['Be_Vietnam_Pro',system-ui,sans-serif]">
                So you're always ready for:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {["Taxes", "Loans", "Investors", "Business decisions"].map(
                  (t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(1_0_0)] dark:bg-[oklch(0.18_0_0)] border border-[oklch(0.85_0_0)] dark:border-[oklch(1_0_0)_/_12%] px-3 py-1 text-xs font-medium font-['Be_Vietnam_Pro',system-ui,sans-serif] text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.66_0.18_148)]" />
                      {t}
                    </span>
                  ),
                )}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[oklch(0.17_0_0)] dark:bg-[oklch(0.98_0_0)] text-[oklch(1_0_0)] dark:text-[oklch(0.17_0_0)] text-sm font-semibold font-['Be_Vietnam_Pro',system-ui,sans-serif] hover:opacity-90 transition"
                >
                  Start Free <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="https://instagram.com/zidwell"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[oklch(0.97_0_0)] dark:bg-[oklch(0.18_0_0)] text-sm font-semibold font-['Be_Vietnam_Pro',system-ui,sans-serif] border border-[oklch(0.85_0_0)] dark:border-[oklch(1_0_0)_/_12%] hover:bg-[oklch(0.935_0_0)] dark:hover:bg-[oklch(0.22_0_0)] transition text-[oklch(0.17_0_0)] dark:text-[oklch(0.98_0_0)]"
                >
                  <Instagram className="h-4 w-4" /> Follow on Instagram
                </a>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[oklch(0.5_0_0)] dark:text-[oklch(0.7_0_0)] font-['Be_Vietnam_Pro',system-ui,sans-serif]">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.66_0.18_148)]" />{" "}
                  Manual, upload or auto-sync
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.66_0.18_148)]" />{" "}
                  Tax-ready reports
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.66_0.18_148)]" />{" "}
                  Invoices & receipts included
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative h-[520px]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <PhoneMock />
                </div>

                <FloatingCard
                  className="absolute top-2 -left-2 sm:-left-6 animate-float"
                  title="Money in · recorded"
                  amount="+ $4,500"
                  tone="leaf"
                />
                <FloatingCard
                  className="absolute bottom-10 -right-2 sm:-right-6 animate-float-slow"
                  title="Money out · categorized"
                  amount="- ₦ 12,400"
                  tone="gold"
                />
                <FloatingCard
                  className="absolute top-1/2 -right-4 sm:right-2 hidden sm:flex animate-float"
                  title="Financial health"
                  amount="82 · Healthy"
                  tone="ink"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}