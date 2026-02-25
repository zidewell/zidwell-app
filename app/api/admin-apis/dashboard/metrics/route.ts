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
    start = new Date();
    start.setFullYear(now.getFullYear() - 5);
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

// Helper function to extract fees from transaction external_response
function extractTransactionFees(transaction: any): { appFee: number; nombaFee: number } {
  const defaultFees = { appFee: 0, nombaFee: 0 };
  
  if (!transaction.external_response) {
    return defaultFees;
  }

  try {
    const externalResponse = typeof transaction.external_response === 'string'
      ? JSON.parse(transaction.external_response)
      : transaction.external_response;

    // Check if we have fee_breakdown in external_response
    if (externalResponse.fee_breakdown) {
      return {
        appFee: Number(externalResponse.fee_breakdown.app_fee) || 0,
        nombaFee: Number(externalResponse.fee_breakdown.nomba_fee) || 0
      };
    }

    // For airtime/data transactions, the fee in external_response.data is Nomba fee
    if (transaction.type === 'airtime' || transaction.type === 'data') {
      const dataFee = Number(externalResponse.data?.fee) || 0;
      return {
        appFee: Number(transaction.fee) || 0, // App fee is in the main fee column
        nombaFee: dataFee
      };
    }

    // For withdrawals - extract from fee_breakdown if available
    if (transaction.type === 'withdrawal' && externalResponse.fee_breakdown) {
      return {
        appFee: Number(externalResponse.fee_breakdown.app_fee) || 0,
        nombaFee: Number(externalResponse.fee_breakdown.nomba_fee) || 0
      };
    }

    // For deposits - Nomba fee might be in data.transaction.fee
    if (transaction.type === 'virtual_account_deposit') {
      const nombaFee = Number(externalResponse.data?.transaction?.fee) || 0;
      return {
        appFee: Number(transaction.fee) || 0,
        nombaFee: nombaFee
      };
    }

  } catch (err) {
    console.error('Error parsing external_response:', err);
  }

  return defaultFees;
}

// Helper function to extract contract fees
function extractContractFees(transaction: any): { appFee: number; nombaFee: number } {
  try {
    if (transaction.external_response) {
      const externalResponse = typeof transaction.external_response === 'string'
        ? JSON.parse(transaction.external_response)
        : transaction.external_response;

      if (externalResponse.fee_breakdown) {
        return {
          appFee: Number(externalResponse.fee_breakdown.app_fee) || 
                  Number(externalResponse.fee_breakdown.total) || 0,
          nombaFee: Number(externalResponse.fee_breakdown.nomba_fee) || 0
        };
      }
    }
  } catch (err) {
    // JSON parsing failed
  }

  return { appFee: Number(transaction.fee) || 0, nombaFee: 0 };
}

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

    // Fetch total users count
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

    // Get revenue breakdown for all periods with proper fee separation
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

