// lib/subscription-features.ts

export const SUBSCRIPTION_FEATURES = {
  starter: {
    // Core toolkit (all tiers)
    business_bank_account: { value: "true", limit: null },
    business_plan_template: { value: "true", limit: null },
    automatic_bookkeeping: { value: "true", limit: null },
    bookkeeping_access: { value: "Basic", limit: null },
    online_storefront: { value: "true", limit: null },
    document_vault: { value: "false", limit: null },
    basic_financial_overview: { value: "true", limit: null },
    payment_links: { value: "true", limit: null },
    product_images: { value: "true", limit: null },
    product_videos: { value: "false", limit: null },

    // Invoicing / receipts — Starter is free and capped at 5 (matches old `free`)
    invoices_total: { value: "5", limit: 5 },
    receipts_total: { value: "5", limit: 5 },
    contracts_per_month: { value: "5", limit: 5 },

    // Tier-gated (off on Starter)
    whatsapp_notifications: { value: "false", limit: null },
    crm: { value: "false", limit: null },
    custom_email: { value: "false", limit: null },
    tax_support: { value: "Basic", limit: null },
    priority_support: { value: "false", limit: null },

    // Ads (Booster-only downstream)
    managed_ads: { value: "false", limit: null },
    facebook_ads: { value: "false", limit: null },
    instagram_ads: { value: "false", limit: null },
    google_ads: { value: "false", limit: null },
    youtube_ads: { value: "false", limit: null },

    // Business suite (available from Starter)
    virtual_office: { value: "false", limit: null },
    business_plan: { value: "false", limit: null },

    // Payments / ops
    transfer_fee: { value: "50", limit: null },
    support_type: { value: "basic", limit: null },
    team_members: { value: "0", limit: 0 },

    // Add-ons — not available on Starter
    addon_payroll: { value: "false", limit: null },
    addon_hmo: { value: "false", limit: null },
    addon_tax_filing: { value: "false", limit: null },
    addon_virtual_office: { value: "false", limit: null },
  },

  sme: {
    // Core toolkit
    business_bank_account: { value: "true", limit: null },
    business_plan_template: { value: "true", limit: null },
    automatic_bookkeeping: { value: "true", limit: null },
    bookkeeping_access: { value: "Advanced", limit: null },
    online_storefront: { value: "true", limit: null },
    document_vault: { value: "true", limit: null },
    basic_financial_overview: { value: "true", limit: null },
    payment_links: { value: "true", limit: null },
    product_images: { value: "true", limit: null },
    product_videos: { value: "true", limit: null },

    // Invoicing / receipts — unlimited from SME
    invoices_total: { value: "unlimited", limit: null },
    receipts_total: { value: "unlimited", limit: null },
    contracts_per_month: { value: "unlimited", limit: null },

    // Tier-gated — on from SME
    whatsapp_notifications: { value: "true", limit: null },
    crm: { value: "true", limit: null },
    custom_email: { value: "true", limit: null },
    tax_support: { value: "Advanced", limit: null },
    priority_support: { value: "true", limit: null },

    // Ads — still off
    managed_ads: { value: "false", limit: null },
    facebook_ads: { value: "false", limit: null },
    instagram_ads: { value: "false", limit: null },
    google_ads: { value: "false", limit: null },
    youtube_ads: { value: "false", limit: null },

    // Business suite
    virtual_office: { value: "true", limit: null },
    business_plan: { value: "true", limit: null },

    // Payments / ops
    international_payments: { value: "true", limit: null },
    transfer_fee: { value: "50", limit: null },
    support_type: { value: "whatsapp", limit: null },
    team_members: { value: "1", limit: 1 },

    // Add-ons — available on SME
    addon_payroll: { value: "true", limit: null },
    addon_hmo: { value: "true", limit: null },
    addon_tax_filing: { value: "true", limit: null },
    addon_virtual_office: { value: "true", limit: null },
  },

  enterprise: {
    // Core toolkit — everything on
    business_bank_account: { value: "true", limit: null },
    business_plan_template: { value: "true", limit: null },
    automatic_bookkeeping: { value: "true", limit: null },
    bookkeeping_access: { value: "Turbo", limit: null },
    online_storefront: { value: "true", limit: null },
    document_vault: { value: "true", limit: null },
    basic_financial_overview: { value: "true", limit: null },
    payment_links: { value: "true", limit: null },
    product_images: { value: "true", limit: null },
    product_videos: { value: "true", limit: null },

    // Invoicing / receipts
    invoices_total: { value: "unlimited", limit: null },
    receipts_total: { value: "unlimited", limit: null },
    contracts_per_month: { value: "unlimited", limit: null },

    // Tier-gated
    whatsapp_notifications: { value: "true", limit: null },
    crm: { value: "true", limit: null },
    custom_email: { value: "true", limit: null },
    tax_support: { value: "Turbo", limit: null },
    priority_support: { value: "true", limit: null },

    // Ads — off until Booster
    managed_ads: { value: "false", limit: null },
    facebook_ads: { value: "false", limit: null },
    instagram_ads: { value: "false", limit: null },
    google_ads: { value: "false", limit: null },
    youtube_ads: { value: "false", limit: null },

    // Business suite
    virtual_office: { value: "true", limit: null },
    business_plan: { value: "true", limit: null },

    // Payments / ops
    international_payments: { value: "true", limit: null },
    connect_bank_accounts: { value: "true", limit: null },
    increased_transaction_limits: { value: "true", limit: null },
    transfer_fee: { value: "50", limit: null },
    support_type: { value: "priority", limit: null },
    team_members: { value: "3", limit: 3 },
    dedicated_support_team: { value: "true", limit: null },

    // Add-ons
    addon_payroll: { value: "true", limit: null },
    addon_hmo: { value: "true", limit: null },
    addon_tax_filing: { value: "true", limit: null },
    addon_virtual_office: { value: "true", limit: null },
  },

  booster: {
    // ZidStore-only tier. Everything in Enterprise, plus ads.
    business_bank_account: { value: "true", limit: null },
    business_plan_template: { value: "true", limit: null },
    automatic_bookkeeping: { value: "true", limit: null },
    bookkeeping_access: { value: "Turbo", limit: null },
    online_storefront: { value: "true", limit: null },
    document_vault: { value: "true", limit: null },
    basic_financial_overview: { value: "true", limit: null },
    payment_links: { value: "true", limit: null },
    product_images: { value: "true", limit: null },
    product_videos: { value: "true", limit: null },

    invoices_total: { value: "unlimited", limit: null },
    receipts_total: { value: "unlimited", limit: null },
    contracts_per_month: { value: "unlimited", limit: null },

    whatsapp_notifications: { value: "true", limit: null },
    crm: { value: "true", limit: null },
    custom_email: { value: "true", limit: null },
    tax_support: { value: "Turbo", limit: null },
    priority_support: { value: "custom", limit: null },

    // Ads — all on for Booster
    managed_ads: { value: "true", limit: null },
    facebook_ads: { value: "true", limit: null },
    instagram_ads: { value: "true", limit: null },
    google_ads: { value: "true", limit: null },
    youtube_ads: { value: "true", limit: null },

    virtual_office: { value: "true", limit: null },
    business_plan: { value: "true", limit: null },

    international_payments: { value: "true", limit: null },
    connect_bank_accounts: { value: "true", limit: null },
    increased_transaction_limits: { value: "true", limit: null },
    transfer_fee: { value: "0", limit: null },
    support_type: { value: "dedicated_account_manager", limit: null },
    team_members: { value: "unlimited", limit: null },
    dedicated_support_team: { value: "true", limit: null },
    sub_accounts: { value: "true", limit: null },
    roles_permissions: { value: "true", limit: null },
    approvals: { value: "true", limit: null },

    addon_payroll: { value: "true", limit: null },
    addon_hmo: { value: "true", limit: null },
    addon_tax_filing: { value: "true", limit: null },
    addon_virtual_office: { value: "true", limit: null },
  },

  console: {
    // Custom Enterprise-plus tier (kept for existing console users)
    business_bank_account: { value: "true", limit: null },
    business_plan_template: { value: "true", limit: null },
    automatic_bookkeeping: { value: "true", limit: null },
    bookkeeping_access: { value: "Turbo", limit: null },
    invoices_total: { value: "unlimited", limit: null },
    receipts_total: { value: "unlimited", limit: null },
    contracts_per_month: { value: "unlimited", limit: null },
    online_storefront: { value: "true", limit: null },
    document_vault: { value: "true", limit: null },
    basic_financial_overview: { value: "true", limit: null },
    payment_links: { value: "true", limit: null },
    product_images: { value: "true", limit: null },
    product_videos: { value: "true", limit: null },

    whatsapp_notifications: { value: "true", limit: null },
    crm: { value: "true", limit: null },
    custom_email: { value: "true", limit: null },
    tax_support: { value: "Turbo", limit: null },
    priority_support: { value: "custom", limit: null },

    managed_ads: { value: "false", limit: null },
    facebook_ads: { value: "false", limit: null },
    instagram_ads: { value: "false", limit: null },
    google_ads: { value: "false", limit: null },
    youtube_ads: { value: "false", limit: null },

    virtual_office: { value: "true", limit: null },
    business_plan: { value: "true", limit: null },

    international_payments: { value: "true", limit: null },
    connect_bank_accounts: { value: "true", limit: null },
    increased_transaction_limits: { value: "true", limit: null },
    transfer_fee: { value: "0", limit: null },
    support_type: { value: "dedicated_account_manager", limit: null },
    team_members: { value: "unlimited", limit: null },
    dedicated_support_team: { value: "true", limit: null },
    sub_accounts: { value: "true", limit: null },
    roles_permissions: { value: "true", limit: null },
    approvals: { value: "true", limit: null },

    addon_payroll: { value: "true", limit: null },
    addon_hmo: { value: "true", limit: null },
    addon_tax_filing: { value: "true", limit: null },
    addon_virtual_office: { value: "true", limit: null },
  },
};

