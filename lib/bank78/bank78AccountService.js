import bank78Client from "./client";
import { getNombaToken } from "@/lib/nomba";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const REQUEST_TIMEOUT = 30000;

class Bank78AccountService {
  async createUserAccounts(userId) {
    try {
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (userError || !user) {
        throw new Error("User not found");
      }

      console.log(`User data for ${userId}:`, {
        hasBvnData: !!user.bvn_data,
        bvnDataKeys: user.bvn_data ? Object.keys(user.bvn_data) : [],
        rawDataKeys: user.bvn_data?.raw_data ? Object.keys(user.bvn_data.raw_data) : [],
        hasEncryptedBvn: !!user.encrypted_bvn,
        directBvn: user.bvn || null,
        bvnLogs: user.bvn_data?.logs?.length || 0,
        purpose: user.purpose,
        is_business_registered: user.is_business_registered
      });

      const bvn = this.extractBvn(user);
      
      console.log(`Extracted BVN for user ${userId}:`, bvn ? `${bvn.substring(0, 4)}*******` : "EMPTY");

      if (!user.bvn_data) {
        console.error(`No BVN data found for user ${userId}`);
        throw new Error("BVN verification is required before creating bank accounts. Please complete BVN verification first.");
      }

      if (!bvn || bvn.trim() === "") {
        console.error(`BVN data exists but is empty for user ${userId}`);
        throw new Error("Valid BVN is required to create bank accounts. Please verify your BVN.");
      }

      if (!/^\d{11}$/.test(bvn)) {
        console.error(`Invalid BVN format for user ${userId}: ${bvn}`);
        throw new Error("Invalid BVN format. BVN must be 11 digits.");
      }

      console.log(`User ${userId} BVN validated: ${bvn.substring(0, 4)}*******`);

      const { data: business, error: bizError } = await supabase
        .from("businesses")
        .select("is_registered")
        .eq("user_id", userId)
        .single();

      const isRegisteredBusiness = business?.is_registered === true;

      // ✅ CORRECTED LOGIC:
      // For business accounts:
      // - If registered (is_business_registered: true) → Create ONLY Business Bank78 account
      // - If not registered (is_business_registered: false) → Use Nomba only
      // For personal accounts:
      // - Create ONLY Personal Bank78 account
      
      // ✅ CASE 1: Unregistered business → Nomba only
      if (user.purpose === "business" && !isRegisteredBusiness) {
        console.log(`Unregistered business user ${userId} - using Nomba only`);
        const nombaAccount = await this.createNombaAccount(user);
        return {
          personalAccount: null,
          businessAccount: null,
          nombaAccount: nombaAccount,
          provider: "nomba",
        };
      }

      // ✅ CASE 2: Registered business → Create ONLY Business Bank78 account
      if (user.purpose === "business" && isRegisteredBusiness) {
        console.log(`Registered business user ${userId} - creating Business Bank78 account only...`);
        
        const { data: businessData, error: bizDataError } = await supabase
          .from("businesses")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (bizDataError) {
          console.error("Failed to fetch business data:", bizDataError);
        }

        const businessAccount = await this.createVirtualAccount(
          { ...user, businessName: businessData?.business_name },
          "business"
        );

        // Store business account references
        await this.storeBusinessAccountReferences(userId, businessAccount);
        await this.updatePrimaryProvider(userId, "bank78");

        console.log("Bank78 Business account created successfully:", {
          business: {
            accountNumber: businessAccount.account_number,
            accountName: businessAccount.account_name,
            bankName: businessAccount.bank_name
          }
        });

        return {
          personalAccount: null,
          businessAccount: businessAccount,
          nombaAccount: null,
          provider: "bank78",
        };
      }

      // ✅ CASE 3: Personal account → Create ONLY Personal Bank78 account
      if (user.purpose === "personal") {
        console.log(`Personal user ${userId} - creating Personal Bank78 account only...`);
        
        const personalAccount = await this.createVirtualAccount(user, "personal");

        // Store personal account references
        await this.storePersonalAccountReferences(userId, personalAccount);
        await this.updatePrimaryProvider(userId, "bank78");

        console.log("Bank78 Personal account created successfully:", {
          personal: {
            accountNumber: personalAccount.account_number,
            accountName: personalAccount.account_name,
            bankName: personalAccount.bank_name
          }
        });

        return {
          personalAccount: personalAccount,
          businessAccount: null,
          nombaAccount: null,
          provider: "bank78",
        };
      }

      // Fallback
      throw new Error("Invalid account type or configuration");
    } catch (error) {
      console.error("Failed to create accounts:", error);
      throw error;
    }
  }

