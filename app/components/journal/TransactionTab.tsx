"use client";
import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  RefreshCw,
  Loader2,
  CheckCircle2,
  ChevronDown,
  Edit2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { EntryType } from "./types";
import { useJournal } from "@/app/context/JournalContext";
import { useUserContextData } from "@/app/context/userData";
import { format } from "date-fns";

interface Transaction {
  id: string;
  created_at: string;
  description: string;
  amount: number;
  type: string;
  status: string;
  reference?: string;
  fee?: number;
  synced_to_journal?: boolean;
  journal_entry_id?: string;
  synced_at?: string;
}

const inflowTypes = [
  "deposit",
  "virtual_account_deposit",
  "card_deposit",
  "p2p_received",
  "referral",
  "referral_reward",
];

const outflowTypes = [
  "transfer",
  "withdrawal",
  "debit",
  "airtime",
  "data",
  "electricity",
  "cable",
  "p2p_transfer",
];

const TRANSACTIONS_PER_PAGE = 10;

export function TransactionsTab() {
  const { categories, activeJournalType, refetch, entries, updateEntry } = useJournal();
  const { userData } = useUserContextData();

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editingEntry, setEditingEntry] = useState<{ transactionId: string; entryId: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchTransactions = async (page: number = 1) => {
    if (!userData?.id) return null;
    try {
      const params = new URLSearchParams({
        userId: userData.id,
        page: page.toString(),
        limit: TRANSACTIONS_PER_PAGE.toString(),
      });
      const response = await fetch(`/api/bill-transactions?${params.toString()}`);
      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Error fetching transactions:", err);
      throw err;
    }
  };

  useEffect(() => {
    if (!userData?.id) return;
    const loadInitialTransactions = async () => {
      setLoading(true);
      try {
        const data = await fetchTransactions(1);
        if (data?.transactions && data.transactions.length > 0) {
          const completedTransactions = data.transactions.filter(
            (tx: Transaction) => tx.status?.toLowerCase() === "success",
          );
          setAllTransactions(completedTransactions);
          setHasMore(data.hasMore || false);
          setCurrentPage(1);
        } else {
          setAllTransactions([]);
          setHasMore(false);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };
    loadInitialTransactions();
  }, [userData?.id]);

  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore || !userData?.id) return;
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const data = await fetchTransactions(nextPage);
      if (data?.transactions && data.transactions.length > 0) {
        const completedTransactions = data.transactions.filter(
          (tx: Transaction) => tx.status?.toLowerCase() === "success",
        );
        setAllTransactions((prev) => [...prev, ...completedTransactions]);
        setCurrentPage(nextPage);
        setHasMore(data.hasMore || false);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more transactions:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(Math.abs(value));
  };

  const getJournalEntryForTransaction = (transactionId: string) => {
    return entries.find(entry => entry.note?.includes(transactionId));
  };

  const openEditDialog = (transaction: Transaction) => {
    const entry = getJournalEntryForTransaction(transaction.id);
    if (entry) {
      setEditingEntry({ transactionId: transaction.id, entryId: entry.id });
      setSelectedCategory(entry.categoryId);
      setSelectedTransaction(transaction);
      setShowEditDialog(true);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingEntry || !selectedCategory) return;
    
    setUpdating(true);
    try {
      await updateEntry(editingEntry.entryId, {
        categoryId: selectedCategory,
      });
      await refetch();
      setSuccessMessage("Journal entry updated successfully!");
      setShowEditDialog(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to update entry:", err);
      alert("Failed to update journal entry");
    } finally {
      setUpdating(false);
    }
  };

  const getFilteredCategories = () => {
    if (!selectedTransaction) return [];
    const isCredit = inflowTypes.includes(selectedTransaction.type?.toLowerCase());
    const type = isCredit ? "income" : "expense";
    return categories.filter((cat) => cat.type === type || cat.type === "both");
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#2b825b]/10">
              <Wallet className="h-5 w-5 text-[#2b825b]" />
            </div>
            <div>
              <h3 className="font-medium dark:text-gray-100" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Wallet Transactions
              </h3>
              <p className="text-sm text-[#e11d48] dark:text-red-400">Error loading transactions</p>
            </div>
          </div>
          <Button onClick={() => window.location.reload()} size="sm" className="dark:bg-[#2b825b]"
            style={{ backgroundColor: "#2b825b", color: "#ffffff" }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#2b825b]/10">
            <Wallet className="h-5 w-5 text-[#2b825b]" />
          </div>
          <div>
            <h3 className="font-medium dark:text-gray-100" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Wallet Transactions
            </h3>
            <p className="text-sm dark:text-gray-400" style={{ color: "#80746e" }}>
              Transactions are automatically synced to your journal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#f5f1ea] dark:bg-gray-700">
            <span className="text-xs font-medium text-[#80746e] dark:text-gray-400">
              Journal: <span className="text-[#2b825b] dark:text-[#3aa873]">{activeJournalType}</span>
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (userData?.id) {
                setLoading(true);
                const data = await fetchTransactions(1);
                const completedTransactions = data?.transactions?.filter(
                  (tx: Transaction) => tx.status?.toLowerCase() === "success",
                ) || [];
                setAllTransactions(completedTransactions);
                setHasMore(data?.hasMore || false);
                setCurrentPage(1);
                setLoading(false);
                await refetch();
              }
            }}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
            style={{ borderColor: "#e6dfd6", color: "#80746e", backgroundColor: "#f5f1ea" }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#2b825b]" />
        </div>
      ) : allTransactions.length === 0 ? (
        <div className="p-8 rounded-2xl text-center border" style={{ backgroundColor: "#fcfbf9", borderColor: "#e6dfd6" }}>
          <Wallet className="h-12 w-12 mx-auto mb-4" style={{ color: "#e6dfd6" }} />
          <h4 className="font-medium mb-2" style={{ color: "#26121c" }}>No Transactions Yet</h4>
          <p className="text-sm" style={{ color: "#80746e" }}>Your wallet transactions will appear here automatically</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "rgba(252, 251, 249, 0.5)", borderColor: "#e6dfd6" }}>
            <div className="divide-y" style={{ borderColor: "#e6dfd6" }}>
              {allTransactions.map((transaction) => {
                const isCredit = inflowTypes.includes(transaction.type?.toLowerCase());
                const isSynced = transaction.synced_to_journal === true;
                const journalEntry = getJournalEntryForTransaction(transaction.id);

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-4 p-4 hover:bg-[#f5f1ea]/50 transition-colors group"
                  >
                    <div
                      className={cn("shrink-0 w-10 h-10 rounded-xl flex items-center justify-center")}
                      style={{
                        backgroundColor: isCredit ? "rgba(22, 163, 74, 0.1)" : "rgba(225, 29, 72, 0.1)",
                      }}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="h-5 w-5" style={{ color: "#16a34a" }} />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" style={{ color: "#e11d48" }} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" style={{ color: "#26121c" }}>
                        {transaction.description || `${transaction.type} transaction`}
                      </p>
                      <div className="flex items-center gap-2 text-xs" style={{ color: "#80746e" }}>
                        <span>{format(new Date(transaction.created_at), "MMM d, yyyy, h:mm a")}</span>
                        {transaction.reference && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[100px]">{transaction.reference}</span>
                          </>
                        )}
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                          {transaction.status}
                        </span>
                        {isSynced && journalEntry && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">
                            Synced to {journalEntry.type}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className={cn("font-semibold tabular-nums")} style={{ color: isCredit ? "#16a34a" : "#e11d48" }}>
                      {isCredit ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>

                    {isSynced && journalEntry && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(transaction)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ borderColor: "#e6dfd6", backgroundColor: "#fcfbf9", color: "#2b825b" }}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit Category
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {hasMore && (
            <div className="text-center mt-6">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-8"
                style={{ borderColor: "#e6dfd6", color: "#80746e", backgroundColor: "#f5f1ea" }}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading More...
                  </>
                ) : (
                  <>
                    Load More Transactions
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Edit Category Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md" style={{ backgroundColor: "#fcfbf9", borderColor: "#e6dfd6" }}>
          <DialogHeader>
            <DialogTitle className="text-xl" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Edit Journal Category
            </DialogTitle>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-5 mt-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: "#f5f1ea" }}>
                <p className="font-medium" style={{ color: "#26121c" }}>
                  {selectedTransaction.description || "Wallet Transaction"}
                </p>
                <p className="text-xl font-semibold mt-1" style={{ color: inflowTypes.includes(selectedTransaction.type?.toLowerCase()) ? "#16a34a" : "#e11d48" }}>
                  {formatCurrency(selectedTransaction.amount)}
                </p>
                <p className="text-sm mt-1" style={{ color: "#80746e" }}>
                  {format(new Date(selectedTransaction.created_at), "MMMM d, yyyy, h:mm a")}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: "#80746e" }}>
                  Select New Category
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {getFilteredCategories().map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center",
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
                disabled={!selectedCategory || updating}
                className="w-full font-semibold h-12"
                style={{
                  background: !selectedCategory || updating ? "#e6dfd6" : "#2b825b",
                  color: !selectedCategory || updating ? "#80746e" : "#ffffff",
                }}
              >
                {updating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Category"
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}