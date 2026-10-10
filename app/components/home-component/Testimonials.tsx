// app/components/home-component/Testimonials.tsx
import { Quote, Star } from "lucide-react";

const items = [
  {
    before: "Before Zidwell, we chased receipts at the end of every month.",
    after:
      "Now invoices, receipts and bookkeeping all live in one place — closing the month takes an afternoon.",
    name: "Amaka O.",
    role: "Founder, retail brand · Lagos",
    initials: "AO",
    tone: "gold",
  },
  {
    before:
      "Before Zidwell, we depended on gentleman's agreements and WhatsApp chats.",
    after:
      "Now every agreement is in writing, and our business account has clear signatories.",
    name: "Tunde A.",
    role: "Managing Partner, law firm · Abuja",
    initials: "TA",
    tone: "leaf",
  },
  {
    before:
      "Before Zidwell, our three outlets each kept their own scattered records.",
    after:
      "Now every manager has access to what they need — and I see everything in one dashboard.",
    name: "Grace N.",
    role: "Operations Lead, school group · Enugu",
    initials: "GN",
    tone: "ink",
  },
  {
    before: "Before Zidwell, I was outside Nigeria and my records were a mess.",
    after:
      "Now I use the tools only — bookkeeping, invoices and the vault. My accountant finally stopped complaining.",
    name: "Daniel K.",
    role: "Consultant · London",
    initials: "DK",
    tone: "gold",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 sm:py-32 bg-surface">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-leaf">Social Proof</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight">
            Businesses Are Building with Zidwell.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Real founders. Real structure. Real results.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {items.map((t) => {
            const av =
              t.tone === "gold"
                ? "bg-gold text-ink"
                : t.tone === "leaf"
                  ? "bg-leaf text-background"
                  : "bg-ink text-background";
            return (
              <div
                key={t.name}
                className="squircle bg-background border border-border shadow-soft p-6 sm:p-7 flex flex-col"
              >
                <Quote className="h-6 w-6 text-gold" />
                <div className="mt-4 space-y-3 flex-1">
                  <p className="text-sm sm:text-base text-muted-foreground italic">
                    &ldquo;{t.before}&rdquo;
                  </p>
                  <p className="text-sm sm:text-base font-medium">
                    &ldquo;{t.after}&rdquo;
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <span
                    className={`h-11 w-11 rounded-2xl flex items-center justify-center font-display font-semibold text-sm ${av}`}
                  >
                    {t.initials}
                  </span>
                  <div className="flex-1">
                    <p className="font-display font-semibold text-sm">
                      {t.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {t.role}
                    </p>
                  </div>
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-3.5 w-3.5 fill-gold text-gold"
                      />
                    ))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}