  extractBvn(user) {
    if (!user) {
      console.error("No user object provided to extractBvn");
      return "";
    }

    console.log("Extracting BVN from user data...");

    const possibleBvnLocations = [
      () => {
        if (user.bvn_data?.logs && Array.isArray(user.bvn_data.logs)) {
          for (const log of user.bvn_data.logs) {
            if (log.request_payload?.bvn) {
              console.log("Found BVN in logs.request_payload.bvn");
              return log.request_payload.bvn;
            }
            if (log.bvn) {
              console.log("Found BVN in logs.bvn");
              return log.bvn;
            }
            if (log.response_payload?.data?.bvn) {
              console.log("Found BVN in logs.response_payload.data.bvn");
              return log.response_payload.data.bvn;
            }
          }
        }
        return null;
      },
      () => user.bvn_data?.raw_data?.bvn,
      () => user.bvn_data?.raw_data?.data?.bvn,
      () => user.bvn_data?.raw_data?.number,
      () => user.bvn_data?.bvn,
      () => user.bvn_data?.number,
      () => user.bvn_data?.verification?.bvn,
      () => user.bvn_data?.data?.bvn,
      () => user.bvn_data?.response?.bvn,
      () => user.bvn_data?.result?.bvn,
      () => {
        if (user.bvn_data?.logs && Array.isArray(user.bvn_data.logs)) {
          for (const log of user.bvn_data.logs) {
            if (log.response_payload?.data?.bvn) {
              console.log("Found BVN in logs.response_payload.data.bvn");
              return log.response_payload.data.bvn;
            }
            if (log.response_payload?.bvn) {
              console.log("Found BVN in logs.response_payload.bvn");
              return log.response_payload.bvn;
            }
          }
        }
        return null;
      },
      () => user.bvn,
      () => user.raw_data?.bvn,
      () => user.data?.bvn,
      () => user.verification?.bvn,
    ];

    for (const getBvn of possibleBvnLocations) {
      try {
        const value = getBvn();
        if (value && typeof value === 'string' && value.trim() !== '') {
          console.log(`Found BVN: ${value.substring(0, 4)}*******`);
          return value.trim();
        }
      } catch (e) {
        continue;
      }
    }

    if (user.encrypted_bvn) {
      console.log("Found encrypted BVN, but no decryption available");
    }

    console.log("No BVN found in any location");
    return "";
  }

  async createVirtualAccount(user, accountType) {
    try {
      const accountName =
        accountType === "business"
          ? user.businessName || user.full_name
          : user.full_name;

      let bvn = this.extractBvn(user);

      if (!bvn || bvn.trim() === "") {
        console.error(`Missing BVN for user ${user.id} when creating ${accountType} account`);
        throw new Error("BVN is required to create a virtual account. Please verify your BVN first.");
      }

      if (!/^\d{11}$/.test(bvn)) {
        throw new Error("Invalid BVN format. BVN must be 11 digits.");
      }

      console.log(`Creating ${accountType} account for user ${user.id} with BVN: ${bvn.substring(0, 4)}*******`);

      const accountData = {
        accountReference: `${user.id}-${accountType}-${Date.now()}`,
        accountName: accountName,
        emailAddress: user.email || "",
        phoneNumber: user.phone || "",
        bvn: bvn,
        userId: user.id,
        accountType: 1,
        hasMinimumAmount: false,
        minimumAmount: null
      };

      console.log(`Sending request to Bank78 for ${accountType} account...`);
      const response = await bank78Client.createVirtualAccount(accountData);
      
      console.log(`Bank78 ${accountType} account response:`, JSON.stringify(response, null, 2));

      if (!response.successful || !response.result) {
        console.error(`Bank78 ${accountType} account creation failed:`, response);
        throw new Error(
          response.message || "Failed to create virtual account"
        );
      }

      const result = response.result;
      console.log(`Bank78 ${accountType} account created:`, {
        accountNumber: result.accountNumber,
        accountName: result.accountName,
        bankName: result.bankName,
        accountReference: result.accountReference,
        reservationReference: result.reservationReference
      });

      return {
        account_id: result.accountReference || result.reservationReference,
        account_number: result.accountNumber,
        account_name: result.accountName,
        bank_name: result.bankName || process.env.BANK78_DEFAULT_BANK_NAME || "Bank78",
        bank_code: result.bankCode,
        reservation_reference: result.reservationReference,
        account_type: accountType,
        is_active: result.isActive !== undefined ? result.isActive : true,
        account_reference: result.accountReference,
        merchant_id: result.merchantId,
        bvn_used: true
      };
    } catch (error) {
      console.error(`Failed to create ${accountType} virtual account:`, error);
      throw new Error(
        `Failed to create ${accountType} Bank78 account: ${error.message}`
      );
    }
  }

