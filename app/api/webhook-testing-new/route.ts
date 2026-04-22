// // app/api/webhook/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { createHmac, timingSafeEqual } from "crypto";
// import { createClient } from "@supabase/supabase-js";
// import {
//   sendInvoiceCreatorNotification,
//   sendPaymentSuccessEmail,
// } from "@/lib/invoice-email-confirmation";
// import { transporter } from "@/lib/node-mailer";

// const supabase = createClient(
//   process.env.SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!,
// );

// const baseUrl =
//   process.env.NODE_ENV === "development"
//     ? process.env.NEXT_PUBLIC_DEV_URL
//     : process.env.NEXT_PUBLIC_BASE_URL;

// const NOMBA_SIGNATURE_KEY = process.env.NOMBA_SIGNATURE_KEY!;

// function safeNum(v: any) {
//   const n = Number(v);
//   return Number.isFinite(n) ? n : 0;
// }

// const headerImageUrl = `${baseUrl}/zidwell-header.png`;
// const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

// async function updateInvoiceTotals(invoice: any, paidAmountNaira: number) {
//   try {
//     const paidAmount = paidAmountNaira;
//     const targetQty = Number(invoice.target_quantity || 1);
//     const totalAmount = Number(invoice.total_amount || 0);
//     const currentPaidAmount = Number(invoice.paid_amount || 0);
//     const currentPaidQty = Number(invoice.paid_quantity || 0);

//     let newPaidAmount = currentPaidAmount + paidAmount;
//     let newPaidQuantity = currentPaidQty;
//     let newStatus = invoice.status;

//     if (invoice.allow_multiple_payments) {
//       const quantityPaidSoFar = Math.floor(newPaidAmount / totalAmount);
//       if (quantityPaidSoFar > currentPaidQty) {
//         newPaidQuantity = quantityPaidSoFar;
//       }
//       if (newPaidQuantity >= targetQty) {
//         newStatus = "paid";
//       } else if (newPaidQuantity > 0 || newPaidAmount > 0) {
//         newStatus = "partially_paid";
//       }
//     } else {
//       if (newPaidAmount >= totalAmount) {
//         newStatus = "paid";
//       } else if (newPaidAmount > 0) {
//         newStatus = "partially_paid";
//       }
//     }

//     const updateData: any = {
//       paid_amount: newPaidAmount,
//       paid_quantity: newPaidQuantity,
//       status: newStatus,
//       updated_at: new Date().toISOString(),
//     };

//     if (newStatus === "paid") {
//       updateData.paid_at = new Date().toISOString();
//     }

//     const { error: updateError } = await supabase
//       .from("invoices")
//       .update(updateData)
//       .eq("id", invoice.id);

//     if (updateError) {
//       console.error("Failed to update invoice:", updateError);
//       throw updateError;
//     }

//     return { newPaidAmount, newPaidQuantity, newStatus };
//   } catch (error) {
//     console.error("Error in updateInvoiceTotals:", error);
//     throw error;
//   }
// }

// async function sendVirtualAccountDepositEmail(
//   userId: string,
//   amount: number,
//   transactionId: string,
//   bankName: string,
//   accountNumber: string,
//   accountName: string,
//   senderName: string,
//   narration?: string,
//   nombaFee?: number,
// ) {
//   try {
//     const { data: user, error } = await supabase
//       .from("users")
//       .select("email, first_name")
//       .eq("id", userId)
//       .single();

//     if (error || !user) return;

//     const creditedAmount = amount - (nombaFee || 0);

//     await transporter.sendMail({
//       from: `Zidwell <${process.env.EMAIL_USER}>`,
//       to: user.email,
//       subject: `💰 Account Deposit Received - ₦${creditedAmount.toLocaleString()}`,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
//           <h3 style="color: #22c55e;">✅ Deposit Successful</h3>
//           <p>Hi ${user.first_name || "there"},</p>
//           <p>Your account has been credited with <strong>₦${creditedAmount.toLocaleString()}</strong>.</p>
//           <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
//             <p><strong>Amount Received:</strong> ₦${amount.toLocaleString()}</p>
//             <p><strong>Nomba Fee:</strong> ₦${(nombaFee || 0).toLocaleString()}</p>
//             <p><strong>Net Credit:</strong> ₦${creditedAmount.toLocaleString()}</p>
//             <p><strong>Bank:</strong> ${bankName}</p>
//             <p><strong>Account:</strong> ${accountNumber}</p>
//             <p><strong>Sender:</strong> ${senderName}</p>
//             <p><strong>Narration:</strong> ${narration || "N/A"}</p>
//           </div>
//           <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
//         </div>
//       `,
//     });
//   } catch (error) {
//     console.error("Failed to send deposit email:", error);
//   }
// }

