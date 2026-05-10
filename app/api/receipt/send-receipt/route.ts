import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import { transporter } from "@/lib/node-mailer";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Helper function to send receipt email
async function sendReceiptEmail({
  to,
  clientName,
  businessName,
  receiptId,
  total,
  issueDate,
  receiptItems,
  signingLink,
  baseUrl,
}: any) {
  const headerImageUrl = `${baseUrl}/zidwell-header.png`;
  const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: to,
    subject: `Receipt for Signature: ${receiptId}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt for Signature - Zidwell Finance</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', Arial, Helvetica, sans-serif;
            background-color: #f9fafb;
            color: #374151;
            line-height: 1.6;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            overflow: hidden;
        }
        .content-section {
            padding: 40px 30px;
        }
        .info-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .action-button {
            display: inline-block;
            background-color: var(--color-accent-yellow);
            color: #191919;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
        }
        .receipt-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .receipt-total {
            display: flex;
            justify-content: space-between;
            padding: 15px 0;
            font-weight: bold;
            font-size: 18px;
            color: var(--color-accent-yellow);
        }
        @media screen and (max-width: 600px) {
            .content-section {
                padding: 30px 20px !important;
            }
            .action-button {
                padding: 12px 24px !important;
                font-size: 14px !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <img src="${headerImageUrl}" alt="Zidwell Header" style="width: 100%; max-width: 600px; display: block;">
        <div class="content-section">
            <h1 style="margin: 0 0 20px 0; font-size: 28px; font-weight: 600; color: #111827; text-align: center;">Receipt for Your Signature</h1>
            
            <div class="info-card">
                <h2 style="margin: 0 0 10px 0; font-size: 20px;">📄 Receipt ${receiptId}</h2>
                <p>Hello <strong>${clientName}</strong>,</p>
                <p>You have received a receipt for your review and signature from <strong>${businessName}</strong>.</p>
            </div>
            
            <div class="info-card">
                <h3 style="margin: 0 0 15px 0;">Receipt Details</h3>
                <p><strong>Date:</strong> ${new Date(issueDate).toLocaleDateString()}</p>
                <p><strong>Total Amount:</strong> ₦${total.toLocaleString()}</p>
            </div>
            
            <div class="info-card">
                <h3 style="margin: 0 0 15px 0;">Items Summary</h3>
                ${receiptItems.map((item: any) => `
                    <div class="receipt-item">
                        <div>${item.description} (${item.quantity} × ₦${item.unit_price.toLocaleString()})</div>
                        <div>₦${item.total.toLocaleString()}</div>
                    </div>
                `).join("")}
                <div class="receipt-total">
                    <div>TOTAL AMOUNT</div>
                    <div>₦${total.toLocaleString()}</div>
                </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${signingLink}" class="action-button" style="background-color: #FDC020; color: #191919;">Review & Sign Receipt</a>
            </div>
        </div>
        <img src="${footerImageUrl}" alt="Zidwell Footer" style="width: 100%; max-width: 600px; display: block;">
    </div>
</body>
</html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function POST(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    const response = NextResponse.json(
      { error: "Please login to access this resource", logout: true },
      { status: 401 }
    );
    
    if (newTokens) {
      return createAuthResponse(await response.json(), newTokens);
    }
    return response;
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let body: any = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      body = await req.json();
    }

    const userId = body.userId || body.user_id;
    const isDraft = body.is_draft || body.isDraft || false;
    const sendEmailAutomatically = body.send_email_automatically !== undefined 
      ? body.send_email_automatically 
      : true;

    if (userId && userId !== user.id) {
      const response = NextResponse.json(
        { success: false, error: "Unauthorized: User ID mismatch" },
        { status: 403 }
      );
      
      if (newTokens) {
        return createAuthResponse(await response.json(), newTokens);
      }
      return response;
    }

    let receiptData = body.data || body;
    if (body.data) {
      receiptData = body.data;
    }

    const receiptId = receiptData.receipt_id || `REC-${Date.now().toString().slice(-6)}`;
    const businessName = receiptData.business_name || receiptData.initiator_name || "";
    const initiatorEmail = receiptData.initiator_email || "";
    const initiatorName = receiptData.initiator_name || "";
    const initiatorPhone = receiptData.initiator_phone || "";
    const clientName = receiptData.client_name || receiptData.bill_to || "";
    const clientEmail = receiptData.client_email || "";
    const clientPhone = receiptData.client_phone || "";
    const paymentMethod = receiptData.payment_method || "transfer";
    const paymentFor = receiptData.payment_for || "general";
    const issueDate = receiptData.issue_date || new Date().toISOString().split("T")[0];
    const customerNote = receiptData.customer_note || "";
    const sellerSignature = receiptData.seller_signature || body.seller_signature || "";
    const fromName = receiptData.from_name || businessName;

    let receiptItems = [];
    let subtotal = 0;
    
    if (receiptData.receipt_items && Array.isArray(receiptData.receipt_items)) {
      receiptItems = receiptData.receipt_items.map((item: any) => {
        const quantity = Number(item.quantity || item.quantity || 1);
        const unitPrice = Number(item.unit_price || item.unitPrice || item.price || 0);
        const amount = Number(item.total || item.amount || quantity * unitPrice);
        subtotal += amount;

        return {
          id: item.id || uuidv4(),
          description: item.description || item.item || "",
          quantity: quantity,
          unit_price: unitPrice,
          total: amount,
        };
      });
    }

    const total = receiptData.total || subtotal;

    if (!userId) {
      const response = NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 },
      );
      
      if (newTokens) {
        return createAuthResponse(await response.json(), newTokens);
      }
      return response;
    }

    const baseUrl = process.env.NODE_ENV === "development"
      ? process.env.NEXT_PUBLIC_DEV_URL || "http://localhost:3000"
      : process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com";

    let existingDraft = null;
    let result: any;

    // CHECK IF THIS IS CONVERTING A DRAFT TO A RECEIPT
    if (!isDraft && receiptId) {
      console.log("🔍 Looking for draft to convert with receipt_id:", receiptId);

      const { data: draftByReceiptId } = await supabase
        .from("receipts")
        .select("*")
        .eq("receipt_id", receiptId)
        .eq("user_id", user.id)
        .eq("status", "draft")
        .single();

      if (draftByReceiptId) {
        existingDraft = draftByReceiptId;
        console.log("✅ Found draft to convert by receipt_id:", existingDraft.id, "old token:", existingDraft.token);
      }

      if (!existingDraft) {
        const { data: draftsWithReceiptId } = await supabase
          .from("receipts")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "draft")
          .contains("metadata", { receipt_id: receiptId })
          .single();

        if (draftsWithReceiptId) {
          existingDraft = draftsWithReceiptId;
          console.log("✅ Found draft to convert by metadata:", existingDraft.id, "old token:", existingDraft.token);
        }
      }

      if (!existingDraft && clientEmail && businessName) {
        const { data: draftData } = await supabase
          .from("receipts")
          .select("*")
          .eq("user_id", user.id)
          .eq("client_email", clientEmail)
          .eq("business_name", businessName)
          .eq("status", "draft")
          .order("created_at", { ascending: false })
          .limit(1);

        if (draftData && draftData.length > 0) {
          existingDraft = draftData[0];
          console.log("✅ Found draft to convert by business/email:", existingDraft.id, "old token:", existingDraft.token);
        }
      }
    }

    const now = new Date().toISOString();

    if (existingDraft && !isDraft) {
      const newReceiptToken = uuidv4();
      console.log("🔄 Converting draft to receipt - REPLACING token:");
      console.log("   Old draft token:", existingDraft.token);
      console.log("   New receipt token:", newReceiptToken);
      
      const signingLink = `${baseUrl}/sign-receipt/${newReceiptToken}`;
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      const updateData: any = {
        business_name: businessName,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        initiator_email: initiatorEmail,
        initiator_name: initiatorName,
        bill_to: clientName,
        from_name: fromName,
        issue_date: issueDate,
        customer_note: customerNote,
        payment_for: paymentFor,
        payment_method: paymentMethod,
        subtotal: total,
        total: total,
        status: "pending",
        signing_link: signingLink,
        verification_code: verificationCode,
        seller_signature: sellerSignature,
        receipt_items: receiptItems,
        metadata: {
          ...(existingDraft.metadata || {}),
          base_fee: 100,
          total_fee: 100,
          initiator_name: initiatorName,
          initiator_email: initiatorEmail,
          initiator_phone: initiatorPhone,
          seller_signature: sellerSignature ? true : false,
          receipt_id: receiptId,
          issue_date: issueDate,
          payment_for: paymentFor,
          payment_method: paymentMethod,
          customer_note: customerNote,
          send_email_automatically: sendEmailAutomatically,
          converted_from_draft: true,
          old_draft_token: existingDraft.token,
        },
        updated_at: now,
        sent_at: now,
        token: newReceiptToken,
      };

      const { data: updatedReceipt, error: updateError } = await supabase
        .from("receipts")
        .update(updateData)
        .eq("id", existingDraft.id)
        .select()
        .single();

      if (updateError) {
        console.error("❌ Update draft error:", updateError);
        throw updateError;
      }

      result = updatedReceipt;
      console.log("✅ Draft successfully converted to receipt with NEW token:", newReceiptToken);
      console.log("   Signing link:", signingLink);
      
      if (clientEmail && sendEmailAutomatically && !isDraft) {
        try {
          await sendReceiptEmail({
            to: clientEmail,
            clientName,
            businessName,
            receiptId,
            total,
            issueDate,
            receiptItems,
            signingLink,
            baseUrl,
          });
          console.log("📧 Receipt email sent to:", clientEmail);
        } catch (emailError) {
          console.error("❌ Failed to send email:", emailError);
        }
      }
      
      const responseData = {
        success: true,
        message: "Receipt sent successfully",
        receiptId: result.receipt_id,
        token: result.token,
        signingLink: result.signing_link,
        verificationCode: result.verification_code,
        isDraft: false,
        isUpdate: true,
        emailSent: clientEmail && sendEmailAutomatically,
      };

      if (newTokens) {
        return createAuthResponse(responseData, newTokens);
      }
      return NextResponse.json(responseData);
    }

    console.log("📝 Creating new receipt (isDraft:", isDraft, ")");
    
    const newToken = !isDraft ? uuidv4() : `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const signingLink = !isDraft ? `${baseUrl}/sign-receipt/${newToken}` : null;
    const verificationCode = !isDraft ? Math.floor(100000 + Math.random() * 900000).toString() : "";

    console.log("   Generated token:", newToken);
    console.log("   Signing link:", signingLink);

    const metadata: any = {
      base_fee: 100,
      total_fee: 100,
      initiator_name: initiatorName,
      initiator_email: initiatorEmail,
      initiator_phone: initiatorPhone,
      seller_signature: sellerSignature ? true : false,
      receipt_id: receiptId,
      issue_date: issueDate,
      payment_for: paymentFor,
      payment_method: paymentMethod,
      customer_note: customerNote,
      send_email_automatically: sendEmailAutomatically,
    };

    if (body.metadata?.attachments) {
      metadata.attachments = body.metadata.attachments;
      metadata.attachment_count = body.metadata.attachment_count || 0;
    }

    if (body.metadata?.base_fee) {
      metadata.base_fee = body.metadata.base_fee;
    }
    if (body.metadata?.total_fee) {
      metadata.total_fee = body.metadata.total_fee;
    }

    const receiptDataToInsert: any = {
      token: newToken,
      receipt_id: receiptId,
      user_id: user.id,
      business_name: businessName,
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      initiator_email: initiatorEmail,
      initiator_name: initiatorName,
      bill_to: clientName,
      from_name: fromName,
      issue_date: issueDate,
      customer_note: customerNote,
      payment_for: paymentFor,
      payment_method: paymentMethod,
      subtotal: total,
      total: total,
      status: isDraft ? "draft" : "pending",
      signing_link: signingLink,
      verification_code: verificationCode,
      seller_signature: sellerSignature,
      receipt_items: receiptItems,
      metadata: metadata,
      created_at: now,
      updated_at: now,
    };

    if (!isDraft) {
      receiptDataToInsert.sent_at = now;
    }

    const { data: newReceipt, error: insertError } = await supabase
      .from("receipts")
      .insert([receiptDataToInsert])
      .select()
      .single();

    if (insertError) {
      console.error("❌ Supabase insert error:", insertError);
      throw insertError;
    }

    result = newReceipt;
    console.log("✅ New receipt created. ID:", result.id, "is_draft:", isDraft, "token:", newToken);

    if (!isDraft && clientEmail && sendEmailAutomatically) {
      try {
        await sendReceiptEmail({
          to: clientEmail,
          clientName,
          businessName,
          receiptId,
          total,
          issueDate,
          receiptItems,
          signingLink,
          baseUrl,
        });
        console.log("📧 Receipt email sent to:", clientEmail);
      } catch (emailError) {
        console.error("❌ Failed to send email:", emailError);
      }
    } else if (!isDraft && !sendEmailAutomatically) {
      console.log("Email sending disabled by user preference for receipt:", receiptId);
    } else if (!isDraft && !clientEmail) {
      console.log("No client email provided, skipping email send for receipt:", receiptId);
    }

    const responseData = {
      success: true,
      message: isDraft ? "Draft saved successfully" : "Receipt sent successfully",
      receiptId: result.receipt_id,
      token: result.token,
      signingLink: result.signing_link,
      verificationCode: result.verification_code,
      isDraft: isDraft,
      isUpdate: false,
      emailSent: !isDraft && clientEmail && sendEmailAutomatically,
    };

    if (newTokens) {
      return createAuthResponse(responseData, newTokens);
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("❌ Error processing receipt:", error);
    
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 },
    );
    
    if (newTokens) {
      return createAuthResponse(await errorResponse.json(), newTokens);
    }
    
    return errorResponse;
  }
}

