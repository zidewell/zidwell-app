// app/components/journal/TransactionsTab.tsx

"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownLeft, Wallet, RefreshCw, Loader2, CheckCircle2, ChevronDown, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { EntryType } from './types';
import { useJournal } from '@/app/context/JournalContext';
import { useUserContextData } from '@/app/context/userData';
import { useCachedTransactions } from '@/app/hooks/useCachedTransactions'; 

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
  narration?: string;
  category?: string;
}

// Match the same inflow/outflow types as TransactionHistory
const inflowTypes = [
  "deposit",
  "virtual_account_deposit",
  "card_deposit",
  "p2p_received",
  "p2p_credit",
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
  "p2p_debit",
];

const TRANSACTIONS_PER_PAGE = 10;

export function TransactionsTab() {
  const { categories, activeJournalType, refetch, updateWalletEntry, unifiedEntries } = useJournal();
  const { userData } = useUserContextData();

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editingEntry, setEditingEntry] = useState<{
    transactionId: string;
    entryId: string;
  } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Use cached hook for transactions
  const {
    transactions: cachedTransactions,
    hasMore: cachedHasMore,
    isLoading: cachedLoading,
    refresh: refreshCache,
  } = useCachedTransactions(userData?.id, {
    page: currentPage,
    limit: TRANSACTIONS_PER_PAGE,
  });

  // Use the same isOutflow function as TransactionHistory
  const isOutflow = (transactionType: string) => {
    return outflowTypes.includes(transactionType?.toLowerCase());
  };

  // Update allTransactions when cached data changes
  useEffect(() => {
    if (cachedTransactions.length > 0) {
      // Only show completed (success) transactions
      const completedTransactions = cachedTransactions.filter(
        (tx: Transaction) => tx.status?.toLowerCase() === 'success'
      );
      
      if (currentPage === 1) {
        setAllTransactions(completedTransactions);
      } else {
        setAllTransactions(prev => {
          // Avoid duplicates
          const existingIds = new Set(prev.map(tx => tx.id));
          const newTransactions = completedTransactions.filter(tx => !existingIds.has(tx.id));
          return [...prev, ...newTransactions];
        });
      }
      setHasMore(cachedHasMore || false);
    }
  }, [cachedTransactions, currentPage, cachedHasMore]);

  // Initial load and refresh
  useEffect(() => {
    if (!userData?.id) return;
    
    setLoading(true);
    // Initial fetch will be handled by SWR
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [userData?.id]);

  // Handle refresh
  const handleRefresh = async () => {
    setLoading(true);
    setCurrentPage(1);
    await refreshCache();
    await refetch();
    setLoading(false);
  };

  // Handle load more
  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore || !userData?.id) return;
    setIsLoadingMore(true);
    setCurrentPage(prev => prev + 1);
    // SWR will automatically fetch the next page
    setIsLoadingMore(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(Math.abs(value));
  };

  const getJournalEntryForTransaction = (transactionId: string) => {
    return unifiedEntries.find((entry) => entry.originalTransactionId === transactionId);
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
      await updateWalletEntry(editingEntry.transactionId, selectedCategory);
      await refetch();
      setSuccessMessage('Journal entry updated successfully!');
      setShowEditDialog(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to update entry:', err);
      alert('Failed to update journal entry');
    } finally {
      setUpdating(false);
    }
  };

  const getFilteredCategories = () => {
    if (!selectedTransaction) return [];
    // Use the same isOutflow logic as TransactionHistory
    const isOutflowTransaction = isOutflow(selectedTransaction.type);
    const type = isOutflowTransaction ? 'expense' : 'income';
    return categories.filter((cat) => cat.type === type || cat.type === 'both');
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-(--color-accent-yellow)/10">
              <Wallet className="h-5 w-5 text-(--color-accent-yellow)" />
            </div>
            <div>
              <h3 className="font-medium text-(--text-primary)">Wallet Transactions</h3>
              <p className="text-sm text-destructive">Error loading transactions</p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            size="sm"
            className="bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90"
          >
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
        <div className="p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 bg-success/10 border-success/20 text-success">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-(--color-accent-yellow)/10">
            <Wallet className="h-5 w-5 text-(--color-accent-yellow)" />
          </div>
          <div>
            <h3 className="font-medium text-(--text-primary)">Wallet Transactions</h3>
            <p className="text-sm text-(--text-secondary)">
              Transactions are automatically synced to your journal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-(--bg-secondary)">
            <span className="text-xs font-medium text-(--text-secondary)">
              Journal: <span className="text-(--color-accent-yellow)">{activeJournalType}</span>
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="border-(--border-color) text-(--text-secondary) hover:bg-(--bg-secondary)"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-(--color-accent-yellow)" />
        </div>
      ) : allTransactions.length === 0 ? (
        <div className="p-8 rounded-2xl text-center border border-(--border-color) bg-(--bg-primary)">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-(--text-secondary)/40" />
          <h4 className="font-medium mb-2 text-(--text-primary)">No Transactions Yet</h4>
          <p className="text-sm text-(--text-secondary)">Your wallet transactions will appear here automatically</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-(--border-color) bg-(--bg-primary)/50 overflow-hidden">
            <div className="divide-y divide-(--border-color)">
              {allTransactions.map((transaction) => {
                // Use the same isOutflow logic as TransactionHistory
                const isOutflowTransaction = isOutflow(transaction.type);
                const isCredit = !isOutflowTransaction;
                const journalEntry = getJournalEntryForTransaction(transaction.id);
                const isSynced = !!journalEntry;

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-4 p-4 hover:bg-(--bg-secondary)/50 transition-colors group flex-wrap"
                  >
                    {/* Icon - Green for inflow, Destructive (red) for outflow */}
                    <div
                      className={cn(
                        'shrink-0 w-10 h-10 rounded-xl flex items-center justify-center'
                      )}
                      style={{
                        backgroundColor: isCredit ? 'rgba(0, 182, 79, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      }}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="h-5 w-5 text-[#00B64F]" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-destructive" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-(--text-primary)">
                        {transaction.narration || transaction.description || `${transaction.type} transaction`}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-(--text-secondary) flex-wrap">
                        <span>{format(new Date(transaction.created_at), 'MMM d, yyyy, h:mm a')}</span>
                        {transaction.reference && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[100px]">{transaction.reference}</span>
                          </>
                        )}
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-success/20 text-success">
                          {transaction.status}
                        </span>
                        {isSynced && journalEntry && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/20 text-primary">
                            Synced to {journalEntry.type}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount - Green for inflow, Destructive (red) for outflow */}
                    <p className={cn('font-semibold tabular-nums', isCredit ? 'text-[#00B64F]' : 'text-destructive')}>
                      {isCredit ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>

                    {isSynced && journalEntry && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(transaction)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity border-(--border-color) bg-(--bg-primary) text-(--color-accent-yellow) hover:bg-(--bg-secondary)"
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
                className="px-8 border-(--border-color) text-(--text-secondary) bg-(--bg-secondary) hover:bg-(--bg-secondary)/80"
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
        <DialogContent className="sm:max-w-md bg-(--bg-primary) border-(--border-color)">
          <DialogHeader>
            <DialogTitle className="text-xl text-(--text-primary) font-display">
              Edit Journal Category
            </DialogTitle>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-5 mt-4">
              <div className="p-4 rounded-xl bg-(--bg-secondary)">
                <p className="font-medium text-(--text-primary)">
                  {selectedTransaction.narration || selectedTransaction.description || 'Wallet Transaction'}
                </p>
                <p className={cn(
                  'text-xl font-semibold mt-1',
                  !isOutflow(selectedTransaction.type) ? 'text-[#00B64F]' : 'text-destructive'
                )}>
                  {formatCurrency(selectedTransaction.amount)}
                </p>
                <p className="text-sm text-(--text-secondary) mt-1">
                  {format(new Date(selectedTransaction.created_at), 'MMMM d, yyyy, h:mm a')}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-(--text-secondary)">
                  Select New Category
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {getFilteredCategories().map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center'
                      )}
                      style={{
                        borderColor: selectedCategory === cat.id ? 'var(--color-accent-yellow)' : 'var(--border-color)',
                        backgroundColor: selectedCategory === cat.id ? 'rgba(253, 192, 32, 0.1)' : 'var(--bg-primary)',
                      }}
                    >
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="text-xs font-medium truncate w-full text-(--text-primary)">
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleUpdateCategory}
                disabled={!selectedCategory || updating}
                className="w-full font-semibold h-12 bg-(--color-accent-yellow) text-(--color-ink) hover:bg-(--color-accent-yellow)/90 disabled:opacity-50"
              >
                {updating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Category'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}