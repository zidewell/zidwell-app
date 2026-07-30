// lib/bank78/bank78AccountService.js
import bank78Client from './client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class Bank78AccountService {
  async createUserAccounts(userId) {
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error('User not found');
      }

      console.log('📋 Creating accounts for user:', {
        userId: user.id,
        purpose: user.purpose,
        bvn_data: !!user.bvn_data,
        bank78_verified: user.bank78_verified,
      });

      if (!user.bvn_data) {
        throw new Error('BVN verification required first');
      }

      // Check if user has a registered business
      const { data: business, error: bizError } = await supabase
        .from('businesses')
        .select('is_registered')
        .eq('user_id', userId)
        .single();

      const isRegisteredBusiness = business?.is_registered === true;

      // ✅ If unregistered business, create Nomba account
      if (!isRegisteredBusiness && user.purpose === 'business') {
        console.log('📋 Unregistered business - creating Nomba account');
        const nombaAccount = await this.createNombaAccount(user);
        return {
          personalAccount: null,
          businessAccount: null,
          nombaAccount: nombaAccount,
          provider: 'nomba',
        };
      }

      // ✅ Create Bank78 accounts for personal or registered business
      console.log('📋 Creating Bank78 virtual accounts for:', user.purpose);

      // Create personal account
      const personalAccount = await this.createVirtualAccount(user, 'personal');

      // Create business account if business user
      let businessAccount = null;
      if (user.purpose === 'business' && isRegisteredBusiness) {
        const { data: businessData } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', userId)
          .single();

        businessAccount = await this.createVirtualAccount(
          { ...user, businessName: businessData?.business_name },
          'business'
        );
      }

      await this.storeAccountReferences(userId, personalAccount, businessAccount);
      await this.updatePrimaryProvider(userId);

      return {
        personalAccount,
        businessAccount,
        nombaAccount: null,
        provider: 'bank78',
      };

    } catch (error) {
      console.error('❌ Failed to create accounts:', error);
      // ✅ Re-throw the error so the API can handle it properly
      throw error;
    }
  }

  async createVirtualAccount(user, accountType) {
    try {
      const accountName = accountType === 'business'
        ? user.businessName || user.full_name
        : user.full_name;

      const accountData = {
        accountReference: `${user.id}-${accountType}`,
        accountName: accountName,
        emailAddress: user.email,
        phoneNumber: user.phone,
        bvn: user.bvn_data?.bvn,
        userId: user.id,
      };

      console.log(`📤 Creating ${accountType} virtual account:`, {
        accountName: accountData.accountName,
        accountReference: accountData.accountReference,
        phone: accountData.phoneNumber,
        bvn: accountData.bvn ? `${accountData.bvn.slice(0, 3)}...` : 'missing',
      });

      const response = await bank78Client.createVirtualAccount(accountData);

      if (!response.successful || !response.result) {
        throw new Error(response.message || 'Failed to create virtual account');
      }

      const result = response.result;

      return {
        account_id: result.id,
        account_number: result.accountNumber,
        account_name: result.accountName,
        bank_name: result.bankName || process.env.BANK78_DEFAULT_BANK_NAME || 'Bank78',
        bank_code: result.bankCode,
        reservation_reference: result.reservationReference,
        account_type: accountType,
        is_active: result.isActive,
        account_reference: result.accountReference,
      };
    } catch (error) {
      console.error(`❌ Failed to create ${accountType} virtual account:`, error);
      // ✅ Re-throw with specific error
      throw new Error(`Failed to create ${accountType} Bank78 account: ${error.message}`);
    }
  }

  async createNombaAccount(user) {
    try {
      console.log('📤 Creating Nomba account for user:', user.id);
      
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

      if (!response.ok || !wallet?.data) {
        console.error('❌ Nomba account creation failed:', wallet);
        throw new Error(wallet.message || 'Failed to create Nomba account');
      }

      await supabase
        .from('users')
        .update({
          wallet_id: wallet.data.accountRef,
          bank_name: wallet.data.bankName,
          bank_account_number: wallet.data.bankAccountNumber,
          bank_account_name: wallet.data.bankAccountName,
          wallet_provider: 'nomba',
          primary_provider: 'nomba',
          wallet_updated_at: new Date().toISOString(),
          verification_completed: true,
          verification_step: 6,
        })
        .eq('id', user.id);

      return {
        account_id: wallet.data.accountRef,
        account_number: wallet.data.bankAccountNumber,
        account_name: wallet.data.bankAccountName,
        bank_name: wallet.data.bankName || 'Wema Bank',
        account_type: 'nomba',
      };
    } catch (error) {
      console.error('❌ Nomba account creation error:', error);
      throw new Error(`Failed to create Nomba account: ${error.message}`);
    }
  }

  async getNombaToken() {
    try {
      const response = await fetch(`${process.env.NOMBA_URL}/v1/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: process.env.NOMBA_API_KEY,
          secretKey: process.env.NOMBA_SECRET_KEY,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get Nomba token');
      }

      const data = await response.json();
      return data.accessToken;
    } catch (error) {
      console.error('❌ Failed to get Nomba token:', error);
      throw error;
    }
  }

  async storeAccountReferences(userId, personalAccount, businessAccount) {
    const updateData = {
      bank78_verified: true,
      bank78_verified_at: new Date().toISOString(),
      bank78_personal_account_id: personalAccount.account_id,
      bank78_personal_account_number: personalAccount.account_number,
      bank78_personal_account_name: personalAccount.account_name,
      bank78_personal_bank_name: personalAccount.bank_name,
      primary_provider: 'bank78',
      wallet_provider: 'bank78',
      verification_completed: true,
      verification_step: 6,
    };

    if (businessAccount) {
      updateData.bank78_business_account_id = businessAccount.account_id;
      updateData.bank78_business_account_number = businessAccount.account_number;
      updateData.bank78_business_account_name = businessAccount.account_name;
      updateData.bank78_business_bank_name = businessAccount.bank_name;
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('❌ Failed to store account references:', error);
      throw new Error('Failed to store account references');
    }

    if (businessAccount) {
      const { error: bizError } = await supabase
        .from('businesses')
        .update({
          bank78_account_id: businessAccount.account_id,
          bank78_account_number: businessAccount.account_number,
          bank78_account_name: businessAccount.account_name,
          bank78_bank_name: businessAccount.bank_name,
          verification_completed: true,
        })
        .eq('user_id', userId);

      if (bizError) {
        console.error('❌ Failed to update business with account references:', bizError);
      }
    }
  }

  async updatePrimaryProvider(userId) {
    const { error } = await supabase
      .from('users')
      .update({
        primary_provider: 'bank78',
      })
      .eq('id', userId);

    if (error) {
      console.error('❌ Failed to update primary provider:', error);
    }
  }

  async getAccountBalance(userId) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        throw new Error('User not found');
      }

      // If user has Nomba (unregistered business)
      if (user.wallet_provider === 'nomba' && user.wallet_id) {
        try {
          const response = await fetch(`${process.env.NOMBA_URL}/v1/wallets/${user.wallet_id}/balance`, {
            headers: {
              Authorization: `Bearer ${await this.getNombaToken()}`,
            },
          });
          const data = await response.json();
          return {
            nomba: {
              accountNumber: user.bank_account_number,
              accountName: user.bank_account_name,
              bankName: user.bank_name || 'Wema Bank',
              balance: data.balance || 0,
            },
            total: data.balance || 0,
          };
        } catch (error) {
          console.error('Failed to fetch Nomba balance:', error);
          return null;
        }
      }

      // If user has Bank78
      if (!user.bank78_verified) {
        return null;
      }

      let personalBalance = 0;
      let businessBalance = 0;

      if (user.bank78_personal_account_number) {
        try {
          const balance = await bank78Client.getAccountBalance(user.bank78_personal_account_number);
          personalBalance = balance.result?.balance || 0;
        } catch (error) {
          console.error('Failed to fetch personal balance:', error);
        }
      }

      if (user.bank78_business_account_number) {
        try {
          const balance = await bank78Client.getAccountBalance(user.bank78_business_account_number);
          businessBalance = balance.result?.balance || 0;
        } catch (error) {
          console.error('Failed to fetch business balance:', error);
        }
      }

      return {
        personal: {
          accountNumber: user.bank78_personal_account_number,
          accountName: user.bank78_personal_account_name,
          bankName: user.bank78_personal_bank_name,
          balance: personalBalance,
        },
        business: user.bank78_business_account_number
          ? {
              accountNumber: user.bank78_business_account_number,
              accountName: user.bank78_business_account_name,
              bankName: user.bank78_business_bank_name,
              balance: businessBalance,
            }
          : null,
        total: personalBalance + businessBalance,
      };
    } catch (error) {
      console.error('Failed to get account balance:', error);
      throw error;
    }
  }
}

export default new Bank78AccountService();