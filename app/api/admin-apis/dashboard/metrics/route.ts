import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RangeOption = "total" | "today" | "week" | "month" | "90days" | "180days" | "year" | "custom";

const parseRangeToDates = (range: RangeOption, customFrom?: Date, customTo?: Date) => {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  if (range === "custom" && customFrom && customTo) {
    return { start: customFrom, end: customTo };
  }

  if (range === "total") {
    // For "total" range, return a very old start date (e.g., 5 years ago)
    // This ensures we get all historical data
    start = new Date();
    start.setFullYear(now.getFullYear() - 5); // 5 years ago
    return { start, end };
  }

  switch (range) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "week":
      start.setDate(now.getDate() - 7);
      break;
    case "month":
      start.setMonth(now.getMonth() - 1);
      break;
    case "90days":
      start.setDate(now.getDate() - 90);
      break;
    case "180days":
      start.setDate(now.getDate() - 180);
      break;
    case "year":
      start.setFullYear(now.getFullYear() - 1);
      break;
  }

  return { start, end };
};

export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const url = new URL(req.url);
    const range = url.searchParams.get("range") as RangeOption || "total";
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const customFrom = from ? new Date(from) : undefined;
    const customTo = to ? new Date(to) : undefined;
    const dateRange = parseRangeToDates(range, customFrom, customTo);

    // Fetch total users count (always needed)
    const { count: totalUsers } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true });

    // Fetch user signups for the selected range
    let userSignupsQuery = supabaseAdmin
      .from("users")
      .select("created_at");

    if (range !== "total") {
      userSignupsQuery = userSignupsQuery
        .gte("created_at", dateRange.start.toISOString())
        .lte("created_at", dateRange.end.toISOString());
    }

    const { data: rangeUsers } = await userSignupsQuery;

    // Calculate signups for different periods
    const todaySignups = await getSignupsCountForPeriod("today");
    const weekSignups = await getSignupsCountForPeriod("week");
    const monthSignups = await getSignupsCountForPeriod("month");
    const days90Signups = await getSignupsCountForPeriod("90days");
    const days180Signups = await getSignupsCountForPeriod("180days");
    const yearSignups = await getSignupsCountForPeriod("year");

    // Process daily signups data
    const dailySignups = rangeUsers || [];
    const signupsByDay = processDailyData(dailySignups, "created_at");

    const signupsData = {
      today: todaySignups || 0,
      week: weekSignups || 0,
      month: monthSignups || 0,
      "90days": days90Signups || 0,
      "180days": days180Signups || 0,
      year: yearSignups || 0,
      total: totalUsers || 0,
      daily: signupsByDay,
      weekly: processWeeklyData(signupsByDay),
      monthly: processMonthlyData(signupsByDay),
    };

    // Fetch active users for the selected range
    let activeUsersQuery = supabaseAdmin
      .from("transactions")
      .select("user_id, created_at")
      .eq("status", "success");

    if (range !== "total") {
      activeUsersQuery = activeUsersQuery
        .gte("created_at", dateRange.start.toISOString())
        .lte("created_at", dateRange.end.toISOString());
    }

    const { data: activeUsersData } = await activeUsersQuery;
    
    // Get unique active users for the range
    const uniqueActiveUsers = new Set(activeUsersData?.map(tx => tx.user_id) || []);
    const activeUsersCount = uniqueActiveUsers.size;

    // Get active users counts for all periods
    const todayActiveUsers = await getActiveUsersCountForPeriod("today");
    const weekActiveUsers = await getActiveUsersCountForPeriod("week");
    const monthActiveUsers = await getActiveUsersCountForPeriod("month");
    const days90ActiveUsers = await getActiveUsersCountForPeriod("90days");
    const days180ActiveUsers = await getActiveUsersCountForPeriod("180days");
    const yearActiveUsers = await getActiveUsersCountForPeriod("year");

    // Get total active users (all time)
    const { data: allActiveUsersData } = await supabaseAdmin
      .from("transactions")
      .select("user_id")
      .eq("status", "success");
    const totalActiveUsers = new Set(allActiveUsersData?.map(tx => tx.user_id) || []).size;

    // Process daily active users data
    const dailyActiveUsers = processDailyActiveUsers(activeUsersData || []);

    const activeUsersDataResponse = {
      today: todayActiveUsers,
      week: weekActiveUsers,
      month: monthActiveUsers,
      "90days": days90ActiveUsers,
      "180days": days180ActiveUsers,
      year: yearActiveUsers,
      total: range === "total" ? totalActiveUsers : activeUsersCount,
      daily: dailyActiveUsers,
      weekly: processWeeklyData(dailyActiveUsers.map(d => ({ ...d, count: d.active_users }))),
      monthly: processMonthlyData(dailyActiveUsers.map(d => ({ ...d, count: d.active_users }))),
    };

    // Fetch transaction volume for the selected range
    let transactionVolumeQuery = supabaseAdmin
      .from("transactions")
      .select("amount, created_at, status");

    if (range !== "total") {
      transactionVolumeQuery = transactionVolumeQuery
        .gte("created_at", dateRange.start.toISOString())
        .lte("created_at", dateRange.end.toISOString());
    }

    const { data: rangeTransactions } = await transactionVolumeQuery;

    const successfulTransactions = rangeTransactions?.filter(tx => tx.status === "success") || [];
    const totalVolume = successfulTransactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    
    // Get volume for different periods
    const todayVolume = await getTransactionVolumeForPeriod("today");
    const weekVolume = await getTransactionVolumeForPeriod("week");
    const monthVolume = await getTransactionVolumeForPeriod("month");
    const days90Volume = await getTransactionVolumeForPeriod("90days");
    const days180Volume = await getTransactionVolumeForPeriod("180days");
    const yearVolume = await getTransactionVolumeForPeriod("year");

    // Get all-time total volume
    const { data: allTransactions } = await supabaseAdmin
      .from("transactions")
      .select("amount, status")
      .eq("status", "success");
    const allTimeVolume = allTransactions?.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0) || 0;

    // Process daily transaction data
    const dailyTransactionData = processDailyTransactionData(successfulTransactions);

    const transactionVolumeData = {
      today: todayVolume,
      week: weekVolume,
      month: monthVolume,
      "90days": days90Volume,
      "180days": days180Volume,
      year: yearVolume,
      total: range === "total" ? allTimeVolume : totalVolume,
      daily: dailyTransactionData,
      weekly: processWeeklyVolumeData(dailyTransactionData),
      monthly: processMonthlyVolumeData(dailyTransactionData),
    };

    // *** UPDATED REVENUE CALCULATION FOR INVOICES ***
    // Get revenue breakdown for all periods
    const totalRevenueBreakdown = await getRevenueBreakdownForPeriod("total");
    const todayRevenueBreakdown = await getRevenueBreakdownForPeriod("today");
    const weekRevenueBreakdown = await getRevenueBreakdownForPeriod("week");
    const monthRevenueBreakdown = await getRevenueBreakdownForPeriod("month");
    const days90RevenueBreakdown = await getRevenueBreakdownForPeriod("90days");
    const days180RevenueBreakdown = await getRevenueBreakdownForPeriod("180days");
    const yearRevenueBreakdown = await getRevenueBreakdownForPeriod("year");

    // Get daily revenue data for the range
    const dailyRevenueData = await getDailyRevenueData(dateRange.start, dateRange.end);

    const revenueData = {
      total: totalRevenueBreakdown,
      today: todayRevenueBreakdown,
      week: weekRevenueBreakdown,
      month: monthRevenueBreakdown,
      "90days": days90RevenueBreakdown,
      "180days": days180RevenueBreakdown,
      year: yearRevenueBreakdown,
      daily: dailyRevenueData,
      weekly: processWeeklyRevenueData(dailyRevenueData),
      monthly: processMonthlyRevenueData(dailyRevenueData)
    };

    // Website data (using signups as proxy for now)
    const response = {
      website: {
        ...signupsData,
        total: totalUsers || 0
      },
      signups: signupsData,
      active_users: activeUsersDataResponse,
      transaction_volume: transactionVolumeData,
      revenue_breakdown: revenueData,
      range,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Metrics API error:", error);
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
  }
}

