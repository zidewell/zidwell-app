"use client"

import { useState, useEffect, useCallback, useMemo } from 'react';
import { JournalEntry, Category, JournalType, DEFAULT_CATEGORIES, PeriodSummary } from '../components/journal/types'; 
import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  isWithinInterval,
  parseISO
} from 'date-fns';
import { useUserContextData } from '../context/userData'; 

export interface UnifiedTransaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  amount: number;
  categoryId: string;
  categoryName?: string;
  note: string;
  source: 'wallet';
  journalType: JournalType;
  originalTransactionId?: string;
  walletTransactionType?: string;
  status?: string;
  transactionDescription?: string;
  reference?: string;
}

interface WalletTransaction {
  id: string;
  created_at: string;
  description: string;
  amount: number;
  type: string;
  status: string;
  reference?: string;
  fee?: number;
  narration?: string;
  merchant_tx_ref?: string;
  user_id: string;
  category?: string;
  category_id?: string;
  net_amount?: number;
  gross_amount?: number;
  total_deduction?: number;
  balance_before?: number;
  balance_after?: number;
}

const API_BASE = '/api/journal';

// Complete inflow types
const INFLOW_TYPES = [
  'card_deposit', 'credit', 'deposit', 'p2p_credit',
  'p2p_received', 'referral', 'referral_reward',
  'virtual_account_deposit', 'refund', 'cashback',
  'reversal', 'salary', 'invoice_payment', 'bonus'
];

// Complete outflow types
const OUTFLOW_TYPES = [
  'airtime', 'contract', 'data', 'debit', 'p2p_transfer',
  'transfer', 'withdrawal', 'electricity', 'cable',
  'bill_payment', 'purchase', 'subscription', 'fee',
  'charge', 'bill'
];

const SUCCESS_STATUSES = ['success', 'successful', 'completed'];

