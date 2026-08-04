

// import { NextRequest, NextResponse } from "next/server";
// import { getNombaToken } from "@/lib/nomba";
// import { createClient } from "@supabase/supabase-js";
// import bcrypt from "bcryptjs";
// import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api"; 
// import { sendPinResetEmail } from "@/lib/email/pin-reset";

// export async function POST(req: NextRequest) {
//   const { user, newTokens } = await isAuthenticatedWithRefresh(req);

//   if (!user) {
//     return NextResponse.json(
//       { error: "Please login to access transactions", logout: true },
//       { status: 401 }
//     );
//   }

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
//       category,      // NEW: Category name
//       categoryId,    // NEW: Category ID from journal_categories
//     } = await req.json();

//     if (userId !== user.id) {
//       console.error(`User ID mismatch: ${userId} vs ${user.id}`);
//       return NextResponse.json(
//         { error: "Unauthorized: User ID mismatch" },
//         { status: 403 }
//       );
//     }

//     if (!userId || !pin || !amount || amount < 100 || !accountNumber || !accountName || !bankCode || !bankName) {
//       return NextResponse.json(
//         { message: "Missing or invalid required fields" },
//         { status: 400 }
//       );
//     }

//     // ✅ Verify user + PIN with attempt tracking
//     const { data: userData, error: userError } = await supabase
//       .from("users")
//       .select("id, transaction_pin, wallet_balance, pin_attempts, pin_locked_until, email, first_name, last_name")
//       .eq("id", userId)
//       .single();

//     if (userError || !userData) {
//       return NextResponse.json({ message: "User not found" }, { status: 404 });
//     }

//     // Check if PIN is locked
//     if (userData.pin_locked_until && new Date(userData.pin_locked_until) > new Date()) {
//       const lockedUntil = new Date(userData.pin_locked_until);
//       const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
      
//       const response = NextResponse.json(
//         { 
//           message: `PIN is locked due to multiple failed attempts. Please try again in ${minutesLeft} minutes or reset your PIN via email.`,
//           locked: true,
//           lockedUntil: userData.pin_locked_until
//         },
//         { status: 401 }
//       );
      
//       if (newTokens) {
//         return createAuthResponse(await response.json(), newTokens);
//       }
//       return response;
//     }

//     const plainPin = Array.isArray(pin) ? pin.join("") : pin;
//     const isValid = await bcrypt.compare(plainPin, userData.transaction_pin);
    
//     if (!isValid) {
//       const newAttempts = (userData.pin_attempts || 0) + 1;
//       let updateData: any = { pin_attempts: newAttempts };
//       let shouldSendEmail = false;
      
//       if (newAttempts >= 3) {
//         const lockDuration = 30 * 60 * 1000;
//         updateData.pin_locked_until = new Date(Date.now() + lockDuration);
//         const resetToken = crypto.randomUUID();
//         const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
//         updateData.pin_reset_token = resetToken;
//         updateData.pin_reset_token_expires = tokenExpiry;
//         shouldSendEmail = true;
//       }
      
//       await supabase
//         .from("users")
//         .update(updateData)
//         .eq("id", userId);
      
//       if (shouldSendEmail && userData.email) {
//         const userName = userData.first_name && userData.last_name 
//           ? `${userData.first_name} ${userData.last_name}`
//           : undefined;
        
//         await sendPinResetEmail(
//           userData.email,
//           updateData.pin_reset_token,
//           userId,
//           userName
//         );
        
//         const response = NextResponse.json(
//           { 
//             message: `PIN locked due to ${newAttempts} failed attempts. A reset link has been sent to your email.`,
//             locked: true,
//             remainingAttempts: 0,
//             resetEmailSent: true
//           },
//           { status: 401 }
//         );
        
//         if (newTokens) {
//           return createAuthResponse(await response.json(), newTokens);
//         }
//         return response;
//       }
      
//       const remainingAttempts = 3 - newAttempts;
//       const response = NextResponse.json(
//         { 
//           message: `Invalid transaction PIN. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining before PIN is locked.`,
//           remainingAttempts,
//           attempts: newAttempts
//         },
//         { status: 401 }
//       );
      
//       if (newTokens) {
//         return createAuthResponse(await response.json(), newTokens);
//       }
//       return response;
//     }
    
//     // ✅ PIN is valid - reset attempts
//     await supabase
//       .from("users")
//       .update({
//         pin_attempts: 0,
//         pin_locked_until: null,
//         pin_reset_token: null,
//         pin_reset_token_expires: null
//       })
//       .eq("id", userId);

//     const totalDeduction = totalDebit || amount + (fee || 0);
    