// Helper function to get signups count for a period
async function getSignupsCountForPeriod(period: string): Promise<number> {
  if (period === "total") {
    const { count } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true });
    return count || 0;
  }

  const now = new Date();
  let start = new Date();
  
  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start.setDate(now.getDate() - 7);
      break;
    case "month":
      start.setMonth(now.getMonth() - 1);
      break;
    case "90days":
      start.setDate(now.getDate() - 90);
      break;
    case "180days":
      start.setDate(now.getDate() - 180);
      break;
    case "year":
      start.setFullYear(now.getFullYear() - 1);
      break;
  }

  const { count } = await supabaseAdmin
    .from("users")
    .select("*", { count: "exact", head: true })
    .gte("created_at", start.toISOString())
    .lte("created_at", now.toISOString());

  return count || 0;
}

// Helper function to get active users count for a period
async function getActiveUsersCountForPeriod(period: string): Promise<number> {
  if (period === "total") {
    const { data } = await supabaseAdmin
      .from("transactions")
      .select("user_id")
      .eq("status", "success");
    
    const uniqueUsers = new Set(data?.map(tx => tx.user_id) || []);
    return uniqueUsers.size;
  }

  const now = new Date();
  let start = new Date();
  
  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start.setDate(now.getDate() - 7);
      break;
    case "month":
      start.setMonth(now.getMonth() - 1);
      break;
    case "90days":
      start.setDate(now.getDate() - 90);
      break;
    case "180days":
      start.setDate(now.getDate() - 180);
      break;
    case "year":
      start.setFullYear(now.getFullYear() - 1);
      break;
  }

  const { data } = await supabaseAdmin
    .from("transactions")
    .select("user_id")
    .eq("status", "success")
    .gte("created_at", start.toISOString())
    .lte("created_at", now.toISOString());

  const uniqueUsers = new Set(data?.map(tx => tx.user_id) || []);
  return uniqueUsers.size;
}

