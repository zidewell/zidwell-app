-- =====================================================================
-- Zidwell Online Store — Database Schema
-- =====================================================================
-- Apply in Supabase SQL editor.
-- Compatible with PostgreSQL 15 (Supabase).
--
-- Tables:
--   1. online_stores               — One row per store owned by a user.
--   2. online_store_activations    — Records every activation checkout.
--   3. online_store_products       — Optional product catalogue per store.
--   4. online_store_orders         — Orders placed through the store.
--
-- The store activation flow uses two flags on `online_stores`:
--   * activation_paid  — payment received (true/false)
--   * is_active        — store is publicly visible (true/false)
-- Both are flipped to `true` in the same transaction after a successful
-- Nomba callback, so a store is only ever "active" once payment has
-- been confirmed.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. online_stores
-- ---------------------------------------------------------------------
create table if not exists public.online_stores (
    id                     uuid primary key default gen_random_uuid(),

    -- Ownership
    owner_id               uuid not null references public.users(id) on delete cascade,

    -- Brand
    name                   text not null,
    slug                   text not null unique,
    description            text not null,
    keywords               text[] not null default '{}',
    cac_number             text,                                  -- optional
    logo_url               text,
    cover_url              text,

    -- Location
    country                text not null default 'Nigeria',
    state                  text not null,
    city                   text not null,
    street_address         text not null,
    location_enabled       boolean not null default true,

    -- Activation / lifecycle
    is_active              boolean not null default false,        -- publicly visible
    activation_paid        boolean not null default false,        -- activation fee captured
    activated_at           timestamptz,
    activation_reference   text,                                  -- nomba txn id / ref

    -- Cached aggregates (mirrored from payment_pages / orders)
    wallet_balance         numeric(18, 2) not null default 0,
    total_revenue          numeric(18, 2) not null default 0,
    total_orders           integer not null default 0,
    total_views            integer not null default 0,

    created_at             timestamptz not null default now(),
    updated_at             timestamptz not null default now(),

    -- Constraints
    constraint online_stores_slug_lowercase
        check (slug = lower(slug) and slug ~ '^[a-z0-9-]+$'),
    constraint online_stores_one_per_owner
        unique (owner_id)
);

create index if not exists idx_online_stores_owner
    on public.online_stores (owner_id);

create index if not exists idx_online_stores_active
    on public.online_stores (is_active) where is_active = true;

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_online_stores_updated_at on public.online_stores;
create trigger trg_online_stores_updated_at
    before update on public.online_stores
    for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 2. online_store_activations
-- ---------------------------------------------------------------------
create table if not exists public.online_store_activations (
    id                  uuid primary key default gen_random_uuid(),
    store_id            uuid not null references public.online_stores(id) on delete cascade,
    owner_id            uuid not null references public.users(id) on delete cascade,

    amount              numeric(18, 2) not null default 2000,    -- NGN
    currency            text not null default 'NGN',

    status              text not null default 'pending'          -- pending | completed | failed
                        check (status in ('pending','completed','failed')),
    order_reference     text not null unique,
    transaction_id      text,                                    -- nomba txn id
    checkout_link       text,
    metadata            jsonb not null default '{}'::jsonb,

    created_at          timestamptz not null default now(),
    completed_at        timestamptz
);

create index if not exists idx_store_activations_owner
    on public.online_store_activations (owner_id);

create index if not exists idx_store_activations_store
    on public.online_store_activations (store_id);

create index if not exists idx_store_activations_status
    on public.online_store_activations (status);