export type SubscriptionTier = keyof typeof SUBSCRIPTION_FEATURES;

export const TIER_HIERARCHY: SubscriptionTier[] = [
  "starter",
  "sme",
  "enterprise",
  "booster",
  "console",
];

export const TIER_DISPLAY_NAMES: Record<SubscriptionTier, string> = {
  starter: "Starter",
  sme: "SME",
  enterprise: "Enterprise",
  booster: "Booster",
  console: "Console",
};

// Yearly pricing (NGN). Booster is custom-quoted, so we expose a starting-at figure.
export const TIER_PRICING: Record<SubscriptionTier, { yearly: number }> = {
  starter: { yearly: 0 },
  sme: { yearly: 49900 },
  enterprise: { yearly: 99900 },
  booster: { yearly: 2400000 },
  console: { yearly: 0 }, // custom pricing
};

// ─────────────────────────────────────────────────────────────
// Helpers used across the app
// ─────────────────────────────────────────────────────────────

/**
 * Returns true if a user on `currentTier` has access to `featureKey`.
 * Uses tier hierarchy — higher tiers inherit all lower-tier features.
 */
export function canAccessFeature(
  currentTier: SubscriptionTier | null | undefined,
  featureKey: string,
): boolean {
  if (!currentTier) return false;
  const currentIndex = TIER_HIERARCHY.indexOf(currentTier);
  if (currentIndex === -1) return false;

  // Look at every tier at or below the current one
  for (let i = 0; i <= currentIndex; i++) {
    const tier = TIER_HIERARCHY[i];
    const feature = SUBSCRIPTION_FEATURES[tier]?.[
      featureKey as keyof (typeof SUBSCRIPTION_FEATURES)[typeof tier]
    ];
    if (feature) {
      if (feature.value === "true") return true;
      if (feature.value === "false") return false;
      if (feature.limit !== null && feature.limit !== undefined) {
        // numeric / text value → treat as available
        return true;
      }
      if (
        feature.value !== "false" &&
        feature.value !== "true" &&
        feature.value !== ""
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Reads the raw feature value for a tier (e.g. `"Advanced"` for
 * `bookkeeping_access` on SME). Falls back to the highest tier at or below
 * the given tier that defines the feature.
 */
export function getFeatureValue(
  currentTier: SubscriptionTier | null | undefined,
  featureKey: string,
): { value: string; limit: number | null } | null {
  if (!currentTier) return null;
  const currentIndex = TIER_HIERARCHY.indexOf(currentTier);
  if (currentIndex === -1) return null;

  for (let i = currentIndex; i >= 0; i--) {
    const tier = TIER_HIERARCHY[i];
    const feature = SUBSCRIPTION_FEATURES[tier]?.[
      featureKey as keyof (typeof SUBSCRIPTION_FEATURES)[typeof tier]
    ];
    if (feature) return feature;
  }
  return null;
}