// Helper function to get transaction volume for a period
async function getTransactionVolumeForPeriod(period: string): Promise<number> {
  if (period === "total") {
    const { data } = await supabaseAdmin
      .from("transactions")
      .select("amount, status")
      .eq("status", "success");
    
    return data?.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0) || 0;
  }

  const now = new Date();
  let start = new Date();
  
  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start.setDate(now.getDate() - 7);
      break;
    case "month":
      start.setMonth(now.getMonth() - 1);
      break;
    case "90days":
      start.setDate(now.getDate() - 90);
      break;
    case "180days":
      start.setDate(now.getDate() - 180);
      break;
    case "year":
      start.setFullYear(now.getFullYear() - 1);
      break;
  }

  const { data } = await supabaseAdmin
    .from("transactions")
    .select("amount, status")
    .eq("status", "success")
    .gte("created_at", start.toISOString())
    .lte("created_at", now.toISOString());

  return data?.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0) || 0;
}

// UPDATED: Get revenue breakdown for a period - INCLUDES INVOICE CREATION REVENUE
async function getRevenueBreakdownForPeriod(period: string): Promise<any> {
  if (period === "total") {
    // Get all transaction fees (excluding contracts and invoice_creation)
    const { data: allTransactions } = await supabaseAdmin
      .from("transactions")
      .select("fee, amount, status, type, external_response")
      .eq("status", "success");
    
    // Separate contract, invoice_creation, and other transactions
    const contractTransactions = allTransactions?.filter(tx => 
      (tx.type || "").toString().toLowerCase().includes("contract")
    ) || [];
    
    const invoiceCreationTransactions = allTransactions?.filter(tx => 
      (tx.type || "").toString().toLowerCase().includes("invoice_creation")
    ) || [];
    
    const otherTransactions = allTransactions?.filter(tx => 
      !(tx.type || "").toString().toLowerCase().includes("contract") &&
      !(tx.type || "").toString().toLowerCase().includes("invoice_creation")
    ) || [];
    
    // Revenue from regular transaction fees
    const transactionFees = otherTransactions.reduce((sum, tx) => sum + (Number(tx.fee) || 0), 0);
    
    // Revenue from invoice_creation transactions (use amount, not fee)
    const invoiceCreationRevenue = invoiceCreationTransactions.reduce(
      (sum, tx) => sum + (Number(tx.amount) || 0), 0
    );
    
    // Calculate contract fees
    const contractFees = contractTransactions.reduce((sum, tx) => {
      const fee = Number(tx.fee) || 0;
      
      // Check external_response for contract-specific fees
      if (tx.external_response) {
        try {
          const externalResponse = typeof tx.external_response === 'string' 
            ? JSON.parse(tx.external_response)
            : tx.external_response;
          
          if (externalResponse && externalResponse.fee_breakdown) {
            const feeFromJson = Number(externalResponse.fee_breakdown.total) || 0;
            const baseFee = Number(externalResponse.fee_breakdown.base_fee) || 0;
            const lawyerFee = Number(externalResponse.fee_breakdown.lawyer_fee) || 0;
            
            if (feeFromJson > 0) {
              return sum + feeFromJson;
            } else if (baseFee > 0 || lawyerFee > 0) {
              return sum + baseFee + lawyerFee;
            }
          }
        } catch (err) {
          // JSON parsing failed, use regular fee
        }
      }
      
      return sum + fee;
    }, 0);

    // Get all invoice fees from invoices table for 'paid' or 'partially_paid' statuses
    const { data: allInvoices } = await supabaseAdmin
      .from("invoices")
      .select("fee_amount, status")
      .in("status", ["paid", "partially_paid"]);
    
    const invoiceFees = allInvoices?.reduce((sum, inv) => sum + (Number(inv.fee_amount) || 0), 0) || 0;

    // TOTAL INVOICE REVENUE = invoice_creation transactions + invoice fees
    const totalInvoiceRevenue = invoiceCreationRevenue + invoiceFees;

    const total = transactionFees + totalInvoiceRevenue + contractFees;

    return {
      total,
      transfers: transactionFees,
      bill_payment: 0,
      invoice: totalInvoiceRevenue, // Combined invoice revenue
      contract: contractFees,
      platform: 0, // No longer using invoice_payments table
      breakdown: {
        invoice_creation: invoiceCreationRevenue,
        invoice_fees: invoiceFees
      }
    };
  }

  const now = new Date();
  let start = new Date();
  
  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start.setDate(now.getDate() - 7);
      break;
    case "month":
      start.setMonth(now.getMonth() - 1);
      break;
    case "90days":
      start.setDate(now.getDate() - 90);
      break;
    case "180days":
      start.setDate(now.getDate() - 180);
      break;
    case "year":
      start.setFullYear(now.getFullYear() - 1);
      break;
  }

  // Get transactions for the period
  const { data: transactions } = await supabaseAdmin
    .from("transactions")
    .select("fee, amount, status, type, external_response, created_at")
    .eq("status", "success")
    .gte("created_at", start.toISOString())
    .lte("created_at", now.toISOString());

  // Separate contract, invoice_creation, and other transactions
  const contractTransactions = transactions?.filter(tx => 
    (tx.type || "").toString().toLowerCase().includes("contract")
  ) || [];
  
  const invoiceCreationTransactions = transactions?.filter(tx => 
    (tx.type || "").toString().toLowerCase().includes("invoice_creation")
  ) || [];
  
  const otherTransactions = transactions?.filter(tx => 
    !(tx.type || "").toString().toLowerCase().includes("contract") &&
    !(tx.type || "").toString().toLowerCase().includes("invoice_creation")
  ) || [];

  // Revenue from regular transaction fees
  const transactionFees = otherTransactions.reduce((sum, tx) => sum + (Number(tx.fee) || 0), 0);
  
  // Revenue from invoice_creation transactions
  const invoiceCreationRevenue = invoiceCreationTransactions.reduce(
    (sum, tx) => sum + (Number(tx.amount) || 0), 0
  );
  
  // Calculate contract fees
  const contractFees = contractTransactions.reduce((sum, tx) => {
    const fee = Number(tx.fee) || 0;
    
    // Check external_response for contract-specific fees
    if (tx.external_response) {
      try {
        const externalResponse = typeof tx.external_response === 'string' 
          ? JSON.parse(tx.external_response)
          : tx.external_response;
        
        if (externalResponse && externalResponse.fee_breakdown) {
          const feeFromJson = Number(externalResponse.fee_breakdown.total) || 0;
          const baseFee = Number(externalResponse.fee_breakdown.base_fee) || 0;
          const lawyerFee = Number(externalResponse.fee_breakdown.lawyer_fee) || 0;
          
          if (feeFromJson > 0) {
            return sum + feeFromJson;
          } else if (baseFee > 0 || lawyerFee > 0) {
            return sum + baseFee + lawyerFee;
          }
        }
      } catch (err) {
        // JSON parsing failed, use regular fee
      }
    }
    
    return sum + fee;
  }, 0);

  // Get invoice fees for 'paid' or 'partially_paid' invoices
  const { data: invoices } = await supabaseAdmin
    .from("invoices")
    .select("fee_amount, status, created_at")
    .in("status", ["paid", "partially_paid"])
    .gte("created_at", start.toISOString())
    .lte("created_at", now.toISOString());

  const invoiceFees = invoices?.reduce((sum, inv) => sum + (Number(inv.fee_amount) || 0), 0) || 0;

  // TOTAL INVOICE REVENUE = invoice_creation transactions + invoice fees
  const totalInvoiceRevenue = invoiceCreationRevenue + invoiceFees;

  const total = transactionFees + totalInvoiceRevenue + contractFees;

  return {
    total,
    transfers: transactionFees,
    bill_payment: 0,
    invoice: totalInvoiceRevenue, // Combined invoice revenue
    contract: contractFees,
    platform: 0, // No longer using invoice_payments table
    breakdown: {
      invoice_creation: invoiceCreationRevenue,
      invoice_fees: invoiceFees
    }
  };
}

