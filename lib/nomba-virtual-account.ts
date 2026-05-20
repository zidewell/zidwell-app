// lib/nomba-virtual-account.ts
import { getNombaToken } from "./nomba";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface VirtualAccountData {
  accountNumber: string;
  bankName: string;
  accountName: string;
  accountRef: string;
  bvn: string;
  bankAccountName: string;
  createdAt?: string;
}

export interface NombaVirtualAccount {
  createdAt: string;
  accountHolderId: string;
  accountRef: string;
  bvn: string;
  accountName: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  currency: string;
  callbackUrl: string;
  expired: boolean;
}

/**
 * Check if user has verified BVN in database
 */
export async function isBVNVerified(userId: string): Promise<boolean> {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("bvn_verification")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("❌ Error checking BVN status:", error);
      return false;
    }

    const isVerified = user?.bvn_verification === "verified";
    console.log(`📋 User BVN verification status: ${user?.bvn_verification || 'not_found'}`);
    
    return isVerified;
  } catch (error) {
    console.error("❌ Error checking BVN:", error);
    return false;
  }
}

/**
 * Get user's BVN by filtering virtual accounts with accountRef = userId
 */
export async function getUserBVNFromNomba(userId: string): Promise<string | null> {
  try {
    const token = await getNombaToken();
    if (!token) {
      console.error("❌ Failed to get Nomba token");
      return null;
    }

    console.log(`🔍 Searching for user's virtual account with accountRef: ${userId}`);
    
    const response = await fetch(
      `${process.env.NOMBA_URL}/v1/accounts/virtual/list`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          accountId: process.env.NOMBA_ACCOUNT_ID!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountRef: userId,
          expired: false,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || result.code !== "00" || !result.data?.results) {
      console.error("❌ Failed to fetch virtual accounts from Nomba");
      return null;
    }

    const accounts = result.data.results as NombaVirtualAccount[];
    
    if (accounts.length === 0) {
      console.error("❌ No virtual account found for user ID:", userId);
      return null;
    }

    const activeAccount = accounts.find(acc => !acc.expired);
    
    if (!activeAccount) {
      console.error("❌ No active virtual account found for user");
      return null;
    }

    const userBVN = activeAccount.bvn;
    
    console.log(`✅ Found user's virtual account!`);
    console.log(`   Account Number: ${activeAccount.bankAccountNumber}`);
    console.log(`   Bank: ${activeAccount.bankName}`);
    console.log(`   Account Ref: ${activeAccount.accountRef}`);
    console.log(`   BVN: ${userBVN.substring(0, 4)}****`);
    
    return userBVN;
    
  } catch (error) {
    console.error("❌ Error fetching user BVN from Nomba:", error);
    return null;
  }
}

/**
 * Clean account name for Nomba API - only allows letters, numbers, and spaces
 */
function cleanAccountName(name: string): string {
  // First, trim and convert to uppercase
  let cleaned = name.toUpperCase().trim();
  
  // Replace multiple spaces with single space
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Remove any special characters (keep letters, numbers, spaces)
  cleaned = cleaned.replace(/[^A-Z0-9\s]/g, '');
  
  // Ensure minimum length
  if (cleaned.length < 3) {
    cleaned = `PAGE${Date.now().toString().slice(-8)}`;
  }
  
  // Maximum 50 characters
  if (cleaned.length > 50) {
    cleaned = cleaned.substring(0, 50);
  }
  
  console.log(`   Cleaned Account Name: "${cleaned}"`);
  return cleaned;
}

/**
 * Create a dedicated virtual account for a payment page
 */
export async function createPaymentPageVirtualAccount(
  paymentPageId: string,
  paymentPageTitle: string,
  userBVN: string
): Promise<VirtualAccountData | null> {
  try {
    const token = await getNombaToken();
    if (!token) {
      console.error("❌ Failed to get Nomba token");
      return null;
    }

    // Clean the account name (remove special characters, keep spaces)
    let accountName = cleanAccountName(paymentPageTitle);
    
    // Create unique account reference using payment page ID
    const shortId = paymentPageId.replace(/-/g, '').substring(0, 15);
    const accountRef = `PP${shortId}${Date.now().toString().slice(-6)}`;

    console.log(`🏦 Creating NEW virtual account for payment page`);
    console.log(`   Original Name: ${paymentPageTitle}`);
    console.log(`   Account Name: ${accountName}`);
    console.log(`   Account Ref: ${accountRef}`);
    console.log(`   Using Merchant's BVN: ${userBVN.substring(0, 4)}****`);

    const response = await fetch(
      `${process.env.NOMBA_URL}/v1/accounts/virtual`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          accountId: process.env.NOMBA_ACCOUNT_ID!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountName: accountName,
          accountRef: accountRef,
          bvn: userBVN,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || result.code !== "00" || !result.data) {
      console.error("❌ Failed to create virtual account:", result);
      return null;
    }

    const account = result.data;
    
    console.log(`✅ Payment page virtual account created successfully!`);
    console.log(`   Account Number: ${account.bankAccountNumber}`);
    console.log(`   Bank: ${account.bankName}`);
    console.log(`   Account Name: ${account.accountName}`);
    
    return {
      accountNumber: account.bankAccountNumber,
      bankName: account.bankName,
      accountName: account.accountName,
      accountRef: account.accountRef,
      bvn: account.bvn,
      bankAccountName: account.bankAccountName,
      createdAt: account.createdAt,
    };
  } catch (error) {
    console.error("❌ Error creating virtual account:", error);
    return null;
  }
}

/**
 * Verify if a virtual account exists for a user
 */
export async function verifyUserVirtualAccountExists(userId: string): Promise<boolean> {
  try {
    const token = await getNombaToken();
    if (!token) {
      console.error("❌ Failed to get Nomba token");
      return false;
    }

    console.log(`🔍 Checking if user has virtual account with accountRef: ${userId}`);
    
    const response = await fetch(
      `${process.env.NOMBA_URL}/v1/accounts/virtual/list`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          accountId: process.env.NOMBA_ACCOUNT_ID!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountRef: userId,
          expired: false,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || result.code !== "00" || !result.data?.results) {
      return false;
    }

    const accounts = result.data.results as NombaVirtualAccount[];
    return accounts.length > 0 && !accounts[0].expired;
    
  } catch (error) {
    console.error("❌ Error checking user virtual account:", error);
    return false;
  }
}