"use client"
import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  RefreshCw, 
  Loader2, 
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { EntryType } from './types';
import { useJournal } from '@/app/context/JournalContext';
import { useUserContextData } from '@/app/context/userData';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  created_at: string;
  description: string;
  amount: number;
  type: string;
  status: string;
  reference?: string;
  fee?: number;
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
  const { 
    categories, 
    addEntry, 
    activeJournalType,
    refetch 
  } = useJournal();
  const { userData } = useUserContextData();

  // Transaction state
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add to journal state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addingToJournal, setAddingToJournal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [addedAmount, setAddedAmount] = useState<number>(0);
  const [addedType, setAddedType] = useState<string>('');

  // Load more state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch transactions
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
      console.error('Error fetching transactions:', err);
      throw err;
    }
  };

  // Load initial transactions
  useEffect(() => {
    if (!userData?.id) return;

    const loadInitialTransactions = async () => {
      setLoading(true);
      try {
        const data = await fetchTransactions(1);
        if (data?.transactions && data.transactions.length > 0) {
          // Only show successful transactions
          const completedTransactions = data.transactions.filter(
            (tx: Transaction) => tx.status?.toLowerCase() === 'success'
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
        setError(err instanceof Error ? err.message : 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    loadInitialTransactions();
  }, [userData?.id]);

  // Handle Load More
  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore || !userData?.id) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const data = await fetchTransactions(nextPage);
      
      if (data?.transactions && data.transactions.length > 0) {
        const completedTransactions = data.transactions.filter(
          (tx: Transaction) => tx.status?.toLowerCase() === 'success'
        );
        setAllTransactions(prev => [...prev, ...completedTransactions]);
        setCurrentPage(nextPage);
        setHasMore(data.hasMore || false);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more transactions:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(Math.abs(value));
  };

  const openAddDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setSelectedCategory('');
    setShowAddDialog(true);
  };

  const handleAddToJournal = async () => {
    if (!selectedTransaction || !selectedCategory) return;

    setAddingToJournal(true);
    setSuccessMessage(null);
    
    const isCredit = inflowTypes.includes(selectedTransaction.type?.toLowerCase());
    const entryType: EntryType = isCredit ? 'income' : 'expense';
    const amount = Math.abs(selectedTransaction.amount);
    
    try {
      await addEntry({
        date: new Date(selectedTransaction.created_at).toISOString(),
        type: entryType,
        amount: amount,
        categoryId: selectedCategory,
        note: selectedTransaction.description || selectedTransaction.reference || 'Wallet transaction',
        journalType: activeJournalType,
      });

      setShowAddDialog(false);
      setSelectedTransaction(null);
      setSelectedCategory('');
      
      setAddedAmount(amount);
      setAddedType(entryType);
      
      setSuccessMessage(
        `Added ${formatCurrency(amount)} to ${entryType}`
      );

      // Remove the transaction from the list
      setAllTransactions(prev => prev.filter(tx => tx.id !== selectedTransaction.id));
      
      await refetch();

      setTimeout(() => setSuccessMessage(null), 5000);

    } catch (err) {
      console.error('Failed to add entry:', err);
      alert('Failed to add transaction to journal');
    } finally {
      setAddingToJournal(false);
    }
  };

  const getFilteredCategories = () => {
    if (!selectedTransaction) return [];
    
    const isCredit = inflowTypes.includes(selectedTransaction.type?.toLowerCase());
    const type = isCredit ? 'income' : 'expense';
    
    return categories.filter(cat => cat.type === type || cat.type === 'both');
  };

  // Get today's date in YYYY-MM-DD format
  const getToday = () => {
    return new Date().toISOString().split('T')[0];
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#C29307]/10">
              <Wallet className="h-5 w-5 text-[#C29307]" />
            </div>
            <div>
              <h3 className="font-medium" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Wallet Transactions
              </h3>
              <p className="text-sm text-[#e11d48]">
                Error loading transactions
              </p>
            </div>
          </div>
          <Button
            onClick={() => window.location.reload()}
            size="sm"
            style={{
              backgroundColor: '#C29307',
              color: '#26121c'
            }}
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
        <div 
          className="p-4 rounded-xl border animate-in fade-in slide-in-from-top-2"
          style={{
            backgroundColor: addedType === 'income' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(225, 29, 72, 0.1)',
            borderColor: addedType === 'income' ? '#16a34a' : '#e11d48',
            color: addedType === 'income' ? '#16a34a' : '#e11d48'
          }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <p className="text-xs mt-1 text-gray-600">
            Added to your {activeJournalType} journal
          </p>
        </div>
      )}

      {/* Header - Exact match from mock */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#C29307]/10">
            <Wallet className="h-5 w-5 text-[#C29307]" />
          </div>
          <div>
            <h3 className="font-medium" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Wallet Transactions
            </h3>
            <p className="text-sm text-[#80746e]">
              Add transactions to your {activeJournalType} journal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#f5f1ea]">
            <span className="text-xs font-medium text-[#80746e]">
              Journal: <span className="text-[#C29307]">{activeJournalType}</span>
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
                  (tx: Transaction) => tx.status?.toLowerCase() === 'success'
                ) || [];
                setAllTransactions(completedTransactions);
                setHasMore(data?.hasMore || false);
                setCurrentPage(1);
                setLoading(false);
              }
            }}
            style={{
              borderColor: '#e6dfd6',
              color: '#80746e',
              backgroundColor: '#f5f1ea'
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#C29307]" />
        </div>
      ) : allTransactions.length === 0 ? (
        <div 
          className="p-8 rounded-2xl text-center border"
          style={{
            backgroundColor: '#fcfbf9',
            borderColor: '#e6dfd6'
          }}
        >
          <Wallet className="h-12 w-12 mx-auto mb-4" style={{ color: '#e6dfd6' }} />
          <h4 className="font-medium mb-2" style={{ color: '#26121c' }}>
            No Completed Transactions
          </h4>
          <p style={{ color: '#80746e' }}>
            Your successful wallet transactions will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Transactions List - Exact match from mock */}
          <div 
            className="rounded-2xl border overflow-hidden"
            style={{
              backgroundColor: 'rgba(252, 251, 249, 0.5)',
              borderColor: '#e6dfd6'
            }}
          >
            <div className="divide-y" style={{ borderColor: '#e6dfd6' }}>
              {allTransactions.map((transaction) => {
                const isCredit = inflowTypes.includes(transaction.type?.toLowerCase());
                
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-4 p-4 hover:bg-[#f5f1ea]/50 transition-colors group"
                  >
                    <div 
                      className={cn(
                        'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center'
                      )}
                      style={{
                        backgroundColor: isCredit ? 'rgba(22, 163, 74, 0.1)' : 'rgba(225, 29, 72, 0.1)'
                      }}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="h-5 w-5" style={{ color: '#16a34a' }} />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" style={{ color: '#e11d48' }} />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" style={{ color: '#26121c' }}>
                        {transaction.description || `${transaction.type} transaction`}
                      </p>
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#80746e' }}>
                        <span>{format(new Date(transaction.created_at), 'MMM d, yyyy')}</span>
                        {transaction.reference && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[100px]">{transaction.reference}</span>
                          </>
                        )}
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                          {transaction.status}
                        </span>
                      </div>
                    </div>

                    <p 
                      className={cn(
                        'font-semibold tabular-nums'
                      )}
                      style={{ 
                        color: isCredit ? '#16a34a' : '#e11d48' 
                      }}
                    >
                      {isCredit ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAddDialog(transaction)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        borderColor: '#e6dfd6',
                        backgroundColor: '#fcfbf9',
                        color: isCredit ? '#16a34a' : '#e11d48'
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add to Journal
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-6">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-8"
                style={{
                  borderColor: '#e6dfd6',
                  color: '#80746e',
                  backgroundColor: '#f5f1ea'
                }}
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
              <p className="text-sm mt-2" style={{ color: '#80746e' }}>
                Showing {allTransactions.length} transactions
                {hasMore && " (More available)"}
              </p>
            </div>
          )}

          {/* No More Transactions Message */}
          {!hasMore && allTransactions.length > 0 && (
            <div className="text-center mt-6 pt-6 border-t" style={{ borderColor: '#e6dfd6' }}>
              <p className="text-sm" style={{ color: '#80746e' }}>
                You've reached the end of your transaction history
              </p>
              <p className="text-xs mt-1" style={{ color: '#80746e' }}>
                Total loaded: {allTransactions.length} transactions
              </p>
            </div>
          )}
        </>
      )}

      {/* Add to Journal Dialog - Exact match from mock */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent 
          className="sm:max-w-md"
          style={{
            backgroundColor: '#fcfbf9',
            borderColor: '#e6dfd6'
          }}
        >
          <DialogHeader>
            <DialogTitle 
              className="text-xl"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Add to {selectedTransaction && (() => {
                const isCredit = inflowTypes.includes(selectedTransaction.type?.toLowerCase());
                return isCredit ? 'Income' : 'Expense';
              })()}
            </DialogTitle>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-5 mt-4">
              {/* Transaction Summary */}
              <div 
                className="p-4 rounded-xl"
                style={{ backgroundColor: '#f5f1ea' }}
              >
                <p className="font-medium" style={{ color: '#26121c' }}>
                  {selectedTransaction.description || 'Wallet Transaction'}
                </p>
                <p 
                  className="text-xl font-semibold mt-1"
                  style={{ 
                    color: inflowTypes.includes(selectedTransaction.type?.toLowerCase()) 
                      ? '#16a34a' 
                      : '#e11d48'
                  }}
                >
                  {inflowTypes.includes(selectedTransaction.type?.toLowerCase()) ? '+' : '-'}
                  {formatCurrency(selectedTransaction.amount)}
                </p>
                <p className="text-sm mt-1" style={{ color: '#80746e' }}>
                  {format(new Date(selectedTransaction.created_at), 'MMMM d, yyyy')}
                </p>
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: '#80746e' }}>
                  Select Category
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
                        borderColor: selectedCategory === cat.id ? '#C29307' : '#e6dfd6',
                        backgroundColor: selectedCategory === cat.id ? 'rgba(194, 147, 7, 0.1)' : '#fcfbf9',
                        boxShadow: selectedCategory === cat.id ? '0 2px 20px -4px rgba(38,33,28,0.08)' : 'none'
                      }}
                    >
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="text-xs font-medium truncate w-full" style={{ color: '#26121c' }}>
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
                {getFilteredCategories().length === 0 && (
                  <p className="text-sm text-center py-4" style={{ color: '#e11d48' }}>
                    No categories available for this transaction type.
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                onClick={handleAddToJournal}
                disabled={!selectedCategory || addingToJournal}
                className="w-full font-semibold h-12"
                style={{
                  background: !selectedCategory || addingToJournal 
                    ? '#e6dfd6' 
                    : 'linear-gradient(135deg, #C29307 0%, #eab308 100%)',
                  color: !selectedCategory || addingToJournal ? '#80746e' : '#26121c',
                  boxShadow: !selectedCategory || addingToJournal 
                    ? 'none' 
                    : '0 4px 20px -4px rgba(194, 147, 7, 0.3)',
                  border: 'none'
                }}
              >
                {addingToJournal ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding to Journal...
                  </>
                ) : (
                  'Add to Journal'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}