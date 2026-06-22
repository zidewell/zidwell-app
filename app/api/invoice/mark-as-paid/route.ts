// app/api/invoice/mark-as-paid/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

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

  try {
    const { invoiceId } = await req.json();

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 },
      );
    }

    // Check if invoice exists and belongs to user
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select(`
        id, 
        user_id, 
        status, 
        total_amount, 
        paid_amount, 
        allow_multiple_payments, 
        target_quantity, 
        paid_quantity,
        invoice_id,
        business_name,
        client_name,
        client_email
      `)
      .eq("id", invoiceId)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 },
      );
    }

    if (invoice.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 },
      );
    }

    if (invoice.status === "paid") {
      return NextResponse.json(
        { error: "Invoice is already paid" },
        { status: 400 },
      );
    }

    // Get user's current balance
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("balance")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("Error fetching user balance:", userError);
    }

    const currentBalance = userData?.balance || 0;
    const newBalance = currentBalance + invoice.total_amount;

    // Start a transaction to update invoice, create transaction record, and update user balance
    const now = new Date().toISOString();
    const transactionRef = `MANUAL-PAY-${invoice.invoice_id}-${Date.now()}`;
    
    // Update invoice status to paid
    const updateData: any = {
      status: "paid",
      paid_amount: invoice.total_amount,
      paid_at: now,
    };

    // If multiple payments allowed, set paid_quantity to target_quantity
    if (invoice.allow_multiple_payments && invoice.target_quantity) {
      updateData.paid_quantity = invoice.target_quantity;
    }

    const { error: updateError } = await supabase
      .from("invoices")
      .update(updateData)
      .eq("id", invoiceId);

    if (updateError) {
      throw updateError;
    }

    // Update user's balance
    const { error: balanceError } = await supabase
      .from("users")
      .update({ balance: newBalance })
      .eq("id", user.id);

    if (balanceError) {
      console.error("Error updating user balance:", balanceError);
      // Don't throw - continue with transaction creation
    }

    // Create a transaction record for the payment
    const { error: transactionError } = await supabase
      .from("transactions")
      .insert([
        {
          user_id: invoice.user_id,
          type: "credit",
          amount: invoice.total_amount,
          status: "success",
          reference: transactionRef,
          description: `Manual payment marked for invoice ${invoice.invoice_id} - ${invoice.business_name}`,
          narration: `Payment for invoice ${invoice.invoice_id} marked as paid manually`,
          fee: 0,
          total_deduction: 0,
          channel: "manual",
          gross_amount: invoice.total_amount,
          net_amount: invoice.total_amount,
          sender: {
            name: "Manual Payment",
            type: "manual"
          },
          receiver: {
            name: invoice.business_name,
            email: user.email,
            user_id: user.id
          },
          balance_before: currentBalance,
          balance_after: newBalance,
          category: "invoice_payment",
          category_id: invoice.invoice_id,
          external_response: {
            payment_method: "manual_mark_as_paid",
            marked_at: now,
            invoice_id: invoice.invoice_id,
            client_name: invoice.client_name,
            client_email: invoice.client_email,
            marked_by: user.email
          },
          created_at: now,
          updated_at: now,
        },
      ]);

    if (transactionError) {
      console.error("Error creating transaction record:", transactionError);
      // Don't throw here - the invoice is already marked as paid
      // Log the error but continue
    }

    const responseData = {
      message: "Invoice marked as paid successfully",
      invoiceId,
      transactionCreated: !transactionError,
      transactionReference: transactionRef,
      newBalance: newBalance,
    };

    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error marking invoice as paid:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark invoice as paid" },
      { status: 500 },
    );
  }
}