import { SupabaseClient } from "@supabase/supabase-js";

const MAX_SAVED = 20;

export interface BankAccountInput {
  account_number: string;
  account_name: string;
  bank_code: string;
  bank_name: string;
}

export interface P2PBeneficiaryInput {
  wallet_id: string;
  account_number: string;
  account_name: string;
}

/**
 * Idempotent upsert for a saved bank account.
 * - If exists: bump last_used_at, increment use_count, refresh name
 * - If new: insert with auto_saved=true
 * - Then evict oldest non-default if user exceeds MAX_SAVED
 */
export async function upsertSavedBankAccount(
  supabase: SupabaseClient,
  userId: string,
  account: BankAccountInput,
  opts: { isDefault?: boolean; autoSaved?: boolean } = {}
) {
  if (!userId || !account.account_number || !account.bank_code) return null;

  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("saved_accounts")
    .select("id, use_count")
    .eq("user_id", userId)
    .eq("account_number", account.account_number)
    .eq("bank_code", account.bank_code)
    .maybeSingle();

  if (existing) {
    const update: Record<string, any> = {
      account_name: account.account_name,
      bank_name: account.bank_name,
      last_used_at: now,
      use_count: (existing.use_count || 0) + 1,
    };
    if (opts.isDefault !== undefined) update.is_default = opts.isDefault;

    await supabase.from("saved_accounts").update(update).eq("id", existing.id);
    return existing.id;
  }

  const { data: inserted, error } = await supabase
    .from("saved_accounts")
    .insert({
      user_id: userId,
      account_number: account.account_number,
      account_name: account.account_name,
      bank_code: account.bank_code,
      bank_name: account.bank_name,
      is_default: opts.isDefault ?? false,
      auto_saved: opts.autoSaved ?? true,
      last_used_at: now,
      use_count: 1,
    })
    .select("id")
    .single();

  if (error) {
    // 23505 = unique violation (race) → fetch existing
    if (error.code === "23505") {
      const { data: raced } = await supabase
        .from("saved_accounts")
        .select("id")
        .eq("user_id", userId)
        .eq("account_number", account.account_number)
        .eq("bank_code", account.bank_code)
        .maybeSingle();
      return raced?.id ?? null;
    }
    console.error("upsertSavedBankAccount insert error:", error);
    return null;
  }

  await evictOldestIfOverCap(supabase, "saved_accounts", userId, "last_used_at");
  return inserted?.id ?? null;
}

/**
 * Idempotent upsert for a saved P2P beneficiary.
 */
export async function upsertSavedP2PBeneficiary(
  supabase: SupabaseClient,
  userId: string,
  beneficiary: P2PBeneficiaryInput,
  opts: { isDefault?: boolean; autoSaved?: boolean } = {}
) {
  if (!userId || !beneficiary.wallet_id) return null;

  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("saved_p2p_beneficiaries")
    .select("id, use_count")
    .eq("user_id", userId)
    .eq("wallet_id", beneficiary.wallet_id)
    .maybeSingle();

  if (existing) {
    const update: Record<string, any> = {
      account_number: beneficiary.account_number,
      account_name: beneficiary.account_name,
      last_used_at: now,
      use_count: (existing.use_count || 0) + 1,
    };
    if (opts.isDefault !== undefined) update.is_default = opts.isDefault;

    await supabase
      .from("saved_p2p_beneficiaries")
      .update(update)
      .eq("id", existing.id);
    return existing.id;
  }

  const { data: inserted, error } = await supabase
    .from("saved_p2p_beneficiaries")
    .insert({
      user_id: userId,
      wallet_id: beneficiary.wallet_id,
      account_number: beneficiary.account_number,
      account_name: beneficiary.account_name,
      is_default: opts.isDefault ?? false,
      auto_saved: opts.autoSaved ?? true,
      last_used_at: now,
      use_count: 1,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: raced } = await supabase
        .from("saved_p2p_beneficiaries")
        .select("id")
        .eq("user_id", userId)
        .eq("wallet_id", beneficiary.wallet_id)
        .maybeSingle();
      return raced?.id ?? null;
    }
    console.error("upsertSavedP2PBeneficiary insert error:", error);
    return null;
  }

  await evictOldestIfOverCap(
    supabase,
    "saved_p2p_beneficiaries",
    userId,
    "last_used_at"
  );
  return inserted?.id ?? null;
}

async function evictOldestIfOverCap(
  supabase: SupabaseClient,
  table: "saved_accounts" | "saved_p2p_beneficiaries",
  userId: string,
  orderCol: string
) {
  const { data: rows } = await supabase
    .from(table)
    .select("id")
    .eq("user_id", userId)
    .eq("is_default", false)
    .order(orderCol, { ascending: false });

  if (!rows || rows.length <= MAX_SAVED) return;

  const toDelete = rows.slice(MAX_SAVED).map((r) => r.id);
  if (toDelete.length) {
    await supabase.from(table).delete().in("id", toDelete);
    console.log(`🗑️ Evicted ${toDelete.length} old saved rows from ${table}`);
  }
}