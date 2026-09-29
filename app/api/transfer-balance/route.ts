import { NextRequest, NextResponse } from "next/server";
import { getNombaToken } from "@/lib/nomba";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";
import { sendPinResetEmail } from "@/lib/email/pin-reset";
import {
  sendWithdrawalEmail,
  generateTransferReceipt,
} from "../webhook/helpers/email-helpers";
import {
  calculateFees,
  checkTransferLimits,
  type AccountTier,
} from "@/lib/fee";

export async function POST(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    return NextResponse.json(
      { error: "Please login to access transactions", logout: true },
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
      // NOTE: `fee` and `totalDebit` from client are IGNORED — recomputed server-side
      category,
      categoryId,
    } = await req.json();

    if (userId !== user.id) {
      console.error(`User ID mismatch: ${userId} vs ${user.id}`);
      return NextResponse.json(
        { error: "Unauthorized: User ID mismatch" },
        { status: 403 }
      );
    }

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

    // ─── Fetch user (now includes account_tier + custom overrides) ───
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(
        "id, transaction_pin, wallet_balance, pin_attempts, pin_locked_until, email, first_name, last_name, full_name, account_tier, custom_outflow_percent, custom_outflow_min"
      )
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // ─── PIN lock check ───
    if (
      userData.pin_locked_until &&
      new Date(userData.pin_locked_until) > new Date()
    ) {
      const lockedUntil = new Date(userData.pin_locked_until);
      const minutesLeft = Math.ceil(
        (lockedUntil.getTime() - Date.now()) / 60000
      );

      const response = NextResponse.json(
        {
          message: `PIN is locked due to multiple failed attempts. Please try again in ${minutesLeft} minutes or reset your PIN via email.`,
          locked: true,
          lockedUntil: userData.pin_locked_until,
        },
        { status: 401 }
      );

      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // ─── PIN validation ───
    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, userData.transaction_pin);

    if (!isValid) {
      const newAttempts = (userData.pin_attempts || 0) + 1;
      const updateData: any = { pin_attempts: newAttempts };
      let shouldSendEmail = false;

      if (newAttempts >= 3) {
        const lockDuration = 30 * 60 * 1000;
        updateData.pin_locked_until = new Date(Date.now() + lockDuration);
        const resetToken = crypto.randomUUID();
        const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
        updateData.pin_reset_token = resetToken;
        updateData.pin_reset_token_expires = tokenExpiry;
        shouldSendEmail = true;
      }

      await supabase.from("users").update(updateData).eq("id", userId);

      if (shouldSendEmail && userData.email) {
        const userName =
          userData.first_name && userData.last_name
            ? `${userData.first_name} ${userData.last_name}`
            : undefined;

        await sendPinResetEmail(
          userData.email,
          updateData.pin_reset_token,
          userId,
          userName
        );

        const response = NextResponse.json(
          {
            message: `PIN locked due to ${newAttempts} failed attempts. A reset link has been sent to your email.`,
            locked: true,
            remainingAttempts: 0,
            resetEmailSent: true,
          },
          { status: 401 }
        );

        if (newTokens)
          return createAuthResponse(await response.json(), newTokens);
        return response;
      }

      const remainingAttempts = 3 - newAttempts;
      const response = NextResponse.json(
        {
          message: `Invalid transaction PIN. ${remainingAttempts} attempt${
            remainingAttempts !== 1 ? "s" : ""
          } remaining before PIN is locked.`,
          remainingAttempts,
          attempts: newAttempts,
        },
        { status: 401 }
      );

      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // ✅ PIN valid — reset attempts
    await supabase
      .from("users")
      .update({
        pin_attempts: 0,
        pin_locked_until: null,
        pin_reset_token: null,
        pin_reset_token_expires: null,
      })
      .eq("id", userId);

    // ───────────────────────────────────────────────────────────
    // TIER + LIMIT CHECK
    // ───────────────────────────────────────────────────────────
    const tier: AccountTier =
      ((userData.account_tier as AccountTier) || "tier_3");

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data: todayTx, error: todayError } = await supabase
      .from("transactions")
      .select("amount, status")
      .eq("user_id", userId)
      .eq("type", "withdrawal")
      .in("status", ["success", "processing", "pending"])
      .gte("created_at", startOfDay.toISOString());

    if (todayError) {
      console.error("❌ Failed to fetch today's transactions:", todayError);
      const response = NextResponse.json(
        { message: "Could not verify daily transfer limit. Please try again." },
        { status: 500 }
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    const dailyTotalSoFar = (todayTx || []).reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0
    );

    const limitCheck = checkTransferLimits(
      Number(amount),
      tier,
      dailyTotalSoFar
    );

    if (!limitCheck.allowed) {
      console.log(
        `🚫 Limit exceeded for user ${userId} (${tier}): ${limitCheck.reason}`
      );
      const response = NextResponse.json(
        {
          message: limitCheck.reason,
          limitExceeded: true,
          tier,
          perTransferLimit: limitCheck.perTransferLimit,
          dailyLimit: limitCheck.dailyLimit,
          dailyUsed: limitCheck.dailyUsed,
          dailyRemaining: limitCheck.dailyRemaining,
        },
        { status: 400 }
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // ───────────────────────────────────────────────────────────
    // SERVER-SIDE FEE CALCULATION (with custom overrides)
    // ───────────────────────────────────────────────────────────
    const feeResult = calculateFees(
      Number(amount),
      "transfer",
      "bank_transfer",
      tier,
      "outflow",
      {
        custom_outflow_percent: userData.custom_outflow_percent,
        custom_outflow_min: userData.custom_outflow_min,
      }
    );

    const serverFee = feeResult.totalFee;
    const totalDeduction = feeResult.totalDebit;

    console.log(
      `💰 Fee calc for user ${userId} (${tier}${
        feeResult.usedCustomRate ? " + custom rate" : ""
      }): amount=₦${amount}, fee=₦${serverFee}, total=₦${totalDeduction} [${
        feeResult.feeLabel
      }]`
    );

    // ─── Balance check ───
    if (userData.wallet_balance < totalDeduction) {
      const response = NextResponse.json(
        {
          message: "Insufficient wallet balance (including fees)",
          walletBalance: userData.wallet_balance,
          required: totalDeduction,
          fee: serverFee,
        },
        { status: 400 }
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    // ─── Nomba token ───
    const token = await getNombaToken();
    if (!token) {
      const response = NextResponse.json(
        { message: "Unable to process transfer at this time" },
        { status: 503 }
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    const merchantTxRef = `WD_${Date.now()}_${userId.slice(0, 8)}`;

    // ─── Build metadata ───
    const pendingMetadata = {
      initiated_at: new Date().toISOString(),
      initiated_by: userId,
      merchant_tx_ref: merchantTxRef,
      recipient_name: accountName,
      recipient_account: accountNumber,
      recipient_bank: bankName,
      recipient_bank_code: bankCode,
      sender_name: senderName || userData.full_name || null,
      sender_account: senderAccountNumber || null,
      sender_bank: senderBankName || null,
      narration: narration || "N/A",
      requested_amount: Number(amount),
      requested_fee: serverFee,
      total_deduction: totalDeduction,
      category: category || null,
      category_id: categoryId || null,

      // ── TIER TRACKING ──
      account_tier: tier,
      transfer_direction: "outflow",
      fee_label: feeResult.feeLabel,
      nomba_fee: feeResult.nombaFee,
      app_fee: feeResult.appFee,

      // ── CUSTOM RATE TRACKING ──
      used_custom_rate: feeResult.usedCustomRate,
      custom_outflow_percent: userData.custom_outflow_percent ?? null,
      custom_outflow_min: userData.custom_outflow_min ?? null,

      // ── LIMIT SNAPSHOT ──
      daily_total_before: dailyTotalSoFar,
      daily_total_after: dailyTotalSoFar + Number(amount),
      daily_limit: limitCheck.dailyLimit,
      per_transfer_limit: limitCheck.perTransferLimit,
    };

    // ─── Create PENDING transaction ───
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
        amount: Number(amount),
        fee: serverFee,
        total_deduction: totalDeduction,
        status: "pending",
        narration: narration || "N/A",
        merchant_tx_ref: merchantTxRef,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: category || null,
        category_id: categoryId || null,
        metadata: pendingMetadata,
      })
      .select("*")
      .single();

    if (txError || !pendingTx) {
      console.error("Transaction creation error:", txError);
      const response = NextResponse.json(
        { error: "Could not create transaction record" },
        { status: 500 }
      );
      if (newTokens) return createAuthResponse(await response.json(), newTokens);
      return response;
    }

    console.log(
      `📝 Created pending transaction ${pendingTx.id} for user ${userId} (${tier})`
    );

    // ─── Call Nomba API ───
    const nombaResponse = await fetch(
      `${process.env.NOMBA_URL}/v1/transfers/bank`,
      {
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
      }
    );

    const nombaData = await nombaResponse.json();
    console.log("📤 Nomba response:", {
      status: nombaResponse.status,
      merchantTxRef,
      nombaId: nombaData?.data?.id,
    });

    const isSuccess =
      nombaResponse.ok && nombaData?.data?.status === "success";
    const finalStatus = isSuccess ? "success" : "processing";
    const nombaTransactionId = nombaData?.data?.id || null;

    // ─── Update transaction with Nomba response ───
    await supabase
      .from("transactions")
      .update({
        status: finalStatus,
        description: `Transfer of ₦${amount} to ${accountName}`,
        metadata: {
          ...pendingMetadata,
          nomba_status: nombaData?.data?.status || null,
          nomba_description: nombaData?.description || null,
          nomba_requested_at: new Date().toISOString(),
        },
        external_response: {
          nomba_request: nombaData,
          requested_at: new Date().toISOString(),
          merchant_tx_ref: merchantTxRef,
          nomba_transaction_id: nombaTransactionId,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", pendingTx.id);

    // ─── If immediately successful — mutate wallet ───
    if (isSuccess) {
      console.log(
        `✅ Transfer immediately successful for transaction ${pendingTx.id}`
      );

      const { data: newBalance, error: deductError } = await supabase.rpc(
        "mutate_wallet_balance",
        {
          p_user_id: userId,
          p_amount: -totalDeduction,
          p_transaction_id: pendingTx.id,
          p_reason: "withdrawal_immediate_success",
        }
      );

      if (deductError) {
        console.error("❌ Failed to deduct wallet balance:", deductError);
        await supabase
          .from("transactions")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", pendingTx.id);
      } else {
        console.log(
          `✅ Deducted ₦${totalDeduction} — new balance ₦${newBalance}`
        );

        await supabase
          .from("transactions")
          .update({
            reference: nombaTransactionId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", pendingTx.id);

        const receiptHtml = generateTransferReceipt({
          transactionId: pendingTx.id,
          amount: Number(amount),
          date: new Date().toISOString(),
          recipientName: accountName,
          recipientAccount: accountNumber,
          recipientBank: bankName,
          senderName: senderName || userData.full_name || "Zidwell User",
          senderAccount: senderAccountNumber,
          narration: narration || "N/A",
          fee: serverFee,
          type: "bank_transfer",
        });

        if (receiptHtml && receiptHtml.length > 0) {
          console.log(
            `📧 Sending withdrawal email with PDF receipt for transaction ${pendingTx.id}`
          );
          await sendWithdrawalEmail(
            userId,
            "success",
            Number(amount),
            accountName,
            accountNumber,
            bankName,
            pendingTx.id,
            undefined,
            serverFee,
            receiptHtml
          ).catch((err) =>
            console.error("Failed to send withdrawal email:", err)
          );
        } else {
          console.warn(
            `⚠️ No receipt HTML generated for transaction ${pendingTx.id}`
          );
          await sendWithdrawalEmail(
            userId,
            "success",
            Number(amount),
            accountName,
            accountNumber,
            bankName,
            pendingTx.id,
            undefined,
            serverFee
          ).catch((err) =>
            console.error("Failed to send withdrawal email:", err)
          );
        }
      }
    }

    const responseData = {
      message: isSuccess
        ? "Transfer completed successfully."
        : "Transfer initiated. Processing...",
      transactionId: pendingTx.id,
      merchantTxRef,
      status: finalStatus,
      requiresPolling: !isSuccess,
      fee: serverFee,
      totalDeduction,
      tier,
      usedCustomRate: feeResult.usedCustomRate,
      category: category || null,
      ...(isSuccess &&
        nombaTransactionId && { reference: nombaTransactionId }),
    };

    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Withdraw API error:", error);

    const response = NextResponse.json(
      { error: "Server error: " + (error.message || error.description) },
      { status: 500 }
    );

    if ((error as any).newTokens) {
      return createAuthResponse(await response.json(), (error as any).newTokens);
    }

    return response;
  }
}