// async function sendWithdrawalEmail(
//   userId: string,
//   status: "success" | "failed",
//   amount: number,
//   recipientName: string,
//   recipientAccount: string,
//   bankName: string,
//   transactionId?: string,
//   errorDetail?: string,
//   fee?: number,
// ) {
//   try {
//     const { data: user, error } = await supabase
//       .from("users")
//       .select("email, first_name")
//       .eq("id", userId)
//       .single();

//     if (error || !user) return;

//     await transporter.sendMail({
//       from: `Zidwell <${process.env.EMAIL_USER}>`,
//       to: user.email,
//       subject:
//         status === "success"
//           ? `✅ Transfer Successful - ₦${amount.toLocaleString()}`
//           : `❌ Transfer Failed - ₦${amount.toLocaleString()}`,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
//           <h3 style="color: ${status === "success" ? "#22c55e" : "#ef4444"};">
//             ${status === "success" ? "✅ Transfer Successful" : "❌ Transfer Failed"}
//           </h3>
//           <p>Hi ${user.first_name || "there"},</p>
//           <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
//             <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
//             ${fee ? `<p><strong>Fee:</strong> ₦${fee.toLocaleString()}</p>` : ""}
//             <p><strong>Recipient:</strong> ${recipientName}</p>
//             <p><strong>Account:</strong> ${recipientAccount}</p>
//             <p><strong>Bank:</strong> ${bankName}</p>
//             ${status === "failed" ? `<p><strong>Reason:</strong> ${errorDetail || "Transaction failed"}</p>` : ""}
//           </div>
//           ${status === "failed" ? '<p style="color: #22c55e;">✅ Your wallet has been refunded.</p>' : ""}
//           <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
//         </div>
//       `,
//     });
//   } catch (error) {
//     console.error("Failed to send withdrawal email:", error);
//   }
// }

// async function sendInvoiceCreatorNotificationEmail(
//   creatorEmail: string,
//   invoiceId: string,
//   amount: number,
//   customerName: string,
//   invoice: any,
//   nombaFee?: number,
// ) {
//   try {
//     await transporter.sendMail({
//       from: `Zidwell <${process.env.EMAIL_USER}>`,
//       to: creatorEmail,
//       subject: `💰 Payment Received - ₦${amount.toLocaleString()}`,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
//           <h3 style="color: #22c55e;">✅ Payment Received!</h3>
//           <p>You've received a payment for invoice <strong>${invoiceId}</strong>.</p>
//           <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
//             <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
//             ${nombaFee ? `<p><strong>Processing Fee:</strong> ₦${nombaFee.toLocaleString()}</p>` : ""}
//             <p><strong>Customer:</strong> ${customerName}</p>
//             <p><strong>Status:</strong> <span style="color: #22c55e;">Completed</span></p>
//           </div>
//           <p>Your wallet has been credited with the full amount.</p>
//           <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
//         </div>
//       `,
//     });
//   } catch (error) {
//     console.error("Failed to send invoice notification:", error);
//   }
// }

// async function sendPaymentPageNotificationEmail(
//   creatorEmail: string,
//   pageTitle: string,
//   amount: number,
//   customerName: string,
//   fee?: number,
//   metadata?: any,
// ) {
//   try {
//     let additionalInfo = "";
//     if (metadata?.pageType === "school") {
//       additionalInfo = `
//         <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
//           <p><strong>Student Information:</strong></p>
//           <p>Parent: ${metadata.parentName || "N/A"}</p>
//           <p>Student: ${metadata.childName || "N/A"}</p>
//           <p>Reg Number: ${metadata.regNumber || "N/A"}</p>
//         </div>
//       `;
//     } else if (metadata?.pageType === "physical") {
//       additionalInfo = `
//         <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
//           <p><strong>Shipping Information:</strong></p>
//           <p>Quantity: ${metadata.quantity || "1"}</p>
//           <p>Address: ${metadata.address || "N/A"}</p>
//         </div>
//       `;
//     } else if (metadata?.pageType === "services" && metadata.bookingDate) {
//       additionalInfo = `
//         <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
//           <p><strong>Booking Details:</strong></p>
//           <p>Date: ${metadata.bookingDate || "N/A"}</p>
//           <p>Time: ${metadata.bookingTime || "N/A"}</p>
//         </div>
//       `;
//     }

