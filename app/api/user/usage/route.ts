// app/api/user/usage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api"; 

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    const tier = userData.subscription_tier || 'free';
    
    // ✅ Updated tier types
    const isFree = tier === 'free';
    const isSolopreneur = tier === 'solopreneur';
    const isSME = tier === 'sme';
    const isEnterprise = tier === 'enterprise';
    const isCorporation = tier === 'corporation';
    const hasUnlimitedInvoices = isSME || isEnterprise || isCorporation;

    // Calculate invoice usage based on tier
    let invoiceData;
    if (isFree || isSolopreneur) {
      const used = userData.invoices_used_lifetime || 0;
      const limit = isFree ? 5 : 10; // Free: 5, Solopreneur: 10
      invoiceData = {
        used,
        limit,
        remaining: Math.max(0, limit - used),
        type: 'lifetime',
        requiresUpgrade: used >= limit,
        canCreate: used < limit
      };
    } else {
      const used = userData.invoices_used_lifetime || 0;
      invoiceData = {
        used,
        limit: 'unlimited',
        remaining: 'unlimited',
        type: 'unlimited',
        requiresUpgrade: false,
        canCreate: true
      };
    }

    // Calculate receipt usage
    let receiptData;
    if (isFree || isSolopreneur) {
      const used = userData.receipts_used_lifetime || 0;
      const limit = isFree ? 5 : 'unlimited'; // Free: 5, Solopreneur: unlimited
      if (limit === 'unlimited') {
        receiptData = {
          used,
          limit: 'unlimited',
          remaining: 'unlimited',
          type: 'unlimited',
          requiresUpgrade: false,
          canCreate: true
        };
      } else {
        receiptData = {
          used,
          limit,
          remaining: Math.max(0, limit - used),
          type: 'lifetime',
          requiresUpgrade: used >= limit,
          canCreate: used < limit
        };
      }
    } else {
      receiptData = {
        used: userData.receipts_used_lifetime || 0,
        limit: 'unlimited',
        remaining: 'unlimited',
        type: 'unlimited',
        requiresUpgrade: false,
        canCreate: true
      };
    }

    // Calculate contract usage
    let contractData;
    if (isFree) {
      const used = userData.contracts_used_lifetime || 0;
      const limit = 0; // Free: 0 contracts
      contractData = {
        used,
        limit,
        remaining: Math.max(0, limit - used),
        type: 'lifetime',
        requiresUpgrade: true,
        canCreate: false
      };
    } else if (isSolopreneur) {
      const used = userData.contracts_used_lifetime || 0;
      const limit = 0; // Solopreneur: 0 contracts
      contractData = {
        used,
        limit,
        remaining: Math.max(0, limit - used),
        type: 'lifetime',
        requiresUpgrade: true,
        canCreate: false
      };
    } else if (isSME) {
      const used = userData.contracts_used_lifetime || 0;
      const limit = 1; // SME: 1 contract
      contractData = {
        used,
        limit,
        remaining: Math.max(0, limit - used),
        type: 'lifetime',
        requiresUpgrade: used >= limit,
        canCreate: used < limit
      };
    } else if (isEnterprise) {
      const used = userData.contracts_used_lifetime || 0;
      const limit = 10; // Enterprise: 10 contracts
      contractData = {
        used,
        limit,
        remaining: Math.max(0, limit - used),
        type: 'lifetime',
        requiresUpgrade: used >= limit,
        canCreate: used < limit
      };
    } else {
      contractData = {
        used: userData.contracts_used_lifetime || 0,
        limit: 'unlimited',
        remaining: 'unlimited',
        type: 'unlimited',
        requiresUpgrade: false,
        canCreate: true
      };
    }

    // Get active trials
    const { data: trials } = await supabase
      .from("user_trials")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active");

    const activeTrials: Record<string, any> = {};
    if (trials) {
      for (const trial of trials) {
        const endsAt = new Date(trial.ends_at);
        if (endsAt > new Date()) {
          activeTrials[trial.feature_key] = {
            isActive: true,
            endsAt,
            daysRemaining: Math.ceil((endsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
          };
        }
      }
    }

    const responseData = {
      invoices: invoiceData,
      receipts: receiptData,
      contracts: contractData,
      trials: activeTrials,
      tier,
      hasUnlimitedInvoices,
      summary: {
        invoices: {
          used: userData.invoices_used_lifetime || 0,
          limit: isFree ? 5 : isSolopreneur ? 10 : 'unlimited',
          remaining: isFree 
            ? Math.max(0, 5 - (userData.invoices_used_lifetime || 0))
            : isSolopreneur
            ? Math.max(0, 10 - (userData.invoices_used_lifetime || 0))
            : 'unlimited'
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