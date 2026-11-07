// app/components/home-component/EditorialQuote.tsx
export function EditorialQuote() {
  return (
    <section className="py-28  bg-[#0f0f0f] text-white">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <div className="relative">
          <span
            aria-hidden
            className="absolute -top-6 -left-2 font-display text-[120px] leading-none text-primary-custom opacity-80 select-none"
          >
            &ldquo;
          </span>
          <blockquote className="relative font-display text-2xl sm:text-3xl lg:text-4xl font-medium leading-snug max-w-[720px] text-white">
            I used to spend the last three days of every month reconciling. Now
            I close the books on the 1st and go back to selling.
          </blockquote>
          <div className="mt-8 flex items-center gap-3">
            {/* ✅ updated image */}
            <img
              src="https://images.unsplash.com/photo-1605602517387-ec78b947335e?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D"
              alt="Amaka Okonkwo"
              width={56}
              height={56}
              loading="lazy"
              className="h-14 w-14 rounded-full object-cover border-2 border-white/10"
            />
            <div>
              <p className="font-display text-sm font-semibold text-white">
                Thomas Okonkwo
              </p>
              <p className="text-xs text-white/60">Founder, Mara Home · Lagos</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}