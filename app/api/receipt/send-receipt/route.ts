import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import { transporter } from "@/lib/node-mailer";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticated } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
     const user = await isAuthenticated(req);
        
        if (!user) {
          return NextResponse.json(
            { error: "Please login to access transactions" },
            { status: 401 }
          );
        }
    
  try {
    const contentType = req.headers.get("content-type") || "";
    let body: any = {};

    // Handle JSON or FormData
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      body = await req.json();
    }

    console.log("Received body from frontend:", JSON.stringify(body, null, 2));

    // Extract data from frontend format
    const userId = body.userId || body.user_id;
    const isDraft = body.is_draft || body.isDraft || false;
    const pin = body.pin;
    
    // Get receipt data - handle both formats
    let receiptData = body.data || body;
    
    // If data is nested under 'data', use that, otherwise use the whole body
    if (body.data) {
      receiptData = body.data;
    }

    // Extract receipt information from frontend structure
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
    const issueDate = receiptData.issue_date || new Date().toISOString().split('T')[0];
    const customerNote = receiptData.customer_note || "";
    const sellerSignature = receiptData.seller_signature || body.seller_signature || "";
    const fromName = receiptData.from_name || businessName;
    
    // Get receipt items from frontend format
    let receiptItems = [];
    if (receiptData.receipt_items && Array.isArray(receiptData.receipt_items)) {
      // Transform frontend items to API format
      let subtotal = 0;
      receiptItems = receiptData.receipt_items.map((item: any) => {
        const quantity = Number(item.quantity || item.quantity || 1);
        const unitPrice = Number(item.unit_price || item.unitPrice || item.price || 0);
        const amount = Number(item.total || item.amount || (quantity * unitPrice));
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

    const total = receiptData.total || 0;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required",
        },
        { status: 400 }
      );
    }

    const token = uuidv4();
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_DEV_URL
        : process.env.NEXT_PUBLIC_BASE_URL;

    const signingLink = !isDraft ? `${baseUrl}/sign-receipt/${token}` : null;
    const verificationCode = !isDraft ? Math.floor(100000 + Math.random() * 900000).toString() : "";

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
    };

 
    if (body.metadata?.attachments) {
      metadata.attachments = body.metadata.attachments;
      metadata.attachment_count = body.metadata.attachment_count || 0;
    }

    // Also add base fee and lawyer fee from metadata if provided
    if (body.metadata?.base_fee) {
      metadata.base_fee = body.metadata.base_fee;
    }
    if (body.metadata?.total_fee) {
      metadata.total_fee = body.metadata.total_fee;
    }

    let existingDraft = null;
    let result: any;

    if (!isDraft && receiptId) {
      console.log("Looking for draft with receipt_id:", receiptId);

      // First, try to find draft by receipt_id directly
      const { data: draftByReceiptId } = await supabase
        .from("receipts")
        .select("*")
        .eq("receipt_id", receiptId)
        .eq("user_id", userId)
        .eq("status", "draft")
        .single();

      if (draftByReceiptId) {
        existingDraft = draftByReceiptId;
      
      }


      if (!existingDraft) {
        const { data: draftsWithReceiptId } = await supabase
          .from("receipts")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "draft")
          .contains("metadata", { receipt_id: receiptId })
          .single();

        if (draftsWithReceiptId) {
          existingDraft = draftsWithReceiptId;
         
        }
      }
    }

  
    if (!existingDraft && !isDraft && clientEmail && businessName) {
      console.log("Looking for draft by business name and email...");
      const { data: draftData } = await supabase
        .from("receipts")
        .select("*")
        .eq("user_id", userId)
        .eq("client_email", clientEmail)
        .eq("business_name", businessName)
        .eq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(1);

      if (draftData && draftData.length > 0) {
        existingDraft = draftData[0];
      
      }
    }

    const now = new Date().toISOString();


    if (existingDraft && !isDraft) {
    

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
        metadata: metadata,
        updated_at: now,
        sent_at: now,
      };

      // Update token if needed
      if (!existingDraft.token) {
        updateData.token = token;
      }

      // Update the existing draft
      const { data: updatedReceipt, error: updateError } = await supabase
        .from("receipts")
        .update(updateData)
        .eq("id", existingDraft.id)
        .select()
        .single();

      if (updateError) {
        console.error("Update draft error:", updateError);
        throw updateError;
      }

      result = updatedReceipt;
    } else {
      // CREATE NEW RECEIPT (either new receipt or new draft)
      console.log("Creating new receipt (isDraft:", isDraft, ")");

      const receiptDataToInsert: any = {
        token: token,
        receipt_id: receiptId,
        user_id: userId,
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

      // Only add sent_at for non-drafts
      if (!isDraft) {
        receiptDataToInsert.sent_at = now;
      }

      // Insert receipt
      const { data: newReceipt, error: insertError } = await supabase
        .from("receipts")
        .insert([receiptDataToInsert])
        .select()
        .single();

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw insertError;
      }

      result = newReceipt;
      console.log("New receipt created. ID:", result.id, "is_draft:", isDraft);
    }

    const headerImageUrl = `${baseUrl}/zidwell-header.png`;
    const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

    // Send email notification for non-drafts
    if (!isDraft && clientEmail) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_FROM,
          to: clientEmail,
          subject: `Receipt for Signature: ${receiptId}`,
          html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt for Signature - Zidwell Finance</title>
    
    <style>
        /* Base Styles */
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, Helvetica, sans-serif;
            background-color: #f9fafb;
            color: #374151;
            line-height: 1.6;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
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
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .action-button {
            display: inline-block;
            background-color: #C29307;
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
            border: none;
            cursor: pointer;
        }
        
        /* Typography */
        .text-primary { color: #111827 !important; }
        .text-secondary { color: #6b7280 !important; }
        .text-accent { color: #C29307 !important; }
        
        .text-sm { font-size: 14px !important; }
        .text-base { font-size: 16px !important; }
        .text-lg { font-size: 20px !important; }
        .text-xl { font-size: 24px !important; }
        
        .font-semibold { font-weight: 600 !important; }
        .font-bold { font-weight: 700 !important; }
        
        /* Receipt Items */
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
            color: #C29307;
        }
        
        /* Mobile Responsive */
        @media screen and (max-width: 600px) {
            .content-section {
                padding: 30px 20px !important;
            }
            
            .action-button {
                padding: 12px 24px !important;
                font-size: 14px !important;
            }
            
            .receipt-item {
                flex-direction: column;
                gap: 5px;
            }
        }
    </style>
</head>
<body style="margin:0; padding:0; background-color:#f9fafb;">
    <div class="email-container">
      
        <img src="${headerImageUrl}" alt="Zidwell Header" style="width: 100%; max-width: 600px; display: block; margin-bottom: 20px;" />

     
        <div class="content-section">
            <!-- Status Header -->
            <div>
                <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: black; text-align: center;">Receipt for Your Signature</h1>
                <p style="margin: 10px 0 10px 0; opacity: 0.9; color: white; text-align: center;">Action Required: Review and Sign</p>
            </div>
            
            <!-- Receipt Information -->
            <div class="info-card">
                <h2 class="text-lg font-bold text-primary" style="margin: 0 0 10px 0;">
                    📄 Receipt ${receiptId}
                </h2>
                <p class="text-base text-secondary" style="margin: 0 0 15px 0;">
                    Hello <strong>${clientName}</strong>,
                </p>
                <p class="text-base text-secondary" style="margin: 0;">
                    You have received a receipt for your review and signature from <strong>${businessName}</strong>.
                </p>
            </div>
            
            <!-- Receipt Details -->
            <div class="info-card">
                <h3 class="font-semibold text-primary" style="margin: 0 0 15px 0;">Receipt Details</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div>
                        <div class="text-sm text-accent font-semibold" style="margin-bottom: 5px;">FROM</div>
                        <div class="text-base">${businessName}</div>
                    </div>
                    <div>
                        <div class="text-sm text-accent font-semibold" style="margin-bottom: 5px;">TO</div>
                        <div class="text-base">${clientName}</div>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div>
                        <div class="text-sm text-accent font-semibold" style="margin-bottom: 5px;">DATE</div>
                        <div class="text-base">${new Date(issueDate).toLocaleDateString()}</div>
                    </div>
                    <div>
                        <div class="text-sm text-accent font-semibold" style="margin-bottom: 5px;">AMOUNT</div>
                        <div class="text-base">₦${total.toLocaleString()}</div>
                    </div>
                </div>
                <div>
                    <div class="text-sm text-accent font-semibold" style="margin-bottom: 5px;">RECEIPT ID</div>
                    <div class="text-base" style="font-family: 'Courier New', monospace; letter-spacing: 0.5px;">
                        ${result.receipt_id}
                    </div>
                </div>
            </div>
            
            <!-- Items Summary -->
            <div class="info-card">
                <h3 class="font-semibold text-primary" style="margin: 0 0 15px 0;">Items Summary</h3>
                ${receiptItems.map((item: any) => `
                <div class="receipt-item">
                    <div>
                        <div class="text-base">${item.description}</div>
                        <div class="text-sm text-secondary">${item.quantity} × ₦${item.unit_price.toLocaleString()}</div>
                    </div>
                    <div class="font-semibold">₦${item.total.toLocaleString()}</div>
                </div>
                `).join('')}
                <div class="receipt-total">
                    <div>TOTAL AMOUNT</div>
                    <div>₦${total.toLocaleString()}</div>
                </div>
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0; color: white;">
                <a href="${signingLink}" class="action-button">
                    Review & Sign Receipt
                </a>
            </div>
            
            <!-- Important Information -->
            <div class="info-card" style="background: #f0f9ff; border-color: #C29307;">
                <h3 class="font-semibold text-accent" style="margin: 0 0 10px 0;">ℹ️ Important Information</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                    <li style="margin-bottom: 8px;">This receipt requires your digital signature</li>
                    <li style="margin-bottom: 8px;">Please review all items before signing</li>
                    <li style="margin-bottom: 8px;">Your signature acknowledges receipt of items/services</li>
                    <li>Contact the sender if you have any questions</li>
                </ul>
            </div>
            
            <!-- Security Notice -->
            <div style="margin-top: 25px; padding: 15px; background: #f0fff4; border-radius: 8px; border-left: 4px solid #38a169;">
                <p style="margin: 0; color: #2f855a; font-size: 14px; font-weight: 500;">
                    🔒 For your security, never share your verification code with anyone. 
                    Zidwell will never ask for your code via phone or other channels.
                </p>
            </div>
            
            <!-- Automated Message -->
            <div style="background: #fefcf5; padding: 15px; text-align: center; margin-top: 25px; border-radius: 8px;">
                <p style="margin: 0; color: #C29307; font-size: 12px;">
                    This is an automated message from Zidwell Receipts. Please do not reply to this email.
                </p>
            </div>
        </div>

        <!-- ================= CUSTOM FOOTER ================= -->
        <img src="${footerImageUrl}" alt="Zidwell Footer" style="width: 100%; max-width: 600px; display: block; margin-top: 20px;" />

    </div>
</body>
</html>
`,
        };

        await transporter.sendMail(mailOptions);
        console.log("Receipt notification email sent to:", clientEmail);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        // Don't fail the whole request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: isDraft
        ? "Draft saved successfully"
        : "Receipt sent successfully",
      receiptId: result.receipt_id,
      token: result.token,
      signingLink: result.signing_link,
      verificationCode: result.verification_code,
      isDraft,
      isUpdate: !!existingDraft,
    });
  } catch (error: any) {
    console.error("Error processing receipt:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint for drafts/receipts
export async function DELETE(req: NextRequest) {
     const user = await isAuthenticated(req);
        
        if (!user) {
          return NextResponse.json(
            { error: "Please login to access transactions" },
            { status: 401 }
          );
        }
    
  try {
    const { searchParams } = new URL(req.url);
    const receiptId = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!receiptId || !userId) {
      return NextResponse.json(
        { success: false, error: "Receipt ID and User ID are required" },
        { status: 400 }
      );
    }

    // Delete the receipt
    const { error } = await supabase
      .from("receipts")
      .delete()
      .eq("id", receiptId)
      .eq("user_id", userId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Receipt deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting receipt:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint for receipts/drafts
export async function GET(req: NextRequest) {
     const user = await isAuthenticated(req);
        
        if (!user) {
          return NextResponse.json(
            { error: "Please login to access transactions" },
            { status: 401 }
          );
        }
    
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const draftOnly = searchParams.get("draftOnly") === "true";
    const token = searchParams.get("token");
    const receiptId = searchParams.get("receiptId");

    if (!userId && !token && !receiptId) {
      return NextResponse.json(
        { success: false, error: "User ID, Token, or Receipt ID is required" },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase.from("receipts").select("*");

    if (token) {
      query = query.eq("token", token);
    } else if (receiptId) {
      query = query.eq("receipt_id", receiptId);
    } else if (userId) {
      query = query.eq("user_id", userId);
      
      // Filter drafts if requested
      if (draftOnly) {
        query = query.eq("status", "draft");
      }
      
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;

    const receipts =
      data?.map((receipt) => ({
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

    // If token or receiptId is provided, return single receipt
    if (token || receiptId) {
      return NextResponse.json({
        success: true,
        receipt: receipts[0] || null,
      });
    }

    return NextResponse.json({
      success: true,
      receipts: receipts,
      drafts: draftOnly ? receipts : receipts.filter(r => r.status === "draft"),
      signed: receipts.filter(r => r.status === "signed"),
      pending: receipts.filter(r => r.status === "pending"),
      count: receipts.length,
    });
  } catch (error: any) {
    console.error("Error fetching receipts:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}