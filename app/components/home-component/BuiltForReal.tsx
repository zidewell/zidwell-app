
export function BuiltForReal() {
  const cities = ["Lagos", "London", "Nairobi", "New York", "Singapore", "Toronto", "Cape Town", "Berlin"];
  const worldMap = "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8d29ybGQlMjBtYXB8ZW58MHx8MHx8fDA%3D";

  const globalEntrepreneurs = "https://images.unsplash.com/photo-1655720357872-ce227e4164ba?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YmxhY2slMjBlbnRyZXByZW5ldXJ8ZW58MHx8MHx8fDA%3D";

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <p className="text-sm font-medium text-[var(--color-lemon-green)]">Built for real businesses</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--text-primary)]">A shop in Lagos. An agency in London. A studio in Nairobi.</h2>
            <p className="mt-4 text-[var(--text-secondary)]">Wherever you do business, Zidwell organizes your financial records — manual, upload or full bank sync.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {cities.map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-lemon-green)]" />
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="squircle-lg overflow-hidden border border-[var(--border-color)] shadow-float">
              <img
                src={worldMap}
                alt="Zidwell businesses across the world"
                width={1600}
                height={800}
                loading="lazy"
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="mt-4 squircle-sm overflow-hidden border border-[var(--border-color)]">
              <img
                src={globalEntrepreneurs}
                alt="Diverse global entrepreneurs using Zidwell"
                width={1280}
                height={896}
                loading="lazy"
                className="w-full h-48 sm:h-56 object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}