export async function DELETE(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    const response = NextResponse.json(
      { error: "Please login to access this resource", logout: true },
      { status: 401 }
    );
    
    if (newTokens) {
      return createAuthResponse(await response.json(), newTokens);
    }
    return response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const receiptId = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!receiptId || !userId) {
      const response = NextResponse.json(
        { success: false, error: "Receipt ID and User ID are required" },
        { status: 400 },
      );
      
      if (newTokens) {
        return createAuthResponse(await response.json(), newTokens);
      }
      return response;
    }

    if (userId !== user.id) {
      const response = NextResponse.json(
        { success: false, error: "Unauthorized: User ID mismatch" },
        { status: 403 },
      );
      
      if (newTokens) {
        return createAuthResponse(await response.json(), newTokens);
      }
      return response;
    }

    const { error } = await supabase
      .from("receipts")
      .delete()
      .eq("id", receiptId)
      .eq("user_id", user.id);

    if (error) throw error;

    const responseData = {
      success: true,
      message: "Receipt deleted successfully",
    };

    if (newTokens) {
      return createAuthResponse(responseData, newTokens);
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error deleting receipt:", error);
    
    const errorResponse = NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
    
    if (newTokens) {
      return createAuthResponse(await errorResponse.json(), newTokens);
    }
    
    return errorResponse;
  }
}

