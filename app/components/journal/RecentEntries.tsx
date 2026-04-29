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

// Map transaction types to icons based ONLY on transaction type
const getTransactionIcon = (walletTransactionType: string | undefined, entryType: string) => {
  const type = walletTransactionType?.toLowerCase() || entryType?.toLowerCase() || "";
  
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
  
  return <ArrowUpRight className="h-5 w-5" />;
};

// Get icon color based on transaction type
const getIconColor = (type: string) => {
  if (type === 'income') return "#16a34a";
  return "#e11d48";
};

export function RecentEntries({ onEdit, limit }: RecentEntriesProps) {
  const { unifiedEntries, categories, deleteEntry, refetch, updateWalletEntry } = useJournal();
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [visibleCount, setVisibleCount] = useState(limit || 5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filter out unwanted categories
  const filteredCategories = categories.filter(cat => 
    cat.name !== 'Food' && cat.name !== 'Transportation'
  );

  // Helper function to get the correct category for wallet transactions
  const getCorrectCategory = (entry: any) => {
    // If it's a wallet transaction, try to find matching category by transaction type
    if (entry.source === 'wallet' && entry.walletTransactionType) {
      const txType = entry.walletTransactionType.toLowerCase();
      
      if (txType === 'withdrawal') {
        const withdrawalCat = filteredCategories.find(c => c.name === 'Withdrawal');
        if (withdrawalCat) return withdrawalCat;
      }
      
      if (txType === 'transfer' || txType === 'p2p_transfer' || txType === 'debit') {
        const transferCat = filteredCategories.find(c => c.name === 'Transfer');
        if (transferCat) return transferCat;
      }
      
      if (txType === 'airtime' || txType === 'data') {
        const dataCat = filteredCategories.find(c => c.name === 'Data & Airtime');
        if (dataCat) return dataCat;
      }
      
      if (txType === 'electricity' || txType === 'cable' || txType === 'bill_payment') {
        const billsCat = filteredCategories.find(c => c.name === 'Bills' || c.name === 'Utilities');
        if (billsCat) return billsCat;
      }
    }
    
    // Fallback to category from entry ID
    const category = filteredCategories.find(c => c.id === entry.categoryId);
    if (category) return category;
    
    // Last resort - find any expense/income category
    return filteredCategories.find(c => c.type === entry.type);
  };

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
    // Simulate a small delay for better UX
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
        <p className="dark:text-gray-400" style={{ color: "#80746e" }}>
          No entries yet. Start journaling or make wallet transactions!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {visibleEntries.map((entry) => {
          const category = getCorrectCategory(entry);
          const isWalletEntry = entry.source === 'wallet';
          const displayText = getDisplayText(entry);
          const icon = getTransactionIcon(entry.walletTransactionType, entry.type);
          const iconColor = getIconColor(entry.type);

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
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${iconColor}10` }}
              >
                <div style={{ color: iconColor }}>
                  {icon}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#f5f1ea", color: "#80746e" }}>
                    {category?.name || (entry.type === 'income' ? 'Income' : 'Expense')}
                  </span>
                  {isWalletEntry && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-1">
                      <WalletIcon className="h-3 w-3" />
                      Auto-synced
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium truncate dark:text-gray-200 mt-1" style={{ color: "#26121c" }}>
                  {displayText}
                </p>
                <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: "#80746e" }}>
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
                style={{ color: entry.type === "income" ? "#16a34a" : "#e11d48" }}
              >
                {entry.type === "income" ? "+" : "-"}
                {formatCurrency(entry.amount)}
              </p>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="dark:text-gray-400 dark:hover:text-gray-300"
                  style={{ color: "#2b825b" }}
                  onClick={() => handleEditCategory(entry)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="dark:text-gray-400 dark:hover:text-gray-300"
                  style={{ color: "#80746e" }}
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
              className="px-8 py-2 font-medium rounded-md transition-colors text-sm flex "
              style={{
                backgroundColor: "#f5f1ea",
                color: "#2b825b",
                border: "1px solid #e6dfd6",
              }}
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
            <p className="text-xs mt-2" style={{ color: "#80746e" }}>
              Showing {visibleCount} of {unifiedEntries.length} entries
            </p>
          </div>
        )}

        {!hasMore && unifiedEntries.length > (limit || 5) && (
          <div className="text-center pt-4">
            <p className="text-xs" style={{ color: "#80746e" }}>
              All {unifiedEntries.length} entries loaded
            </p>
          </div>
        )}
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md" style={{ backgroundColor: "#fcfbf9", borderColor: "#e6dfd6" }}>
          <DialogHeader>
            <DialogTitle className="text-xl" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Edit Category
            </DialogTitle>
          </DialogHeader>

          {editingEntry && (
            <div className="space-y-5 mt-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: "#f5f1ea" }}>
                <p className="text-sm" style={{ color: "#80746e" }}>Transaction</p>
                <p className="font-medium" style={{ color: "#26121c" }}>
                  {getDisplayText(editingEntry)}
                </p>
                <p className="text-xl font-semibold mt-1" style={{ color: editingEntry.type === "income" ? "#16a34a" : "#e11d48" }}>
                  {editingEntry.type === "income" ? "+" : "-"}{formatCurrency(editingEntry.amount)}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: "#80746e" }}>
                  Select Category
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredCategories
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
                          borderColor: selectedCategory === cat.id ? "#2b825b" : "#e6dfd6",
                          backgroundColor: selectedCategory === cat.id ? "rgba(43, 130, 91, 0.1)" : "#fcfbf9",
                        }}
                      >
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="text-xs font-medium truncate w-full" style={{ color: "#26121c" }}>
                          {cat.name}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              <Button
                onClick={handleUpdateCategory}
                disabled={!selectedCategory}
                className="w-full font-semibold h-12"
                style={{
                  background: !selectedCategory ? "#e6dfd6" : "#2b825b",
                  color: !selectedCategory ? "#80746e" : "#ffffff",
                }}
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