// app/components/journal/RecentEntries.tsx
import { format, parseISO } from "date-fns";
import { Trash2, Pencil, Wallet as WalletIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useJournal } from "@/app/context/JournalContext";

interface RecentEntriesProps {
  onEdit?: (entry: any) => void;
  limit?: number;
}

export function RecentEntries({ onEdit, limit }: RecentEntriesProps) {
  const { unifiedEntries, categories, deleteEntry, refetch } = useJournal();

  const filteredEntries = unifiedEntries.slice(0, limit || 20);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleDelete = async (entry: any) => {
    if (entry.source === 'wallet') {
      alert("Wallet transactions cannot be deleted. They are automatically synced from your wallet activity.");
      return;
    }
    
    if (confirm("Are you sure you want to delete this entry?")) {
      await deleteEntry(entry.id);
      await refetch();
    }
  };

  if (filteredEntries.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="dark:text-gray-400" style={{ color: "#80746e" }}>
          No entries yet. Start journaling or make wallet transactions!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredEntries.map((entry) => {
        const category = categories.find((c) => c.id === entry.categoryId);
        const isWalletEntry = entry.source === 'wallet';

        return (
          <div
            key={entry.id}
            className="flex items-center gap-4 p-4 rounded-xl border shadow-[0_2px_20px_-4px_rgba(38,33,28,0.08)] hover:shadow-[0_4px_24px_-8px_rgba(38,33,28,0.1)] transition-shadow group dark:bg-gray-800 dark:border-gray-700"
            style={{
              backgroundColor: isWalletEntry ? 'rgba(245, 241, 234, 0.5)' : '#fcfbf9',
              borderColor: "#e6dfd6",
            }}
          >
            <div
              className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl dark:bg-gray-700"
              style={{ backgroundColor: "#f5f1ea" }}
            >
              {category?.icon || (entry.type === 'income' ? '💰' : '💸')}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium truncate dark:text-gray-300">
                  {category?.name || (entry.type === 'income' ? 'Income' : 'Expense')}
                </p>
                {isWalletEntry && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-1">
                    <WalletIcon className="h-3 w-3" />
                    Auto-synced
                  </span>
                )}
              </div>
              {/* Show the actual transaction description/note */}
              <p className="text-sm truncate dark:text-gray-400 mt-0.5" style={{ color: "#80746e" }}>
                {entry.note || entry.transactionDescription || (entry.type === 'income' ? 'Income' : 'Expense')}
              </p>
              <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: "#80746e" }}>
                <span>{format(parseISO(entry.date), "MMM d, yyyy")}</span>
                {isWalletEntry && entry.walletTransactionType && (
                  <span className="opacity-70">
                    • {entry.walletTransactionType}
                  </span>
                )}
                {entry.status && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                    {entry.status}
                  </span>
                )}
              </div>
            </div>

            <p
              className={cn("font-semibold tabular-nums text-lg")}
              style={{ color: entry.type === "income" ? "#16a34a" : "#e11d48" }}
            >
              {entry.type === "income" ? "+" : "-"}
              {formatCurrency(entry.amount)}
            </p>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && !isWalletEntry && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="dark:text-gray-400 dark:hover:text-gray-300"
                  style={{ color: "#80746e" }}
                  onClick={() => onEdit(entry)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {!isWalletEntry && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="dark:text-gray-400 dark:hover:text-gray-300"
                  style={{ color: "#80746e" }}
                  onClick={() => handleDelete(entry)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              {isWalletEntry && (
                <div className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-500">
                  Read-only
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {unifiedEntries.length > (limit || 20) && (
        <div className="text-center pt-2">
          <p className="text-xs" style={{ color: "#80746e" }}>
            Showing {limit || 20} of {unifiedEntries.length} entries
          </p>
        </div>
      )}
    </div>
  );
}