// app/api/webhook/services/card-payment.service.ts

import { createClient } from "@supabase/supabase-js";
import { sendPaymentPageReceiptWithPDF } from "@/lib/generate-payment-receipts-pdf";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl = process.env.NODE_ENV === "development"
  ? process.env.NEXT_PUBLIC_DEV_URL
  : process.env.NEXT_PUBLIC_BASE_URL;

interface CardPaymentWebhookParams {
  nombaTransactionId: string;
  orderReference: string;
  payment: any;
}

// ============================================================
// ✅ UPDATE STUDENT PAID STATUS IN PAGE METADATA
// ============================================================
async function updateStudentPaidStatus(
  paymentPageId: string,
  studentNames: string[],
  parentName: string,
  amount: number,
): Promise<void> {
  try {
    console.log(`📊 Updating student paid status for ${studentNames.length} student(s)`);
    
    // Get current page metadata
    const { data: page, error: fetchError } = await supabase
      .from("payment_pages")
      .select("metadata, price")
      .eq("id", paymentPageId)
      .single();

    if (fetchError) {
      console.error("❌ Failed to fetch page metadata:", fetchError);
      return;
    }

    if (!page?.metadata?.students) {
      console.log("⚠️ No students found in page metadata");
      return;
    }

    const students = page.metadata.students;
    const totalAmount = Number(page.price) || 0;
    const amountPerStudent = amount / studentNames.length;

    console.log(`📊 Total amount: ${totalAmount}, Amount per student: ${amountPerStudent}`);

    // Update each student's paidAmount
    const updatedStudents = students.map((student: any) => {
      const studentName = student.name || student.studentName || "";
      const isSelected = studentNames.some(
        name => name?.toLowerCase().trim() === studentName?.toLowerCase().trim()
      );

      if (isSelected) {
        const currentPaidAmount = Number(student.paidAmount) || 0;
        const newPaidAmount = currentPaidAmount + amountPerStudent;
        const isFullyPaid = newPaidAmount >= totalAmount;

        console.log(`📊 Student ${studentName}: ${currentPaidAmount} + ${amountPerStudent} = ${newPaidAmount}, fullyPaid: ${isFullyPaid}`);

        return {
          ...student,
          paidAmount: Math.round(newPaidAmount * 100) / 100,
          paid: isFullyPaid,
          isPartiallyPaid: !isFullyPaid && newPaidAmount > 0,
          parentName: parentName || student.parentName || "Unknown",
          paidAt: new Date().toISOString(),
          lastPaidAt: new Date().toISOString(),
        };
      }
      return student;
    });

    // Update page metadata
    const { error: updateError } = await supabase
      .from("payment_pages")
      .update({
        metadata: {
          ...page.metadata,
          students: updatedStudents,
        },
      })
      .eq("id", paymentPageId);

    if (updateError) {
      console.error("❌ Failed to update student paid status:", updateError);
    } else {
      console.log(`✅ Updated paid status for ${studentNames.length} student(s)`);
      // Log the updated students for verification
      updatedStudents.forEach((s: any) => {
        if (studentNames.some(name => name?.toLowerCase().trim() === s.name?.toLowerCase().trim())) {
          console.log(`   ✅ ${s.name}: paidAmount=${s.paidAmount}, paid=${s.paid}`);
        }
      });
    }
  } catch (error) {
    console.error("❌ Error updating student paid status:", error);
  }
}

