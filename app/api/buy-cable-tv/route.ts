// app/api/buy-cabletv/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import bcrypt from "bcryptjs";
import { getNombaToken } from "@/lib/nomba";
import { createClient } from "@supabase/supabase-js";
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

  if (cached && Date.now() - cached.timestamp < 2 * 60 * 1000) {
    return cached.data;
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("wallet_balance, transaction_pin, zidcoin_balance, email, first_name")
    .eq("id", userId)
    .single();

  if (user && !error) {
    userCache.set(cacheKey, { data: user, timestamp: Date.now() });
  }

  return user;
}

async function sendCableTVEmailNotification(
  userId: string,
  status: "success" | "failed",
  amount: number,
  customerId: string,
  cableTvPaymentType: string,
  transactionId?: string | null,
  errorDetail?: string,
  subscriptionData?: any
) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("email, first_name")
      .eq("id", userId)
      .single();

    if (error || !user) return;

    const subject = status === "success" ? `Cable TV Purchase Successful - ₦${amount}` : `Cable TV Purchase Failed - ₦${amount}`;
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
<body style="margin:0; padding:0; background:#f3f4f6; font-family:Arial, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
    <tr>
        <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">
                <tr><td><img src="${headerImageUrl}" style="width:100%;" /></td></tr>
                <tr>
                    <td style="padding:24px;">
                        <p>${greeting}</p>
                        <h3 style="color: ${status === "success" ? "#22c55e" : "#ef4444"};">${status === "success" ? "✅ Cable TV Purchase Successful" : "❌ Cable TV Purchase Failed"}</h3>
                        <div style="background:#f8fafc; padding:15px; border-radius:8px; margin:15px 0;">
                            <p><strong>Amount:</strong> ₦${amount}</p>
                            <p><strong>Provider:</strong> ${cableTvPaymentType}</p>
                            <p><strong>Customer ID:</strong> ${customerId}</p>
                            <p><strong>Transaction ID:</strong> ${transactionId || "N/A"}</p>
                            ${status === "failed" ? `<p><strong>Status:</strong> ${errorDetail || "Transaction failed"}</p>` : ""}
                        </div>
                        <p>Thank you for using Zidwell!</p>
                    </td>
                </tr>
                <tr><td><img src="${footerImageUrl}" style="width:100%;" /></td></tr>
            </table>
        </td>
    </tr>
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
    const response = NextResponse.json({ error: "Please login to access transactions", logout: true }, { status: 401 });
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  let transactionId: string | null = null;

  try {
    const token = await getNombaToken();
    if (!token) {
      const response = NextResponse.json({ error: "Unauthorized", logout: true }, { status: 401 });
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    const body = await req.json();
    const { pin, userId, customerId, amount, cableTvPaymentType, payerName, merchantTxRef } = body;

    if (!userId || !pin || !customerId || !amount || !cableTvPaymentType || !payerName || !merchantTxRef) {
      return NextResponse.json({ error: "All required fields must be provided" }, { status: 400 });
    }

    if (userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized: User ID mismatch" }, { status: 403 });
    }

    const parsedAmount = Number(amount);
    const cachedUser = await getCachedUser(userId);
    if (!cachedUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, cachedUser.transaction_pin);
    if (!isValid) return NextResponse.json({ message: "Invalid transaction PIN" }, { status: 401 });

    const { data: rpcResult, error: rpcError } = await supabase.rpc("deduct_wallet_balance", {
      user_id: userId,
      amt: parsedAmount,
      transaction_type: "cable",
      reference: merchantTxRef,
      description: `Cable TV purchase for ${customerId}`,
    });

    if (rpcError || rpcResult[0].status !== "OK") {
      return NextResponse.json({ message: "Insufficient wallet balance" }, { status: 400 });
    }

    transactionId = rpcResult[0].tx_id;

    try {
      const response = await axios.post(
        `${process.env.NOMBA_URL}/v1/bill/cabletv`,
        { customerId, amount: parsedAmount, cableTvPaymentType, payerName, merchantTxRef },
        { headers: { Authorization: `Bearer ${token}`, accountId: process.env.NOMBA_ACCOUNT_ID! } }
      );

      await supabase.from("transactions").update({ status: "success", description: `Cable TV payment successful for ${customerId}` }).eq("id", transactionId);
      await supabase.rpc("award_zidcoin_cashback", { p_user_id: userId, p_transaction_id: transactionId, p_transaction_type: "cable", p_amount: amount });
      await sendCableTVEmailNotification(userId, "success", parsedAmount, customerId, cableTvPaymentType, transactionId, undefined, response.data);

      const responseData = { success: true, zidCoinBalance: cachedUser?.zidcoin_balance, data: response.data, transactionId };
      if (newTokens) return createAuthResponse(responseData, newTokens);
      return NextResponse.json(responseData);
    } catch (nombaError: any) {
      const errorDetail = nombaError.response?.data?.message || nombaError.message;
      await supabase.rpc("refund_wallet_balance", { user_id: userId, amt: parsedAmount });
      await supabase.from("transactions").update({ status: "failed_refunded" }).eq("id", transactionId);
      await sendCableTVEmailNotification(userId, "failed", parsedAmount, customerId, cableTvPaymentType, transactionId, errorDetail);
      return NextResponse.json({ error: "Cable TV purchase failed", detail: errorDetail }, { status: 500 });
    }
  } catch (err: any) {
    console.error("Unexpected cable purchase error:", err.message);
    if (transactionId) await supabase.from("transactions").update({ status: "failed" }).eq("id", transactionId);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}