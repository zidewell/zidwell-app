// app/hooks/useJournalStore.ts

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
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for real-time
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface UnifiedTransaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  amount: number;
  categoryId: string;
  note: string;
  source: 'manual' | 'wallet'; // Add 'wallet' source
  journalType: JournalType;
  originalTransactionId?: string;
  walletTransactionType?: string;
  status?: string;
  transactionDescription?: string;
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
}

const API_BASE = '/api/journal';

// INFLOW: Money you RECEIVE (Income)
const INFLOW_TYPES = [
  'deposit', 'virtual_account_deposit', 'card_deposit', 
  'p2p_received', 'referral', 'referral_reward', 
  'refund', 'cashback', 'reversal'
];

// OUTFLOW: Money you DEDUCT/WITHDRAW (Expense)
const OUTFLOW_TYPES = [
  'transfer', 'withdrawal', 'debit', 'airtime', 'data', 
  'electricity', 'cable', 'p2p_transfer', 'bill_payment', 
  'purchase', 'subscription', 'fee', 'charge'
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
      // If body can't be parsed, leave as is
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
        // Ignore
      }
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

export function useJournalStore() {
  const { userData } = useUserContextData();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [activeJournalType, setActiveJournalType] = useState<JournalType>('business');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [syncedTransactionIds, setSyncedTransactionIds] = useState<Set<string>>(new Set());

  const userId = userData?.id;

  const forceUpdate = useCallback(() => {
    setUpdateTrigger(prev => prev + 1);
  }, []);

  // Helper: Determine if transaction is INFLOW or OUTFLOW
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

  // Helper: Get category for wallet transaction
  const getCategoryForWalletTransaction = useCallback((transaction: WalletTransaction): string => {
    const type = transaction.type?.toLowerCase();
    const description = (transaction.description || transaction.narration || '').toLowerCase();
    const isOutflow = OUTFLOW_TYPES.includes(type) || transaction.amount < 0;
    
    if (isOutflow) {
      // Airtime purchase
      if (type === 'airtime' || description.includes('airtime')) {
        const cat = categories.find(c => c.name === 'Data & Airtime');
        return cat?.id || categories.find(c => c.type === 'expense')?.id || '';
      }
      // Data purchase
      if (type === 'data' || description.includes('data')) {
        const cat = categories.find(c => c.name === 'Data & Airtime');
        return cat?.id || categories.find(c => c.type === 'expense')?.id || '';
      }
      // Electricity bill
      if (type === 'electricity' || description.includes('electricity')) {
        const cat = categories.find(c => c.name === 'Utilities');
        return cat?.id || categories.find(c => c.type === 'expense')?.id || '';
      }
      // Bank transfer / P2P sent
      if (type === 'transfer' || type === 'p2p_transfer') {
        const cat = categories.find(c => c.name === 'Bank Transfer');
        return cat?.id || categories.find(c => c.type === 'expense')?.id || '';
      }
      // Withdrawal
      if (type === 'withdrawal') {
        const cat = categories.find(c => c.name === 'Withdrawal');
        return cat?.id || categories.find(c => c.type === 'expense')?.id || '';
      }
      // Default expense
      const cat = categories.find(c => c.name === 'Wallet Expense');
      return cat?.id || categories.find(c => c.type === 'expense')?.id || '';
    }
    
    // INFLOW - Income
    if (type === 'deposit' || type === 'virtual_account_deposit' || type === 'card_deposit') {
      const cat = categories.find(c => c.name === 'Bank Deposit');
      return cat?.id || categories.find(c => c.type === 'income')?.id || '';
    }
    if (type === 'referral' || type === 'referral_reward') {
      const cat = categories.find(c => c.name === 'Referral Bonus');
      return cat?.id || categories.find(c => c.type === 'income')?.id || '';
    }
    if (type === 'refund') {
      const cat = categories.find(c => c.name === 'Refund');
      return cat?.id || categories.find(c => c.type === 'income')?.id || '';
    }
    if (type === 'p2p_received') {
      const cat = categories.find(c => c.name === 'P2P Transfer Received');
      return cat?.id || categories.find(c => c.type === 'income')?.id || '';
    }
    
    // Default income
    const cat = categories.find(c => c.name === 'Wallet Income');
    return cat?.id || categories.find(c => c.type === 'income')?.id || '';
  }, [categories]);

  // Auto-create journal entry from wallet transaction
  const autoCreateJournalEntry = useCallback(async (transaction: WalletTransaction) => {
    if (!userId) return;
    
    // Check if already synced
    if (syncedTransactionIds.has(transaction.id)) {
      console.log(`Transaction ${transaction.id} already synced, skipping...`);
      return;
    }

    const txType = getWalletTransactionType(transaction);
    const amount = Math.abs(transaction.amount);
    const categoryId = getCategoryForWalletTransaction(transaction);
    const description = transaction.narration || transaction.description || `${transaction.type} transaction`;
    
    // Create journal entry
    const journalEntry: Omit<JournalEntry, 'id' | 'createdAt'> = {
      date: new Date(transaction.created_at).toISOString(),
      type: txType,
      amount: amount,
      categoryId: categoryId,
      note: `[Auto-synced] ${description} | Ref: ${transaction.reference || transaction.id}`,
      journalType: activeJournalType, // Use current active journal type
    };

    try {
      console.log(`🔄 Auto-creating journal entry for transaction:`, {
        id: transaction.id,
        type: txType,
        amount,
        description
      });

      const newEntry = await addEntry(journalEntry);
      
      // Mark as synced
      setSyncedTransactionIds(prev => new Set([...prev, transaction.id]));
      
      console.log(`✅ Auto-created journal entry: ${newEntry.id} for wallet transaction ${transaction.id}`);
      
      return newEntry;
    } catch (error) {
      console.error(`❌ Failed to auto-create journal entry for transaction ${transaction.id}:`, error);
    }
  }, [userId, activeJournalType, getWalletTransactionType, getCategoryForWalletTransaction, addEntry, syncedTransactionIds]);

  // Fetch initial wallet transactions
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

  // Create unified entries (manual + wallet transactions)
  const unifiedEntries: UnifiedTransaction[] = useMemo(() => {
    const manualEntries: UnifiedTransaction[] = entries.map(entry => ({
      id: entry.id,
      date: entry.date,
      type: entry.type,
      amount: entry.amount,
      categoryId: entry.categoryId,
      note: entry.note || '',
      source: 'manual',
      journalType: entry.journalType,
    }));

    const walletEntries: UnifiedTransaction[] = walletTransactions
      .filter(tx => tx.status?.toLowerCase() === 'success')
      .map(tx => {
        const txType = getWalletTransactionType(tx);
        const description = tx.narration || tx.description || `${tx.type} transaction`;
        const categoryId = getCategoryForWalletTransaction(tx);
        const amount = Math.abs(tx.amount);
        
        return {
          id: `wallet_${tx.id}`,
          date: new Date(tx.created_at).toISOString(),
          type: txType,
          amount: amount,
          categoryId: categoryId,
          note: `[Wallet] ${description}`,
          source: 'wallet',
          journalType: activeJournalType,
          originalTransactionId: tx.id,
          walletTransactionType: tx.type,
          status: tx.status,
          transactionDescription: description,
        };
      });

    const allEntries = [...manualEntries, ...walletEntries];
    const incomeCount = allEntries.filter(e => e.type === 'income').length;
    const expenseCount = allEntries.filter(e => e.type === 'expense').length;
    const totalIncome = allEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
    const totalExpense = allEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
    
    console.log(`📈 Unified entries: ${allEntries.length} total`);
    console.log(`   ➕ Income: ${incomeCount} entries, ₦${totalIncome.toLocaleString()}`);
    console.log(`   ➖ Expense: ${expenseCount} entries, ₦${totalExpense.toLocaleString()}`);
    
    return allEntries.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [entries, walletTransactions, activeJournalType, getWalletTransactionType, getCategoryForWalletTransaction]);

  // Load all data
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
      
      const entriesData = await fetchWithAuth('/entries', {}, userId);
      setEntries(entriesData);
      
      const walletData = await fetchWalletTransactions();
      setWalletTransactions(walletData);
      
      // Auto-create journal entries for unsynced wallet transactions
      for (const transaction of walletData) {
        if (transaction.status?.toLowerCase() === 'success') {
          await autoCreateJournalEntry(transaction);
        }
      }
      
      forceUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, forceUpdate, fetchWalletTransactions, autoCreateJournalEntry]);

  // Set up real-time subscription for new wallet transactions
  useEffect(() => {
    if (!userId) return;

    // Subscribe to new wallet transactions
    const subscription = supabase
      .channel('wallet-transactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions', // Change to your actual transactions table name
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log('🆕 New wallet transaction detected:', payload.new);
          const newTransaction = payload.new as WalletTransaction;
          
          if (newTransaction.status?.toLowerCase() === 'success') {
            // Add to wallet transactions state
            setWalletTransactions(prev => [newTransaction, ...prev]);
            
            // Auto-create journal entry
            await autoCreateJournalEntry(newTransaction);
            
            // Force UI update
            forceUpdate();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, autoCreateJournalEntry, forceUpdate]);

  useEffect(() => {
    if (userId) {
      loadData();
    } else {
      setEntries([]);
      setWalletTransactions([]);
      setCategories(DEFAULT_CATEGORIES);
      setLoading(false);
    }
  }, [userId, loadData]);

  const addEntry = useCallback(async (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => {
    if (!userId) throw new Error('User not authenticated');
    
    try {
      const newEntryData = {
        ...entry, 
        userId,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      const data = await fetchWithAuth('/entries', {
        method: 'POST',
        body: JSON.stringify(newEntryData),
      }, userId);
      
      const newEntry = data as JournalEntry;
      
      setEntries(prev => {
        const exists = prev.some(e => e.id === newEntry.id);
        if (exists) return prev;
        return [newEntry, ...prev];
      });
      
      setTimeout(() => forceUpdate(), 0);
      setTimeout(() => forceUpdate(), 50);
      
      return newEntry;
    } catch (err) {
      console.error('Failed to add entry:', err);
      throw err;
    }
  }, [userId, forceUpdate]);

  const updateEntry = useCallback(async (id: string, updates: Partial<Omit<JournalEntry, 'id' | 'createdAt' | 'journalType'>>) => {
    if (!userId) throw new Error('User not authenticated');
    
    try {
      const data = await fetchWithAuth(`/entries/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...updates, userId }),
      }, userId);
      
      setEntries(prev => prev.map(entry => 
        entry.id === id ? { ...entry, ...updates } : entry
      ));
      
      forceUpdate();
      return data;
    } catch (err) {
      console.error('Failed to update entry:', err);
      throw err;
    }
  }, [userId, forceUpdate]);

  const deleteEntry = useCallback(async (id: string) => {
    if (!userId) throw new Error('User not authenticated');
    
    // Check if it's a wallet-synced entry
    if (id.startsWith('wallet_')) {
      alert('Wallet transactions cannot be deleted. They are automatically synced from your wallet activity.');
      return;
    }
    
    try {
      await fetchWithAuth(`/entries/${id}`, {
        method: 'DELETE',
      }, userId);
      
      setEntries(prev => prev.filter(entry => entry.id !== id));
      forceUpdate();
    } catch (err) {
      console.error('Failed to delete entry:', err);
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
      const categoryName = category?.name || 'Other';
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
    entries,
    categories,
    activeJournalType,
    setActiveJournalType,
    addEntry,
    updateEntry,
    deleteEntry,
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
  };
}