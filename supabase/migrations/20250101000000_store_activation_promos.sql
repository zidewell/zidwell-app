-- Store Activation Promos Table
-- One-time promo code system for store activation fee discount
-- Following Supabase best practices with proper indexes and constraints

CREATE TABLE public.store_activation_promos (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  user_id uuid NOT NULL,
  promo_code text NOT NULL,
  original_fee numeric(10, 2) NOT NULL,
  discounted_fee numeric(10, 2) NOT NULL,
  status text NOT NULL DEFAULT 'active'::text,
  expires_at timestamptz NOT NULL,
  used_at timestamptz NULL,
  payment_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  constraint store_activation_promos_pkey PRIMARY KEY (id),
  constraint store_activation_promos_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  constraint store_activation_promos_status_check CHECK (
    (
      status = ANY (ARRAY['active'::text, 'used'::text, 'expired'::text])
    )
  )
);

-- Partial unique index: only one active promo per user
CREATE UNIQUE INDEX IF NOT EXISTS store_activation_promos_user_active_key
  ON public.store_activation_promos (user_id)
  WHERE (status = 'active'::text);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_store_activation_promos_user_id
  ON public.store_activation_promos (user_id);

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_store_activation_promos_status
  ON public.store_activation_promos (status);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER store_activation_promos_updated_at
  BEFORE UPDATE ON public.store_activation_promos
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Enable Row Level Security (optional, depends on your RLS policy)
-- ALTER TABLE public.store_activation_promos ENABLE ROW LEVEL SECURITY;