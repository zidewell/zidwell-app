import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const authResult = await isAuthenticatedWithRefresh(req);
    const { user, newTokens } = authResult;
    
    if (!user) {
      return NextResponse.json(
        { error: "Please login to assign payments", logout: true },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { paymentId, studentName, amount, pageId } = body;

    if (!paymentId || !studentName || !amount || !pageId) {
      return NextResponse.json(
        { error: "Missing required fields: paymentId, studentName, amount, pageId" },
        { status: 400 }
      );
    }

    // Get the payment details
    const { data: payment, error: paymentError } = await supabase
      .from("payment_page_payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Verify payment belongs to user
    if (payment.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized - This payment does not belong to you" },
        { status: 403 }
      );
    }

    // Get the payment page details
    const { data: page, error: pageError } = await supabase
      .from("payment_pages")
      .select("*")
      .eq("id", pageId)
      .single();

    if (pageError || !page) {
      return NextResponse.json(
        { error: "Payment page not found" },
        { status: 404 }
      );
    }

    // Verify page belongs to user
    if (page.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized - This payment page does not belong to you" },
        { status: 403 }
      );
    }

    // Check if payment is already assigned
    const existingAssignment = payment.metadata?.assigned_student || payment.metadata?.matched_student;
    if (existingAssignment) {
      return NextResponse.json(
        { error: `Payment already assigned to "${existingAssignment}"` },
        { status: 400 }
      );
    }

    // Update the payment record with assigned student
    const updatedMetadata = {
      ...payment.metadata,
      assigned_student: studentName,
      assigned_at: new Date().toISOString(),
      assigned_by: user.id,
      matched_student: studentName,
      assigned_amount: amount,
    };

    const { error: updatePaymentError } = await supabase
      .from("payment_page_payments")
      .update({
        metadata: updatedMetadata,
        student_name: studentName,
      })
      .eq("id", paymentId);

    if (updatePaymentError) {
      console.error("Error updating payment:", updatePaymentError);
      return NextResponse.json(
        { error: updatePaymentError.message },
        { status: 500 }
      );
    }

    // Update the student's payment status in the page metadata
    const currentStudents = page.metadata?.students || [];
    const studentToUpdate = currentStudents.find((s: any) => {
      const studentIdentifier = s.name || s.childName || s.studentName;
      return studentIdentifier === studentName;
    });

    if (!studentToUpdate) {
      return NextResponse.json(
        { error: `Student "${studentName}" not found in this payment page` },
        { status: 404 }
      );
    }

    const currentPaidAmount = studentToUpdate.paidAmount || 0;
    const newPaidAmount = currentPaidAmount + amount;
    const totalAmount = page.price || 0;
    const isFullyPaid = newPaidAmount >= totalAmount;

    const updatedStudents = currentStudents.map((student: any) => {
      const studentIdentifier = student.name || student.childName || student.studentName;
      if (studentIdentifier === studentName) {
        return {
          ...student,
          paid: isFullyPaid,
          paidAt: new Date().toISOString(),
          paidAmount: newPaidAmount,
          parentName: payment.customer_name,
          parentEmail: payment.customer_email,
          paymentId: paymentId,
          lastPaymentDate: new Date().toISOString(),
          paymentHistory: [
            ...(student.paymentHistory || []),
            {
              amount: amount,
              date: new Date().toISOString(),
              paymentId: paymentId,
              customerName: payment.customer_name,
            }
          ]
        };
      }
      return student;
    });

    // Update total collected amount in page metadata
    const totalCollected = updatedStudents.reduce(
      (sum: number, s: any) => sum + (s.paidAmount || 0),
      0
    );

    const { error: updatePageError } = await supabase
      .from("payment_pages")
      .update({
        metadata: {
          ...page.metadata,
          students: updatedStudents,
          total_collected: totalCollected,
          last_payment_at: new Date().toISOString(),
        },
        total_revenue: (page.total_revenue || 0) + amount,
        total_payments: (page.total_payments || 0) + 1,
      })
      .eq("id", pageId);

    if (updatePageError) {
      console.error("Error updating page:", updatePageError);
      return NextResponse.json(
        { error: updatePageError.message },
        { status: 500 }
      );
    }

    const responseData = {
      success: true,
      message: ` Payment of ₦${amount.toLocaleString()} successfully assigned to "${studentName}"!`,
      data: {
        paymentId,
        studentName,
        amount,
        isFullyPaid,
        newPaidAmount,
        remainingAmount: totalAmount - newPaidAmount,
      }
    };

    if (newTokens) {
      const response = NextResponse.json(responseData);
      return response;
    }
    
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    console.error("Assign payment error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}