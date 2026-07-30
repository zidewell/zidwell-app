// lib/bank78/client.js
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class Bank78Client {
  constructor() {
    console.log('🔍 Bank78 Client Initialization:');
    console.log('  BASE_URL:', process.env.BANK78_BASE_URL || 'MISSING');
    console.log('  API_KEY:', process.env.BANK78_API_KEY ? `${process.env.BANK78_API_KEY.slice(0, 8)}...` : 'MISSING');
    console.log('  CLIENT_ID:', process.env.BANK78_CLIENT_ID ? `${process.env.BANK78_CLIENT_ID.slice(0, 8)}...` : 'MISSING');
    console.log('  SECRET_KEY:', process.env.BANK78_SECRET_KEY ? '***' : 'MISSING');
    
    this.baseURL = process.env.BANK78_BASE_URL || 'https://sandbox.bank78.co';
    this.apiKey = process.env.BANK78_API_KEY;
    this.clientId = process.env.BANK78_CLIENT_ID;
    this.secretKey = process.env.BANK78_SECRET_KEY;
    this.webhookSecret = process.env.BANK78_WEBHOOK_SECRET;
    this.token = null;
    this.tokenExpiry = null;
    this.maxRetries = 3;
    this.retryDelay = 1000;
    
    this.validateCredentials();
  }

  validateCredentials() {
    const missing = [];
    if (!this.apiKey) missing.push('BANK78_API_KEY');
    if (!this.clientId) missing.push('BANK78_CLIENT_ID');
    if (!this.secretKey) missing.push('BANK78_SECRET_KEY');
    
    if (missing.length > 0) {
      console.error('❌ Missing Bank78 credentials:', missing.join(', '));
      throw new Error(`Bank78 configuration error: Missing ${missing.join(', ')}`);
    }
  }

  async authenticate(retryCount = 0) {
    try {
      if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
        console.log('✅ Using cached Bank78 token');
        return this.token;
      }

      console.log('🔐 Authenticating with Bank78...');

      const params = new URLSearchParams();
      params.append('client_id', this.clientId);
      params.append('client_secret', this.secretKey);
      params.append('grant_type', 'client_credentials');

      console.log('📤 Authentication Request:', {
        maxBodyLength: Infinity,
        url: `${this.baseURL}/identity/connect/token`,
        headers: {
          'x-api-key': this.apiKey ? `${this.apiKey.slice(0, 8)}...` : 'missing',
        },
      });

      const response = await axios.post(
        `${this.baseURL}/identity/connect/token`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-api-key': this.apiKey,
          },
          timeout: 30000,
        }
      );

      console.log('📥 Authentication Response:', {
        status: response.status,
        hasAccessToken: !!response.data?.access_token,
        expiresIn: response.data?.expires_in,
        tokenType: response.data?.token_type,
      });

      if (response.data?.access_token) {
        this.token = response.data.access_token;
        this.tokenExpiry = new Date(Date.now() + (response.data.expires_in || 3600) * 1000);
        console.log('✅ Bank78 authentication successful');
        console.log('🔑 Token expires at:', this.tokenExpiry.toISOString());
        return this.token;
      }
      
      throw new Error('No access token received from Bank78');
    } catch (error) {
      console.error('❌ Bank78 authentication failed:');
      console.error('  Message:', error.message);
      console.error('  Status:', error.response?.status);
      console.error('  Response Data:', JSON.stringify(error.response?.data, null, 2));
      
      if (error.response?.status === 401) {
        throw new Error('Bank78 authentication failed: Invalid API key or client credentials.');
      }
      
      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.error_description || 
                        error.response?.data?.error || 
                        'Invalid request';
        throw new Error(`Bank78 authentication failed: ${errorMsg}`);
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error(`Bank78 authentication failed: Cannot reach ${this.baseURL}.`);
      }

      if (retryCount < this.maxRetries && error.response?.status >= 500) {
        console.log(`Retrying authentication (${retryCount + 1}/${this.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, retryCount)));
        return this.authenticate(retryCount + 1);
      }

      const errorMessage = error.response?.data?.error_description || 
                          error.response?.data?.message || 
                          error.message || 
                          'Authentication failed';
      throw new Error(`Bank78 authentication failed: ${errorMessage}`);
    }
  }

  async request(method, endpoint, data = null, retryCount = 0) {
    try {
      const token = await this.authenticate();

      // ✅ FIX: Ensure token is properly formatted for Authorization header
      // The token might already include "Bearer " prefix, so we need to handle it
      let authHeader = '';
      if (token) {
        // Check if token already has "Bearer " prefix
        if (token.startsWith('Bearer ')) {
          authHeader = token;
        } else {
          // ✅ Properly encode the token for the Authorization header
          // Some APIs require the token to be URL-encoded
          const encodedToken = encodeURIComponent(token);
          authHeader = `Bearer ${encodedToken}`;
        }
      }

      const fullUrl = `${this.baseURL}${endpoint}`;

      console.log(`📤 Bank78 ${method} request to:`, fullUrl);
      console.log('📤 Authorization header:', authHeader ? 'Bearer ***' : 'missing');

      const config = {
        method,
        url: fullUrl,
        headers: {
          'Authorization': authHeader,
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 30000,
      };

      if (data) {
        config.data = data;
        console.log('📤 Request body:', JSON.stringify(data, null, 2));
      }

      const response = await axios(config);
      
      if (response.data && response.data.successful === false) {
        throw new Error(response.data.message || 'Bank78 API returned error');
      }

      console.log('📥 Bank78 response:', {
        status: response.status,
        hasData: !!response.data,
        successful: response.data?.successful,
      });

      return response.data;
    } catch (error) {
      console.error(`❌ Bank78 API error (${endpoint}):`);
      console.error('  Message:', error.message);
      console.error('  Status:', error.response?.status);
      console.error('  Response Data:', JSON.stringify(error.response?.data, null, 2));

      await this.logError(endpoint, error);

      const shouldRetry = retryCount < this.maxRetries && 
                         (error.response?.status >= 500 || error.response?.status === 429);
      
      if (shouldRetry) {
        const delay = this.retryDelay * Math.pow(2, retryCount);
        console.log(`Retrying request (${retryCount + 1}/${this.maxRetries}) after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.request(method, endpoint, data, retryCount + 1);
      }

      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Bank78 API request failed';
      throw new Error(`Bank78 API error: ${errorMessage}`);
    }
  }

  async logError(endpoint, error) {
    try {
      const errorLog = {
        endpoint,
        status: 'error',
        error_message: error.message,
        response: error.response?.data || null,
        status_code: error.response?.status,
        created_at: new Date().toISOString(),
      };

      await supabase
        .from('bank78_logs')
        .insert(errorLog);
    } catch (logError) {
      console.error('Failed to log Bank78 error:', logError);
    }
  }

  // ============================================================
  // Virtual NUBAN - Account Creation & Management
  // ============================================================

  async createVirtualAccount(accountData) {
    const payload = {
      accountReference: accountData.accountReference || accountData.userId || `ACC-${Date.now()}`,
      accountName: accountData.accountName,
      emailAddress: accountData.emailAddress || accountData.email || '',
      phoneNumber: accountData.phoneNumber || accountData.phone || '',
      bvn: accountData.bvn || '',
      accountType: accountData.accountType || 1,
      expiresOn: accountData.expiresOn || null,
      customerGeneratedNuban: accountData.customerGeneratedNuban || null,
    };

    console.log('📤 Creating Bank78 virtual account:', {
      accountName: payload.accountName,
      accountReference: payload.accountReference,
      accountType: payload.accountType,
      bvn: payload.bvn ? `${payload.bvn.slice(0, 3)}...${payload.bvn.slice(-4)}` : 'not provided',
      phone: payload.phoneNumber ? `${payload.phoneNumber.slice(0, 4)}...${payload.phoneNumber.slice(-4)}` : 'not provided',
    });

    const response = await this.request('POST', '/api/virtual-nubans', payload);

    if (!response.successful) {
      throw new Error(response.message || 'Failed to create virtual account');
    }

    return response;
  }

  async getAccountByNumber(accountNumber) {
    return this.request('GET', `/api/virtual-nubans/accountNumber/${accountNumber}`);
  }

  async getAllAccounts(pageSize = 50, filter = '') {
    return this.request('GET', `/api/virtual-nubans/merchant/all/${pageSize}/${filter}`);
  }

  async queryTransaction(transactionReference) {
    return this.request('GET', `/api/virtual-nubans/transactionstatusquery/${transactionReference}`);
  }

  async getTransactionHistory(payload) {
    return this.request('POST', '/api/virtual-nubans/transaction-history/paginated-filter', {
      accountRef: payload.accountRef,
      page: payload.page || 1,
      pageSize: payload.pageSize || 20,
      startDate: payload.startDate,
      endDate: payload.endDate,
      accountNumber: payload.accountNumber || '',
    });
  }

  async testFunding(payload) {
    return this.request('POST', '/api/virtual-nubans/transaction-notification-fund', {
      beneficiaryAccountName: payload.beneficiaryAccountName,
      beneficiaryAccountNumber: payload.beneficiaryAccountNumber,
      originatorAccountName: payload.originatorAccountName || 'Test Sender',
      originatorAccountNumber: payload.originatorAccountNumber || '0220901228',
      narration: payload.narration || 'Test deposit',
      paymentReference: payload.paymentReference || `test-${Date.now()}`,
      amount: payload.amount.toString(),
    });
  }

  // ============================================================
  // Payout — Sending Money Out (Transfers)
  // ============================================================

  async interbankTransfer(data) {
    return this.request('POST', '/api/payout/interbank', {
      reference: data.reference || `TXN-${Date.now()}`,
      accountName: data.accountName,
      accountNumber: data.accountNumber,
      bankCode: data.bankCode,
      amount: data.amount,
      narration: data.narration || 'Transfer',
      currency: data.currency || 'NGN',
    });
  }

  async intrabankTransfer(data) {
    return this.request('POST', '/api/payout/intrabank', {
      reference: data.reference || `TXN-${Date.now()}`,
      accountName: data.accountName,
      accountNumber: data.accountNumber,
      amount: data.amount,
      narration: data.narration || 'Transfer',
      currency: data.currency || 'NGN',
    });
  }

  async bulkPayout(data) {
    return this.request('POST', '/api/payout/bulk', {
      name: data.name || 'Bulk Payout',
      beneficiaries: data.beneficiaries,
    });
  }

  async getTransferStatus(transactionReference) {
    return this.request('GET', `/api/payout/status/${transactionReference}`);
  }

  async nameEnquiry(data) {
    return this.request('GET', `/api/payout/name-enquiry?accountNumber=${data.accountNumber}&bankCode=${data.bankCode}`);
  }

  async getBankCodes() {
    return this.request('GET', '/api/payout/bank-codes');
  }

  // ============================================================
  // Balance
  // ============================================================

  async getAccountBalance(accountNumber) {
    return this.request('GET', `/api/payout/balance/${accountNumber}`);
  }

  async getVirtualAccountBalance(accountNumber) {
    return this.request('GET', `/api/virtual-nubans/balance/${accountNumber}`);
  }

  // ============================================================
  // Webhook Verification
  // ============================================================

  verifyWebhookSignature(payload, signature) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature || ''),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Webhook verification failed:', error);
      return false;
    }
  }
}

export default new Bank78Client();