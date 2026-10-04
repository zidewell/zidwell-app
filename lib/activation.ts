// lib/activation.ts
import { getSupabaseAdmin } from "@/lib/suabase-admin";

export const ACTIVATION_FEE = 1000;         // ₦1,000
export const ACTIVATION_MIN_FUNDING = 2000; // ₦2,000

export interface ActivationResult {
  ok: boolean;
  activated?: boolean;
  reason?: string;
  newBalance?: number;
  feeCharged?: number;
}

/**
 * Fee-only activation.
 * Called AFTER `processVirtualAccountDeposit` has already credited the wallet.
 *
 *   - User already activated?         → no-op
 *   - Wallet balance < ₦2,000?        → no-op
 *   - Otherwise:                      → debit ₦1,000, mark activated
 *
 * Idempotent. Safe to call multiple times for the same deposit.
 */
export async function processActivation(params: {
  userId: string;
  inflowAmount: number;
  inflowReference?: string;
  inflowProviderTxId?: string;
  inflowChannel?: string;
  inflowSender?: Record<string, any>;
}): Promise<ActivationResult> {
  const supabase = getSupabaseAdmin() as any;

  // 1. Load current state — wallet is ALREADY credited by the deposit service
  const { data: user, error } = await supabase
    .from("users")
    .select("id, wallet_balance, activation_paid")
    .eq("id", params.userId)
    .single();

  if (error || !user) {
    return { ok: false, reason: "User not found" };
  }

  // 2. Already activated → no-op
  if (user.activation_paid) {
    return {
      ok: true,
      activated: true,
      reason: "Already activated",
      newBalance: Number(user.wallet_balance),
    };
  }

  // 3. Below minimum → no-op
  const currentBalance = Number(user.wallet_balance || 0);
  if (currentBalance < ACTIVATION_MIN_FUNDING) {
    return {
      ok: true,
      activated: false,
      reason: `Below activation minimum (₦${ACTIVATION_MIN_FUNDING})`,
      newBalance: currentBalance,
    };
  }

  // 4. Debit the fee
  const newBalance = currentBalance - ACTIVATION_FEE;
  const activationRef = `activation_fee_${params.userId}_${Date.now()}`;

  const { error: updateErr } = await supabase
    .from("users")
    .update({
      wallet_balance: newBalance,
      activation_paid: true,
      activated_at: new Date().toISOString(),
      activation_reference: activationRef,
    })
    .eq("id", params.userId);

  if (updateErr) {
    return { ok: false, reason: "Failed to update wallet" };
  }

  // 5. Log the fee (funding was logged by the deposit service)
  try {
    await supabase.from("transactions").insert({
      user_id: params.userId,
      type: "activation_fee",
      amount: ACTIVATION_FEE,
      status: "success",
      reference: activationRef,
      narration: "Account activation fee",
      description: "One-time fee to activate your Zidwell account",
      provider: "nomba",
      category: "fee",
      gross_amount: ACTIVATION_FEE,
      net_amount: ACTIVATION_FEE,
      balance_before: currentBalance,
      balance_after: newBalance,
      metadata: {
        inflow_reference: params.inflowReference || null,
        inflow_amount: params.inflowAmount,
        inflow_channel: params.inflowChannel || "virtual_account",
        inflow_sender: params.inflowSender || null,
        activation_paid_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("[activation] Failed to log fee:", err.message);
  }

  return {
    ok: true,
    activated: true,
    newBalance,
    feeCharged: ACTIVATION_FEE,
  };
}