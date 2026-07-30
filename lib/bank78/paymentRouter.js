// services/paymentRouter.js
import bank78Client from '@/lib/bank78/client';
import bank78AccountService from '@/services/bank78AccountService';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class PaymentRouter {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  async routePayment(userId, paymentData) {
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        throw new Error('User not found');
      }

      // Determine provider
      const provider = await this.determineProvider(user);

      // Execute payment
      if (provider === 'bank78') {
        return await this.processWithBank78(user, paymentData);
      } else {
        return await this.processWithNomba(user, paymentData);
      }
    } catch (error) {
      console.error('Payment routing failed:', error);
      throw error;
    }
  }

  async determineProvider(user) {
    if (!user) return 'nomba';

    // Check if user has Bank78 accounts
    if (user.bank78_verified && user.bank78_personal_account_number) {
      return 'bank78';
    }

    // Try to create Bank78 accounts
    try {
      await bank78AccountService.createUserAccounts(user.id);
      return 'bank78';
    } catch (error) {
      console.error('Failed to create Bank78 accounts, falling back to Nomba:', error);
      return 'nomba';
    }
  }

  async processWithBank78(user, paymentData) {
    let retries = 0;

    while (retries < this.maxRetries) {
      try {
        // Determine which account to use
        const accountNumber =
          paymentData.account_type === 'business'
            ? user.bank78_business_account_number
            : user.bank78_personal_account_number;

        if (!accountNumber) {
          throw new Error('No Bank78 account found');
        }

        // For interbank transfers (to other banks)
        if (paymentData.bankCode && paymentData.bankCode !== 'BANK78') {
          // First verify recipient
          const nameEnquiry = await bank78Client.nameEnquiry({
            accountNumber: paymentData.to_account,
            bankCode: paymentData.bankCode,
          });

          if (!nameEnquiry.successful) {
            throw new Error(nameEnquiry.message || 'Recipient verification failed');
          }

          // Execute interbank transfer
          const transferData = {
            reference: paymentData.reference || `TXN-${Date.now()}`,
            accountName: paymentData.accountName || nameEnquiry.result?.accountName,
            accountNumber: paymentData.to_account,
            bankCode: paymentData.bankCode,
            amount: paymentData.amount,
            narration: paymentData.narration || 'Transfer',
          };

          const response = await bank78Client.interbankTransfer(transferData);

          if (!response.successful) {
            throw new Error(response.message || 'Transfer failed');
          }

          // Record transaction
          await this.recordTransaction(user.id, {
            provider: 'bank78',
            provider_transaction_id: response.result?.transactionReference || response.result?.batchReference,
            provider_account_id: accountNumber,
            amount: paymentData.amount,
            type: 'debit',
            status: 'pending',
            description: paymentData.narration || 'Bank78 Transfer',
            reference: transferData.reference,
          });

          return {
            success: true,
            provider: 'bank78',
            transactionId: response.result?.transactionReference || response.result?.batchReference,
            reference: transferData.reference,
            data: response,
          };
        }

        // For intrabank transfers (within Bank78)
        const transferData = {
          reference: paymentData.reference || `TXN-${Date.now()}`,
          accountName: paymentData.accountName || user.full_name,
          accountNumber: paymentData.to_account,
          amount: paymentData.amount,
          narration: paymentData.narration || 'Transfer',
        };

        const response = await bank78Client.intrabankTransfer(transferData);

        if (!response.successful) {
          throw new Error(response.message || 'Transfer failed');
        }

        // Record transaction
        await this.recordTransaction(user.id, {
          provider: 'bank78',
          provider_transaction_id: response.result?.transactionReference || response.result?.batchReference,
          provider_account_id: accountNumber,
          amount: paymentData.amount,
          type: 'debit',
          status: 'pending',
          description: paymentData.narration || 'Bank78 Transfer',
          reference: transferData.reference,
        });

        return {
          success: true,
          provider: 'bank78',
          transactionId: response.result?.transactionReference || response.result?.batchReference,
          reference: transferData.reference,
          data: response,
        };
      } catch (error) {
        retries++;
        console.error(`Bank78 payment attempt ${retries} failed:`, error);

        if (retries >= this.maxRetries) {
          // Try fallback to Nomba
          return await this.handleFallback(user, paymentData, error);
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay * retries));
      }
    }
  }

  async processWithNomba(user, paymentData) {
    try {
      // Check if user has Nomba wallet
      if (!user.wallet_id) {
        await this.createNombaWallet(user);
      }

      const response = await this.executeNombaPayment(user, paymentData);

      await this.recordTransaction(user.id, {
        provider: 'nomba',
        provider_transaction_id: response.transactionId,
        provider_account_id: user.wallet_id,
        amount: paymentData.amount,
        type: 'debit',
        status: 'completed',
        description: paymentData.narration || 'Nomba Payment',
        reference: response.reference,
      });

      return {
        success: true,
        provider: 'nomba',
        transactionId: response.transactionId,
        reference: response.reference,
        data: response,
      };
    } catch (error) {
      console.error('Nomba payment failed:', error);
      throw new Error('Payment failed with both providers');
    }
  }

  async handleFallback(user, paymentData, error) {
    await this.logFallback(user.id, error);

    if (!user.wallet_id) {
      await this.createNombaWallet(user);
    }

    return await this.processWithNomba(user, paymentData);
  }

  async executeNombaPayment(user, paymentData) {
    const response = await fetch(`${process.env.NOMBA_URL}/v1/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await this.getNombaToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletId: user.wallet_id,
        amount: paymentData.amount,
        reference: paymentData.reference || `NMB-${Date.now()}`,
        narration: paymentData.narration || 'Payment',
      }),
    });

    if (!response.ok) {
      throw new Error('Nomba payment failed');
    }

    return await response.json();
  }

  async getNombaToken() {
    const response = await fetch(`${process.env.NOMBA_URL}/v1/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: process.env.NOMBA_API_KEY,
        secretKey: process.env.NOMBA_SECRET_KEY,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get Nomba token');
    }

    const data = await response.json();
    return data.accessToken;
  }

  async createNombaWallet(user) {
    const response = await fetch(`${process.env.NOMBA_URL}/v1/accounts/virtual`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await this.getNombaToken()}`,
        accountId: process.env.NOMBA_ACCOUNT_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountName: user.full_name,
        accountRef: user.id,
        bvn: user.bvn_data?.bvn,
      }),
    });

    const wallet = await response.json();

    if (response.ok && wallet?.data) {
      await supabase
        .from('users')
        .update({
          wallet_id: wallet.data.accountRef,
          bank_name: wallet.data.bankName,
          bank_account_number: wallet.data.bankAccountNumber,
          bank_account_name: wallet.data.bankAccountName,
          wallet_provider: 'nomba',
          wallet_updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      return wallet.data;
    }
    throw new Error('Failed to create Nomba wallet');
  }

  async recordTransaction(userId, data) {
    const { error } = await supabase.from('transactions').insert({
      user_id: userId,
      provider: data.provider,
      provider_transaction_id: data.provider_transaction_id,
      provider_account_id: data.provider_account_id,
      amount: data.amount,
      type: data.type,
      status: data.status,
      description: data.description,
      reference: data.reference,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to record transaction:', error);
    }
  }

  async logFallback(userId, error) {
    await supabase.from('bank78_logs').insert({
      user_id: userId,
      endpoint: 'fallback',
      status: 'failed',
      error_message: error.message,
      response: { fallback: true },
      created_at: new Date().toISOString(),
    });
  }

  async verifyRecipient(accountNumber, bankCode) {
    try {
      const result = await bank78Client.nameEnquiry({
        accountNumber,
        bankCode,
      });

      if (result.successful && result.result) {
        return {
          success: true,
          accountName: result.result.accountName,
          bankName: result.result.bankName,
          bankCode: result.result.bankCode,
        };
      }
      return {
        success: false,
        message: result.message || 'Recipient not found',
      };
    } catch (error) {
      console.error('Name enquiry failed:', error);
      return {
        success: false,
        message: error.message || 'Failed to verify recipient',
      };
    }
  }

  async getBankCodes() {
    try {
      const result = await bank78Client.getBankCodes();
      if (result.successful && result.result) {
        return result.result;
      }
      return [];
    } catch (error) {
      console.error('Failed to get bank codes:', error);
      return [];
    }
  }
}

export default new PaymentRouter();