export async function GET(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    const response = NextResponse.json(
      { error: "Please login to access this resource", logout: true },
      { status: 401 }
    );
    
    if (newTokens) {
      return createAuthResponse(await response.json(), newTokens);
    }
    return response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const draftOnly = searchParams.get("draftOnly") === "true";
    const token = searchParams.get("token");
    const receiptId = searchParams.get("receiptId");

    if (!token && !receiptId && !userId) {
      const response = NextResponse.json(
        { success: false, error: "User ID, Token, or Receipt ID is required" },
        { status: 400 },
      );
      
      if (newTokens) {
        return createAuthResponse(await response.json(), newTokens);
      }
      return response;
    }

    if (userId && userId !== user.id) {
      const response = NextResponse.json(
        { success: false, error: "Unauthorized: User ID mismatch" },
        { status: 403 },
      );
      
      if (newTokens) {
        return createAuthResponse(await response.json(), newTokens);
      }
      return response;
    }

    let query = supabase.from("receipts").select("*");

    if (token) {
      query = query.eq("token", token);
    } else if (receiptId) {
      query = query.eq("receipt_id", receiptId);
    } else if (userId) {
      query = query.eq("user_id", user.id);
      if (draftOnly) {
        query = query.eq("status", "draft");
      }
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;

    const receipts = data?.map((receipt) => ({
      id: receipt.id,
      token: receipt.token,
      receipt_id: receipt.receipt_id,
      user_id: receipt.user_id,
      business_name: receipt.business_name,
      client_name: receipt.client_name,
      client_email: receipt.client_email,
      client_phone: receipt.client_phone,
      initiator_email: receipt.initiator_email,
      initiator_name: receipt.initiator_name,
      bill_to: receipt.bill_to,
      from_name: receipt.from_name,
      issue_date: receipt.issue_date,
      customer_note: receipt.customer_note,
      payment_for: receipt.payment_for,
      payment_method: receipt.payment_method,
      subtotal: receipt.subtotal,
      total: receipt.total,
      status: receipt.status || "draft",
      signing_link: receipt.signing_link,
      verification_code: receipt.verification_code,
      seller_signature: receipt.seller_signature,
      client_signature: receipt.client_signature,
      signed_at: receipt.signed_at,
      receipt_items: receipt.receipt_items || [],
      metadata: receipt.metadata || {},
      created_at: receipt.created_at,
      updated_at: receipt.updated_at,
      sent_at: receipt.sent_at,
      is_draft: receipt.status === "draft",
      is_signed: receipt.status === "signed",
    })) || [];

    let responseData;

    if (token || receiptId) {
      responseData = {
        success: true,
        receipt: receipts[0] || null,
      };
    } else {
      responseData = {
        success: true,
        receipts: receipts,
        drafts: draftOnly ? receipts : receipts.filter((r) => r.status === "draft"),
        signed: receipts.filter((r) => r.status === "signed"),
        pending: receipts.filter((r) => r.status === "pending"),
        count: receipts.length,
      };
    }

    if (newTokens) {
      return createAuthResponse(responseData, newTokens);
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error fetching receipts:", error);
    
    const errorResponse = NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
    
    if (newTokens) {
      return createAuthResponse(await errorResponse.json(), newTokens);
    }
    
    return errorResponse;
  }  
}