// lib/suabase-admin.ts
import { createClient } from "@supabase/supabase-js";

let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return supabaseAdminInstance;
}

// Cache for user data
interface CacheEntry {
  data: any;
  timestamp: number;
}

const userCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5000;

// Updated UserDetails interface with all available fields
export interface UserDetails {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string;
  wallet_balance: number;
  zidcoin_balance: number;
  referral_code: string | null;
  referred_by: string | null;
  bvn_verification: string | null;
  admin_role: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  date_of_birth: string | null;
  profile_picture: string | null;
  current_login_session: string | null;
  subscription_tier: string;
  subscription_expires_at: string | null;
  is_blocked: boolean;
  blocked_at: string | null;
  block_reason: string | null;
  transaction_pin: string | null;
  pin_set: boolean;
  // Verification fields
  verification_completed: boolean;
  verification_step: number;
  bank78_verified: boolean;
  bank78_verified_at: string | null;
  primary_provider: string;
  wallet_provider: string;
  nin_verification: string | null;
  is_business_registered: boolean;
  onboarding_completed: boolean;
  onboarding_step: number;
  purpose: string | null;
  // Bank78 fields
  bank78_personal_account_id: string | null;
  bank78_personal_account_number: string | null;
  bank78_personal_account_name: string | null;
  bank78_personal_bank_name: string | null;
  bank78_business_account_id: string | null;
  bank78_business_account_number: string | null;
  bank78_business_account_name: string | null;
  bank78_business_bank_name: string | null;
  bank78_customer_id: string | null;
  // Bank fields
  bank_account_number: string | null;
  bank_account_name: string | null;
  bank_name: string | null;
  wallet_id: string | null;
  wallet_updated_at: string | null;
  // NEW verification fields
  identity_verified: boolean;
  kyc_level: string;
  verified_at: string | null;
  verification_provider: string | null;
  verification_reference: string | null;
  verification_id: string | null;
  verification_status: string;
  encrypted_bvn: string | null;
  verification_logs: any[];
  face_match_verified: boolean;
  dob_verified: boolean;
  name_verified: boolean;
  // Additional fields
  email_verified: boolean;
  country: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  last_logout: string | null;
  bvn_data: any | null;
  cac_data: any | null;
  // Usage tracking
  total_invoices_created: number;
  invoices_used_monthly: number;
  receipts_used_monthly: number;
  contracts_used_monthly: number;
  last_usage_reset: string | null;
  invoices_used_lifetime: number;
  receipts_used_lifetime: number;
  contracts_used_lifetime: number;
  invoice_lifetime_limit: number;
  receipt_lifetime_limit: number;
  contract_lifetime_limit: number;
  // PIN security
  pin_attempts: number;
  pin_locked_until: string | null;
  pin_reset_token: string | null;
  pin_reset_token_expires: string | null;
  // Flagging
  is_flagged: boolean;
  flag_reason: string | null;
  flag_notes: string | null;
  flagged_at: string | null;
  // Wallet
  wallet_frozen: boolean;
  wallet_freeze_reason: string | null;
  wallet_frozen_at: string | null;
  // Limits
  daily_transaction_limit: number;
  monthly_transaction_limit: number;
  limit_updated_at: string | null;
  // KYC
  kyc_approved_at: string | null;
  kyc_approved_by: string | null;
  kyc_rejected_at: string | null;
  kyc_rejection_reason: string | null;
  kyc_rejected_by: string | null;
  // NIN
  nin: string | null;
  verification_response: string | null;
  // Email
  email_verification_token: string | null;
  email_verification_token_expires: string | null;
  // Referral
  referral_source: string | null;
  // Notification
  notification_preferences: any;
  // Subscription

}

