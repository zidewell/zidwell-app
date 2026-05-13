"use client";
import { format, parseISO } from "date-fns";
import {
  Trash2,
  Pencil,
  Wallet as WalletIcon,
  Edit2,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  CreditCard,
  Smartphone,
  Zap,
  Wifi,
  Tv,
  Droplet,
  Home,
  ShoppingBag,
  Car,
  Film,
  Heart,
  Book,
  Briefcase,
  Gift,
  RefreshCw,
  DollarSign,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useJournal } from "@/app/context/JournalContext";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import Swal from "sweetalert2";

interface RecentEntriesProps {
  onEdit?: (entry: any) => void;
  limit?: number;
}

// Map transaction types to display names (fallback when category is missing)
const getDisplayCategoryNameFromType = (
  walletTransactionType: string | undefined,
  entryType: string,
): string => {
  const type = walletTransactionType?.toLowerCase() || "";

  // Income types
  if (entryType === "income") {
    if (type === "salary") return "Salary";
    if (type === "referral" || type === "referral_reward") return "Referral Bonus";
    if (type === "refund" || type === "reversal") return "Refund";
    if (type === "cashback") return "Cashback";
    if (type === "deposit" || type === "virtual_account_deposit" || type === "card_deposit") return "Bank Deposit";
    if (type === "p2p_received") return "P2P Transfer Received";
    return "Income";
  }

  // Expense/Outflow types
  if (type === "withdrawal") return "Withdrawal";
  if (type === "transfer") return "Transfer";
  if (type === "p2p_transfer") return "Transfer";
  if (type === "debit") return "Debit";
  if (type === "airtime") return "Data & Airtime";
  if (type === "data") return "Data & Airtime";
  if (type === "electricity") return "Utilities";
  if (type === "cable") return "Utilities";
  if (type === "bill_payment") return "Bills";
  if (type === "purchase") return "Shopping";
  if (type === "subscription") return "Subscriptions";
  if (type === "fee" || type === "charge") return "Fees & Charges";

  return "Expense";
};

// Get fallback emoji icon as string
const getFallbackEmojiIcon = (walletTransactionType: string | undefined, entryType: string): string => {
  const type = walletTransactionType?.toLowerCase() || "";

  if (entryType === "income") {
    if (type === "salary") return "💼";
    if (type === "referral" || type === "referral_reward") return "🎁";
    if (type === "refund" || type === "reversal") return "↩️";
    if (type === "deposit" || type === "virtual_account_deposit" || type === "card_deposit") return "💰";
    return "📥";
  }

  if (type === "withdrawal") return "🏧";
  if (type === "transfer" || type === "p2p_transfer") return "💸";
  if (type === "debit") return "💳";
  if (type === "airtime") return "📱";
  if (type === "data") return "📶";
  if (type === "electricity") return "⚡";
  if (type === "cable") return "📺";
  if (type === "bill_payment") return "🏠";
  if (type === "purchase") return "🛍️";
  if (type === "subscription") return "💳";
  if (type === "fee" || type === "charge") return "⚠️";

  return "📦";
};

// AlertCircle icon component
const AlertCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Get icon color based on transaction type
const getIconColor = (type: string) => {
  if (type === "income") return "var(--color-lemon-green)";
  return "var(--destructive)";
};