//     await transporter.sendMail({
//       from: `Zidwell <${process.env.EMAIL_USER}>`,
//       to: creatorEmail,
//       subject: `💰 Payment Received for "${pageTitle}" - ₦${amount.toLocaleString()}`,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
//           <h3 style="color: #22c55e;">✅ Payment Received!</h3>
//           <p>You've received a payment for your payment page <strong>${pageTitle}</strong>.</p>
//           <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
//             <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
//             ${fee ? `<p><strong>Processing Fee:</strong> ₦${fee.toLocaleString()}</p>` : ""}
//             <p><strong>Customer:</strong> ${customerName}</p>
//             <p><strong>Status:</strong> <span style="color: #22c55e;">Completed</span></p>
//           </div>
//           ${additionalInfo}
//           <p>The funds have been added to your payment page balance. You can withdraw them to your main wallet anytime.</p>
//           <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
//         </div>
//       `,
//     });
//   } catch (error) {
//     console.error("Failed to send payment page notification:", error);
//   }
// }

// async function sendPaymentPageReceiptEmail(
//   customerEmail: string,
//   pageTitle: string,
//   amount: number,
//   reference: string,
//   metadata?: any,
// ) {
//   try {
//     let additionalInfo = "";
//     if (metadata?.pageType === "school") {
//       additionalInfo = `
//         <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
//           <p><strong>Student Information:</strong></p>
//           <p>Student Name: ${metadata.childName || "N/A"}</p>
//           <p>Registration Number: ${metadata.regNumber || "N/A"}</p>
//         </div>
//       `;
//     } else if (metadata?.pageType === "digital" && metadata.downloadUrl) {
//       additionalInfo = `
//         <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
//           <p><strong>Download Link:</strong></p>
//           <p><a href="${metadata.downloadUrl}" style="color: #e1bf46;">Click here to download</a></p>
//         </div>
//       `;
//     }

//     await transporter.sendMail({
//       from: `Zidwell <${process.env.EMAIL_USER}>`,
//       to: customerEmail,
//       subject: `Payment Receipt - ${pageTitle}`,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <img src="${headerImageUrl}" style="width: 100%; margin-bottom: 20px;" />
//           <h3 style="color: #22c55e;">✅ Payment Successful!</h3>
//           <p>Thank you for your payment.</p>
//           <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
//             <p><strong>Page:</strong> ${pageTitle}</p>
//             <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
//             <p><strong>Reference:</strong> ${reference}</p>
//             <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
//           </div>
//           ${additionalInfo}
//           <img src="${footerImageUrl}" style="width: 100%; margin-top: 20px;" />
//         </div>
//       `,
//     });
//   } catch (error) {
//     console.error("Failed to send receipt email:", error);
//   }
// }

// export async function POST(req: NextRequest) {
//   try {
//     console.log("====== Nomba Webhook Received ======");

//     const rawBody = await req.text();

//     let payload;
//     try {
//       payload = JSON.parse(rawBody);
//       console.log("Event type:", payload.event_type || payload.eventType);
//     } catch (err) {
//       console.error("Failed to parse JSON");
//       return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
//     }

//     const timestamp = req.headers.get("nomba-timestamp");
//     const signature =
//       req.headers.get("nomba-sig-value") || req.headers.get("nomba-signature");

//     if (!timestamp || !signature) {
//       console.warn("Missing signature headers");
//       return NextResponse.json({ error: "Missing signature" }, { status: 401 });
//     }

//     const hashingPayload = `${payload.event_type}:${payload.requestId}:${
//       payload.data?.merchant?.userId || ""
//     }:${payload.data?.merchant?.walletId || ""}:${
//       payload.data?.transaction?.transactionId || ""
//     }:${payload.data?.transaction?.type || ""}:${
//       payload.data?.transaction?.time || ""
//     }:${payload.data?.transaction?.responseCode || ""}`;

//     const message = `${hashingPayload}:${timestamp}`;
//     const hmac = createHmac("sha256", NOMBA_SIGNATURE_KEY);
//     hmac.update(message);
//     const expectedSignature = hmac.digest("base64");

//     const receivedBuffer = Buffer.from(signature, "base64");
//     const expectedBuffer = Buffer.from(expectedSignature, "base64");

