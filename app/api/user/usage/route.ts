import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api"; 

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Define tier types
type Tier = 'free' | 'solopreneur' | 'sme' | 'enterprise' | 'corporation';

// Plan limits configuration
const PLAN_LIMITS: Record<Tier, { invoices: number | string; receipts: number | string; contracts: number | string; teamMembers: number | string; bankAccounts: number | string }> = {
  free: {
    invoices: 5,
    receipts: 5,
    contracts: 0,
    teamMembers: 0,
    bankAccounts: 0,
  },
  solopreneur: {
    invoices: 10,
    receipts: 'unlimited',
    contracts: 0,
    teamMembers: 0,
    bankAccounts: 0,
  },
  sme: {
    invoices: 'unlimited',
    receipts: 'unlimited',
    contracts: 0,
    teamMembers: 1,
    bankAccounts: 3,
  },
  enterprise: {
    invoices: 'unlimited',
    receipts: 'unlimited',
    contracts: 10,
    teamMembers: 'unlimited',
    bankAccounts: 5,
  },
  corporation: {
    invoices: 'unlimited',
    receipts: 'unlimited',
    contracts: 'unlimited',
    teamMembers: 'unlimited',
    bankAccounts: 'unlimited',
  },
};

export async function GET(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);
  
  if (!user) {
    console.log("🔴 Unauthorized - No valid user");
    const response = NextResponse.json(
      { error: "Unauthorized", logout: true },
      { status: 401 }
    );
    
    if (newTokens) {
      return createAuthResponse(await response.json(), newTokens);
    }
    return response;
  }

  try {
    // Get user's usage counts
    const { data: userData, error } = await supabase
      .from("users")
      .select(`
        invoices_used_lifetime,
        receipts_used_lifetime,
        contracts_used_lifetime,
        invoice_lifetime_limit,
        receipt_lifetime_limit,
        contract_lifetime_limit,
        subscription_tier,
        subscription_expires_at
      `)
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching user data:", error);
      const response = NextResponse.json(
        { error: "Failed to fetch usage data" },
        { status: 500 }
      );
      
      if (newTokens) {
        return createAuthResponse(await response.json(), newTokens);
      }
      return response;
    }

    const tier = (userData.subscription_tier || 'free') as Tier;
    const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.free;

    // Calculate invoice usage
    let invoiceData;
    if (limits.invoices === 'unlimited') {
      invoiceData = {
        used: userData.invoices_used_lifetime || 0,
        limit: 'unlimited',
        remaining: 'unlimited',
        type: 'unlimited',
        requiresUpgrade: false,
        canCreate: true
      };
    } else {
      const used = userData.invoices_used_lifetime || 0;
      const limit = limits.invoices as number;
      invoiceData = {
        used,
        limit,
        remaining: Math.max(0, limit - used),
        type: 'lifetime',
        requiresUpgrade: used >= limit,
        canCreate: used < limit
      };
    }

    // Calculate receipt usage
    let receiptData;
    if (limits.receipts === 'unlimited') {
      receiptData = {
        used: userData.receipts_used_lifetime || 0,
        limit: 'unlimited',
        remaining: 'unlimited',
        type: 'unlimited',
        requiresUpgrade: false,
        canCreate: true
      };
    } else {
      const used = userData.receipts_used_lifetime || 0;
      const limit = limits.receipts as number;
      receiptData = {
        used,
        limit,
        remaining: Math.max(0, limit - used),
        type: 'lifetime',
        requiresUpgrade: used >= limit,
        canCreate: used < limit
      };
    }

    // Calculate contract usage
    let contractData;
    if (limits.contracts === 'unlimited') {
      contractData = {
        used: userData.contracts_used_lifetime || 0,
        limit: 'unlimited',
        remaining: 'unlimited',
        type: 'unlimited',
        requiresUpgrade: false,
        canCreate: true
      };
    } else {
      const used = userData.contracts_used_lifetime || 0;
      const limit = limits.contracts as number;
      contractData = {
        used,
        limit,
        remaining: Math.max(0, limit - used),
        type: 'lifetime',
        requiresUpgrade: used >= limit,
        canCreate: used < limit
      };
    }

    // Check if user has unlimited invoices
    const hasUnlimitedInvoices = limits.invoices === 'unlimited';

    const responseData = {
      invoices: invoiceData,
      receipts: receiptData,
      contracts: contractData,
      trials: {}, // Removed trials
      tier,
      hasUnlimitedInvoices,
      limits: {
        invoices: limits.invoices,
        receipts: limits.receipts,
        contracts: limits.contracts,
        teamMembers: limits.teamMembers,
        bankAccounts: limits.bankAccounts,
      },
      summary: {
        invoices: {
          used: userData.invoices_used_lifetime || 0,
          limit: limits.invoices,
          remaining: limits.invoices === 'unlimited' ? 'unlimited' : Math.max(0, (limits.invoices as number) - (userData.invoices_used_lifetime || 0))
        },
        receipts: {
          used: userData.receipts_used_lifetime || 0,
          limit: limits.receipts,
          remaining: limits.receipts === 'unlimited' ? 'unlimited' : Math.max(0, (limits.receipts as number) - (userData.receipts_used_lifetime || 0))
        },
        contracts: {
          used: userData.contracts_used_lifetime || 0,
          limit: limits.contracts,
          remaining: limits.contracts === 'unlimited' ? 'unlimited' : Math.max(0, (limits.contracts as number) - (userData.contracts_used_lifetime || 0))
        }
      }
    };

    if (newTokens) {
      return createAuthResponse(responseData, newTokens);
    }

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("Error fetching usage:", error);
    
    const errorResponse = NextResponse.json(
      { error: error.message || "Failed to fetch usage" },
      { status: 500 }
    );
    
    if (newTokens) {
      return createAuthResponse(await errorResponse.json(), newTokens);
    }
    
    return errorResponse;
  }
}