//     // ✅ Check sufficient balance (but DON'T deduct yet!)
//     if (userData.wallet_balance < totalDeduction) {
//       const response = NextResponse.json(
//         { message: "Insufficient wallet balance (including fees)" },
//         { status: 400 }
//       );
      
//       if (newTokens) {
//         return createAuthResponse(await response.json(), newTokens);
//       }
//       return response;
//     }

//     // ✅ Get Nomba token
//     const token = await getNombaToken();
//     if (!token) {
//       const response = NextResponse.json(
//         { message: "Unable to process transfer at this time" },
//         { status: 503 }
//       );
      
//       if (newTokens) {
//         return createAuthResponse(await response.json(), newTokens);
//       }
//       return response;
//     }

//     const merchantTxRef = `WD_${Date.now()}_${userId.slice(0, 8)}`;

//     // ✅ Create PENDING transaction FIRST (NO balance deduction) - INCLUDING CATEGORY
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
//         amount: Number(amount),
//         fee: fee || 0,
//         total_deduction: totalDeduction,
//         status: "pending",
//         narration: narration || "N/A",
//         merchant_tx_ref: merchantTxRef,
//         created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString(),
//         // NEW: Add category fields
//         category: category || null,
//         category_id: categoryId || null,
//       })
//       .select("*")
//       .single();

//     if (txError || !pendingTx) {
//       console.error("Transaction creation error:", txError);
//       const response = NextResponse.json(
//         { error: "Could not create transaction record" },
//         { status: 500 }
//       );
      
//       if (newTokens) {
//         return createAuthResponse(await response.json(), newTokens);
//       }
//       return response;
//     }

//     console.log(`📝 Created pending transaction ${pendingTx.id} for user ${userId} with category: ${category || 'none'}`);

//     // ✅ Call Nomba API
//     const nombaResponse = await fetch(`${process.env.NOMBA_URL}/v1/transfers/bank`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//         accountId: process.env.NOMBA_ACCOUNT_ID!,
//       },
//       body: JSON.stringify({
//         amount: Number(amount),
//         accountNumber,
//         accountName,
//         bankCode,
//         senderName,
//         merchantTxRef,
//         narration,
//       }),
//     });

//     const nombaData = await nombaResponse.json();
//     console.log("📤 Nomba response:", {
//       status: nombaResponse.status,
//       merchantTxRef,
//       nombaReference: nombaData?.data?.reference,
//     });

//     // ✅ Update transaction to PROCESSING state (preserve category)
//     await supabase
//       .from("transactions")
//       .update({
//         status: "processing",
//         description: `Transfer of ₦${amount} to ${accountName}`,
//         reference: nombaData?.data?.reference || null,
//         external_response: {
//           nomba_request: nombaData,
//           requested_at: new Date().toISOString(),
//           merchant_tx_ref: merchantTxRef,
//         },
//         updated_at: new Date().toISOString(),
//       })
//       .eq("id", pendingTx.id);

//     // ✅ Return processing status - NO BALANCE DEDUCTED YET
//     const responseData = {
//       message: "Transfer initiated. Processing...",
//       transactionId: pendingTx.id,
//       merchantTxRef,
//       status: "processing",
//       requiresPolling: true,
//       category: category || null,  // Include category in response
//     };

//     if (newTokens) {
//       return createAuthResponse(responseData, newTokens);
//     }

//     return NextResponse.json(responseData);

//   } catch (error: any) {
//     console.error("Withdraw API error:", error);
    
//     const response = NextResponse.json(
//       { error: "Server error: " + (error.message || error.description) },
//       { status: 500 }
//     );
    
//     if ((error as any).newTokens) {
//       return createAuthResponse(await response.json(), (error as any).newTokens);
//     }
    
//     return response;
//   }
// }



// app/api/withdraw/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getNombaToken } from "@/lib/nomba";
import bank78Client from "@/lib/bank78/client";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";
import { sendPinResetEmail } from "@/lib/email/pin-reset";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// GET USER'S PRIMARY PROVIDER
// ============================================================
async function getUserProvider(userId: string): Promise<'bank78' | 'nomba'> {
  const { data: user } = await supabase
    .from("users")
    .select("primary_provider, bank78_personal_account_number, wallet_id")
    .eq("id", userId)
    .single();

  // If user has Bank78 account and it's their primary provider
  if (user?.primary_provider === "bank78" && user?.bank78_personal_account_number) {
    return "bank78";
  }

  // Default to Nomba
  return "nomba";
}

