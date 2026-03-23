// // app/api/withdraw/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { getNombaToken } from "@/lib/nomba";
// import { createClient } from "@supabase/supabase-js";
// import bcrypt from "bcryptjs";
// import { isAuthenticated } from "@/lib/auth-check-api";

// export async function POST(req: NextRequest) {
//   const user = await isAuthenticated(req);

//   if (!user) {
//     return NextResponse.json(
//       { error: "Please login to access transactions" },
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

//     // ✅ Insert pending transaction FIRST
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

//     // ✅ Deduct wallet balance using the simple deduction function
//     // Note: Using the correct parameter names from your function: user_id and amt
//     const { data: deductResult, error: deductError } = await supabase
//       .rpc("deduct_wallet_balance_only", {
//         user_id: userId,        // Match your function parameter name
//         amt: totalDeduction     // Match your function parameter name
//       });

//     if (deductError) {
//       console.error("Deduction error:", deductError);
      
//       // If deduction fails, update transaction to failed
//       await supabase
//         .from("transactions")
//         .update({
//           status: "failed",
//           external_response: { error: deductError.message }
//         })
//         .eq("id", pendingTx.id);
      
//       return NextResponse.json(
//         { error: "Failed to deduct wallet balance: " + deductError.message },
//         { status: 500 }
//       );
//     }

//     // Check if deduction was successful (returns new balance or -1 for insufficient funds)
//     if (deductResult === -1) {
//       // Insufficient funds (should have been caught earlier, but just in case)
//       await supabase
//         .from("transactions")
//         .update({
//           status: "failed",
//           external_response: { error: "Insufficient funds during deduction" }
//         })
//         .eq("id", pendingTx.id);
      
//       return NextResponse.json(
//         { message: "Insufficient wallet balance" },
//         { status: 400 }
//       );
//     }

//     console.log(`✅ Deducted ₦${totalDeduction} from user ${userId}. New balance: ₦${deductResult}`);

//     // ✅ Call Nomba API
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
//     console.log("📤 Nomba transfer response:", {
//       status: res.status,
//       data,
//       merchantTxRef,
//       nombaReference: data?.data?.reference,
//     });

//     // ✅ Update transaction with Nomba response
//     await supabase
//       .from("transactions")
//       .update({
//         status: "processing",
//         description: `Transfer of ₦${amount} to ${accountName}`,
//         reference: data?.data?.reference || null,
//         external_response: {
//           ...data,
//           merchant_tx_ref: merchantTxRef,
//           deducted_at: new Date().toISOString(),
//           deducted_amount: totalDeduction,
//           new_balance: deductResult
//         },
//       })
//       .eq("id", pendingTx.id);

//     return NextResponse.json({
//       message: "Transfer initiated successfully.",
//       transactionId: pendingTx.id,
//       merchantTxRef,
//       nombaResponse: data,
//       newBalance: deductResult
//     });

//   } catch (error: any) {
//     console.error("Withdraw API error:", error);
//     return NextResponse.json(
//       { error: "Server error: " + (error.message || error.description) },
//       { status: 500 }
//     );
//   }
// }

// app/api/withdraw/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getNombaToken } from "@/lib/nomba";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { isAuthenticated } from "@/lib/auth-check-api";
import { sendPinResetEmail } from "@/lib/email/pin-reset";

