import { RangeOption } from "@/types/admin-dashoard";

export const CHART_COLORS = {
  inflow: "#10b981",
  outflow: "#ef4444",
  contracts: "#3b82f6",
  invoices: "#8b5cf6",
  revenue: "#f59e0b",
  contract_revenue: "#8b5cf6",
  invoice_revenue: "#8b5cf6",
  
  // New fee separation colors
  app_fees: "#10b981",      // Green - Platform revenue
  nomba_fees: "#f97316",    // Orange - Provider costs
  
  // Revenue breakdown by source
  transfers: "#3b82f6",      // Blue
  bill_payment: "#10b981",   // Green
  invoice: "#8b5cf6",        // Purple
  contract: "#f59e0b",       // Amber
  
  pie: [
    "#10b981",  // app_fees / inflow
    "#f97316",  // nomba_fees
    "#ef4444",  // outflow
    "#3b82f6",  // transfers / contracts
    "#8b5cf6",  // invoices
    "#f59e0b",  // revenue
    "#84cc16",  // platform
  ],
  
  website: "#3b82f6",
  signups: "#10b981",
  active_users: "#8b5cf6",
  transaction_volume: "#f59e0b",
  
  revenue_breakdown: {
    transfers: "#3b82f6",
    bill_payment: "#10b981",
    invoice: "#8b5cf6",
    contract: "#f59e0b",
    platform: "#84cc16",
    app_fees: "#10b981",
    nomba_fees: "#f97316",
  },
};

export const TRAFFIC_COLORS = {
  users: "#3b82f6",
  pageViews: "#10b981",
  newUsers: "#8b5cf6",
  returning: "#f59e0b",
  sources: ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"],
};

export const ALL_TIME_RANGES: RangeOption[] = [
  "total",
  "today",
  "week",
  "month",
  "90days",
  "180days",
  "year",
];

// Gradient definitions for charts
export const CHART_GRADIENTS = {
  app_fees: {
    start: "#10b981",
    end: "#34d399",
    opacity: { start: 0.8, end: 0.1 }
  },
  nomba_fees: {
    start: "#f97316",
    end: "#fb923c",
    opacity: { start: 0.8, end: 0.1 }
  },
  revenue: {
    start: "#f59e0b",
    end: "#fbbf24",
    opacity: { start: 0.8, end: 0.1 }
  }
};

// Helper function to get color by metric name
export const getMetricColor = (metric: string): string => {
  const colorMap: Record<string, string> = {
    app_fees: CHART_COLORS.app_fees,
    nomba_fees: CHART_COLORS.nomba_fees,
    transfers: CHART_COLORS.transfers,
    invoice: CHART_COLORS.invoice,
    contract: CHART_COLORS.contract,
    bill_payment: CHART_COLORS.bill_payment,
    platform: CHART_COLORS.revenue_breakdown.platform,
    inflow: CHART_COLORS.inflow,
    outflow: CHART_COLORS.outflow,
    signups: CHART_COLORS.signups,
    active_users: CHART_COLORS.active_users,
    website: CHART_COLORS.website,
  };
  
  return colorMap[metric] || CHART_COLORS.revenue;
};

export const getPeriodLabel = (period: RangeOption): string => {
  const labels: Record<RangeOption, string> = {
    total: "All Time",
    today: "Today",
    week: "Last 7 Days",
    month: "Last 30 Days",
    "90days": "Last 90 Days",
    "180days": "Last 180 Days",
    year: "Last 365 Days",
  };
  return labels[period] || period;
};