// UPDATED: Get daily revenue data - INCLUDES INVOICE CREATION REVENUE
async function getDailyRevenueData(start: Date, end: Date): Promise<any[]> {
  // Get all transactions
  const { data: transactions } = await supabaseAdmin
    .from("transactions")
    .select("fee, amount, created_at, status, type, external_response")
    .eq("status", "success")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at");

  // Get invoice fees by day
  const { data: invoices } = await supabaseAdmin
    .from("invoices")
    .select("fee_amount, created_at, status")
    .in("status", ["paid", "partially_paid"])
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at");

  return processDailyRevenueData(
    transactions || [],
    invoices || []
  );
}

// UPDATED: Process daily revenue data - INCLUDES INVOICE CREATION REVENUE
function processDailyRevenueData(transactions: any[], invoices: any[]): any[] {
  const dailyMap: { [key: string]: { transfers: number; invoice: number; contract: number; invoice_creation: number; invoice_fees: number; total: number } } = {};
  
  // Process all transactions
  transactions.forEach(tx => {
    const date = new Date(tx.created_at).toISOString().split('T')[0];
    if (!dailyMap[date]) {
      dailyMap[date] = { 
        transfers: 0, 
        invoice: 0, 
        contract: 0, 
        invoice_creation: 0,
        invoice_fees: 0,
        total: 0 
      };
    }
    
    const fee = Number(tx.fee) || 0;
    const amount = Number(tx.amount) || 0;
    const isContract = (tx.type || "").toString().toLowerCase().includes("contract");
    const isInvoiceCreation = (tx.type || "").toString().toLowerCase().includes("invoice_creation");
    
    if (isContract) {
      // This is a contract transaction
      let contractFee = fee;
      
      // Check external_response for contract-specific fees
      if (tx.external_response) {
        try {
          const externalResponse = typeof tx.external_response === 'string' 
            ? JSON.parse(tx.external_response)
            : tx.external_response;
          
          if (externalResponse && externalResponse.fee_breakdown) {
            const feeFromJson = Number(externalResponse.fee_breakdown.total) || 0;
            const baseFee = Number(externalResponse.fee_breakdown.base_fee) || 0;
            const lawyerFee = Number(externalResponse.fee_breakdown.lawyer_fee) || 0;
            
            if (feeFromJson > 0) {
              contractFee = feeFromJson;
            } else if (baseFee > 0 || lawyerFee > 0) {
              contractFee = baseFee + lawyerFee;
            }
          }
        } catch (err) {
          // JSON parsing failed, use regular fee
        }
      }
      
      dailyMap[date].contract += contractFee;
      dailyMap[date].total += contractFee;
    } else if (isInvoiceCreation) {
      // This is an invoice_creation transaction
      dailyMap[date].invoice_creation += amount;
      dailyMap[date].total += amount;
    } else {
      // This is a regular transaction (transfer)
      dailyMap[date].transfers += fee;
      dailyMap[date].total += fee;
    }
  });

  // Process invoice fees from invoices table
  invoices.forEach(inv => {
    const date = new Date(inv.created_at).toISOString().split('T')[0];
    if (!dailyMap[date]) {
      dailyMap[date] = { 
        transfers: 0, 
        invoice: 0, 
        contract: 0, 
        invoice_creation: 0,
        invoice_fees: 0,
        total: 0 
      };
    }
    const fee = Number(inv.fee_amount) || 0;
    dailyMap[date].invoice_fees += fee;
    dailyMap[date].total += fee;
  });

  // Calculate total invoice revenue (invoice_creation + invoice_fees)
  return Object.entries(dailyMap).map(([date, amounts]) => ({
    date,
    total: amounts.total,
    transfers: amounts.transfers,
    invoice: amounts.invoice_creation + amounts.invoice_fees, // Combined invoice revenue
    bill_payment: 0,
    contract: amounts.contract,
    platform: 0, // No longer using invoice_payments table
    breakdown: {
      invoice_creation: amounts.invoice_creation,
      invoice_fees: amounts.invoice_fees
    }
  }));
}

