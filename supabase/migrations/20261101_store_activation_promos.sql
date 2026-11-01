-- Migration: Store Activation Promo System
-- Scope: Online Store activation only (zidstore / payment-page)
-- Date: 2026-11-01

CREATE TABLE IF NOT EXISTS store_activation_promos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  promo_code text NOT NULL,
  original_fee numeric(10,2) NOT NULL DEFAULT 5000.00,
  discounted_fee numeric(10,2) NOT NULL DEFAULT 1000.00,
  status text NOT NULL CHECK (status IN ('active', 'used', 'expired')),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  payment_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enforce one active promo per user at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_promo_per_user
  ON store_activation_promos (user_id)
  WHERE status = 'active';

-- Fast lookup by user for promo history checks
CREATE INDEX IF NOT EXISTS idx_store_activation_promos_user_id
  ON store_activation_promos (user_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE TRIGGER set_store_activation_promos_updated_at
  BEFORE UPDATE ON store_activation_promos
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

</content>
