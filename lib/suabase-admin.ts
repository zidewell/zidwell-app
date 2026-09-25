// lib/suabase-admin.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let supabaseAdminInstance: SupabaseClient<Database> | null = null;

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient<Database>(
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

// ─── Cache ───
interface CacheEntry {
  data: UserDetails;
  timestamp: number;
}

const userCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5000;

// ─── User details row ───
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
  current_session_id: string | null;
  current_session_ip: string | null;
  current_session_device: string | null;
  current_session_expires_at: string | null;

  // ─── Verification ───
  identity_verified: boolean | null;
  verification_completed: boolean | null;
  bank78_verified: boolean | null;
  is_business_registered: boolean | null;
  purpose: string | null;

  // ─── Bank ───
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  wallet_id: string | null;

  // ─── Activation ───
  activation_paid: boolean | null;
  activated_at: string | null;
  activation_reference: string | null;
}

export async function getUserWithDetails(
  userId: string
): Promise<UserDetails | null> {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const supabase = getSupabaseAdmin();

  const { data: user, error } = await supabase
    .from("users")
    .select(
      `
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
      current_session_id,
      current_session_ip,
      current_session_device,
      current_session_expires_at,
      identity_verified,
      verification_completed,
      bank78_verified,
      is_business_registered,
      purpose,
      bank_name,
      bank_account_name,
      bank_account_number,
      wallet_id,
      activation_paid,
      activated_at,
      activation_reference
    `
    )
    .eq("id", userId)
    .single();

  if (error || !user) return null;

  const details = user as unknown as UserDetails;

  userCache.set(userId, { data: details, timestamp: Date.now() });

  setTimeout(() => {
    userCache.delete(userId);
  }, CACHE_TTL);

  return details;
}

export function isSubscriptionActive(user: UserDetails): boolean {
  if (user.subscription_tier === "free") return true;
  if (!user.subscription_expires_at) return false;
  return new Date(user.subscription_expires_at) > new Date();
}

export function hasSufficientTier(
  user: UserDetails,
  requiredTier: string
): boolean {
  const tierHierarchy = ["free", "zidlite", "growth", "premium", "elite"];
  const userTierIndex = tierHierarchy.indexOf(user.subscription_tier || "free");
  const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

  return userTierIndex >= requiredTierIndex && isSubscriptionActive(user);
}

// ─── Cache sweep (hot-reload safe) ───
declare global {
  // eslint-disable-next-line no-var
  var __userCacheSweep: ReturnType<typeof setInterval> | undefined;
}

if (!globalThis.__userCacheSweep) {
  globalThis.__userCacheSweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of userCache.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        userCache.delete(key);
      }
    }
  }, CACHE_TTL);
}