// app/api/buy-electricity/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { getNombaToken } from "@/lib/nomba";
import bcrypt from "bcryptjs";
import { transporter } from "@/lib/node-mailer";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ADD USER CACHE HERE
const userCache = new Map();

async function getCachedUser(userId: string) {
  const cacheKey = `user_${userId}`;
  const cached = userCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 2 * 60 * 1000) {
    console.log("✅ Using cached user data");
    return cached.data;
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("transaction_pin, wallet_balance, zidcoin_balance, email, first_name")
    .eq("id", userId)
    .single();

  if (user && !error) {
    userCache.set(cacheKey, {
      data: user,
      timestamp: Date.now(),
    });
  }

  return user;
}

async function sendElectricityEmailNotification(
  userId: string,
  status: "success" | "failed",
  amount: number,
  disco: string,
  meterNumber: string,
  meterType: string,
  transactionId?: string | null,
  errorDetail?: string,
  tokenData?: any
) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn("Email notifications are disabled");
      return;
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("email, first_name")
      .eq("id", userId)
      .single();

    if (error || !user) {
      console.error("Failed to fetch user for email notification:", error);
      return;
    }

    const subject =
      status === "success"
        ? `Electricity Purchase Successful - ₦${amount} ${disco}`
        : `Electricity Purchase Failed - ₦${amount} ${disco}`;

    const greeting = user.first_name ? `Hi ${user.first_name},` : "Hello,";
    
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_DEV_URL
        : process.env.NEXT_PUBLIC_BASE_URL;

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
        <tr>
          <td><img src="${headerImageUrl}" alt="Zidwell Header" style="width:100%; max-width:600px; display:block;" /></td>
        </tr>
        <tr>
          <td style="padding:24px; color:#333;">
            <p>${greeting}</p>
            <h3 style="color: ${status === "success" ? "#22c55e" : "#ef4444"};">
              ${status === "success" ? "✅ Electricity Purchase Successful" : "❌ Electricity Purchase Failed"}
            </h3>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4 style="margin-top: 0;">Transaction Details:</h4>
              <p><strong>Amount:</strong> ₦${amount}</p>
              <p><strong>Disco:</strong> ${disco}</p>
              <p><strong>Meter Number:</strong> ${meterNumber}</p>
              <p><strong>Meter Type:</strong> ${meterType}</p>
              <p><strong>Transaction ID:</strong> ${transactionId || "N/A"}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              ${status === "success" && tokenData ? `<p><strong>Token:</strong> <code style="background:#f1f5f9; padding:4px 8px; border-radius:4px;">${tokenData.token || "N/A"}</code></p>` : ""}
              ${status === "failed" ? `<p><strong>Status:</strong> ${errorDetail || "Transaction failed"}</p>` : ""}
            </div>
            <p>Thank you for using Zidwell!</p>
            <p style="color: #64748b; font-size: 14px;">Best regards,<br /><strong>Zidwell Team</strong></p>
          </td>
        </tr>
        <tr>
          <td><img src="${footerImageUrl}" alt="Zidwell Footer" style="width:100%; max-width:600px; display:block;" /></td>
        </tr>
      </table>
    </td>
   </tr>
