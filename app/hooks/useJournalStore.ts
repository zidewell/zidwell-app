"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { JournalEntry, Category, JournalType, DEFAULT_CATEGORIES, PeriodSummary } from '../components/journal/types';
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfYear, endOfYear, isWithinInterval, parseISO
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

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH: Transaction type classification
// Aligned with your SQL query so numbers match exactly.
// ─────────────────────────────────────────────────────────────────────────────

const INFLOW_TYPES = new Set([
  'deposit', 'credit', 'funding', 'cash_in', 'payment_received', 'inflow',
  'card_deposit', 'p2p_credit', 'p2p_received', 'referral', 'referral_reward',
  'virtual_account_deposit', 'refund', 'cashback', 'reversal', 'salary',
  'invoice_payment', 'bonus',
]);

const OUTFLOW_TYPES = new Set([
  'withdrawal', 'transfer', 'p2p_transfer', 'airtime', 'data', 'electricity',
  'cable', 'debit', 'invoice', 'contract', 'fee', 'cash_out', 'outflow',
  'bill_payment', 'purchase', 'subscription', 'charge', 'bill',
]);

const SUCCESS_STATUSES = new Set(['success', 'successful', 'completed']);

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE AMOUNT FUNCTION: The ONLY place that decides how much a transaction
// contributed to inflow or outflow. Matches your SQL query exactly.
// ─────────────────────────────────────────────────────────────────────────────