export async function POST(req: NextRequest) {
  const user = await isAuthenticated(req);

  if (!user) {
    return NextResponse.json(
      { error: "Please login to access transactions" },
      { status: 401 }
    );
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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
    } = await req.json();

    if (
      !userId ||
      !pin ||
      !amount ||
      amount < 100 ||
      !accountNumber ||
      !accountName ||
      !bankCode ||
      !bankName
    ) {
      return NextResponse.json(
        { message: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    // ✅ Verify user + PIN with attempt tracking
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, transaction_pin, wallet_balance, pin_attempts, pin_locked_until, email, first_name, last_name")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if PIN is locked
    if (userData.pin_locked_until && new Date(userData.pin_locked_until) > new Date()) {
      const lockedUntil = new Date(userData.pin_locked_until);
      const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
      
      return NextResponse.json(
        { 
          message: `PIN is locked due to multiple failed attempts. Please try again in ${minutesLeft} minutes or reset your PIN via email.`,
          locked: true,
          lockedUntil: userData.pin_locked_until
        },
        { status: 401 }
      );
    }

    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, userData.transaction_pin);
    
    if (!isValid) {
      // Increment PIN attempts
      const newAttempts = (userData.pin_attempts || 0) + 1;
      let updateData: any = { pin_attempts: newAttempts };
      let shouldSendEmail = false;
      
      // Lock after 3 attempts
      if (newAttempts >= 3) {
        const lockDuration = 30 * 60 * 1000; // 30 minutes lock
        updateData.pin_locked_until = new Date(Date.now() + lockDuration);
        
        // Generate reset token
        const resetToken = crypto.randomUUID();
        const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
        updateData.pin_reset_token = resetToken;
        updateData.pin_reset_token_expires = tokenExpiry;
        
        shouldSendEmail = true;
      }
      
      // Update attempts in database
      await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId);
      
      // Send reset email if threshold reached
      if (shouldSendEmail && userData.email) {
        const userName = userData.first_name && userData.last_name 
          ? `${userData.first_name} ${userData.last_name}`
          : undefined;
        
        await sendPinResetEmail(
          userData.email,
          updateData.pin_reset_token,
          userId,
          userName
        );
        
        return NextResponse.json(
          { 
            message: `PIN locked due to ${newAttempts} failed attempts. A reset link has been sent to your email.`,
            locked: true,
            remainingAttempts: 0,
            resetEmailSent: true
          },
          { status: 401 }
        );
      }
      
      const remainingAttempts = 3 - newAttempts;
      return NextResponse.json(
        { 
          message: `Invalid transaction PIN. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining before PIN is locked.`,
          remainingAttempts,
          attempts: newAttempts
        },
        { status: 401 }
      );
    }
    
    // ✅ PIN is valid - reset attempts on success
    await supabase
      .from("users")
      .update({
        pin_attempts: 0,
        pin_locked_until: null,
        pin_reset_token: null,
        pin_reset_token_expires: null
      })
      .eq("id", userId);

    const totalDeduction = totalDebit || amount + fee;
    if (userData.wallet_balance < totalDeduction) {
      return NextResponse.json(
        { message: "Insufficient wallet balance (including fees)" },
        { status: 400 }
      );
    }

    // ✅ Get Nomba token
    const token = await getNombaToken();
    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized: Nomba token missing" },
        { status: 401 }
      );
    }

    const merchantTxRef = `WD_${Date.now()}`;

    // ✅ Insert pending transaction FIRST
    const { data: pendingTx, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: "withdrawal",
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
        amount,
        fee,
        total_deduction: totalDeduction,
        status: "pending",
        narration: narration || "N/A",
        merchant_tx_ref: merchantTxRef,
      })
      .select("*")
      .single();

    if (txError || !pendingTx) {
      return NextResponse.json(
        { error: "Could not create transaction record" },
        { status: 500 }
      );
    }

    // ✅ Deduct wallet balance
    const { data: deductResult, error: deductError } = await supabase
      .rpc("deduct_wallet_balance_only", {
        user_id: userId,
        amt: totalDeduction
      });

    if (deductError) {
      console.error("Deduction error:", deductError);
      
      // If deduction fails, update transaction to failed
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          external_response: { error: deductError.message }
        })
        .eq("id", pendingTx.id);
      
      return NextResponse.json(
        { error: "Failed to deduct wallet balance: " + deductError.message },
        { status: 500 }
      );
    }

    // Check if deduction was successful
    if (deductResult === -1) {
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          external_response: { error: "Insufficient funds during deduction" }
        })
        .eq("id", pendingTx.id);
      
      return NextResponse.json(
        { message: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    console.log(`✅ Deducted ₦${totalDeduction} from user ${userId}. New balance: ₦${deductResult}`);

    // ✅ Call Nomba API
    const res = await fetch(`${process.env.NOMBA_URL}/v1/transfers/bank`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        accountId: process.env.NOMBA_ACCOUNT_ID!,
      },
      body: JSON.stringify({
        amount,
        accountNumber,
        accountName,
        bankCode,
        senderName,
        merchantTxRef,
        narration,
      }),
    });

    const data = await res.json();
    console.log("📤 Nomba transfer response:", {
      status: res.status,
      data,
      merchantTxRef,
      nombaReference: data?.data?.reference,
    });

    // ✅ Update transaction with Nomba response
    await supabase
      .from("transactions")
      .update({
        status: "processing",
        description: `Transfer of ₦${amount} to ${accountName}`,
        reference: data?.data?.reference || null,
        external_response: {
          ...data,
          merchant_tx_ref: merchantTxRef,
          deducted_at: new Date().toISOString(),
          deducted_amount: totalDeduction,
          new_balance: deductResult
        },
      })
      .eq("id", pendingTx.id);

    return NextResponse.json({
      message: "Transfer initiated successfully.",
      transactionId: pendingTx.id,
      merchantTxRef,
      nombaResponse: data,
      newBalance: deductResult
    });

  } catch (error: any) {
    console.error("Withdraw API error:", error);
    return NextResponse.json(
      { error: "Server error: " + (error.message || error.description) },
      { status: 500 }
    );
  }
}