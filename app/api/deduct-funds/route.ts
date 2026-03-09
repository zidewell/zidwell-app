// app/api/deduct-funds/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import {
  isAuthenticated,
  hasRequiredTier,
  checkFeatureAccess,
} from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Services that are always free (utilities)
const UTILITY_SERVICES = ["airtime", "data", "electricity", "cable-tv"];

// Pay-per-use fees (after limits are exceeded)
const PAY_PER_USE_FEES = {
  invoice: 100,      // ₦100 per invoice after limit
  receipt: 100,      // ₦100 per receipt after limit
  contract: 10,      // ₦10 per contract after limit (for non-premium)
};

export async function POST(req: NextRequest) {
  const user = await isAuthenticated(req);

  if (!user) {
    return NextResponse.json(
      { error: "Please login to access transactions" },
      { status: 401 },
    );
  }

  try {
    const body = await req.json();
    let {
      userId,
      amount,
      description,
      pin,
      isInvoiceCreation = false,
      isReceiptCreation = false,
      isContractCreation = false,
      isBookkeepingAccess = false,
      isTaxCalculatorAccess = false,
      isTaxFilingAccess = false,
      service,
      include_lawyer_signature = false,
    } = body;

    if (!userId || !pin) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 },
      );
    }

    if (user.id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 },
      );
    }

    // Fetch user data with usage counts
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select(
        `
        transaction_pin, 
        wallet_balance, 
        subscription_tier, 
        subscription_expires_at,
        invoices_used_this_month,
        receipts_used_this_month,
        contracts_used_this_month,
        zidcoin_balance,
        last_usage_reset
      `,
      )
      .eq("id", userId)
      .single();

    if (fetchError || !userData) {
      return NextResponse.json(
        { error: fetchError?.message || "User not found" },
        { status: 404 },
      );
    }

    if (!userData.transaction_pin) {
      return NextResponse.json(
        { error: "Transaction PIN not set" },
        { status: 400 },
      );
    }

    // Verify PIN
    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, userData.transaction_pin);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid transaction PIN" },
        { status: 401 },
      );
    }

    // Check subscription status
    const isSubscribed = userData.subscription_tier !== "free";
    const isGrowth = userData.subscription_tier === "growth";
    const isPremium = userData.subscription_tier === "premium" || 
                      userData.subscription_tier === "elite";
    const isElite = userData.subscription_tier === "elite";

    // Check if usage needs to be reset (new month)
    const lastReset = userData.last_usage_reset
      ? new Date(userData.last_usage_reset)
      : new Date();
    const now = new Date();
    if (
      lastReset.getMonth() !== now.getMonth() ||
      lastReset.getFullYear() !== now.getFullYear()
    ) {
      // Reset monthly usage
      await supabase
        .from("users")
        .update({
          invoices_used_this_month: 0,
          receipts_used_this_month: 0,
          contracts_used_this_month: 0,
          last_usage_reset: now.toISOString(),
        })
        .eq("id", userId);

      userData.invoices_used_this_month = 0;
      userData.receipts_used_this_month = 0;
      userData.contracts_used_this_month = 0;
    }

    // ============ UTILITY SERVICES ============
    if (service && UTILITY_SERVICES.includes(service)) {
      if (userData.wallet_balance < amount) {
        return NextResponse.json(
          { error: "Insufficient balance for utility purchase" },
          { status: 400 },
        );
      }
      
      // Earn ZidCoins for utility purchases (20 ZC for every ₦2500 spent)
      const zidcoinEarned = Math.floor(amount / 2500) * 20;
      
      const paymentResult = await processPayment(
        userId,
        amount,
        service,
        description,
        userData,
        user,
      );

      if (paymentResult && zidcoinEarned > 0) {
        // Add ZidCoins to user's balance
        await supabase
          .from("users")
          .update({
            zidcoin_balance: (userData.zidcoin_balance || 0) + zidcoinEarned,
          })
          .eq("id", userId);
      }

      return paymentResult;
    }

    // ============ INVOICE CREATION ============
    if (isInvoiceCreation) {
      const currentUsage = userData.invoices_used_this_month || 0;
      const limit = isPremium ? "unlimited" : (isGrowth ? "unlimited" : 5);
      const hasFreeAccess = isPremium || isGrowth || currentUsage < 5;

      if (hasFreeAccess) {
        // Free invoice (within limits or premium/growth)
        if (!isPremium && !isGrowth) {
          // Only increment for free tier users
          await supabase
            .from("users")
            .update({
              invoices_used_this_month: currentUsage + 1,
            })
            .eq("id", userId);
        }

        await recordTransaction(
          userId,
          0,
          "invoice_creation",
          `Invoice created (${!isPremium && !isGrowth ? currentUsage + 1 + "/5" : "unlimited"})`,
          {
            used_this_month: !isPremium && !isGrowth ? currentUsage + 1 : currentUsage,
            limit: limit,
            remaining: limit === "unlimited" ? "unlimited" : 5 - (currentUsage + 1),
            included_in_plan: true,
          }
        );

        return NextResponse.json({
          success: true,
          message: "Invoice created successfully",
          usedThisMonth: !isPremium && !isGrowth ? currentUsage + 1 : currentUsage,
          limit: limit,
          remaining: limit === "unlimited" ? "unlimited" : 5 - (currentUsage + 1),
          charged: false,
          amount: 0,
        });
      } 
      
      // Pay-per-use mode (free tier exceeded limit)
      else {
        if (userData.wallet_balance < PAY_PER_USE_FEES.invoice) {
          return NextResponse.json(
            { 
              error: "Insufficient balance for pay-per-use invoice", 
              requiredAmount: PAY_PER_USE_FEES.invoice,
              currentBalance: userData.wallet_balance,
              message: `Please fund your wallet with ₦${PAY_PER_USE_FEES.invoice} to create this invoice`
            },
            { status: 400 },
          );
        }

        // Process payment
        const paymentResult = await processPayment(
          userId,
          PAY_PER_USE_FEES.invoice,
          "invoice_pay_per_use",
          `Pay-per-use invoice (exceeded free limit)`,
          userData,
          user,
        );

        if (!paymentResult) {
          return NextResponse.json(
            { error: "Failed to process payment" },
            { status: 500 },
          );
        }

        // Increment usage
        await supabase
          .from("users")
          .update({
            invoices_used_this_month: currentUsage + 1,
          })
          .eq("id", userId);

        await recordTransaction(
          userId,
          PAY_PER_USE_FEES.invoice,
          "invoice_pay_per_use",
          `Pay-per-use invoice created`,
          {
            used_this_month: currentUsage + 1,
            limit: 5,
            remaining: 0,
            pay_per_use: true,
            fee_paid: PAY_PER_USE_FEES.invoice,
          }
        );

        return NextResponse.json({
          success: true,
          message: "Pay-per-use invoice created",
          usedThisMonth: currentUsage + 1,
          limit: 5,
          remaining: 0,
          charged: true,
          amount: PAY_PER_USE_FEES.invoice,
          pay_per_use: true,
        });
      }
    }

    // ============ RECEIPT CREATION ============
    if (isReceiptCreation) {
      const currentUsage = userData.receipts_used_this_month || 0;
      const limit = isPremium ? "unlimited" : (isGrowth ? "unlimited" : 5);
      const hasFreeAccess = isPremium || isGrowth || currentUsage < 5;

      if (hasFreeAccess) {
        if (!isPremium && !isGrowth) {
          await supabase
            .from("users")
            .update({
              receipts_used_this_month: currentUsage + 1,
            })
            .eq("id", userId);
        }

        await recordTransaction(
          userId,
          0,
          "receipt_creation",
          `Receipt created (${!isPremium && !isGrowth ? currentUsage + 1 + "/5" : "unlimited"})`,
          {
            used_this_month: !isPremium && !isGrowth ? currentUsage + 1 : currentUsage,
            limit: limit,
            remaining: limit === "unlimited" ? "unlimited" : 5 - (currentUsage + 1),
          }
        );

        return NextResponse.json({
          success: true,
          message: "Receipt created",
          usedThisMonth: !isPremium && !isGrowth ? currentUsage + 1 : currentUsage,
          limit: limit,
          remaining: limit === "unlimited" ? "unlimited" : 5 - (currentUsage + 1),
          charged: false,
        });
      } 
      
      // Pay-per-use for receipts
      else {
        if (userData.wallet_balance < PAY_PER_USE_FEES.receipt) {
          return NextResponse.json(
            { 
              error: "Insufficient balance for pay-per-use receipt", 
              requiredAmount: PAY_PER_USE_FEES.receipt,
            },
            { status: 400 },
          );
        }

        const paymentResult = await processPayment(
          userId,
          PAY_PER_USE_FEES.receipt,
          "receipt_pay_per_use",
          `Pay-per-use receipt`,
          userData,
          user,
        );

        if (!paymentResult) return paymentResult;

        await supabase
          .from("users")
          .update({
            receipts_used_this_month: currentUsage + 1,
          })
          .eq("id", userId);

        return NextResponse.json({
          success: true,
          message: "Pay-per-use receipt created",
          usedThisMonth: currentUsage + 1,
          limit: 5,
          remaining: 0,
          charged: true,
          amount: PAY_PER_USE_FEES.receipt,
          pay_per_use: true,
        });
      }
    }

    // ============ CONTRACT CREATION ============
    if (isContractCreation) {
      const currentUsage = userData.contracts_used_this_month || 0;
      
      // Determine limits based on tier
      let limit: number | "unlimited" = 0;
      if (isPremium || isElite) {
        limit = "unlimited";
      } else if (isGrowth) {
        limit = 5; // Growth: 5 contracts/month
      } else {
        limit = 1; // Free: 1 contract/month
      }

      // Check lawyer signature (always costs ₦10,000)
      if (include_lawyer_signature) {
        if (userData.wallet_balance < 10000) {
          return NextResponse.json(
            { 
              error: "Insufficient balance for lawyer signature", 
              requiredAmount: 10000,
              currentBalance: userData.wallet_balance,
            },
            { status: 400 },
          );
        }

        // Process payment for lawyer signature
        const paymentResult = await processPayment(
          userId,
          10000,
          "lawyer_signature",
          "Lawyer signature for contract",
          userData,
          user,
        );

        if (!paymentResult) {
          return NextResponse.json(
            { error: "Failed to process lawyer signature payment" },
            { status: 500 },
          );
        }

        // Increment contract usage (if not unlimited)
        if (limit !== "unlimited") {
          await supabase
            .from("users")
            .update({
              contracts_used_this_month: currentUsage + 1,
            })
            .eq("id", userId);
        }

        await recordTransaction(
          userId,
          10000,
          "lawyer_signature",
          "Lawyer signature added to contract",
          {
            used_this_month: limit === "unlimited" ? currentUsage : currentUsage + 1,
            limit: limit,
            lawyer_signature: true,
            fee_paid: 10000,
          }
        );

        return NextResponse.json({
          success: true,
          message: "Contract with lawyer signature created",
          usedThisMonth: limit === "unlimited" ? currentUsage : currentUsage + 1,
          limit: limit,
          remaining: limit === "unlimited" ? "unlimited" : (typeof limit === 'number' ? limit - (currentUsage + 1) : 0),
          charged: true,
          amount: 10000,
          lawyer_signature: true,
        });
      }

      // Regular contract (no lawyer signature)
      const hasFreeAccess = limit === "unlimited" || currentUsage < (typeof limit === 'number' ? limit : 0);

      if (hasFreeAccess) {
        // Free contract (within limits)
        if (limit !== "unlimited") {
          await supabase
            .from("users")
            .update({
              contracts_used_this_month: currentUsage + 1,
            })
            .eq("id", userId);
        }

        await recordTransaction(
          userId,
          0,
          "contract_creation",
          `Contract created (${limit === "unlimited" ? "unlimited" : currentUsage + 1 + "/" + limit})`,
          {
            used_this_month: limit === "unlimited" ? currentUsage : currentUsage + 1,
            limit: limit,
            remaining: limit === "unlimited" ? "unlimited" : (typeof limit === 'number' ? limit - (currentUsage + 1) : 0),
            included_in_plan: true,
          }
        );

        return NextResponse.json({
          success: true,
          message: "Contract created successfully",
          usedThisMonth: limit === "unlimited" ? currentUsage : currentUsage + 1,
          limit: limit,
          remaining: limit === "unlimited" ? "unlimited" : (typeof limit === 'number' ? limit - (currentUsage + 1) : 0),
          charged: false,
          amount: 0,
        });
      } 
      
      // Pay-per-use mode (exceeded free limit)
      else {
        if (userData.wallet_balance < PAY_PER_USE_FEES.contract) {
          return NextResponse.json(
            { 
              error: "Insufficient balance for pay-per-use contract", 
              requiredAmount: PAY_PER_USE_FEES.contract,
              currentBalance: userData.wallet_balance,
              message: `Please fund your wallet with ₦${PAY_PER_USE_FEES.contract} to create this contract`
            },
            { status: 400 },
          );
        }

        // Process payment
        const paymentResult = await processPayment(
          userId,
          PAY_PER_USE_FEES.contract,
          "contract_pay_per_use",
          `Pay-per-use contract (exceeded free limit)`,
          userData,
          user,
        );

        if (!paymentResult) {
          return NextResponse.json(
            { error: "Failed to process payment" },
            { status: 500 },
          );
        }

        // Increment usage
        await supabase
          .from("users")
          .update({
            contracts_used_this_month: currentUsage + 1,
          })
          .eq("id", userId);

        await recordTransaction(
          userId,
          PAY_PER_USE_FEES.contract,
          "contract_pay_per_use",
          `Pay-per-use contract created`,
          {
            used_this_month: currentUsage + 1,
            limit: limit,
            remaining: 0,
            pay_per_use: true,
            fee_paid: PAY_PER_USE_FEES.contract,
          }
        );

        return NextResponse.json({
          success: true,
          message: "Pay-per-use contract created",
          usedThisMonth: currentUsage + 1,
          limit: limit,
          remaining: 0,
          charged: true,
          amount: PAY_PER_USE_FEES.contract,
          pay_per_use: true,
        });
      }
    }

    // ============ BOOKKEEPING ACCESS ============
    if (isBookkeepingAccess) {
      // Check for active trial first
      const { data: activeTrial } = await supabase
        .from("user_trials")
        .select("*")
        .eq("user_id", userId)
        .eq("feature_key", "bookkeeping_access")
        .eq("status", "active")
        .maybeSingle();

      if (activeTrial) {
        const trialEndsAt = new Date(activeTrial.ends_at);
        if (trialEndsAt > now) {
          return NextResponse.json({
            success: true,
            message: "Bookkeeping access granted (trial)",
            isTrial: true,
            trialEndsAt: trialEndsAt,
            daysRemaining: Math.ceil(
              (trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            ),
          });
        }
      }

      // Check subscription access
      if (isGrowth || isPremium || isElite) {
        return NextResponse.json({
          success: true,
          message: "Bookkeeping access granted",
          includedInPlan: true,
          tier: userData.subscription_tier,
        });
      }

      return NextResponse.json(
        {
          error: "Bookkeeping requires Growth plan or higher",
          requiredTier: "growth",
          upgradeRequired: true,
          canStartTrial: true,
          trialDays: 14,
        },
        { status: 403 },
      );
    }


    if (isTaxCalculatorAccess) {
      if (isGrowth || isPremium || isElite) {
        return NextResponse.json({
          success: true,
          message: "Tax calculator access granted",
          includedInPlan: true,
        });
      }

      return NextResponse.json(
        {
          error: "Tax calculator requires Growth plan or higher",
          requiredTier: "growth",
          upgradeRequired: true,
        },
        { status: 403 },
      );
    }

    // ============ TAX FILING ============
    if (isTaxFilingAccess) {
      if (isPremium || isElite) {
        return NextResponse.json({
          success: true,
          message: "Tax filing support granted",
          includedInPlan: true,
        });
      }

      return NextResponse.json(
        {
          error: "Tax filing requires Premium plan or higher",
          requiredTier: "premium",
          upgradeRequired: true,
        },
        { status: 403 },
      );
    }

    // ============ REGULAR PAYMENT ============
    if (amount && amount > 0) {
      return await processPayment(
        userId,
        amount,
        service || "payment",
        description,
        userData,
        user,
      );
    }

    return NextResponse.json({
      success: true,
      message: "Operation completed",
    });

  } catch (err: any) {
    console.error("❌ Deduct Funds Error:", err.message);
    return NextResponse.json(
      { error: err.message || "Unexpected server error" },
      { status: 500 },
    );
  }
}

