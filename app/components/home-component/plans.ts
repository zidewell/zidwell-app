// app/components/home-component/plans.ts

export type PlanTier = "starter" | "sme" | "enterprise" | "booster";
export type BillingPeriod = "monthly" | "yearly";

export interface Plan {
  id: PlanTier;
  name: string;
  monthly: number;
  yearly: number;
  yearlyLabel?: string;
  monthlyLabel?: string;
  tagline: string;
  note?: string;
  highlighted?: boolean;
  cta: string;
  mailto?: boolean;
  features?: string[];
}

// ─────────────────────────────────────────────────────────────
// ZIDWELL — main business toolkit. NO booster.
// ─────────────────────────────────────────────────────────────
export const ZIDWELL_PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    monthly: 0,
    yearly: 0,
    tagline: "Perfect for testing the waters.",
    note: "For solo founders and early-stage businesses.",
    cta: "Start free",
    features: [
      "Online storefront",
      "Product images",
      "Payment links",
      "Business Bank Account",
      "Bookkeeping (Basic)",
      "Tax Manager (Basic)",
      "5 invoices / 5 receipts / month",
    ],
  },
  {
    id: "sme",
    name: "SME",
    monthly: 9900,
    yearly: 49900,
    tagline: "For growing businesses.",
    note: "For growing small businesses with a small team.",
    highlighted: true,
    cta: "Subscribe to SME",
    features: [
      "Everything in Starter",
      "Product videos",
      "WhatsApp notifications",
      "CRM",
      "Custom emails",
      "Unlimited invoices + receipts",
      "Advanced bookkeeping + tax",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthly: 19900,
    yearly: 99900,
    tagline: "For bigger businesses who need more tools.",
    note: "For organizations with teams and multiple operators.",
    cta: "Subscribe to Enterprise",
    features: [
      "Everything in SME",
      "Turbo bookkeeping + tax",
      "Increased transaction limits",
      "Connect external bank accounts",
      "3 team members",
      "Priority support",
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// ZIDSTORE — online-store pricing. Includes booster.
// ─────────────────────────────────────────────────────────────
export const ZIDSTORE_PLANS: Plan[] = [
  ...ZIDWELL_PLANS,
  {
    id: "booster",
    name: "Booster",
    monthly: 200000,
    yearly: 2400000,
    monthlyLabel: "From",
    yearlyLabel: "From",
    tagline: "Custom for advertising your business.",
    cta: "Talk to sales",
    mailto: true,
    features: [
      "Everything in Enterprise",
      "Managed advertising",
      "Facebook + Instagram + Google + YouTube Ads",
      "Unlimited team members",
      "Dedicated account manager",
    ],
  },
];

// Feature matrix used only by ZidStore comparison table.
export const FEATURE_ROWS: {
  label: string;
  values: Record<PlanTier, string | boolean>;
}[] = [
  { label: "Online store", values: { starter: true, sme: true, enterprise: true, booster: true } },
  { label: "Product images", values: { starter: true, sme: true, enterprise: true, booster: true } },
  { label: "Payment links", values: { starter: true, sme: true, enterprise: true, booster: true } },
  { label: "Business Bank Account", values: { starter: true, sme: true, enterprise: true, booster: true } },
  { label: "Product videos", values: { starter: false, sme: true, enterprise: true, booster: true } },
  { label: "WhatsApp notifications", values: { starter: false, sme: true, enterprise: true, booster: true } },
  { label: "CRM", values: { starter: false, sme: true, enterprise: true, booster: true } },
  { label: "Customized Email to customers", values: { starter: false, sme: true, enterprise: true, booster: true } },
  {
    label: "Bookkeeping Tool",
    values: { starter: "Basic", sme: "Advanced", enterprise: "Turbo", booster: "Turbo" },
  },
  {
    label: "Tax Manager",
    values: { starter: "Basic", sme: "Advanced", enterprise: "Turbo", booster: "Turbo" },
  },
  { label: "Invoicing Tool", values: { starter: true, sme: true, enterprise: true, booster: true } },
  { label: "Receipt Tool", values: { starter: true, sme: true, enterprise: true, booster: true } },
  { label: "Managed advertising", values: { starter: false, sme: false, enterprise: false, booster: true } },
  { label: "Facebook Ads", values: { starter: false, sme: false, enterprise: false, booster: true } },
  { label: "Instagram Ads", values: { starter: false, sme: false, enterprise: false, booster: true } },
  { label: "Google Ads", values: { starter: false, sme: false, enterprise: false, booster: true } },
  { label: "Youtube Ads", values: { starter: false, sme: false, enterprise: false, booster: true } },
  {
    label: "Priority support",
    values: { starter: false, sme: true, enterprise: true, booster: "Custom" },
  },
];

export const formatNaira = (n: number) => `₦${n.toLocaleString()}`;