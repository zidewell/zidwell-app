// app/hooks/useStoreWallet.ts

import { useState, useCallback, useEffect } from "react";
import { useUserContextData } from "../context/userData";

interface WalletData {
  available_balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
  last_activity_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  net_amount: number;
  status: string;
  reference: string;
  description: string;
  channel: string;
  created_at: string;
  metadata?: any;
}

export function useStoreWallet() {
  const { userData } = useUserContextData();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Get wallet balance
  const fetchBalance = useCallback(async (force = false) => {
    if (!userData?.id) {
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/store/wallet/balance", {
        cache: force ? "no-store" : "default",
        headers: { "Cache-Control": force ? "no-cache" : "default" },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setWallet(null);
          return null;
        }
        throw new Error("Failed to fetch wallet balance");
      }

      const data = await response.json();
      if (data.success && data.wallet) {
        setWallet(data.wallet);
        return data.wallet;
      }
      return null;
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userData?.id]);

  // Credit wallet
  const credit = useCallback(async (amount: number, source?: string, sourceId?: string, description?: string) => {
    if (!userData?.id) throw new Error("User not authenticated");

    try {
      const response = await fetch("/api/store/wallet/credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          source: source || "manual",
          sourceId: sourceId || null,
          description: description || "Manual credit",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to credit wallet");
      }

      const data = await response.json();
      await fetchBalance(true);
      return data;
    } catch (error) {
      console.error("Error crediting wallet:", error);
      throw error;
    }
  }, [userData?.id, fetchBalance]);

  // Debit wallet (withdrawal)
  const debit = useCallback(async (amount: number, bankDetails: any, description?: string) => {
    if (!userData?.id) throw new Error("User not authenticated");

    try {
      const response = await fetch("/api/store/wallet/debit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          purpose: "withdrawal",
          description: description || `Withdrawal to ${bankDetails.bankName || 'bank'}`,
          bankDetails,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process withdrawal");
      }

      const data = await response.json();
      await fetchBalance(true);
      return data;
    } catch (error) {
      console.error("Error debiting wallet:", error);
      throw error;
    }
  }, [userData?.id, fetchBalance]);

  // Get transactions
  const fetchTransactions = useCallback(async (limit = 50, offset = 0, type?: string) => {
    if (!userData?.id) {
      setTransactionsLoading(false);
      return [];
    }

    try {
      setTransactionsLoading(true);
      const url = new URL("/api/store/wallet/transactions", window.location.origin);
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("offset", String(offset));
      if (type) url.searchParams.set("type", type);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions || []);
        return data.transactions || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return [];
    } finally {
      setTransactionsLoading(false);
    }
  }, [userData?.id]);

  // Initial load
  useEffect(() => {
    if (userData?.id) {
      fetchBalance();
    } else {
      setLoading(false);
    }
  }, [userData?.id, fetchBalance]);

  return {
    wallet,
    loading,
    transactions,
    transactionsLoading,
    fetchBalance,
    fetchTransactions,
    credit,
    debit,
    hasSufficientBalance: (amount: number) => (wallet?.available_balance || 0) >= amount,
  };
}