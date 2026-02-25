export type RangeOption =
  | "total"
  | "today"
  | "week"
  | "month"
  | "90days"
  | "180days"
  | "year";

export interface FeeBreakdownDetail {
  transactions: number;
  invoice_creation: number;
  invoices: number;
  contracts: number;
  total: number;
}

export interface RevenueBreakdown {
  total: number;
  app_fees: number;      // Platform revenue
  nomba_fees: number;    // Provider costs
  transfers: number;
  bill_payment: number;
  invoice: number;
  contract: number;
  platform: number;
  breakdown?: {
    app_fees: FeeBreakdownDetail;
    nomba_fees: FeeBreakdownDetail;
  };
}

export interface RevenueDailyData {
  date: string;
  total: number;
  app_fees: number;
  nomba_fees: number;
  transfers: number;
  bill_payment: number;
  invoice: number;
  contract: number;
  platform: number;
  breakdown: {
    app_fees: FeeBreakdownDetail;
    nomba_fees: FeeBreakdownDetail;
  };
}

export interface RevenueWeeklyData {
  week: string;
  total: number;
  app_fees: number;
  nomba_fees: number;
  transfers: number;
  bill_payment: number;
  invoice: number;
  contract: number;
  platform: number;
  breakdown: {
    app_fees: FeeBreakdownDetail;
    nomba_fees: FeeBreakdownDetail;
  };
}

export interface RevenueMonthlyData {
  month: string;
  total: number;
  app_fees: number;
  nomba_fees: number;
  transfers: number;
  bill_payment: number;
  invoice: number;
  contract: number;
  platform: number;
  breakdown: {
    app_fees: FeeBreakdownDetail;
    nomba_fees: FeeBreakdownDetail;
  };
}

export interface MetricsData {
  website: {
    total: number;
    today: number;
    week: number;
    month: number;
    "90days": number;
    "180days": number;
    year: number;
    daily: Array<{ date: string; count: number }>;
    weekly: Array<{ week: string; count: number }>;
    monthly: Array<{ month: string; count: number }>;
  };
  signups: {
    total: number;
    today: number;
    week: number;
    month: number;
    "90days": number;
    "180days": number;
    year: number;
    daily: Array<{ date: string; count: number }>;
    weekly: Array<{ week: string; count: number }>;
    monthly: Array<{ month: string; count: number }>;
  };
  active_users: {
    total: number;
    today: number;
    week: number;
    month: number;
    "90days": number;
    "180days": number;
    year: number;
    daily: Array<{ date: string; count: number }>;
    weekly: Array<{ week: string; count: number }>;
    monthly: Array<{ month: string; count: number }>;
  };
  transaction_volume: {
    total: number;
    today: number;
    week: number;
    month: number;
    "90days": number;
    "180days": number;
    year: number;
    daily: Array<{ date: string; amount: number }>;
    weekly: Array<{ week: string; amount: number }>;
    monthly: Array<{ month: string; amount: number }>;
  };
  revenue_breakdown: {
    total: RevenueBreakdown;
    today: RevenueBreakdown;
    week: RevenueBreakdown;
    month: RevenueBreakdown;
    "90days": RevenueBreakdown;
    "180days": RevenueBreakdown;
    year: RevenueBreakdown;
    daily: Array<RevenueDailyData>;
    weekly: Array<RevenueWeeklyData>;
    monthly: Array<RevenueMonthlyData>;
  };
}

export interface WebsiteAnalytics {
  summary: {
    totalUsers: number;
    totalPageViews: number;
    totalSessions: number;
    bounceRate: string;
    avgSessionDuration: string;
    newUsers: number;
    returningUsers: number;
    engagementRate: string;
  };
  daily: Array<{
    date: string;
    users: number;
    pageViews: number;
    newUsers: number;
  }>;
  topPages: Array<{
    path: string;
    title: string;
    views: number;
    users: number;
  }>;
  trafficSources: Array<{
    source: string;
    medium: string;
    sessions: number;
    users: number;
  }>;
  range: string;
}

export interface SummaryData {
  totalInflow: number;
  totalOutflow: number;
  mainWalletBalance: number;
  nombaBalance: number;
  totalAppRevenue: number;
  transactionFees: number;
  platformFees: number;
  
  // Contract metrics
  contractFees: number;
  totalContractAmount: number;
  contractPaymentsCount: number;
  totalContractsIssued: number;
  pendingContracts: number;
  signedContracts: number;
  
  // Invoice metrics
  totalInvoicesIssued: number;
  paidInvoices: number;
  pendingInvoices: number;
  totalInvoiceRevenue: number;
  invoiceCreationRevenue: number;
  invoiceFeesFromTable: number;
  
  // Transaction metrics
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  totalUsers: number;
  
  // Monthly data
  monthlyTransactions: Array<{ month: string; transactions: number }>;
  monthlyInvoices: Array<{ month: string; count: number; revenue: number }>;
  monthlyContracts: Array<{ month: string; count: number }>;
  monthlyAppRevenue: Array<{ month: string; revenue: number }>;
  
  // Recent transactions
  latestTransactions: Array<any>;
  
  // Previous period data for growth calculations
  prevTotalInflow: number;
  prevTotalOutflow: number;
  prevTotalAppRevenue: number;
  prevTotalContracts: number;
  prevPendingContracts: number;
  prevSignedContracts: number;
  prevTotalInvoices: number;
  prevPaidInvoices: number;
  prevUnpaidInvoices: number;
  prevContractFees: number;
}