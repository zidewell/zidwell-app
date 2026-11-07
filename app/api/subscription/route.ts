// app/api/subscription/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";

// ============================================================
// FEATURE MATRIX (tiers match pricing UI)
// ============================================================
const SUBSCRIPTION_FEATURES = {
  starter: {
    name: "Starter",
    price: 0,
    yearlyPrice: 0,
    invoices: 5,
    receipts: 5,
    contracts: 5,
    teamMembers: 0,
    bankAccounts: 1,
    bookkeeping: true,
    taxCalculator: false,
    financialStatements: false,
    brandedInvoices: true,
    expenseTracking: true,
    vault: false,
    multiUser: false,
    rolePermissions: false,
    approvalSystem: false,
    downloadableReports: false,
    payrollSystem: false,
    advancedReporting: false,
    customStructure: false,
    dedicatedSupport: false,
    accountManager: false,
  },
  sme: {
    name: "SME",
    price: 9900,
    yearlyPrice: 49900,
    invoices: "unlimited",
    receipts: "unlimited",
    contracts: "unlimited",
    teamMembers: 2,
    bankAccounts: 3,
    bookkeeping: true,
    taxCalculator: true,
    financialStatements: true,
    brandedInvoices: true,
    expenseTracking: true,
    vault: true,
    multiUser: true,
    rolePermissions: false,
    approvalSystem: false,
    downloadableReports: false,
    payrollSystem: false,
    advancedReporting: false,
    customStructure: false,
    dedicatedSupport: false,
    accountManager: false,
  },
  enterprise: {
    name: "Enterprise",
    price: 19900,
    yearlyPrice: 99900,
    invoices: "unlimited",
    receipts: "unlimited",
    contracts: "unlimited",
    teamMembers: 3,
    bankAccounts: "unlimited",
    bookkeeping: true,
    taxCalculator: true,
    financialStatements: true,
    brandedInvoices: true,
    expenseTracking: true,
    vault: true,
    multiUser: true,
    rolePermissions: true,
    approvalSystem: true,
    downloadableReports: true,
    payrollSystem: true,
    advancedReporting: true,
    customStructure: true,
    dedicatedSupport: true,
    accountManager: false,
  },
  booster: {
    name: "Booster",
    price: 200000,
    yearlyPrice: 2400000,
    invoices: "unlimited",
    receipts: "unlimited",
    contracts: "unlimited",
    teamMembers: "unlimited",
    bankAccounts: "unlimited",
    bookkeeping: true,
    taxCalculator: true,
    financialStatements: true,
    brandedInvoices: true,
    expenseTracking: true,
    vault: true,
    multiUser: true,
    rolePermissions: true,
    approvalSystem: true,
    downloadableReports: true,
    payrollSystem: true,
    advancedReporting: true,
    customStructure: true,
    dedicatedSupport: true,
    accountManager: true,
  },
  console: {
    name: "Console",
    price: 0,
    yearlyPrice: 0,
    invoices: "unlimited",
    receipts: "unlimited",
    contracts: "unlimited",
    teamMembers: "unlimited",
    bankAccounts: "unlimited",
    bookkeeping: true,
    taxCalculator: true,
    financialStatements: true,
    brandedInvoices: true,
    expenseTracking: true,
    vault: true,
    multiUser: true,
    rolePermissions: true,
    approvalSystem: true,
    downloadableReports: true,
    payrollSystem: true,
    advancedReporting: true,
    customStructure: true,
    dedicatedSupport: true,
    accountManager: true,
  },
} as const;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const VALID_TIERS = ["sme", "enterprise"] as const;
const ALL_TIERS = [
  "starter",
  "sme",
  "enterprise",
  "booster",
  "console",
] as const;

type PaidTier = (typeof VALID_TIERS)[number];
type AnyTier = (typeof ALL_TIERS)[number];

