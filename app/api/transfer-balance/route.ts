// app/api/withdraw/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import {
  isAuthenticatedWithRefresh,
  createAuthResponse,
} from "@/lib/auth-check-api";
import { createBank78Withdrawal } from "@/lib/bank78";

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
      fee = 0,
      category,
      categoryId,
    } = await req.json();

    if (userId !== user.id) {
      return NextResponse.json({ error: "User ID mismatch" }, { status: 403 });
    }

    if (
      !pin ||
      !amount ||
      amount < 100 ||
      !accountNumber ||
      !accountName ||
      !bankCode
    ) {
      return NextResponse.json(
        { message: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    const { data: userData } = await supabase
      .from("users")
      .select(
        "id, transaction_pin, wallet_balance, pin_attempts, pin_locked_until, email, full_name, bank_name, bank_account_number, bank78_personal_bank_name"
      )
      .eq("id", userId)
      .single();

    if (!userData) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (
      userData.pin_locked_until &&
      new Date(userData.pin_locked_until) > new Date()
    ) {
      return NextResponse.json(
        { message: "PIN locked. Try again later.", locked: true },
        { status: 401 }
      );
    }

    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
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
    }

    // Reset pin attempts on success
    await supabase
      .from("users")
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
      })
      .select("*")
      .single();

    if (txErr || !pendingTx) {
      return NextResponse.json(
        { error: "Could not create transaction" },
        { status: 500 }
      );
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

    if (!result.ok) {
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          external_response: result.raw || { error: result.message },
          updated_at: new Date().toISOString(),
        })
        .eq("id", pendingTx.id);

      return NextResponse.json(
        { message: result.message || "Withdrawal failed" },
        { status: 502 }
      );
    }

    await supabase
      .from("transactions")
      .update({
        status: "processing",
        provider_transaction_id: result.batchReference || null,
        external_response: result.raw,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pendingTx.id);

    const responseData = {
      message: "Transfer initiated. Processing...",
      transactionId: pendingTx.id,
      merchantTxRef,
      batchReference: result.batchReference,
      status: "processing",
    };

    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("[withdraw] error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}