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

const INFLOW_TYPES = [
  'deposit', 'virtual_account_deposit', 'card_deposit', 
  'p2p_received', 'referral', 'referral_reward', 
  'refund', 'cashback', 'reversal', 'salary'
];

const OUTFLOW_TYPES = [
  'transfer', 'withdrawal', 'debit', 'airtime', 'data', 
  'electricity', 'cable', 'p2p_transfer', 'bill_payment', 
  'purchase', 'subscription', 'fee', 'charge', 'bill'
];

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
  const { userData, balance } = useUserContextData();
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [activeJournalType, setActiveJournalType] = useState<JournalType>('business');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const userId = userData?.id;

  const forceUpdate = useCallback(() => {
    setUpdateTrigger(prev => prev + 1);
  }, []);

  const getWalletTransactionType = useCallback((transaction: WalletTransaction): 'income' | 'expense' => {
    const transactionType = transaction.type?.toLowerCase();
    
    if (transactionType === 'bill_payment' || transactionType === 'bill') {
      return 'expense';
    }
    
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
      
      forceUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, forceUpdate, fetchWalletTransactions]);

  useEffect(() => {
    if (userId) {
      loadData();
    } else {
      setWalletTransactions([]);
      setCategories(DEFAULT_CATEGORIES);
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

  const unifiedEntries: UnifiedTransaction[] = useMemo(() => {
    const hiddenWalletEntries = JSON.parse(localStorage.getItem(`hidden_wallet_entries_${userId}`) || '[]');
    const walletCategoryOverrides = JSON.parse(localStorage.getItem(`wallet_category_overrides_${userId}`) || '{}');
    
    const walletEntries: UnifiedTransaction[] = walletTransactions
      .filter(tx => {
        const walletId = `wallet_${tx.id}`;
        return tx.status?.toLowerCase() === 'success' && !hiddenWalletEntries.includes(walletId);
      })
      .map(tx => {
        const txType = getWalletTransactionType(tx);
        const primaryDescription = tx.narration || tx.description || `${tx.type} transaction`;
        const isOutflow = txType === 'expense';
        
        let categoryId = walletCategoryOverrides[tx.id] || '';
        
        if (!categoryId && tx.category_id) {
          categoryId = tx.category_id;
        }
        
        if (!categoryId) {
          const transactionCategoryName = tx.category || '';
          categoryId = getCategoryIdFromName(transactionCategoryName, tx.type, isOutflow);
        }
        
        const txTypeLower = tx.type?.toLowerCase() || '';
        const isInflow = INFLOW_TYPES.includes(txTypeLower);
        const isAirtimeOrData = ['airtime', 'data'].includes(txTypeLower);
        
        let amount: number;
        
        // FIX: Handle airtime and data transactions specially
        if (isAirtimeOrData) {
          // For airtime/data, use the gross_amount or amount directly without deducting fee
          // The gross_amount is the actual amount spent on airtime
          if (tx.gross_amount != null && tx.gross_amount > 0) {
            amount = Math.abs(tx.gross_amount);
          } else if (tx.amount != null) {
            amount = Math.abs(tx.amount);
          } else {
            amount = 0;
          }
        } else if (isInflow) {
          if (tx.net_amount != null) {
            amount = tx.net_amount;
          } else if (tx.gross_amount != null) {
            amount = tx.gross_amount - (tx.fee || 0);
          } else {
            amount = Math.abs(tx.amount) - (tx.fee || 0);
          }
        } else if (isOutflow) {
          // For other outflow transactions (not airtime/data)
          if (tx.total_deduction != null && tx.total_deduction > 0) {
            amount = tx.total_deduction;
          } else if (tx.gross_amount != null && tx.gross_amount > 0) {
            amount = Math.abs(tx.gross_amount);
          } else {
            amount = Math.abs(tx.amount);
          }
        } else {
          amount = Math.abs(tx.amount);
        }

        // Ensure amount is never negative
        amount = Math.max(0, amount);

        const matchedCategory = categories.find(c => c.id === categoryId);
        
        return {
          id: `wallet_${tx.id}`,
          date: new Date(tx.created_at).toISOString(),
          type: txType,
          amount: amount,
          categoryId: categoryId,
          categoryName: tx.category || matchedCategory?.name,
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
    
    return walletEntries.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [walletTransactions, activeJournalType, getWalletTransactionType, getCategoryIdFromName, userId, categories]);

  const getFilteredEntries = useCallback((journalType: JournalType) => {
    return unifiedEntries.filter(entry => entry.journalType === journalType);
  }, [unifiedEntries]);

  const getEntriesForPeriod = useCallback((
    journalType: JournalType, 
    startDate: Date, 
    endDate: Date
  ) => {
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
    const todayEntries = getEntriesForPeriod(
      journalType,
      startOfDay(today),
      endOfDay(today)
    );
    return calculateSummary(todayEntries);
  }, [getEntriesForPeriod, calculateSummary]);

  const getWeekSummary = useCallback((journalType: JournalType) => {
    const today = new Date();
    const weekEntries = getEntriesForPeriod(
      journalType,
      startOfWeek(today, { weekStartsOn: 1 }),
      endOfWeek(today, { weekStartsOn: 1 })
    );
    return calculateSummary(weekEntries);
  }, [getEntriesForPeriod, calculateSummary]);

  const getMonthSummary = useCallback((journalType: JournalType) => {
    const today = new Date();
    const monthEntries = getEntriesForPeriod(
      journalType,
      startOfMonth(today),
      endOfMonth(today)
    );
    return calculateSummary(monthEntries);
  }, [getEntriesForPeriod, calculateSummary]);

  const getYearSummary = useCallback((journalType: JournalType) => {
    const today = new Date();
    const yearEntries = getEntriesForPeriod(
      journalType,
      startOfYear(today),
      endOfYear(today)
    );
    return calculateSummary(yearEntries);
  }, [getEntriesForPeriod, calculateSummary]);

  const getCategoryBreakdown = useCallback((
    journalType: JournalType,
    startDate: Date,
    endDate: Date
  ) => {
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

  return {
    entries: [],
    categories,
    activeJournalType,
    setActiveJournalType,
    addEntry,
    updateEntry,
    deleteEntry,
    updateWalletEntry,
    addCategory,
    updateCategory,
    deleteCategory,
    getFilteredEntries,
    getEntriesForPeriod,
    getAllTimeSummary,
    getTodaySummary,
    getWeekSummary,
    getMonthSummary,
    getYearSummary,
    getCategoryBreakdown,
    calculateSummary,
    loading,
    error,
    refetch,
    userId,
    updateTrigger,
    unifiedEntries,
    walletTransactions,
    walletBalance: balance ?? 0,
  };
}