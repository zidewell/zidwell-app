// services/transactionService.js
import bank78Client from '@/lib/bank78/client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class TransactionService {
  async getUserTransactions(userId, params = {}) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        throw new Error('User not found');
      }

      let bank78Transactions = [];
      let nombaTransactions = [];

      // Get Bank78 transactions if user has Bank78
      if (user.bank78_verified) {
        bank78Transactions = await this.getBank78Transactions(user, params);
      }

      // Get Nomba transactions if user has Nomba wallet
      if (user.wallet_id) {
        nombaTransactions = await this.getNombaTransactions(user, params);
      }

      // Merge and sort transactions
      const merged = this.mergeTransactions(bank78Transactions, nombaTransactions);
      
      // Apply pagination
      const page = parseInt(params.page) || 1;
      const limit = parseInt(params.limit) || 20;
      const start = (page - 1) * limit;
      const end = start + limit;

      return {
        transactions: merged.slice(start, end),
        total: merged.length,
        page,
        limit,
        totalPages: Math.ceil(merged.length / limit)
      };
    } catch (error) {
      console.error('Failed to get user transactions:', error);
      throw error;
    }
  }

  async getBank78Transactions(user, params) {
    const transactions = [];
    const accounts = [];

    // Add personal account
    if (user.bank78_personal_account_id) {
      accounts.push({
        id: user.bank78_personal_account_id,
        type: 'personal',
        number: user.bank78_personal_account_number
      });
    }

    // Add business account
    if (user.bank78_business_account_id) {
      accounts.push({
        id: user.bank78_business_account_id,
        type: 'business',
        number: user.bank78_business_account_number
      });
    }

    // Fetch transactions for each account
    for (const account of accounts) {
      try {
        const response = await bank78Client.getTransactions(account.id, {
          page: params.page || 1,
          limit: params.limit || 100
        });

        const accountTransactions = response.data?.transactions || response.transactions || [];
        
        // Format transactions
        const formatted = accountTransactions.map(tx => ({
          id: tx.id || tx.transactionId,
          provider: 'bank78',
          provider_transaction_id: tx.id || tx.transactionId,
          provider_account_id: account.id,
          account_type: account.type,
          account_number: account.number,
          amount: tx.amount,
          type: tx.type || (tx.amount < 0 ? 'debit' : 'credit'),
          status: tx.status || 'completed',
          description: tx.narration || tx.description || 'Bank78 Transaction',
          date: tx.createdAt || tx.date || tx.created_at,
          reference: tx.reference,
          fee: tx.fee || 0
        }));

        transactions.push(...formatted);
      } catch (error) {
        console.error(`Failed to get Bank78 transactions for ${account.type} account:`, error);
      }
    }

    return transactions;
  }

  async getNombaTransactions(user, params) {
    try {
      // Your existing Nomba transaction logic
      // This should be your current implementation
      const response = await fetch(
        `${process.env.NOMBA_URL}/v1/wallets/${user.wallet_id}/transactions?page=${params.page || 1}&limit=${params.limit || 100}`,
        {
          headers: {
            'Authorization': `Bearer ${await this.getNombaToken()}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch Nomba transactions');
      }

      const data = await response.json();
      const transactions = data.data?.transactions || data.transactions || [];

      return transactions.map(tx => ({
        id: tx.id || tx.transactionId,
        provider: 'nomba',
        provider_transaction_id: tx.id || tx.transactionId,
        provider_account_id: user.wallet_id,
        account_type: 'nomba',
        amount: tx.amount,
        type: tx.type || (tx.amount < 0 ? 'debit' : 'credit'),
        status: tx.status || 'completed',
        description: tx.narration || tx.description || 'Nomba Transaction',
        date: tx.createdAt || tx.date || tx.created_at,
        reference: tx.reference,
        fee: tx.fee || 0
      }));
    } catch (error) {
      console.error('Failed to get Nomba transactions:', error);
      return [];
    }
  }

  mergeTransactions(bank78Transactions, nombaTransactions) {
    const all = [...bank78Transactions, ...nombaTransactions];
    
    // Sort by date (descending)
    return all.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
  }

  async getNombaToken() {
    // Your existing Nomba token logic
    // This should be your current implementation
  }
}

export default new TransactionService();