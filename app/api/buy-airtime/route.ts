// app/api/buy-airtime/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { transporter } from "@/lib/node-mailer";
import { getNombaToken } from "@/lib/nomba";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl = process.env.NODE_ENV === "development" ? process.env.NEXT_PUBLIC_DEV_URL : process.env.NEXT_PUBLIC_BASE_URL;

const userCache = new Map();
const idempotencyCache = new Map();

async function getCachedUser(userId: string) {
  const cacheKey = `user_${userId}`;
  const cached = userCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 2 * 60 * 1000) return cached.data;

  const { data: user, error } = await supabase
    .from("users")
    .select("transaction_pin, wallet_balance, zidcoin_balance, email, first_name")
    .eq("id", userId)
    .single();

  if (user && !error) userCache.set(cacheKey, { data: user, timestamp: Date.now() });
  return user;
}

async function getCurrentExternalResponse(transactionId: string) {
  const { data } = await supabase
    .from("transactions")
    .select("external_response")
    .eq("id", transactionId)
    .single();
  return data?.external_response || {};
}

async function sendEmailNotification(
  userId: string,
  status: "success" | "failed" | "pending",
  amount: number,
  phoneNumber: string,
  network: string,
  transactionId?: string,
  errorDetail?: string,
  beforeBalance?: number,
  afterBalance?: number,
) {
  try {
    const { data: user, error } = await supabase.from("users").select("email, first_name").eq("id", userId).single();
    if (error || !user) return;

    const subject = status === "success" 
      ? `Airtime Purchase Successful - ₦${amount} ${network}` 
      : status === "pending"
      ? `Airtime Purchase Pending - ₦${amount} ${network}`
      : `Airtime Purchase Failed - ₦${amount} ${network}`;
    const greeting = user.first_name ? `Hi ${user.first_name},` : "Hello,";
    const headerImageUrl = `${baseUrl}/zidwell-header.png`;
    const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

    let balanceHtml = "";
    if (beforeBalance !== undefined && afterBalance !== undefined) {
      balanceHtml = `
        <div style="background:#f0fdf4; padding:15px; border-radius:8px; margin:15px 0;">
          <p><strong>Before Balance:</strong> ₦${beforeBalance.toFixed(2)}</p>
          <p><strong>After Balance:</strong> ₦${afterBalance.toFixed(2)}</p>
          <p><strong>Amount Deducted:</strong> ₦${amount.toFixed(2)}</p>
        </div>
      `;
    }

    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject,
      html: `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background:#f3f4f6;">
  <div style="max-width:600px; margin:0 auto; background:#fff;">
    <img src="${headerImageUrl}" style="width:100%;" />
    <div style="padding:20px;">
      <p>${greeting}</p>
      <h3 style="color: ${status === "success" ? "#22c55e" : status === "pending" ? "#f59e0b" : "#ef4444"};">${status === "success" ? "✅ Airtime Purchase Successful" : status === "pending" ? "⏳ Airtime Purchase Pending" : "❌ Airtime Purchase Failed"}</h3>
      <div style="background:#f8fafc; padding:15px; border-radius:8px; margin:15px 0;">
        <p><strong>Amount:</strong> ₦${amount}</p>
        <p><strong>Network:</strong> ${network}</p>
        <p><strong>Phone Number:</strong> ${phoneNumber}</p>
        <p><strong>Transaction ID:</strong> ${transactionId || "N/A"}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        ${status === "failed" ? `<p><strong>Reason:</strong> ${errorDetail || "Transaction failed"}</p>` : ""}
      </div>
      ${balanceHtml}
      <p>Thank you for using Zidwell!</p>
    </div>
    <img src="${footerImageUrl}" style="width:100%;" />
  </div>
</body>
</html>`,
    });
  } catch (emailError) {
    console.error("Failed to send email notification:", emailError);
  }
}