function classifyTransaction(tx: WalletTransaction): {
  direction: 'inflow' | 'outflow' | 'skip';
  amount: number;
} {
  const type = (tx.type || '').toLowerCase();
  const status = (tx.status || '').toLowerCase();

  // Special case: failed_refunded airtime is treated as inflow
  if (type === 'airtime' && status === 'failed_refunded') {
    const amt = Math.abs(Number(tx.amount || 0));
    return amt > 0 ? { direction: 'inflow', amount: amt } : { direction: 'skip', amount: 0 };
  }

  // Only successful transactions count
  if (!SUCCESS_STATUSES.has(status)) {
    return { direction: 'skip', amount: 0 };
  }

  if (INFLOW_TYPES.has(type)) {
    // For inflow: prefer net_amount, else amount - fee
    let amt = 0;
    if (tx.net_amount != null && Number(tx.net_amount) > 0) {
      amt = Math.abs(Number(tx.net_amount));
    } else {
      amt = Math.max(0, Math.abs(Number(tx.amount || 0)) - Number(tx.fee || 0));
    }
    return amt > 0 ? { direction: 'inflow', amount: amt } : { direction: 'skip', amount: 0 };
  }

  if (OUTFLOW_TYPES.has(type)) {
    // For outflow: use the raw amount. The wallet balance already reflects
    // fees for most transaction types. This matches your SQL query which
    // simply sums `amount` for outflow types.
    const amt = Math.abs(Number(tx.amount || 0));
    return amt > 0 ? { direction: 'outflow', amount: amt } : { direction: 'skip', amount: 0 };
  }

  // Unknown type: fall back to sign of amount
  const raw = Number(tx.amount || 0);
  if (raw > 0) return { direction: 'inflow', amount: raw };
  if (raw < 0) return { direction: 'outflow', amount: Math.abs(raw) };
  return { direction: 'skip', amount: 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Category matching — simple, exact, case-insensitive
// ─────────────────────────────────────────────────────────────────────────────

function resolveCategoryId(
  tx: WalletTransaction,
  categories: Category[],
  direction: 'inflow' | 'outflow',
): string {
  // 1. Explicit category_id from transaction
  if (tx.category_id) return tx.category_id;

  // 2. Match by category name
  if (tx.category && tx.category.trim()) {
    const target = tx.category.trim().toLowerCase();
    const match = categories.find(c => c.name.toLowerCase() === target);
    if (match) return match.id;
  }

  // 3. Fall back by transaction type
  const type = (tx.type || '').toLowerCase();
  const findByName = (name: string) =>
    categories.find(c => c.name.toLowerCase() === name.toLowerCase())?.id;

  if (direction === 'outflow') {
    if (type === 'airtime') return findByName('Call Airtime') || 'expense_other';
    if (type === 'data') return findByName('Data / Internet') || 'expense_other';
    if (type === 'withdrawal') return findByName('Cash Withdrawal') || 'expense_other';
    if (type === 'transfer' || type === 'p2p_transfer' || type === 'debit')
      return findByName('Transfer to Self') || 'expense_other';
    if (type === 'electricity') return findByName('Electricity bill') || 'expense_other';
    if (type === 'cable') return findByName('Cable Subscriptions') || 'expense_other';
    if (type === 'bill_payment' || type === 'bill') return findByName('Bills') || 'expense_other';
    return 'expense_other';
  }

  // Inflow
  if (type === 'salary') return findByName('Salary') || 'income_other';
  if (type === 'refund' || type === 'reversal') return findByName('Refunds') || 'income_other';
  if (type === 'referral' || type === 'referral_reward')
    return findByName('Other Income') || 'income_other';
  return findByName('Other Income') || 'income_other';
}

// ─────────────────────────────────────────────────────────────────────────────
// Simple fetch helper
// ─────────────────────────────────────────────────────────────────────────────

async function fetchWithAuth(endpoint: string, options: RequestInit = {}, userId: string) {
  const isMutation = options.method === 'POST' || options.method === 'PUT';
  let url = `${API_BASE}${endpoint}`;

  if (!isMutation) {
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}userId=${encodeURIComponent(userId)}`;
  }

  const requestOptions: RequestInit = {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
  };

  if (isMutation && options.body) {
    try {
      const bodyData = JSON.parse(options.body as string);
      if (!bodyData.userId) {
        bodyData.userId = userId;
        requestOptions.body = JSON.stringify(bodyData);
      }
    } catch { /* ignore */ }
  }

  const res = await fetch(url, requestOptions);
  if (!res.ok) {
    let msg = `API error (${res.status})`;
    try {
      const errData = await res.json();
      msg = errData.error || errData.message || msg;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// THE HOOK
// ─────────────────────────────────────────────────────────────────────────────

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
  // Track category overrides + hidden entries in state so memo recomputes
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>({});
  const [hiddenEntries, setHiddenEntries] = useState<string[]>([]);

  const userId = userData?.id;

  const forceUpdate = useCallback(() => setUpdateTrigger(p => p + 1), []);

  // Load overrides + hidden entries from localStorage when userId changes
  useEffect(() => {
    if (!userId) {
      setCategoryOverrides({});
      setHiddenEntries([]);
      return;
    }
    try {
      const overrides = JSON.parse(localStorage.getItem(`wallet_category_overrides_${userId}`) || '{}');
      const hidden = JSON.parse(localStorage.getItem(`hidden_wallet_entries_${userId}`) || '[]');
      setCategoryOverrides(overrides);
      setHiddenEntries(hidden);
    } catch {
      setCategoryOverrides({});
      setHiddenEntries([]);
    }
  }, [userId, updateTrigger]);

  // ─── Fetch wallet transactions ───
  const fetchWalletTransactions = useCallback(async (): Promise<WalletTransaction[]> => {
    if (!userId) return [];
    try {
      const res = await fetch(`/api/bill-transactions?userId=${userId}&limit=1000`);
      const data = await res.json();
      return data?.transactions || [];
    } catch (err) {
      console.error('Error fetching wallet transactions:', err);
      return [];
    }
  }, [userId]);

  // ─── Fetch real wallet balance ───
  const fetchRealWalletBalance = useCallback(async (): Promise<number | null> => {
    if (!userId) return null;
    setBalanceLoading(true);
    try {
      const res = await fetch('/api/wallet-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) return data.wallet_balance ?? 0;
      return null;
    } catch (err) {
      console.error('Error fetching real wallet balance:', err);
      return null;
    } finally {
      setBalanceLoading(false);
    }
  }, [userId]);

  // ─── Load everything in parallel ───
  const loadData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch in parallel for speed
      const [categoriesData, walletData, realBalance] = await Promise.all([
        fetchWithAuth('/categories', {}, userId).catch(() => []),
        fetchWalletTransactions(),
        fetchRealWalletBalance(),
      ]);

      const customCats = Array.isArray(categoriesData)
        ? categoriesData.filter((cat: Category) => cat.isCustom)
        : [];

      // De-dupe by id (DEFAULT_CATEGORIES may overlap with server)
      const seen = new Set<string>();
      const merged: Category[] = [];
      for (const cat of [...DEFAULT_CATEGORIES, ...customCats]) {
        if (!seen.has(cat.id)) {
          seen.add(cat.id);
          merged.push(cat);
        }
      }

      setCategories(merged);
      setWalletTransactions(walletData);
      if (realBalance !== null) setRealWalletBalance(realBalance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchWalletTransactions, fetchRealWalletBalance]);

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

  // ─── Category CRUD ───
  const addCategory = useCallback(async (category: Omit<Category, 'id' | 'isCustom'>) => {
    if (!userId) throw new Error('User not authenticated');
    const data = await fetchWithAuth('/categories', {
      method: 'POST',
      body: JSON.stringify({ ...category, userId }),
    }, userId);
    setCategories(prev => [...prev, data as Category]);
    return data as Category;
  }, [userId]);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    if (!userId) throw new Error('User not authenticated');
    const data = await fetchWithAuth(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...updates, userId }),
    }, userId);
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    return data;
  }, [userId]);

  const deleteCategory = useCallback(async (id: string) => {
    if (!userId) throw new Error('User not authenticated');
    await fetchWithAuth(`/categories/${id}`, { method: 'DELETE' }, userId);
    setCategories(prev => prev.filter(c => c.id !== id));
  }, [userId]);

  // ─── Hide / unhide wallet transactions ───
  const deleteEntry = useCallback(async (id: string) => {
    if (!userId) throw new Error('User not authenticated');
    if (!id.startsWith('wallet_')) throw new Error('Only wallet transactions can be hidden');
    const next = hiddenEntries.includes(id) ? hiddenEntries : [...hiddenEntries, id];
    setHiddenEntries(next);
    localStorage.setItem(`hidden_wallet_entries_${userId}`, JSON.stringify(next));
  }, [userId, hiddenEntries]);

  const updateWalletEntry = useCallback(async (transactionId: string, categoryId: string) => {
    if (!userId) throw new Error('User not authenticated');
    const next = { ...categoryOverrides, [transactionId]: categoryId };
    setCategoryOverrides(next);
    localStorage.setItem(`wallet_category_overrides_${userId}`, JSON.stringify(next));
    return true;
  }, [userId, categoryOverrides]);

  // ─── Manual entry stubs (unchanged behavior) ───
  const addEntry = useCallback(async (_entry: Omit<JournalEntry, 'id' | 'createdAt'>) => {
    throw new Error('Manual entries are disabled. All entries come from wallet transactions.');
  }, []);

  const updateEntry = useCallback(async (_id: string, _updates: any) => {
    throw new Error('Manual entry updates are disabled.');
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // UNIFIED ENTRIES — the single source for everything
  // ─────────────────────────────────────────────────────────────────────────

  const unifiedEntries: UnifiedTransaction[] = useMemo(() => {
    if (!walletTransactions.length) return [];

    const categoryById = new Map(categories.map(c => [c.id, c]));
    const categoryByName = new Map(categories.map(c => [c.name.toLowerCase(), c]));
    const hiddenSet = new Set(hiddenEntries);

    const result: UnifiedTransaction[] = [];

    for (const tx of walletTransactions) {
      const id = `wallet_${tx.id}`;
      if (hiddenSet.has(id)) continue;

      const { direction, amount } = classifyTransaction(tx);
      if (direction === 'skip' || amount <= 0) continue;

      const entryType: 'income' | 'expense' = direction === 'inflow' ? 'income' : 'expense';

      // Category resolution with override priority
      let categoryId = categoryOverrides[tx.id] || resolveCategoryId(tx, categories, direction);
      let categoryName = categoryById.get(categoryId)?.name;

      // If categoryId wasn't found (e.g. override points to deleted cat), fall back
      if (!categoryName) {
        // Try by tx.category name
        if (tx.category) {
          const match = categoryByName.get(tx.category.toLowerCase());
          if (match) {
            categoryId = match.id;
            categoryName = match.name;
          }
        }
      }

      if (!categoryName) {
        categoryId = entryType === 'income' ? 'income_other' : 'expense_other';
        categoryName = entryType === 'income' ? 'Other Income' : 'Other Expense';
      }

      const description = tx.narration || tx.description || `${tx.type} transaction`;

      result.push({
        id,
        date: new Date(tx.created_at).toISOString(),
        type: entryType,
        amount,
        categoryId,
        categoryName,
        note: description,
        source: 'wallet',
        journalType: activeJournalType,
        originalTransactionId: tx.id,
        walletTransactionType: tx.type,
        status: tx.status,
        transactionDescription: description,
        reference: tx.reference,
      });
    }

    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return result;
  }, [walletTransactions, categories, activeJournalType, categoryOverrides, hiddenEntries]);

  // ─── Period helpers ───

  const getEntriesForPeriod = useCallback((
    journalType: JournalType,
    startDate: Date,
    endDate: Date,
  ) => {
    return unifiedEntries.filter(entry => {
      if (entry.journalType !== journalType) return false;
      const d = parseISO(entry.date);
      return isWithinInterval(d, { start: startDate, end: endDate });
    });
  }, [unifiedEntries]);

  const calculateSummary = useCallback((entries: UnifiedTransaction[]): PeriodSummary => {
    let income = 0, expenses = 0;
    for (const e of entries) {
      if (e.type === 'income') income += e.amount;
      else expenses += e.amount;
    }
    return { income, expenses, net: income - expenses, savings: 0, investments: 0 };
  }, []);

  const getFilteredEntries = useCallback((journalType: JournalType) =>
    unifiedEntries.filter(e => e.journalType === journalType), [unifiedEntries]);

  const getTodaySummary = useCallback((jt: JournalType) => {
    const now = new Date();
    return calculateSummary(getEntriesForPeriod(jt, startOfDay(now), endOfDay(now)));
  }, [getEntriesForPeriod, calculateSummary]);

  const getWeekSummary = useCallback((jt: JournalType) => {
    const now = new Date();
    return calculateSummary(getEntriesForPeriod(
      jt, startOfWeek(now, { weekStartsOn: 1 }), endOfWeek(now, { weekStartsOn: 1 })
    ));
  }, [getEntriesForPeriod, calculateSummary]);

  const getMonthSummary = useCallback((jt: JournalType) => {
    const now = new Date();
    return calculateSummary(getEntriesForPeriod(jt, startOfMonth(now), endOfMonth(now)));
  }, [getEntriesForPeriod, calculateSummary]);

  const getYearSummary = useCallback((jt: JournalType) => {
    const now = new Date();
    return calculateSummary(getEntriesForPeriod(jt, startOfYear(now), endOfYear(now)));
  }, [getEntriesForPeriod, calculateSummary]);

  const getAllTimeSummary = useCallback((jt: JournalType) =>
    calculateSummary(unifiedEntries.filter(e => e.journalType === jt)),
    [unifiedEntries, calculateSummary]);

  const getDaysSummary = useCallback((jt: JournalType, days: number) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    return calculateSummary(getEntriesForPeriod(jt, start, end));
  }, [getEntriesForPeriod, calculateSummary]);

  const getDateRangeSummary = useCallback((jt: JournalType, startDate: Date, endDate: Date) => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return calculateSummary(getEntriesForPeriod(jt, start, end));
  }, [getEntriesForPeriod, calculateSummary]);

  const getCategoryBreakdown = useCallback((
    jt: JournalType, startDate: Date, endDate: Date,
  ) => {
    const entries = getEntriesForPeriod(jt, startDate, endDate).filter(e => e.type === 'expense');
    const map = new Map<string, { name: string; value: number; category?: Category }>();
    for (const e of entries) {
      const cat = categories.find(c => c.id === e.categoryId);
      const name = cat?.name || e.categoryName || 'Other';
      const existing = map.get(name);
      if (existing) existing.value += e.amount;
      else map.set(name, { name, value: e.amount, category: cat });
    }
    return Array.from(map.values());
  }, [getEntriesForPeriod, categories]);

  // ─── Totals ───
  const { totalInflow, totalOutflow } = useMemo(() => {
    let inflow = 0, outflow = 0;
    for (const e of unifiedEntries) {
      if (e.type === 'income') inflow += e.amount;
      else outflow += e.amount;
    }
    return { totalInflow: inflow, totalOutflow: outflow };
  }, [unifiedEntries]);

  const netBalance = totalInflow - totalOutflow;
  const walletBalance = realWalletBalance !== null ? realWalletBalance : (userBalance ?? 0);

  return {
    entries: [],
    categories,
    activeJournalType,
    setActiveJournalType,
    loading,
    error,
    refetch: loadData,
    userId,
    updateTrigger,

    unifiedEntries,
    walletTransactions,
    balanceLoading,

    addEntry,
    updateEntry,
    deleteEntry,
    updateWalletEntry,
    addCategory,
    updateCategory,
    deleteCategory,

    getFilteredEntries,
    getEntriesForPeriod,
    getDaysSummary,
    getDateRangeSummary,

    getAllTimeSummary,
    getTodaySummary,
    getWeekSummary,
    getMonthSummary,
    getYearSummary,
    getCategoryBreakdown,
    calculateSummary,

    lifetimeBalance: totalInflow,
    totalInflow,
    totalOutflow,
    netBalance,
    walletBalance,
    currentBalance: walletBalance,
    clientBalance: netBalance,
    isBalanced: Math.abs(netBalance - walletBalance) < 0.01,
  };
}