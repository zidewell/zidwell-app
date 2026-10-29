// app/api/webhook/services/payment-page.service.ts
import { createClient } from "@supabase/supabase-js";
import { transporter } from "@/lib/node-mailer";
import { sendPaymentPageReceiptWithPDF } from "@/lib/generate-payment-receipts-pdf";
import {
  renderFulfillmentBlock,
  fulfillmentFromPayment,
} from "@/lib/delivery-email-block";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_DEV_URL
    : process.env.NEXT_PUBLIC_BASE_URL;

const FEE_CONFIG = {
  ZIDWELL_FEE_PERCENTAGE: 0.03,
  NOMBA_FEE_PERCENTAGE: 0.004,
  TOTAL_FEE_PERCENTAGE: 0.034,
  WITHDRAWAL_FEE: 200,
  ACTIVATION_FEE: 2000,
  MIN_WITHDRAWAL: 1000,
};

function calculateFees(amount: number): {
  gross: number;
  nombaFee: number;
  zidwellFee: number;
  totalFee: number;
  netAmount: number;
  feePercentage: number;
} {
  const nombaFee = amount * FEE_CONFIG.NOMBA_FEE_PERCENTAGE;
  const zidwellFee = amount * FEE_CONFIG.ZIDWELL_FEE_PERCENTAGE;
  const totalFee = nombaFee + zidwellFee;
  const netAmount = amount - totalFee;

  return {
    gross: amount,
    nombaFee: Math.round(nombaFee * 100) / 100,
    zidwellFee: Math.round(zidwellFee * 100) / 100,
    totalFee: Math.round(totalFee * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
    feePercentage: FEE_CONFIG.TOTAL_FEE_PERCENTAGE * 100,
  };
}

function extractNarrationCode(narration: string): string | null {
  if (!narration) return null;

  const beforeSlash = narration.split(/[/\s-]/)[0];
  if (beforeSlash && beforeSlash.startsWith("PL")) {
    return beforeSlash;
  }

  const patterns = [
    /PL_[A-Z0-9]{4,6}/,
    /PL[A-Z0-9]{4,6}/,
    /PL_[A-Z0-9]+/,
    /PL[A-Z0-9_]+/,
  ];

  for (const pattern of patterns) {
    const match = narration.match(pattern);
    if (match) return match[0];
  }

  return null;
}

function normalizeNarrationCode(code: string): string {
  if (!code) return "";
  return code.replace(/[_\s-]/g, "").toUpperCase();
}

function doNarrationCodesMatch(code1: string, code2: string): boolean {
  if (!code1 || !code2) return false;

  const normalized1 = normalizeNarrationCode(code1);
  const normalized2 = normalizeNarrationCode(code2);

  if (normalized1 === normalized2) return true;
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1))
    return true;

  const base1 = normalized1.substring(0, 4);
  const base2 = normalized2.substring(0, 4);
  if (base1 === base2 && base1.length === 4) return true;

  return false;
}

function extractStudentNamesFromNarration(
  narration: string,
  students: any[],
): string[] {
  if (!narration || !students || students.length === 0) return [];

  const matchedStudents: string[] = [];

  for (const student of students) {
    const studentName =
      student.name || student.childName || student.studentName;
    if (
      studentName &&
      narration.toLowerCase().includes(studentName.toLowerCase())
    ) {
      matchedStudents.push(studentName);
    }
  }

  return matchedStudents;
}