</table>
</body>
</html>`,
    });
    console.log(`Email notification sent to ${user.email} for ${status} electricity purchase`);
  } catch (emailError) {
    console.error("Failed to send email notification:", emailError);
  }
}

export async function POST(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);
  
  if (!user) {
    const response = NextResponse.json(
      { error: "Please login to access transactions", logout: true },
      { status: 401 }
    );
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
    const {
      userId,
      pin,
      disco,
      meterNumber,
      meterType,
      amount,
      payerName,
      merchantTxRef,
    } = body;

    if (!userId || !pin || !disco || !meterNumber || !meterType || !amount || !payerName || !merchantTxRef) {
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
      transaction_type: "electricity",
      reference: merchantTxRef,
      description: `Electricity purchase for ${meterNumber} (${meterType})`,
    });

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      return NextResponse.json({ error: "Wallet deduction failed", detail: rpcError.message }, { status: 500 });
    }

    if (rpcResult[0].status !== "OK") {
      return NextResponse.json({ message: "Insufficient wallet balance" }, { status: 400 });
    }

    transactionId = rpcResult[0].tx_id;

    try {
      const apiResponse = await axios.post(
        `${process.env.NOMBA_URL}/v1/bill/electricity`,
        {
          disco,
          customerId: meterNumber,
          meterType,
          amount: parsedAmount,
          payerName,
          merchantTxRef,
        },
        {
          headers: {
            accountId: process.env.NOMBA_ACCOUNT_ID!,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      await supabase
        .from("transactions")
        .update({
          status: "success",
          description: `Electricity token generated for ${meterNumber}`,
        })
        .eq("id", transactionId);

      try {
        const nombaPayload = {
          transactionRef: `ELECTRICITY-${merchantTxRef}`,
          status: "SUCCESS",
          source: "web",
          type: "electricity_purchase",
          terminalId: "WEB_PORTAL",
          rrn: transactionId,
          merchantTxRef: merchantTxRef,
          orderReference: merchantTxRef,
          orderId: transactionId,
        };

        console.log("📤 Calling Nomba API with payload:", nombaPayload);

        const nombaResponse = await fetch(
          "https://api.nomba.com/v1/transactions/accounts",
          {
            method: "POST",
            headers: {
              accountId: process.env.NOMBA_ACCOUNT_ID!,
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(nombaPayload),
          }
        );

        const nombaData = await nombaResponse.json();
        console.log("✅ Nomba API response:", nombaData);
      } catch (nombaError: any) {
        console.error("❌ Nomba API call failed:", nombaError.message);
      }

      await supabase.rpc("award_zidcoin_cashback", {
        p_user_id: userId,
        p_transaction_id: transactionId,
        p_transaction_type: "electricity",
        p_amount: amount,
      });

      await sendElectricityEmailNotification(
        userId,
        "success",
        parsedAmount,
        disco,
        meterNumber,
        meterType,
        transactionId,
        undefined,
        apiResponse.data
      );

      const responseData = {
        success: true,
        zidCoinBalance: cachedUser?.zidcoin_balance,
        token: apiResponse.data,
      };
      if (newTokens) return createAuthResponse(responseData, newTokens);
      return NextResponse.json(responseData);
    } catch (apiError: any) {
      console.error("⚠️ Electricity API error:", apiError.response?.data || apiError.message);

      const errorDetail = apiError.response?.data?.message || apiError.message;

      try {
        await supabase.rpc("refund_wallet_balance", {
          user_id: userId,
          amt: parsedAmount,
        });

        await supabase
          .from("transactions")
          .update({
            status: "failed_refunded",
            description: `Electricity purchase failed for ${meterNumber}`,
          })
          .eq("id", transactionId);

        await sendElectricityEmailNotification(
          userId,
          "failed",
          parsedAmount,
          disco,
          meterNumber,
          meterType,
          transactionId,
          `Transaction failed - Refunded. ${errorDetail}`
        );
      } catch (refundError) {
        console.error("Refund failed:", refundError);

        await supabase
          .from("transactions")
          .update({
            status: "refund_pending",
            description: `Electricity purchase failed - refund pending for ${meterNumber}`,
          })
          .eq("id", transactionId);

        await sendElectricityEmailNotification(
          userId,
          "failed",
          parsedAmount,
          disco,
          meterNumber,
          meterType,
          transactionId,
          `Transaction failed - Refund pending. ${errorDetail}`
        );
      }

      return NextResponse.json(
        {
          error: "Failed to purchase electricity token",
          detail: errorDetail,
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("⚠️ Electricity purchase error:", err.message);

    if (transactionId) {
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", transactionId);
    }

    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}