// app/api/buy-data/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { getNombaToken } from "@/lib/nomba";
import bcrypt from "bcryptjs";
import { transporter } from "@/lib/node-mailer";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL
    : process.env.NEXT_PUBLIC_BASE_URL;

const userCache = new Map();

async function getCachedUser(userId: string) {
  const cacheKey = `user_${userId}`;
  const cached = userCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 2 * 60 * 1000)
    return cached.data;

  const { data: user, error } = await supabase
    .from("users")
    .select(
      "transaction_pin, wallet_balance, zidcoin_balance, email, first_name",
    )
    .eq("id", userId)
    .single();

  if (user && !error)
    userCache.set(cacheKey, { data: user, timestamp: Date.now() });
  return user;
}

async function sendEmailNotification(
  userId: string,
  status: "success" | "failed" | "pending",
  amount: number,
  phoneNumber: string,
  network: string,
  transactionId?: string | null,
  errorDetail?: string,
) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("email, first_name")
      .eq("id", userId)
      .single();
    if (error || !user) return;

    const subject =
      status === "success"
        ? `Data Purchase Successful - ₦${amount} ${network}`
        : `Data Purchase Failed - ₦${amount} ${network}`;
    const greeting = user.first_name ? `Hi ${user.first_name},` : "Hello,";
    const headerImageUrl = `${baseUrl}/zidwell-header.png`;
    const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

    await transporter.sendMail({
      from: `"Zidwell" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject,
      html: `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background:#f3f4f6;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
    <tr><td align="center">
        <table width="600" style="background:#fff; border-radius:8px;">
            <tr><td><img src="${headerImageUrl}" style="width:100%;" /></td></tr>
            <tr><td style="padding:24px;">
                <p>${greeting}</p>
                <h3 style="color: ${status === "success" ? "#22c55e" : "#ef4444"};">${status === "success" ? "✅ Data Purchase Successful" : "❌ Data Purchase Failed"}</h3>
                <div style="background:#f8fafc; padding:15px; border-radius:8px; margin:15px 0;">
                    <p><strong>Amount:</strong> ₦${amount}</p>
                    <p><strong>Network:</strong> ${network}</p>
                    <p><strong>Phone:</strong> ${phoneNumber}</p>
                    <p><strong>Transaction ID:</strong> ${transactionId || "N/A"}</p>
                    ${status === "failed" ? `<p><strong>Reason:</strong> ${errorDetail || "Transaction failed"}</p>` : ""}
                </div>
                <p>Thank you for using Zidwell!</p>
            </td></tr>
            <tr><td><img src="${footerImageUrl}" style="width:100%;" /></td></tr>
        </table>
    </td></tr>
</table>
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
    const response = NextResponse.json(
      { error: "Please login to access transactions", logout: true },
      { status: 401 },
    );
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  let transactionId: string | null = null;
  let userId: string | undefined;
  let amount: number | undefined;
  let phoneNumber: string | undefined;
  let network: string | undefined;

  try {
    const token = await getNombaToken();
    if (!token) {
      const response = NextResponse.json(
        { error: "Unable to authenticate with Nomba", logout: true },
        { status: 401 },
      );
      if (newTokens)
        return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    const body = await req.json();
    userId = body.userId;
    amount = body.amount;
    phoneNumber = body.phoneNumber;
    network = body.network;
    const { senderName, pin, merchantTxRef } = body;

    if (!userId || !pin || !amount || !phoneNumber || !network) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 },
      );
    }

    if (userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized: User ID mismatch" },
        { status: 403 },
      );
    }

    const finalMerchantTxRef =
      merchantTxRef ||
      `DATA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const parsedAmount = Number(amount);
    const cachedUser = await getCachedUser(userId);
    if (!cachedUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, cachedUser.transaction_pin);
    if (!isValid)
      return NextResponse.json(
        { message: "Invalid transaction PIN" },
        { status: 401 },
      );

    if (cachedUser.wallet_balance < parsedAmount) {
      return NextResponse.json(
        { message: "Insufficient wallet balance" },
        { status: 400 },
      );
    }

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "deduct_wallet_balance",
      {
        user_id: userId,
        amt: parsedAmount,
        transaction_type: "data",
        reference: finalMerchantTxRef,
        description: `Data purchase on ${network} for ${phoneNumber}`,
      },
    );

    if (rpcError || rpcResult[0].status !== "OK") {
      return NextResponse.json(
        { message: "Insufficient wallet balance" },
        { status: 400 },
      );
    }

    transactionId = rpcResult[0].tx_id;

    const response = await axios.post(
      `${process.env.NOMBA_URL}/v1/bill/data`,
      {
        amount: parsedAmount,
        phoneNumber,
        network,
        merchantTxRef: finalMerchantTxRef,
        senderName: senderName || "Zidwell User",
      },
      {
        headers: {
          accountId: process.env.NOMBA_ACCOUNT_ID!,
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      },
    );

    const responseCode = response.data?.code?.toString();
    const nombaStatus = response.data?.status;
    const responseDescription = response.data?.description || "";
    let transactionStatus = "success";
    let emailStatus: "success" | "pending" | "failed" = "success";

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

    await supabase
      .from("transactions")
      .update({
        status: transactionStatus,
        external_response: response.data,
        merchant_tx_ref: finalMerchantTxRef,
      })
      .eq("id", transactionId);
    await supabase.rpc("award_zidcoin_cashback", {
      p_user_id: userId,
      p_transaction_id: transactionId,
      p_transaction_type: "data",
      p_amount: amount,
    });
    await sendEmailNotification(
      userId,
      emailStatus,
      parsedAmount,
      phoneNumber,
      network,
      transactionId,
    );

    const responseData = {
      success: true,
      message: `Data purchase ${transactionStatus}`,
      status: transactionStatus,
      zidCoinBalance: cachedUser?.zidcoin_balance,
      transactionId,
    };
    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Data Purchase Error:", error.message);
    if (userId && amount && transactionId)
      await supabase.rpc("refund_wallet_balance", {
        user_id: userId,
        amt: Number(amount),
      });
    if (userId && amount && phoneNumber && network)
      await sendEmailNotification(
        userId,
        "failed",
        Number(amount),
        phoneNumber,
        network,
        transactionId,
        error.message,
      );
    return NextResponse.json(
      { error: "Data purchase failed", detail: error.message },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    const response = NextResponse.json(
      { error: "Please login to access transactions", logout: true },
      { status: 401 },
    );
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get("transactionId");
    const merchantTxRef = searchParams.get("merchantTxRef");

    if (!transactionId && !merchantTxRef) {
      return NextResponse.json(
        { message: "transactionId or merchantTxRef is required" },
        { status: 400 },
      );
    }

    let query = supabase.from("transactions").select("*").eq("type", "data");
    if (transactionId) query = query.eq("id", transactionId);
    else if (merchantTxRef) query = query.eq("merchant_tx_ref", merchantTxRef);

    const { data: transaction, error } = await query.single();
    if (error)
      return NextResponse.json(
        { message: "Transaction not found" },
        { status: 404 },
      );

    const responseData = {
      transactionId: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      createdAt: transaction.created_at,
    };
    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Check transaction status error:", error);
    return NextResponse.json(
      { message: "Failed to check transaction status" },
      { status: 500 },
    );
  }
}