//     if (
//       receivedBuffer.length !== expectedBuffer.length ||
//       !timingSafeEqual(receivedBuffer, expectedBuffer)
//     ) {
//       console.error("Invalid signature");
//       return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
//     }

//     console.log("✅ Signature verified");

//     const eventType = payload.event_type || payload.eventType;
//     const tx = payload.data?.transaction || {};
//     const order = payload.data?.order || {};
//     const customer = payload.data?.customer || {};

//     const nombaTransactionId = tx.transactionId || tx.id || tx.reference;
//     const merchantTxRef = tx.merchantTxRef || tx.merchant_tx_ref;
//     const orderReference = order.orderReference;
//     const aliasAccountReference =
//       tx.aliasAccountReference || tx.alias_account_reference;
//     const transactionAmount = safeNum(
//       tx.transactionAmount ?? tx.amount ?? order.amount ?? 0,
//     );
//     const nombaFee = safeNum(tx.fee ?? payload.data?.transaction?.fee ?? 0);
//     const txStatus = (tx.status || payload.data?.status || "")
//       .toString()
//       .toLowerCase();
//     const transactionType = (tx.type || "").toLowerCase();

//     console.log("Processing:", {
//       eventType,
//       amount: transactionAmount,
//       nombaFee,
//       reference: nombaTransactionId,
//     });

//     const isSubscription =
//       orderReference?.startsWith("SUB_") ||
//       orderReference?.includes("SUB-") ||
//       payload.data?.order?.metadata?.type === "subscription" ||
//       payload.data?.order?.metadata?.isSubscription === true ||
//       payload.data?.metadata?.subscription === true ||
//       merchantTxRef?.includes("SUB-") ||
//       tx.narration?.includes("SUB-");

//     if (isSubscription) {
//       console.log(
//         "📱 Subscription payment detected - skipping (handled by callback)",
//       );
//       return NextResponse.json({
//         success: true,
//         message: "Subscription payment handled by callback",
//       });
//     }

//     const isInvoicePayment =
//       orderReference ||
//       payload.data?.order?.callbackUrl?.includes(
//         "/api/invoice-payment-callback",
//       ) ||
//       payload.data?.order?.metadata?.invoiceId;

//     if (
//       isInvoicePayment &&
//       (eventType === "payment_success" || txStatus === "success")
//     ) {
//       console.log("🧾 Processing invoice payment...");

//       let invoiceId =
//         payload.data?.order?.metadata?.invoiceId || orderReference;

//       if (!invoiceId) {
//         console.error("No invoice ID found");
//         return NextResponse.json({ error: "No invoice ID" }, { status: 400 });
//       }

//       const { data: invoice, error: invoiceError } = await supabase
//         .from("invoices")
//         .select("*")
//         .eq("invoice_id", invoiceId)
//         .single();

//       if (invoiceError || !invoice) {
//         console.error("Invoice not found:", invoiceId);
//         return NextResponse.json(
//           { error: "Invoice not found" },
//           { status: 404 },
//         );
//       }

//       console.log("✅ Found invoice:", invoice.invoice_id);

//       const { data: existingPayment } = await supabase
//         .from("invoice_payments")
//         .select("*")
//         .eq("nomba_transaction_id", nombaTransactionId)
//         .maybeSingle();

//       if (existingPayment) {
//         console.log("⚠️ Duplicate payment, updating totals only");
//         await updateInvoiceTotals(invoice, transactionAmount);
//         return NextResponse.json({ success: true });
//       }

//       const customerEmail = order.customerEmail || customer.email;
//       const customerName = order.customerName || customer.name || "Customer";
//       const netAmount = transactionAmount - nombaFee;

//       const { error: paymentError } = await supabase
//         .from("invoice_payments")
//         .insert({
//           invoice_id: invoice.id,
//           user_id: invoice.user_id,
//           order_reference: orderReference || nombaTransactionId,
//           payer_email: customerEmail || invoice.client_email,
//           payer_name: customerName || invoice.client_name,
//           amount: transactionAmount,
//           paid_amount: transactionAmount,
//           nomba_fee: nombaFee,
//           net_amount: netAmount,
//           status: "completed",
//           nomba_transaction_id: nombaTransactionId,
//           payment_method: "card_payment",
//           paid_at: new Date().toISOString(),
//         });

//       if (paymentError) {
//         console.error("Failed to create payment record:", paymentError);
//         return NextResponse.json(
//           { error: "Payment record failed" },
//           { status: 500 },
//         );
//       }