// Data processing functions
function processDailyData(data: any[], dateField: string): any[] {
  const dailyMap: { [key: string]: number } = {};
  
  data.forEach(item => {
    const date = new Date(item[dateField]).toISOString().split('T')[0];
    dailyMap[date] = (dailyMap[date] || 0) + 1;
  });

  return Object.entries(dailyMap).map(([date, count]) => ({
    date,
    count
  }));
}

function processDailyActiveUsers(transactions: any[]): any[] {
  const dailyMap: { [key: string]: Set<string> } = {};
  
  transactions.forEach(tx => {
    const date = new Date(tx.created_at).toISOString().split('T')[0];
    if (!dailyMap[date]) {
      dailyMap[date] = new Set();
    }
    dailyMap[date].add(tx.user_id);
  });

  return Object.entries(dailyMap).map(([date, userSet]) => ({
    date,
    active_users: userSet.size
  }));
}

function processDailyTransactionData(transactions: any[]): any[] {
  const dailyMap: { [key: string]: number } = {};
  
  transactions.forEach(tx => {
    const date = new Date(tx.created_at).toISOString().split('T')[0];
    dailyMap[date] = (dailyMap[date] || 0) + (Number(tx.amount) || 0);
  });

  return Object.entries(dailyMap).map(([date, amount]) => ({
    date,
    amount
  }));
}

