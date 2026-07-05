// app/types/tier.ts

export type UserTier = 'free' | 'lite' | 'premium' | 'business';

export interface TierInfo {
  id: UserTier;
  name: string;
  price: string;
  priceUsd?: string;
  priceYearly?: string;
  priceUsdYearly?: string;
  tagline: string;
  accountLimit: number;
  badge?: string;
  cta: string;
  note: string;
  features: string[];
  bonuses?: string[];
  audience: string;
  region: 'global' | 'nigeria';
}

export const TIERS: Record<UserTier, TierInfo> = {
  free: {
    id: 'free',
    name: 'Zidwell Free',
    price: '₦0',
    priceUsd: '$0',
    tagline: 'Manual bookkeeping for freelancers, side hustlers and small businesses.',
    accountLimit: 0,
    badge: 'Free Forever',
    cta: 'Start Free',
    note: 'Perfect for businesses that want to track income and expenses manually.',
    audience: 'Entrepreneurs anywhere in the world',
    region: 'global',
    features: [
      'Manual income entry',
      'Manual expense entry',
      'Income & expense categories',
      'Basic bookkeeping records',
      'Income and expense summaries',
      'Simple profit overview',
      'Financial health score',
    ],
  },
  lite: {
    id: 'lite',
    name: 'Zidwell Books',
    price: '₦4,900',
    priceYearly: '₦47,000/year (Save 2 Months)',
    priceUsd: '$4.50',
    priceUsdYearly: '$45/year (Save 2 Months)',
    tagline: 'Manual bookkeeping plus bank statement uploads.',
    accountLimit: 0,
    cta: 'Use Zidwell Books',
    note: 'Perfect for businesses that want bookkeeping without connecting bank accounts.',
    audience: 'Entrepreneurs anywhere in the world',
    region: 'global',
    features: [
      'Everything in Zidwell Free',
      'Upload bank statements (PDF or Excel)',
      'Automatic bookkeeping from uploaded statements',
      'Downloadable reports',
      'Profit & Loss statement',
      'Cashflow statement',
      'Balance sheet',
      'Monthly financial summaries',
      'Financial Insights',
    ],
    bonuses: ['Unlimited Invoices', 'Unlimited Receipts'],
  },
  premium: {
    id: 'premium',
    name: 'Zidwell Sync',
    price: '₦9,900',
    priceUsd: '$9',
    tagline: 'Connect up to 5 Nigerian bank accounts.',
    accountLimit: 5,
    badge: '🇳🇬 Nigerian Banks Only',
    cta: 'Connect My Accounts',
    note: 'Let Zidwell automatically organize your finances as transactions happen.',
    audience: 'Entrepreneurs and business owners in Nigeria',
    region: 'nigeria',
    features: [
      'Everything in Zidwell Books',
      'Connect Nigerian bank accounts',
      'Real-time transaction syncing',
      'Automatic bookkeeping as you spend and earn',
      'Automatic categorization',
      'Combined accounts dashboard',
      'Tax overview',
      'Monthly reports',
      'Downloadable reports',
    ],
    bonuses: ['Unlimited Invoices', 'Unlimited Receipts'],
  },
  business: {
    id: 'business',
    name: 'Zidwell Sync Unlimited',
    price: '₦19,900',
    priceUsd: '$18',
    tagline: 'Unlimited connected bank accounts.',
    accountLimit: Infinity,
    badge: 'Best Value',
    cta: 'Go Unlimited',
    note: 'Built for growing businesses, agencies, cooperatives and companies managing multiple accounts.',
    audience: 'Entrepreneurs and business owners in Nigeria',
    region: 'nigeria',
    features: [
      'Everything in Zidwell Sync Starter',
      'Unlimited bank accounts',
      'Multi-business visibility',
      'Advanced analytics',
      'Tax calculator',
      'Financial statements',
      'Business insights',
      'WRR Tracking (weekly recurring revenue)',
      'MRR Tracking (monthly recurring revenue)',
      'ARR Tracking (annual recurring revenue)',
      'One-click Send payment reminders',
      'Priority support',
    ],
    bonuses: ['Unlimited Invoices', 'Unlimited Receipts'],
  },
};