export function RecentEntries({ onEdit, limit }: RecentEntriesProps) {
  const {
    unifiedEntries,
    categories,
    deleteEntry,
    refetch,
    updateWalletEntry,
  } = useJournal();
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [visibleCount, setVisibleCount] = useState(limit || 5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Create a map of category name to category object for quick lookup
  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach(cat => {
      map.set(cat.name.toLowerCase(), cat);
      map.set(cat.id, cat);
    });
    return map;
  }, [categories]);

  // Get visible entries based on count
  const visibleEntries = unifiedEntries.slice(0, visibleCount);
  const hasMore = visibleCount < unifiedEntries.length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleDelete = async (entry: any) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      html: `You are about to delete this transaction:<br/><strong>${getDisplayText(entry)}</strong><br/>Amount: ${formatCurrency(entry.amount)}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--destructive)",
      cancelButtonColor: "var(--text-secondary)",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      background: "var(--bg-primary)",
      customClass: {
        popup: "squircle-lg",
      },
    });

    if (result.isConfirmed) {
      if (entry.source === "wallet") {
        await deleteEntry(entry.id);
        await Swal.fire({
          title: "Hidden!",
          text: "Transaction has been hidden from your journal.",
          icon: "success",
          confirmButtonColor: "var(--color-accent-yellow)",
          background: "var(--bg-primary)",
          timer: 2000,
          showConfirmButton: true,
          customClass: { popup: "squircle-lg" },
        });
      } else {
        await deleteEntry(entry.id);
        await Swal.fire({
          title: "Deleted!",
          text: "Transaction has been deleted successfully.",
          icon: "success",
          confirmButtonColor: "var(--color-accent-yellow)",
          background: "var(--bg-primary)",
          timer: 2000,
          showConfirmButton: true,
          customClass: { popup: "squircle-lg" },
        });
      }
      await refetch();
    }
  };

  const handleEditCategory = (entry: any) => {
    setEditingEntry(entry);
    setSelectedCategory(entry.categoryId);
    setShowEditDialog(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingEntry || !selectedCategory) return;

    if (editingEntry.source === "wallet") {
      await updateWalletEntry(
        editingEntry.originalTransactionId,
        selectedCategory,
      );
    } else if (onEdit) {
      onEdit(editingEntry);
    }

    setShowEditDialog(false);
    setEditingEntry(null);

    await Swal.fire({
      title: "Updated!",
      text: "Category has been updated successfully.",
      icon: "success",
      confirmButtonColor: "var(--color-accent-yellow)",
      background: "var(--bg-primary)",
      timer: 1500,
      showConfirmButton: true,
      customClass: { popup: "squircle-lg" },
    });

    await refetch();
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setVisibleCount((prev) => prev + 5);
    setIsLoadingMore(false);
  };

  // Get the primary display text - prioritize narration/description
  const getDisplayText = (entry: any) => {
    if (entry.note) return entry.note;
    if (entry.transactionDescription) return entry.transactionDescription;
    return entry.type === "income" ? "Income" : "Expense";
  };

  // Get category name - USE THE CATEGORY FIELD FROM TRANSACTION
  const getCategoryName = (entry: any) => {
    // Priority 1: Use the categoryName from the entry (which comes from transactions.category)
    if (entry.categoryName && typeof entry.categoryName === 'string' && entry.categoryName.trim()) {
      return entry.categoryName;
    }
    
    // Priority 2: Try to match categoryId with journal_categories
    if (entry.categoryId) {
      const matchedCategory = categories.find(c => c.id === entry.categoryId);
      if (matchedCategory && matchedCategory.name) {
        return matchedCategory.name;
      }
    }
    
    // Fallback: use transaction type logic
    return getDisplayCategoryNameFromType(entry.walletTransactionType, entry.type);
  };

  // Get category icon - USE THE CATEGORY NAME TO FIND ICON
  const getCategoryIconValue = (entry: any): string => {
    // Priority 1: Use categoryName to find icon from journal_categories
    if (entry.categoryName && typeof entry.categoryName === 'string' && entry.categoryName.trim()) {
      const categoryName = entry.categoryName.trim();
      const matchedCategory = categoryMap.get(categoryName.toLowerCase());
      if (matchedCategory && matchedCategory.icon) {
        return matchedCategory.icon;
      }
    }
    
    // Priority 2: Try to get icon from categoryId
    if (entry.categoryId) {
      const matchedCategory = categories.find(c => c.id === entry.categoryId);
      if (matchedCategory && matchedCategory.icon) {
        return matchedCategory.icon;
      }
    }
    
    // Fallback: use transaction type emoji icon
    return getFallbackEmojiIcon(entry.walletTransactionType, entry.type);
  };

  if (unifiedEntries.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-(--text-secondary)">
          No entries yet. Start journaling or make wallet transactions!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {visibleEntries.map((entry) => {
          const isWalletEntry = entry.source === "wallet";
          const displayText = getDisplayText(entry);
          const categoryName = getCategoryName(entry);
          const categoryIcon = getCategoryIconValue(entry);
          const iconColor = getIconColor(entry.type);

          return (
            <div
              key={entry.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border shadow-soft hover:shadow-pop transition-all bg-(--bg-primary) border-(--border-color) squircle-lg"
            >
              {/* Icon - Left side */}
              <div
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center self-start sm:self-center"
                style={{ backgroundColor: `${iconColor}10` }}
              >
                <span className="text-xl" style={{ color: iconColor }}>
                  {categoryIcon}
                </span>
              </div>

              {/* Content - Middle */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Category Name Badge - Shows the actual category name from transaction */}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-(--bg-secondary) text-(--text-secondary) font-medium">
                    {categoryName}
                  </span>
                  
                  {/* Auto-synced Badge */}
                  {isWalletEntry && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-1">
                      <WalletIcon className="h-3 w-3" />
                      Auto-synced
                    </span>
                  )}
                </div>
                
                {/* Transaction Description/Narration */}
                <p className="text-sm font-medium text-(--text-primary) mt-1 line-clamp-2">
                  {displayText}
                </p>
                
                {/* Date and Additional Info */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mt-1 text-(--text-secondary)">
                  <span>{format(parseISO(entry.date), "MMM d, yyyy")}</span>
                  {isWalletEntry && entry.walletTransactionType && (
                    <span className="opacity-70 capitalize">
                      • {entry.walletTransactionType.replace(/_/g, " ")}
                    </span>
                  )}
                  {entry.reference && (
                    <span className="opacity-70 font-mono">
                      • Ref: {entry.reference.slice(0, 8)}...
                    </span>
                  )}
                </div>
              </div>

              {/* Amount - Right side */}
              <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0">
                <p
                  className={cn("font-semibold tabular-nums text-base sm:text-lg")}
                  style={{
                    color: entry.type === "income"
                      ? "var(--color-lemon-green)"
                      : "var(--destructive)",
                  }}
                >
                  {entry.type === "income" ? "+" : "-"}
                  {formatCurrency(entry.amount)}
                </p>

                {/* Action Buttons */}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-(--color-accent-yellow) hover:bg-(--bg-secondary)"
                    onClick={() => handleEditCategory(entry)}
                    title="Edit Category"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-(--bg-secondary)"
                    onClick={() => handleDelete(entry)}
                    title="Delete Entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center flex flex-col items-center justify-center pt-4">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-6 sm:px-8 py-2 font-medium rounded-md transition-colors text-sm flex items-center gap-2 bg-(--bg-secondary) text-(--color-accent-yellow) border border-(--border-color) squircle-md hover:bg-(--bg-secondary)/80"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Load More
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-xs mt-2 text-(--text-secondary)">
              Showing {visibleCount} of {unifiedEntries.length} entries
            </p>
          </div>
        )}

        {!hasMore && unifiedEntries.length > (limit || 5) && (
          <div className="text-center pt-4">
            <p className="text-xs text-(--text-secondary)">
              All {unifiedEntries.length} entries loaded
            </p>
          </div>
        )}
      </div>

      {/* Edit Category Dialog - Responsive */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md w-[95%] sm:w-full max-h-[90vh] overflow-y-auto bg-(--bg-primary) border border-(--border-color) shadow-soft squircle-lg">
          <DialogHeader>
            <DialogTitle
              className="text-xl text-(--text-primary)"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Edit Category
            </DialogTitle>
          </DialogHeader>

          {editingEntry && (
            <div className="space-y-5 mt-4">
              {/* Transaction Info */}
              <div className="p-4 rounded-xl bg-(--bg-secondary) squircle-md">
                <p className="text-sm text-(--text-secondary)">Transaction</p>
                <p className="font-medium text-(--text-primary) text-sm sm:text-base line-clamp-2">
                  {getDisplayText(editingEntry)}
                </p>
                <p
                  className="text-lg sm:text-xl font-semibold mt-1"
                  style={{
                    color: editingEntry.type === "income"
                      ? "var(--color-lemon-green)"
                      : "var(--destructive)",
                  }}
                >
                  {editingEntry.type === "income" ? "+" : "-"}
                  {formatCurrency(editingEntry.amount)}
                </p>
              </div>

              {/* Category Selection Grid */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-(--text-secondary)">
                  Select Category
                </label>
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                  {categories
                    .filter(
                      (cat) =>
                        cat.type === editingEntry.type || cat.type === "both",
                    )
                    .map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center",
                          selectedCategory === cat.id
                            ? "border-(--color-accent-yellow) bg-(--color-accent-yellow)/10"
                            : "border-(--border-color) hover:border-(--color-accent-yellow)/50"
                        )}
                      >
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="text-xs font-medium truncate w-full text-(--text-primary)">
                          {cat.name}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              {/* Update Button */}
              <Button
                onClick={handleUpdateCategory}
                disabled={!selectedCategory}
                className="w-full font-semibold h-12 bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 squircle-md"
              >
                Update Category
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}