export async function POST(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    return NextResponse.json(
      { error: "Please login to access transactions", logout: true },
      { status: 401 }
    );
  }

  try {
    const {
      userId,
      senderName,
      senderAccountNumber,
      senderBankName,
      amount,
      accountNumber,
      accountName,
      bankName,
      bankCode,
      narration,
      pin,
      fee,
      totalDebit,
      category,
      categoryId,
    } = await req.json();

    if (userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized: User ID mismatch" },
        { status: 403 }
      );
    }

    if (!userId || !pin || !amount || amount < 100 || !accountNumber || !accountName || !bankCode || !bankName) {
      return NextResponse.json(
        { message: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    // Verify user + PIN
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, transaction_pin, wallet_balance, pin_attempts, pin_locked_until, email, first_name, last_name, primary_provider")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check PIN lock
    if (userData.pin_locked_until && new Date(userData.pin_locked_until) > new Date()) {
      const lockedUntil = new Date(userData.pin_locked_until);
      const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
      
      const response = NextResponse.json(
        {
          message: `PIN is locked. Try again in ${minutesLeft} minutes or reset your PIN.`,
          locked: true,
          lockedUntil: userData.pin_locked_until
        },
        { status: 401 }
      );
      
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // Verify PIN
    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, userData.transaction_pin);

    if (!isValid) {
      const newAttempts = (userData.pin_attempts || 0) + 1;
      let updateData: any = { pin_attempts: newAttempts };

      if (newAttempts >= 3) {
        updateData.pin_locked_until = new Date(Date.now() + 30 * 60 * 1000);
        const resetToken = crypto.randomUUID();
        updateData.pin_reset_token = resetToken;
        updateData.pin_reset_token_expires = new Date(Date.now() + 60 * 60 * 1000);
        
        await supabase.from("users").update(updateData).eq("id", userId);
        
        if (userData.email) {
          await sendPinResetEmail(
            userData.email,
            resetToken,
            userId,
            userData.first_name && userData.last_name ? `${userData.first_name} ${userData.last_name}` : undefined
          );
        }
        
        return NextResponse.json(
          {
            message: "PIN locked. Reset link sent to your email.",
            locked: true,
            resetEmailSent: true
          },
          { status: 401 }
        );
      }

      await supabase.from("users").update(updateData).eq("id", userId);
      
      return NextResponse.json(
        {
          message: `Invalid PIN. ${3 - newAttempts} attempts remaining.`,
          remainingAttempts: 3 - newAttempts
        },
        { status: 401 }
      );
    }

    // Reset PIN attempts on success
    await supabase
      .from("users")
      .update({
        pin_attempts: 0,
        pin_locked_until: null,
        pin_reset_token: null,
        pin_reset_token_expires: null
      })
      .eq("id", userId);

    const totalDeduction = totalDebit || amount + (fee || 0);

    // Check balance
    if (userData.wallet_balance < totalDeduction) {
      return NextResponse.json(
        { message: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    const merchantTxRef = `WD_${Date.now()}_${userId.slice(0, 8)}`;

    // Determine which provider to use
    const provider = await getUserProvider(userId);
    console.log(`🔍 Using provider: ${provider} for user: ${userId}`);

    // Create pending transaction
    const { data: pendingTx, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: "withdrawal",
        provider: provider,
        sender: {
          name: senderName,
          accountNumber: senderAccountNumber,
          bankName: senderBankName,
        },
        receiver: {
          name: accountName,
          accountNumber,
          bankName,
        },
        amount: Number(amount),
        fee: fee || 0,
        total_deduction: totalDeduction,
        status: "pending",
        narration: narration || "N/A",
        merchant_tx_ref: merchantTxRef,
        category: category || null,
        category_id: categoryId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (txError || !pendingTx) {
      console.error("Transaction creation error:", txError);
      return NextResponse.json(
        { error: "Could not create transaction record" },
        { status: 500 }
      );
    }

    // Process based on provider
    if (provider === "bank78") {
      return await processBank78Withdrawal(pendingTx, {
        amount,
        accountNumber,
        accountName,
        bankCode,
        senderName,
        narration,
        merchantTxRef,
        newTokens,
        totalDeduction,
        userId,
        fee,
      });
    } else {
      return await processNombaWithdrawal(pendingTx, {
        amount,
        accountNumber,
        accountName,
        bankCode,
        senderName,
        narration,
        merchantTxRef,
        newTokens,
        totalDeduction,
        userId,
        fee,
      });
    }

  } catch (error: any) {
    console.error("Withdraw API error:", error);
    return NextResponse.json(
      { error: "Server error: " + (error.message || error.description) },
      { status: 500 }
    );
  }
}

// ============================================================
// PROCESS BANK78 WITHDRAWAL
// ============================================================
async function processBank78Withdrawal(
  pendingTx: any,
  params: {
    amount: number;
    accountNumber: string;
    accountName: string;
    bankCode: string;
    senderName: string;
    narration: string;
    merchantTxRef: string;
    newTokens: any;
    totalDeduction: number;
    userId: string;
    fee: number;
  }
) {
  const {
    amount,
    accountNumber,
    accountName,
    bankCode,
    senderName,
    narration,
    merchantTxRef,
    newTokens,
    totalDeduction,
    userId,
    fee,
  } = params;

  try {
    // Deduct balance
    const { data: deductResult, error: deductError } = await supabase
      .rpc("deduct_wallet_balance_only", {
        user_id: userId,
        amt: totalDeduction
      });

    if (deductError || deductResult === -1) {
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          external_response: { error: "Insufficient funds" }
        })
        .eq("id", pendingTx.id);

      return NextResponse.json(
        { message: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    // Process with Bank78
    const bank78Response = await bank78Client.interbankTransfer({
      reference: merchantTxRef,
      accountName,
      accountNumber,
      bankCode,
      amount,
      narration: narration || `Withdrawal from Zidwell`,
    });

    console.log("📤 Bank78 transfer response:", bank78Response);

    // Update transaction
    await supabase
      .from("transactions")
      .update({
        status: "processing",
        reference: bank78Response.data?.reference || merchantTxRef,
        provider_transaction_id: bank78Response.data?.transactionId,
        external_response: {
          ...bank78Response,
          deducted_at: new Date().toISOString(),
          deducted_amount: totalDeduction,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", pendingTx.id);

    const responseData = {
      message: "Transfer initiated with Bank78.",
      transactionId: pendingTx.id,
      merchantTxRef,
      provider: "bank78",
      status: "processing",
    };

    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("Bank78 withdrawal error:", error);
    
    await supabase
      .from("transactions")
      .update({
        status: "failed",
        external_response: { error: error.message },
        updated_at: new Date().toISOString(),
      })
      .eq("id", pendingTx.id);

    return NextResponse.json(
      { error: error.message || "Bank78 transfer failed" },
      { status: 500 }
    );
  }
}

// ============================================================
// PROCESS NOMBA WITHDRAWAL (Existing Logic)
// ============================================================
async function processNombaWithdrawal(
  pendingTx: any,
  params: {
    amount: number;
    accountNumber: string;
    accountName: string;
    bankCode: string;
    senderName: string;
    narration: string;
    merchantTxRef: string;
    newTokens: any;
    totalDeduction: number;
    userId: string;
    fee: number;
  }
) {
  const {
    amount,
    accountNumber,
    accountName,
    bankCode,
    senderName,
    narration,
    merchantTxRef,
    newTokens,
    totalDeduction,
    userId,
    fee,
  } = params;

  try {
    // Get Nomba token
    const token = await getNombaToken();
    if (!token) {
      return NextResponse.json(
        { message: "Unable to process transfer at this time" },
        { status: 503 }
      );
    }

    // Deduct balance
    const { data: deductResult, error: deductError } = await supabase
      .rpc("deduct_wallet_balance_only", {
        user_id: userId,
        amt: totalDeduction
      });

    if (deductError || deductResult === -1) {
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          external_response: { error: "Insufficient funds" }
        })
        .eq("id", pendingTx.id);

      return NextResponse.json(
        { message: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    // Call Nomba API
    const nombaResponse = await fetch(`${process.env.NOMBA_URL}/v1/transfers/bank`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        accountId: process.env.NOMBA_ACCOUNT_ID!,
      },
      body: JSON.stringify({
        amount: Number(amount),
        accountNumber,
        accountName,
        bankCode,
        senderName,
        merchantTxRef,
        narration,
      }),
    });

    const nombaData = await nombaResponse.json();
    console.log("📤 Nomba transfer response:", nombaData);

    // Update transaction
    await supabase
      .from("transactions")
      .update({
        status: "processing",
        description: `Transfer of ₦${amount} to ${accountName}`,
        reference: nombaData?.data?.reference || null,
        external_response: {
          nomba_request: nombaData,
          deducted_at: new Date().toISOString(),
          deducted_amount: totalDeduction,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", pendingTx.id);

    const responseData = {
      message: "Transfer initiated with Nomba.",
      transactionId: pendingTx.id,
      merchantTxRef,
      provider: "nomba",
      status: "processing",
    };

    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("Nomba withdrawal error:", error);
    
    await supabase
      .from("transactions")
      .update({
        status: "failed",
        external_response: { error: error.message },
        updated_at: new Date().toISOString(),
      })
      .eq("id", pendingTx.id);

    return NextResponse.json(
      { error: error.message || "Nomba transfer failed" },
      { status: 500 }
    );
  }
}