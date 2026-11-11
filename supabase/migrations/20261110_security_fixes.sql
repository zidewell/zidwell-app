-- Migration: Security Fixes for Zidwell Fintech App
-- Date: 2026-11-10

-- Enable pgcrypto for PIN verification
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create idempotency_keys table
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL,
  request_path text NOT NULL,
  response_status integer,
  response_body jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  UNIQUE (user_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_user_id ON public.idempotency_keys(user_id);

-- 2. Create processed_webhooks table
CREATE TABLE IF NOT EXISTS public.processed_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  external_id text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb,
  UNIQUE (provider, external_id)
);
CREATE INDEX IF NOT EXISTS idx_processed_webhooks_external_id ON public.processed_webhooks(external_id);

-- 3. Secure RPC: execute_p2p_transfer
-- Atomically verifies PIN, checks balance with lock, and moves funds.
CREATE OR REPLACE FUNCTION public.execute_p2p_transfer(
  p_sender_id uuid,
  p_recipient_id uuid,
  p_amount numeric,
  p_pin text,
  p_idempotency_key text,
  p_narration text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_sender_balance numeric;
  v_recipient_balance numeric;
  v_sender_pin_hash text;
  v_transaction_id uuid;
  v_result jsonb;
BEGIN
  -- Idempotency Check
  SELECT response_body INTO v_result
  FROM idempotency_keys
  WHERE user_id = p_sender_id AND idempotency_key = p_idempotency_key;

  IF FOUND THEN
    RETURN v_result;
  END IF;

  -- Lock sender row
  SELECT wallet_balance, transaction_pin INTO v_sender_balance, v_sender_pin_hash
  FROM users
  WHERE id = p_sender_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sender user not found';
  END IF;

  -- PIN verification (bcrypt)
  IF v_sender_pin_hash IS NULL OR v_sender_pin_hash != crypt(p_pin, v_sender_pin_hash) THEN
    RAISE EXCEPTION 'Invalid transaction PIN';
  END IF;

  -- Lock recipient row
  SELECT wallet_balance INTO v_recipient_balance
  FROM users
  WHERE id = p_recipient_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recipient user not found';
  END IF;

  -- Validation
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  IF p_sender_id = p_recipient_id THEN
    RAISE EXCEPTION 'Cannot transfer to yourself';
  END IF;

  IF v_sender_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Execute transfer
  UPDATE users SET wallet_balance = wallet_balance - p_amount, updated_at = now() WHERE id = p_sender_id;
  UPDATE users SET wallet_balance = wallet_balance + p_amount, updated_at = now() WHERE id = p_recipient_id;

  -- Record transactions
  INSERT INTO transactions (user_id, type, amount, status, description, reference)
  VALUES (p_sender_id, 'p2p_transfer_sent', p_amount, 'success', COALESCE(p_narration, 'P2P Transfer Sent'), 'P2P-' || encode(gen_random_bytes(6), 'hex'))
  RETURNING id INTO v_transaction_id;

  INSERT INTO transactions (user_id, type, amount, status, description, reference)
  VALUES (p_recipient_id, 'p2p_transfer_received', p_amount, 'success', COALESCE(p_narration, 'P2P Transfer Received'), 'P2P-' || encode(gen_random_bytes(6), 'hex'));

  v_result := jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', v_sender_balance - p_amount
  );

  -- Record idempotency
  INSERT INTO idempotency_keys (user_id, idempotency_key, request_path, response_status, response_body)
  VALUES (p_sender_id, p_idempotency_key, '/api/p2p-transfer', 200, v_result);

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 4. Secure RPC: deduct_wallet_balance
-- Consolidates deduction logic with lock, PIN check, and idempotency.
CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(
  p_user_id uuid,
  p_amount numeric,
  p_transaction_type text,
  p_reference text,
  p_description text,
  p_pin text DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_current_balance numeric;
  v_pin_hash text;
  v_transaction_id uuid;
  v_result jsonb;
BEGIN
  -- Idempotency Check
  IF p_idempotency_key IS NOT NULL THEN
    SELECT response_body INTO v_result
    FROM idempotency_keys
    WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;

    IF FOUND THEN
      RETURN v_result;
    END IF;
  END IF;

  -- Lock user row
  SELECT wallet_balance, transaction_pin INTO v_current_balance, v_pin_hash
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- PIN check if provided
  IF p_pin IS NOT NULL THEN
    IF v_pin_hash IS NULL OR v_pin_hash != crypt(p_pin, v_pin_hash) THEN
      RAISE EXCEPTION 'Invalid transaction PIN';
    END IF;
  END IF;

  -- Validation
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct
  UPDATE users SET wallet_balance = wallet_balance - p_amount, updated_at = now() WHERE id = p_user_id;

  -- Transaction record
  INSERT INTO transactions(user_id, type, amount, status, reference, description)
  VALUES(p_user_id, p_transaction_type, p_amount, 'success', p_reference, p_description)
  RETURNING id INTO v_transaction_id;

  v_result := jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', v_current_balance - p_amount
  );

  -- Record idempotency
  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO idempotency_keys (user_id, idempotency_key, request_path, response_status, response_body)
    VALUES (p_user_id, p_idempotency_key, 'deduct_wallet_balance', 200, v_result);
  END IF;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 5. Fix get_user_admin_role (Securely read from DB)