async function fetchWithAuth(endpoint: string, options: RequestInit = {}, userId: string) {
  const isMutation = options.method === 'POST' || options.method === 'PUT';
  
  let url = `${API_BASE}${endpoint}`;
  
  if (!isMutation) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}userId=${encodeURIComponent(userId)}`;
  }

  const requestOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  };

  if (isMutation && options.body) {
    try {
      const bodyData = JSON.parse(options.body as string);
      if (!bodyData.userId) {
        bodyData.userId = userId;
        requestOptions.body = JSON.stringify(bodyData);
      }
    } catch (e) {
      // leave as is
    }
  }

  const res = await fetch(url, requestOptions);

  if (!res.ok) {
    let errorMessage = `API error (${res.status})`;
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      try {
        const textError = await res.text();
        if (textError) errorMessage = textError;
      } catch {
        // ignore
      }
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

export function useJournalStore() {
  const { userData, balance: userBalance } = useUserContextData();
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [activeJournalType, setActiveJournalType] = useState<JournalType>('business');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [realWalletBalance, setRealWalletBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const userId = userData?.id;

  const forceUpdate = useCallback(() => {
    setUpdateTrigger(prev => prev + 1);
  }, []);

  // Determine if transaction is income or expense
  const getWalletTransactionType = useCallback((transaction: WalletTransaction): 'income' | 'expense' => {
    const transactionType = transaction.type?.toLowerCase();
    
    if (INFLOW_TYPES.includes(transactionType)) {
      return 'income';
    }
    
    if (OUTFLOW_TYPES.includes(transactionType)) {
      return 'expense';
    }
    
    if (transaction.amount > 0) {
      return 'income';
    } else if (transaction.amount < 0) {
      return 'expense';
    }
    
    return 'expense';
  }, []);

  // Calculate the correct effective amount for a transaction
  const getEffectiveAmount = useCallback((transaction: WalletTransaction): number => {
    const txType = transaction.type?.toLowerCase() || '';
    const status = transaction.status?.toLowerCase() || '';
    const isSuccess = SUCCESS_STATUSES.includes(status);
    const isInflow = INFLOW_TYPES.includes(txType);
    const isOutflow = OUTFLOW_TYPES.includes(txType);

    // Only count successful transactions
    if (!isSuccess) {
      // Special case: failed_refunded airtime is counted as inflow
      if (txType === 'airtime' && status === 'failed_refunded') {
        return Math.abs(transaction.amount || 0);
      }
      return 0;
    }

    // INFLOW transactions
    if (isInflow) {
      // Use net_amount if available
      if (transaction.net_amount != null && transaction.net_amount > 0) {
        return Math.abs(transaction.net_amount);
      }
      // Otherwise amount minus fee
      return Math.max(0, Math.abs(transaction.amount || 0) - (transaction.fee || 0));
    }

    // OUTFLOW transactions
    if (isOutflow) {
      // FIX: For withdrawals, ONLY use the amount (fee is NOT deducted from wallet balance)
      if (txType === 'withdrawal') {
        return Math.abs(transaction.amount || 0);
      }

      // For airtime and data, use gross_amount if available
      if (['airtime', 'data'].includes(txType)) {
        if (transaction.gross_amount != null && transaction.gross_amount > 0) {
          return Math.abs(transaction.gross_amount);
        }
        return Math.abs(transaction.amount || 0);
      }

      // For other outflows, use total_deduction if available
      if (transaction.total_deduction != null && transaction.total_deduction > 0) {
        return Math.abs(transaction.total_deduction);
      }

      // Fallback: amount + fee
      return Math.abs(transaction.amount || 0) + (transaction.fee || 0);
    }

    // Unknown transaction type - fallback to amount
    return Math.abs(transaction.amount || 0);
  }, []);

  const getCategoryIdFromName = useCallback((categoryName: string, transactionType: string, isOutflow: boolean): string => {
    if (categoryName && categoryName.trim()) {
      const matchedCategory = categories.find(
        c => c.name.toLowerCase() === categoryName.toLowerCase()
      );
      if (matchedCategory) {
        return matchedCategory.id;
      }
    }
    
    const type = transactionType?.toLowerCase();
    
    if (isOutflow) {
      if (type === 'bill_payment' || type === 'bill') {
        const billsCat = categories.find(c => c.name.toLowerCase() === 'bills');
        if (billsCat) return billsCat.id;
      }
      if (type === 'withdrawal') {
        const cat = categories.find(c => c.name.toLowerCase() === 'cash withdrawal');
        if (cat) return cat.id;
      }
      if (type === 'transfer' || type === 'p2p_transfer' || type === 'debit') {
        const cat = categories.find(c => c.name.toLowerCase() === 'transfer');
        if (cat) return cat.id;
      }
      if (type === 'airtime') {
        const cat = categories.find(c => c.name.toLowerCase() === 'call airtime');
        if (cat) return cat.id;
      }
      if (type === 'data') {
        const cat = categories.find(c => c.name.toLowerCase() === 'data / internet');
        if (cat) return cat.id;
      }
      if (type === 'electricity') {
        const cat = categories.find(c => c.name.toLowerCase() === 'electricity bill');
        if (cat) return cat.id;
      }
      
      const otherExpense = categories.find(c => c.name.toLowerCase() === 'other expense');
      if (otherExpense) return otherExpense.id;
      
      return '';
    } else {
      const salesRevenue = categories.find(c => c.name.toLowerCase() === 'sales revenue');
      if (salesRevenue) return salesRevenue.id;
      
      const otherIncome = categories.find(c => c.name.toLowerCase() === 'other income');
      if (otherIncome) return otherIncome.id;
      
      return '';
    }
  }, [categories]);

  const fetchWalletTransactions = useCallback(async () => {
    if (!userId) return [];
    try {
      const response = await fetch(`/api/bill-transactions?userId=${userId}&limit=500`);
      const data = await response.json();
      console.log('💰 Wallet transactions fetched:', data?.transactions?.length || 0);
      return data?.transactions || [];
    } catch (err) {
      console.error("Error fetching wallet transactions:", err);
      return [];
    }
  }, [userId]);

  // Fetch REAL wallet balance from /api/wallet-balance
  const fetchRealWalletBalance = useCallback(async () => {
    if (!userId) return null;
    setBalanceLoading(true);
    try {
      const response = await fetch('/api/wallet-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();
      if (data.success) {
        console.log('💰 Real wallet balance fetched:', data.wallet_balance);
        return data.wallet_balance || 0;
      }
      return null;
    } catch (err) {
      console.error("Error fetching real wallet balance:", err);
      return null;
    } finally {
      setBalanceLoading(false);
    }
  }, [userId]);

  const loadData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const categoriesData = await fetchWithAuth('/categories', {}, userId);
      const mergedCategories = [
        ...DEFAULT_CATEGORIES,
        ...categoriesData.filter((cat: Category) => cat.isCustom)
      ];
      setCategories(mergedCategories);
      
      const walletData = await fetchWalletTransactions();
      setWalletTransactions(walletData);
      
      // Fetch REAL wallet balance from dedicated endpoint
      const realBalance = await fetchRealWalletBalance();
      if (realBalance !== null) {
        setRealWalletBalance(realBalance);
      }
      
      forceUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, forceUpdate, fetchWalletTransactions, fetchRealWalletBalance]);

  useEffect(() => {
    if (userId) {
      loadData();
    } else {
      setWalletTransactions([]);
      setCategories(DEFAULT_CATEGORIES);
      setRealWalletBalance(null);
      setLoading(false);
    }
  }, [userId, loadData]);

  const addEntry = useCallback(async (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => {
    console.warn('Manual entry creation is disabled. Use wallet transactions instead.');
    
    if (typeof window !== 'undefined') {
      const Swal = require('sweetalert2').default;
      Swal.fire({
        icon: "info",
        title: "Manual Entry Disabled",
        text: "All transactions are automatically synced from your wallet activity. Manual entries are not available.",
        confirmButtonColor: "var(--color-accent-yellow)",
        timer: 3000,
      });
    }
    
    return {
      id: crypto.randomUUID(),
      ...entry,
      createdAt: new Date().toISOString(),
    } as JournalEntry;
  }, []);

  const updateEntry = useCallback(async (id: string, updates: any) => {
    console.warn('Manual entry update is disabled. Use wallet transactions instead.');
    
    if (typeof window !== 'undefined') {
      const Swal = require('sweetalert2').default;
      Swal.fire({
        icon: "info",
        title: "Manual Update Disabled",
        text: "Transactions are automatically synced from your wallet. Category changes can be made via the edit button on each entry.",
        confirmButtonColor: "var(--color-accent-yellow)",
        timer: 3000,
      });
    }
    
    return { id, ...updates };
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    if (!userId) throw new Error('User not authenticated');
    
    if (id.startsWith('wallet_')) {
      const hiddenWalletEntries = JSON.parse(localStorage.getItem(`hidden_wallet_entries_${userId}`) || '[]');
      if (!hiddenWalletEntries.includes(id)) {
        hiddenWalletEntries.push(id);
        localStorage.setItem(`hidden_wallet_entries_${userId}`, JSON.stringify(hiddenWalletEntries));
      }
      forceUpdate();
      return;
    }
    
    throw new Error('Only wallet transactions can be hidden');
  }, [userId, forceUpdate]);

  const updateWalletEntry = useCallback(async (transactionId: string, categoryId: string) => {
    if (!userId) throw new Error('User not authenticated');
    
    try {
      const walletCategoryOverrides = JSON.parse(localStorage.getItem(`wallet_category_overrides_${userId}`) || '{}');
      walletCategoryOverrides[transactionId] = categoryId;
      localStorage.setItem(`wallet_category_overrides_${userId}`, JSON.stringify(walletCategoryOverrides));
      forceUpdate();
      return true;
    } catch (err) {
      console.error('Failed to update wallet entry category:', err);
      throw err;
    }
  }, [userId, forceUpdate]);

  const addCategory = useCallback(async (category: Omit<Category, 'id' | 'isCustom'>) => {
    if (!userId) throw new Error('User not authenticated');
    
    try {
      const data = await fetchWithAuth('/categories', {
        method: 'POST',
        body: JSON.stringify({ ...category, userId }),
      }, userId);
      
      const newCategory = data as Category;
      setCategories(prev => [...prev, newCategory]);
      forceUpdate();
      return newCategory;
    } catch (err) {
      console.error('Failed to add category:', err);
      throw err;
    }
  }, [userId, forceUpdate]);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    if (!userId) throw new Error('User not authenticated');
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchWithAuth(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...updates,
          userId,
        }),
      }, userId);
      
      setCategories(prev =>
        prev.map(cat => cat.id === id ? { ...cat, ...data } : cat)
      );
      
      forceUpdate();
      return data;
    } catch (error) {
      console.error('Error updating category:', error);
      setError(error instanceof Error ? error.message : 'Failed to update category');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userId, forceUpdate]);

  const deleteCategory = useCallback(async (id: string) => {
    if (!userId) throw new Error('User not authenticated');
    
    try {
      setLoading(true);
      setError(null);
      
      await fetchWithAuth(`/categories/${id}`, {
        method: 'DELETE',
      }, userId);

      setCategories(prev => prev.filter(cat => cat.id !== id));
      forceUpdate();
    } catch (error) {
      console.error('Error deleting category:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete category');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userId, forceUpdate]);

  // Calculate unified entries with correct amount logic
  const unifiedEntries: UnifiedTransaction[] = useMemo(() => {
    const hiddenWalletEntries = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(`hidden_wallet_entries_${userId}`) || '[]') : [];
    const walletCategoryOverrides = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(`wallet_category_overrides_${userId}`) || '{}') : {};
    
    const walletEntries: UnifiedTransaction[] = walletTransactions
      .filter(tx => {
        const walletId = `wallet_${tx.id}`;
        const status = tx.status?.toLowerCase() || '';
        // Include success transactions and failed_refunded airtime
        const include = SUCCESS_STATUSES.includes(status) || 
                       (tx.type?.toLowerCase() === 'airtime' && status === 'failed_refunded');
        return include && !hiddenWalletEntries.includes(walletId);
      })
      .map(tx => {
        const txType = getWalletTransactionType(tx);
        const isInflow = txType === 'income';
        const isOutflow = txType === 'expense';
        const primaryDescription = tx.narration || tx.description || `${tx.type} transaction`;
        
        // Determine category ID
        let categoryId = walletCategoryOverrides[tx.id] || '';
        
        if (!categoryId && tx.category_id) {
          categoryId = tx.category_id;
        }
        
        if (!categoryId) {
          const transactionCategoryName = tx.category || '';
          categoryId = getCategoryIdFromName(transactionCategoryName, tx.type, isOutflow);
        }
        
        // Use the getEffectiveAmount function
        const amount = getEffectiveAmount(tx);
        const finalAmount = Math.max(0, amount);

        const matchedCategory = categories.find(c => c.id === categoryId);
        
        return {
          id: `wallet_${tx.id}`,
          date: new Date(tx.created_at).toISOString(),
          type: txType,
          amount: finalAmount,
          categoryId: categoryId || (isInflow ? 'income_other' : 'expense_other'),
          categoryName: tx.category || matchedCategory?.name || (isInflow ? 'Other Income' : 'Other Expense'),
          note: primaryDescription,
          source: 'wallet',
          journalType: activeJournalType,
          originalTransactionId: tx.id,
          walletTransactionType: tx.type,
          status: tx.status,
          transactionDescription: primaryDescription,
          reference: tx.reference,
        };
      });

    console.log(`📊 Total entries from transactions: ${walletEntries.length}`);
    console.log(`📊 Total Income: ${walletEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0)}`);
    console.log(`📊 Total Expenses: ${walletEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0)}`);
    
    return walletEntries.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [walletTransactions, activeJournalType, getWalletTransactionType, getEffectiveAmount, getCategoryIdFromName, userId, categories]);

  // Calculate client-side balance for comparison
  const clientBalance = useMemo(() => {
    const totalInflow = unifiedEntries
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const totalOutflow = unifiedEntries
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);
    
    return totalInflow - totalOutflow;
  }, [unifiedEntries]);

  const getFilteredEntries = useCallback((journalType: JournalType) => {
    return unifiedEntries.filter(entry => entry.journalType === journalType);
  }, [unifiedEntries]);

  const getEntriesForPeriod = useCallback((journalType: JournalType, startDate: Date, endDate: Date) => {
    return unifiedEntries.filter(entry => {
      const entryDate = parseISO(entry.date);
      return entry.journalType === journalType &&
             isWithinInterval(entryDate, { start: startDate, end: endDate });
    });
  }, [unifiedEntries]);

  const calculateSummary = useCallback((filteredEntries: UnifiedTransaction[]): PeriodSummary => {
    const income = filteredEntries
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const expenses = filteredEntries
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      income,
      expenses,
      net: income - expenses,
      savings: 0,
      investments: 0,
    };
  }, []);

  const getAllTimeSummary = useCallback((journalType: JournalType) => {
    const filteredEntries = unifiedEntries.filter(entry => entry.journalType === journalType);
    
    const income = filteredEntries
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const expenses = filteredEntries
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      income,
      expenses,
      net: income - expenses,
      savings: 0,
      investments: 0,
    };
  }, [unifiedEntries]);

  const getTodaySummary = useCallback((journalType: JournalType) => {
    const today = new Date();
    const todayEntries = getEntriesForPeriod(journalType, startOfDay(today), endOfDay(today));
    return calculateSummary(todayEntries);
  }, [getEntriesForPeriod, calculateSummary]);

  const getWeekSummary = useCallback((journalType: JournalType) => {
    const today = new Date();
    const weekEntries = getEntriesForPeriod(journalType, startOfWeek(today, { weekStartsOn: 1 }), endOfWeek(today, { weekStartsOn: 1 }));
    return calculateSummary(weekEntries);
  }, [getEntriesForPeriod, calculateSummary]);

  const getMonthSummary = useCallback((journalType: JournalType) => {
    const today = new Date();
    const monthEntries = getEntriesForPeriod(journalType, startOfMonth(today), endOfMonth(today));
    return calculateSummary(monthEntries);
  }, [getEntriesForPeriod, calculateSummary]);

  const getYearSummary = useCallback((journalType: JournalType) => {
    const today = new Date();
    const yearEntries = getEntriesForPeriod(journalType, startOfYear(today), endOfYear(today));
    return calculateSummary(yearEntries);
  }, [getEntriesForPeriod, calculateSummary]);

  // NEW: Get summary for a specific number of days
  const getDaysSummary = useCallback((journalType: JournalType, days: number) => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    // Set end date to end of today
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);
    
    const daysEntries = getEntriesForPeriod(journalType, startDate, endDate);
    return calculateSummary(daysEntries);
  }, [getEntriesForPeriod, calculateSummary]);

  // NEW: Get summary for a custom date range
  const getDateRangeSummary = useCallback((journalType: JournalType, startDate: Date, endDate: Date) => {
    // Ensure start date is at beginning of day and end date at end of day
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const entries = getEntriesForPeriod(journalType, start, end);
    return calculateSummary(entries);
  }, [getEntriesForPeriod, calculateSummary]);

  const getCategoryBreakdown = useCallback((journalType: JournalType, startDate: Date, endDate: Date) => {
    const periodEntries = getEntriesForPeriod(journalType, startDate, endDate);
    const expenseEntries = periodEntries.filter(e => e.type === 'expense');
    
    const breakdown: Record<string, number> = {};
    expenseEntries.forEach(entry => {
      const category = categories.find(c => c.id === entry.categoryId);
      const categoryName = category?.name || entry.categoryName || 'Other';
      breakdown[categoryName] = (breakdown[categoryName] || 0) + entry.amount;
    });

    return Object.entries(breakdown).map(([name, value]) => ({
      name,
      value,
      category: categories.find(c => c.name === name),
    }));
  }, [getEntriesForPeriod, categories]);

  const refetch = useCallback(async () => {
    if (!userId) return;
    await loadData();
  }, [userId, loadData]);

  // Calculate totals
  const totalInflow = unifiedEntries
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
  
  const totalOutflow = unifiedEntries
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  // LIFETIME BALANCE = TOTAL INFLOW (all money that has come into the account)
  const lifetimeBalance = totalInflow;

  // NET BALANCE = TOTAL INFLOW - TOTAL OUTFLOW (what's left in the wallet)
  const netBalance = totalInflow - totalOutflow;

  // Use REAL wallet balance from the dedicated API (source of truth)
  const walletBalance = realWalletBalance !== null ? realWalletBalance : userBalance ?? 0;

  return {
    // Core data
    entries: [],
    categories,
    activeJournalType,
    setActiveJournalType,
    loading,
    error,
    refetch,
    userId,
    updateTrigger,
    
    // Transaction data
    unifiedEntries,
    walletTransactions,
    balanceLoading,
    
    // CRUD operations
    addEntry,
    updateEntry,
    deleteEntry,
    updateWalletEntry,
    addCategory,
    updateCategory,
    deleteCategory,
    
    // Filter and period functions
    getFilteredEntries,
    getEntriesForPeriod,
    getDaysSummary,        // NEW: Get summary for X days
    getDateRangeSummary,   // NEW: Get summary for custom date range
    
    // Summary functions
    getAllTimeSummary,
    getTodaySummary,
    getWeekSummary,
    getMonthSummary,
    getYearSummary,
    getCategoryBreakdown,
    calculateSummary,
    
    // Balance metrics
    lifetimeBalance,      // Total money that has come into the account (TOTAL INFLOW)
    totalInflow,          // Total inflow from transactions
    totalOutflow,         // Total outflow from transactions
    netBalance,           // Total Inflow - Total Outflow
    walletBalance,        // REAL balance from users table (source of truth)
    currentBalance: walletBalance, // Same as walletBalance
    clientBalance,        // Client-calculated for comparison
    isBalanced: Math.abs(clientBalance - walletBalance) < 0.01,
  };
}