export async function POST(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);
  
  if (!user) {
    const response = NextResponse.json({ error: "Please login to access transactions", logout: true }, { status: 401 });
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  let transactionId: string | null = null;
  let userId: string | undefined;
  let amount: number | undefined;
  let phoneNumber: string | undefined;
  let network: string | undefined;
  let beforeBalance: number | undefined;
  let afterBalance: number | undefined;
  let deductionCommitted = false;

  try {
    const body = await req.json();
    
    const idempotencyKey = req.headers.get("Idempotency-Key") || 
                           req.headers.get("idempotency-key") ||
                           body.merchantTxRef ||
                           body.idempotencyKey;

    userId = body.userId;
    amount = body.amount;
    phoneNumber = body.phoneNumber;
    network = body.network;
    const { senderName, pin, merchantTxRef } = body;

    if (!userId || !pin || !amount || amount < 100 || !phoneNumber || !network) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    if (userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized: User ID mismatch" }, { status: 403 });
    }

    const finalMerchantTxRef = merchantTxRef || 
                               idempotencyKey ||
                               `AIRTIME-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Check idempotency cache
    if (idempotencyCache.has(finalMerchantTxRef)) {
      console.log(`🔄 Idempotency: Returning cached response for ${finalMerchantTxRef}`);
      const cachedResponse = idempotencyCache.get(finalMerchantTxRef);
      if (newTokens) {
        return createAuthResponse(cachedResponse, newTokens);
      }
      return NextResponse.json(cachedResponse);
    }

    // Check for existing transaction using "reference" column
    const { data: existingTx, error: findError } = await supabase
      .from("transactions")
      .select("id, status, amount, balance_before, balance_after, external_response")
      .eq("reference", finalMerchantTxRef)
      .maybeSingle();

    if (!findError && existingTx) {
      console.log(`🔄 Idempotency: Found existing transaction ${existingTx.id}`);
      const responseData = {
        success: true,
        message: `Transaction already processed`,
        status: existingTx.status,
        transactionId: existingTx.id,
        amount: existingTx.amount,
        balance_before: existingTx.balance_before,
        balance_after: existingTx.balance_after,
        external_response: existingTx.external_response,
        idempotent: true,
      };
      
      idempotencyCache.set(finalMerchantTxRef, responseData);
      setTimeout(() => idempotencyCache.delete(finalMerchantTxRef), 10 * 60 * 1000);
      
      if (newTokens) {
        return createAuthResponse(responseData, newTokens);
      }
      return NextResponse.json(responseData);
    }

    const token = await getNombaToken();
    if (!token) {
      const response = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    const cachedUser = await getCachedUser(userId);
    if (!cachedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, cachedUser.transaction_pin);
    if (!isValid) {
      return NextResponse.json({ message: "Invalid Transaction PIN" }, { status: 401 });
    }

    beforeBalance = cachedUser.wallet_balance;

    if (cachedUser.wallet_balance < amount) {
      return NextResponse.json({ message: "Insufficient wallet balance" }, { status: 400 });
    }

    // ✅ Call Nomba API FIRST before deducting
    let nombaResponse;
    try {
      nombaResponse = await axios.post(
        `${process.env.NOMBA_URL}/v1/bill/topup`,
        { 
          amount, 
          phoneNumber, 
          network, 
          merchantTxRef: finalMerchantTxRef, 
          senderName: senderName || "Zidwell User" 
        },
        { 
          headers: { 
            accountId: process.env.NOMBA_ACCOUNT_ID!, 
            Authorization: `Bearer ${token}`,
            "Idempotency-Key": finalMerchantTxRef,
          }, 
          timeout: 30000 
        }
      );
    } catch (nombaError: any) {
      console.error("Nomba API Error:", nombaError.message);
      
      // Just return error, no transaction created yet
      return NextResponse.json(
        { error: "Payment provider error", detail: nombaError.message },
        { status: 502 },
      );
    }

    // ✅ Now call the RPC to deduct balance (this will create the transaction)
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "deduct_wallet_balance",
      {
        user_id: userId,
        amt: amount,
        transaction_type: "airtime",
        reference: finalMerchantTxRef,
        description: `Airtime on ${network} for ${phoneNumber}`,
      }
    );

    if (rpcError || !rpcResult || rpcResult[0].status !== "OK") {
      console.error("Deduction failed:", rpcError);
      
      // Nomba succeeded but deduction failed - critical error
      return NextResponse.json(
        { error: "Transaction failed during processing", detail: rpcError?.message },
        { status: 500 },
      );
    }

    transactionId = rpcResult[0].tx_id;
    deductionCommitted = true;
    afterBalance = rpcResult[0].new_balance || beforeBalance - amount;

    // Determine status from Nomba response
    const responseCode = nombaResponse.data?.code?.toString();
    const nombaStatus = nombaResponse.data?.status;
    const responseDescription = nombaResponse.data?.description || "";
    let transactionStatus = "pending";
    let emailStatus: "success" | "pending" | "failed" = "pending";

    if (responseCode === "00" && responseDescription === "SUCCESS") {
      transactionStatus = "success";
      emailStatus = "success";
    } else if (responseCode === "00") {
      transactionStatus = "pending";
      emailStatus = "pending";
    } else if (
      nombaStatus === "SUCCESS" ||
      nombaStatus === "Success" ||
      nombaStatus === "Completed"
    ) {
      transactionStatus = "success";
      emailStatus = "success";
    } else if (nombaStatus === "Processing" || nombaStatus === "PENDING") {
      transactionStatus = "pending";
      emailStatus = "pending";
    } else {
      transactionStatus = "pending";
      emailStatus = "pending";
    }

    // ✅ Update the transaction (created by RPC) with Nomba response
    await supabase
      .from("transactions")
      .update({
        status: transactionStatus,
        balance_before: beforeBalance,
        balance_after: afterBalance,
        deducted_at: new Date().toISOString(),
        merchant_tx_ref: finalMerchantTxRef,
        phone_number: phoneNumber,
        network: network,
        external_response: {
          nomba_response: nombaResponse.data,
          status: transactionStatus,
          completed_at: transactionStatus === "success" ? new Date().toISOString() : null,
          merchant_tx_ref: finalMerchantTxRef,
          balance_before: beforeBalance,
          balance_after: afterBalance,
        },
      })
      .eq("id", transactionId);

    // Award cashback on success
    if (transactionStatus === "success") {
      await supabase.rpc("award_zidcoin_cashback", {
        p_user_id: userId,
        p_transaction_id: transactionId,
        p_transaction_type: "airtime",
        p_amount: amount,
      });
    }

    // Send email notification
    await sendEmailNotification(
      userId,
      emailStatus,
      amount,
      phoneNumber,
      network,
      transactionId || undefined,
      undefined,
      beforeBalance,
      afterBalance,
    );

    const responseData = {
      success: true,
      message: `Airtime purchase ${transactionStatus}`,
      status: transactionStatus,
      transactionId,
      zidCoinBalance: cachedUser?.zidcoin_balance,
      balance_before: beforeBalance,
      balance_after: afterBalance,
      amount: amount,
      idempotent: false,
    };

    // Cache response for idempotency
    idempotencyCache.set(finalMerchantTxRef, responseData);
    setTimeout(() => idempotencyCache.delete(finalMerchantTxRef), 10 * 60 * 1000);

    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    console.error("Airtime Purchase Error:", error.message);
    
    if (userId && amount && transactionId && deductionCommitted) {
      await supabase.rpc("refund_wallet_balance", {
        user_id: userId,
        amt: amount,
      });
      
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          external_response: {
            ...(await getCurrentExternalResponse(transactionId)),
            error: error.message,
            refunded: true,
            refunded_at: new Date().toISOString(),
            failed_at: new Date().toISOString(),
          },
        })
        .eq("id", transactionId);
    }
    
    if (userId && amount && phoneNumber && network) {
      await sendEmailNotification(
        userId,
        "failed",
        amount,
        phoneNumber,
        network,
        transactionId || undefined,
        error.message,
        beforeBalance,
        beforeBalance,
      );
    }
    
    return NextResponse.json(
      { message: "Transaction failed", detail: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);
  
  if (!user) {
    const response = NextResponse.json({ error: "Please login to access transactions", logout: true }, { status: 401 });
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get("transactionId");
    const merchantTxRef = searchParams.get("merchantTxRef");

    if (!transactionId && !merchantTxRef) {
      return NextResponse.json({ message: "transactionId or merchantTxRef is required" }, { status: 400 });
    }

    let query = supabase.from("transactions").select("*").eq("type", "airtime");
    if (transactionId) query = query.eq("id", transactionId);
    else if (merchantTxRef) query = query.eq("merchant_tx_ref", merchantTxRef);

    const { data: transaction, error } = await query.single();
    if (error) {
      return NextResponse.json({ message: "Transaction not found" }, { status: 404 });
    }

    const responseData = {
      transactionId: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      createdAt: transaction.created_at,
      balance_before: transaction.balance_before,
      balance_after: transaction.balance_after,
      externalResponse: transaction.external_response,
    };
    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Check transaction status error:", error);
    return NextResponse.json({ message: "Failed to check transaction status" }, { status: 500 });
  }
}