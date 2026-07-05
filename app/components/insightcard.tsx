export default function InsightCard({
  icon: Icon,
  tone,
  text,
}: {
  icon: React.ElementType;
  tone: "leaf" | "gold" | "ink";
  text: React.ReactNode;
}) {
  const bg = tone === "leaf" ? "bg-leaf/10 text-leaf" : tone === "gold" ? "bg-gold/15 text-ink" : "bg-surface text-ink";
  return (
    <div className="flex items-start gap-3 squircle-sm bg-surface border border-border p-4">
      <span className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-sm leading-relaxed">{text}</p>
    </div>
  );
}
