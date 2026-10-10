# Zidwell Online Store — How It Works

> A simple, self-serve way for Zidwell users to publish a branded storefront and accept payments in minutes.

---

## 1. Concept

A **Zidwell Online Store** is a public storefront owned by a single user. Each
store gets a public URL (`zidwell.com/<slug>`), a wallet to receive funds, and
unlimited payment pages (products, services, donations, links, etc.).

A store is **inactive** until the owner pays a one-time activation fee of
**₦2,000 (~$2 USD)**. Until then the store row exists in the database but is
hidden from the public, and the owner is funneled back to the activation
screen. This guarantees every public storefront on Zidwell has been paid for
and the owner has been BVN-verified.

---

## 2. User Activation Flow

```
┌────────────────────────────────┐
│ 1. User logs into Zidwell      │
└──────────────┬─────────────────┘
               │
┌──────────────▼─────────────────┐
│ 2. Lands on main dashboard     │
└──────────────┬─────────────────┘
               │
┌──────────────▼─────────────────┐
│ 3. Selects "Online Store" on   │
│    sidebar                     │
│                                │
│  • If not BVN-verified:        │
│    opens Verification Modal    │
│    (uses ProtectedLink pattern) │
└──────────────┬─────────────────┘
               │
        ┌──────┴───────────────────┐
        │  Does the user already   │
        │  have a store?           │
        └───┬──────────────────┬───┘
            │ NO               │ YES
            ▼                  ▼
┌─────────────────────┐  ┌──────────────────────────┐
│ 4a. Empty dashboard │  │ 4b. Lands directly on    │
│  shows "Create      │  │     Online Store        │
│  Store" CTA         │  │     Dashboard           │
└──────────┬──────────┘  └──────────────────────────┘
           │
┌──────────▼──────────────────────────┐
│ 4-step Create-Store wizard         │
│                                    │
│  1) Brand Details                  │
│       Store name, slug,            │
│       description, keywords,       │
│       CAC number (optional)        │
│                                    │
│  2) Location Details              │
│       Country, state, city,        │
│       street address,              │
│       precise-location toggle      │
│                                    │
│  3) Review                         │
│       Read-only summary            │
│       of all entered data          │
│                                    │
│  4) Activate & Pay                 │
│       ₦2,000 activation fee        │
│       BVN verification gate        │
│       → triggers Nomba checkout    │
└──────────┬─────────────────────────┘
           │ POST /api/store/activate
           ▼
┌─────────────────────────────────────┐
│ Nomba hosted checkout               │
│   (Card or Bank Transfer)           │
└──────────┬──────────────────────────┘
           │ callback
┌──────────▼──────────────────────────┐
│ Store is now active                │
│ • is_active       = true           │
│ • activation_paid = true           │
│ activated_at is set                │
│ transaction recorded in `transactions` table │
└──────────┬─────────────────────────┘
           │
┌──────────▼──────────────────────────┐
│ User lands on Online Store          │
│ Dashboard. Stats cards on 0/—      │
│ because no payment pages yet.       │
└─────────────────────────────────────┘
```

---

## 3. State Machine

A store has two independent flags on the `online_stores` table:

| `activation_paid` | `is_active` | Meaning                                                  |
| ----------------- | ----------- | -------------------------------------------------------- |
| `false`           | `false`     | Just created — owner still owes the activation fee       |
| `true`            | `true`      | Active storefront, publicly visible, can accept payments |
| `true`            | `false`     | Suspended (admin action only)                            |
| `false`           | `true`      | Impossible — guarded by API + DB trigger                 |

The frontend derives two booleans from these flags:

```ts
hasStore           = store !== null && store.isActive === true
hasPendingActivation = store !== null && store.isActive === false
```

* `!hasStore && !hasPendingActivation` → render the **empty dashboard** with a *Create Store* button.
* `hasPendingActivation` → render the **wizard**, opening at step 4 (skip 1–3 since the row already exists).
* `hasStore` → render the **full dashboard** with stats and payment pages.

---

## 4. BVN Verification Gate

We re-use the existing **`ProtectedLink`** component so the sidebar enforces
BVN verification consistently with other business tools.

```tsx
// app/components/dashboard-component/DashboardSidebar.tsx
const protectedLinks = [
  ...
  "/dashboard/services/payment/dashboard",   // ← added
];

// Renders the Online Store nav item through <ProtectedLink/>
```

