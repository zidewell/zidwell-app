export default function SocialBar() {
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-6 flex flex-wrap items-center justify-between gap-6 text-xs text-muted-foreground">
        <p className="font-medium">Built for freelancers, SMEs and global businesses</p>
        <div className="flex items-center gap-6">
          <span className="font-display text-foreground">50+ countries</span>
          <span className="font-display text-foreground">Multi-currency</span>
          <span className="font-display text-foreground">Real-time records</span>
        </div>
      </div>
    </section>
  );
}