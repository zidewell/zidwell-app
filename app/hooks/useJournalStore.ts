"use client"
import { useState, useEffect, useCallback } from 'react';
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

const API_BASE = '/api/journal';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}, userId: string) {
  const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);

  if (!options.method || options.method === 'GET' || options.method === 'DELETE') {
    url.searchParams.set('userId', userId);
  }

  const res = await fetch(url.toString(), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API error (${res.status})`);
  }

  return res.json();
}

export function useJournalStore() {
  const { userData } = useUserContextData();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [activeJournalType, setActiveJournalType] = useState<JournalType>('business');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const userId = userData?.id;

  // Force re-render in all consumers
  const forceUpdate = useCallback(() => {
    setUpdateTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (userId) {
      loadData();
    } else {
      setEntries([]);
      setCategories(DEFAULT_CATEGORIES);
      setLoading(false);
    }
  }, [userId]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load categories
      const categoriesData = await fetchWithAuth('/categories', {}, userId);
      
      const mergedCategories = [
        ...DEFAULT_CATEGORIES,
        ...categoriesData.filter((cat: Category) => cat.isCustom)
      ];
      setCategories(mergedCategories);
      
      // Load entries
      const entriesData = await fetchWithAuth('/entries', {}, userId);
      setEntries(entriesData);
      forceUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, forceUpdate]);

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
      
      // Update state with new entry at the beginning
      setEntries(prev => {
        const exists = prev.some(e => e.id === newEntry.id);
        if (exists) return prev;
        return [newEntry, ...prev];
      });
      
      // Force multiple updates to ensure all components re-render
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
      
      const response = await fetch(`/api/journal/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          ...updates,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to update category (${response.status})`);
      }

      const updatedCategory = await response.json();
      
      setCategories(prev =>
        prev.map(cat => cat.id === id ? { ...cat, ...updatedCategory } : cat)
      );
      
      forceUpdate();
      return updatedCategory;
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
      
      const response = await fetch(`/api/journal/categories/${id}?userId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to delete category (${response.status})`);
      }

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

  // Helper functions
  const getFilteredEntries = useCallback((journalType: JournalType) => {
    return entries.filter(entry => entry.journalType === journalType);
  }, [entries]);

  const getEntriesForPeriod = useCallback((
    journalType: JournalType, 
    startDate: Date, 
    endDate: Date
  ) => {
    return entries.filter(entry => {
      if (entry.journalType !== journalType) return false;
      const entryDate = parseISO(entry.date);
      return isWithinInterval(entryDate, { start: startDate, end: endDate });
    });
  }, [entries]);

  const calculateSummary = useCallback((filteredEntries: JournalEntry[]): PeriodSummary => {
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

  // ALL-TIME Summary - This shows all entries ever created
  const getAllTimeSummary = useCallback((journalType: JournalType) => {
    const filteredEntries = entries.filter(entry => entry.journalType === journalType);
    
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
  }, [entries]);

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
  };
}