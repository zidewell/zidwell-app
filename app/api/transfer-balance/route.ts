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
// app/api/withdraw/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getNombaToken } from "@/lib/nomba";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { isAuthenticated } from "@/lib/auth-check-api";

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

    // console.log({
    //   userId,
    //   senderName,
    //   senderAccountNumber,
    //   senderBankName,
    //   amount,
    //   accountNumber,
    //   accountName,
    //   bankName,
    //   bankCode,
    //   narration,
    //   pin,
    //   fee,
    //   totalDebit,
    // })

    // Validate required fields
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
        { 
          code: "400",
          message: "Missing or invalid required fields",
          description: "Request failed due to missing or invalid parameters"
        },
        { status: 400 }
      );
    }

    // ✅ Verify user + PIN
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, transaction_pin, wallet_balance")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { 
          code: "404",
          message: "User not found",
          description: "The specified user does not exist in our records"
        },
        { status: 404 }
      );
    }

    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, user.transaction_pin);
    if (!isValid) {
      return NextResponse.json(
        { 
          code: "401",
          message: "Invalid transaction PIN",
          description: "The provided transaction PIN is incorrect"
        },
        { status: 401 }
      );
    }

    const totalDeduction = totalDebit || (Number(amount) + Number(fee || 0));
    if (user.wallet_balance < totalDeduction) {
      return NextResponse.json(
        { 
          code: "400",
          message: "Insufficient wallet balance (including fees)",
          description: `Your wallet balance (₦${user.wallet_balance}) is insufficient for this transaction (₦${totalDeduction} needed)`
        },
        { status: 400 }
      );
    }

    // ✅ Get Nomba token
    let token;
    try {
      token = await getNombaToken();
    } catch (tokenError) {
      console.error("Failed to get Nomba token:", tokenError);
      return NextResponse.json(
        { 
          code: "401",
          message: "Authentication failed",
          description: "Unable to authenticate with payment provider"
        },
        { status: 401 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { 
          code: "401",
          message: "Unauthorized: Nomba token missing",
          description: "Could not obtain authentication token from payment provider"
        },
        { status: 401 }
      );
    }

    // Generate merchant transaction reference (this will be used to match with webhook)
    const merchantTxRef = `WD_${Date.now()}_${Math.random().toString(36).substring(7)}`;


    const { data: pendingTx, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: "withdrawal",
        sender: {
          name: senderName || "User",
          accountNumber: senderAccountNumber || "N/A",
          bankName: senderBankName || "Zidwell Wallet",
        },
        receiver: {
          name: accountName,
          accountNumber,
          bankName,
          bankCode, // Store bank code for reference matching
        },
        amount: Number(amount),
        fee: Number(fee || 0),
        total_deduction: totalDeduction,
        status: "pending",
        narration: narration || "N/A",
        // Store multiple reference fields
        merchant_tx_ref: merchantTxRef,
        reference: merchantTxRef,
        
        // Store all additional data in external_response JSONB
        external_response: {
          withdrawal_details: {
            bank_code: bankCode,
            account_number: accountNumber,
            account_name: accountName,
            bank_name: bankName,
            amount: Number(amount),
            narration: narration || "N/A",
            merchant_tx_ref: merchantTxRef,
            initiated_at: new Date().toISOString()
          },
          references: {
            merchant_tx_ref: merchantTxRef,
            reference: merchantTxRef,
            search_refs: [
              merchantTxRef,
              `WD_${Date.now()}`,
              merchantTxRef.replace(/[^a-zA-Z0-9]/g, '')
            ]
          },
          receiver_details: {
            account_number: accountNumber,
            account_name: accountName,
            bank_code: bankCode,
            bank_name: bankName,
            amount: Number(amount)
          },
          status: "pending",
          created_at: new Date().toISOString(),
          metadata: {
            initiated_at: new Date().toISOString(),
            user_id: userId,
            sender_name: senderName || "User"
          }
        }
      })
      .select("*")
      .single();

    if (txError || !pendingTx) {
      console.error("Transaction creation error:", txError);
      return NextResponse.json(
        { 
          code: "500",
          error: "Could not create transaction record",
          description: "Database error while creating transaction"
        },
        { status: 500 }
      );
    }

    console.log("✅ Transaction created:", {
      id: pendingTx.id,
      merchant_tx_ref: pendingTx.merchant_tx_ref,
      reference: pendingTx.reference
    });

    // ✅ Deduct wallet balance WITHOUT creating a transaction
    // Using the new RPC function that ONLY deducts balance, no transaction creation
    const { data: newBalance, error: rpcError } = await supabase
      .rpc("deduct_wallet_balance_only", {
        user_id: userId,
        amt: totalDeduction
      });

    if (rpcError) {
      console.error("Wallet deduction error:", rpcError);
      
      // Update transaction to failed
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          external_response: {
            ...(pendingTx.external_response || {}),
            error: {
              message: rpcError.message,
              stage: "wallet_deduction",
              timestamp: new Date().toISOString()
            }
          }
        })
        .eq("id", pendingTx.id);
      
      return NextResponse.json(
        { 
          code: "500",
          error: "Failed to deduct wallet balance",
          description: rpcError.message
        },
        { status: 500 }
      );
    }

    // Check if insufficient funds (RPC returns -1 for insufficient funds)
    if (newBalance === -1) {
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          external_response: {
            ...(pendingTx.external_response || {}),
            error: {
              message: "Insufficient funds",
              stage: "wallet_deduction",
              timestamp: new Date().toISOString()
            }
          }
        })
        .eq("id", pendingTx.id);
      
      return NextResponse.json(
        { 
          code: "400",
          error: "Insufficient funds",
          description: "Your wallet balance is insufficient for this transaction"
        },
        { status: 400 }
      );
    }

    console.log(`✅ Wallet deducted. New balance: ₦${newBalance}`);

    // Update transaction with wallet deduction info
    await supabase
      .from("transactions")
      .update({
        external_response: {
          ...(pendingTx.external_response || {}),
          wallet_deduction: {
            completed_at: new Date().toISOString(),
            new_balance: newBalance,
            amount_deducted: totalDeduction
          }
        }
      })
      .eq("id", pendingTx.id);

    // ✅ Call Nomba Transfer API
    let nombaResponse;
    let nombaStatus;
    
    try {
      const res = await fetch(`${process.env.NOMBA_URL}/v1/transfers/bank`, {
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
          senderName: senderName || "Zidwell User",
          merchantTxRef,
          narration: narration || "Withdrawal from Zidwell",
        }),
      });

      nombaStatus = res.status;
      const responseText = await res.text();
      
      try {
        nombaResponse = JSON.parse(responseText);
      } catch {
        nombaResponse = { raw: responseText };
      }

      // Handle non-200 status codes
      if (!res.ok) {
        console.error(`Nomba API error (${nombaStatus}):`, nombaResponse);

        const refundRef = `REFUND_${merchantTxRef}`;
        const { error: refundError } = await supabase.rpc("increment_wallet_balance", {
          user_id: userId,
          amt: totalDeduction,
        });

        if (refundError) {
          console.error("Critical: Failed to refund user after failed transfer:", refundError);
        }

        // Map status code to appropriate response
        const errorResponses = {
          400: {
            code: "400",
            message: "Transfer failed",
            description: nombaResponse.description || "Invalid transfer parameters",
            details: nombaResponse
          },
          401: {
            code: "401",
            message: "Authentication failed",
            description: nombaResponse.description || "Unauthorized - invalid or expired token",
            details: nombaResponse
          },
          403: {
            code: "403",
            message: "Access forbidden",
            description: nombaResponse.description || "You don't have permission to perform this transfer",
            details: nombaResponse
          },
          404: {
            code: "404",
            message: "Resource not found",
            description: nombaResponse.description || "The requested resource was not found",
            details: nombaResponse
          },
          429: {
            code: "429",
            message: "Too many requests",
            description: nombaResponse.description || "Rate limit exceeded. Please try again later",
            details: nombaResponse
          },
          500: {
            code: "500",
            message: "Server error",
            description: nombaResponse.description || "Payment provider server error",
            details: nombaResponse
          }
        };

        const errorResponse = errorResponses[nombaStatus as keyof typeof errorResponses] || {
          code: String(nombaStatus),
          message: "Transfer failed",
          description: nombaResponse.description || "Unknown error occurred",
          details: nombaResponse
        };

        // Update transaction with failure details
        await supabase
          .from("transactions")
          .update({
            status: "failed",
            description: `Transfer failed: ${errorResponse.description}`,
            reference: nombaResponse.data?.id || null,
            external_response: {
              ...(pendingTx.external_response || {}),
              ...nombaResponse,
              nomba_status: nombaStatus,
              error_code: errorResponse.code,
              refunded: true,
              refund_amount: totalDeduction,
              refund_reference: refundRef,
              timestamp: new Date().toISOString()
            },
          })
          .eq("id", pendingTx.id);

        return NextResponse.json(errorResponse, { status: nombaStatus });
      }

      // ✅ Handle 200 Success
      // Update transaction with processing status
      await supabase
        .from("transactions")
        .update({
          status: "processing", // Will be updated to success via webhook
          description: `Transfer of ₦${amount} to ${accountName}`,
          reference: nombaResponse.data?.id || nombaResponse.data?.meta?.sessionId || null,
          external_response: {
            ...(pendingTx.external_response || {}),
            ...nombaResponse,
            nomba_status: nombaStatus,
            nomba_transaction_id: nombaResponse.data?.id,
            fee_breakdown: {
              amount: Number(amount),
              nomba_fee: nombaResponse.fee || 0,
              app_fee: Number(fee || 0),
              total_fee: (nombaResponse.fee || 0) + Number(fee || 0),
              total_deduction: totalDeduction
            },
            webhook_data: {
              expected: true,
              merchant_tx_ref: merchantTxRef,
              sent_at: new Date().toISOString()
            }
          },
        })
        .eq("id", pendingTx.id);

      console.log(`✅ Transfer initiated successfully for transaction ${pendingTx.id}`);

      return NextResponse.json({
        code: "200",
        message: "Transfer initiated successfully",
        description: "Your transfer has been submitted and is being processed",
        data: {
          transactionId: pendingTx.id,
          merchantTxRef,
          amount: Number(amount),
          recipient: accountName,
          accountNumber,
          bankName,
          status: "processing",
          nombaReference: nombaResponse.data?.id,
          nombaResponse: nombaResponse,
          fee_breakdown: {
            nomba_fee: nombaResponse.fee || 0,
            app_fee: Number(fee || 0),
            total_fee: (nombaResponse.fee || 0) + Number(fee || 0),
            total_deduction: totalDeduction
          }
        }
      });

    } catch (fetchError: any) {
      // Network error or fetch itself failed
      console.error("Network error calling Nomba API:", fetchError);

      // REFUND THE USER
      const refundRef = `REFUND_${merchantTxRef}`;
      await supabase.rpc("increment_wallet_balance", {
        user_id: userId,
        amt: totalDeduction,
      });

      await supabase
        .from("transactions")
        .update({
          status: "failed",
          description: "Transfer failed due to network error",
          external_response: {
            ...(pendingTx.external_response || {}),
            error: {
              message: fetchError.message,
              code: "NETWORK_ERROR",
              stack: process.env.NODE_ENV === "development" ? fetchError.stack : undefined
            },
            refunded: true,
            refund_amount: totalDeduction,
            refund_reference: refundRef,
            timestamp: new Date().toISOString()
          },
        })
        .eq("id", pendingTx.id);

      return NextResponse.json(
        { 
          code: "500",
          error: "Network error",
          description: "Unable to connect to payment provider. Your funds have been refunded.",
          details: fetchError.message
        },
        { status: 503 } 
      );
    }

  } catch (error: any) {
    console.error("Withdraw API unexpected error:", error);
    
    return NextResponse.json(
      { 
        code: "500",
        error: "Server error",
        description: error.message || "An unexpected error occurred",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}