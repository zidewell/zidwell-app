import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoiceId, amount, payerEmail } = body;

    console.log("🔍 Checking payment for invoice:", {
      invoiceId,
      amount,
      payerEmail,
    });

    // 1. Find the invoice first (case-insensitive search)
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .or(`invoice_id.ilike.%${invoiceId}%,invoice_id.eq.${invoiceId}`)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // 2. Check invoice_payments table for completed payments
    const { data: payments, error: paymentsError } = await supabase
      .from("invoice_payments")
      .select("*")
      .eq("invoice_id", invoice.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (paymentsError) {
      console.error("Error fetching payments:", paymentsError);
      // Continue to check other tables
    }

    // 3. Check if any payment matches the amount and payer
    if (payments && payments.length > 0) {
      const matchingPayment = payments.find((payment) => {
        const amountMatches = Math.abs(payment.amount - amount) < 1; 
        const emailMatches = payment.payer_email === payerEmail;
        const narrationMatches = payment.narration?.includes(invoiceId);
        
        console.log("Payment check:", {
          paymentAmount: payment.amount,
          requestedAmount: amount,
          amountMatches,
          paymentEmail: payment.payer_email,
          requestedEmail: payerEmail,
          emailMatches,
          narration: payment.narration,
          narrationMatches,
        });
        
        return amountMatches && (emailMatches || narrationMatches);
      });

      if (matchingPayment) {
        console.log("✅ Found matching payment in invoice_payments:", matchingPayment.id);
        return NextResponse.json(
          {
            paymentExists: true,
            foundIn: "invoice_payments",
            paymentId: matchingPayment.id,
            timestamp: matchingPayment.paid_at,
            amount: matchingPayment.amount,
            payerEmail: matchingPayment.payer_email,
          },
          { status: 200 }
        );
      }
    }

    // 4. Check transactions table (virtual account deposits)
    // Look for transactions where narration contains invoice ID
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("*")
      .eq("status", "success")
      .ilike("narration", `%${invoiceId}%`)
      .order("created_at", { ascending: false });

    if (!transactionsError && transactions && transactions.length > 0) {
      console.log(`Found ${transactions.length} transactions with invoice ID in narration`);
      
      // Check if any transaction matches the amount
      const matchingTransaction = transactions.find(
        (tx) => Math.abs(tx.amount - amount) < 1
      );

      if (matchingTransaction) {
        console.log("✅ Found matching transaction in transactions table:", matchingTransaction.id);
        return NextResponse.json(
          {
            paymentExists: true,
            foundIn: "transactions",
            transactionId: matchingTransaction.id,
            timestamp: matchingTransaction.created_at,
            amount: matchingTransaction.amount,
            narration: matchingTransaction.narration,
          },
          { status: 200 }
        );
      }
      
      // Check if any transaction matches the payer email (from sender field)
      if (payerEmail) {
        const transactionWithEmail = transactions.find((tx) => {
          const senderEmail = tx.sender?.email || tx.external_response?.customer?.senderEmail;
          return senderEmail === payerEmail && Math.abs(tx.amount - amount) < 1;
        });
        
        if (transactionWithEmail) {
          console.log("✅ Found transaction with matching email:", transactionWithEmail.id);
          return NextResponse.json(
            {
              paymentExists: true,
              foundIn: "transactions_email",
              transactionId: transactionWithEmail.id,
              timestamp: transactionWithEmail.created_at,
              amount: transactionWithEmail.amount,
              senderEmail: transactionWithEmail.sender?.email,
            },
            { status: 200 }
          );
        }
      }
    }

    // 5. Check if invoice status is already paid/partially paid
    if (invoice.status === "paid" || invoice.status === "partially_paid") {
      console.log("ℹ️ Invoice is already marked as", invoice.status);
      
      // If there's paid_amount, check if it covers or exceeds our amount
      if (invoice.paid_amount && invoice.paid_amount >= amount) {
        return NextResponse.json(
          {
            paymentExists: true,
            foundIn: "invoice_status",
            status: invoice.status,
            paid_amount: invoice.paid_amount,
            total_amount: invoice.total_amount,
          },
          { status: 200 }
        );
      }
    }

    // 6. Check transactions by external_response (for virtual account deposits)
    // This looks in the external_response JSON field for invoice references
    const { data: vaTransactions, error: vaError } = await supabase
      .from("transactions")
      .select("*")
      .eq("status", "success")
      .eq("type", "virtual_account_deposit")
      .or(
        `external_response->>invoice_reference.eq.${invoiceId},external_response->>invoice_payment.is.true`
      )
      .order("created_at", { ascending: false });

    if (!vaError && vaTransactions && vaTransactions.length > 0) {
      console.log(`Found ${vaTransactions.length} VA transactions with invoice reference`);
      
      const matchingVATransaction = vaTransactions.find(
        (tx) => Math.abs(tx.amount - amount) < 1
      );

      if (matchingVATransaction) {
        console.log("✅ Found matching VA transaction:", matchingVATransaction.id);
        return NextResponse.json(
          {
            paymentExists: true,
            foundIn: "va_transactions",
            transactionId: matchingVATransaction.id,
            timestamp: matchingVATransaction.created_at,
            amount: matchingVATransaction.amount,
          },
          { status: 200 }
        );
      }
    }

    // 7. Check if there are any payments close to the amount (within 10% margin)
    // This helps with rounding differences or fee deductions
    const amountMin = amount * 0.9; // 10% lower
    const amountMax = amount * 1.1; // 10% higher
    
    // Check in invoice_payments
    const { data: similarPayments, error: similarError } = await supabase
      .from("invoice_payments")
      .select("*")
      .eq("invoice_id", invoice.id)
      .eq("status", "completed")
      .gte("amount", amountMin)
      .lte("amount", amountMax)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!similarError && similarPayments && similarPayments.length > 0) {
      console.log("🔄 Found similar payment amount (within 10%):", similarPayments[0].amount);
      return NextResponse.json(
        {
          paymentExists: true,
          foundIn: "similar_amount",
          paymentId: similarPayments[0].id,
          amount: similarPayments[0].amount,
          requestedAmount: amount,
          difference: Math.abs(similarPayments[0].amount - amount),
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        paymentExists: false,
        message: "Payment not found yet. Please wait a few minutes and try again.",
        suggestions: [
          "Check if the invoice ID was included in the transfer narration",
          "Wait 2-5 minutes for the payment to be processed",
          "Verify the amount transferred matches the invoice amount",
          "Ensure you used the correct email address"
        ],
        checkedPlaces: [
          "invoice_payments table",
          "transactions table (narration)",
          "transactions table (VA deposits)",
          "invoice status",
          "similar amounts (within 10%)"
        ]
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Error checking payment:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}