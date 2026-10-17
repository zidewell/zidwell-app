// app/components/home-component/TrustMarquee.tsx
const items = [
  "Retail · Lagos",
  "Law Firm · Abuja",
  "Design Studio · London",
  "School Group · Enugu",
  "Consultancy · Nairobi",
  "E-commerce · Accra",
  "Freelancer · Toronto",
  "Agency · Cape Town",
  "Cooperative · Kano",
  "Startup · Berlin",
];

export function TrustMarquee() {
  // Duplicate list so translateX(-50%) lands exactly on the seam
  const doubled = [...items, ...items];
  return (
    <section className="border-y border-border bg-background py-5">
      <div className="marquee-wrap">
        <div className="marquee-track text-xs text-muted-foreground">
          {doubled.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 shrink-0">
              {item}
              <span className="h-1 w-1 rounded-full bg-primary-custom" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}