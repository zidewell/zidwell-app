// import { NextRequest, NextResponse } from "next/server";
// import { getNombaToken } from "@/lib/nomba";
// import { createClient } from "@supabase/supabase-js";
// import bcrypt from "bcryptjs";
// import { isAuthenticated } from "@/lib/auth-check-api";

// export async function POST(req: NextRequest) {
//      const user = await isAuthenticated(req);

//         if (!user) {
//           return NextResponse.json(
//             { error: "Please login to access transactions" },
//             { status: 401 }
//           );
//         }

//   const supabase = createClient(
//     process.env.SUPABASE_URL!,
//     process.env.SUPABASE_SERVICE_ROLE_KEY!
//   );

//   try {
//     const {
//       userId,
//       senderName,
//       senderAccountNumber,
//       senderBankName,
//       amount,
//       accountNumber,
//       accountName,
//       bankName,
//       bankCode,
//       narration,
//       pin,
//       fee,
//       totalDebit,
//     } = await req.json();

//     if (
//       !userId ||
//       !pin ||
//       !amount ||
//       amount < 100 ||
//       !accountNumber ||
//       !accountName ||
//       !bankCode ||
//       !bankName
//     ) {
//       return NextResponse.json(
//         { message: "Missing or invalid required fields" },
//         { status: 400 }
//       );
//     }

//     // ✅ Verify user + PIN
//     const { data: user, error: userError } = await supabase
//       .from("users")
//       .select("id, transaction_pin, wallet_balance")
//       .eq("id", userId)
//       .single();

//     if (userError || !user) {
//       return NextResponse.json({ message: "User not found" }, { status: 404 });
//     }

//     const plainPin = Array.isArray(pin) ? pin.join("") : pin;
//     const isValid = await bcrypt.compare(plainPin, user.transaction_pin);
//     if (!isValid) {
//       return NextResponse.json(
//         { message: "Invalid transaction PIN" },
//         { status: 401 }
//       );
//     }

//     const totalDeduction = totalDebit || amount + fee;
//     if (user.wallet_balance < totalDeduction) {
//       return NextResponse.json(
//         { message: "Insufficient wallet balance (including fees)" },
//         { status: 400 }
//       );
//     }

//     // ✅ Get Nomba token
//     const token = await getNombaToken();
//     if (!token) {
//       return NextResponse.json(
//         { message: "Unauthorized: Nomba token missing" },
//         { status: 401 }
//       );
//     }

//     const merchantTxRef = `WD_${Date.now()}`;

//     // ✅ Insert pending transaction
//     const { data: pendingTx, error: txError } = await supabase
//       .from("transactions")
//       .insert({
//         user_id: userId,
//         type: "withdrawal",
//         sender: {
//           name: senderName,
//           accountNumber: senderAccountNumber,
//           bankName: senderBankName,
//         },
//         receiver: {
//           name: accountName,
//           accountNumber,
//           bankName,
//         },
//         amount,
//         fee,
//         total_deduction: totalDeduction,
//         status: "pending",
//         narration: narration || "N/A",
//         merchant_tx_ref: merchantTxRef,
//       })
//       .select("*")
//       .single();

//     if (txError || !pendingTx) {
//       return NextResponse.json(
//         { error: "Could not create transaction record" },
//         { status: 500 }
//       );
//     }

//     // ✅ Deduct wallet balance first
//     const { error: rpcError } = await supabase.rpc("deduct_wallet_balance", {
//       user_id: pendingTx.user_id,
//       amt: totalDeduction,
//       transaction_type: "withdrawal",
//       reference: merchantTxRef,
//       description: `Transfer of ₦${amount}`,
//     });

//     if (rpcError) {
//       return NextResponse.json(
//         { error: "Failed to deduct wallet balance" },
//         { status: 500 }
//       );
//     }

//     const res = await fetch(`${process.env.NOMBA_URL}/v1/transfers/bank`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//         accountId: process.env.NOMBA_ACCOUNT_ID!,
//       },
//       body: JSON.stringify({
//         amount,
//         accountNumber,
//         accountName,
//         bankCode,
//         senderName,
//         merchantTxRef,
//         narration,
//       }),
//     });

//     const data = await res.json();
//     // console.log("transfer data", data);

