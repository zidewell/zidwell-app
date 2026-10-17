// app/components/home-component/FAQNew.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

const faqs = [
  {
    q: "Is Zidwell a bank?",
    a: "No. Zidwell is a financial technology company. Your business bank account is held by our licensed partner bank, and your funds are covered by their deposit insurance. We give you the interface; they hold the money.",
  },
  {
    q: "Do I need a CAC document?",
    a: "Not to use the tools — invoices, receipts, bookkeeping, contracts all work without one. You only need CAC if you want the business bank account, and even then, it's a one-time ₦1,000 to file.",
  },
  {
    q: "Can I use Zidwell outside Nigeria?",
    a: "Yes. Every tool works globally. Only the bank account requires BVN and CAC — if you're outside Nigeria, you can still run everything else.",
  },
  {
    q: "Can I add team members?",
    a: "Yes, on the SME plan and above. You add them, assign a role, and control what they can see and do.",
  },
  {
    q: "Can I manage multiple businesses?",
    a: "Yes. You can create multiple profiles under one account — useful if you run different businesses through separate entities.",
  },
  {
    q: "Can I generate invoices and receipts?",
    a: "Yes, on every plan. It's a core feature, not an add-on.",
  },
  {
    q: "Can I connect my accountant?",
    a: "Yes, on SME and above. Give them read-only or edit access, and they see the same numbers you do.",
  },
  {
    q: "How much does business account activation cost?",
    a: "₦1,000 one-time. Traditional banks charge ₦10,000 for a name search alone — we don't.",
  },
  {
    q: "Can Zidwell help me prepare for tax filing?",
    a: "Yes. Because your invoices, receipts, and bookkeeping are all in one place, your tax-ready summary is one click away when the time comes.",
  },
];

export function FAQNew() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-28">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-leaf mb-4">
            FAQ
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">
            Questions, answered.
          </h2>
        </div>

        <div className="mt-12">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="border-b border-border">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 text-left py-5 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="font-display text-base sm:text-lg font-semibold text-foreground">
                    {f.q}
                  </span>
                  <Plus
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? "rotate-45" : "rotate-0"
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="pb-5 -mt-1 text-sm text-muted-foreground leading-relaxed">
                    {f.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}