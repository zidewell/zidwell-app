export default function FloatingCard({
  className = "",
  title,
  amount,
  tone,
}: {
  className?: string;
  title: string;
  amount: string;
  tone: "leaf" | "gold" | "ink";
}) {
  const dot =
    tone === "leaf" ? "bg-leaf" : tone === "gold" ? "bg-gold" : "bg-ink";
  return (
    <div className={`flex items-center gap-3 squircle-sm bg-background border shadow-float px-4 py-3 ${className}`}>
      <span className={`h-8 w-8 rounded-full ${dot}`} />
      <div>
        <p className="text-[10px] text-muted-foreground">{title}</p>
        <p className="text-sm font-semibold font-display">{amount}</p>
      </div>
    </div>
  );
}