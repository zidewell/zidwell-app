// app/api/payment-page/public/[slug]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const slug = (await params).slug;

    // Get published page
    const { data: page, error: pageError } = await supabase
      .from("payment_pages")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (pageError || !page) {
      return NextResponse.json({ error: "Payment page not found" }, { status: 404 });
    }

    // Get all completed payments for student tracking
    const { data: payments } = await supabase
      .from("payment_page_payments")
      .select("student_name, selected_students, amount, payment_type, total_amount, paid_amount, installment_number, total_installments")
      .eq("payment_page_id", page.id)
      .eq("status", "completed");

    // Calculate student payments if this is a school page
    if (page.page_type === "school" && page.metadata?.students) {
      const studentPaymentMap: Record<string, number> = {};
      
      payments?.forEach((payment: any) => {
        // Handle single student payment
        if (payment.student_name) {
          studentPaymentMap[payment.student_name] = (studentPaymentMap[payment.student_name] || 0) + payment.amount;
        }
        // Handle multiple students in one payment
        if (payment.selected_students && Array.isArray(payment.selected_students)) {
          const amountPerStudent = payment.amount / payment.selected_students.length;
          payment.selected_students.forEach((studentName: string) => {
            studentPaymentMap[studentName] = (studentPaymentMap[studentName] || 0) + amountPerStudent;
          });
        }
      });

      const totalAmountPerStudent = page.metadata.totalAmount || page.price || 0;
      
      // Update students with payment info
      const updatedStudents = page.metadata.students.map((student: any) => {
        const paidAmount = studentPaymentMap[student.name] || 0;
        const remainingBalance = totalAmountPerStudent - paidAmount;
        
        return {
          ...student,
          paidAmount,
          remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
          isFullyPaid: remainingBalance <= 0,
          totalAmount: totalAmountPerStudent,
        };
      });
      
      page.metadata.students = updatedStudents;
      page.metadata.totalAmountPerStudent = totalAmountPerStudent;
    }

   try {
  await supabase.rpc("increment_page_views", { p_page_id: page.id });
} catch (rpcError) {
  console.error("Failed to increment page views:", rpcError);
}
    return NextResponse.json({
      success: true,
      page: {
        id: page.id,
        title: page.title,
        slug: page.slug,
        description: page.description,
        coverImage: page.cover_image,
        logo: page.logo,
        productImages: page.product_images,
        priceType: page.price_type,
        price: page.price,
        installmentCount: page.installment_count,
        feeMode: page.fee_mode,
        pageType: page.page_type,
        metadata: page.metadata,
      },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}