//     await supabase
//       .from("transactions")
//       .update({
//         status: "processing",
//         description: `Transfer of ₦${amount}`,
//         reference: data?.data?.reference || null,
//         external_response: data,
//       })
//       .eq("id", pendingTx.id);

//     return NextResponse.json({
//       message: "Transfer initiated successfully.",
//       transactionId: pendingTx.id,
//       merchantTxRef,
//       nombaResponse: data,
//     });
//   } catch (error: any) {
//     console.error("Withdraw API error:", error);
//     return NextResponse.json(
//       { error: "Server error: " + (error.message || error.description) },
//       { status: 500 }
//     );
//   }
// }

/// app/api/deduct-funds/route.ts
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

    // ============ SUBSCRIPTION & USAGE CHECKS ============

    // ✅ UTILITY SERVICES - Always accessible
    if (service && UTILITY_SERVICES.includes(service)) {
      if (userData.wallet_balance < amount) {
        return NextResponse.json(
          { error: "Insufficient balance for utility purchase" },
          { status: 400 },
        );
      }
      return await processPayment(
        userId,
        amount,
        service,
        description,
        userData,
        user,
      );
    }

    // ✅ Handle Invoice Creation
    if (isInvoiceCreation) {
      // Check feature access with current usage
      const featureAccess = await checkFeatureAccess(
        req,
        "invoices_per_month",
        userData.invoices_used_this_month,
      );

      if (!featureAccess.hasAccess) {
        return NextResponse.json(
          {
            error: featureAccess.error || "Monthly invoice limit reached",
            limit: featureAccess.limit || 5,
            currentCount: userData.invoices_used_this_month,
            requiredTier: "growth",
            upgradeRequired: true,
            message: "Upgrade to Growth plan for unlimited invoices",
          },
          { status: 403 },
        );
      }

      // Get the limit (with fallback)
      const limit = featureAccess.limit || 5;

      // Increment usage
      const { error: updateError } = await supabase
        .from("users")
        .update({
          invoices_used_this_month: userData.invoices_used_this_month + 1,
        })
        .eq("id", userId);

      if (updateError) {
        console.error("Failed to update invoice count:", updateError);
        return NextResponse.json(
          { error: "Failed to process invoice creation" },
          { status: 500 },
        );
      }

      // Record the transaction
      const reference = `INV-${crypto.randomUUID().slice(0, 8)}`;
      await supabase.from("transactions").insert({
        user_id: userId,
        amount: 0,
        type: "invoice_creation",
        status: "success",
        description:
          description ||
          `Invoice created (${userData.invoices_used_this_month + 1}/${limit} used)`,
        reference: reference,
        external_response: {
          used_this_month: userData.invoices_used_this_month + 1,
          limit: limit,
          remaining: limit - (userData.invoices_used_this_month + 1),
          included_in_plan: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Invoice created successfully",
        usedThisMonth: userData.invoices_used_this_month + 1,
        limit: limit,
        remaining: limit - (userData.invoices_used_this_month + 1),
        charged: false,
        amount: 0,
        subscription_tier: user.subscription_tier,
      });
    }

    // ✅ Handle Receipt Creation
    if (isReceiptCreation) {
      const featureAccess = await checkFeatureAccess(
        req,
        "receipts_per_month",
        userData.receipts_used_this_month,
      );

      if (!featureAccess.hasAccess) {
        return NextResponse.json(
          {
            error: featureAccess.error || "Monthly receipt limit reached",
            limit: featureAccess.limit || 5,
            currentCount: userData.receipts_used_this_month,
            requiredTier: "growth",
            upgradeRequired: true,
            message: "Upgrade to Growth plan for unlimited receipts",
          },
          { status: 403 },
        );
      }

      const limit = featureAccess.limit || 5;

      // Increment usage
      const { error: updateError } = await supabase
        .from("users")
        .update({
          receipts_used_this_month: userData.receipts_used_this_month + 1,
        })
        .eq("id", userId);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to process receipt creation" },
          { status: 500 },
        );
      }

      const reference = `REC-${crypto.randomUUID().slice(0, 8)}`;
      await supabase.from("transactions").insert({
        user_id: userId,
        amount: 0,
        type: "receipt_creation",
        status: "success",
        description:
          description ||
          `Receipt created (${userData.receipts_used_this_month + 1}/${limit} used)`,
        reference: reference,
        external_response: {
          used_this_month: userData.receipts_used_this_month + 1,
          limit: limit,
          remaining: limit - (userData.receipts_used_this_month + 1),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Receipt created successfully",
        usedThisMonth: userData.receipts_used_this_month + 1,
        limit: limit,
        remaining: limit - (userData.receipts_used_this_month + 1),
        charged: false,
      });
    }

    // ✅ Handle Contract Creation
    if (isContractCreation) {
      // First check lawyer signature requirement
      if (include_lawyer_signature) {
        const { hasAccess } = await hasRequiredTier(req, "premium");
        if (!hasAccess) {
          return NextResponse.json(
            {
              error: "Lawyer signature requires Premium plan or higher",
              requiredTier: "premium",
              upgradeRequired: true,
            },
            { status: 403 },
          );
        }
        // Lawyer signature has a fee even for premium users
        amount = 10000; // ₦10,000 for lawyer signature
      } else {
        // Regular contract - check free limits
        const featureAccess = await checkFeatureAccess(
          req,
          "contracts_per_month",
          userData.contracts_used_this_month,
        );

        if (!featureAccess.hasAccess) {
          return NextResponse.json(
            {
              error: featureAccess.error || "Monthly contract limit reached",
              limit: featureAccess.limit || 1,
              currentCount: userData.contracts_used_this_month,
              requiredTier: "growth",
              upgradeRequired: true,
              message:
                "Upgrade to Growth plan for 5 contracts/month or Premium for unlimited",
            },
            { status: 403 },
          );
        }

        const limit = featureAccess.limit || 1;

        // Increment usage
        const { error: updateError } = await supabase
          .from("users")
          .update({
            contracts_used_this_month: userData.contracts_used_this_month + 1,
          })
          .eq("id", userId);

        if (updateError) {
          return NextResponse.json(
            { error: "Failed to process contract creation" },
            { status: 500 },
          );
        }

        const reference = `CON-${crypto.randomUUID().slice(0, 8)}`;
        await supabase.from("transactions").insert({
          user_id: userId,
          amount: 0,
          type: "contract_creation",
          status: "success",
          description:
            description ||
            `Contract created (${userData.contracts_used_this_month + 1}/${limit} used)`,
          reference: reference,
          external_response: {
            used_this_month: userData.contracts_used_this_month + 1,
            limit: limit,
            remaining: limit - (userData.contracts_used_this_month + 1),
          },
        });

        return NextResponse.json({
          success: true,
          message: "Contract created successfully",
          usedThisMonth: userData.contracts_used_this_month + 1,
          limit: limit,
          remaining: limit - (userData.contracts_used_this_month + 1),
          charged: false,
        });
      }
    }

    // ✅ Handle Bookkeeping Access
    if (service === "bookkeeping") {
      // Check trial first
      const { data: activeTrial } = await supabase
        .from("user_trials")
        .select("*")
        .eq("user_id", userId)
        .eq("feature_key", "bookkeeping_access")
        .eq("status", "active")
        .maybeSingle();

      if (activeTrial) {
        const trialEndsAt = new Date(activeTrial.ends_at);
        if (trialEndsAt > new Date()) {
          return NextResponse.json({
            success: true,
            message: "Bookkeeping access granted (trial)",
            isTrial: true,
            trialEndsAt: trialEndsAt,
            daysRemaining: Math.ceil(
              (trialEndsAt.getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          });
        }
      }

      // If no trial, check subscription
      const { hasAccess } = await checkFeatureAccess(req, "bookkeeping_access");

      if (!hasAccess) {
        return NextResponse.json(
          {
            error: "Bookkeeping requires Growth plan or higher",
            requiredTier: "growth",
            upgradeRequired: true,
          },
          { status: 403 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Bookkeeping access granted",
        subscription_tier: user.subscription_tier,
        includedInPlan: true,
      });
    }

    // ✅ Handle Tax Filing
    if (service === "tax_filing") {
      const { hasAccess } = await checkFeatureAccess(req, "tax_support");

      if (!hasAccess) {
        return NextResponse.json(
          {
            error: "Tax filing requires Premium plan or higher",
            requiredTier: "premium",
            upgradeRequired: true,
          },
          { status: 403 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Tax filing access granted",
        subscription_tier: user.subscription_tier,
        includedInPlan: true,
      });
    }

    // ✅ If we get here and amount > 0, process regular payment
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
      message: "Operation completed successfully",
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
