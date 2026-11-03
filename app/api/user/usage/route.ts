// app/api/user/usage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";

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
    // ─── Fetch usage counters from users table ───
    const { data: userData, error } = await supabase
      .from("users")
      .select(`
        invoices_used_lifetime,
        receipts_used_lifetime,
        contracts_used_lifetime,
        invoice_lifetime_limit,
        receipt_lifetime_limit,
        contract_lifetime_limit
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

    // ─── Resolve effective tier from zidstore_subscriptions ───
    const { data: activeSub } = await supabase
      .from("zidstore_subscriptions")
      .select("plan_tier, current_period_end, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .maybeSingle();

    let tier = "free";
    if (activeSub && activeSub.status === "active") {
      const periodEnd = new Date(activeSub.current_period_end);
      if (periodEnd.getTime() > Date.now()) {
        tier = activeSub.plan_tier;
      }
    }

    // ─── Tier classification ───
    // Matches the tier strings written by the ZidStore subscription flow:
    //   'starter'    → free-tier store
    //   'sme'        → growing store
    //   'enterprise' → serious seller
    //   'booster'    → custom / managed growth plan
    const isFree = tier === "free";
    const isStarter = tier === "starter";
    const isSME = tier === "sme";
    const isEnterprise = tier === "enterprise";
    const isBooster = tier === "booster";
    const hasPaidTier = isSME || isEnterprise || isBooster;
    const hasUnlimitedInvoices = hasPaidTier;

    // ─── Invoice usage ───
    let invoiceData;
    if (isFree || isStarter) {
      const used = userData.invoices_used_lifetime || 0;
      const limit = isFree ? 5 : 10; // Free: 5, Starter: 10
      invoiceData = {
        used,
        limit,
        remaining: Math.max(0, limit - used),
        type: "lifetime",
        requiresUpgrade: used >= limit,
        canCreate: used < limit,
      };
    } else {
      invoiceData = {
        used: userData.invoices_used_lifetime || 0,
        limit: "unlimited",
        remaining: "unlimited",
        type: "unlimited",
        requiresUpgrade: false,
        canCreate: true,
      };
    }

    // ─── Receipt usage ───
    let receiptData;
    if (isFree) {
      const used = userData.receipts_used_lifetime || 0;
      const limit = 5;
      receiptData = {
        used,
        limit,
        remaining: Math.max(0, limit - used),
        type: "lifetime",
        requiresUpgrade: used >= limit,
        canCreate: used < limit,
      };
    } else {
      receiptData = {
        used: userData.receipts_used_lifetime || 0,
        limit: "unlimited",
        remaining: "unlimited",
        type: "unlimited",
        requiresUpgrade: false,
        canCreate: true,
      };
    }

    // ─── Contract usage ───
    let contractData;
    if (isFree || isStarter) {
      // Free & Starter: no contracts
      const used = userData.contracts_used_lifetime || 0;
      contractData = {
        used,
        limit: 0,
        remaining: 0,
        type: "lifetime",
        requiresUpgrade: true,
        canCreate: false,
      };
    } else if (isSME) {
      const used = userData.contracts_used_lifetime || 0;
      const limit = 1;
      contractData = {
        used,
        limit,
        remaining: Math.max(0, limit - used),
        type: "lifetime",
        requiresUpgrade: used >= limit,
        canCreate: used < limit,
      };
    } else if (isEnterprise) {
      const used = userData.contracts_used_lifetime || 0;
      const limit = 10;
      contractData = {
        used,
        limit,
        remaining: Math.max(0, limit - used),
        type: "lifetime",
        requiresUpgrade: used >= limit,
        canCreate: used < limit,
      };
    } else {
      // Booster (or any paid tier beyond Enterprise): unlimited
      contractData = {
        used: userData.contracts_used_lifetime || 0,
        limit: "unlimited",
        remaining: "unlimited",
        type: "unlimited",
        requiresUpgrade: false,
        canCreate: true,
      };
    }

    // ─── Active trials ───
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
            daysRemaining: Math.ceil(
              (endsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            ),
          };
        }
      }
    }

    // ─── Response ───
    const invoiceUsed = userData.invoices_used_lifetime || 0;

    const responseData = {
      invoices: invoiceData,
      receipts: receiptData,
      contracts: contractData,
      trials: activeTrials,
      tier,
      hasUnlimitedInvoices,
      summary: {
        invoices: {
          used: invoiceUsed,
          limit: isFree ? 5 : isStarter ? 10 : "unlimited",
          remaining: isFree
            ? Math.max(0, 5 - invoiceUsed)
            : isStarter
              ? Math.max(0, 10 - invoiceUsed)
              : "unlimited",
        },
      },
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