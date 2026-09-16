import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getNombaToken } from "@/lib/nomba";
import { requireAdmin } from "@/lib/admin-auth";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const dashboardCache = new Map();
const DASHBOARD_CACHE_TTL = 60 * 1000;

let _cachedNomba = { ts: 0, value: 0 };
const NOMBA_CACHE_TTL = 60 * 1000;

async function fetchNombaBalanceCached(
  getTokenFn: () => Promise<string | null>
): Promise<number> {
  try {
    const now = Date.now();
    if (now - _cachedNomba.ts < NOMBA_CACHE_TTL) {
      return _cachedNomba.value;
    }

    const token = await getTokenFn();
    if (!token) {
      console.error('[Nomba] No token available');
      return 0;
    }

    const accountId = process.env.NOMBA_ACCOUNT_ID;
    if (!accountId) {
      console.error('[Nomba] No account ID configured');
      return 0;
    }

    const url = `${process.env.NOMBA_URL ?? 'https://api.nomba.com'}/v1/accounts/balance`;
    
    const options = {
      method: 'GET',
      headers: {
        'accountId': accountId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const res = await fetch(url, options);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Nomba] Error response: ${errorText}`);
      return 0;
    }

    const data = await res.json();
    
    let amount = 0;
    if (data?.data?.amount !== undefined) {
      amount = Number(data.data.amount);
    } else if (data?.amount !== undefined) {
      amount = Number(data.amount);
    } else if (data?.balance !== undefined) {
      amount = Number(data.balance);
    } else if (data?.available_balance !== undefined) {
      amount = Number(data.available_balance);
    } else if (data?.data?.balance !== undefined) {
      amount = Number(data.data.balance);
    }
    
    _cachedNomba = { ts: now, value: amount };
    return amount;
  } catch (err) {
    console.error('[Nomba] Error fetching balance:', err);
    return 0;
  }
}

function parseRangeToDates(range: string | null): { start: string; end: string } | null {
  if (!range || range === "total") return null;
  
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  switch (range) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "week": {
      const day = now.getDay();
      const diffToMonday = (day + 6) % 7;
      start.setDate(now.getDate() - diffToMonday);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case "90days":
      start.setDate(now.getDate() - 90);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "180days":
      start.setDate(now.getDate() - 180);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    default:
      return null;
  }
  
  return { start: start.toISOString(), end: end.toISOString() };
}

function buildMonthLabelsFromRange(rangeDates: { start: string; end: string } | null): string[] {
  const labels: string[] = [];
  
  if (!rangeDates) {
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleString("default", { month: "short", year: "numeric" }));
    }
  } else {
    const start = new Date(rangeDates.start);
    const end = new Date(rangeDates.end);
    const cur = new Date(start.getFullYear(), start.getMonth(), 1);
    
    while (cur <= end) {
      labels.push(cur.toLocaleString("default", { month: "short", year: "numeric" }));
      cur.setMonth(cur.getMonth() + 1);
    }
    
    if (labels.length === 0) {
      const singleMonth = new Date(start.getFullYear(), start.getMonth(), 1);
      labels.push(singleMonth.toLocaleString("default", { month: "short", year: "numeric" }));
    }
  }
  
  return labels;
}

function clearDashboardCache(range?: string): boolean | number {
  if (range) {
    const cacheKey = `dashboard_${range}`;
    const existed = dashboardCache.delete(cacheKey);
    return existed;
  } else {
    const count = dashboardCache.size;
    dashboardCache.clear();
    return count;
  }
}

async function getCachedDashboardData(rangeParam: string): Promise<any> {
  const cacheKey = `dashboard_${rangeParam}`;
  const cached = dashboardCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < DASHBOARD_CACHE_TTL) {
    return { ...cached.data, _fromCache: true };
  }

  const rangeDates = parseRangeToDates(rangeParam);

  // Build base query with all needed fields - single query for transactions
  let txQuery = supabaseAdmin
    .from("transactions")
    .select("id, amount, type, status, created_at, description, fee, total_deduction, external_response, user_id")
    .order("created_at", { ascending: false });

  if (rangeDates) {
    txQuery = txQuery.gte("created_at", rangeDates.start).lte("created_at", rangeDates.end);
  }

  // Fetch all data in parallel where possible
  const [
    { data: transactionsData, error: txError },
    { data: usersBalancesData },
    { count: totalUsersCount },
    { data: contractsDataRaw },
    { data: invoicesDataRaw, count: totalInvoicesCount },
    { data: contractPaymentsRaw, error: contractPaymentsError }
  ] = await Promise.all([
    txQuery,
    supabaseAdmin.from("users").select("wallet_balance"),
    supabaseAdmin.from("users").select("*", { count: "exact", head: true }),
    (async () => {
      let q = supabaseAdmin.from("contracts").select("id, status, created_at, contract_date");
      if (rangeDates) {
        q = q.gte("contract_date", rangeDates.start.split('T')[0]).lte("contract_date", rangeDates.end.split('T')[0]);
      }
      return q;
    })(),
    (async () => {
      let q = supabaseAdmin.from("invoices").select("id, status, created_at, paid_amount, total_amount, subtotal, fee_amount");
      if (rangeDates) {
        q = q.gte("created_at", rangeDates.start).lte("created_at", rangeDates.end);
      }
      return q;
    })(),
    (async () => {
      let q = supabaseAdmin.from("contract_payments").select("amount, fee_amount, status, created_at").eq("status", "completed");
      if (rangeDates) {
        q = q.gte("created_at", rangeDates.start).lte("created_at", rangeDates.end);
      }
      return q;
    })()
  ]);

  const transactions = transactionsData || [];
  const usersBalances = usersBalancesData || [];
  const totalUsers = Number(totalUsersCount ?? 0);
  const contractsData = contractsDataRaw || [];
  const invoicesData = invoicesDataRaw || [];
  const contractPayments = contractPaymentsRaw || [];

  if (txError) throw new Error(`Transactions query failed: ${txError.message}`);

  // Define transaction type arrays
  const INFLOW_TYPES = [
    "deposit", "card_deposit", "bank_transfer", "p2p_received", "invoice_payment",
    "payment_received", "refund", "reversal", "credit", "topup", "funding", "payment"
  ];

  const OUTFLOW_TYPES = [
    "withdrawal", "transfer", "p2p_transfer", "airtime", "data", "electricity",
    "cable", "debit", "invoice_creation", "invoice", "contract", "fee"
  ];

  // Helper to extract fees from external_response (same logic as metrics endpoint)
  function extractTransactionFees(transaction: any): { appFee: number; nombaFee: number } {
    const defaultFees = { appFee: 0, nombaFee: 0 };
    
    if (!transaction.external_response) {
      return defaultFees;
    }

    try {
      const externalResponse = typeof transaction.external_response === 'string'
        ? JSON.parse(transaction.external_response)
        : transaction.external_response;

      if (externalResponse.fee_breakdown) {
        return {
          appFee: Number(externalResponse.fee_breakdown.app_fee) || 0,
          nombaFee: Number(externalResponse.fee_breakdown.nomba_fee) || 0
        };
      }

      if (transaction.type === 'airtime' || transaction.type === 'data') {
        const dataFee = Number(externalResponse.data?.fee) || 0;
        return {
          appFee: Number(transaction.fee) || 0,
          nombaFee: dataFee
        };
      }

      if (transaction.type === 'withdrawal' && externalResponse.fee_breakdown) {
        return {
          appFee: Number(externalResponse.fee_breakdown.app_fee) || 0,
          nombaFee: Number(externalResponse.fee_breakdown.nomba_fee) || 0
        };
      }

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
    } catch (err) {}

    return { appFee: Number(transaction.fee) || 0, nombaFee: 0 };
  }

  const successfulTransactions = transactions.filter(t => t.status === "success");
  const failedTransactions = transactions.filter(t => t.status === "failed");
  const pendingTransactions = transactions.filter(t => t.status === "pending");

  // Single pass through successful transactions for all aggregations
  let totalInflow = 0;
  let totalOutflow = 0;
  let totalFeesFromColumn = 0;
  let totalDeductions = 0;
  let invoiceCreationRevenue = 0;
  
  const monthlyRevenueMap: Record<string, number> = {};
  const monthlyTransactionsMap: Record<string, number> = {};

  successfulTransactions.forEach(t => {
    const amount = Number(t.amount ?? 0);
    const fee = Number(t.fee ?? 0);
    const deduction = Number(t.total_deduction ?? 0);
    const typeLower = (t.type || "").toString().toLowerCase();
    
    const isInflow = INFLOW_TYPES.some(inflowType => typeLower.includes(inflowType.toLowerCase()));
    const isOutflow = OUTFLOW_TYPES.some(outflowType => typeLower.includes(outflowType.toLowerCase()));
    const isInvoiceCreation = typeLower.includes("invoice_creation");
    const isContract = typeLower.includes("contract");

    totalFeesFromColumn += isNaN(fee) ? 0 : fee;
    totalDeductions += isNaN(deduction) ? 0 : deduction;

    if (isInflow) {
      totalInflow += amount;
    } else if (isOutflow) {
      totalOutflow += deduction > 0 ? deduction : amount;
    }

    if (isInvoiceCreation) {
      invoiceCreationRevenue += amount;
    }

    // Monthly aggregations
    const d = new Date(t.created_at);
    if (!isNaN(d.getTime())) {
      const key = d.toLocaleString("default", { month: "short", year: "numeric" });
      const revenue = isNaN(fee) ? 0 : fee + (isNaN(deduction) ? 0 : deduction);
      if (revenue > 0) {
        monthlyRevenueMap[key] = (monthlyRevenueMap[key] ?? 0) + revenue;
      }
      if (amount > 0) {
        monthlyTransactionsMap[key] = (monthlyTransactionsMap[key] ?? 0) + amount;
      }
    }
  });

  // Wallet balance - use SQL aggregation
  const mainWalletBalance = usersBalances.reduce((s, u) => s + Number(u.wallet_balance ?? 0), 0);

  // Contracts
  const totalContractsIssued = contractsData.length;
  const pendingContracts = contractsData.filter(c => (c.status ?? "pending") === "pending").length;
  const signedContracts = contractsData.filter(c => (c.status ?? "").toLowerCase() === "signed").length;

  // Monthly contracts
  const monthLabels = buildMonthLabelsFromRange(rangeDates);
  const monthlyContractsMap: Record<string, number> = {};
  contractsData.forEach(c => {
    const dateField = c.contract_date || c.created_at;
    const d = new Date(dateField);
    if (isNaN(d.getTime())) return;
    const key = d.toLocaleString("default", { month: "short", year: "numeric" });
    monthlyContractsMap[key] = (monthlyContractsMap[key] ?? 0) + 1;
  });
  const monthlyContracts = monthLabels.map(m => ({ month: m, count: monthlyContractsMap[m] ?? 0 }));

  // Invoices
  const totalInvoicesIssued = Number(totalInvoicesCount ?? 0);
  const paidInvoices = invoicesData.filter(inv => inv.status === "paid").length;
  const partiallyPaidInvoices = invoicesData.filter(inv => inv.status === "partially_paid").length;
  const unpaidInvoices = totalInvoicesIssued - paidInvoices - partiallyPaidInvoices;

  const totalInvoiceRevenue = invoicesData.reduce(
    (s, inv) => s + Number(inv.paid_amount ?? inv.total_amount ?? 0), 0
  );

  const paidOrPartiallyPaidInvoices = invoicesData.filter(
    inv => inv.status === "paid" || inv.status === "partially_paid"
  );
  const invoiceFeesFromTable = paidOrPartiallyPaidInvoices.reduce(
    (s, inv) => s + Number(inv.fee_amount ?? 0), 0
  );

  // Detailed revenue breakdown for the range (for OverviewKPIRows)
  let transferAppFees = 0;
  let transferNombaFees = 0;
  let contractAppFees = 0;
  let contractNombaFees = 0;

  successfulTransactions.forEach(t => {
    const typeLower = (t.type || "").toString().toLowerCase();
    const isContract = typeLower.includes("contract");
    const isInvoiceCreation = typeLower.includes("invoice_creation");

    if (isContract) {
      const fees = extractContractFees(t);
      contractAppFees += fees.appFee;
      contractNombaFees += fees.nombaFee;
    } else if (isInvoiceCreation) {
      // Invoice creation fees are pure platform revenue
      transferAppFees += Number(t.amount) || 0;
    } else {
      const fees = extractTransactionFees(t);
      transferAppFees += fees.appFee;
      transferNombaFees += fees.nombaFee;
    }
  });

  // Invoice fees from invoices table
  const platformPercentage = 0.02; // 2%
  const invoiceAppFees = invoiceFeesFromTable * platformPercentage;
  const invoiceNombaFees = invoiceFeesFromTable * (1 - platformPercentage);

  const totalAppFees = transferAppFees + invoiceAppFees + contractAppFees;
  const totalNombaFees = transferNombaFees + invoiceNombaFees + contractNombaFees;
  const totalRevenue = totalAppFees + totalNombaFees;

  // Revenue breakdown by category for the current range
  const revenueBreakdown = {
    total: totalRevenue,
    app_fees: totalAppFees,
    nomba_fees: totalNombaFees,
    transfers: transferAppFees + transferNombaFees,
    bill_payment: 0,
    invoice: invoiceFeesFromTable,
    contract: contractAppFees + contractNombaFees,
    platform: 0,
  };

  // Invoice monthly data
  const monthlyInvoicesMap: Record<string, { count: number; revenue: number }> = {};
  invoicesData.forEach(inv => {
    const d = new Date(inv.created_at);
    if (isNaN(d.getTime())) return;
    const key = d.toLocaleString("default", { month: "short", year: "numeric" });
    monthlyInvoicesMap[key] = monthlyInvoicesMap[key] ?? { count: 0, revenue: 0 };
    monthlyInvoicesMap[key].count += 1;
    monthlyInvoicesMap[key].revenue += Number(inv.paid_amount ?? inv.total_amount ?? 0);
  });
  const monthlyInvoices = monthLabels.map(m => ({
    month: m,
    count: monthlyInvoicesMap[m]?.count ?? 0,
    revenue: monthlyInvoicesMap[m]?.revenue ?? 0,
  }));

  // Contract revenue
  let totalContractRevenue = 0;
  let totalContractAmount = 0;
  let contractPaymentsCount = 0;

  if (contractPaymentsError && contractPaymentsError.code === '42P01') {
    const contractTransactions = successfulTransactions.filter(t => {
      const typeLower = (t.type || "").toString().toLowerCase();
      return typeLower.includes("contract");
    });
    totalContractRevenue = contractTransactions.reduce((s, t) => {
      const fee = Number(t.fee ?? 0);
      const deduction = Number(t.total_deduction ?? 0);
      let contractFee = fee > 0 ? fee : deduction;
      if (t.external_response) {
        try {
          const er = typeof t.external_response === 'string' ? JSON.parse(t.external_response) : t.external_response;
          if (er?.fee_breakdown) {
            const feeFromJson = Number(er.fee_breakdown.total) || 0;
            const baseFee = Number(er.fee_breakdown.base_fee) || 0;
            const lawyerFee = Number(er.fee_breakdown.lawyer_fee) || 0;
            if (feeFromJson > 0) contractFee = feeFromJson;
            else if (baseFee > 0 || lawyerFee > 0) contractFee = baseFee + lawyerFee;
          }
        } catch {}
      }
      return s + contractFee;
    }, 0);
    totalContractAmount = contractTransactions.reduce((s, t) => {
      const amount = Number(t.amount ?? 0);
      if (t.external_response) {
        try {
          const er = typeof t.external_response === 'string' ? JSON.parse(t.external_response) : t.external_response;
          if (er?.total_amount) {
            const jsonAmount = Number(er.total_amount) || 0;
            if (jsonAmount > 0) return s + jsonAmount;
          }
        } catch {}
      }
      return s + amount;
    }, 0);
    contractPaymentsCount = contractTransactions.length;
  } else {
    totalContractRevenue = contractPayments.reduce((s, p) => s + Number(p.fee_amount ?? 0), 0);
    totalContractAmount = contractPayments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
    contractPaymentsCount = contractPayments.length;
  }

  const contractTransactions = successfulTransactions.filter(t => {
    const typeLower = (t.type || "").toString().toLowerCase();
    return typeLower.includes("contract");
  });
  contractTransactions.forEach(t => {
    const isAlreadyCounted = contractPayments.some(p => 
      Math.abs(p.amount - Number(t.amount)) < 0.01
    );
    if (!isAlreadyCounted) {
      const fee = Number(t.fee ?? 0);
      if (fee > 0) {
        totalContractRevenue += fee;
        contractPaymentsCount += 1;
      }
    }
  });

  const combinedAppRevenue = totalFeesFromColumn + totalInvoiceRevenue + totalContractRevenue;

  // Add invoice fees to monthly revenue
  paidOrPartiallyPaidInvoices.forEach(inv => {
    const invoiceFee = Number(inv.fee_amount ?? 0);
    if (invoiceFee > 0) {
      const d = new Date(inv.created_at);
      if (!isNaN(d.getTime())) {
        const key = d.toLocaleString("default", { month: "short", year: "numeric" });
        monthlyRevenueMap[key] = (monthlyRevenueMap[key] ?? 0) + invoiceFee;
      }
    }
  });

  // Add contract fees to monthly revenue
  contractPayments.forEach(p => {
    const contractFee = Number(p.fee_amount ?? 0);
    if (contractFee > 0) {
      const d = new Date(p.created_at);
      if (!isNaN(d.getTime())) {
        const key = d.toLocaleString("default", { month: "short", year: "numeric" });
        monthlyRevenueMap[key] = (monthlyRevenueMap[key] ?? 0) + contractFee;
      }
    }
  });
  contractTransactions.forEach(t => {
    const feeAmount = Number(t.fee ?? 0);
    if (feeAmount > 0) {
      const d = new Date(t.created_at);
      if (!isNaN(d.getTime())) {
        const key = d.toLocaleString("default", { month: "short", year: "numeric" });
        monthlyRevenueMap[key] = (monthlyRevenueMap[key] ?? 0) + feeAmount;
      }
    }
  });

  const monthlyAppRevenue = monthLabels.map(m => ({ month: m, revenue: monthlyRevenueMap[m] ?? 0 }));
  const monthlyTransactions = monthLabels.map(m => ({ month: m, transactions: monthlyTransactionsMap[m] ?? 0 }));

  // Latest transactions
  const latestTransactions = transactions.slice(0, 5).map(t => ({
    id: t.id, type: t.type, amount: Number(t.amount ?? 0),
    fee: Number(t.fee ?? 0), total_deduction: Number(t.total_deduction ?? 0),
    status: t.status, created_at: t.created_at, description: t.description,
  }));

  // Nomba balance
  const nombaBalance = await fetchNombaBalanceCached(async () => {
    try { return await getNombaToken(); } catch { return null; }
  });

  // Previous period for growth
  let prevTotalContracts = 0, prevPendingContracts = 0, prevSignedContracts = 0;
  let prevContractFees = 0, prevTotalInvoices = 0, prevPaidInvoices = 0, prevUnpaidInvoices = 0;
  let prevTotalInflow = 0, prevTotalOutflow = 0, prevTotalAppRevenue = 0;

  if (rangeDates) {
    const prevStart = new Date(rangeDates.start);
    const prevEnd = new Date(rangeDates.end);
    const duration = prevEnd.getTime() - prevStart.getTime();
    prevStart.setTime(prevStart.getTime() - duration);
    prevEnd.setTime(prevEnd.getTime() - duration);

    const [prevContractsData, prevContractTxData, prevInvoicesData] = await Promise.all([
      supabaseAdmin.from("contracts").select("status, contract_date")
        .gte("contract_date", prevStart.toISOString().split('T')[0])
        .lte("contract_date", prevEnd.toISOString().split('T')[0]),
      supabaseAdmin.from("transactions").select("fee, type, status, created_at, external_response")
        .gte("created_at", prevStart.toISOString()).lte("created_at", prevEnd.toISOString()).eq("status", "success"),
      supabaseAdmin.from("invoices").select("status, created_at")
        .gte("created_at", prevStart.toISOString()).lte("created_at", prevEnd.toISOString())
    ]);

    const prevContracts = prevContractsData.data || [];
    prevTotalContracts = prevContracts.length;
    prevPendingContracts = prevContracts.filter(c => (c.status ?? "pending") === "pending").length;
    prevSignedContracts = prevContracts.filter(c => (c.status ?? "").toLowerCase() === "signed").length;

    const prevContractTransactions = (prevContractTxData.data || []).filter(t => {
      const typeLower = (t.type || "").toString().toLowerCase();
      return typeLower.includes("contract");
    });
    prevContractFees = prevContractTransactions.reduce((s, t) => {
      const fee = Number(t.fee ?? 0);
      if (t.external_response) {
        try {
          const er = typeof t.external_response === 'string' ? JSON.parse(t.external_response) : t.external_response;
          if (er?.fee_breakdown) {
            const feeFromJson = Number(er.fee_breakdown.total) || 0;
            const baseFee = Number(er.fee_breakdown.base_fee) || 0;
            const lawyerFee = Number(er.fee_breakdown.lawyer_fee) || 0;
            if (feeFromJson > 0) return s + feeFromJson;
            else if (baseFee > 0 || lawyerFee > 0) return s + baseFee + lawyerFee;
          }
        } catch {}
      }
      return s + fee;
    }, 0);

    const prevInvoices = prevInvoicesData.data || [];
    prevTotalInvoices = prevInvoices.length;
    prevPaidInvoices = prevInvoices.filter(inv => inv.status === "paid").length;
    prevUnpaidInvoices = prevTotalInvoices - prevPaidInvoices;

    // Previous inflow/outflow/app revenue
    const prevTxQuery = supabaseAdmin.from("transactions").select("amount, type, status, fee, total_deduction")
      .gte("created_at", prevStart.toISOString()).lte("created_at", prevEnd.toISOString()).eq("status", "success");
    const { data: prevTransactions } = await prevTxQuery;
    const prevTx = prevTransactions || [];
    
    prevTx.forEach(t => {
      const amount = Number(t.amount ?? 0);
      const fee = Number(t.fee ?? 0);
      const deduction = Number(t.total_deduction ?? 0);
      const typeLower = (t.type || "").toString().toLowerCase();
      const isInflow = INFLOW_TYPES.some(it => typeLower.includes(it.toLowerCase()));
      const isOutflow = OUTFLOW_TYPES.some(ot => typeLower.includes(ot.toLowerCase()));
      
      if (isInflow) prevTotalInflow += amount;
      else if (isOutflow) prevTotalOutflow += deduction > 0 ? deduction : amount;
      prevTotalAppRevenue += isNaN(fee) ? 0 : fee + (isNaN(deduction) ? 0 : deduction);
    });
  }

  const response = {
    totalInflow, totalOutflow, mainWalletBalance, nombaBalance,
    totalTransactions: transactions.length, totalUsers,
    pendingInvoices: unpaidInvoices, paidInvoices, partiallyPaidInvoices,
    totalInvoicesIssued, totalInvoiceRevenue: totalInvoiceRevenue + invoiceFeesFromTable,
    invoiceCreationRevenue, invoiceFeesFromTable,
    pendingContracts, signedContracts, totalContractsIssued,
    latestTransactions, monthlyTransactions, monthlyInvoices, monthlyContracts,
    range: rangeParam,
    totalAppRevenue: combinedAppRevenue,
    transactionFees: totalFeesFromColumn,
    platformFees: 0,
    contractFees: totalContractRevenue,
    totalContractAmount, contractPaymentsCount,
    monthlyAppRevenue,
    transactionStatus: {
      success: successfulTransactions.length,
      failed: failedTransactions.length,
      pending: pendingTransactions.length,
    },
    successfulTransactions: successfulTransactions.length,
    failedTransactions: failedTransactions.length,
    pendingTransactions: pendingTransactions.length,
    prevTotalContracts, prevPendingContracts, prevSignedContracts, prevContractFees,
    prevTotalInvoices, prevPaidInvoices, prevUnpaidInvoices,
    prevTotalInflow, prevTotalOutflow, prevTotalAppRevenue,
    // Detailed revenue breakdown for OverviewKPIRows
    revenueBreakdown,
    _fromCache: false,
  };

  dashboardCache.set(cacheKey, { data: response, timestamp: Date.now() });
  return response;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const adminUser = await requireAdmin(req);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", "operations_admin", "finance_admin", "support_admin", "legal_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const url = new URL(req.url);
    const rangeParam = url.searchParams.get("range") ?? "total";
    const nocache = url.searchParams.get("nocache") === "true";

    if (nocache) clearDashboardCache(rangeParam);

    const response = await getCachedDashboardData(rangeParam);
    const { _fromCache, ...cleanResponse } = response;

    return NextResponse.json({
      ...cleanResponse,
      _cache: { cached: _fromCache, timestamp: Date.now(), range: rangeParam },
    });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}