async function sendPaymentPageNotificationEmail(
  creatorEmail: string,
  pageTitle: string,
  amount: number,
  customerName: string,
  customerEmail: string,
  narration: string,
  nombaFee: number,
  zidwellFee: number,
  customFields?: any,
  selectedStudents?: string[],
  deliveryHtml?: string | null,
): Promise<void> {
  if (!creatorEmail || !creatorEmail.includes("@")) return;

  const totalFee = nombaFee + zidwellFee;
  const netAmount = amount - totalFee;

  let studentsHtml = "";
  if (selectedStudents && selectedStudents.length > 0) {
    studentsHtml = `
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
        <p style="font-weight: 600; margin-bottom: 5px;">Students:</p>
        <ul style="margin: 0; padding-left: 20px;">
          ${selectedStudents.map((name) => `<li>${name}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  let customFieldsHtml = "";
  if (customFields && Object.keys(customFields).length > 0) {
    customFieldsHtml = `
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
        <p style="font-weight: 600; margin-bottom: 5px;">Additional Information:</p>
        ${Object.entries(customFields)
          .filter(
            ([key]) =>
              !["customAmount", "name", "email", "phone"].includes(key),
          )
          .map(
            ([key, value]) => `
            <p style="margin: 2px 0; font-size: 14px;">
              <strong>${key}:</strong> ${value || "N/A"}
            </p>
          `,
          )
          .join("")}
      </div>
    `;
  }

  try {
    await transporter.sendMail({
      from: `Zidwell <${process.env.EMAIL_USER}>`,
      to: creatorEmail,
      subject: `💰 Payment Received for "${pageTitle}" - ₦${netAmount.toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${baseUrl}/zidwell-header.png" style="width: 100%; margin-bottom: 20px;" />
          <h3 style="color: #22c55e;">✅ Payment Received! 🏦</h3>
          <p>You've received a bank transfer payment for <strong>${pageTitle}</strong>.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
            <p><strong>Nomba Fee (0.4%):</strong> -₦${nombaFee.toLocaleString()}</p>
            <p><strong>Zidwell Fee (3%):</strong> -₦${zidwellFee.toLocaleString()}</p>
            <p><strong>Total Fees:</strong> -₦${totalFee.toLocaleString()}</p>
            <p><strong>Amount Credited:</strong> ₦${netAmount.toLocaleString()}</p>
            <p><strong>Sender:</strong> ${customerName}</p>
            ${customerEmail ? `<p><strong>Email:</strong> ${customerEmail}</p>` : ""}
            ${studentsHtml}
            ${customFieldsHtml}
          </div>
          ${deliveryHtml || ""}
          <p>Funds added to your store owner wallet after fee deductions.</p>
          <img src="${baseUrl}/zidwell-footer.png" style="width: 100%; margin-top: 20px;" />
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}

async function updateStudentPaidStatus(
  paymentPageId: string,
  studentNames: string[],
  parentName: string,
  amount: number,
): Promise<void> {
  try {
    const { data: paymentPage, error: fetchError } = await supabase
      .from("payment_pages")
      .select("metadata")
      .eq("id", paymentPageId)
      .single();

    if (fetchError || !paymentPage?.metadata?.students) {
      return;
    }

    const updatedStudents = paymentPage.metadata.students.map((student: any) => {
      const studentName =
        student.name || student.childName || student.studentName;
      const isSelected = studentNames.some(
        (name) =>
          name?.toLowerCase().trim() === studentName?.toLowerCase().trim(),
      );

      if (isSelected) {
        const currentPaidAmount = student.paidAmount || 0;
        const newPaidAmount = currentPaidAmount + amount;
        const totalAmount =
          student.totalAmount ||
          paymentPage.metadata.totalAmountPerStudent ||
          0;

        return {
          ...student,
          paid: newPaidAmount >= totalAmount,
          paidAt: new Date().toISOString(),
          paidAmount: newPaidAmount,
          parentName: parentName,
          lastPaymentDate: new Date().toISOString(),
        };
      }
      return student;
    });

    await supabase
      .from("payment_pages")
      .update({
        metadata: {
          ...paymentPage.metadata,
          students: updatedStudents,
        },
      })
      .eq("id", paymentPageId);

    console.log(
      `✅ Updated paid status for students: ${studentNames.join(", ")}`,
    );
  } catch (error) {
    console.error("Error updating student paid status:", error);
  }
}

export async function processPaymentPageVirtualAccount(
  payload: any,
  params: {
    nombaTransactionId: string;
    nombaFee: number;
    aliasAccountReference: string;
    transactionAmount: number;
    customer: any;
    tx: any;
    transferReference?: string;
  },
): Promise<
  | {
      success: boolean;
      message: string;
      payment_id?: string;
      credited_amount?: number;
      new_balance?: number | null;
    }
  | { error: string; status?: number }
> {
  const {
    nombaTransactionId,
    nombaFee,
    aliasAccountReference,
    transactionAmount,
    customer,
    tx,
    transferReference,
  } = params;

  console.log("🏦 ========== PROCESSING PAYMENT PAGE VIRTUAL ACCOUNT ==========");
  console.log("Transaction ID:", nombaTransactionId);
  console.log("Virtual Account Ref:", aliasAccountReference);
  console.log("Gross Amount:", transactionAmount);
  console.log("Nomba Fee:", nombaFee);

  const feeBreakdown = calculateFees(transactionAmount);

  console.log(`💰 Fee Breakdown (Updated - 3% Zidwell):`);
  console.log(`   Gross Amount: ₦${feeBreakdown.gross.toLocaleString()}`);
  console.log(`   Nomba Fee (0.4%): -₦${feeBreakdown.nombaFee.toLocaleString()}`);
  console.log(`   Zidwell Fee (3%): -₦${feeBreakdown.zidwellFee.toLocaleString()}`);
  console.log(`   Total Fees (3.4%): -₦${feeBreakdown.totalFee.toLocaleString()}`);
  console.log(`   Net to Merchant: ₦${feeBreakdown.netAmount.toLocaleString()}`);

  const virtualAccountNumber = tx.aliasAccountNumber;
  let paymentPage: any = null;

  if (virtualAccountNumber) {
    const { data: foundPage } = await supabase
      .from("payment_pages")
      .select("id, title, user_id, page_type, metadata")
      .eq("metadata->virtual_account->>accountNumber", virtualAccountNumber)
      .maybeSingle();

    if (foundPage) {
      paymentPage = foundPage;
      console.log("✅ Found payment page by account number:", paymentPage.id);
    }
  }

  if (!paymentPage) {
    const shortPageId = aliasAccountReference.replace(/^PPL-|^VA-PP-/, "");
    if (shortPageId) {
      const { data: foundPage } = await supabase
        .from("payment_pages")
        .select("id, title, user_id, page_type, metadata")
        .ilike("id", `%${shortPageId.substring(0, 15)}%`)
        .maybeSingle();

      if (foundPage) {
        paymentPage = foundPage;
        console.log("✅ Found payment page by ID match:", paymentPage.id);
      }
    }
  }

  if (!paymentPage) {
    console.error(
      "❌ Payment page not found for reference:",
      aliasAccountReference,
    );
    return { error: "Payment page not found", status: 404 };
  }

  console.log("✅ Payment page found:", paymentPage.title);

  const { data: existingWebhook } = await supabase
    .from("payment_page_payments")
    .select("id")
    .eq("nomba_transaction_id", nombaTransactionId)
    .maybeSingle();

  if (existingWebhook) {
    console.log(
      `⏭️ Webhook already processed for transaction: ${nombaTransactionId}`,
    );
    return { success: true, message: "Already processed" };
  }

  const narration = tx?.narration || tx?.senderName || "";
  const webhookNarrationCode = extractNarrationCode(narration);

  let pendingPayment: any = null;

  if (webhookNarrationCode) {
    const { data: pendingPayments } = await supabase
      .from("payment_page_payments")
      .select("*")
      .eq("payment_page_id", paymentPage.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (pendingPayments && pendingPayments.length > 0) {
      for (const payment of pendingPayments) {
        const paymentNarration = payment.metadata?.narration || "";
        const paymentNarrationCode =
          extractNarrationCode(paymentNarration) || paymentNarration;

        if (doNarrationCodesMatch(paymentNarrationCode, webhookNarrationCode)) {
          pendingPayment = payment;
          console.log(`✅ Found matching pending payment: ${pendingPayment.id}`);
          break;
        }
      }
    }
  }

  if (!pendingPayment) {
    const { data: latestPayment } = await supabase
      .from("payment_page_payments")
      .select("*")
      .eq("payment_page_id", paymentPage.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestPayment) {
      pendingPayment = latestPayment;
      console.log(
        `✅ Using most recent pending payment: ${pendingPayment.id}`,
      );
    }
  }

  const senderName =
    pendingPayment?.customer_name ||
    tx?.senderName ||
    customer?.name ||
    "Bank Transfer Customer";
  const customerEmail =
    pendingPayment?.customer_email || customer?.email || null;
  const customerPhone = pendingPayment?.customer_phone || tx?.senderPhone || null;

  let matchedStudentNames: string[] = [];
  let matchedParentName: string | null = null;

  if (pendingPayment) {
    if (
      pendingPayment.selected_students &&
      Array.isArray(pendingPayment.selected_students)
    ) {
      matchedStudentNames = pendingPayment.selected_students;
      matchedParentName = pendingPayment.parent_name || senderName;
    } else if (pendingPayment.student_name) {
      matchedStudentNames = [pendingPayment.student_name];
      matchedParentName = pendingPayment.parent_name || senderName;
    }
  }

  const orderReference = `VA-${paymentPage.id.substring(0, 8)}-${Date.now()}`;

  let mergedMetadata: any = pendingPayment?.metadata || {};
  if (!mergedMetadata || Object.keys(mergedMetadata).length === 0) {
    mergedMetadata = { narration: webhookNarrationCode || narration };
  }

  const webhookData = {
    narration: webhookNarrationCode || narration,
    bank_transaction_id: nombaTransactionId,
    matched_students: matchedStudentNames,
    matched_parent: matchedParentName,
    gross_amount: transactionAmount,
    nomba_fee: feeBreakdown.nombaFee,
    zidwell_fee: feeBreakdown.zidwellFee,
    total_fee: feeBreakdown.totalFee,
    net_credit: feeBreakdown.netAmount,
    fee_percentage: 3.4,
    webhook_processed_at: new Date().toISOString(),
  };

  mergedMetadata = { ...mergedMetadata, ...webhookData };

  let paymentResult: any;

  if (pendingPayment) {
    const updateData: any = {
      status: "completed",
      nomba_transaction_id: nombaTransactionId,
      paid_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
      amount: transactionAmount,
      fee: feeBreakdown.totalFee,
      nomba_fee: feeBreakdown.nombaFee,
      app_fee: feeBreakdown.zidwellFee,
      total_fee: feeBreakdown.totalFee,
      net_amount: feeBreakdown.netAmount,
      customer_name: pendingPayment.customer_name || senderName,
      customer_email: pendingPayment.customer_email || customerEmail,
      customer_phone: pendingPayment.customer_phone || customerPhone,
      metadata: mergedMetadata,
      receipt_sent: false,
    };

    if (paymentPage.page_type === "school") {
      if (matchedStudentNames.length === 1) {
        updateData.student_name = matchedStudentNames[0];
        updateData.parent_name = matchedParentName || senderName;
      } else if (matchedStudentNames.length > 1) {
        updateData.selected_students = matchedStudentNames;
        updateData.parent_name = matchedParentName || senderName;
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from("payment_page_payments")
      .update(updateData)
      .eq("id", pendingPayment.id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update payment:", updateError);
      return { error: "Failed to update payment", status: 500 };
    }

    paymentResult = updated;
    console.log(`✅ Updated pending payment: ${paymentResult.id}`);
  } else {
    const insertData: any = {
      payment_page_id: paymentPage.id,
      user_id: paymentPage.user_id,
      amount: transactionAmount,
      fee: feeBreakdown.totalFee,
      nomba_fee: feeBreakdown.nombaFee,
      app_fee: feeBreakdown.zidwellFee,
      total_fee: feeBreakdown.totalFee,
      net_amount: feeBreakdown.netAmount,
      status: "pending",
      customer_name: senderName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      payment_method: "virtual_account",
      order_reference: orderReference,
      metadata: mergedMetadata,
      receipt_sent: false,
    };

    if (paymentPage.page_type === "school") {
      if (matchedStudentNames.length === 1) {
        insertData.student_name = matchedStudentNames[0];
        insertData.parent_name = matchedParentName || senderName;
      } else if (matchedStudentNames.length > 1) {
        insertData.selected_students = matchedStudentNames;
        insertData.parent_name = matchedParentName || senderName;
      }
    }

    const { data: payment, error: insertError } = await supabase
      .from("payment_page_payments")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create payment:", insertError);
      return { error: "Failed to create payment", status: 500 };
    }

    paymentResult = payment;

    const completeData: any = {
      status: "completed",
      nomba_transaction_id: nombaTransactionId,
      paid_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
    };

    const { data: completed } = await supabase
      .from("payment_page_payments")
      .update(completeData)
      .eq("id", payment.id)
      .select()
      .single();

    if (completed) paymentResult = completed;
  }

  console.log("💰 Crediting store owner wallet with net amount...");
  console.log(`   Net amount: ₦${feeBreakdown.netAmount.toLocaleString()}`);

  const { data: walletResult, error: walletError } = await supabase.rpc(
    "credit_store_owner_wallet",
    {
      p_user_id: paymentPage.user_id,
      p_amount: feeBreakdown.netAmount,
      p_source: "payment_page",
      p_source_id: paymentPage.id,
      p_description: `Payment from ${senderName} for "${paymentPage.title}" (3% Zidwell fee)`,
    },
  );

  if (walletError) {
    console.error("❌ Failed to credit store wallet:", walletError);
  } else {
    console.log(
      `✅ Credited ₦${feeBreakdown.netAmount.toLocaleString()} to store owner wallet`,
    );
  }

  await supabase.rpc("increment_page_balance", {
    p_page_id: paymentPage.id,
    p_amount: feeBreakdown.netAmount,
  });

  if (paymentPage.page_type === "school" && matchedStudentNames.length > 0) {
    const amountPerStudent = feeBreakdown.netAmount / matchedStudentNames.length;
    await updateStudentPaidStatus(
      paymentPage.id,
      matchedStudentNames,
      matchedParentName || senderName,
      amountPerStudent,
    );
  }

  await supabase.from("transactions").insert({
    user_id: paymentPage.user_id,
    type: "credit",
    amount: transactionAmount,
    fee: feeBreakdown.totalFee,
    net_amount: feeBreakdown.netAmount,
    status: "success",
    reference: `VA-${paymentPage.id}-${nombaTransactionId}`,
    description: `Bank transfer payment for "${paymentPage.title}" from ${senderName}`,
    channel: "payment_page_virtual_account",
    sender: {
      name: senderName,
      email: customerEmail,
      phone: customerPhone,
      narration: narration,
    },
    receiver: {
      user_id: paymentPage.user_id,
      payment_page_id: paymentPage.id,
    },
    external_response: {
      nomba_transaction_id: nombaTransactionId,
      gross_amount: transactionAmount,
      nomba_fee: feeBreakdown.nombaFee,
      app_fee: feeBreakdown.zidwellFee,
      total_fee: feeBreakdown.totalFee,
      net_amount: feeBreakdown.netAmount,
      fee_percentage: 3.4,
      metadata: mergedMetadata,
      wallet_credit: walletResult || null,
    },
  });

  // ✅ Build fulfillment HTML — new single-arg signature
  const deliveryHtml = renderFulfillmentBlock(
    fulfillmentFromPayment(paymentResult),
  );

  if (customerEmail) {
    await sendPaymentPageReceiptWithPDF(
      customerEmail,
      paymentPage,
      paymentResult,
      senderName,
      transactionAmount,
      nombaTransactionId,
      "virtual_account",
      new Date().toISOString(),
      {
        narration: webhookNarrationCode || narration,
        matched_students: matchedStudentNames,
        matched_parent: matchedParentName,
        gross_amount: transactionAmount,
        nomba_fee: feeBreakdown.nombaFee,
        app_fee: feeBreakdown.zidwellFee,
        total_fee: feeBreakdown.totalFee,
        net_amount: feeBreakdown.netAmount,
        fee_percentage: 3.4,
        deliveryHtml,
        delivery_fee: paymentResult.delivery_fee ?? 0,
      },
    ).catch((err) => console.error("Failed to send receipt:", err));

    await supabase
      .from("payment_page_payments")
      .update({ receipt_sent: true })
      .eq("id", paymentResult.id);
  }

  const { data: creator } = await supabase
    .from("users")
    .select("email")
    .eq("id", paymentPage.user_id)
    .single();

  if (creator?.email) {
    await sendPaymentPageNotificationEmail(
      creator.email,
      paymentPage.title,
      transactionAmount,
      senderName,
      customerEmail || "",
      webhookNarrationCode || narration,
      feeBreakdown.nombaFee,
      feeBreakdown.zidwellFee,
      mergedMetadata.customFields || null,
      matchedStudentNames.length > 0 ? matchedStudentNames : null,
      deliveryHtml,
    );
  }

  console.log("🎉 ========== PAYMENT PROCESSING COMPLETED ==========");
  console.log(`   Gross: ₦${transactionAmount.toLocaleString()}`);
  console.log(`   Net Credited: ₦${feeBreakdown.netAmount.toLocaleString()}`);
  console.log(`   Payment ID: ${paymentResult.id}`);

  return {
    success: true,
    message: "Virtual account payment processed",
    credited_amount: feeBreakdown.netAmount,
    new_balance: walletResult?.new_balance || null,
    payment_id: paymentResult.id,
  };
}