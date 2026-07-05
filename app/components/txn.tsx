import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

export default function Txn({ label, sub, amount, up }: { label: string; sub: string; amount: string; up?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-surface px-3 py-2.5">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            up ? "bg-leaf/15 text-leaf" : "bg-gold/20 text-ink"
          }`}
        >
          {up ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
        </div>
        <div>
          <p className="text-xs font-medium">{label}</p>
          <p className="text-[10px] text-muted-foreground">{sub}</p>
        </div>
      </div>
      <p className={`text-xs font-semibold ${up ? "text-leaf" : "text-ink"}`}>{amount}</p>
    </div>
  );
}
