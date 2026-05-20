// app/api/payment-page/public/virtual-account/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pageSlug, customerName, customerEmail, customerPhone, amount, metadata } = body;

    if (!pageSlug || !customerName || !customerEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get payment page with virtual account
    const { data: page, error: pageError } = await supabase
      .from("payment_pages")
      .select("*")
      .eq("slug", pageSlug)
      .eq("is_published", true)
      .single();

    if (pageError || !page) {
      console.error("Page not found:", pageError);
      return NextResponse.json({ error: "Payment page not found" }, { status: 404 });
    }

    // Get the payment page's dedicated virtual account
    const virtualAccount = page.metadata?.virtual_account;
    
    if (!virtualAccount?.accountNumber) {
      return NextResponse.json(
        { error: "This payment page does not have a virtual account configured" },
        { status: 400 }
      );
    }

    console.log(`🏦 Using payment page's dedicated virtual account: ${virtualAccount.accountNumber}`);

    // Calculate amount
    let finalAmount = amount;
    if (!finalAmount || finalAmount === 0) {
      if (page.page_type === "school" && page.metadata?.feeBreakdown?.length > 0) {
        finalAmount = page.metadata.feeBreakdown.reduce((sum: number, item: any) => sum + item.amount, 0);
      } else {
        finalAmount = page.price;
      }
    }

    const numberOfStudents = metadata?.selectedStudents?.length || metadata?.numberOfStudents || 1;
    const totalAmount = finalAmount * numberOfStudents;
    const orderReference = `VA-${page.id.substring(0, 8)}-${Date.now()}`;
    const fee = Math.min(totalAmount * 0.02, 2000);

    // Create payment record
    const paymentData: any = {
      payment_page_id: page.id,
      user_id: page.user_id,
      amount: totalAmount,
      fee: fee,
      net_amount: totalAmount - fee,
      status: "pending",
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || "",
      order_reference: orderReference,
      payment_type: metadata?.isInstallment ? "installment" : "full",
      total_amount: metadata?.totalAmount || finalAmount,
      payment_method: "virtual_account",
      metadata: {
        ...metadata,
        virtual_account_number: virtualAccount.accountNumber,
        bank_name: virtualAccount.bankName,
        payment_method: "virtual_account",
      },
    };

    // Add student tracking for school payments
    if (page.page_type === "school") {
      if (metadata?.selectedStudents && metadata.selectedStudents.length === 1) {
        paymentData.student_name = metadata.selectedStudents[0];
        paymentData.parent_name = metadata.parentName;
      } else if (metadata?.selectedStudents && metadata.selectedStudents.length > 1) {
        paymentData.selected_students = metadata.selectedStudents;
        paymentData.parent_name = metadata.parentName;
      }
      
      if (metadata?.isInstallment) {
        paymentData.installment_number = metadata.currentInstallment || 1;
        paymentData.total_installments = metadata.totalInstallments;
      }
    }

    const { data: payment, error: paymentError } = await supabase
      .from("payment_page_payments")
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      console.error("Error creating payment:", paymentError);
      return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
    }

    // Return virtual account details
    return NextResponse.json({
      success: true,
      virtualAccount: {
        accountNumber: virtualAccount.accountNumber,
        bankName: virtualAccount.bankName,
        accountName: virtualAccount.accountName,
        amount: totalAmount,
        orderReference: orderReference,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      instruction: `Please transfer exactly ₦${totalAmount.toLocaleString()} to the account above.`,
      paymentId: payment.id,
    });
  } catch (error: any) {
    console.error("Virtual account error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}