import { createClient, SupabaseClient } from "@supabase/supabase-js";
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

// ─────────────────────────────────────────────────────────────────────────────
// User cache
// ─────────────────────────────────────────────────────────────────────────────

interface CacheEntry {
  data: UserDetails;
  timestamp: number;
}

const userCache = new Map<string, CacheEntry>();

const CACHE_TTL = 5000;

// ─────────────────────────────────────────────────────────────────────────────
// User type
// ─────────────────────────────────────────────────────────────────────────────

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

  // Concurrent login fields
  current_session_id: string | null;
  current_session_ip: string | null;
  current_session_device: string | null;
  current_session_expires_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Get user with full details
// ─────────────────────────────────────────────────────────────────────────────

export async function getUserWithDetails(
  userId: string
): Promise<UserDetails | null> {
  // Check cache
  const cached = userCache.get(userId);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const supabase = getSupabaseAdmin();

  const { data: user, error } = await supabase
    .from("users")
    .select(`
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
      current_session_expires_at
    `)
    .eq("id", userId)
    .single();

  if (error) {
    console.error("❌ getUserWithDetails error:", error);
    return null;
  }

  if (!user) {
    return null;
  }

  // Because the Supabase client is typed with Database,
  // this should now be correctly inferred as the users row.
  const userDetails: UserDetails = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    wallet_balance: user.wallet_balance ?? 0,
    zidcoin_balance: user.zidcoin_balance ?? 0,
    referral_code: user.referral_code,
    bvn_verification: user.bvn_verification,
    admin_role: user.admin_role,
    city: user.city,
    state: user.state,
    address: user.address,
    date_of_birth: user.date_of_birth,
    profile_picture: user.profile_picture,
    current_login_session: user.current_login_session,
    subscription_tier: user.subscription_tier ?? "free",
    subscription_expires_at: user.subscription_expires_at,
    is_blocked: user.is_blocked ?? false,
    blocked_at: user.blocked_at,
    block_reason: user.block_reason,
    transaction_pin: user.transaction_pin,
    pin_set: user.pin_set ?? false,

    current_session_id: user.current_session_id,
    current_session_ip: user.current_session_ip,
    current_session_device: user.current_session_device,
    current_session_expires_at: user.current_session_expires_at,
  };

  // Cache user
  userCache.set(userId, {
    data: userDetails,
    timestamp: Date.now(),
  });

  setTimeout(() => {
    userCache.delete(userId);
  }, CACHE_TTL);

  return userDetails;
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscription helpers
// ─────────────────────────────────────────────────────────────────────────────

export function isSubscriptionActive(user: UserDetails): boolean {
  if (user.subscription_tier === "free") {
    return true;
  }

  if (!user.subscription_expires_at) {
    return false;
  }

  return new Date(user.subscription_expires_at) > new Date();
}

export function hasSufficientTier(
  user: UserDetails,
  requiredTier: string
): boolean {
  const tierHierarchy = [
    "free",
    "zidlite",
    "growth",
    "premium",
    "elite",
  ];

  const userTierIndex = tierHierarchy.indexOf(
    user.subscription_tier || "free"
  );

  const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

  // Unknown tier should not accidentally pass the check
  if (userTierIndex === -1 || requiredTierIndex === -1) {
    return false;
  }

  return (
    userTierIndex >= requiredTierIndex &&
    isSubscriptionActive(user)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Clear expired cache entries
// ─────────────────────────────────────────────────────────────────────────────

setInterval(() => {
  const now = Date.now();

  for (const [key, entry] of userCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      userCache.delete(key);
    }
  }
}, CACHE_TTL);