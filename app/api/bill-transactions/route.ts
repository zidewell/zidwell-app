// app/api/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";
import bank78Client from "@/lib/bank78/client";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);
  
  if (!user) {
    const response = NextResponse.json({ error: "Please login to access transactions", logout: true }, { status: 401 });
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const search = searchParams.get("search") || "";
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;
    const provider = searchParams.get("provider") || "all"; // all, bank78, nomba

    if (!userId || userId !== user.id) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Get user data to check if they have Bank78
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("bank78_verified, bank78_personal_account_id, bank78_business_account_id")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user data:", userError);
    }

    let allTransactions: any[] = [];
    let totalCount = 0;

    // 1. Get Bank78 transactions if user has Bank78 and provider is 'all' or 'bank78'
    if (userData?.bank78_verified && (provider === 'all' || provider === 'bank78')) {
      const bank78Transactions = await getBank78Transactions(userData, search, from, to);
      allTransactions = [...allTransactions, ...bank78Transactions];
    }

    // 2. Get Nomba transactions from database if provider is 'all' or 'nomba'
    if (provider === 'all' || provider === 'nomba') {
      const { data: nombaTransactions, count: nombaCount } = await getNombaTransactions(
        userId, 
        search, 
        from, 
        to, 
        offset, 
        limit
      );
      
      if (nombaTransactions) {
        // Add provider label to nomba transactions
        const labeledNomba = nombaTransactions.map(tx => ({
          ...tx,
          provider: 'nomba'
        }));
        
        // If provider is 'nomba' only, return just nomba transactions
        if (provider === 'nomba') {
          const responseData = {
            transactions: labeledNomba || [],
            total: nombaCount || 0,
            page,
            limit,
            hasMore: (nombaCount || 0) > offset + limit,
            provider: 'nomba'
          };
          if (newTokens) return createAuthResponse(responseData, newTokens);
          return NextResponse.json(responseData);
        }
        
        allTransactions = [...allTransactions, ...labeledNomba];
        totalCount = nombaCount || 0;
      }
    }

    // 3. Sort all transactions by created_at (descending)
    allTransactions.sort((a, b) => {
      const dateA = new Date(a.created_at || a.date || a.createdAt);
      const dateB = new Date(b.created_at || b.date || b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    // 4. Apply pagination to merged results
    const paginatedTransactions = allTransactions.slice(offset, offset + limit);
    const hasMore = allTransactions.length > offset + limit;

    const responseData = {
      transactions: paginatedTransactions,
      total: allTransactions.length,
      page,
      limit,
      hasMore,
      provider: 'all',
      breakdown: {
        bank78: allTransactions.filter(t => t.provider === 'bank78').length,
        nomba: allTransactions.filter(t => t.provider === 'nomba').length
      }
    };

    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("❌ API Error:", error.message);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

async function getNombaTransactions(
  userId: string,
  search: string,
  from: string | null,
  to: string | null,
  offset: number,
  limit: number
) {
  try {
    let query = supabase
      .from("transactions")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .eq("provider", "nomba")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      query = query.gte("created_at", fromDate.toISOString()).lte("created_at", toDate.toISOString());
    }

    if (search) {
      query = query.or(`description.ilike.%${search}%,type.ilike.%${search}%,reference.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  } catch (error) {
    console.error("Error fetching Nomba transactions:", error);
    return { data: [], count: 0 };
  }
}

async function getBank78Transactions(
  userData: any,
  search: string,
  from: string | null,
  to: string | null
) {
  const transactions: any[] = [];
  
  try {
    // Get personal account transactions
    if (userData.bank78_personal_account_id) {
      const personalTxs = await fetchBank78AccountTransactions(
        userData.bank78_personal_account_id,
        'personal',
        search,
        from,
        to
      );
      transactions.push(...personalTxs);
    }

    // Get business account transactions
    if (userData.bank78_business_account_id) {
      const businessTxs = await fetchBank78AccountTransactions(
        userData.bank78_business_account_id,
        'business',
        search,
        from,
        to
      );
      transactions.push(...businessTxs);
    }

    return transactions;
  } catch (error) {
    console.error("Error fetching Bank78 transactions:", error);
    return [];
  }
}

async function fetchBank78AccountTransactions(
  accountId: string,
  accountType: string,
  search: string,
  from: string | null,
  to: string | null
): Promise<any[]> {
  try {
    const params: any = { limit: 100 };
    
    if (from) {
      params.from = from;
    }
    if (to) {
      params.to = to;
    }

    const response = await bank78Client.getTransactions(accountId, params);
    const accountTransactions = response.data?.transactions || response.transactions || [];

    // Filter by search term if provided
    let filtered = accountTransactions;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = accountTransactions.filter((tx: any) => {
        const narration = (tx.narration || tx.description || '').toLowerCase();
        const reference = (tx.reference || tx.transactionId || '').toLowerCase();
        return narration.includes(searchLower) || reference.includes(searchLower);
      });
    }

    // Format Bank78 transactions to match database schema
    return filtered.map((tx: any) => ({
      id: tx.id || tx.transactionId,
      user_id: null, // Will be populated from user
      type: tx.type || (tx.amount < 0 ? 'debit' : 'credit'),
      amount: Math.abs(tx.amount || tx.transactionAmount || 0),
      status: tx.status || 'completed',
      reference: tx.reference || tx.transactionId,
      description: tx.narration || tx.description || 'Bank78 Transaction',
      created_at: tx.createdAt || tx.date || tx.created_at || new Date().toISOString(),
      provider: 'bank78',
      provider_transaction_id: tx.id || tx.transactionId,
      provider_account_id: accountId,
      channel: 'bank78',
      fee: tx.fee || 0,
      bank78_fee: tx.fee || 0,
      gross_amount: Math.abs(tx.amount || tx.transactionAmount || 0),
      net_amount: Math.abs(tx.amount || tx.transactionAmount || 0) - (tx.fee || 0),
      external_response: tx,
      sender: tx.sender || null,
      receiver: tx.receiver || null,
      narration: tx.narration || null,
      balance_before: tx.balanceBefore || null,
      balance_after: tx.balanceAfter || null,
      category: accountType === 'personal' ? 'personal_account' : 'business_account',
      category_id: accountId,
      // Keep original data for reference
      _bank78_data: tx
    }));
  } catch (error) {
    console.error(`Error fetching Bank78 transactions for account ${accountId}:`, error);
    return [];
  }
}