import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";

export async function GET(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    return NextResponse.json(
      { error: "Please login", logout: true },
      { status: 401 }
    );
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const searchParams = req.nextUrl.searchParams;
  const transactionId = searchParams.get("transactionId");
  const merchantTxRef = searchParams.get("merchantTxRef");

  if (!transactionId && !merchantTxRef) {
    return NextResponse.json(
      { error: "Transaction ID or Merchant Reference required" },
      { status: 400 }
    );
  }

  try {
    let query = supabase
      .from("transactions")
      .select("*");

    if (transactionId) {
      query = query.eq("id", transactionId);
    } else {
      query = query.eq("merchant_tx_ref", merchantTxRef);
    }

    const { data: transaction, error } = await query.single();

    if (error || !transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Verify user owns this transaction
    if (transaction.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const response = {
      id: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      fee: transaction.fee,
      total_deduction: transaction.total_deduction,
      reference: transaction.reference,
      merchant_tx_ref: transaction.merchant_tx_ref,
      created_at: transaction.created_at,
      updated_at: transaction.updated_at,
      completed_at: transaction.external_response?.completed_at || null,
      message: transaction.status === "success" 
        ? "Transfer completed successfully" 
        : transaction.status === "failed"
        ? "Transfer failed"
        : "Transfer is being processed",
    };

    if (newTokens) {
      return createAuthResponse(response, newTokens);
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: "Failed to check transaction status" },
      { status: 500 }
    );
  }
}