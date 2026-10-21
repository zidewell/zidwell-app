// app/components/home-component/VideoTestimonials.tsx
"use client";

import Image from "next/image";

const testimonials = [
  {
    name: "Adaeze O.",
    role: "Fashion retail · Lagos",
    quote:
      "I stopped doing spreadsheets. Zidwell just knows where the money went — and I finally close my books on the 1st.",
    avatar:
      "https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop&crop=face",
  },
  {
    name: "Tunde A.",
    role: "Law firm · Abuja",
    quote:
      "My accountant sees exactly the same numbers I do now. No more back-and-forth WhatsApp screenshots.",
    avatar:
      "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop&crop=face",
  },
  {
    name: "Amaka O.",
    role: "Home goods · Lagos",
    quote:
      "First time I've closed my books on time in three years. The auto-receipts alone paid for the plan.",
    avatar:
      "https://images.pexels.com/photos/5669602/pexels-photo-5669602.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop&crop=face",
  },
  {
    name: "Chidi N.",
    role: "Food & beverage · Enugu",
    quote:
      "The storefront and the bookkeeping live in one place. I stopped paying for three separate tools.",
    avatar:
      "https://images.pexels.com/photos/3777943/pexels-photo-3777943.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop&crop=face",
  },
  {
    name: "Fatima B.",
    role: "Consultancy · Kano",
    quote:
      "My team now has roles and approval limits. I don't get woken up at midnight to approve payments anymore.",
    avatar:
      "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop&crop=face",
  },
  {
    name: "Ngozi E.",
    role: "Design studio · Port Harcourt",
    quote:
      "The bank account, the invoices, the contracts — all in one dashboard. It feels like it was built for us.",
    avatar:
      "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop&crop=face",
  },
];

export function VideoTestimonials() {
  return (
    <section id="testimonials" className="py-28 bg-surface">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-leaf mb-4">
            Testimonials
          </p>
          <h2 className="font-narrow-display text-4xl sm:text-5xl font-semibold tracking-tight">
            Hear from Zidwell{" "}
            <span style={{ color: "var(--gold)" }}>users</span>.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Real African founders, real numbers. No stock photos of people
            shaking hands.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="squircle-lg bg-background border border-border p-6 sm:p-7 flex flex-col justify-between min-h-[240px] transition-colors hover:border-primary-custom/50"
            >
              <blockquote className="font-display text-base sm:text-lg leading-relaxed text-foreground">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <figcaption className="mt-6 pt-4 border-t border-border flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden border border-border bg-surface">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-sm font-semibold text-foreground truncate">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {t.role}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}