-- ---------------------------------------------------------------------
-- 3. online_store_products  (optional catalogue)
-- ---------------------------------------------------------------------
create table if not exists public.online_store_products (
    id              uuid primary key default gen_random_uuid(),
    store_id        uuid not null references public.online_stores(id) on delete cascade,

    title           text not null,
    description     text,
    price           numeric(18, 2) not null,
    currency        text not null default 'NGN',
    image_url       text,
    stock           integer not null default 0,
    is_published    boolean not null default true,

    metadata        jsonb not null default '{}'::jsonb,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index if not exists idx_store_products_store
    on public.online_store_products (store_id);

drop trigger if exists trg_store_products_updated_at on public.online_store_products;
create trigger trg_store_products_updated_at
    before update on public.online_store_products
    for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. online_store_orders
-- ---------------------------------------------------------------------
create table if not exists public.online_store_orders (
    id                  uuid primary key default gen_random_uuid(),
    store_id            uuid not null references public.online_stores(id) on delete cascade,
    product_id          uuid references public.online_store_products(id) on delete set null,

    customer_name       text not null,
    customer_email      text not null,
    customer_phone      text,

    amount              numeric(18, 2) not null,
    fee                 numeric(18, 2) not null default 0,
    net_amount          numeric(18, 2) not null,

    status              text not null default 'pending'
                        check (status in ('pending','paid','fulfilled','cancelled','refunded')),
    payment_reference   text,
    payment_method      text,

    metadata            jsonb not null default '{}'::jsonb,
    created_at          timestamptz not null default now(),
    paid_at             timestamptz
);

create index if not exists idx_store_orders_store
    on public.online_store_orders (store_id);

create index if not exists idx_store_orders_status
    on public.online_store_orders (status);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.online_stores               enable row level security;
alter table public.online_store_activations    enable row level security;
alter table public.online_store_products       enable row level security;
alter table public.online_store_orders         enable row level security;

-- Owners can read their own store
drop policy if exists "owners can read own store" on public.online_stores;
create policy "owners can read own store"
    on public.online_stores
    for select
    using (auth.uid() = owner_id);

-- Public read of active stores (for the public storefront)
drop policy if exists "public can read active stores" on public.online_stores;
create policy "public can read active stores"
    on public.online_stores
    for select
    using (is_active = true);

-- Owners can update their store (NOT activation flags - those go through API)
drop policy if exists "owners can update own store" on public.online_stores;
create policy "owners can update own store"
    on public.online_stores
    for update
    using (auth.uid() = owner_id)
    with check (
        auth.uid() = owner_id
        -- protect activation flags from client-side tampering
        and is_active = (select is_active from public.online_stores where id = online_stores.id)
        and activation_paid = (select activation_paid from public.online_stores where id = online_stores.id)
    );

-- Activations: only the API (service role) should write; users can read their own
drop policy if exists "owners can read own activations" on public.online_store_activations;
create policy "owners can read own activations"
    on public.online_store_activations
    for select
    using (auth.uid() = owner_id);

-- Products: owner manages, public reads when published
drop policy if exists "owners manage products" on public.online_store_products;
create policy "owners manage products"
    on public.online_store_products
    for all
    using (
        exists (
            select 1 from public.online_stores s
            where s.id = online_store_products.store_id and s.owner_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.online_stores s
            where s.id = online_store_products.store_id and s.owner_id = auth.uid()
        )
    );

drop policy if exists "public read published products" on public.online_store_products;
create policy "public read published products"
    on public.online_store_products
    for select
    using (is_published = true);

-- Orders: owners read their orders; service role writes
drop policy if exists "owners read own orders" on public.online_store_orders;
create policy "owners read own orders"
    on public.online_store_orders
    for select
    using (
        exists (
            select 1 from public.online_stores s
            where s.id = online_store_orders.store_id and s.owner_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------
-- Helper RPC: increment wallet balance atomically
-- ---------------------------------------------------------------------
create or replace function public.increment_online_store_balance(
    p_store_id uuid,
    p_amount   numeric
)
returns numeric
language plpgsql
security definer
as $$
declare
    new_balance numeric;
begin
    update public.online_stores
        set wallet_balance = coalesce(wallet_balance, 0) + p_amount,
            total_revenue  = coalesce(total_revenue, 0) + p_amount
        where id = p_store_id
        returning wallet_balance into new_balance;

    return new_balance;
end;
$$;

-- ---------------------------------------------------------------------
-- Helpful view for the dashboard (optional)
-- ---------------------------------------------------------------------
create or replace view public.online_stores_with_stats as
select
    s.*,
    coalesce(p.product_count, 0)  as product_count,
    coalesce(o.order_count, 0)    as paid_order_count
from public.online_stores s
left join (
    select store_id, count(*) as product_count
    from public.online_store_products
    group by store_id
) p on p.store_id = s.id
left join (
    select store_id, count(*) as order_count
    from public.online_store_orders
    where status in ('paid', 'fulfilled')
    group by store_id
) o on o.store_id = s.id;