import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { isAuthenticated } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Define invoice pricing
const FREE_INVOICES_LIMIT = 10;
const INVOICE_PRICE = 100; 

export async function POST(req: NextRequest) {
     const user = await isAuthenticated(req);
        
        if (!user) {
          return NextResponse.json(
            { error: "Please login to access transactions" },
            { status: 401 }
          );
        }
    
  try {
    const body = await req.json();
    let { 
      userId, 
      amount, 
      description, 
      pin, 
      isInvoiceCreation = false, 
      service, 
      include_lawyer_signature = false 
    } = body;

    // Validate required fields
    if (!userId || !pin) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Fetch user data
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select(
        "transaction_pin, wallet_balance, free_invoices_left, total_invoices_created"
      )
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { error: fetchError?.message || "User not found" },
        { status: 404 }
      );
    }

    if (!user.transaction_pin) {
      return NextResponse.json(
        { error: "Transaction PIN not set" },
        { status: 400 }
      );
    }

    // Verify PIN
    const plainPin = Array.isArray(pin) ? pin.join("") : pin;
    const isValid = await bcrypt.compare(plainPin, user.transaction_pin);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid transaction PIN" },
        { status: 401 }
      );
    }

    // ✅ Handle Invoice Creation with Free Trial
    if (isInvoiceCreation) {
      // Get current counts
      const freeInvoicesLeft = user.free_invoices_left || FREE_INVOICES_LIMIT;
      const totalInvoicesCreated = user.total_invoices_created || 0;
      
      // FIX: Calculate how many free invoices the user should have based on total created
      // If total_invoices_created already tracks all invoices, calculate remaining free ones
      const remainingFreeInvoices = Math.max(0, FREE_INVOICES_LIMIT - totalInvoicesCreated);
      
      console.log(
        `User ${userId}: free_invoices_left=${freeInvoicesLeft}, total_created=${totalInvoicesCreated}, remaining_free=${remainingFreeInvoices}`
      );

      // FIXED LOGIC: Check if user still has any free invoices available
      if (remainingFreeInvoices > 0) {
        // User still has free invoices available
        console.log(`User has ${remainingFreeInvoices} free invoices remaining`);
        
        // Update both counts
        const newFreeCount = Math.max(0, freeInvoicesLeft - 1);
        const newTotalCount = totalInvoicesCreated + 1;
        
        console.log(
          `Using free invoice. New counts: free_invoices_left=${newFreeCount}, total_invoices_created=${newTotalCount}`
        );

        // Update user's invoice counts
        const { error: updateError } = await supabase
          .from("users")
          .update({
            free_invoices_left: newFreeCount,
            total_invoices_created: newTotalCount,
          })
          .eq("id", userId);

        if (updateError) {
          console.error(
            "❌ Failed to update free invoice count:",
            updateError.message
          );
          return NextResponse.json(
            { error: "Failed to update invoice count" },
            { status: 500 }
          );
        }

        // Record the free transaction
        const reference = `FREE-INV-${crypto.randomUUID().slice(0, 8)}`;
        const { error: transactionError } = await supabase
          .from("transactions")
          .insert({
            user_id: userId,
            amount: 0,
            type: "invoice_creation",
            status: "success",
            description:
              description ||
              `Free invoice created (${newTotalCount}/${FREE_INVOICES_LIMIT})`,
            reference: reference,
            external_response: {
              free_invoice: true,
              invoice_count: newTotalCount,
              free_invoices_left: newFreeCount,
              total_invoices_created: newTotalCount,
              free_invoices_limit: FREE_INVOICES_LIMIT,
              free_invoices_used: FREE_INVOICES_LIMIT - newFreeCount,
            },
          });

        if (transactionError) {
          console.error(
            "❌ Failed to create free transaction record:",
            transactionError.message
          );
        }

        return NextResponse.json({
          success: true,
          message: "Free invoice created successfully",
          freeInvoicesLeft: newFreeCount,
          totalInvoicesCreated: newTotalCount,
          charged: false,
          isTrial: true,
          amount: 0,
          newWalletBalance: user.wallet_balance,
          hasFreeInvoices: newFreeCount > 0,
        });
      } else {
        // No free invoices left - user must pay
        console.log(
          `User ${userId} has exceeded ${FREE_INVOICES_LIMIT} free invoices. Charging ₦${INVOICE_PRICE}`
        );
        
        // Check if user has sufficient balance
        if (user.wallet_balance < INVOICE_PRICE) {
          return NextResponse.json(
            {
              error: `Insufficient balance. You need ₦${INVOICE_PRICE} to create an invoice (free limit exceeded).`,
              freeInvoicesLeft: 0,
              totalInvoicesCreated: totalInvoicesCreated,
              hasFreeInvoices: false,
            },
            { status: 400 }
          );
        }

        // Update total invoice count first (paid invoice)
        const newTotalCount = totalInvoicesCreated + 1;
        const { error: countUpdateError } = await supabase
          .from("users")
          .update({
            total_invoices_created: newTotalCount,
            free_invoices_left: 0, // Ensure free_invoices_left is 0
          })
          .eq("id", userId);

        if (countUpdateError) {
          console.error(
            "❌ Failed to update invoice count:",
            countUpdateError.message
          );
        }

        // Set amount for payment
        amount = INVOICE_PRICE;
        description =
          description ||
          `Paid invoice creation (after ${FREE_INVOICES_LIMIT} free invoices)`;
        
        // Proceed to payment deduction
      }
    } else {
      // Regular payment (not invoice creation)
      amount = Number(amount);
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      }

      // Check if user has sufficient balance for regular payment
      if (user.wallet_balance < amount) {
        return NextResponse.json(
          { error: "Insufficient balance" },
          { status: 400 }
        );
      }
    }

    // ✅ Handle Payment (for paid invoices or regular payments)
    const reference = crypto.randomUUID();
    const transactionDescription =
      description ||
      (isInvoiceCreation
        ? `Paid invoice creation (₦${INVOICE_PRICE})`
        : service === "contract" 
          ? (include_lawyer_signature 
            ? `Contract generation with lawyer signature (₦${amount})`
            : `Contract generation (₦${amount})`)
          : "Funds deducted");

    // Prepare external_response data
    let externalResponseData: any = {};

    // Add invoice-specific data if applicable
    if (isInvoiceCreation) {
      const totalCreated = (user.total_invoices_created || 0) + 1;
      externalResponseData = {
        free_invoice: false, // This is a paid invoice
        invoice_count: totalCreated,
        free_invoices_left: 0,
        total_invoices_created: totalCreated,
        free_invoices_limit: FREE_INVOICES_LIMIT,
        free_invoices_used: FREE_INVOICES_LIMIT,
        is_paid_invoice: true,
        invoice_fee: INVOICE_PRICE,
      };
    }

    // Add lawyer signature data for contracts
    if (service === "contract") {
      externalResponseData = {
        ...externalResponseData,
        include_lawyer_signature: include_lawyer_signature,
        lawyer_signature_included: include_lawyer_signature,
        base_contract_fee: 10,
        lawyer_fee: include_lawyer_signature ? 10000 : 0,
        total_amount: amount,
        service_type: "contract",
        fee_breakdown: {
          base_fee: 10,
          lawyer_fee: include_lawyer_signature ? 10000 : 0,
          total: amount
        }
      };
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "deduct_wallet_balance",
      {
        user_id: userId,
        amt: amount,
        transaction_type: isInvoiceCreation ? "invoice_creation" : service,
        reference,
        description: transactionDescription,
      }
    );

    if (rpcError) {
      console.error("❌ RPC deduct_wallet_balance failed:", rpcError.message);
      return NextResponse.json(
        { error: "Failed to process payment" },
        { status: 500 }
      );
    }

    // ✅ Extract RPC result
    const result =
      Array.isArray(rpcData) && rpcData.length > 0 ? rpcData[0] : rpcData;

    if (!result || result.status !== "OK") {
      return NextResponse.json(
        { error: result?.status || "Payment failed" },
        { status: 400 }
      );
    }

    // ✅ Update transaction with external_response data
    const { error: updateTxError } = await supabase
      .from("transactions")
      .update({
        external_response: externalResponseData,
        status: "success",
      })
      .eq("id", result.tx_id);

    if (updateTxError) {
      console.error(
        "❌ Failed to update transaction with external response:",
        updateTxError.message
      );
    }

    // ✅ Update user wallet balance
    const { error: balanceUpdateError } = await supabase
      .from("users")
      .update({
        wallet_balance: result.new_balance,
      })
      .eq("id", userId);

    if (balanceUpdateError) {
      console.error(
        "❌ Failed to update user wallet balance:",
        balanceUpdateError.message
      );
    }

    const finalTotalCount = (user.total_invoices_created || 0) + 1;

    return NextResponse.json({
      success: true,
      message: isInvoiceCreation
        ? `Paid invoice created successfully (₦${INVOICE_PRICE} deducted)`
        : service === "contract"
          ? (include_lawyer_signature
            ? "Contract with lawyer signature created successfully"
            : "Contract created successfully")
          : "Funds deducted successfully",
      reference,
      transactionId: result.tx_id,
      newWalletBalance: result.new_balance,
      freeInvoicesLeft: 0, // No free invoices left after exceeding limit
      totalInvoicesCreated: finalTotalCount,
      charged: true, // Always charged when no free invoices
      amount: amount,
      isInvoiceCreation: isInvoiceCreation,
      include_lawyer_signature: include_lawyer_signature,
      status: "success",
      hasFreeInvoices: false, // Important: user has no free invoices left
    });
  } catch (err: any) {
    console.error("❌ Deduct Funds Error:", err.message);
    return NextResponse.json(
      { error: err.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}