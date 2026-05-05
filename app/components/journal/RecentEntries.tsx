"use client";
import { format, parseISO } from "date-fns";
import { Trash2, Pencil, Wallet as WalletIcon, Edit2, ArrowUpRight, ArrowDownLeft, Send, CreditCard, Smartphone, Zap, Wifi, Tv, Droplet, Home, ShoppingBag, Car, Film, Heart, Book, Briefcase, Gift, RefreshCw, DollarSign, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useJournal } from "@/app/context/JournalContext";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

interface RecentEntriesProps {
  onEdit?: (entry: any) => void;
  limit?: number;
}

// Map transaction types to display names
const getDisplayCategoryName = (walletTransactionType: string | undefined, entryType: string): string => {
  const type = walletTransactionType?.toLowerCase() || "";
  
  // Income types
  if (entryType === 'income') {
    if (type === 'salary') return 'Salary';
    if (type === 'referral' || type === 'referral_reward') return 'Referral Bonus';
    if (type === 'refund' || type === 'reversal') return 'Refund';
    if (type === 'cashback') return 'Cashback';
    if (type === 'deposit' || type === 'virtual_account_deposit' || type === 'card_deposit') return 'Bank Deposit';
    if (type === 'p2p_received') return 'P2P Transfer Received';
    return 'Income';
  }
  
  // Expense/Outflow types
  if (type === 'withdrawal') return 'Withdrawal';
  if (type === 'transfer') return 'Transfer';
  if (type === 'p2p_transfer') return 'Transfer';
  if (type === 'debit') return 'Debit';
  if (type === 'airtime') return 'Data & Airtime';
  if (type === 'data') return 'Data & Airtime';
  if (type === 'electricity') return 'Utilities';
  if (type === 'cable') return 'Utilities';
  if (type === 'bill_payment') return 'Bills';
  if (type === 'purchase') return 'Shopping';
  if (type === 'subscription') return 'Subscriptions';
  if (type === 'fee' || type === 'charge') return 'Fees & Charges';
  
  return 'Expense';
};

// Map transaction types to icons
const getTransactionIcon = (walletTransactionType: string | undefined, entryType: string) => {
  const type = walletTransactionType?.toLowerCase() || "";
  
  // Income icons
  if (entryType === 'income') {
    if (type === 'salary') return <Briefcase className="h-5 w-5" />;
    if (type === 'referral' || type === 'referral_reward') return <Gift className="h-5 w-5" />;
    if (type === 'refund' || type === 'reversal') return <RefreshCw className="h-5 w-5" />;
    if (type === 'deposit' || type === 'virtual_account_deposit' || type === 'card_deposit') return <DollarSign className="h-5 w-5" />;
    return <ArrowDownLeft className="h-5 w-5" />;
  }
  
  // Expense/Outflow icons based on transaction type
  if (type === 'withdrawal') return <CreditCard className="h-5 w-5" />;
  if (type === 'transfer' || type === 'p2p_transfer') return <Send className="h-5 w-5" />;
  if (type === 'debit') return <CreditCard className="h-5 w-5" />;
  if (type === 'airtime') return <Smartphone className="h-5 w-5" />;
  if (type === 'data') return <Wifi className="h-5 w-5" />;
  if (type === 'electricity') return <Zap className="h-5 w-5" />;
  if (type === 'cable') return <Tv className="h-5 w-5" />;
  if (type === 'bill_payment') return <Home className="h-5 w-5" />;
  if (type === 'purchase') return <ShoppingBag className="h-5 w-5" />;
  if (type === 'food' || type === 'restaurant') return <Utensils className="h-5 w-5" />;
  
  return <ArrowUpRight className="h-5 w-5" />;
};

// Get icon color based on transaction type
const getIconColor = (type: string) => {
  if (type === 'income') return "var(--color-lemon-green)";
  return "var(--destructive)";
};

// Helper to get icon component (need to add Utensils)
const Utensils = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l2 2m0 0l2 2M5 5l2-2m-2 2l2 2m6-3a4 4 0 00-4 4v6a2 2 0 002 2h2a2 2 0 002-2v-6a4 4 0 00-4-4z" />
  </svg>
);

