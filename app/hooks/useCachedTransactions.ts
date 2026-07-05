// app/hooks/useCachedTransactions.ts
import useSWR from 'swr';
import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface TransactionOptions {
  page?: number;
  limit?: number;
  search?: string;
  from?: string;
  to?: string;
}

export function useCachedTransactions(userId: string | undefined, options: TransactionOptions = {}) {
  const { page = 1, limit = 10, search = '', from = '', to = '' } = options;
  
  // Build cache key based on all parameters
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  params.set('page', page.toString());
  params.set('limit', limit.toString());
  if (search) params.set('search', search);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  
  const cacheKey = userId ? `/api/bill-transactions?${params.toString()}` : null;

  const { data, error, mutate, isLoading } = useSWR(cacheKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // Don't refetch within 1 minute
    keepPreviousData: true,
  });

  // Auto-refresh when transactions change
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          mutate(); // Refetch cached data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, mutate]);

  return {
    transactions: data?.transactions || [],
    total: data?.total || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    error,
    refresh: mutate,
  };
}