  async createNombaAccount(user) {
    try {
      console.log(`Creating Nomba account for user ${user.id}...`);
      const token = await getNombaToken();
      console.log("Nomba token obtained");

      const bvn = this.extractBvn(user);
      console.log(`Nomba BVN: ${bvn ? bvn.substring(0, 4) + '*******' : 'EMPTY'}`);

      const requestBody = {
        accountName: user.full_name,
        accountRef: user.id,
        bvn: bvn,
      };

      console.log("Nomba Request:", JSON.stringify(requestBody, null, 2));

      const response = await fetch(
        `${process.env.NOMBA_URL}/v1/accounts/virtual`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            accountId: process.env.NOMBA_ACCOUNT_ID,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        }
      );

      const wallet = await response.json();
      console.log("Nomba Response:", JSON.stringify(wallet, null, 2));

      if (!response.ok || !wallet?.data) {
        console.error("Nomba account creation failed:", wallet);
        throw new Error(wallet.message || "Failed to create Nomba account");
      }

      console.log("Nomba account created:", {
        accountRef: wallet.data.accountRef,
        bankAccountNumber: wallet.data.bankAccountNumber,
        bankName: wallet.data.bankName,
        bankAccountName: wallet.data.bankAccountName
      });

      const updateData = {
        wallet_id: wallet.data.accountRef,
        bank_name: wallet.data.bankName,
        bank_account_number: wallet.data.bankAccountNumber,
        bank_account_name: wallet.data.bankAccountName,
        wallet_provider: "nomba",
        primary_provider: "nomba",
        wallet_updated_at: new Date().toISOString(),
        verification_completed: true,
        verification_step: 6,
        bank78_verified: false,
      };

      console.log("Updating user with Nomba data:", updateData);

      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", user.id)
        .select()
        .single();

      if (updateError) {
        console.error("Failed to update user with Nomba data:", updateError);
        throw new Error("Failed to update user with Nomba account");
      }

      console.log("User updated with Nomba account:", {
        id: updatedUser.id,
        wallet_id: updatedUser.wallet_id,
        bank_account_number: updatedUser.bank_account_number
      });

      return {
        account_id: wallet.data.accountRef,
        account_number: wallet.data.bankAccountNumber,
        account_name: wallet.data.bankAccountName,
        bank_name: wallet.data.bankName || "Wema Bank",
        account_type: "nomba",
      };
    } catch (error) {
      console.error("Nomba account creation error:", error);
      throw new Error(`Failed to create Nomba account: ${error.message}`);
    }
  }

  async storePersonalAccountReferences(userId, personalAccount) {
    const updateData = {
      bank78_verified: true,
      bank78_verified_at: new Date().toISOString(),
      bank78_personal_account_id: personalAccount.account_id,
      bank78_personal_account_number: personalAccount.account_number,
      bank78_personal_account_name: personalAccount.account_name,
      bank78_personal_bank_name: personalAccount.bank_name,
      primary_provider: "bank78",
      wallet_provider: "bank78",
      verification_completed: true,
      verification_step: 6,
      bank_account_number: personalAccount.account_number,
      bank_account_name: personalAccount.account_name,
      bank_name: personalAccount.bank_name,
    };

    console.log("Updating user with personal account references:", {
      userId,
      personalAccountNumber: personalAccount.account_number,
      fullUpdateData: updateData
    });

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select();

    if (error) {
      console.error("Failed to store personal account references:", error);
      throw new Error("Failed to store personal account references");
    }

    console.log("User updated with personal account:", {
      userId,
      updated: updatedUser,
      personalAccountNumber: personalAccount.account_number
    });

    return updatedUser;
  }

  async storeBusinessAccountReferences(userId, businessAccount) {
    const updateData = {
      bank78_verified: true,
      bank78_verified_at: new Date().toISOString(),
      bank78_business_account_id: businessAccount.account_id,
      bank78_business_account_number: businessAccount.account_number,
      bank78_business_account_name: businessAccount.account_name,
      bank78_business_bank_name: businessAccount.bank_name,
      primary_provider: "bank78",
      wallet_provider: "bank78",
      verification_completed: true,
      verification_step: 6,
    };

    console.log("Updating user with business account references:", {
      userId,
      businessAccountNumber: businessAccount.account_number,
      fullUpdateData: updateData
    });

    // Update user with business account info
    const { data: updatedUser, error: userError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select();

    if (userError) {
      console.error("Failed to store business account references in user:", userError);
      throw new Error("Failed to store business account references");
    }

    // Update business with account info
    const { error: bizError } = await supabase
      .from("businesses")
      .update({
        bank78_account_id: businessAccount.account_id,
        bank78_account_number: businessAccount.account_number,
        bank78_account_name: businessAccount.account_name,
        bank78_bank_name: businessAccount.bank_name,
        verification_completed: true,
      })
      .eq("user_id", userId);

    if (bizError) {
      console.error("Failed to update business with account references:", bizError);
    } else {
      console.log("Business updated with account references:", {
        userId,
        businessAccountNumber: businessAccount.account_number
      });
    }

    console.log("User updated with business account:", {
      userId,
      updated: updatedUser,
      businessAccountNumber: businessAccount.account_number
    });

    return updatedUser;
  }

  async updatePrimaryProvider(userId, provider) {
    const { error } = await supabase
      .from("users")
      .update({
        primary_provider: provider || "bank78",
      })
      .eq("id", userId);

    if (error) {
      console.error("Failed to update primary provider:", error);
    } else {
      console.log(`Primary provider updated to ${provider} for user:`, userId);
    }
  }

  async getAccountBalance(userId) {
    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !user) {
        throw new Error("User not found");
      }

      if (user.wallet_provider === "nomba" && user.wallet_id) {
        try {
          const token = await getNombaToken();
          const response = await fetch(
            `${process.env.NOMBA_URL}/v1/wallets/${user.wallet_id}/balance`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              signal: AbortSignal.timeout(REQUEST_TIMEOUT),
            }
          );
          const data = await response.json();
          console.log("Nomba balance response:", JSON.stringify(data, null, 2));
          return {
            nomba: {
              accountNumber: user.bank_account_number,
              accountName: user.bank_account_name,
              bankName: user.bank_name || "Wema Bank",
              balance: data.balance || 0,
            },
            total: data.balance || 0,
          };
        } catch (error) {
          console.error("Failed to fetch Nomba balance:", error);
          return null;
        }
      }

      if (!user.bank78_verified) {
        return null;
      }

      let personalBalance = 0;
      let businessBalance = 0;

      if (user.bank78_personal_account_number) {
        try {
          const balance = await bank78Client.getAccountBalance(
            user.bank78_personal_account_number
          );
          console.log("Bank78 personal balance response:", JSON.stringify(balance, null, 2));
          personalBalance = balance.result?.balance || 0;
        } catch (error) {
          console.error("Failed to fetch personal balance:", error);
        }
      }

      if (user.bank78_business_account_number) {
        try {
          const balance = await bank78Client.getAccountBalance(
            user.bank78_business_account_number
          );
          console.log("Bank78 business balance response:", JSON.stringify(balance, null, 2));
          businessBalance = balance.result?.balance || 0;
        } catch (error) {
          console.error("Failed to fetch business balance:", error);
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
      console.error("Failed to get account balance:", error);
      throw error;
    }
  }

  async getTransactionHistory(userId, params = {}) {
    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !user) {
        throw new Error("User not found");
      }

      const transactions = [];
      const accounts = [];

      if (user.bank78_personal_account_number) {
        accounts.push({
          accountNumber: user.bank78_personal_account_number,
          accountRef: user.bank78_personal_account_id,
          type: "personal",
        });
      }

      if (user.bank78_business_account_number) {
        accounts.push({
          accountNumber: user.bank78_business_account_number,
          accountRef: user.bank78_business_account_id,
          type: "business",
        });
      }

      for (const account of accounts) {
        try {
          const history = await bank78Client.getTransactionHistory({
            accountRef: account.accountRef,
            page: params.page || 1,
            pageSize: params.limit || 50,
            startDate: params.startDate,
            endDate: params.endDate,
            accountNumber: account.accountNumber,
          });

          console.log(`Transaction history for ${account.type}:`, JSON.stringify(history, null, 2));

          if (history.successful && history.result?.items) {
            const formatted = history.result.items.map((tx) => ({
              id: tx.id,
              amount: tx.amount,
              type: tx.amount > 0 ? "credit" : "debit",
              description: tx.narration || "Bank78 Transaction",
              reference: tx.paymentReference,
              senderAccountNumber: tx.senderAccountNumber,
              senderAccountName: tx.senderAccountName,
              receiverAccountNumber: tx.receiverAccountNumber,
              receiverAccountName: tx.receiverAccountName,
              bankName: tx.bankName,
              charges: tx.charges || 0,
              date: tx.dateCreated,
              accountType: account.type,
              provider: "bank78",
              provider_account_id: account.accountRef,
            }));

            transactions.push(...formatted);
          }
        } catch (error) {
          console.error(
            `Failed to fetch transactions for ${account.type} account:`,
            error
          );
        }
      }

      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

      return transactions;
    } catch (error) {
      console.error("Failed to get transaction history:", error);
      throw error;
    }
  }
}

export default new Bank78AccountService();