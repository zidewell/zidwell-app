// components/PackageCard.tsx
"use client";

import { useState } from "react";
import { Button } from "../ui/button"; 
import { PaymentEmbedSlot } from "./payment-embeded-slot"; 
import { MapPin } from "lucide-react";

type Package = {
  id: string;
  title: string;
  location: string;
  meta: string;
  price: string;
  cta: string;
  image: string;
  blurb: string;
};

export function PackageCard({ pkg }: { pkg: Package }) {
  const [open, setOpen] = useState(false);

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] transition hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_16px_40px_-16px_rgba(0,0,0,0.18)]">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={pkg.image}
          alt={`${pkg.title} — ${pkg.location}`}
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
          <MapPin className="h-3 w-3" />
          {pkg.location}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <h3 className="font-display text-2xl leading-tight text-foreground">{pkg.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{pkg.meta}</p>
          <p className="mt-3 text-sm text-foreground/80">{pkg.blurb}</p>
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-border pt-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">From</p>
            <p className="font-display text-2xl text-foreground">{pkg.price}</p>
          </div>
          <Button onClick={() => setOpen((v) => !v)} variant={open ? "outline" : "default"}>
            {open ? "Close" : pkg.cta}
          </Button>
        </div>

        {open && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <PaymentEmbedSlot packageName={pkg.title} price={pkg.price} ctaText={pkg.cta} />
          </div>
        )}
      </div>
    </article>
  );
}