// app/api/payment-page/public/transfer-payment/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const generateTransferReference = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `TRF2${random}${timestamp}`.toUpperCase();
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      pageSlug, 
      customerName, 
      customerEmail, 
      customerPhone, 
      amount, 
      metadata,
      transferReference 
    } = body;

    console.log("📝 Transfer Payment Request:", { pageSlug, customerName, customerEmail, amount });

    // Validate required fields
    if (!pageSlug || !customerName || !customerEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get payment page
    const { data: page, error: pageError } = await supabase
      .from("payment_pages")
      .select("*")
      .eq("slug", pageSlug)
      .eq("is_published", true)
      .single();

    if (pageError || !page) {
      console.error("❌ Payment page not found:", pageError);
      return NextResponse.json({ error: "Payment page not found" }, { status: 404 });
    }

    // Get virtual account from metadata
    const virtualAccount = page.metadata?.virtual_account;
    if (!virtualAccount?.accountNumber) {
      console.error("❌ Virtual account not configured for page:", page.id);
      return NextResponse.json({ error: "Virtual account not configured" }, { status: 400 });
    }

    // Calculate final amount
    let finalAmount = amount;
    if (!finalAmount || finalAmount === 0) {
      if (page.page_type === "school" && page.metadata?.feeBreakdown?.length > 0) {
        finalAmount = page.metadata.feeBreakdown.reduce((sum: number, item: any) => sum + item.amount, 0);
      } else {
        finalAmount = page.price;
      }
    }

    // Fee calculation
    const fee = Math.min(finalAmount * 0.02, 2000);
    const numberOfStudents = metadata?.numberOfStudents || 1;
    const totalForCustomer = finalAmount * numberOfStudents;
    const transferRef = transferReference || generateTransferReference();
    const orderReference = `VA-${page.id.substring(0, 8)}-${Date.now()}`;

    // Build narration from customer info and metadata
    let narration = metadata?.narration || page.title;
    if (customerName) narration += ` - ${customerName}`;
    
    // Add custom fields to narration for identification
    const customFieldsText = metadata?.customFields 
      ? Object.entries(metadata.customFields)
          .filter(([key]) => key !== "customAmount")
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ")
      : "";
    if (customFieldsText) narration += ` (${customFieldsText})`;

    console.log("📝 Creating pending payment with narration:", narration);
    console.log("📝 Transfer Reference:", transferRef);

    // Prepare payment record (pending until webhook confirms)
    const paymentData: any = {
      payment_page_id: page.id,
      user_id: page.user_id,
      amount: totalForCustomer,
      fee: fee * numberOfStudents,
      net_amount: (finalAmount - fee) * numberOfStudents,
      status: "pending",
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || "",
      order_reference: orderReference,
      transfer_reference: transferRef, // <-- CRITICAL: This must be set!
      payment_type: metadata?.isInstallment ? "installment" : "full",
      total_amount: metadata?.totalAmount || finalAmount,
      payment_method: "virtual_account",
      metadata: {
        ...metadata,
        narration: narration,
        virtual_account_number: virtualAccount.accountNumber,
        bank_name: virtualAccount.bankName,
        payment_method: "virtual_account",
        expected_amount: totalForCustomer,
        transfer_reference: transferRef,
        customFields: metadata?.customFields || null, // Preserve custom fields
        referenceCode: metadata?.referenceCode || null,
      },
    };

    // Add student tracking for school payments
    if (page.page_type === "school") {
      if (metadata?.selectedStudents && metadata.selectedStudents.length === 1) {
        paymentData.student_name = metadata.selectedStudents[0];
        paymentData.parent_name = metadata.parentName || customerName;
      } else if (metadata?.selectedStudents && metadata.selectedStudents.length > 1) {
        paymentData.selected_students = metadata.selectedStudents;
        paymentData.parent_name = metadata.parentName || customerName;
      }
      
      if (metadata?.isInstallment) {
        paymentData.installment_number = metadata.currentInstallment || 1;
        paymentData.total_installments = metadata.totalInstallments;
      }
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payment_page_payments")
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      console.error("❌ Error creating payment:", paymentError);
      return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
    }

    console.log("✅ Pending payment created:", {
      id: payment.id,
      transfer_reference: payment.transfer_reference,
      customer_name: payment.customer_name,
      customer_email: payment.customer_email,
      metadata: payment.metadata,
    });

    // Return virtual account details with transfer reference and narration
    return NextResponse.json({
      success: true,
      virtualAccount: {
        accountNumber: virtualAccount.accountNumber,
        bankName: virtualAccount.bankName,
        accountName: virtualAccount.bankAccountName || virtualAccount.accountName,
        amount: totalForCustomer,
      },
      transferReference: transferRef,
      narration: narration,
      orderReference: orderReference,
      paymentId: payment.id,
      instruction: `Please transfer exactly ₦${totalForCustomer.toLocaleString()} to the account above using the narration: "${narration}"`,
    });
  } catch (error: any) {
    console.error("❌ Transfer payment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}