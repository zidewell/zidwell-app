// app/api/buy-airtime/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getNombaToken } from "@/lib/nomba";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { transporter } from "@/lib/node-mailer";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl = process.env.NODE_ENV === "development" ? process.env.NEXT_PUBLIC_DEV_URL : process.env.NEXT_PUBLIC_BASE_URL;

const userCache = new Map();

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

async function sendEmailNotification(
  userId: string,
  status: "success" | "failed" | "pending",
  amount: number,
  phoneNumber: string,
  network: string,
  transactionId?: string,
  errorDetail?: string
) {
  try {
    const { data: user, error } = await supabase.from("users").select("email, first_name").eq("id", userId).single();
    if (error || !user) return;

    const subject = status === "success" ? `Airtime Purchase Successful - ₦${amount} ${network}` : `Airtime Purchase Failed - ₦${amount} ${network}`;
    const greeting = user.first_name ? `Hi ${user.first_name},` : "Hello,";
    const headerImageUrl = `${baseUrl}/zidwell-header.png`;
    const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

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
      <h3 style="color: ${status === "success" ? "#22c55e" : "#ef4444"};">${status === "success" ? "✅ Airtime Purchase Successful" : "❌ Airtime Purchase Failed"}</h3>
      <div style="background:#f8fafc; padding:15px; border-radius:8px; margin:15px 0;">
        <p><strong>Amount:</strong> ₦${amount}</p>
        <p><strong>Network:</strong> ${network}</p>
        <p><strong>Phone Number:</strong> ${phoneNumber}</p>
        <p><strong>Transaction ID:</strong> ${transactionId || "N/A"}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        ${status === "failed" ? `<p><strong>Reason:</strong> ${errorDetail || "Transaction failed"}</p>` : ""}
      </div>
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
  let merchantTxRef: string | undefined;

  try {
    const body = await req.json();
    userId = body.userId;
    amount = body.amount;
    phoneNumber = body.phoneNumber;
    network = body.network;
    merchantTxRef = body.merchantTxRef;
    const { senderName, pin } = body;

    if (!userId || !pin || !amount || amount < 100 || !phoneNumber || !network) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    if (userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized: User ID mismatch" }, { status: 403 });
    }

    const finalMerchantTxRef = merchantTxRef || `AIRTIME-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const token = await getNombaToken();
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const cachedUser = await getCachedUser(userId);
    if (!cachedUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, cachedUser.transaction_pin);
    if (!isValid) return NextResponse.json({ message: "Invalid Transaction PIN" }, { status: 401 });

    if (cachedUser.wallet_balance < amount) {
      return NextResponse.json({ message: "Insufficient wallet balance" }, { status: 400 });
    }

    const { data: rpcResult, error: rpcError } = await supabase.rpc("deduct_wallet_balance", {
      user_id: userId,
      amt: amount,
      transaction_type: "airtime",
      reference: finalMerchantTxRef,
      description: `Airtime on ${network} for ${phoneNumber}`,
    });

    if (rpcError || rpcResult[0].status !== "OK") {
      return NextResponse.json({ message: "Insufficient wallet balance" }, { status: 400 });
    }

    transactionId = rpcResult[0].tx_id;

    const response = await axios.post(
      `${process.env.NOMBA_URL}/v1/bill/topup`,
      { amount, phoneNumber, network, merchantTxRef: finalMerchantTxRef, senderName: senderName || "Zidwell User" },
      { headers: { accountId: process.env.NOMBA_ACCOUNT_ID!, Authorization: `Bearer ${token}` }, timeout: 30000 }
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
    } else if (nombaStatus === "SUCCESS" || nombaStatus === "Success" || nombaStatus === "Completed") {
      transactionStatus = "success";
      emailStatus = "success";
    } else if (nombaStatus === "Processing" || nombaStatus === "PENDING") {
      transactionStatus = "pending";
      emailStatus = "pending";
    } else {
      transactionStatus = "pending";
      emailStatus = "pending";
    }

    await supabase.from("transactions").update({ status: transactionStatus, external_response: response.data, merchant_tx_ref: finalMerchantTxRef }).eq("id", transactionId);
    await supabase.rpc("award_zidcoin_cashback", { p_user_id: userId, p_transaction_id: transactionId, p_transaction_type: "airtime", p_amount: amount });
    await sendEmailNotification(userId, emailStatus, amount, phoneNumber, network, transactionId || undefined);

    const responseData = { message: `Airtime purchase ${transactionStatus}`, status: transactionStatus, transactionId, zidCoinBalance: cachedUser?.zidcoin_balance };
    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Airtime Purchase Error:", error.message);
    if (userId && amount && transactionId) await supabase.rpc("refund_wallet_balance", { user_id: userId, amt: amount });
    if (userId && amount && phoneNumber && network) await sendEmailNotification(userId, "failed", amount, phoneNumber, network, transactionId || undefined, error.message);
    return NextResponse.json({ message: "Transaction failed", detail: error.message }, { status: 500 });
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
    if (error) return NextResponse.json({ message: "Transaction not found" }, { status: 404 });

    const responseData = { transactionId: transaction.id, status: transaction.status, amount: transaction.amount, createdAt: transaction.created_at };
    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Check transaction status error:", error);
    return NextResponse.json({ message: "Failed to check transaction status" }, { status: 500 });
  }
}