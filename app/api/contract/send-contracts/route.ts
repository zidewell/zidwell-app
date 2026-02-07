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

    const userId = body.userId;
    const contractTitle =
      body.contract_title || body.contractTitle || "Untitled Contract";

    
    const contractContent =
      body.contract_content || body.contractContent || body.contract_text || "";

    // Store HTML directly
    const contractText = contractContent;

    const receiverEmail =
      body.receiver_email || body.receiverEmail || body.signee_email || "";
    const receiverName =
      body.receiver_name || body.receiverName || body.signee_name || "";
    const receiverPhone =
      body.receiver_phone || body.receiverPhone || body.phone_number || "";
    const isDraft = body.is_draft || body.isDraft || false;
    const includeLawyerSignature =
      body.include_lawyer_signature || body.includeLawyerSignature || false;
    const creatorName = body.creator_name || body.creatorName || "";
    const creatorSignature =
      body.creator_signature || body.creatorSignature || "";
    const ageConsent = body.age_consent || body.ageConsent || false;
    const termsConsent = body.terms_consent || body.termsConsent || false;
    const contractIdFromBody = body.contract_id || body.contractId || "";
    const contractDate =
      body.contract_date ||
      body.contractDate ||
      new Date().toISOString().split("T")[0];

    const paymentTermsContent = body.payment_terms || body.paymentTerms || "";
    const paymentTerms = paymentTermsContent;

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

    const signingLink = !isDraft ? `${baseUrl}/sign-contract/${token}` : null;

    // Prepare metadata
    const metadata: any = {
      lawyer_signature: includeLawyerSignature,
      base_fee: 10,
      lawyer_fee: includeLawyerSignature ? 10000 : 0,
      total_fee: includeLawyerSignature ? 10010 : 10,
      creator_name: creatorName,
      creator_signature: creatorSignature || null,
      creator_signature_exists: creatorSignature ? true : false,
      age_consent: ageConsent,
      terms_consent: termsConsent,
      contract_id: contractIdFromBody,
      contract_date: contractDate,
      payment_terms: paymentTerms,
      contract_html: contractContent,
    };

    if (body.metadata?.attachments) {
      metadata.attachments = body.metadata.attachments;
      metadata.attachment_count = body.metadata.attachment_count || 0;
    }

    if (body.metadata?.base_fee) {
      metadata.base_fee = body.metadata.base_fee;
    }
    if (body.metadata?.lawyer_fee) {
      metadata.lawyer_fee = body.metadata.lawyer_fee;
    }
    if (body.metadata?.total_fee) {
      metadata.total_fee = body.metadata.total_fee;
    }

    let existingDraft = null;
    let result: any;

    if (!isDraft && contractIdFromBody) {
      // First, try to find draft by ID directly
      const { data: draftById } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", contractIdFromBody)
        .eq("user_id", userId)
        .eq("is_draft", true)
        .single();

      if (draftById) {
        existingDraft = draftById;
        console.log("Found draft by ID match:", existingDraft.id);
      }

      // If not found by ID, check metadata
      if (!existingDraft) {
        const { data: draftsWithContractId } = await supabase
          .from("contracts")
          .select("*")
          .eq("user_id", userId)
          .eq("is_draft", true)
          .contains("metadata", { contract_id: contractIdFromBody })
          .single();

        if (draftsWithContractId) {
          existingDraft = draftsWithContractId;
          console.log("Found draft by metadata contract_id:", existingDraft.id);
        }
      }
    }

    // If still no draft found, check by title and email (fallback)
    if (!existingDraft && !isDraft && receiverEmail) {
      console.log("Looking for draft by title and email...");
      const { data: draftData } = await supabase
        .from("contracts")
        .select("*")
        .eq("user_id", userId)
        .eq("signee_email", receiverEmail)
        .eq("contract_title", contractTitle)
        .eq("is_draft", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (draftData && draftData.length > 0) {
        existingDraft = draftData[0];
        console.log("Found draft by title/email:", existingDraft.id);
      }
    }

    const now = new Date().toISOString();

    if (existingDraft && !isDraft) {
      const updateData: any = {
        contract_title: contractTitle,
        contract_text: contractText,
        signee_email: receiverEmail,
        signee_name: receiverName,
        phone_number: receiverPhone,
        status: "pending",
        token: token,
        signing_link: signingLink,
        is_draft: false,
        metadata: metadata,
        age_consent: ageConsent,
        terms_consent: termsConsent,
        include_lawyer_signature: includeLawyerSignature,
        creator_name: creatorName,
        creator_signature: creatorSignature,
        updated_at: now,
        sent_at: now,
      };

      // Update the existing draft with new token
      const { data: updatedContract, error: updateError } = await supabase
        .from("contracts")
        .update(updateData)
        .eq("id", existingDraft.id)
        .select()
        .single();

      if (updateError) {
        console.error("Update draft error:", updateError);
        throw updateError;
      }

      result = updatedContract;
    } else {
      // CREATE NEW CONTRACT (either new contract or new draft)
      console.log("Creating new contract (isDraft:", isDraft, ")");
      console.log("Contract text length:", contractText.length);
      console.log("Payment terms length:", paymentTerms.length);

      const contractData: any = {
        user_id: userId,
        token: token,
        contract_title: contractTitle,
        contract_text: contractText,
        initiator_email: body.initiator_email || body.initiatorEmail || "",
        initiator_name: body.initiator_name || body.initiatorName || "",
        signee_email: receiverEmail,
        signee_name: receiverName,
        phone_number: receiverPhone,
        status: isDraft ? "draft" : "pending",
        signing_link: signingLink,
        is_draft: isDraft,
        metadata: metadata,
        age_consent: ageConsent,
        terms_consent: termsConsent,
        contract_type: body.contract_type || "custom",
        include_lawyer_signature: includeLawyerSignature,
        creator_name: creatorName,
        creator_signature: creatorSignature,
        created_at: now,
        updated_at: now,
      };

      // Only add sent_at for non-drafts
      if (!isDraft) {
        contractData.sent_at = now;
      }

      // Insert contract
      const { data: newContract, error: insertError } = await supabase
        .from("contracts")
        .insert([contractData])
        .select()
        .single();

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw insertError;
      }

      result = newContract;
      console.log("New contract created. ID:", result.id, "is_draft:", isDraft);
    }

    const headerImageUrl = `${baseUrl}/zidwell-header.png`;
    const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

    if (!isDraft && receiverEmail) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_FROM,
          to: receiverEmail,
          subject: `Contract for Signature: ${contractTitle}`,
          html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contract for Signature - Zidwell Finance</title>
    
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
        
        /* Mobile Responsive */
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
<body style="margin:0; padding:0; background-color:#f9fafb;">
    <div class="email-container">
        <!-- ================= CUSTOM HEADER ================= -->
        <img src="${headerImageUrl}" alt="Zidwell Header" style="width: 100%; max-width: 600px; display: block; margin-bottom: 20px;" />

        <!-- ================= CONTENT ================= -->
        <div class="content-section">
            <!-- Status Header -->
            <div>
                <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: black; text-align: center;">Contract for Your Signature</h1>
                <p style="margin: 10px 0 10px 0; opacity: 0.9; color: white; text-align: center;">Action Required: Review and Sign</p>
            </div>
            
            <!-- Contract Information -->
            <div class="info-card">
                <h2 class="text-lg font-bold text-primary" style="margin: 0 0 10px 0;">
                    📄 ${contractTitle}
                </h2>
                <p class="text-base text-secondary" style="margin: 0 0 15px 0;">
                    Hello <strong>${receiverName}</strong>,
                </p>
                <p class="text-base text-secondary" style="margin: 0;">
                    You have received a contract for your review and signature from <strong>${
                      creatorName || "the contract creator"
                    }</strong>.
                </p>
            </div>
            
            <!-- Contract Details -->
            <div class="info-card">
                <h3 class="font-semibold text-primary" style="margin: 0 0 15px 0;">Contract Details</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div>
                        <div class="text-sm text-accent font-semibold" style="margin-bottom: 5px;">SENDER</div>
                        <div class="text-base">${
                          creatorName || "Contract Creator"
                        }</div>
                    </div>
                    <div>
                        <div class="text-sm text-accent font-semibold" style="margin-bottom: 5px;">RECIPIENT</div>
                        <div class="text-base">${receiverName}</div>
                    </div>
                </div>
                <div>
                    <div class="text-sm text-accent font-semibold" style="margin-bottom: 5px;">CONTRACT ID</div>
                    <div class="text-base" style="font-family: 'Courier New', monospace; letter-spacing: 0.5px;">
                        ${result.id}
                    </div>
                </div>
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0; color: white;">
                <a href="${signingLink}" class="action-button">
                    Review & Sign Contract
                </a>
            </div>
            
            <!-- Important Information -->
            <div class="info-card" style="background: #f0f9ff; border-color: #C29307;">
                <h3 class="font-semibold text-accent" style="margin: 0 0 10px 0;">ℹ️ Important Information</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                    <li style="margin-bottom: 8px;">This contract requires your digital signature</li>
                    <li style="margin-bottom: 8px;">Please review all terms before signing</li>
                    <li style="margin-bottom: 8px;">Your signature is legally binding</li>
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
                    This is an automated message from Zidwell Contracts. Please do not reply to this email.
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
        // console.log("Notification email sent to:", receiverEmail);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: isDraft
        ? "Draft saved successfully"
        : "Contract sent successfully",
      contractId: result.id,
      token: result.token,
      signingLink: result.signing_link,
      verificationCode: result.verification_code,
      isDraft,
      isUpdate: !!existingDraft,
    });
  } catch (error: any) {
    console.error("Error processing contract:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint for drafts/contracts
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
    const contractId = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!contractId || !userId) {
      return NextResponse.json(
        { success: false, error: "Contract ID and User ID are required" },
        { status: 400 }
      );
    }

    // Delete the contract
    const { error } = await supabase
      .from("contracts")
      .delete()
      .eq("id", contractId)
      .eq("user_id", userId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Contract deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting contract:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint for contracts/drafts
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

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from("contracts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Filter drafts if requested
    if (draftOnly) {
      query = query.eq("is_draft", true);
    }

    const { data, error } = await query;

    if (error) throw error;

    const contracts =
      data?.map((contract) => ({
        id: contract.id,
        contract_id: contract.metadata?.contract_id || contract.id,
        contract_title: contract.contract_title,
        contract_content: contract.contract_text, // This is now HTML
        contract_text: contract.contract_text, // This is now HTML
        contract_type: contract.contract_type || "custom",
        receiver_name: contract.signee_name || "",
        receiver_email: contract.signee_email || "",
        signee_name: contract.signee_name || "",
        signee_email: contract.signee_email || "",
        receiver_phone: contract.phone_number || "",
        phone_number: contract.phone_number || "",
        age_consent: contract.age_consent || false,
        terms_consent: contract.terms_consent || false,
        status: contract.status || "draft",
        user_id: contract.user_id,
        token: contract.token,
        verification_code: contract.verification_code,
        created_at: contract.created_at,
        updated_at: contract.updated_at,
        is_draft: contract.is_draft || false,
        include_lawyer_signature: contract.include_lawyer_signature || false,
        creator_name: contract.creator_name || "",
        creator_signature: contract.creator_signature || "",
        metadata: contract.metadata || {},
      })) || [];

    return NextResponse.json({
      success: true,
      contracts: contracts,
      drafts: draftOnly ? contracts : [],
      count: contracts.length,
    });
  } catch (error: any) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