//       await supabase.from("transactions").insert({
//         user_id: invoice.user_id,
//         type: "credit",
//         amount: netAmount,
//         gross_amount: transactionAmount,
//         fee: nombaFee,
//         status: "success",
//         reference: `INV-${invoice.invoice_id}-${nombaTransactionId}`,
//         description: `Payment received for invoice ${invoice.invoice_id} from ${customerName}`,
//         channel: "invoice_payment",
//         sender: { name: customerName, email: customerEmail },
//         receiver: { name: invoice.from_name, email: invoice.from_email },
//         external_response: {
//           nomba_transaction_id: nombaTransactionId,
//           nomba_fee: nombaFee,
//         },
//       });

//       const { error: creditError } = await supabase.rpc(
//         "increment_wallet_balance",
//         {
//           user_id: invoice.user_id,
//           amt: netAmount,
//         },
//       );

//       if (creditError) {
//         console.error("Failed to credit wallet:", creditError);
//       } else {
//         console.log(
//           `✅ Credited ₦${netAmount} (after ₦${nombaFee} fee) to user ${invoice.user_id}`,
//         );
//       }

//       await updateInvoiceTotals(invoice, transactionAmount);

//       if (customerEmail) {
//         sendPaymentSuccessEmail(
//           customerEmail,
//           invoice.invoice_id,
//           transactionAmount,
//           customerName,
//           invoice,
//         ).catch(console.error);
//       }

//       const { data: creator } = await supabase
//         .from("users")
//         .select("email")
//         .eq("id", invoice.user_id)
//         .single();

//       if (creator?.email) {
//         sendInvoiceCreatorNotificationEmail(
//           creator.email,
//           invoice.invoice_id,
//           netAmount,
//           customerName,
//           invoice,
//           nombaFee,
//         ).catch(console.error);
//       }

//       return NextResponse.json({ success: true });
//     }

//     const isPaymentPagePayment =
//       payload.data?.order?.metadata?.type === "payment_page" ||
//       payload.data?.order?.metadata?.paymentPageId ||
//       orderReference?.startsWith("PP-");

//     if (
//       isPaymentPagePayment &&
//       (eventType === "payment_success" || txStatus === "success")
//     ) {
//       console.log("💰 Processing Payment Page payment...");

//       const metadata = payload.data?.order?.metadata || {};
//       const paymentPageId = metadata.paymentPageId;
//       const paymentId = metadata.paymentId;

//       if (!paymentPageId || !paymentId) {
//         console.error("Missing payment page ID or payment ID from metadata");
//         return NextResponse.json(
//           { error: "Missing payment page identifiers" },
//           { status: 400 },
//         );
//       }

//       const { data: existingPayment } = await supabase
//         .from("payment_page_payments")
//         .select("*")
//         .eq("nomba_transaction_id", nombaTransactionId)
//         .maybeSingle();

//       if (existingPayment) {
//         console.log("⚠️ Duplicate payment page payment detected, skipping");
//         return NextResponse.json({ success: true });
//       }

//       const { data: payment, error: paymentError } = await supabase
//         .from("payment_page_payments")
//         .select("*")
//         .eq("id", paymentId)
//         .single();

//       if (paymentError || !payment) {
//         console.error("Payment record not found:", paymentId);
//         return NextResponse.json(
//           { error: "Payment record not found" },
//           { status: 404 },
//         );
//       }

//       console.log("✅ Found payment record:", {
//         id: payment.id,
//         pageId: payment.payment_page_id,
//         amount: payment.amount,
//       });

//       const { error: updateError } = await supabase
//         .from("payment_page_payments")
//         .update({
//           status: "completed",
//           nomba_transaction_id: nombaTransactionId,
//           paid_at: new Date().toISOString(),
//         })
//         .eq("id", paymentId);

//       if (updateError) {
//         console.error("Failed to update payment record:", updateError);
//         return NextResponse.json(
//           { error: "Failed to update payment" },
//           { status: 500 },
//         );
//       }

//       let pageCreditAmount = payment.net_amount;

//       const { data: newBalance, error: balanceError } = await supabase.rpc(
//         "increment_page_balance",
//         {
//           p_page_id: paymentPageId,
//           p_amount: pageCreditAmount,
//         },
//       );

//       if (balanceError) {
//         console.error("Failed to increment page balance:", balanceError);
//       } else {
//         console.log(
//           `✅ Credited ₦${pageCreditAmount} to page ${paymentPageId}. New balance: ₦${newBalance}`,
//         );
//       }