export function RecentEntries({ onEdit, limit }: RecentEntriesProps) {
  const { unifiedEntries, categories, deleteEntry, refetch, updateWalletEntry } = useJournal();
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [visibleCount, setVisibleCount] = useState(limit || 5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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
    if (confirm("Are you sure you want to delete this entry?")) {
      await deleteEntry(entry.id);
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
    
    if (editingEntry.source === 'wallet') {
      await updateWalletEntry(editingEntry.originalTransactionId, selectedCategory);
    } else if (onEdit) {
      onEdit(editingEntry);
    }
    
    setShowEditDialog(false);
    setEditingEntry(null);
    await refetch();
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setVisibleCount(prev => prev + 5);
    setIsLoadingMore(false);
  };

  // Get the primary display text - prioritize narration/description
  const getDisplayText = (entry: any) => {
    if (entry.note) return entry.note;
    if (entry.transactionDescription) return entry.transactionDescription;
    return entry.type === 'income' ? 'Income' : 'Expense';
  };

  if (unifiedEntries.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-[var(--text-secondary)]">
          No entries yet. Start journaling or make wallet transactions!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {visibleEntries.map((entry) => {
          const isWalletEntry = entry.source === 'wallet';
          const displayText = getDisplayText(entry);
          // Use the transaction type to determine the display category name
          const displayCategoryName = getDisplayCategoryName(entry.walletTransactionType, entry.type);
          const icon = getTransactionIcon(entry.walletTransactionType, entry.type);
          const iconColor = getIconColor(entry.type);
          
          // Try to find actual category from categories list (for edit dialog)
          const actualCategory = categories.find(c => c.id === entry.categoryId);

          return (
            <div
              key={entry.id}
              className="flex items-center gap-4 p-4 rounded-xl border shadow-soft hover:shadow-pop transition-shadow group bg-[var(--bg-primary)] border-[var(--border-color)] squircle-lg"
            >
              <div
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${iconColor}10` }}
              >
                <div style={{ color: iconColor }}>
                  {icon}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Display category name based on transaction type */}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                    {displayCategoryName}
                  </span>
                  {isWalletEntry && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                      <WalletIcon className="h-3 w-3" />
                      Auto-synced
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium truncate text-[var(--text-primary)] mt-1">
                  {displayText}
                </p>
                <div className="flex items-center gap-2 text-xs mt-0.5 text-[var(--text-secondary)]">
                  <span>{format(parseISO(entry.date), "MMM d, yyyy")}</span>
                  {isWalletEntry && entry.walletTransactionType && (
                    <span className="opacity-70 capitalize">
                      • {entry.walletTransactionType.replace(/_/g, ' ')}
                    </span>
                  )}
                  {entry.reference && (
                    <span className="opacity-70">
                      • Ref: {entry.reference.slice(0, 8)}...
                    </span>
                  )}
                </div>
              </div>

              <p
                className={cn("font-semibold tabular-nums text-lg")}
                style={{ color: entry.type === "income" ? "var(--color-lemon-green)" : "var(--destructive)" }}
              >
                {entry.type === "income" ? "+" : "-"}
                {formatCurrency(entry.amount)}
              </p>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[var(--color-accent-yellow)]"
                  onClick={() => handleEditCategory(entry)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[var(--text-secondary)]"
                  onClick={() => handleDelete(entry)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
              className="px-8 py-2 font-medium rounded-md transition-colors text-sm flex items-center bg-[var(--bg-secondary)] text-[var(--color-accent-yellow)] border border-[var(--border-color)] squircle-md"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Load More Transactions
                  <ChevronDown className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
            <p className="text-xs mt-2 text-[var(--text-secondary)]">
              Showing {visibleCount} of {unifiedEntries.length} entries
            </p>
          </div>
        )}

        {!hasMore && unifiedEntries.length > (limit || 5) && (
          <div className="text-center pt-4">
            <p className="text-xs text-[var(--text-secondary)]">
              All {unifiedEntries.length} entries loaded
            </p>
          </div>
        )}
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-soft squircle-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-[var(--text-primary)]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Edit Category
            </DialogTitle>
          </DialogHeader>

          {editingEntry && (
            <div className="space-y-5 mt-4">
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] squircle-md">
                <p className="text-sm text-[var(--text-secondary)]">Transaction</p>
                <p className="font-medium text-[var(--text-primary)]">
                  {getDisplayText(editingEntry)}
                </p>
                <p className="text-xl font-semibold mt-1" style={{ color: editingEntry.type === "income" ? "var(--color-lemon-green)" : "var(--destructive)" }}>
                  {editingEntry.type === "income" ? "+" : "-"}{formatCurrency(editingEntry.amount)}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Select Category
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {categories
                    .filter(cat => cat.type === editingEntry.type || cat.type === "both")
                    .map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center"
                        )}
                        style={{
                          borderColor: selectedCategory === cat.id ? "var(--color-accent-yellow)" : "var(--border-color)",
                          backgroundColor: selectedCategory === cat.id ? "rgba(253, 192, 32, 0.1)" : "var(--bg-primary)",
                        }}
                      >
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="text-xs font-medium truncate w-full text-[var(--text-primary)]">
                          {cat.name}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              <Button
                onClick={handleUpdateCategory}
                disabled={!selectedCategory}
                className="w-full font-semibold h-12 bg-[var(--color-accent-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-accent-yellow)]/90 squircle-md"
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