export async function getUserWithDetails(userId: string): Promise<UserDetails | null> {
  // Check cache first
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const supabase = getSupabaseAdmin();
  
  const selectQuery = `
    id,
    full_name,
    first_name,
    last_name,
    email,
    phone,
    wallet_balance,
    zidcoin_balance,
    referral_code,
    referred_by,
    bvn_verification,
    admin_role,
    city,
    state,
    address,
    date_of_birth,
    profile_picture,
    current_login_session,
    subscription_tier,
    subscription_expires_at,
    is_blocked,
    blocked_at,
    block_reason,
    transaction_pin,
    pin_set,
    verification_completed,
    verification_step,
    bank78_verified,
    bank78_verified_at,
    primary_provider,
    wallet_provider,
    nin_verification,
    is_business_registered,
    onboarding_completed,
    onboarding_step,
    purpose,
    identity_verified,
    kyc_level,
    verified_at,
    verification_provider,
    verification_reference,
    verification_id,
    verification_status,
    encrypted_bvn,
    verification_logs,
    face_match_verified,
    dob_verified,
    name_verified,
    email_verified,
    country,
    created_at,
    updated_at,
    last_login,
    last_logout,
    bank78_personal_account_id,
    bank78_personal_account_number,
    bank78_personal_account_name,
    bank78_personal_bank_name,
    bank78_business_account_id,
    bank78_business_account_number,
    bank78_business_account_name,
    bank78_business_bank_name,
    bank78_customer_id,
    bank_account_number,
    bank_account_name,
    bank_name,
    wallet_id,
    wallet_updated_at,
    bvn_data,
    cac_data,
    total_invoices_created,
    invoices_used_monthly,
    receipts_used_monthly,
    contracts_used_monthly,
    last_usage_reset,
    invoices_used_lifetime,
    receipts_used_lifetime,
    contracts_used_lifetime,
    invoice_lifetime_limit,
    receipt_lifetime_limit,
    contract_lifetime_limit,
    pin_attempts,
    pin_locked_until,
    pin_reset_token,
    pin_reset_token_expires,
    is_flagged,
    flag_reason,
    flag_notes,
    flagged_at,
    wallet_frozen,
    wallet_freeze_reason,
    wallet_frozen_at,
    daily_transaction_limit,
    monthly_transaction_limit,
    limit_updated_at,
    kyc_approved_at,
    kyc_approved_by,
    kyc_rejected_at,
    kyc_rejection_reason,
    kyc_rejected_by,
    nin,
    verification_response,
    email_verification_token,
    email_verification_token_expires,
    referral_source,
    notification_preferences
  `;

  const { data: user, error } = await supabase
    .from("users")
    .select(selectQuery)
    .eq("id", userId)
    .single();

  if (error || !user) return null;

  const userDetails = user as UserDetails;

  // Cache the result
  userCache.set(userId, { data: userDetails, timestamp: Date.now() });
  
  setTimeout(() => {
    userCache.delete(userId);
  }, CACHE_TTL);
  
  return userDetails;
}

// Helper function to check if subscription is active
export function isSubscriptionActive(user: UserDetails): boolean {
  if (user.subscription_tier === "free") return true;
  if (!user.subscription_expires_at) return false;
  return new Date(user.subscription_expires_at) > new Date();
}

// Helper function to check subscription tier access
export function hasSufficientTier(
  user: UserDetails, 
  requiredTier: string
): boolean {
  const tierHierarchy = ["free", "solopreneur", "sme", "enterprise", "corporation"];
  const userTierIndex = tierHierarchy.indexOf(user.subscription_tier || "free");
  const requiredTierIndex = tierHierarchy.indexOf(requiredTier);
  
  return userTierIndex >= requiredTierIndex && isSubscriptionActive(user);
}

// Helper function to check if user is fully verified
export function isUserFullyVerified(user: UserDetails): boolean {
  return (
    user.bvn_verification === "verified" ||
    user.identity_verified === true ||
    user.kyc_level === "personal_verified" ||
    user.kyc_level === "business_verified" ||
    user.verification_completed === true
  );
}

// Helper function to check if user has a bank account
export function hasBankAccount(user: UserDetails): boolean {
  return (
    user.bank78_verified === true ||
    user.bank78_personal_account_number !== null ||
    user.bank_account_number !== null ||
    user.wallet_id !== null
  );
}

// Helper function to get user's primary account details
export function getPrimaryAccount(user: UserDetails): {
  accountNumber: string | null;
  accountName: string | null;
  bankName: string | null;
} {
  if (user.primary_provider === "bank78" && user.bank78_personal_account_number) {
    return {
      accountNumber: user.bank78_personal_account_number,
      accountName: user.bank78_personal_account_name,
      bankName: user.bank78_personal_bank_name || "Bank78",
    };
  }
  
  return {
    accountNumber: user.bank_account_number || user.wallet_id,
    accountName: user.bank_account_name || user.full_name,
    bankName: user.bank_name || "Wema Bank",
  };
}


// Clear cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of userCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      userCache.delete(key);
    }
  }
}, CACHE_TTL);