//       const { data: paymentPage } = await supabase
//         .from("payment_pages")
//         .select("title, user_id, page_type, metadata")
//         .eq("id", paymentPageId)
//         .single();

//       await supabase.from("transactions").insert({
//         user_id: payment.user_id,
//         type: "credit",
//         amount: payment.amount,
//         fee: payment.fee,
//         net_amount: pageCreditAmount,
//         status: "success",
//         reference: `PP-${paymentPageId}-${nombaTransactionId}`,
//         description: `Payment received for page "${paymentPage?.title}" from ${payment.customer_name}`,
//         channel: "payment_page",
//         sender: {
//           name: payment.customer_name,
//           email: payment.customer_email,
//           phone: payment.customer_phone,
//         },
//         receiver: {
//           user_id: payment.user_id,
//           payment_page_id: paymentPageId,
//         },
//         external_response: {
//           nomba_transaction_id: nombaTransactionId,
//           nomba_fee: nombaFee,
//         },
//       });

//       if (payment.customer_email) {
//         sendPaymentPageReceiptEmail(
//           payment.customer_email,
//           paymentPage?.title || "Payment Page",
//           payment.amount,
//           nombaTransactionId,
//           payment.metadata,
//         ).catch(console.error);
//       }

//       const { data: creator } = await supabase
//         .from("users")
//         .select("email")
//         .eq("id", payment.user_id)
//         .single();

//       if (creator?.email) {
//         sendPaymentPageNotificationEmail(
//           creator.email,
//           paymentPage?.title || "Payment Page",
//           pageCreditAmount,
//           payment.customer_name,
//           payment.fee,
//           payment.metadata,
//         ).catch(console.error);
//       }

//       return NextResponse.json({
//         success: true,
//         message: "Payment page payment processed",
//         credited_amount: pageCreditAmount,
//         new_balance: newBalance,
//       });
//     }

//     if (
//       aliasAccountReference &&
//       (eventType === "payment_success" || txStatus === "success")
//     ) {
//       console.log("🏦 Processing virtual account deposit...");
//       console.log("🔍 Virtual Account Details:", {
//         userId: aliasAccountReference,
//         amount: transactionAmount,
//         nombaFee,
//         narration: tx.narration,
//       });

//       const userId = aliasAccountReference;
//       const narration = tx.narration || "";
//       const senderName =
//         customer.senderName || customer.name || "Bank Transfer";
//       const netAmount = transactionAmount - nombaFee;

//       const invoiceMatch = narration.match(/INV[-_][A-Z0-9]{4,}/i);

//       if (invoiceMatch) {
//         const invoiceRef = invoiceMatch[0].toUpperCase();
//         console.log("🧾 Found invoice reference in narration:", invoiceRef);

//         const { data: invoice } = await supabase
//           .from("invoices")
//           .select("*")
//           .eq("invoice_id", invoiceRef)
//           .single();

//         if (invoice) {
//           console.log("✅ Found invoice for VA payment:", {
//             invoice_id: invoice.invoice_id,
//             owner_id: invoice.user_id,
//             depositor_id: userId,
//           });

//           const { data: existingPayment } = await supabase
//             .from("invoice_payments")
//             .select("*")
//             .eq("nomba_transaction_id", nombaTransactionId)
//             .maybeSingle();

//           if (existingPayment) {
//             console.log("⚠️ Duplicate VA invoice payment, updating totals only");
//             await updateInvoiceTotals(invoice, transactionAmount);
//             return NextResponse.json({ success: true });
//           }

//           const { error: paymentError } = await supabase
//             .from("invoice_payments")
//             .insert({
//               invoice_id: invoice.id,
//               user_id: invoice.user_id,
//               order_reference: nombaTransactionId,
//               payer_name: senderName,
//               amount: transactionAmount,
//               paid_amount: transactionAmount,
//               fee: nombaFee,
//               net_amount: netAmount,
//               status: "completed",
//               nomba_transaction_id: nombaTransactionId,
//               payment_method: "virtual_account",
//               narration,
//               paid_at: new Date().toISOString(),
//             });

//           if (paymentError) {
//             console.error("❌ Failed to create VA invoice payment:", paymentError);
//             return NextResponse.json(
//               { error: "Payment record failed" },
//               { status: 500 },
//             );
//           }

//           const creditUserId = invoice.user_id;
//           const isCrossUser = invoice.user_id !== userId;

