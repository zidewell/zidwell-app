import { Landmark, Zap, Eye, FileCheck2, ClipboardCheck, Globe2 } from "lucide-react";
import businessOwnerHero from "/public/business-owner-hero.jpg";

const reasons = [
  { icon: Landmark, t: "One place for your business finances" },
  { icon: Zap, t: "Less paperwork, more automation" },
  { icon: Eye, t: "Better financial visibility" },
  { icon: FileCheck2, t: "Business-ready records" },
  { icon: ClipboardCheck, t: "Team collaboration and approvals" },
  { icon: Globe2, t: "Built for businesses everywhere" },
];

export function WhyZidwell() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <p className="text-sm font-medium text-leaf">Why businesses choose Zidwell</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight">
              Fewer tools. Cleaner books. Better decisions.
            </h2>
            <div className="mt-8 squircle-lg overflow-hidden border shadow-float">
              <img
                src={businessOwnerHero.src}
                alt="Business owner managing finances with Zidwell"
                width={1280}
                height={1280}
                loading="lazy"
                className="w-full h-64 sm:h-80 object-cover"
              />
            </div>
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            {reasons.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.t} className="squircle bg-surface border border-border shadow-soft p-6 flex flex-col justify-between min-h-[150px]">
                  <span className="h-10 w-10 rounded-2xl bg-background border border-border flex items-center justify-center">
                    <Icon className="h-5 w-5 text-ink" />
                  </span>
                  <p className="mt-5 font-display text-lg font-semibold leading-snug">{r.t}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