// Helper function to process payments
async function processPayment(
  userId: string,
  amount: number,
  service: string,
  description: string | undefined,
  userData: any,
  user: any,
) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  if (userData.wallet_balance < amount) {
    return NextResponse.json(
      { error: "Insufficient balance" },
      { status: 400 },
    );
  }

  const reference = crypto.randomUUID();
  const transactionDescription = description || `${service} payment`;

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "deduct_wallet_balance",
    {
      user_id: userId,
      amt: amount,
      transaction_type: service,
      reference,
      description: transactionDescription,
    },
  );

  if (rpcError) {
    console.error("❌ RPC deduct_wallet_balance failed:", rpcError.message);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 },
    );
  }

  const result =
    Array.isArray(rpcData) && rpcData.length > 0 ? rpcData[0] : rpcData;

  if (!result || result.status !== "OK") {
    return NextResponse.json(
      { error: result?.status || "Payment failed" },
      { status: 400 },
    );
  }

  // Update user wallet balance
  const { error: balanceUpdateError } = await supabase
    .from("users")
    .update({
      wallet_balance: result.new_balance,
    })
    .eq("id", userId);

  if (balanceUpdateError) {
    console.error(
      "❌ Failed to update user wallet balance:",
      balanceUpdateError.message,
    );
  }

  return NextResponse.json({
    success: true,
    message: `${service} payment successful`,
    reference,
    transactionId: result.tx_id,
    newWalletBalance: result.new_balance,
    amount: amount,
    status: "success",
    subscription_tier: user.subscription_tier,
  });
}

// Helper function to record transactions
async function recordTransaction(
  userId: string,
  amount: number,
  type: string,
  description: string,
  metadata: any,
) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const reference = `${type.slice(0, 3)}-${crypto.randomUUID().slice(0, 8)}`.toUpperCase();

  await supabase.from("transactions").insert({
    user_id: userId,
    amount: amount,
    type: type,
    status: "success",
    description: description,
    reference: reference,
    external_response: metadata,
  });
}