//           if (isCrossUser) {
//             console.log("💰 Cross-user invoice payment via VA");
//           }

//           await supabase.from("transactions").insert({
//             user_id: creditUserId,
//             type: "credit",
//             amount: transactionAmount,
//             fee: nombaFee,
//             net_amount: netAmount,
//             status: "success",
//             reference: `VA-INV-${invoice.invoice_id}-${nombaTransactionId}`,
//             description: `Payment received for invoice ${invoice.invoice_id} via virtual account from ${senderName}`,
//             channel: "virtual_account",
//             sender: {
//               name: senderName,
//               bank: customer.bankName,
//               user_id: isCrossUser ? userId : null,
//             },
//             receiver: {
//               name: invoice.from_name,
//               email: invoice.from_email,
//             },
//             external_response: {
//               nomba_transaction_id: nombaTransactionId,
//               nomba_fee: nombaFee,
//               gross_amount: transactionAmount,
//               net_amount: netAmount,
//               is_cross_user: isCrossUser,
//             },
//           });

//           const { error: creditError } = await supabase.rpc(
//             "increment_wallet_balance",
//             {
//               user_id: creditUserId,
//               amt: netAmount,
//             },
//           );

//           if (creditError) {
//             console.error("❌ Failed to credit invoice owner:", creditError);
//           } else {
//             console.log(
//               `✅ Credited ₦${netAmount} (after ₦${nombaFee} fee) to invoice owner ${creditUserId}`,
//             );
//           }

//           await updateInvoiceTotals(invoice, transactionAmount);

//           const { data: creator } = await supabase
//             .from("users")
//             .select("email")
//             .eq("id", invoice.user_id)
//             .single();

//           if (creator?.email) {
//             sendInvoiceCreatorNotificationEmail(
//               creator.email,
//               invoice.invoice_id,
//               netAmount,
//               senderName,
//               invoice,
//               nombaFee,
//             ).catch(console.error);
//           }

//           if (isCrossUser) {
//             sendVirtualAccountDepositEmail(
//               userId,
//               transactionAmount,
//               nombaTransactionId,
//               customer.bankName || "N/A",
//               tx.aliasAccountNumber || "N/A",
//               tx.aliasAccountName || "N/A",
//               senderName,
//               narration,
//               nombaFee,
//             ).catch(console.error);
//           }

//           return NextResponse.json({
//             success: true,
//             message: "Invoice payment via virtual account processed",
//             gross_amount: transactionAmount,
//             fee_deducted: nombaFee,
//             net_credit: netAmount,
//           });
//         }
//       }

//       console.log("💰 Regular wallet deposit via virtual account");

//       const { data: existingTx } = await supabase
//         .from("transactions")
//         .select("*")
//         .eq("merchant_tx_ref", nombaTransactionId)
//         .maybeSingle();

//       if (!existingTx) {
//         const { error: txError } = await supabase
//           .from("transactions")
//           .insert({
//             user_id: userId,
//             type: "virtual_account_deposit",
//             amount: transactionAmount,
//             fee: nombaFee,
//             net_amount: netAmount,
//             status: "success",
//             reference: nombaTransactionId,
//             merchant_tx_ref: nombaTransactionId,
//             description: "Virtual account deposit",
//             narration: narration,
//             channel: "virtual_account",
//             sender: {
//               name: senderName,
//               bank: customer.bankName,
//               account_number: customer.accountNumber,
//             },
//             external_response: {
//               nomba_transaction_id: nombaTransactionId,
//               nomba_fee: nombaFee,
//               gross_amount: transactionAmount,
//               net_amount: netAmount,
//             },
//           });

//         if (txError) {
//           console.error("❌ Failed to create VA transaction:", txError);
//           return NextResponse.json(
//             { error: "Failed to create transaction" },
//             { status: 500 },
//           );
//         }

//         const { error: creditError } = await supabase.rpc(
//           "increment_wallet_balance",
//           {
//             user_id: userId,
//             amt: netAmount,
//           },
//         );

//         if (creditError) {
//           console.error("❌ Failed to credit wallet:", creditError);

//           const { data: user } = await supabase
//             .from("users")
//             .select("wallet_balance")
//             .eq("id", userId)
//             .single();

//           if (user) {
//             const newBalance = Number(user.wallet_balance) + netAmount;
//             await supabase
//               .from("users")
//               .update({ wallet_balance: newBalance })
//               .eq("id", userId);
//           }
//         } else {
//           console.log(
//             `✅ Credited ₦${netAmount} (after ₦${nombaFee} fee) to wallet ${userId}`,
//           );
//         }

