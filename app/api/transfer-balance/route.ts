// app/api/withdraw/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";
<<<<<<< HEAD
import { createBank78Withdrawal } from "@/lib/bank78";
=======
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
import { upsertSavedBankAccount } from "@/lib/saved-accounts";
>>>>>>> a4efef0ffe30e603af3d012263a99692e78c1740

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
      amount,
      accountNumber,
      accountName,
      bankCode,
      bankName,
      narration,
      pin,
<<<<<<< HEAD
      fee = 0,
=======
>>>>>>> a4efef0ffe30e603af3d012263a99692e78c1740
      category,
      categoryId,
    } = await req.json();

    if (userId !== user.id) {
      return NextResponse.json({ error: "User ID mismatch" }, { status: 403 });
    }

    if (
<<<<<<< HEAD
=======
      !userId ||
>>>>>>> a4efef0ffe30e603af3d012263a99692e78c1740
      !pin ||
      !amount ||
      amount < 100 ||
      !accountNumber ||
      !accountName ||
<<<<<<< HEAD
      !bankCode
=======
      !bankCode ||
      !bankName
>>>>>>> a4efef0ffe30e603af3d012263a99692e78c1740
    ) {
      return NextResponse.json(
        { message: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

<<<<<<< HEAD
    const { data: userData } = await supabase
      .from("users")
      .select(
        "id, transaction_pin, wallet_balance, pin_attempts, pin_locked_until, email, full_name, bank_name, bank_account_number, bank78_personal_bank_name"
=======
    // ─── Fetch user ───
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(
        "id, transaction_pin, wallet_balance, pin_attempts, pin_locked_until, email, first_name, last_name, full_name, account_tier, custom_outflow_percent, custom_outflow_min"
>>>>>>> a4efef0ffe30e603af3d012263a99692e78c1740
      )
      .eq("id", userId)
      .single();

    if (!userData) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

<<<<<<< HEAD
=======
    // ─── PIN lock check ───
>>>>>>> a4efef0ffe30e603af3d012263a99692e78c1740
    if (
      userData.pin_locked_until &&
      new Date(userData.pin_locked_until) > new Date()
    ) {
<<<<<<< HEAD
      return NextResponse.json(
        { message: "PIN locked. Try again later.", locked: true },
        { status: 401 }
      );
=======
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
>>>>>>> a4efef0ffe30e603af3d012263a99692e78c1740
    }

    // ─── PIN validation ───
    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
<<<<<<< HEAD
    const okPin = await bcrypt.compare(plainPin, userData.transaction_pin);
    if (!okPin) {
      const attempts = (userData.pin_attempts || 0) + 1;
      const update: any = { pin_attempts: attempts };
      if (attempts >= 3) {
        update.pin_locked_until = new Date(Date.now() + 30 * 60 * 1000);
      }
      await supabase.from("users").update(update).eq("id", userId);
      return NextResponse.json(
        { message: "Invalid transaction PIN", remainingAttempts: Math.max(0, 3 - attempts) },
        { status: 401 }
      );
=======
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
>>>>>>> a4efef0ffe30e603af3d012263a99692e78c1740
    }

    // Reset pin attempts on success
    await supabase
      .from("users")
<<<<<<< HEAD
      .update({ pin_attempts: 0, pin_locked_until: null })
      .eq("id", userId);

    const totalDebit = Number(amount) + Number(fee || 0);
    if (Number(userData.wallet_balance) < totalDebit) {
      return NextResponse.json(
        { message: "Insufficient wallet balance (including fees)" },
        { status: 400 }
      );
    }

    const merchantTxRef = `B78-WD-${Date.now()}-${userId.slice(0, 8)}`;

    // 1. Create pending transaction
    const { data: pendingTx, error: txErr } = await supabase
=======
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
      account_tier: tier,
      transfer_direction: "outflow",
      fee_label: feeResult.feeLabel,
      nomba_fee: feeResult.nombaFee,
      app_fee: feeResult.appFee,
      used_custom_rate: feeResult.usedCustomRate,
      custom_outflow_percent: userData.custom_outflow_percent ?? null,
      custom_outflow_min: userData.custom_outflow_min ?? null,
      daily_total_before: dailyTotalSoFar,
      daily_total_after: dailyTotalSoFar + Number(amount),
      daily_limit: limitCheck.dailyLimit,
      per_transfer_limit: limitCheck.perTransferLimit,
    };

    // ─── Create PENDING transaction ───
    const { data: pendingTx, error: txError } = await supabase
>>>>>>> a4efef0ffe30e603af3d012263a99692e78c1740
      .from("transactions")
      .insert({
        user_id: userId,
        type: "withdrawal",
        amount: Number(amount),
        fee: Number(fee || 0),
        total_deduction: totalDebit,
        status: "pending",
        merchant_tx_ref: merchantTxRef,
        narration: narration || "Wallet withdrawal",
        category: category || null,
        category_id: categoryId || null,
        channel: "bank78_payout",
        provider: "bank78",
        sender: {
          name: userData.full_name,
          accountNumber: userData.bank_account_number,
          bankName: userData.bank78_personal_bank_name || "Bank78",
        },
        receiver: {
          name: accountName,
          accountNumber,
          bankName: bankName || "",
          bankCode,
        },
        metadata: {
          initiated_at: new Date().toISOString(),
          recipient_bank_code: bankCode,
          requested_amount: Number(amount),
          requested_fee: Number(fee || 0),
          total_deduction: totalDebit,
        },
<<<<<<< HEAD
=======
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
>>>>>>> a4efef0ffe30e603af3d012263a99692e78c1740
      })
      .select("*")
      .single();

    if (txErr || !pendingTx) {
      return NextResponse.json(
        { error: "Could not create transaction" },
        { status: 500 }
      );
<<<<<<< HEAD
    }

    // 2. Call Bank78
    const result = await createBank78Withdrawal({
      reference: merchantTxRef,
      accountName,
      accountNumber,
      bankCode,
      bankName,
      amount: Number(amount),
      narration: narration || "Wallet withdrawal",
    });
=======
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
>>>>>>> a4efef0ffe30e603af3d012263a99692e78c1740

    if (!result.ok) {
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          external_response: result.raw || { error: result.message },
          updated_at: new Date().toISOString(),
        })
        .eq("id", pendingTx.id);

<<<<<<< HEAD
      return NextResponse.json(
        { message: result.message || "Withdrawal failed" },
        { status: 502 }
      );
    }

=======
    const isSuccess =
      nombaResponse.ok && nombaData?.data?.status === "success";
    const finalStatus = isSuccess ? "success" : "processing";
    const nombaTransactionId = nombaData?.data?.id || null;

    // ─── Update transaction with Nomba response ───
>>>>>>> a4efef0ffe30e603af3d012263a99692e78c1740
    await supabase
      .from("transactions")
      .update({
        status: "processing",
        provider_transaction_id: result.batchReference || null,
        external_response: result.raw,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pendingTx.id);

<<<<<<< HEAD
    const responseData = {
      message: "Transfer initiated. Processing...",
      transactionId: pendingTx.id,
      merchantTxRef,
      batchReference: result.batchReference,
      status: "processing",
=======
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

        // ✅ AUTO-SAVE BENEFICIARY (server-side, non-fatal)
        try {
          await upsertSavedBankAccount(
            supabase,
            userId,
            {
              account_number: accountNumber,
              account_name: accountName,
              bank_code: bankCode,
              bank_name: bankName,
            },
            { autoSaved: true }
          );
          console.log(
            `💾 Auto-saved bank beneficiary ${accountNumber} for user ${userId}`
          );
        } catch (saveErr) {
          console.error(
            "Auto-save bank beneficiary failed (non-fatal):",
            saveErr
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
>>>>>>> a4efef0ffe30e603af3d012263a99692e78c1740
    };

    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
<<<<<<< HEAD
  } catch (err: any) {
    console.error("[withdraw] error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
=======
  } catch (error: any) {
    console.error("Withdraw API error:", error);

    const response = NextResponse.json(
      { error: "Server error: " + (error.message || error.description) },
>>>>>>> a4efef0ffe30e603af3d012263a99692e78c1740
      { status: 500 }
    );
  }
}