function processWeeklyData(dailyData: any[]): any[] {
  const weeklyData: any[] = [];
  let currentWeek: any = null;
  let weekCount = 0;
  let weekStart = "";

  dailyData.forEach((day, index) => {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay();
    
    if (dayOfWeek === 1 || currentWeek === null) {
      if (currentWeek !== null) {
        const weekEnd = new Date(day.date);
        weekEnd.setDate(weekEnd.getDate() - 1);
        weeklyData.push({
          week: `${weekStart} - ${weekEnd.toISOString().split('T')[0]}`,
          count: weekCount
        });
      }
      currentWeek = { date: day.date, count: 0 };
      weekStart = day.date;
      weekCount = day.count;
    } else {
      weekCount += day.count;
    }
  });

  if (currentWeek !== null) {
    const weekEnd = dailyData[dailyData.length - 1]?.date || currentWeek.date;
    weeklyData.push({
      week: `${weekStart} - ${weekEnd}`,
      count: weekCount
    });
  }

  return weeklyData;
}

function processMonthlyData(dailyData: any[]): any[] {
  const monthlyMap: { [key: string]: number } = {};
  
  dailyData.forEach(day => {
    const date = new Date(day.date);
    const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + day.count;
  });

  return Object.entries(monthlyMap).map(([month, count]) => ({
    month,
    count
  }));
}

