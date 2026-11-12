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

const marqueeStyles = `
  .zm-marquee-wrap {
    overflow: hidden;
    width: 100%;
    position: relative;
  }
  .zm-marquee-track {
    display: flex;
    gap: 2rem;
    white-space: nowrap;
    width: max-content;
    animation: zm-marquee-scroll 45s linear infinite;
    will-change: transform;
  }
  .zm-marquee-track:hover {
    animation-play-state: paused;
  }
  @keyframes zm-marquee-scroll {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
`;

export function TrustMarquee() {
  const doubled = [...items, ...items];
  return (
    <section className="border-y border-border bg-background py-5">
      <style dangerouslySetInnerHTML={{ __html: marqueeStyles }} />
      <div className="zm-marquee-wrap">
        <div className="zm-marquee-track text-xs text-muted-foreground">
          {doubled.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 shrink-0">
              {item}
              <span
                className="h-1 w-1 rounded-full"
                style={{ backgroundColor: "var(--gold)" }}
              />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}