Inside the wizard, step 4 also checks `userData.bvnVerification === "verified"`. If the user hasn't been verified, the **Pay & Activate** button is disabled and a banner invites them to verify BVN. Verification unlocks the business wallet that receives store payments.

If a user reaches `/dashboard/services/payment/dashboard` directly without verification, they will already be blocked by the sidebar.

---

## 5. Payment Flow (Activation)

```
┌─────────────────────────────────────────────────────────┐
│ 1. POST /api/store/activate                             │
│    • requires auth + BVN-verified                       │
│    • creates row in online_store_activations (pending)  │
│    • calls Nomba /v1/checkout/order                    │
│    • returns { checkoutLink, orderReference }          │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Browser is redirected to Nomba hosted page         │
│    Customer pays with Card or Transfer                 │
└────────────────────────┬────────────────────────────────┘
                         │ callback
                         ▼
┌─────────────────────────────────────────────────────────┐
│ 3. GET or POST /api/store/activate/callback            │
│    • finds activation by order_reference               │
│    • if status === success:                            │
│        - update online_store_activations → completed   │
│        - update online_stores:                         │
│            is_active = true, activation_paid = true    │
│            activated_at = now()                        │
│        - record debit transaction in `transactions`     │
│        - redirect to /dashboard/store/activation       │
│            ?status=success                             │
│    • if status === failed → mark failed, redirect      │
└─────────────────────────────────────────────────────────┘
```

The callback uses the same Nomba call shape as
`app/api/payment-page/callback/route.ts` so behaviour matches the existing
payment-page checkout.

---

## 6. File Map

```
app/
├── components/
│   └── store/
│       └── create-store.tsx                ← 4-step wizard + activation step
├── context/
│   ├── StoreContext.tsx                    ← re-export shim
│   └── verificationModalContext.tsx        ← existing verification modal
├── hooks/
│   └── useStore.tsx                        ← adds hasPendingActivation
├── api/
│   └── store/
│       ├── route.ts                        ← GET store by owner
│       ├── create/route.ts                 ← POST create store
│       ├── update/route.ts                 ← PUT update store
│       ├── activate/route.ts               ← POST start activation
│       └── activate/callback/route.ts      ← GET/POST Nomba callback
├── dashboard/
│   ├── services/payment/dashboard/page.tsx ← router for empty/active/pending
│   └── store/activation/page.tsx           ← success / failed / processing
└── components/dashboard-component/
    └── DashboardSidebar.tsx                ← Online Store now protected

database/
└── online_store_schema.sql                 ← tables, RLS, helper RPC
```

---

## 7. Best Practices Applied

1. **One store per user** — enforced by a `UNIQUE(owner_id)` constraint and a pre-check in `POST /api/store/create`.
2. **Slug hygiene** — server slugifies and validates `^[a-z0-9-]+$`; uniqueness check before insert.
3. **Activation only via API** — `is_active` and `activation_paid` are filtered out of client-side updates by an RLS `with check` predicate that compares new vs. existing values.
4. **Idempotent activation** — the callback refuses to re-activate an already-completed store.
5. **Server-side auth + service role** — every API route uses `isAuthenticated` and `getSupabaseAdmin()` for trusted writes; client never uses anon keys for sensitive operations.
6. **Verification gate re-use** — `ProtectedLink` and `useVerificationModal` are reused so behaviour matches the rest of the dashboard.
7. **Progressive disclosure** — the wizard uses `motion` + step indicators so the flow feels deliberate, not like a single overwhelming form.
8. **Optimistic local state** — `useStore.createStore` sets the store in context immediately on success, so step 4 shows the just-created store without a refetch round-trip.
9. **Routing fallbacks** — three render branches (no store / pending activation / active store) all funnel through the same `PaymentDashboard` component, keeping the URL stable.
10. **Empty-state dashboard** — when the store is active but has no payment pages yet, the stat cards display `0` / `—` exactly as the spec requires.

---

## 8. Future Work (out of scope but ready for)

* Product catalogue backed by `online_store_products`.
* Orders backed by `online_store_orders` with public checkout pages.
* Recurring subscriptions via Nomba.
* Custom domain mapping (`online_stores.custom_domain`).
* Store suspension admin tooling (flips `is_active = false` while keeping `activation_paid = true`).