// ============================================================
// ✅ PROCESS CARD PAYMENT WEBHOOK
// ============================================================
export async function processCardPaymentWebhook(
  payload: any,
  params: CardPaymentWebhookParams
): Promise<{ success: true; message: string; payment_id: string } | { error: string; status?: number }> {
  const { nombaTransactionId, orderReference, payment } = params;

  console.log("💳 ========== PROCESSING CARD PAYMENT WEBHOOK ==========");
  console.log("Transaction ID:", nombaTransactionId);
  console.log("Order Reference:", orderReference);
  console.log("Payment ID:", payment.id);

  if (payment.status === "completed") {
    console.log("⏭️ Payment already completed");
    return { success: true, message: "Already processed", payment_id: payment.id };
  }

  try {
    // ✅ 1. Update payment status
    const { error: updateError } = await supabase
      .from("payment_page_payments")
      .update({
        status: "completed",
        nomba_transaction_id: nombaTransactionId,
        paid_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        receipt_sent: false,
      })
      .eq("id", payment.id);

    if (updateError) {
      console.error("❌ Failed to update payment:", updateError);
      return { error: "Failed to update payment", status: 500 };
    }

    console.log("✅ Payment updated to completed:", payment.id);

    // ✅ 2. Update student paid status
    const selectedStudents = payment.metadata?.selectedStudents || [];
    const studentName = payment.student_name;
    const parentName = payment.parent_name || payment.customer_name;

    let studentNames: string[] = [];

    if (selectedStudents.length > 0) {
      studentNames = selectedStudents;
    } else if (studentName) {
      studentNames = [studentName];
    }

    if (studentNames.length > 0) {
      console.log(`📊 Updating ${studentNames.length} student(s):`, studentNames);
      await updateStudentPaidStatus(
        payment.payment_page_id,
        studentNames,
        parentName,
        payment.amount
      );
    }

    // ✅ 3. Credit the page balance
    const { error: balanceError } = await supabase.rpc(
      "increment_page_balance",
      {
        p_page_id: payment.payment_page_id,
        p_amount: payment.net_amount,
      }
    );

    if (balanceError) {
      console.error("❌ Failed to increment balance:", balanceError);
    } else {
      console.log(`✅ Balance incremented by ₦${payment.net_amount}`);
    }

    // ✅ 4. Create transaction record
    const { error: txError } = await supabase.from("transactions").insert({
      user_id: payment.user_id,
      type: "credit",
      amount: payment.amount,
      fee: payment.fee,
      net_amount: payment.net_amount,
      status: "success",
      reference: `CARD-${payment.payment_page_id}-${nombaTransactionId}`,
      description: `Card payment for "${payment.payment_pages?.title}" from ${payment.customer_name}`,
      channel: "payment_page_card",
      sender: {
        name: payment.customer_name,
        email: payment.customer_email,
        phone: payment.customer_phone,
        order_reference: orderReference,
        students: studentNames,
      },
      receiver: {
        user_id: payment.user_id,
        payment_page_id: payment.payment_page_id,
      },
      external_response: {
        transaction_id: nombaTransactionId,
        payment_method: "card",
        order_reference: orderReference,
      },
    });

    if (txError) {
      console.error("❌ Failed to create transaction:", txError);
    }

    // ✅ 5. Send receipt to customer
    if (payment.customer_email) {
      console.log(`📧 Sending receipt to: ${payment.customer_email}`);
      await sendPaymentPageReceiptWithPDF(
        payment.customer_email,
        payment.payment_pages,
        payment,
        payment.customer_name,
        payment.amount,
        nombaTransactionId,
        "card",
        new Date().toISOString(),
        payment.metadata
      ).catch(err => console.error("Failed to send receipt:", err));

      await supabase
        .from("payment_page_payments")
        .update({ receipt_sent: true })
        .eq("id", payment.id);
      
      console.log(`✅ Receipt sent to ${payment.customer_email}`);
    }

    // ✅ 6. Send notification to page creator
    const { data: creator } = await supabase
      .from("users")
      .select("email")
      .eq("id", payment.user_id)
      .single();

    if (creator?.email) {
      const { transporter } = await import("@/lib/node-mailer");
      try {
        await transporter.sendMail({
          from: `Zidwell <${process.env.EMAIL_USER}>`,
          to: creator.email,
          subject: `💰 Card Payment Received for "${payment.payment_pages?.title}" - ₦${payment.amount.toLocaleString()}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <img src="${baseUrl}/zidwell-header.png" style="width: 100%; margin-bottom: 20px;" />
              <h3 style="color: #22c55e;">✅ Card Payment Received!</h3>
              <p>You've received a card payment for <strong>${payment.payment_pages?.title}</strong>.</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
                <p><strong>Amount:</strong> ₦${payment.amount.toLocaleString()}</p>
                <p><strong>Fee (4%):</strong> ₦${payment.fee.toLocaleString()}</p>
                <p><strong>Net Credited:</strong> ₦${payment.net_amount.toLocaleString()}</p>
                <p><strong>Customer:</strong> ${payment.customer_name}</p>
                <p><strong>Email:</strong> ${payment.customer_email}</p>
                ${studentNames.length > 0 ? `<p><strong>Students:</strong> ${studentNames.join(', ')}</p>` : ''}
              </div>
              <p>Funds have been added to your page balance after 4% fee deduction.</p>
              <img src="${baseUrl}/zidwell-footer.png" style="width: 100%; margin-top: 20px;" />
            </div>
          `,
        });
        console.log(`✅ Notification sent to creator: ${creator.email}`);
      } catch (err) {
        console.error("Failed to send creator notification:", err);
      }
    }

    console.log("🎉 ========== CARD PAYMENT PROCESSING COMPLETED ==========");
    console.log(`   Payment ID: ${payment.id}`);
    console.log(`   Amount: ₦${payment.amount.toLocaleString()}`);
    console.log(`   Fee (4%): ₦${payment.fee.toLocaleString()}`);
    console.log(`   Net: ₦${payment.net_amount.toLocaleString()}`);
    console.log(`   Customer: ${payment.customer_name} (${payment.customer_email})`);
    console.log(`   Students: ${studentNames.join(', ') || 'None'}`);

    return {
      success: true,
      message: "Card payment processed successfully",
      payment_id: payment.id,
    };
  } catch (error: any) {
    console.error("Error processing card payment:", error);
    return { error: error.message || "Failed to process card payment", status: 500 };
  }
}