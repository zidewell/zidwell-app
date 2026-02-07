import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getNombaToken } from "@/lib/nomba";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { transporter } from "@/lib/node-mailer";
import { isAuthenticated } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL
    : process.env.NEXT_PUBLIC_BASE_URL;


// User cache
const userCache = new Map();

async function getCachedUser(userId: string) {
  const cacheKey = `user_${userId}`;
  const cached = userCache.get(cacheKey);

  // Check if cache exists and is less than 2 minutes old
  if (cached && Date.now() - cached.timestamp < 2 * 60 * 1000) {
    return cached.data;
  }

  // Fetch fresh data
  const { data: user, error } = await supabase
    .from("users")
    .select(
      "transaction_pin, wallet_balance, zidcoin_balance, email, first_name"
    )
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

// Email notification function for success/failure
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
    // Fetch user email
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
        ? `Airtime Purchase Successful - ₦${amount} ${network}`
        : status === "pending"
        ? `Airtime Purchase Processing - ₦${amount} ${network}`
        : `Airtime Purchase Failed - ₦${amount} ${network}`;

    const greeting = user.first_name ? `Hi ${user.first_name},` : "Hello,";

    const successBody = `
${greeting}

Your airtime purchase was successful!

📱 Transaction Details:
• Amount: ₦${amount}
• Network: ${network}
• Phone Number: ${phoneNumber}
• Transaction ID: ${transactionId || "N/A"}
• Date: ${new Date().toLocaleString()}

Thank you for using Zidwell!

Best regards,
Zidwell Team
    `;

    const pendingBody = `
${greeting}

Your airtime purchase is being processed. This usually takes a few moments.

📱 Transaction Details:
• Amount: ₦${amount}
• Network: ${network}
• Phone Number: ${phoneNumber}
• Transaction ID: ${transactionId || "N/A"}
• Date: ${new Date().toLocaleString()}
• Status: Processing

You will receive another notification once the transaction is completed.

Thank you for using Zidwell!

Best regards,
Zidwell Team
    `;

    const failedBody = `
${greeting}

Your airtime purchase failed.

📱 Transaction Details:
• Amount: ₦${amount}
• Network: ${network}
• Phone Number: ${phoneNumber}
• Transaction ID: ${transactionId || "N/A"}
• Date: ${new Date().toLocaleString()}
• Status: ${errorDetail || "Transaction failed"}

${
  errorDetail?.includes("refunded")
    ? "✅ Your wallet has been refunded successfully."
    : "Please contact support if you have any questions."
}

Best regards,
Zidwell Team
    `;

    const emailBody =
      status === "success"
        ? successBody
        : status === "pending"
        ? pendingBody
        : failedBody;

    const statusColor =
      status === "success"
        ? "#22c55e"
        : status === "pending"
        ? "#f59e0b"
        : "#ef4444";

    const statusIcon =
      status === "success" ? "✅" : status === "pending" ? "🟡" : "❌";

    const statusText =
      status === "success"
        ? "Airtime Purchase Successful"
        : status === "pending"
        ? "Airtime Purchase Processing"
        : "Airtime Purchase Failed";

   const headerImageUrl = `${baseUrl}/zidwell-header.png`;
const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

await transporter.sendMail({
  from: `Zidwell <${process.env.EMAIL_USER}>`,
  to: user.email,
  subject,
  text: emailBody,
  html: `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background:#f3f4f6; font-family:Arial, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
  <tr>
    <td align="center">

      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">

        <!-- Header Image -->
        <tr>
          <td>
            <img
              src="${headerImageUrl}"
              alt="Zidwell Header"
              style="width:100%; max-width:600px; display:block;"
            />
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:24px; color:#333;">

            <p>${greeting}</p>

            <h3 style="color:${statusColor}; margin-top:10px;">
              ${statusIcon} ${statusText}
            </h3>

            <div style="background:#f8fafc; padding:15px; border-radius:8px; margin:15px 0;">
              <h4 style="margin-top:0;">Transaction Details</h4>
              <p><strong>Amount:</strong> ₦${amount}</p>
              <p><strong>Network:</strong> ${network}</p>
              <p><strong>Phone Number:</strong> ${phoneNumber}</p>
              <p><strong>Transaction ID:</strong> ${transactionId || "N/A"}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              <p>
                <strong>Status:</strong>
                <span style="color:${statusColor}; font-weight:bold;">
                  ${
                    status === "success"
                      ? "Success"
                      : status === "pending"
                      ? "Processing"
                      : "Failed"
                  }
                </span>
              </p>

              ${
                status === "failed"
                  ? `<p><strong>Reason:</strong> ${errorDetail || "Transaction failed"}</p>`
                  : ""
              }
            </div>

            ${
              status === "pending"
                ? `<p style="color:#64748b;">
                    You will receive another notification once the transaction is completed.
                  </p>`
                : ""
            }

            ${
              status === "failed" && errorDetail?.includes("refunded")
                ? `<p style="color:#22c55e; font-weight:bold;">
                    ✅ Your wallet has been refunded successfully.
                  </p>`
                : ""
            }

            <p>Thank you for using <strong>Zidwell</strong>.</p>

            <p style="color:#64748b; font-size:14px;">
              Best regards,<br />
              <strong>Zidwell Team</strong>
            </p>

          </td>
        </tr>

        <!-- Footer Image -->
        <tr>
          <td>
            <img
              src="${footerImageUrl}"
              alt="Zidwell Footer"
              style="width:100%; max-width:600px; display:block;"
            />
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>
`,
});


    console.log(
      `Email notification sent to ${user.email} for ${status} transaction`
    );
  } catch (emailError) {
    console.error("Failed to send email notification:", emailError);
  }
}

