// lib/bank78/client.js
import axios from "axios";
import qs from "qs";

const REQUEST_TIMEOUT = 30000;

class Bank78Client {
  constructor() {
    this.baseURL = process.env.BANK78_BASE_URL || "https://sandbox.bank78.co";
    this.apiKey = process.env.BANK78_API_KEY;
    this.clientId = process.env.BANK78_CLIENT_ID;
    this.clientSecret =
      process.env.BANK78_SECRET_KEY || process.env.BANK78_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  }

  isTokenValid() {
    if (!this.accessToken || !this.tokenExpiry) return false;
    return Date.now() < this.tokenExpiry;
  }

  async getAccessToken() {
    if (this.isTokenValid()) {
      return this.accessToken;
    }

    const data = qs.stringify({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: "client_credentials",
    });

    const config = {
      method: "post",
      url: `${this.baseURL}/identity/connect/token`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "x-api-key": this.apiKey,
      },
      data,
      timeout: REQUEST_TIMEOUT,
    };

    const response = await axios(config);

    if (response.data && response.data.access_token) {
      this.accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiry = Date.now() + (expiresIn - 60) * 1000;
      return this.accessToken;
    }

    throw new Error("No access token received from Bank78");
  }

  async request(method, endpoint, data = null, extraHeaders = {}) {
    const accessToken = await this.getAccessToken();

    const headers = {
      "x-api-key": this.apiKey || "",
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...extraHeaders,
    };

    try {
      const config = {
        method,
        url: endpoint,
        headers,
        timeout: REQUEST_TIMEOUT,
      };

      if (data) {
        config.data = data;
      }

      const response = await this.client.request(config);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        this.accessToken = null;
        this.tokenExpiry = null;

        const newToken = await this.getAccessToken();
        const retryConfig = {
          method,
          url: endpoint,
          headers: { ...headers, Authorization: `Bearer ${newToken}` },
          timeout: REQUEST_TIMEOUT,
        };
        if (data) retryConfig.data = data;

        const retryResponse = await this.client.request(retryConfig);
        return retryResponse.data;
      }

      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      const errorMessage =
        error.response.data?.message ||
        error.response.data?.error ||
        error.response.data?.error_description ||
        error.message;
      throw new Error(`Bank78 API error: ${errorMessage}`);
    }
    if (error.code === "ECONNABORTED") {
      throw new Error("Bank78 API request timed out");
    }
    throw error;
  }

  // UPDATED: BVN is now required
  async createVirtualAccount(accountData) {
    // Use the exact API endpoint from documentation
    const endpoint = "/virtual-nuban/api/virtual-nubans";
    
    // Validate BVN - now required
    if (!accountData.bvn || accountData.bvn.trim() === "") {
      throw new Error("BVN is required to create a virtual account");
    }
    
    // Validate BVN format (11 digits)
    if (!/^\d{11}$/.test(accountData.bvn)) {
      throw new Error("Invalid BVN format. BVN must be 11 digits.");
    }

    const payload = {
      accountReference:
        accountData.accountReference ||
        accountData.userId ||
        `ACC-${Date.now()}`,
      accountName: accountData.accountName,
      emailAddress: accountData.emailAddress || accountData.email || "",
      phoneNumber: accountData.phoneNumber || accountData.phone || "",
      bvn: accountData.bvn, // Now required
      accountType: accountData.accountType || 1,
      hasMinimumAmount: accountData.hasMinimumAmount || false,
      minimumAmount: accountData.minimumAmount || null,
    };

    console.log(`Creating virtual account with BVN: ${accountData.bvn.substring(0, 4)}*******`);
    console.log(`Endpoint: ${this.baseURL}${endpoint}`);

    const response = await this.request("post", endpoint, payload);

    // Check if the response matches the expected format from documentation
    if (!response.successful) {
      throw new Error(
        response.message ||
          response.validationMessages?.join(", ") ||
          "Failed to create virtual account"
      );
    }

    return response;
  }

  // Other methods remain the same...
  async getAccountByNumber(accountNumber) {
    const endpoint = `/virtual-nuban/api/virtual-nubans/accountNumber/${accountNumber}`;
    return this.request("get", endpoint);
  }

  async getAllAccounts(pageSize = 50, filter = "") {
    const endpoint = `/virtual-nuban/api/virtual-nubans/merchant/all/${pageSize}/${filter}`;
    return this.request("get", endpoint);
  }

  async queryTransaction(transactionReference) {
    const endpoint = `/virtual-nuban/api/virtual-nubans/transactionstatusquery/${transactionReference}`;
    return this.request("get", endpoint);
  }

  async getTransactionHistory(payload) {
    const endpoint = "/virtual-nuban/api/virtual-nubans/transaction-history/paginated-filter";
    return this.request("post", endpoint, {
      accountRef: payload.accountRef,
      page: payload.page || 1,
      pageSize: payload.pageSize || 20,
      startDate: payload.startDate,
      endDate: payload.endDate,
      accountNumber: payload.accountNumber || "",
    });
  }

  async getTransactions(accountId, params = {}) {
    return this.getTransactionHistory({
      accountRef: accountId,
      page: params.page || 1,
      pageSize: params.limit || 100,
      startDate: params.startDate,
      endDate: params.endDate,
    });
  }

  async testFunding(payload) {
    const endpoint = "/virtual-nuban/api/virtual-nubans/transaction-notification-fund";
    return this.request("post", endpoint, {
      beneficiaryAccountName: payload.beneficiaryAccountName,
      beneficiaryAccountNumber: payload.beneficiaryAccountNumber,
      originatorAccountName: payload.originatorAccountName || "Test Sender",
      originatorAccountNumber: payload.originatorAccountNumber || "0220901228",
      narration: payload.narration || "Test deposit",
      paymentReference: payload.paymentReference || `test-${Date.now()}`,
      amount: payload.amount.toString(),
    });
  }

  async getVirtualAccountBalance(accountNumber) {
    const endpoint = `/virtual-nuban/api/virtual-nubans/balance/${accountNumber}`;
    return this.request("get", endpoint);
  }

  async interbankTransfer(data) {
    return this.request("post", "/api/payout/interbank", {
      reference: data.reference || `TXN-${Date.now()}`,
      accountName: data.accountName,
      accountNumber: data.accountNumber,
      bankCode: data.bankCode,
      amount: data.amount,
      narration: data.narration || "Transfer",
      currency: data.currency || "NGN",
    });
  }

  async intrabankTransfer(data) {
    return this.request("post", "/api/payout/intrabank", {
      reference: data.reference || `TXN-${Date.now()}`,
      accountName: data.accountName,
      accountNumber: data.accountNumber,
      amount: data.amount,
      narration: data.narration || "Transfer",
      currency: data.currency || "NGN",
    });
  }

  async bulkPayout(data) {
    return this.request("post", "/api/payout/bulk", {
      name: data.name || "Bulk Payout",
      beneficiaries: data.beneficiaries,
    });
  }

  async getTransferStatus(transactionReference) {
    return this.request("get", `/api/payout/status/${transactionReference}`);
  }

  async nameEnquiry(data) {
    return this.request(
      "get",
      `/api/payout/name-enquiry?accountNumber=${data.accountNumber}&bankCode=${data.bankCode}`
    );
  }

  async getBankCodes() {
    return this.request("get", "/api/payout/bank-codes");
  }

  async getAccountBalance(accountNumber) {
    return this.request("get", `/api/payout/balance/${accountNumber}`);
  }
}

const bank78Client = new Bank78Client();

export default bank78Client;
export { Bank78Client, bank78Client };