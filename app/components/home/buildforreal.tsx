import Image from "next/image";

export default function BuiltForReal() {
  const cities = ["Lagos", "London", "Nairobi", "New York", "Singapore", "Toronto", "Cape Town", "Berlin"];
  return (
    <section className="py-24 sm:py-32 bg-surface">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <p className="text-sm font-medium text-leaf">Built for real businesses</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight">
              A shop in Lagos. An agency in London. A studio in Nairobi.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Wherever you do business, Zidwell organizes your financial records — manual, upload or full bank sync.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {cities.map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5 rounded-full bg-background border border-border px-3 py-1.5 text-xs font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-leaf" />
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="squircle-lg overflow-hidden border shadow-float">
              <Image
                width={1600}
                height={800}
                loading="lazy"
                src='/world-map.jpg'
                alt="Zidwell businesses across the world"
                className="object-cover"
                sizes="(min-width: 1024px) 58vw, 100vw"
              />
            </div>
            <div className="mt-4 squircle-sm overflow-hidden border relative h-48 sm:h-56">
              <Image
               width={1280}
                height={896}
                loading="lazy"
                src='/global-entrepreneurs.jpg'
                alt="Diverse global entrepreneurs using Zidwell"
                className="object-cover"
                sizes="(min-width: 1024px) 58vw, 100vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}