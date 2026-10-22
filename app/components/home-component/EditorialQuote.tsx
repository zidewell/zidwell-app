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
            <img
              src="https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=128&h=128&fit=crop&crop=face"
              alt="Amaka Okonkwo"
              width={56}
              height={56}
              loading="lazy"
              className="h-14 w-14 rounded-full object-cover border-2 border-white/10"
            />
            <div>
              <p className="font-display text-sm font-semibold text-white">
                Amaka Okonkwo
              </p>
              <p className="text-xs text-white/60">Founder, Mara Home · Lagos</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}