CREATE OR REPLACE FUNCTION public.get_user_admin_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT admin_role INTO v_role FROM users WHERE id = auth.uid();
  RETURN v_role;
END;
$$;

-- 6. Trigger Fixes for Race Conditions and Data Integrity

-- Fix auto_populate_journal_entry to avoid race condition in getting journal_entry_id
CREATE OR REPLACE FUNCTION public.auto_populate_journal_entry()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_category_id VARCHAR(50);
  v_entry_type VARCHAR(10);
  v_amount NUMERIC;
  v_journal_type VARCHAR(10);
  v_user_id UUID;
  v_category_name VARCHAR(100);
  v_category_icon VARCHAR(10);
  v_journal_entry_id UUID;
BEGIN
  IF NEW.status != 'success' OR NEW.synced_to_journal = true THEN
    RETURN NEW;
  END IF;

  v_user_id := NEW.user_id;
  v_amount := ABS(NEW.amount);

  -- Logic for v_entry_type and v_category_name (omitted for brevity, keep existing logic)
  IF NEW.type IN ('deposit', 'virtual_account_deposit', 'card_deposit', 'p2p_received', 'referral', 'referral_reward', 'refund', 'cashback', 'reversal', 'salary') THEN
    v_entry_type := 'income';
    v_category_name := CASE
      WHEN NEW.type IN ('deposit', 'virtual_account_deposit', 'card_deposit') THEN 'Bank Deposit'
      WHEN NEW.type = 'p2p_received' THEN 'P2P Transfer Received'
      WHEN NEW.type IN ('referral', 'referral_reward') THEN 'Referral Bonus'
      WHEN NEW.type IN ('refund', 'reversal') THEN 'Refund'
      WHEN NEW.type = 'cashback' THEN 'Cashback'
      WHEN NEW.type = 'salary' THEN 'Salary'
      ELSE 'Other Income'
    END;
    v_category_icon := CASE
      WHEN v_category_name = 'Bank Deposit' THEN '💰'
      WHEN v_category_name = 'P2P Transfer Received' THEN '📥'
      WHEN v_category_name = 'Referral Bonus' THEN '🎁'
      WHEN v_category_name = 'Refund' THEN '↩️'
      WHEN v_category_name = 'Cashback' THEN '💵'
      WHEN v_category_name = 'Salary' THEN '💼'
      ELSE '💰'
    END;
    v_journal_type := 'personal';
  ELSIF NEW.type IN ('transfer', 'withdrawal', 'debit', 'airtime', 'data', 'electricity', 'cable', 'p2p_transfer', 'bill_payment', 'purchase', 'subscription', 'fee', 'charge') THEN
    v_entry_type := 'expense';
    v_category_name := CASE
      WHEN NEW.type = 'withdrawal' THEN 'Withdrawal'
      WHEN NEW.type IN ('transfer', 'p2p_transfer', 'debit') THEN 'Transfer'
      WHEN NEW.type IN ('airtime', 'data') THEN 'Data & Airtime'
      WHEN NEW.type IN ('electricity', 'cable') THEN 'Utilities'
      WHEN NEW.type = 'bill_payment' THEN 'Bills'
      WHEN NEW.type IN ('purchase', 'subscription') THEN 'Shopping'
      ELSE 'Other Expense'
    END;
    v_category_icon := CASE
      WHEN v_category_name = 'Withdrawal' THEN '🏧'
      WHEN v_category_name = 'Transfer' THEN '💸'
      WHEN v_category_name = 'Data & Airtime' THEN '📱'
      WHEN v_category_name = 'Utilities' THEN '💡'
      WHEN v_category_name = 'Bills' THEN '📄'
      WHEN v_category_name = 'Shopping' THEN '🛍️'
      ELSE '📦'
    END;
    v_journal_type := 'personal';
  ELSE
    RETURN NEW;
  END IF;

  -- Category management logic... (keep existing but use v_user_id)
  SELECT id INTO v_category_id FROM journal_categories WHERE user_id = v_user_id AND name = v_category_name LIMIT 1;
  IF v_category_id IS NULL THEN
    SELECT id INTO v_category_id FROM journal_categories WHERE user_id IS NULL AND name = v_category_name LIMIT 1;
    IF v_category_id IS NOT NULL OR v_category_id IS NULL THEN -- Create user copy or new one
      INSERT INTO journal_categories (id, name, icon, type, user_id, is_custom, created_at)
      VALUES (
        'cat_' || REPLACE(LOWER(v_category_name), ' ', '_') || '_' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8),
        v_category_name, v_category_icon, v_entry_type, v_user_id, true, NOW()
      ) RETURNING id INTO v_category_id;
    END IF;
  END IF;

  -- Create journal entry and capture ID
  INSERT INTO journal_entries (id, date, type, amount, category_id, note, journal_type, user_id, created_at, updated_at)
  VALUES (gen_random_uuid(), NEW.created_at::DATE, v_entry_type, v_amount, v_category_id,
          COALESCE(NEW.narration, NEW.description, NEW.type || ' transaction'), v_journal_type, v_user_id, NOW(), NOW())
  RETURNING id INTO v_journal_entry_id;

  -- Update transaction securely
  UPDATE transactions
  SET synced_to_journal = true, synced_at = NOW(), journal_entry_id = v_journal_entry_id
  WHERE id = NEW.id;

  RETURN NEW;
END;
$function$;

-- Enable RLS and setup basic policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own record" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