//         sendVirtualAccountDepositEmail(
//           userId,
//           transactionAmount,
//           nombaTransactionId,
//           customer.bankName || "N/A",
//           tx.aliasAccountNumber || "N/A",
//           tx.aliasAccountName || "N/A",
//           senderName,
//           narration,
//           nombaFee,
//         ).catch(console.error);
//       } else {
//         console.log("⚠️ Duplicate VA deposit detected, skipping");
//       }

//       return NextResponse.json({
//         success: true,
//         message: "Virtual account deposit processed",
//         gross_amount: transactionAmount,
//         fee_deducted: nombaFee,
//         net_credit: netAmount,
//       });
//     }

//     const isPayout =
//       eventType?.toLowerCase().includes("payout") ||
//       transactionType.includes("transfer") ||
//       transactionType.includes("payout");

//     if (isPayout) {
//       console.log("💸 Processing payout...");

//       const searchRefs = [nombaTransactionId, merchantTxRef].filter(Boolean);

//       let pendingTx = null;

//       for (const ref of searchRefs) {
//         const { data } = await supabase
//           .from("transactions")
//           .select("*")
//           .or(`merchant_tx_ref.eq.${ref},reference.eq.${ref}`)
//           .in("status", ["pending", "processing"])
//           .maybeSingle();

//         if (data) {
//           pendingTx = data;
//           break;
//         }
//       }

//       if (!pendingTx) {
//         console.log("No matching pending transaction found");
//         return NextResponse.json(
//           { message: "No matching transaction" },
//           { status: 200 },
//         );
//       }

//       if (eventType === "payout_success" || txStatus === "success") {
//         console.log("✅ Payout successful");

//         await supabase
//           .from("transactions")
//           .update({
//             status: "success",
//             external_response: {
//               ...pendingTx.external_response,
//               nomba_data: payload,
//               completed_at: new Date().toISOString(),
//             },
//           })
//           .eq("id", pendingTx.id);

//         const receiver = pendingTx.receiver || {};
//         sendWithdrawalEmail(
//           pendingTx.user_id,
//           "success",
//           pendingTx.amount,
//           receiver.name || "N/A",
//           receiver.accountNumber || "N/A",
//           receiver.bankName || "N/A",
//           pendingTx.id,
//           undefined,
//           pendingTx.fee,
//         ).catch(console.error);
//       } else if (eventType === "payout_failed" || txStatus === "failed") {
//         console.log("❌ Payout failed - refunding user");

//         const errorDetail =
//           tx.responseMessage ||
//           payload.data?.transaction?.responseMessage ||
//           "Transaction failed";

//         await supabase
//           .from("transactions")
//           .update({
//             status: "failed",
//             external_response: {
//               ...pendingTx.external_response,
//               nomba_data: payload,
//               failed_at: new Date().toISOString(),
//               error: errorDetail,
//             },
//           })
//           .eq("id", pendingTx.id);

//         const refundAmount = pendingTx.total_deduction || pendingTx.amount;
//         await supabase.rpc("increment_wallet_balance", {
//           user_id: pendingTx.user_id,
//           amt: refundAmount,
//         });

//         console.log(
//           `✅ Refunded ₦${refundAmount} to user ${pendingTx.user_id}`,
//         );

//         const receiver = pendingTx.receiver || {};
//         sendWithdrawalEmail(
//           pendingTx.user_id,
//           "failed",
//           pendingTx.amount,
//           receiver.name || "N/A",
//           receiver.accountNumber || "N/A",
//           receiver.bankName || "N/A",
//           pendingTx.id,
//           `${errorDetail} - Refunded`,
//           pendingTx.fee,
//         ).catch(console.error);
//       }

//       return NextResponse.json({ success: true });
//     }

//     console.log("ℹ️ Unhandled event type:", eventType);
//     return NextResponse.json({ message: "Event ignored" }, { status: 200 });
//   } catch (error: any) {
//     console.error("🔥 Webhook error:", error);
//     return NextResponse.json(
//       { error: error.message || "Internal server error" },
//       { status: 500 },
//     );
//   }
// }

// app/api/webhook-testing-new/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Nomba Webhook Triggered", body);
    
    // Always return a proper response
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// Optional: Handle other HTTP methods
export async function GET(req: Request) {
  return NextResponse.json({ message: "Webhook endpoint is active" }, { status: 200 });
}