function processWeeklyVolumeData(dailyData: any[]): any[] {
  return processWeeklyData(dailyData.map(d => ({ ...d, count: d.amount })));
}

function processMonthlyVolumeData(dailyData: any[]): any[] {
  return processMonthlyData(dailyData.map(d => ({ ...d, count: d.amount })));
}

// Process weekly revenue data - UPDATED FOR CONTRACTS
function processWeeklyRevenueData(dailyData: any[]): any[] {
  const weeklyData: any[] = [];
  let currentWeek: any = null;
  let weekTotals: any = { transfers: 0, invoice: 0, contract: 0, total: 0 };
  let weekStart = "";

  dailyData.forEach((day) => {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay();
    
    if (dayOfWeek === 1 || currentWeek === null) {
      if (currentWeek !== null) {
        const weekEnd = new Date(day.date);
        weekEnd.setDate(weekEnd.getDate() - 1);
        weeklyData.push({
          week: `${weekStart} - ${weekEnd.toISOString().split('T')[0]}`,
          ...weekTotals,
          bill_payment: 0,
          platform: 0
        });
      }
      currentWeek = day;
      weekStart = day.date;
      weekTotals = { 
        transfers: day.transfers, 
        invoice: day.invoice, 
        contract: day.contract || 0,
        total: day.total 
      };
    } else {
      weekTotals.transfers += day.transfers;
      weekTotals.invoice += day.invoice;
      weekTotals.contract += day.contract || 0;
      weekTotals.total += day.total;
    }
  });

  if (currentWeek !== null) {
    const weekEnd = dailyData[dailyData.length - 1]?.date || currentWeek.date;
    weeklyData.push({
      week: `${weekStart} - ${weekEnd}`,
      ...weekTotals,
      bill_payment: 0,
      platform: 0
    });
  }

  return weeklyData;
}

// Process monthly revenue data - UPDATED FOR CONTRACTS
function processMonthlyRevenueData(dailyData: any[]): any[] {
  const monthlyMap: { [key: string]: any } = {};
  
  dailyData.forEach(day => {
    const date = new Date(day.date);
    const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { transfers: 0, invoice: 0, contract: 0, total: 0 };
    }
    
    monthlyMap[monthKey].transfers += day.transfers;
    monthlyMap[monthKey].invoice += day.invoice;
    monthlyMap[monthKey].contract += day.contract || 0;
    monthlyMap[monthKey].total += day.total;
  });

  return Object.entries(monthlyMap).map(([month, amounts]) => ({
    month,
    ...amounts,
    bill_payment: 0,
    platform: 0
  }));
}