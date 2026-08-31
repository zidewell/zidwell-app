import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "Do I need a CAC document to use Zidwell?",
    a: "Well, yes and no. Yes — registered businesses can provide their CAC documents if they want a business bank account from our partner banks. No — if you are outside Nigeria and you only want to use our business tools like bookkeeping, invoices, receipts, etc.",
  },
  {
    q: "Can I get a business account?",
    a: "Yes, you can get a Nigerian business bank account once you complete your KYC.",
  },
  {
    q: "Can I add team members?",
    a: "Yes, it's part of our pro features. You can add team members and assign roles to them.",
  },
  {
    q: "Can I manage multiple business accounts?",
    a: "Yes. You can create multiple sub-accounts under your one account. You can also create multiple Zidwell profiles for your different businesses.",
  },
  {
    q: "Does Zidwell work outside Nigeria?",
    a: "Yes, Zidwell works well outside Nigeria. Only that without a BVN and CAC docs, you can't have a Nigerian business account — you can still use our business tools like bookkeeping, invoices, receipts, etc.",
  },
  {
    q: "Can I generate invoices and receipts?",
    a: "Yes you can — it's one of the core features of Zidwell.",
  },
  {
    q: "Can I connect my accountant?",
    a: "100% you can. It's part of our multi-user feature to add other people to help you manage your financials.",
  },
  {
    q: "How much does business account activation cost?",
    a: "For now it costs just ₦1,000 to activate your business. Traditional banks charge ₦10,000 for a name search — we don't.",
  },
  {
    q: "Can Zidwell help me prepare for tax filing?",
    a: "Yes. If you use Zidwell daily for your financial operations, your financial records are more accurate because all your invoices, receipts and bookkeeping are in one place.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-medium text-leaf">FAQ</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight">
            Questions, answered.
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="squircle-sm bg-surface border border-border shadow-soft overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 text-left px-5 sm:px-6 py-5"
                >
                  <span className="font-display text-base sm:text-lg font-semibold">{f.q}</span>
                  <span className="h-7 w-7 shrink-0 rounded-full bg-background border border-border flex items-center justify-center">
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                {isOpen && (
                  <p className="px-5 sm:px-6 pb-5 -mt-1 text-sm text-muted-foreground">{f.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