// UPDATED: Get revenue breakdown with proper fee separation
async function getRevenueBreakdownForPeriod(period: string): Promise<any> {
  if (period === "total") {
    // Get all transactions
    const { data: allTransactions } = await supabaseAdmin
      .from("transactions")
      .select("fee, amount, status, type, external_response")
      .eq("status", "success");
    
    // Initialize fee accumulators
    let totalAppFees = 0;
    let totalNombaFees = 0;
    let transferAppFees = 0;
    let transferNombaFees = 0;
    let contractAppFees = 0;
    let contractNombaFees = 0;
    let invoiceCreationRevenue = 0;
    
    // Process each transaction
    allTransactions?.forEach(tx => {
      const type = (tx.type || "").toString().toLowerCase();
      const isContract = type.includes("contract");
      const isInvoiceCreation = type.includes("invoice_creation");
      
      if (isContract) {
        // Handle contract fees
        const fees = extractContractFees(tx);
        contractAppFees += fees.appFee;
        contractNombaFees += fees.nombaFee;
        totalAppFees += fees.appFee;
        totalNombaFees += fees.nombaFee;
      } else if (isInvoiceCreation) {
        // Invoice creation fees are pure platform revenue
        invoiceCreationRevenue += Number(tx.amount) || 0;
        totalAppFees += Number(tx.amount) || 0;
      } else {
        // Regular transactions - extract both fees
        const fees = extractTransactionFees(tx);
        transferAppFees += fees.appFee;
        transferNombaFees += fees.nombaFee;
        totalAppFees += fees.appFee;
        totalNombaFees += fees.nombaFee;
      }
    });

    // Get invoice fees from invoices table
    const { data: invoices } = await supabaseAdmin
      .from("invoices")
      .select("fee_amount, status")
      .in("status", ["paid", "partially_paid"]);
    
    const invoiceFees = invoices?.reduce((sum, inv) => sum + (Number(inv.fee_amount) || 0), 0) || 0;
    
    // For invoices, we need to split the fee (2% platform + Nomba fee)
    // Assuming the fee_amount in invoices is the total fee charged to customer
    // Platform gets 2%, Nomba gets the rest
    const platformPercentage = 0.02; // 2%
    const invoiceAppFees = invoiceFees * platformPercentage;
    const invoiceNombaFees = invoiceFees * (1 - platformPercentage);

    const totalAppRevenue = totalAppFees + invoiceAppFees;
    const totalNombaExpense = totalNombaFees + invoiceNombaFees;
    const totalRevenue = totalAppRevenue + totalNombaExpense;

    return {
      total: totalRevenue,
      app_fees: totalAppRevenue,
      nomba_fees: totalNombaExpense,
      transfers: transferAppFees + transferNombaFees,
      bill_payment: 0,
      invoice: invoiceFees,
      contract: contractAppFees + contractNombaFees,
      platform: 0,
      breakdown: {
        app_fees: {
          transactions: transferAppFees,
          invoice_creation: invoiceCreationRevenue,
          invoices: invoiceAppFees,
          contracts: contractAppFees,
          total: totalAppRevenue
        },
        nomba_fees: {
          transactions: transferNombaFees,
          invoices: invoiceNombaFees,
          contracts: contractNombaFees,
          total: totalNombaExpense
        }
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

  // Initialize fee accumulators
  let totalAppFees = 0;
  let totalNombaFees = 0;
  let transferAppFees = 0;
  let transferNombaFees = 0;
  let contractAppFees = 0;
  let contractNombaFees = 0;
  let invoiceCreationRevenue = 0;
  
  // Process each transaction
  transactions?.forEach(tx => {
    const type = (tx.type || "").toString().toLowerCase();
    const isContract = type.includes("contract");
    const isInvoiceCreation = type.includes("invoice_creation");
    
    if (isContract) {
      const fees = extractContractFees(tx);
      contractAppFees += fees.appFee;
      contractNombaFees += fees.nombaFee;
      totalAppFees += fees.appFee;
      totalNombaFees += fees.nombaFee;
    } else if (isInvoiceCreation) {
      invoiceCreationRevenue += Number(tx.amount) || 0;
      totalAppFees += Number(tx.amount) || 0;
    } else {
      const fees = extractTransactionFees(tx);
      transferAppFees += fees.appFee;
      transferNombaFees += fees.nombaFee;
      totalAppFees += fees.appFee;
      totalNombaFees += fees.nombaFee;
    }
  });

  // Get invoice fees for the period
  const { data: invoices } = await supabaseAdmin
    .from("invoices")
    .select("fee_amount, status, created_at")
    .in("status", ["paid", "partially_paid"])
    .gte("created_at", start.toISOString())
    .lte("created_at", now.toISOString());

  const invoiceFees = invoices?.reduce((sum, inv) => sum + (Number(inv.fee_amount) || 0), 0) || 0;
  
  // Split invoice fees
  const platformPercentage = 0.02;
  const invoiceAppFees = invoiceFees * platformPercentage;
  const invoiceNombaFees = invoiceFees * (1 - platformPercentage);

  const totalAppRevenue = totalAppFees + invoiceAppFees;
  const totalNombaExpense = totalNombaFees + invoiceNombaFees;
  const totalRevenue = totalAppRevenue + totalNombaExpense;

  return {
    total: totalRevenue,
    app_fees: totalAppRevenue,
    nomba_fees: totalNombaExpense,
    transfers: transferAppFees + transferNombaFees,
    bill_payment: 0,
    invoice: invoiceFees,
    contract: contractAppFees + contractNombaFees,
    platform: 0,
    breakdown: {
      app_fees: {
        transactions: transferAppFees,
        invoice_creation: invoiceCreationRevenue,
        invoices: invoiceAppFees,
        contracts: contractAppFees,
        total: totalAppRevenue
      },
      nomba_fees: {
        transactions: transferNombaFees,
        invoices: invoiceNombaFees,
        contracts: contractNombaFees,
        total: totalNombaExpense
      }
    }
  };
}

// UPDATED: Get daily revenue data with proper fee separation
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

// UPDATED: Process daily revenue data with proper fee separation
function processDailyRevenueData(transactions: any[], invoices: any[]): any[] {
  const dailyMap: { 
    [key: string]: { 
      app_fees: number; 
      nomba_fees: number; 
      transfers: number; 
      invoice: number; 
      contract: number; 
      total: number;
      breakdown: {
        app_fees: { transactions: number; invoice_creation: number; invoices: number; contracts: number };
        nomba_fees: { transactions: number; invoices: number; contracts: number };
      }
    } 
  } = {};
  
  // Process transactions
  transactions.forEach(tx => {
    const date = new Date(tx.created_at).toISOString().split('T')[0];
    if (!dailyMap[date]) {
      dailyMap[date] = { 
        app_fees: 0,
        nomba_fees: 0,
        transfers: 0, 
        invoice: 0, 
        contract: 0,
        total: 0,
        breakdown: {
          app_fees: { transactions: 0, invoice_creation: 0, invoices: 0, contracts: 0 },
          nomba_fees: { transactions: 0, invoices: 0, contracts: 0 }
        }
      };
    }
    
    const type = (tx.type || "").toString().toLowerCase();
    const isContract = type.includes("contract");
    const isInvoiceCreation = type.includes("invoice_creation");
    
    if (isContract) {
      const fees = extractContractFees(tx);
      dailyMap[date].app_fees += fees.appFee;
      dailyMap[date].nomba_fees += fees.nombaFee;
      dailyMap[date].contract += fees.appFee + fees.nombaFee;
      dailyMap[date].total += fees.appFee + fees.nombaFee;
      dailyMap[date].breakdown.app_fees.contracts += fees.appFee;
      dailyMap[date].breakdown.nomba_fees.contracts += fees.nombaFee;
    } else if (isInvoiceCreation) {
      const amount = Number(tx.amount) || 0;
      dailyMap[date].app_fees += amount;
      dailyMap[date].total += amount;
      dailyMap[date].breakdown.app_fees.invoice_creation += amount;
    } else {
      const fees = extractTransactionFees(tx);
      dailyMap[date].app_fees += fees.appFee;
      dailyMap[date].nomba_fees += fees.nombaFee;
      dailyMap[date].transfers += fees.appFee + fees.nombaFee;
      dailyMap[date].total += fees.appFee + fees.nombaFee;
      dailyMap[date].breakdown.app_fees.transactions += fees.appFee;
      dailyMap[date].breakdown.nomba_fees.transactions += fees.nombaFee;
    }
  });

  // Process invoice fees
  invoices.forEach(inv => {
    const date = new Date(inv.created_at).toISOString().split('T')[0];
    if (!dailyMap[date]) {
      dailyMap[date] = { 
        app_fees: 0,
        nomba_fees: 0,
        transfers: 0, 
        invoice: 0, 
        contract: 0,
        total: 0,
        breakdown: {
          app_fees: { transactions: 0, invoice_creation: 0, invoices: 0, contracts: 0 },
          nomba_fees: { transactions: 0, invoices: 0, contracts: 0 }
        }
      };
    }
    
    const fee = Number(inv.fee_amount) || 0;
    const platformPercentage = 0.02;
    const appFee = fee * platformPercentage;
    const nombaFee = fee * (1 - platformPercentage);
    
    dailyMap[date].app_fees += appFee;
    dailyMap[date].nomba_fees += nombaFee;
    dailyMap[date].invoice += fee;
    dailyMap[date].total += fee;
    dailyMap[date].breakdown.app_fees.invoices += appFee;
    dailyMap[date].breakdown.nomba_fees.invoices += nombaFee;
  });

  return Object.entries(dailyMap).map(([date, amounts]) => ({
    date,
    total: amounts.total,
    app_fees: amounts.app_fees,
    nomba_fees: amounts.nomba_fees,
    transfers: amounts.transfers,
    invoice: amounts.invoice,
    bill_payment: 0,
    contract: amounts.contract,
    platform: 0,
    breakdown: amounts.breakdown
  })).sort((a, b) => a.date.localeCompare(b.date));
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

// Process weekly revenue data with fee separation
function processWeeklyRevenueData(dailyData: any[]): any[] {
  const weeklyData: any[] = [];
  let currentWeek: any = null;
  let weekTotals: any = { 
    app_fees: 0, 
    nomba_fees: 0,
    transfers: 0, 
    invoice: 0, 
    contract: 0, 
    total: 0,
    breakdown: {
      app_fees: { transactions: 0, invoice_creation: 0, invoices: 0, contracts: 0 },
      nomba_fees: { transactions: 0, invoices: 0, contracts: 0 }
    }
  };
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
        app_fees: day.app_fees,
        nomba_fees: day.nomba_fees,
        transfers: day.transfers, 
        invoice: day.invoice, 
        contract: day.contract || 0,
        total: day.total,
        breakdown: JSON.parse(JSON.stringify(day.breakdown))
      };
    } else {
      weekTotals.app_fees += day.app_fees;
      weekTotals.nomba_fees += day.nomba_fees;
      weekTotals.transfers += day.transfers;
      weekTotals.invoice += day.invoice;
      weekTotals.contract += day.contract || 0;
      weekTotals.total += day.total;
      
      // Accumulate breakdown
      weekTotals.breakdown.app_fees.transactions += day.breakdown.app_fees.transactions;
      weekTotals.breakdown.app_fees.invoice_creation += day.breakdown.app_fees.invoice_creation;
      weekTotals.breakdown.app_fees.invoices += day.breakdown.app_fees.invoices;
      weekTotals.breakdown.app_fees.contracts += day.breakdown.app_fees.contracts;
      weekTotals.breakdown.nomba_fees.transactions += day.breakdown.nomba_fees.transactions;
      weekTotals.breakdown.nomba_fees.invoices += day.breakdown.nomba_fees.invoices;
      weekTotals.breakdown.nomba_fees.contracts += day.breakdown.nomba_fees.contracts;
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

// Process monthly revenue data with fee separation
function processMonthlyRevenueData(dailyData: any[]): any[] {
  const monthlyMap: { [key: string]: any } = {};
  
  dailyData.forEach(day => {
    const date = new Date(day.date);
    const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { 
        app_fees: 0,
        nomba_fees: 0,
        transfers: 0, 
        invoice: 0, 
        contract: 0, 
        total: 0,
        breakdown: {
          app_fees: { transactions: 0, invoice_creation: 0, invoices: 0, contracts: 0 },
          nomba_fees: { transactions: 0, invoices: 0, contracts: 0 }
        }
      };
    }
    
    monthlyMap[monthKey].app_fees += day.app_fees;
    monthlyMap[monthKey].nomba_fees += day.nomba_fees;
    monthlyMap[monthKey].transfers += day.transfers;
    monthlyMap[monthKey].invoice += day.invoice;
    monthlyMap[monthKey].contract += day.contract || 0;
    monthlyMap[monthKey].total += day.total;
    
    // Accumulate breakdown
    monthlyMap[monthKey].breakdown.app_fees.transactions += day.breakdown.app_fees.transactions;
    monthlyMap[monthKey].breakdown.app_fees.invoice_creation += day.breakdown.app_fees.invoice_creation;
    monthlyMap[monthKey].breakdown.app_fees.invoices += day.breakdown.app_fees.invoices;
    monthlyMap[monthKey].breakdown.app_fees.contracts += day.breakdown.app_fees.contracts;
    monthlyMap[monthKey].breakdown.nomba_fees.transactions += day.breakdown.nomba_fees.transactions;
    monthlyMap[monthKey].breakdown.nomba_fees.invoices += day.breakdown.nomba_fees.invoices;
    monthlyMap[monthKey].breakdown.nomba_fees.contracts += day.breakdown.nomba_fees.contracts;
  });

  return Object.entries(monthlyMap).map(([month, amounts]) => ({
    month,
    ...amounts,
    bill_payment: 0,
    platform: 0
  }));
}