export async function GET(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    const response = NextResponse.json(
      { error: "Please login to access subscription info", logout: true },
      { status: 401 },
    );
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  try {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("subscription_tier, subscription_expires_at")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("Error fetching user:", userError);
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 },
      );
    }

    if (
      !subscription &&
      (!userData.subscription_tier || userData.subscription_tier === "free")
    ) {
      const responseData = {
        success: true,
        subscription: {
          tier: "starter" as AnyTier,
          status: "active",
          expiresAt: null,
          features: SUBSCRIPTION_FEATURES.starter,
        },
      };
      if (newTokens) return createAuthResponse(responseData, newTokens);
      return NextResponse.json(responseData);
    }

    if (
      subscription?.expires_at &&
      new Date(subscription.expires_at) < new Date()
    ) {
      if (subscription.status === "active") {
        await supabase
          .from("subscriptions")
          .update({ status: "expired" })
          .eq("id", subscription.id);

        await supabase
          .from("users")
          .update({
            subscription_tier: "starter",
            subscription_expires_at: null,
          })
          .eq("id", user.id);
      }

      const responseData = {
        success: true,
        subscription: {
          tier: "starter" as AnyTier,
          status: "active",
          expiresAt: null,
          features: SUBSCRIPTION_FEATURES.starter,
        },
      };
      if (newTokens) return createAuthResponse(responseData, newTokens);
      return NextResponse.json(responseData);
    }

    const rawTier =
      subscription?.tier || userData.subscription_tier || "starter";

    const tier: AnyTier = (ALL_TIERS as readonly string[]).includes(rawTier)
      ? (rawTier as AnyTier)
      : "starter";

    const responseData = {
      success: true,
      subscription: {
        tier,
        status: subscription?.status || "active",
        expiresAt:
          subscription?.expires_at ||
          userData.subscription_expires_at ||
          null,
        features: SUBSCRIPTION_FEATURES[tier],
      },
    };
    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch subscription" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    const response = NextResponse.json(
      { error: "Please login to manage subscription", logout: true },
      { status: 401 },
    );
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  try {
    const body = await req.json();
    const { action, tier, paymentMethod, amount, paymentReference, isYearly } =
      body;

    if (action === "cancel") {
      const { data: subscription, error: findError } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (findError || !subscription) {
        return NextResponse.json(
          { error: "No active subscription found" },
          { status: 404 },
        );
      }

      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          auto_renew: false,
        })
        .eq("id", subscription.id);

      if (updateError) throw updateError;

      const responseData = {
        success: true,
        message: "Subscription cancelled successfully",
      };
      if (newTokens) return createAuthResponse(responseData, newTokens);
      return NextResponse.json(responseData);
    }

    if (action === "subscribe") {
      if (!tier || !paymentMethod || !amount || !paymentReference) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 },
        );
      }

      if (tier === "starter") {
        return NextResponse.json(
          {
            error: "Starter is free — no subscription needed.",
            code: "FREE_PLAN",
          },
          { status: 400 },
        );
      }

      if (tier === "booster") {
        return NextResponse.json(
          {
            error: "Booster is a custom plan. Please contact sales@zidwell.com.",
            code: "CUSTOM_QUOTE_ONLY",
          },
          { status: 400 },
        );
      }

      if (!(VALID_TIERS as readonly string[]).includes(tier)) {
        return NextResponse.json(
          { error: "Invalid subscription tier" },
          { status: 400 },
        );
      }

      const paidTier = tier as PaidTier;

      const expectedAmount = isYearly
        ? SUBSCRIPTION_FEATURES[paidTier].yearlyPrice
        : SUBSCRIPTION_FEATURES[paidTier].price;

      if (Number(amount) !== expectedAmount) {
        return NextResponse.json(
          {
            error: `Amount mismatch for ${paidTier}. Expected ${expectedAmount}, got ${amount}.`,
          },
          { status: 400 },
        );
      }

      const expiresAt = new Date();
      if (isYearly) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      await supabase
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("user_id", user.id)
        .eq("status", "active");

      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          tier: paidTier,
          status: "active",
          expires_at: expiresAt.toISOString(),
          auto_renew: true,
          payment_method: paymentMethod,
        })
        .select()
        .single();

      if (subError) {
        throw new Error(`Failed to create subscription: ${subError.message}`);
      }

      const { error: userError } = await supabase
        .from("users")
        .update({
          subscription_tier: paidTier,
          subscription_expires_at: expiresAt.toISOString(),
        })
        .eq("id", user.id);

      if (userError) {
        throw new Error(`Failed to update user: ${userError.message}`);
      }

      const { error: paymentError } = await supabase
        .from("subscription_payments")
        .insert({
          user_id: user.id,
          subscription_id: subscription.id,
          amount,
          payment_method: paymentMethod,
          status: "completed",
          reference: paymentReference,
          metadata: {
            tier: paidTier,
            isYearly,
            period: isYearly ? "yearly" : "monthly",
          },
        });

      if (paymentError) {
        console.error("Failed to record payment:", paymentError);
      }

      const responseData = {
        success: true,
        message: `Successfully subscribed to ${paidTier} plan`,
        subscription: {
          id: subscription.id,
          tier: paidTier,
          status: "active",
          expires_at: expiresAt.toISOString(),
        },
      };
      if (newTokens) return createAuthResponse(responseData, newTokens);
      return NextResponse.json(responseData);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error managing subscription:", error);
    return NextResponse.json(
      { error: error.message || "Failed to manage subscription" },
      { status: 500 },
    );
  }
}