export async function POST(req: NextRequest) {
   const user = await isAuthenticated(req);
      
      if (!user) {
        return NextResponse.json(
          { error: "Please login to access transactions" },
          { status: 401 }
        );
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

    // Validate required fields
    if (
      !userId ||
      !pin ||
      !amount ||
      amount < 100 ||
      !phoneNumber ||
      !network
    ) {
      return NextResponse.json(
        {
          message:
            "Invalid input: userId, pin, phoneNumber, network are required and amount must be >= 100",
        },
        { status: 400 }
      );
    }

    // Generate merchantTxRef if not provided
    const finalMerchantTxRef =
      merchantTxRef ||
      `AIRTIME-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // console.log("📱 Starting airtime purchase:", {
    //   userId,
    //   amount,
    //   phoneNumber,
    //   network,
    //   merchantTxRef: finalMerchantTxRef
    // });

    // Get Nomba token
    const token = await getNombaToken();
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Fetch user with cached version
    const user = await getCachedUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify transaction PIN
    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, user.transaction_pin);
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid Transaction PIN" },
        { status: 401 }
      );
    }

    // Check wallet balance
    if (user.wallet_balance < amount) {
      return NextResponse.json(
        { message: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    // Deduct wallet using RPC and create transaction
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

    if (rpcError) {
      console.error("RPC Deduction Error:", rpcError);
      return NextResponse.json(
        { message: "Wallet deduction failed", detail: rpcError.message },
        { status: 500 }
      );
    }

    if (rpcResult[0].status !== "OK") {
      return NextResponse.json(
        { message: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    // Transaction ID from RPC
    transactionId = rpcResult[0].tx_id;
    // console.log("💰 Wallet deducted, transaction created:", transactionId);

    // // Call Nomba API
    // console.log("📡 Calling Nomba API...");
    const response = await axios.post(
      `${process.env.NOMBA_URL}/v1/bill/topup`,
      {
        amount,
        phoneNumber,
        network,
        merchantTxRef: finalMerchantTxRef,
        senderName: senderName || "Zidwell User",
      },
      {
        headers: {
          accountId: process.env.NOMBA_ACCOUNT_ID!,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    // console.log("📱 Nomba API Response received:", {
    //   code: response.data?.code,
    //   status: response.data?.status,
    //   description: response.data?.description
    // });

    // 🔥 FIXED: Determine transaction status based on Nomba response
    const responseCode = response.data?.code?.toString();
    const nombaStatus = response.data?.status;
    const responseDescription = response.data?.description || "";

    // console.log("📊 Nomba Response Analysis:", {
    //   responseCode,
    //   nombaStatus,
    //   responseDescription,
    //   hasSuccess: responseDescription === "SUCCESS"
    // });

    let transactionStatus = "success";
    let emailStatus: "success" | "pending" | "failed" = "success";

    // 🔥 FIXED LOGIC: If code is "00" AND description is "SUCCESS", mark as success immediately
    if (responseCode === "00" && responseDescription === "SUCCESS") {
      transactionStatus = "success";
      emailStatus = "success";
      console.log(
        "🟢 Airtime transaction marked as SUCCESS - immediate confirmation from Nomba"
      );
    }
    // If code is "00" but no explicit success, wait for webhook
    else if (responseCode === "00") {
      transactionStatus = "pending";
      emailStatus = "pending";
      console.log(
        "🟡 Airtime transaction set to PENDING - code 00 but no explicit success"
      );
    }
    // Other success indicators
    else if (
      nombaStatus === "SUCCESS" ||
      nombaStatus === "Success" ||
      nombaStatus === "Completed"
    ) {
      transactionStatus = "success";
      emailStatus = "success";
      console.log("🟢 Airtime transaction marked as SUCCESS");
    }
    // Processing indicators
    else if (nombaStatus === "Processing" || nombaStatus === "PENDING") {
      transactionStatus = "pending";
      emailStatus = "pending";
      console.log("🟡 Airtime transaction set to PENDING");
    }
    // Failure indicators
    else if (nombaStatus === "Failed" || nombaStatus === "FAILED") {
      transactionStatus = "failed";
      emailStatus = "failed";
      console.log("🔴 Airtime transaction marked as FAILED");
    }
    // Default case
    else {
      transactionStatus = "pending";
      emailStatus = "pending";
      console.log(
        "🟡 Airtime transaction set to PENDING - default for unknown status"
      );
    }

    // Store additional data for webhook processing
    const externalData = {
      ...response.data,
      phoneNumber,
      network,
      userId,
      originalMerchantTxRef: finalMerchantTxRef,
    };

    // Update transaction status based on response
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: transactionStatus,
        external_response: externalData,
        merchant_tx_ref: finalMerchantTxRef,
        narration: `Airtime ${network} ${phoneNumber}`,
      })
      .eq("id", transactionId);

    const { data: cashbackResult, error: cashbackError } = await supabase.rpc(
      "award_zidcoin_cashback",
      {
        p_user_id: userId,
        p_transaction_id: transactionId,
        p_transaction_type: "airtime",
        p_amount: amount,
      }
    );

    if (cashbackResult && cashbackResult.success) {
      console.log(
        "🎉 Zidcoin cashback awarded:",
        cashbackResult.zidcoins_earned
      );
    }

    if (updateError) {
      console.error("❌ Failed to update transaction status:", updateError);
      // Continue anyway - don't fail the whole request
    }

    // Send appropriate email notification
    await sendEmailNotification(
      userId,
      emailStatus,
      amount,
      phoneNumber,
      network,
      transactionId || undefined
    );

    // console.log("✅ Airtime purchase processed successfully:", {
    //   transactionId,
    //   status: transactionStatus,
    //   nombaStatus,
    //   merchantTxRef: finalMerchantTxRef
    // });

    return NextResponse.json({
      message: `Airtime purchase ${transactionStatus}`,
      status: transactionStatus,
      nomba_status: nombaStatus,
      transactionId: transactionId,
      zidCoinBalance: user?.zidcoin_balance,
      merchantTxRef: finalMerchantTxRef,
      data: response.data,
    });
  } catch (error: any) {
    console.error(
      "Airtime Purchase Error:",
      error.response?.data || error.message
    );

    const errorDetail = error.response?.data?.message || error.message;
    let refundStatus = "failed";
    let emailStatus: "failed" = "failed";

    // Refund if userId and amount exist and transaction was created
    if (userId && amount && transactionId) {
      try {
        console.log("🔄 Attempting refund...");
        const { error: refundError } = await supabase.rpc(
          "refund_wallet_balance",
          {
            user_id: userId,
            amt: amount,
          }
        );

        if (refundError) {
          console.error("Refund RPC failed:", refundError);
          // Try alternative refund method
          const { data: userBefore } = await supabase
            .from("users")
            .select("wallet_balance")
            .eq("id", userId)
            .single();

          if (userBefore) {
            const newBalance = Number(userBefore.wallet_balance) + amount;
            await supabase
              .from("users")
              .update({ wallet_balance: newBalance })
              .eq("id", userId);
            refundStatus = "refunded_manual";
          }
        } else {
          refundStatus = "refunded";
        }

        // Update transaction status
        await supabase
          .from("transactions")
          .update({
            status: "failed_refunded",
            external_response: {
              error: errorDetail,
              refundStatus,
              stack: error.stack,
            },
          })
          .eq("id", transactionId);
      } catch (refundError) {
        console.error("Refund process failed:", refundError);
        if (transactionId) {
          await supabase
            .from("transactions")
            .update({ status: "refund_pending" })
            .eq("id", transactionId);
          refundStatus = "refund_pending";
        }
      }
    } else if (userId && amount && !transactionId) {
      // No transaction was created, so no deduction happened
      refundStatus = "no_deduction";
    }

    // Send failure email notification
    if (userId && amount && phoneNumber && network) {
      await sendEmailNotification(
        userId,
        emailStatus,
        amount,
        phoneNumber,
        network,
        transactionId || undefined,
        `Transaction failed - Status: ${refundStatus}. ${errorDetail}`
      );
    }

    return NextResponse.json(
      {
        message: "Transaction failed",
        detail: errorDetail,
        refundStatus,
        transactionId: transactionId || null,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
   const user = await isAuthenticated(req);
    
    if (!user) {
      return NextResponse.json(
        { error: "Please login to access transactions" },
        { status: 401 }
      );
    }

  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get("transactionId");
    const merchantTxRef = searchParams.get("merchantTxRef");

    if (!transactionId && !merchantTxRef) {
      return NextResponse.json(
        { message: "transactionId or merchantTxRef is required" },
        { status: 400 }
      );
    }

    let query = supabase.from("transactions").select("*").eq("type", "airtime");

    if (transactionId) {
      query = query.eq("id", transactionId);
    } else if (merchantTxRef) {
      query = query.eq("merchant_tx_ref", merchantTxRef);
    }

    const { data: transaction, error } = await query.single();

    if (error) {
      return NextResponse.json(
        { message: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      transactionId: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at,
      merchantTxRef: transaction.merchant_tx_ref,
      externalResponse: transaction.external_response,
    });
  } catch (error: any) {
    console.error("Check transaction status error:", error);
    return NextResponse.json(
      { message: "Failed to check transaction status" },
      { status: 500 }
    );
  }
}
