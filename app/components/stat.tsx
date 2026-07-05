export default function Stat({ label, value, tone }: { label: string; value: string; tone?: "leaf" | "gold" }) {
  const toneCls = tone === "leaf" ? "text-leaf" : tone === "gold" ? "text-ink" : "text-ink";
  return (
    <div className="squircle-sm bg-surface p-4">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`font-display text-xl font-semibold ${toneCls}`}>{value}</p>
    </div>
  );
}