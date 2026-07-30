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

// Updated UserDetails interface with new verification fields
export interface UserDetails {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  wallet_balance: number;
  zidcoin_balance: number;
  referral_code: string | null;
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
  primary_provider: string;
  wallet_provider: string;
  nin_verification: string | null;
  is_business_registered: boolean;
  onboarding_completed: boolean;
  onboarding_step: number;
  purpose: string | null;
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
    email,
    phone,
    wallet_balance,
    zidcoin_balance,
    referral_code,
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
    name_verified
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
  const tierHierarchy = ["free", "zidlite", "growth", "premium", "elite"];
  const userTierIndex = tierHierarchy.indexOf(user.subscription_tier || "free");
  const requiredTierIndex = tierHierarchy.indexOf(requiredTier);
  
  return userTierIndex >= requiredTierIndex && isSubscriptionActive(user);
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