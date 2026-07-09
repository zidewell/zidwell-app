export function SocialBar() {
  return (
    <section className="border-y border-[var(--border-color)] bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-[var(--text-secondary)]">
          <p className="font-medium text-center sm:text-left">Built for freelancers, SMEs and global businesses</p>
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="font-display text-[var(--text-primary)] whitespace-nowrap">50+ countries</span>
            <span className="font-display text-[var(--text-primary)] whitespace-nowrap">Multi-currency</span>
            <span className="font-display text-[var(--text-primary)] whitespace-nowrap">Real-time records</span>
          </div>
        </div>
      </div>
    </section>
  );
}