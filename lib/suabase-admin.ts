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

// Cache for user data to prevent duplicate queries
interface CacheEntry {
  data: any;
  timestamp: number;
}

const userCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5000; // 5 seconds

// Define the User type based on your schema
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
}

export async function getUserWithDetails(userId: string): Promise<UserDetails | null> {
  // Check cache first
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const supabase = getSupabaseAdmin();
  
  // Single query to get user with all needed data
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
      pin_set
    `)
    .eq("id", userId)
    .single();

  if (error || !user) return null;

  // Cache the result
  userCache.set(userId, { data: user, timestamp: Date.now() });
  
  // Clear cache after TTL
  setTimeout(() => {
    userCache.delete(userId);
  }, CACHE_TTL);
  
  return user as UserDetails;
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